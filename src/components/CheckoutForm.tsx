"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { api, refreshSession, RequestError, setCartQty, useCart } from "@/lib/client/api";
import { deliveryDate, formatCents } from "@/lib/format";
import { DELIVERY_SPEEDS, orderTotals, type DeliverySpeed } from "@/lib/pricing";
import type { Address } from "@/server/db/schema";

const SPEEDS = Object.entries(DELIVERY_SPEEDS) as [DeliverySpeed, (typeof DELIVERY_SPEEDS)[DeliverySpeed]][];
const EMPTY_ADDRESS: Address = { name: "", line1: "", city: "", state: "", zip: "", phone: "" };

function Step({ n, title, done, children, summary, onEdit }: {
  n: number; title: string; done: boolean; children: React.ReactNode; summary?: React.ReactNode; onEdit?: () => void;
}) {
  return (
    <section className="border-b border-gray-200 py-4">
      <div className="flex items-start gap-4">
        <h2 className={`w-64 shrink-0 text-lg font-bold ${done ? "" : "text-[#c45500]"}`}>
          {n}&nbsp;&nbsp;{title}
        </h2>
        {done && (
          <>
            <div className="flex-1 text-sm">{summary}</div>
            {onEdit && <button onClick={onEdit} className="link text-sm">Change</button>}
          </>
        )}
      </div>
      {!done && <div className="mt-3 sm:ml-8">{children}</div>}
    </section>
  );
}

