import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CancelOrder from "@/components/CancelOrder";
import OrderCard from "@/components/OrderCard";
import { formatCents, formatDay } from "@/lib/format";
import { DELIVERY_SPEEDS, type DeliverySpeed } from "@/lib/pricing";
import { getUser } from "@/server/auth";
import { getOrder } from "@/server/orders";

export const metadata: Metadata = { title: "Order Details" };

export default async function OrderPage(props: PageProps<"/orders/[id]">) {
  const { id } = await props.params;
  const user = await getUser();
  if (!user) redirect(`/signin?next=/orders/${id}`);
  const o = await getOrder(user.id, id);
  if (!o) notFound();
  const placed = (await props.searchParams).placed === "1";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {placed && (
        <div className="mb-6 rounded-lg border border-success p-4">
          <p className="text-lg font-bold text-success">✓ Order placed, thank you!</p>
          <p className="mt-1 text-sm">
            Arriving <b>{formatDay(o.deliveryDate)}</b> to {o.address.name}, {o.address.city}.
          </p>
        </div>
      )}
      <nav className="mb-2 text-xs"><Link href="/orders" className="link">Your Orders</Link> › Order Details</nav>
      <h1 className="text-[28px]">Order Details</h1>
      <div className="mt-4 grid grid-cols-1 gap-6 rounded-lg border border-line p-4 text-sm sm:grid-cols-3">
        <div>
          <h2 className="font-bold">Shipping Address</h2>
          <p>{o.address.name}<br />{o.address.line1}<br />{o.address.city}, {o.address.state} {o.address.zip}</p>
        </div>
        <div>
          <h2 className="font-bold">Payment Method</h2>
          <p>{o.payment}</p>
          <h2 className="mt-2 font-bold">Delivery</h2>
          <p>{DELIVERY_SPEEDS[o.deliverySpeed as DeliverySpeed]?.label ?? o.deliverySpeed}</p>
        </div>
        <dl className="space-y-1">
          <h2 className="font-bold">Order Summary</h2>
          {([["Item(s) Subtotal:", o.subtotalCents], ["Shipping & Handling:", o.shippingCents], ["Estimated tax:", o.taxCents]] as const).map(([k, v]) => (
            <div key={k} className="flex justify-between"><dt>{k}</dt><dd>{formatCents(v)}</dd></div>
          ))}
          <div className="flex justify-between font-bold"><dt>Grand Total:</dt><dd>{formatCents(o.totalCents)}</dd></div>
        </dl>
      </div>
      <div className="mt-4">
        <OrderCard o={o} detail />
      </div>
      {o.status === "placed" && <CancelOrder id={o.id} />}
    </div>
  );
}
