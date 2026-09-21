import raw from "@/data/products.json";

export { deliveryDate, formatPrice } from "./format";

export type Review = {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
};

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string | null;
  images: string[];
  thumbnail: string;
  reviews: Review[];
  warrantyInformation: string;
  shippingInformation: string;
  returnPolicy: string;
  tags: string[];
  dimensions: { width: number; height: number; depth: number };
  weight: number;
};

export const products = raw as Product[];

export const CATEGORY_LABELS: Record<string, string> = {
  beauty: "Beauty",
  fragrances: "Fragrances",
  furniture: "Furniture",
  groceries: "Grocery",
  "home-decoration": "Home Decor",
  "kitchen-accessories": "Kitchen",
  laptops: "Laptops",
  "mens-shirts": "Men's Shirts",
  "mens-shoes": "Men's Shoes",
  "mens-watches": "Men's Watches",
  "mobile-accessories": "Mobile Accessories",
  motorcycle: "Motorcycle",
  "skin-care": "Skin Care",
  smartphones: "Smartphones",
  "sports-accessories": "Sports & Outdoors",
  sunglasses: "Sunglasses",
  tablets: "Tablets",
  tops: "Women's Tops",
  vehicle: "Automotive",
  "womens-bags": "Women's Bags",
  "womens-dresses": "Women's Dresses",
  "womens-jewellery": "Jewelry",
  "womens-shoes": "Women's Shoes",
  "womens-watches": "Women's Watches",
};

export const categories = Object.keys(CATEGORY_LABELS);

export function getProduct(id: number) {
  return products.find((p) => p.id === id);
}

export function byCategory(category: string) {
  return products.filter((p) => p.category === category);
}

// DummyJSON only ships 3 reviews per product; derive stable, realistic-looking
// counts from the id so the UI has the density Amazon's does.
function seeded(id: number, salt: number) {
  const x = Math.sin(id * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
}

export function ratingCount(p: Product) {
  return Math.floor(40 + seeded(p.id, 1) ** 2 * 80000);
}

export function boughtLastMonth(p: Product) {
  const n = seeded(p.id, 2);
  if (n < 0.35) return null;
  const steps = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
  return steps[Math.floor(n * steps.length) % steps.length];
}

export function listPrice(p: Product) {
  return Math.round((p.price / (1 - p.discountPercentage / 100)) * 100) / 100;
}

export function badge(p: Product): string | null {
  const bestInCategory = byCategory(p.category).reduce((a, b) =>
    ratingCount(b) > ratingCount(a) ? b : a,
  );
  if (bestInCategory.id === p.id) return "Best Seller";
  if (p.rating >= 4.5 && ratingCount(p) > 5000) return "Amazon's Choice";
  return null;
}

export function compact(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K` : `${n}`;
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "review" | "newest";

export type SearchParams = {
  k?: string;
  i?: string; // department
  brand?: string;
  rating?: string; // minimum stars
  min?: string;
  max?: string;
  deals?: string;
  sort?: SortKey;
};

function matches(p: Product, words: string[]) {
  const hay = `${p.title} ${p.brand ?? ""} ${p.category} ${CATEGORY_LABELS[p.category]} ${p.tags.join(" ")} ${p.description}`.toLowerCase();
  return words.every((w) => hay.includes(w) || (w.endsWith("s") && hay.includes(w.slice(0, -1))));
}

function score(p: Product, words: string[]) {
  const title = p.title.toLowerCase();
  return words.reduce((s, w) => s + (title.includes(w) ? 3 : 0) + (p.brand?.toLowerCase().includes(w) ? 2 : 0), 0);
}

/** Returns products matching the query and department, before facet filters. */
export function baseResults(params: SearchParams) {
  const words = (params.k ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  return products.filter(
    (p) => (!params.i || p.category === params.i) && matches(p, words),
  );
}

export function search(params: SearchParams) {
  const words = (params.k ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const base = baseResults(params);
  const brands = params.brand ? params.brand.split("|") : [];
  const min = params.min ? Number(params.min) : 0;
  const max = params.max ? Number(params.max) : Infinity;
  const minRating = params.rating ? Number(params.rating) : 0;

  const results = base.filter(
    (p) =>
      (!brands.length || (p.brand && brands.includes(p.brand))) &&
      p.rating >= minRating &&
      p.price >= min &&
      p.price <= max &&
      (!params.deals || p.discountPercentage >= 10),
  );

  const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
    featured: (a, b) => score(b, words) - score(a, words) || ratingCount(b) - ratingCount(a),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    review: (a, b) => b.rating - a.rating,
    newest: (a, b) => b.id - a.id,
  };
  results.sort(sorters[params.sort ?? "featured"] ?? sorters.featured);
  return { base, results };
}
