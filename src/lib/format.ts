export function formatPrice(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function deliveryDate(daysOut = 2, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + daysOut);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
