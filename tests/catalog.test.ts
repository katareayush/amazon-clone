import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, schema } from "@/server/db";
import { parseSearch, searchProducts, suggest } from "@/server/catalog";

const base = {
  description: "", brand: null, discountPercentage: 0, ratingCount: 10, boughtLastMonth: null, badge: null, stock: 5,
  thumbnail: "t", images: [], reviews: [], tags: [], warranty: "w", shipping: "s", returnPolicy: "r",
  dimensions: { width: 1, height: 1, depth: 1 }, weight: 1,
};
const rows = [
  { ...base, id: 1, title: "Galaxy Phone", category: "smartphones", brand: "Samsung", priceCents: 50000, rating: 4.5, ratingCount: 900 },
  { ...base, id: 2, title: "Pixel Phone", category: "smartphones", brand: "Google", priceCents: 30000, rating: 3.2, discountPercentage: 15 },
  { ...base, id: 3, title: "Phone Case", category: "mobile-accessories", brand: "Samsung", priceCents: 1500, rating: 4.8 },
  { ...base, id: 4, title: "Desk Lamp", category: "home-decoration", priceCents: 2500, rating: 4.0, description: "works with any phone" },
].map((r) => ({ ...r, searchText: `${r.title} ${r.brand ?? ""} ${r.category} ${r.description}`.toLowerCase() }));

beforeAll(async () => {
  await db.delete(schema.orders);
  await db.delete(schema.carts);
  await db.delete(schema.products);
  await db.insert(schema.products).values(rows);
});
afterAll(async () => {
  await (db.$client as { end: () => Promise<void> }).end();
});

const ids = async (q: Record<string, string>) => (await searchProducts(parseSearch(q))).items.map((p) => p.id);

describe("searchProducts", () => {
  it("browses a department with the default sort (no query words)", async () => {
    expect(await ids({ i: "smartphones" })).toEqual([1, 2]);
  });

  it("ranks title matches above description matches and folds plurals", async () => {
    expect(await ids({ k: "phones" })).toEqual([1, 2, 3, 4]);
    expect((await ids({ k: "phone" })).at(-1)).toBe(4);
  });

  it("applies brand, rating, price and deal filters together", async () => {
    expect(await ids({ k: "phone", brand: "Samsung" })).toEqual([1, 3]);
    expect(await ids({ k: "phone", rating: "4", max: "100" })).toEqual([3, 4]);
    expect(await ids({ deals: "1" })).toEqual([2]);
  });

  it("sorts by price and computes facets from the unfiltered base set", async () => {
    const r = await searchProducts(parseSearch({ k: "phone", sort: "price-asc", brand: "Google" }));
    expect(r.items.map((p) => p.id)).toEqual([2]);
    expect(r.facets.brands).toEqual(["Google", "Samsung"]);
  });

  it("drops invalid params instead of failing, and escapes LIKE wildcards", async () => {
    expect(parseSearch({ rating: "9", sort: "bogus", page: "-1", k: "ok" })).toEqual({ k: "ok" });
    expect(await ids({ k: "%" })).toEqual([]);
  });
});

it("suggests titles for a prefix", async () => {
  expect((await suggest("pho")).map((s) => s.title)).toContain("Galaxy Phone");
});
