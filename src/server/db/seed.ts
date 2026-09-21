import { sql } from "drizzle-orm";
import raw from "../../data/products.json";
import { db, schema } from "./index";

type Source = (typeof raw)[number];

// DummyJSON ships 3 reviews per product; derive stable counts from the id so the
// catalog has Amazon-like density. Same id always gives the same numbers.
function seeded(id: number, salt: number) {
  const x = Math.sin(id * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
}
const ratingCount = (id: number) => Math.floor(40 + seeded(id, 1) ** 2 * 80000);
function boughtLastMonth(id: number) {
  const n = seeded(id, 2);
  const steps = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
  return n < 0.35 ? null : steps[Math.floor(n * steps.length) % steps.length];
}

function badges(items: Source[]) {
  const best = new Map<string, Source>();
  for (const p of items) {
    const cur = best.get(p.category);
    if (!cur || ratingCount(p.id) > ratingCount(cur.id)) best.set(p.category, p);
  }
  return (p: Source) =>
    best.get(p.category)?.id === p.id
      ? ("Best Seller" as const)
      : p.rating >= 4.5 && ratingCount(p.id) > 5000
        ? ("Amazon's Choice" as const)
        : null;
}

async function main() {
  const badge = badges(raw);
  const rows = raw.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    brand: p.brand ?? null,
    priceCents: Math.round(p.price * 100),
    discountPercentage: p.discountPercentage,
    rating: p.rating,
    ratingCount: ratingCount(p.id),
    boughtLastMonth: boughtLastMonth(p.id),
    badge: badge(p),
    stock: p.stock,
    thumbnail: p.thumbnail,
    images: p.images,
    reviews: p.reviews,
    tags: p.tags,
    warranty: p.warrantyInformation,
    shipping: p.shippingInformation,
    returnPolicy: p.returnPolicy,
    dimensions: p.dimensions,
    weight: p.weight,
    searchText: [p.title, p.brand, p.category.replace(/-/g, " "), ...p.tags, p.description].join(" ").toLowerCase(),
  }));

  // Refresh catalog fields but never reset live stock on re-seed.
  await db
    .insert(schema.products)
    .values(rows)
    .onConflictDoUpdate({
      target: schema.products.id,
      set: Object.fromEntries(
        Object.keys(rows[0])
          .filter((k) => k !== "id" && k !== "stock")
          .map((k) => [k, sql.raw(`excluded.${toSnake(k)}`)]),
      ),
    });
  console.log(`Seeded ${rows.length} products`);
  process.exit(0);
}

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
