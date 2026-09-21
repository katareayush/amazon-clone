import Image from "next/image";
import Link from "next/link";
import AddToCart from "./AddToCart";
import Price from "./Price";
import Stars from "./Stars";
import { compact, deliveryDate } from "@/lib/format";
import { listPriceCents } from "@/lib/pricing";
import type { ProductSummary } from "@/server/catalog";

export default function ProductCard({ p }: { p: ProductSummary }) {
  return (
    <div className="flex flex-col overflow-hidden rounded border border-gray-200 bg-white">
      <Link href={`/dp/${p.id}`} className="relative flex h-60 items-center justify-center bg-[#f7f7f7]">
        {p.badge && (
          <span className={`absolute top-0 left-0 z-10 px-2 py-1 text-xs text-white ${p.badge === "Best Seller" ? "bg-[#e47911]" : "bg-nav-2"}`}>
            {p.badge === "Amazon's Choice" ? <>Amazon&apos;s <span className="text-[#f08804]">Choice</span></> : p.badge}
          </span>
        )}
        <Image src={p.thumbnail} alt={p.title} width={220} height={220} className="max-h-56 w-auto object-contain mix-blend-multiply" />
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/dp/${p.id}`} className="line-clamp-3 text-base leading-snug hover:text-link-hover">
          {p.brand && !p.title.startsWith(p.brand) && <span className="font-bold">{p.brand} </span>}
          {p.title}
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <span>{p.rating.toFixed(1)}</span>
          <Stars rating={p.rating} />
          <span className="text-link">({compact(p.ratingCount)})</span>
        </div>
        {p.boughtLastMonth && <div className="text-[13px] text-muted">{compact(p.boughtLastMonth)}+ bought in past month</div>}
        <div className="flex items-baseline gap-2">
          <Price cents={p.priceCents} />
          {p.discountPercentage >= 5 && (
            <span className="text-xs text-muted">
              List: <s>${(listPriceCents(p) / 100).toFixed(2)}</s>
            </span>
          )}
        </div>
        <div className="text-[13px]">
          FREE delivery <b>{deliveryDate((p.id % 3) + 2)}</b>
        </div>
        {p.stock === 0 ? (
          <div className="text-[13px] text-deal">Currently unavailable.</div>
        ) : (
          p.stock < 10 && <div className="text-[13px] text-deal">Only {p.stock} left in stock - order soon.</div>
        )}
        <div className="mt-auto pt-2">{p.stock > 0 && <AddToCart productId={p.id} />}</div>
      </div>
    </div>
  );
}
