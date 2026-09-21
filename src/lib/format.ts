export function formatPrice(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export const formatCents = (cents: number) => formatPrice(cents / 100);

export function formatDay(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function deliveryDate(daysOut = 2, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + daysOut);
  return formatDay(d);
}

export function compact(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K` : `${n}`;
}
