import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, lte, ne, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "./db";

const p = schema.products;
export const PAGE_SIZE = 24;

export const searchSchema = z.object({
  k: z.string().trim().max(100).optional(),
  i: z.string().max(40).optional(),
  brand: z.string().max(400).optional(), // "|"-separated
  rating: z.coerce.number().int().min(1).max(4).optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  deals: z.literal("1").optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "review", "newest"]).optional(),
  page: z.coerce.number().int().min(1).max(100).optional(),
});
export type SearchInput = z.infer<typeof searchSchema>;

/** Parses untrusted query params, dropping invalid ones rather than failing the page. */
export function parseSearch(raw: Record<string, string | string[] | undefined>): SearchInput {
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(searchSchema.shape)) {
    const r = field.safeParse(flat[key] === "" ? undefined : flat[key]);
    if (r.success && r.data !== undefined) out[key] = r.data;
  }
  return out as SearchInput;
}

const summaryColumns = {
  id: p.id,
  title: p.title,
  brand: p.brand,
  category: p.category,
  priceCents: p.priceCents,
  discountPercentage: p.discountPercentage,
  rating: p.rating,
  ratingCount: p.ratingCount,
  boughtLastMonth: p.boughtLastMonth,
  badge: p.badge,
  stock: p.stock,
  thumbnail: p.thumbnail,
};

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function queryWords(k?: string) {
  return (k ?? "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
}

/** Query + department conditions: the base set that facets are computed from. */
function baseConditions(input: SearchInput) {
  const conds: SQL[] = queryWords(input.k).map((w) => {
    // Naive plural folding: "phones" also matches "phone".
    const stem = w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w;
    return ilike(p.searchText, `%${escapeLike(stem)}%`);
  });
  if (input.i) conds.push(eq(p.category, input.i));
  return conds;
}

export async function searchProducts(input: SearchInput) {
  const base = baseConditions(input);
  const conds = [...base];
  const brands = input.brand?.split("|").filter(Boolean) ?? [];
  if (brands.length) conds.push(inArray(p.brand, brands));
  if (input.rating) conds.push(gte(p.rating, input.rating));
  if (input.min !== undefined) conds.push(gte(p.priceCents, Math.round(input.min * 100)));
  if (input.max !== undefined) conds.push(lte(p.priceCents, Math.round(input.max * 100)));
  if (input.deals) conds.push(gte(p.discountPercentage, 10));

  const words = queryWords(input.k);
  // Title matches rank above description/tag matches.
  const relevance = words.map((w) => desc(sql`(${p.title} ilike ${`%${escapeLike(w)}%`})`));
  const order = {
    featured: [...relevance, desc(p.ratingCount)],
    "price-asc": [asc(p.priceCents)],
    "price-desc": [desc(p.priceCents)],
    review: [desc(p.rating), desc(p.ratingCount)],
    newest: [desc(p.id)],
  }[input.sort ?? "featured"];

  const page = input.page ?? 1;
  const where = and(...conds);
  const [items, [{ total }], brandFacet, deptFacet] = await Promise.all([
    db.select(summaryColumns).from(p).where(where).orderBy(...order, asc(p.id)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(p).where(where),
    db.selectDistinct({ brand: p.brand }).from(p).where(and(...base, isNotNull(p.brand))).orderBy(asc(p.brand)).limit(20),
    db.selectDistinct({ category: p.category }).from(p).where(and(...base)).orderBy(asc(p.category)),
  ]);

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    facets: { brands: brandFacet.map((b) => b.brand!), categories: deptFacet.map((d) => d.category) },
  };
}

export async function suggest(q: string) {
  const words = queryWords(q);
  if (!words.length) return [];
  const rows = await db
    .select({ id: p.id, title: p.title })
    .from(p)
    .where(and(...words.map((w) => ilike(p.title, `%${escapeLike(w)}%`))))
    .orderBy(desc(p.ratingCount))
    .limit(8);
  return rows;
}

export async function getProduct(id: number) {
  const [row] = await db.select().from(p).where(eq(p.id, id)).limit(1);
  return row ?? null;
}
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

export async function relatedProducts(product: { id: number; category: string }, limit = 12) {
  return db
    .select(summaryColumns)
    .from(p)
    .where(and(eq(p.category, product.category), ne(p.id, product.id)))
    .orderBy(desc(p.ratingCount))
    .limit(limit);
}

export async function topProducts(opts: { category?: string; by: "popular" | "deals"; limit: number }) {
  return db
    .select(summaryColumns)
    .from(p)
    .where(opts.category ? eq(p.category, opts.category) : undefined)
    .orderBy(opts.by === "deals" ? desc(p.discountPercentage) : desc(p.ratingCount))
    .limit(opts.limit);
}

export type ProductSummary = Awaited<ReturnType<typeof topProducts>>[number];

export async function allProductIds() {
  return db.select({ id: p.id }).from(p);
}
