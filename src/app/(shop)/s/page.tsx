import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";
import Stars from "@/components/Stars";
import { CATEGORY_LABELS, search, type SearchParams } from "@/lib/products";

export async function generateMetadata(props: PageProps<"/s">): Promise<Metadata> {
  const { k } = (await props.searchParams) as SearchParams;
  return { title: k ? `Amazon Clone : ${k}` : "Amazon Clone: All products" };
}

const PRICE_BANDS: [string, number | null, number | null][] = [
  ["Up to $25", null, 25],
  ["$25 to $50", 25, 50],
  ["$50 to $100", 50, 100],
  ["$100 to $500", 100, 500],
  ["$500 & above", 500, null],
];

function href(params: SearchParams, patch: Partial<Record<keyof SearchParams, string | null>>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) sp.set(key, String(value));
  }
  return `/s?${sp}`;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-1.5 font-bold">{title}</h3>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

export default async function SearchPage(props: PageProps<"/s">) {
  const raw = (await props.searchParams) as Record<string, string | string[] | undefined>;
  const params = Object.fromEntries(
    Object.entries(raw).map(([key, v]) => [key, Array.isArray(v) ? v[0] : v]),
  ) as SearchParams;
  const { base, results } = search(params);
  const brands = [...new Set(base.map((p) => p.brand).filter(Boolean) as string[])].sort().slice(0, 15);
  const depts = [...new Set(base.map((p) => p.category))];
  const selectedBrands = params.brand?.split("|") ?? [];
  const label = params.k ? `"${params.k}"` : params.i ? CATEGORY_LABELS[params.i] : params.deals ? "Today's Deals" : "all products";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-2 shadow-sm">
        <p className="text-sm">
          {results.length ? `1-${results.length} of ${results.length} results for ` : "No results for "}
          <span className="font-bold text-[#c45500]">{label}</span>
        </p>
        <SortSelect value={params.sort ?? "featured"} />
      </div>

      <div className="flex gap-6 px-4 py-4">
        <aside className="hidden w-60 shrink-0 text-sm md:block">
          <Group title="Department">
            {params.i && (
              <li><Link href={href(params, { i: null, brand: null })} className="hover:text-link-hover">‹ Any Department</Link></li>
            )}
            {(params.i ? [params.i] : depts).map((d) => (
              <li key={d}>
                <Link href={href(params, { i: d, brand: null })} className={`hover:text-link-hover ${params.i === d ? "font-bold" : ""}`}>
                  {CATEGORY_LABELS[d]}
                </Link>
              </li>
            ))}
          </Group>

          <Group title="Customer Reviews">
            {[4, 3, 2, 1].map((r) => (
              <li key={r}>
                <Link href={href(params, { rating: params.rating === String(r) ? null : String(r) })} className="flex items-center gap-1 hover:text-link-hover">
                  <Stars rating={r} size={17} />
                  <span className={params.rating === String(r) ? "font-bold" : ""}>&amp; Up</span>
                </Link>
              </li>
            ))}
          </Group>

          {brands.length > 0 && (
            <Group title="Brands">
              {brands.map((b) => {
                const on = selectedBrands.includes(b);
                const next = on ? selectedBrands.filter((x) => x !== b) : [...selectedBrands, b];
                return (
                  <li key={b}>
                    <Link href={href(params, { brand: next.join("|") || null })} className="flex items-center gap-2 hover:text-link-hover">
                      <span className={`inline-block h-3.5 w-3.5 rounded-sm border ${on ? "border-[#007185] bg-[#007185] text-[10px] leading-3 text-white" : "border-gray-500"}`}>{on ? "✓" : ""}</span>
                      {b}
                    </Link>
                  </li>
                );
              })}
            </Group>
          )}

          <Group title="Price">
            {(params.min || params.max) && (
              <li><Link href={href(params, { min: null, max: null })} className="hover:text-link-hover">‹ Any Price</Link></li>
            )}
            {PRICE_BANDS.map(([text, min, max]) => {
              const on = params.min === (min?.toString() ?? undefined) && params.max === (max?.toString() ?? undefined);
              return (
                <li key={text}>
                  <Link href={href(params, { min: min?.toString() ?? null, max: max?.toString() ?? null })} className={`hover:text-link-hover ${on ? "font-bold" : ""}`}>
                    {text}
                  </Link>
                </li>
              );
            })}
          </Group>

          <Group title="Deals & Discounts">
            <li>
              <Link href={href(params, { deals: params.deals ? null : "1" })} className={`hover:text-link-hover ${params.deals ? "font-bold" : ""}`}>
                All Discounts
              </Link>
            </li>
          </Group>
        </aside>

        <section className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">Results</h2>
          <p className="mb-3 text-sm text-muted">Check each product page for other buying options.</p>
          {results.length === 0 ? (
            <div className="py-10">
              <p className="text-lg">No results for {label}.</p>
              <p className="mt-2 text-sm">Try checking your spelling or use more general terms. <Link href="/s" className="link">Browse all products</Link></p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {results.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
