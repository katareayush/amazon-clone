"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Price from "./Price";
import { addToCart, RequestError } from "@/lib/client/api";

export default function BuyBox({
  productId,
  priceCents,
  stock,
  delivery,
  fastest,
  returnPolicy,
}: {
  productId: number;
  priceCents: number;
  stock: number;
  delivery: string;
  fastest: string;
  returnPolicy: string;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<{ busy?: boolean; added?: boolean; error?: string }>({});

  async function add(then?: () => void) {
    setStatus({ busy: true });
    try {
      await addToCart(productId, qty);
      setStatus({ added: true });
      then?.();
    } catch (e) {
      setStatus({ error: e instanceof RequestError ? e.message : "Couldn't add to cart. Try again." });
    }
  }

  return (
    <div className="h-fit rounded-lg border border-line p-4 text-sm lg:sticky lg:top-32">
      <Price cents={priceCents} />
      <p className="mt-2">FREE delivery <b>{delivery}</b></p>
      <p className="mt-1">Or fastest delivery <b>{fastest}</b></p>
      <p className="mt-2 flex items-center gap-1 text-xs text-link">📍 Deliver to New York 10001</p>
      <p className={`mt-3 text-lg ${stock >= 10 ? "text-success" : "text-deal"}`}>
        {stock === 0 ? "Currently unavailable." : stock < 10 ? `Only ${stock} left in stock - order soon.` : "In Stock"}
      </p>
      {stock > 0 && (
        <>
          <label className="mt-3 inline-flex items-center gap-1 rounded-lg border border-line bg-[#f0f2f2] px-2 py-1 shadow-sm">
            Quantity:
            <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="bg-transparent outline-none">
              {Array.from({ length: Math.min(stock, 30) }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </label>
          <button disabled={status.busy} className="btn-yellow mt-3 block w-full py-2" onClick={() => add()}>
            Add to Cart
          </button>
          <button disabled={status.busy} className="btn-orange mt-2 block w-full py-2" onClick={() => add(() => router.push("/checkout"))}>
            Buy Now
          </button>
          {status.added && (
            <p className="mt-2 text-success">✓ Added to cart. <Link href="/cart" className="link">Go to Cart</Link></p>
          )}
          {status.error && <p role="alert" className="mt-2 text-deal">{status.error}</p>}
        </>
      )}
      <table className="mt-4 text-xs">
        <tbody>
          {[["Ships from", "Amazon Clone"], ["Sold by", "Amazon Clone"], ["Returns", returnPolicy], ["Payment", "Secure transaction"]].map(([k, v]) => (
            <tr key={k}>
              <td className="pr-3 pb-1 text-muted">{k}</td>
              <td className="pb-1">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
