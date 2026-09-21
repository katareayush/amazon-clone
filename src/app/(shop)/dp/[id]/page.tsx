import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BuyBox from "@/components/BuyBox";
import Gallery from "@/components/Gallery";
import Price from "@/components/Price";
import Stars from "@/components/Stars";
import { categoryLabel } from "@/lib/categories";
import { compact, deliveryDate } from "@/lib/format";
import { listPriceCents } from "@/lib/pricing";
import { allProductIds, getProduct, relatedProducts } from "@/server/catalog";

// Delivery dates and stock change; checkout re-checks stock regardless.
export const revalidate = 60;

export async function generateStaticParams() {
  return (await allProductIds()).map((p) => ({ id: String(p.id) }));
}

async function load(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getProduct(id) : null;
}

export async function generateMetadata(props: PageProps<"/dp/[id]">): Promise<Metadata> {
  const p = await load(props.params);
  return { title: p ? `${p.title} : Amazon Clone` : "Product not found" };
}

// Spread the product's average rating into a plausible 5→1 star histogram.
function histogram(rating: number) {
  const weights = [5, 4, 3, 2, 1].map((s) => Math.exp(-((s - rating) ** 2) / 1.2) + (s === 5 ? 0.3 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => Math.round((w / total) * 100));
}

export default async function ProductPage(props: PageProps<"/dp/[id]">) {
  const p = await load(props.params);
  if (!p) notFound();

  const count = p.ratingCount;
  const b = p.badge;
  const bought = p.boughtLastMonth;
  const related = await relatedProducts(p);
  const overview: [string, string][] = [
    ["Brand", p.brand ?? "Generic"],
    ["Category", categoryLabel(p.category)],
    ["Dimensions", `${p.dimensions.width} x ${p.dimensions.height} x ${p.dimensions.depth} cm`],
    ["Item Weight", `${p.weight} ${p.weight === 1 ? "pound" : "pounds"}`],
    ["Warranty", p.warranty],
  ];

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-3">
      <nav className="mb-3 text-xs text-muted">
        <Link href={`/s?i=${p.category}`} className="hover:text-link-hover hover:underline">{categoryLabel(p.category)}</Link>
        {p.brand && (
          <>
            {" › "}
            <Link href={`/s?i=${p.category}&brand=${encodeURIComponent(p.brand)}`} className="hover:text-link-hover hover:underline">{p.brand}</Link>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_260px]">
        <Gallery images={p.images} title={p.title} />

        <div>
          <h1 className="text-2xl leading-8">{p.title}</h1>
          {p.brand && (
            <Link href={`/s?brand=${encodeURIComponent(p.brand)}`} className="link text-sm">Visit the {p.brand} Store</Link>
          )}
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span>{p.rating.toFixed(1)}</span>
            <Stars rating={p.rating} />
            <a href="#reviews" className="link">{count.toLocaleString("en-US")} ratings</a>
          </div>
          {bought && <div className="text-sm text-muted">{compact(bought)}+ bought in past month</div>}
          {b && <span className="mt-1 inline-block bg-[#e47911] px-2 py-0.5 text-xs text-white">{b}</span>}
          <hr className="my-3 border-gray-200" />
          <div className="flex items-start gap-2">
            {p.discountPercentage >= 5 && <span className="text-[28px] font-light text-deal">-{Math.round(p.discountPercentage)}%</span>}
            <Price cents={p.priceCents} />
          </div>
          {p.discountPercentage >= 5 && (
            <div className="text-xs text-muted">List Price: <s>${(listPriceCents(p) / 100).toFixed(2)}</s></div>
          )}
          <table className="mt-4 text-sm">
            <tbody>
              {overview.map(([k, v]) => (
                <tr key={k}>
                  <td className="py-1 pr-6 align-top font-bold">{k}</td>
                  <td className="py-1">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr className="my-3 border-gray-200" />
          <h2 className="text-base font-bold">About this item</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {p.description.split(/(?<=\.)\s+/).map((s) => <li key={s}>{s}</li>)}
            <li>{p.shipping}. {p.returnPolicy}.</li>
          </ul>
        </div>

        <BuyBox
          productId={p.id}
          priceCents={p.priceCents}
          stock={p.stock}
          delivery={deliveryDate(p.id % 3 + 2)}
          fastest={deliveryDate(1)}
          returnPolicy={p.returnPolicy}
        />
      </div>

      {related.length > 0 && (
        <section className="mt-8 border-t border-gray-200 pt-4">
          <h2 className="mb-3 text-xl font-bold">Products related to this item</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {related.map((r) => (
              <Link key={r.id} href={`/dp/${r.id}`} className="w-40 shrink-0 text-sm">
                <div className="flex h-40 items-center justify-center bg-[#f7f7f7]">
                  <Image src={r.thumbnail} alt={r.title} width={150} height={150} className="max-h-36 w-auto object-contain mix-blend-multiply" />
                </div>
                <div className="mt-1 line-clamp-2 text-link hover:text-link-hover">{r.title}</div>
                <div className="flex items-center gap-1"><Stars rating={r.rating} size={13} /> <span className="text-xs text-link">{compact(r.ratingCount)}</span></div>
                <div className="text-deal">${(r.priceCents / 100).toFixed(2)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="reviews" className="mt-8 grid grid-cols-1 gap-8 border-t border-gray-200 pt-4 md:grid-cols-[300px_1fr]">
        <div>
          <h2 className="text-2xl font-bold">Customer reviews</h2>
          <div className="mt-1 flex items-center gap-2">
            <Stars rating={p.rating} size={20} />
            <span className="text-lg">{p.rating.toFixed(1)} out of 5</span>
          </div>
          <p className="mt-1 text-sm text-muted">{count.toLocaleString("en-US")} global ratings</p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {histogram(p.rating).map((pct, i) => (
                <tr key={i}>
                  <td className="w-14 py-1.5 text-link">{5 - i} star</td>
                  <td className="py-1.5">
                    <div className="h-5 overflow-hidden rounded border border-gray-300 bg-[#f0f2f2]">
                      <div className="h-full bg-[#de7921]" style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                  <td className="w-12 py-1.5 text-right text-link">{pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-bold">Top reviews from the United States</h3>
          {p.reviews.map((r) => (
            <div key={r.reviewerName + r.date} className="mb-5">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500">👤</span>
                {r.reviewerName}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Stars rating={r.rating} />
                <span className="text-sm font-bold">{r.comment}</span>
              </div>
              <div className="text-[13px] text-muted">
                Reviewed in the United States on {new Date(r.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
              <div className="text-xs font-bold text-[#c45500]">Verified Purchase</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
