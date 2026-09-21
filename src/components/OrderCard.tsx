import Image from "next/image";
import Link from "next/link";
import { formatCents, formatDay } from "@/lib/format";
import type { OrderView } from "@/server/orders";

export default function OrderCard({ o, detail = false }: { o: OrderView; detail?: boolean }) {
  const cancelled = o.status === "cancelled";
  return (
    <div className="overflow-hidden rounded-lg border border-line text-sm">
      <div className="flex flex-wrap gap-x-10 gap-y-2 bg-[#f0f2f2] px-4 py-3 text-xs text-muted">
        <div>ORDER PLACED<br /><span className="text-sm text-black">{new Date(o.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></div>
        <div>TOTAL<br /><span className="text-sm text-black">{formatCents(o.totalCents)}</span></div>
        <div>SHIP TO<br /><span className="text-sm text-link">{o.address.name}</span></div>
        <div className="ml-auto text-right">
          ORDER # {o.id}
          <br />
          {!detail && <Link href={`/orders/${o.id}`} className="link text-sm">View order details</Link>}
        </div>
      </div>
      <div className="p-4">
        <p className={`text-lg font-bold ${cancelled ? "text-deal" : ""}`}>
          {cancelled ? "Cancelled" : `Arriving ${formatDay(o.deliveryDate)}`}
        </p>
        <ul className="mt-3 space-y-3">
          {o.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4">
              <Image src={item.thumbnail} alt={item.title} width={90} height={90} className="h-20 w-20 object-contain" />
              <div className="min-w-0 flex-1">
                <Link href={`/dp/${item.productId}`} className="link line-clamp-2">{item.title}</Link>
                <p className="text-xs text-muted">Qty: {item.qty} · {formatCents(item.priceCents)}</p>
              </div>
              <Link href={`/dp/${item.productId}`} className="btn-yellow shrink-0">Buy it again</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
