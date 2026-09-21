"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { formatPrice } from "@/lib/format";
import { useOrders } from "@/lib/store";

function Orders() {
  const orders = useOrders();
  const placed = useSearchParams().get("placed");
  const justPlaced = orders.find((o) => o.id === placed);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {justPlaced && (
        <div className="mb-6 rounded-lg border border-success p-4">
          <p className="text-lg font-bold text-success">✓ Order placed, thank you!</p>
          <p className="mt-1 text-sm">
            Confirmation will be sent to your email. Arriving <b>{justPlaced.delivery}</b> to {justPlaced.address.name},{" "}
            {justPlaced.address.city}.
          </p>
          <p className="mt-1 text-sm">Order # {justPlaced.id}</p>
        </div>
      )}
      <h1 className="text-[28px]">Your Orders</h1>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm">
          You have not placed any orders. <Link href="/" className="link">Start shopping</Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-5">
          {orders.map((o) => (
            <li key={o.id} className="overflow-hidden rounded-lg border border-line text-sm">
              <div className="flex flex-wrap gap-x-10 gap-y-2 bg-[#f0f2f2] px-4 py-3 text-xs text-muted">
                <div>ORDER PLACED<br /><span className="text-sm text-black">{new Date(o.placedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></div>
                <div>TOTAL<br /><span className="text-sm text-black">{formatPrice(o.total)}</span></div>
                <div>SHIP TO<br /><span className="text-sm text-link">{o.address.name}</span></div>
                <div>PAYMENT<br /><span className="text-sm text-black">{o.payment}</span></div>
                <div className="ml-auto">ORDER # {o.id}</div>
              </div>
              <div className="p-4">
                <p className="text-lg font-bold">Arriving {o.delivery}</p>
                <ul className="mt-3 space-y-3">
                  {o.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4">
                      <Image src={item.thumbnail} alt={item.title} width={90} height={90} className="h-20 w-20 object-contain" />
                      <div className="min-w-0 flex-1">
                        <Link href={`/dp/${item.id}`} className="link line-clamp-2">{item.title}</Link>
                        <p className="text-xs text-muted">Qty: {item.qty} · {formatPrice(item.price)}</p>
                      </div>
                      <Link href={`/dp/${item.id}`} className="btn-yellow shrink-0">Buy it again</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}
