// Shared by the checkout UI and the order API so displayed totals match what is charged.

export const TAX_RATE = 0.08875;

export const DELIVERY_SPEEDS = {
  standard: { label: "FREE Standard Delivery", days: 5, cents: 0 },
  "two-day": { label: "FREE Two-Day Delivery", days: 2, cents: 0 },
  "one-day": { label: "One-Day Delivery", days: 1, cents: 999 },
} as const;

export type DeliverySpeed = keyof typeof DELIVERY_SPEEDS;

export function orderTotals(lines: { priceCents: number; qty: number }[], speed: DeliverySpeed) {
  const subtotalCents = lines.reduce((sum, l) => sum + l.priceCents * l.qty, 0);
  const shippingCents = DELIVERY_SPEEDS[speed].cents;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return { subtotalCents, shippingCents, taxCents, totalCents: subtotalCents + shippingCents + taxCents };
}

export function addDays(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

/** Luhn checksum, so obviously mistyped card numbers are rejected. */
export function luhn(number: string) {
  const digits = number.replace(/\D/g, "");
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return digits.length >= 12 && sum % 10 === 0;
}

export function listPriceCents(p: { priceCents: number; discountPercentage: number }) {
  return Math.round(p.priceCents / (1 - p.discountPercentage / 100));
}
