import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import { CATEGORY_LABELS } from "@/lib/categories";
import { topProducts, type ProductSummary } from "@/server/catalog";

// Delivery dates are relative to today.
export const revalidate = 3600;

const GRID_CARDS: { title: string; cats: string[]; more: string }[] = [
  { title: "Upgrade your tech", cats: ["smartphones", "laptops", "tablets", "mobile-accessories"], more: "/s?i=smartphones" },
  { title: "Refresh your space", cats: ["furniture", "home-decoration", "kitchen-accessories", "groceries"], more: "/s?i=home-decoration" },
  { title: "Beauty picks", cats: ["beauty", "skin-care", "fragrances", "womens-jewellery"], more: "/s?i=beauty" },
  { title: "Shop fashion for less", cats: ["mens-shirts", "womens-dresses", "womens-shoes", "sunglasses"], more: "/s?i=womens-dresses" },
];

function Card({ children, title, more, moreHref }: { children: React.ReactNode; title: string; more: string; moreHref: string }) {
  return (
    <div className="flex flex-col bg-white p-5">
      <h2 className="mb-3 text-[21px] leading-tight font-bold">{title}</h2>
      <div className="flex-1">{children}</div>
      <Link href={moreHref} className="link mt-3 text-[13px]">{more}</Link>
    </div>
  );
}

function Row({ title, items, href }: { title: string; items: ProductSummary[]; href: string }) {
  return (
    <section className="bg-white p-5">
      <div className="mb-3 flex items-baseline gap-4">
        <h2 className="text-[21px] font-bold">{title}</h2>
        <Link href={href} className="link text-[13px]">See more</Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((p) => (
          <Link key={p.id} href={`/dp/${p.id}`} className="flex h-52 w-44 shrink-0 items-center justify-center bg-[#f7f7f7]">
            <Image src={p.thumbnail} alt={p.title} width={180} height={180} className="max-h-48 w-auto object-contain mix-blend-multiply" />
          </Link>
        ))}
      </div>
    </section>
  );
}

const PICK_CATS = ["laptops", "mens-watches", "sports-accessories", "kitchen-accessories"];

export default async function Home() {
  const cats = [...new Set([...GRID_CARDS.flatMap((c) => c.cats), ...PICK_CATS])];
  const [deals, popular, beauty, ...tops] = await Promise.all([
    topProducts({ by: "deals", limit: 16 }),
    topProducts({ by: "popular", limit: 16 }),
    topProducts({ by: "popular", category: "beauty", limit: 16 }),
    ...cats.map((category) => topProducts({ by: "popular", category, limit: 1 })),
  ]);
  const topByCat = new Map(cats.map((c, i) => [c, tops[i][0]]));
  const top = (cat: string) => topByCat.get(cat)!;

  return (
    <div className="bg-page">
      <div className="mx-auto max-w-[1500px]">
        <Hero />
        <div className="relative z-10 -mt-24 grid grid-cols-1 gap-5 px-5 sm:-mt-40 sm:grid-cols-2 lg:-mt-64 xl:grid-cols-4">
          {GRID_CARDS.map((card) => (
            <Card key={card.title} title={card.title} more="See more" moreHref={card.more}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {card.cats.map((cat) => (
                  <Link key={cat} href={`/s?i=${cat}`} className="group">
                    <div className="flex h-28 items-center justify-center bg-[#f7f7f7]">
                      <Image src={top(cat).thumbnail} alt={CATEGORY_LABELS[cat]} width={120} height={120} className="max-h-26 w-auto object-contain mix-blend-multiply" />
                    </div>
                    <div className="mt-1 text-xs group-hover:text-link-hover">{CATEGORY_LABELS[cat]}</div>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-5 space-y-5 px-5">
          <Row title="Today's Deals" items={deals} href="/s?deals=1" />
          <Row title="Best Sellers across the store" items={popular} href="/s?sort=review" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {PICK_CATS.map((cat) => (
              <Card key={cat} title={`Top picks in ${CATEGORY_LABELS[cat]}`} more="Shop now" moreHref={`/s?i=${cat}`}>
                <Link href={`/dp/${top(cat).id}`} className="flex h-72 items-center justify-center bg-[#f7f7f7]">
                  <Image src={top(cat).thumbnail} alt={top(cat).title} width={280} height={280} className="max-h-64 w-auto object-contain mix-blend-multiply" />
                </Link>
              </Card>
            ))}
          </div>
          <Row title="Picked for you in Beauty" items={beauty} href="/s?i=beauty" />
        </div>
      </div>
    </div>
  );
}