export default function CheckoutForm({ userName }: { userName: string }) {
  const router = useRouter();
  const { cart, isLoading } = useCart();
  const { items, count } = cart;
  const [address, setAddress] = useState<Address>({ ...EMPTY_ADDRESS, name: userName });
  const [addressDone, setAddressDone] = useState(false);
  const [payment, setPayment] = useState<"card" | "cod">("card");
  const [card, setCard] = useState({ number: "4242 4242 4242 4242", name: userName, exp: "12/30" });
  const [paymentDone, setPaymentDone] = useState(false);
  const [speed, setSpeed] = useState<DeliverySpeed>("two-day");
  const [errors, setErrors] = useState<string[]>([]);
  const [placing, setPlacing] = useState(false);

  const totals = orderTotals(items, speed);
  const cardLast4 = card.number.replace(/\D/g, "").slice(-4);

  function submitAddress(e: React.FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (address.name.trim().length < 2) errs.push("Enter a full name.");
    if (address.line1.trim().length < 3) errs.push("Enter a street address.");
    if (!address.city.trim()) errs.push("Enter a city.");
    if (!/^[A-Za-z]{2}$/.test(address.state.trim())) errs.push("Enter a 2-letter state code.");
    if (!/^\d{5}$/.test(address.zip.trim())) errs.push("Enter a 5-digit ZIP code.");
    if (address.phone.replace(/\D/g, "").length < 10) errs.push("Enter a 10-digit phone number.");
    setErrors(errs);
    if (!errs.length) setAddressDone(true);
  }

  function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (payment === "card") {
      if (card.number.replace(/\D/g, "").length !== 16) errs.push("Enter a 16-digit card number.");
      if (!card.name.trim()) errs.push("Enter the name on the card.");
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.exp)) errs.push("Enter expiry as MM/YY.");
    }
    setErrors(errs);
    if (!errs.length) setPaymentDone(true);
  }

  async function placeOrder() {
    setPlacing(true);
    setErrors([]);
    try {
      const { id } = await api<{ id: string }>("/api/orders", {
        method: "POST",
        body: { address, payment: payment === "card" ? { method: "card", ...card } : { method: "cod" }, speed },
      });
      await refreshSession();
      router.push(`/orders/${id}?placed=1`);
    } catch (e) {
      // The server re-validates everything; surface its field messages if any slipped through.
      const err = e instanceof RequestError ? e : null;
      setErrors(err?.fields ? Object.values(err.fields) : [err?.message ?? "Couldn't place your order. Try again."]);
      setPlacing(false);
    }
  }

  async function setQty(id: number, qty: number) {
    try {
      await setCartQty(id, qty);
    } catch (e) {
      setErrors([e instanceof RequestError ? e.message : "Couldn't update quantity."]);
    }
  }

  if (isLoading) return <div className="min-h-screen" />;

  if (!items.length && !placing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2"><Link href="/" className="link">Continue shopping</Link></p>
      </div>
    );
  }

  const field = (key: keyof Address, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-sm font-bold">
      {label}
      <input
        className="input mt-1 font-normal"
        value={address[key]}
        onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
        {...props}
      />
    </label>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-b from-white to-[#f3f3f3] px-4 py-3">
        <Link href="/"><Logo dark /></Link>
        <h1 className="text-2xl sm:text-[28px]">Checkout (<Link href="/cart" className="link">{count} items</Link>)</h1>
        <span className="text-xl text-gray-400" aria-hidden>🔒</span>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 lg:flex-row lg:items-start">
        <div className="flex-1">
          {errors.length > 0 && (
            <div role="alert" className="mt-4 rounded-lg border border-deal p-3 text-sm">
              <p className="font-bold text-deal">There was a problem</p>
              <ul className="list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          )}

          <Step
            n={1}
            title="Delivery address"
            done={addressDone}
            onEdit={() => setAddressDone(false)}
            summary={<>{address.name}<br />{address.line1}<br />{address.city}, {address.state.toUpperCase()} {address.zip}</>}
          >
            <form onSubmit={submitAddress} className="max-w-md space-y-3 rounded-lg border border-line p-4">
              <p className="text-lg font-bold">Add a new address</p>
              {field("name", "Full name (First and Last name)", { autoComplete: "name" })}
              {field("phone", "Phone number", { autoComplete: "tel", inputMode: "tel" })}
              {field("line1", "Address", { autoComplete: "street-address", placeholder: "Street address or P.O. Box" })}
              <div className="grid grid-cols-3 gap-2">
                {field("city", "City", { autoComplete: "address-level2" })}
                {field("state", "State", { autoComplete: "address-level1", maxLength: 2, placeholder: "NY" })}
                {field("zip", "ZIP Code", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 5 })}
              </div>
              <button className="btn-yellow">Use this address</button>
            </form>
          </Step>

          <Step
            n={2}
            title="Payment method"
            done={addressDone && paymentDone}
            onEdit={() => setPaymentDone(false)}
            summary={payment === "card" ? `💳 Card ending in ${cardLast4}` : "Pay on Delivery (Cash/Card)"}
          >
            {!addressDone ? (
              <p className="text-sm text-muted">Add a delivery address first.</p>
            ) : (
              <form onSubmit={submitPayment} className="max-w-md space-y-3 rounded-lg border border-line p-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={payment === "card"} onChange={() => setPayment("card")} />
                  <b>Credit or debit card</b>
                </label>
                {payment === "card" && (
                  <div className="space-y-2 pl-6">
                    <p className="rounded bg-[#fef8f2] p-2 text-xs">Demo checkout: no payment is taken. Use the test card, never a real one.</p>
                    <label className="block">Card number
                      <input className="input mt-1" inputMode="numeric" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">Name on card
                        <input className="input mt-1" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                      </label>
                      <label className="block">Expiry (MM/YY)
                        <input className="input mt-1" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} />
                      </label>
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <input type="radio" checked={payment === "cod"} onChange={() => setPayment("cod")} />
                  <b>Pay on Delivery</b> <span className="text-muted">(Cash/Card)</span>
                </label>
                <button className="btn-yellow">Use this payment method</button>
              </form>
            )}
          </Step>

          <Step n={3} title="Review items and delivery" done={false}>
            <div className="rounded-lg border border-line p-4">
              <p className="text-lg font-bold text-success">Arriving {deliveryDate(DELIVERY_SPEEDS[speed].days)}</p>
              <div className="mt-3 flex flex-col gap-4 md:flex-row">
                <ul className="flex-1 space-y-4">
                  {items.map((item) => (
                    <li key={item.productId} className="flex gap-3 text-sm">
                      <Image src={item.thumbnail} alt={item.title} width={80} height={80} className="h-20 w-20 object-contain" />
                      <div>
                        <p className="line-clamp-2 font-bold">{item.title}</p>
                        <p className="font-bold text-deal">{formatCents(item.priceCents)}</p>
                        <label className="mt-1 inline-flex items-center gap-1 rounded-lg border border-line bg-[#f0f2f2] px-2 text-xs shadow-sm">
                          Qty:
                          <select value={item.qty} onChange={(e) => setQty(item.productId, Number(e.target.value))} className="bg-transparent">
                            {Array.from({ length: Math.min(item.stock, 30) + 1 }, (_, i) => (
                              <option key={i} value={i}>{i === 0 ? "0 (Delete)" : i}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
                <fieldset className="text-sm md:w-64">
                  <legend className="font-bold">Choose your delivery option:</legend>
                  {SPEEDS.map(([id, s]) => (
                    <label key={id} className="mt-2 flex items-start gap-2">
                      <input type="radio" name="speed" className="mt-1" checked={speed === id} onChange={() => setSpeed(id)} />
                      <span>
                        <b className="text-success">{deliveryDate(s.days)}</b>
                        <br />
                        <span className="text-muted">{s.cents ? `${formatCents(s.cents)} - ${s.label}` : s.label}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>
            </div>
          </Step>
        </div>

        <aside className="mt-4 rounded-lg border border-line p-4 text-sm lg:sticky lg:top-4 lg:w-72">
          <button
            onClick={placeOrder}
            disabled={!addressDone || !paymentDone || placing}
            className="btn-yellow w-full py-2"
          >
            Place your order
          </button>
          {(!addressDone || !paymentDone) && (
            <p className="mt-2 text-center text-xs text-muted">Add an address and payment method to continue.</p>
          )}
          <h3 className="mt-4 text-lg font-bold">Order Summary</h3>
          <dl className="mt-2 space-y-1">
            {([["Items:", totals.subtotalCents], ["Shipping & handling:", totals.shippingCents], ["Estimated tax:", totals.taxCents]] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt>{k}</dt><dd>{formatCents(v)}</dd></div>
            ))}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-deal">
              <dt>Order total:</dt><dd>{formatCents(totals.totalCents)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
