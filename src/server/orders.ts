import "server-only";
import { randomInt } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { addDays, DELIVERY_SPEEDS, luhn, orderTotals, type DeliverySpeed } from "@/lib/pricing";
import { cartLines, userCartId } from "./cart";
import { db, schema } from "./db";
import { ApiError } from "./http";

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Enter a full name").max(80),
  phone: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a 10-digit phone number"),
  line1: z.string().trim().min(3, "Enter a street address").max(120),
  city: z.string().trim().min(1, "Enter a city").max(60),
  state: z.string().trim().regex(/^[A-Za-z]{2}$/, "Enter a 2-letter state code").transform((s) => s.toUpperCase()),
  zip: z.string().trim().regex(/^\d{5}$/, "Enter a 5-digit ZIP code"),
});

export const placeOrderSchema = z.object({
  address: addressSchema,
  payment: z.discriminatedUnion("method", [
    z.object({
      method: z.literal("card"),
      number: z.string().refine(luhn, "Enter a valid card number"),
      name: z.string().trim().min(1, "Enter the name on the card"),
      exp: z
        .string()
        .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Enter expiry as MM/YY")
        .refine((v) => {
          const [m, y] = v.split("/").map(Number);
          return new Date(2000 + y, m) > new Date();
        }, "This card has expired"),
    }),
    z.object({ method: z.literal("cod") }),
  ]),
  speed: z.enum(Object.keys(DELIVERY_SPEEDS) as [DeliverySpeed, ...DeliverySpeed[]]),
});
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

const orderId = () => `112-${randomInt(1e6, 1e7)}-${randomInt(1e6, 1e7)}`;

export async function placeOrder(userId: string, input: PlaceOrderInput) {
  return db.transaction(async (tx) => {
    const cartId = await userCartId(userId, tx);
    const lines = cartId ? await cartLines(cartId, tx) : [];
    if (!lines.length) throw new ApiError(409, "cart_empty", "Your cart is empty");

    // Decrement in id order so concurrent checkouts lock rows consistently.
    for (const line of [...lines].sort((a, b) => a.productId - b.productId)) {
      const taken = await tx
        .update(schema.products)
        .set({ stock: sql`${schema.products.stock} - ${line.qty}` })
        .where(and(eq(schema.products.id, line.productId), gte(schema.products.stock, line.qty)))
        .returning({ id: schema.products.id });
      if (!taken.length) {
        throw new ApiError(409, "insufficient_stock", `"${line.title}" doesn't have ${line.qty} in stock anymore`);
      }
    }

    const totals = orderTotals(lines, input.speed);
    const id = orderId();
    await tx.insert(schema.orders).values({
      id,
      userId,
      ...totals,
      address: input.address,
      // Only the last four digits are ever stored.
      payment: input.payment.method === "card" ? `Card ending in ${input.payment.number.replace(/\D/g, "").slice(-4)}` : "Pay on Delivery",
      deliverySpeed: input.speed,
      deliveryDate: addDays(DELIVERY_SPEEDS[input.speed].days),
    });
    await tx.insert(schema.orderItems).values(
      lines.map((l) => ({ orderId: id, productId: l.productId, title: l.title, thumbnail: l.thumbnail, priceCents: l.priceCents, qty: l.qty })),
    );
    await tx.delete(schema.cartItems).where(eq(schema.cartItems.cartId, cartId!));
    return { id, ...totals };
  });
}

export async function listOrders(userId: string) {
  const orders = await db.select().from(schema.orders).where(eq(schema.orders.userId, userId)).orderBy(desc(schema.orders.createdAt)).limit(50);
  if (!orders.length) return [];
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(inArray(schema.orderItems.orderId, orders.map((o) => o.id)))
    .orderBy(asc(schema.orderItems.id));
  return orders.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) }));
}

export async function getOrder(userId: string, id: string) {
  const [order] = await db.select().from(schema.orders).where(and(eq(schema.orders.id, id), eq(schema.orders.userId, userId)));
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id)).orderBy(asc(schema.orderItems.id));
  return { ...order, items };
}
export type OrderView = NonNullable<Awaited<ReturnType<typeof getOrder>>>;

/** Cancels a placed order and returns its stock, within one transaction. */
export async function cancelOrder(userId: string, id: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .update(schema.orders)
      .set({ status: "cancelled" })
      .where(and(eq(schema.orders.id, id), eq(schema.orders.userId, userId), eq(schema.orders.status, "placed")))
      .returning({ id: schema.orders.id });
    if (!order) throw new ApiError(409, "not_cancellable", "This order can't be cancelled");
    const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
    for (const i of items) {
      await tx.update(schema.products).set({ stock: sql`${schema.products.stock} + ${i.qty}` }).where(eq(schema.products.id, i.productId));
    }
  });
}
