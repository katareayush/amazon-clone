import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/server/db";
import { cancelOrder, placeOrder, placeOrderSchema, type PlaceOrderInput } from "@/server/orders";

const input: PlaceOrderInput = placeOrderSchema.parse({
  address: { name: "Test Buyer", phone: "212 555 0100", line1: "1 Main St", city: "New York", state: "ny", zip: "10001" },
  payment: { method: "card", number: "4242 4242 4242 4242", name: "Test Buyer", exp: "12/99" },
  speed: "one-day",
});

const product = {
  id: 1, title: "Widget", description: "d", category: "c", brand: null, priceCents: 1000, discountPercentage: 0,
  rating: 4, ratingCount: 10, boughtLastMonth: null, badge: null, stock: 1, thumbnail: "t", images: [], reviews: [],
  tags: [], warranty: "w", shipping: "s", returnPolicy: "r", dimensions: { width: 1, height: 1, depth: 1 }, weight: 1,
  searchText: "widget",
};

async function userWithCart(email: string, qty: number) {
  const [user] = await db.insert(schema.users).values({ email, name: "T", passwordHash: "x" }).returning();
  const [cart] = await db.insert(schema.carts).values({ userId: user.id }).returning();
  await db.insert(schema.cartItems).values({ cartId: cart.id, productId: 1, qty });
  return user.id;
}

const stock = async () => (await db.select().from(schema.products).where(eq(schema.products.id, 1)))[0].stock;

beforeEach(async () => {
  await db.delete(schema.orders);
  await db.delete(schema.carts);
  await db.delete(schema.users);
  await db.delete(schema.products);
  await db.insert(schema.products).values(product);
});

afterAll(async () => {
  await (db.$client as { end: () => Promise<void> }).end();
});

describe("placeOrder", () => {
  it("charges server-side totals, stores only the card's last 4, and empties the cart", async () => {
    await db.update(schema.products).set({ stock: 5 }).where(eq(schema.products.id, 1));
    const userId = await userWithCart("a@test.dev", 2);

    const order = await placeOrder(userId, input);

    expect(order).toMatchObject({ subtotalCents: 2000, shippingCents: 999, taxCents: 178, totalCents: 3177 });
    const [saved] = await db.select().from(schema.orders).where(eq(schema.orders.id, order.id));
    expect(saved.payment).toBe("Card ending in 4242");
    expect(await stock()).toBe(3);
    expect(await db.select().from(schema.cartItems)).toHaveLength(0);
  });

  it("sells the last unit to exactly one of two concurrent buyers", async () => {
    const [a, b] = await Promise.all([userWithCart("a@test.dev", 1), userWithCart("b@test.dev", 1)]);

    const results = await Promise.allSettled([placeOrder(a, input), placeOrder(b, input)]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(failed.reason).toMatchObject({ status: 409, code: "insufficient_stock" });
    expect(await stock()).toBe(0);
    // The loser's cart is untouched so they can adjust it.
    expect(await db.select().from(schema.cartItems)).toHaveLength(1);
  });

  it("rejects an empty cart", async () => {
    const [user] = await db.insert(schema.users).values({ email: "e@test.dev", name: "E", passwordHash: "x" }).returning();
    await expect(placeOrder(user.id, input)).rejects.toMatchObject({ code: "cart_empty" });
  });
});

describe("cancelOrder", () => {
  it("returns stock once and refuses a second cancel", async () => {
    await db.update(schema.products).set({ stock: 5 }).where(eq(schema.products.id, 1));
    const userId = await userWithCart("a@test.dev", 2);
    const { id } = await placeOrder(userId, input);

    await cancelOrder(userId, id);
    expect(await stock()).toBe(5);
    await expect(cancelOrder(userId, id)).rejects.toMatchObject({ code: "not_cancellable" });
    expect(await stock()).toBe(5);
  });

  it("can't cancel someone else's order", async () => {
    const owner = await userWithCart("a@test.dev", 1);
    const [other] = await db.insert(schema.users).values({ email: "o@test.dev", name: "O", passwordHash: "x" }).returning();
    const { id } = await placeOrder(owner, input);
    await expect(cancelOrder(other.id, id)).rejects.toMatchObject({ code: "not_cancellable" });
  });
});
