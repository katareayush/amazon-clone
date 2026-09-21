import { describe, expect, it } from "vitest";
import { listPriceCents, luhn, orderTotals } from "@/lib/pricing";

describe("orderTotals", () => {
  it("sums lines, adds shipping and rounds tax to the cent", () => {
    const t = orderTotals([{ priceCents: 999, qty: 3 }, { priceCents: 1999, qty: 1 }], "one-day");
    expect(t.subtotalCents).toBe(4996);
    expect(t.shippingCents).toBe(999);
    expect(t.taxCents).toBe(Math.round(4996 * 0.08875)); // 443.39 -> 443
    expect(t.totalCents).toBe(4996 + 999 + 443);
  });

  it("charges nothing for free speeds or an empty cart", () => {
    expect(orderTotals([], "two-day")).toEqual({ subtotalCents: 0, shippingCents: 0, taxCents: 0, totalCents: 0 });
  });
});

describe("luhn", () => {
  it.each([
    ["4242 4242 4242 4242", true],
    ["4242424242424241", false],
    ["5555-5555-5555-4444", true],
    ["1234", false],
  ])("%s -> %s", (n, ok) => expect(luhn(n)).toBe(ok));
});

it("derives list price from the discount", () => {
  expect(listPriceCents({ priceCents: 8000, discountPercentage: 20 })).toBe(10000);
});
