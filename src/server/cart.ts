import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { getUser } from "./auth";
import { db, schema, type Tx } from "./db";
import { ApiError, notFound } from "./http";

const GUEST_COOKIE = "gid";
export const MAX_QTY = 30;

type Owner = { userId: string } | { guestId: string };

/**
 * Resolves who owns the current cart. With `create`, a guest gets an id cookie so
 * their cart survives until they sign in; reads never set cookies.
 */
async function currentOwner(create: boolean): Promise<Owner | null> {
  const user = await getUser();
  if (user) return { userId: user.id };
  const jar = await cookies();
  const guestId = jar.get(GUEST_COOKIE)?.value;
  if (guestId && /^[0-9a-f-]{36}$/.test(guestId)) return { guestId };
  if (!create) return null;
  const id = randomUUID();
  jar.set(GUEST_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 864e2, secure: process.env.NODE_ENV === "production" });
  return { guestId: id };
}

const ownerFilter = (o: Owner) =>
  "userId" in o ? eq(schema.carts.userId, o.userId) : eq(schema.carts.guestId, o.guestId);

async function findCartId(o: Owner, tx: Tx | typeof db = db) {
  const [row] = await tx.select({ id: schema.carts.id }).from(schema.carts).where(ownerFilter(o)).limit(1);
  return row?.id ?? null;
}

async function ensureCartId(o: Owner, tx: Tx | typeof db = db) {
  const [row] = await tx
    .insert(schema.carts)
    .values(o)
    .onConflictDoUpdate({ target: "userId" in o ? schema.carts.userId : schema.carts.guestId, set: { updatedAt: new Date() } })
    .returning({ id: schema.carts.id });
  return row.id;
}

export async function cartLines(cartId: string, tx: Tx | typeof db = db) {
  return tx
    .select({
      productId: schema.cartItems.productId,
      qty: schema.cartItems.qty,
      title: schema.products.title,
      thumbnail: schema.products.thumbnail,
      priceCents: schema.products.priceCents,
      stock: schema.products.stock,
    })
    .from(schema.cartItems)
    .innerJoin(schema.products, eq(schema.products.id, schema.cartItems.productId))
    .where(eq(schema.cartItems.cartId, cartId))
    .orderBy(asc(schema.cartItems.addedAt));
}

export type CartView = Awaited<ReturnType<typeof getCart>>;

export async function getCart() {
  const owner = await currentOwner(false);
  const cartId = owner && (await findCartId(owner));
  const items = cartId ? await cartLines(cartId) : [];
  return {
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotalCents: items.reduce((n, i) => n + i.qty * i.priceCents, 0),
  };
}

async function assertStock(productId: number, qty: number) {
  const [product] = await db.select({ stock: schema.products.stock }).from(schema.products).where(eq(schema.products.id, productId));
  if (!product) throw notFound("Product");
  if (qty > product.stock) {
    throw new ApiError(409, "insufficient_stock", `Only ${product.stock} left in stock`);
  }
}

export async function addItem(productId: number, qty: number) {
  const owner = (await currentOwner(true))!;
  const cartId = await ensureCartId(owner);
  const [existing] = await db
    .select({ qty: schema.cartItems.qty })
    .from(schema.cartItems)
    .where(and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.productId, productId)));
  const next = Math.min((existing?.qty ?? 0) + qty, MAX_QTY);
  await assertStock(productId, next);
  await db
    .insert(schema.cartItems)
    .values({ cartId, productId, qty: next })
    .onConflictDoUpdate({ target: [schema.cartItems.cartId, schema.cartItems.productId], set: { qty: next } });
  return getCart();
}

export async function setItemQty(productId: number, qty: number) {
  const owner = await currentOwner(false);
  const cartId = owner && (await findCartId(owner));
  if (!cartId) throw notFound("Cart item");
  if (qty === 0) {
    await db.delete(schema.cartItems).where(and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.productId, productId)));
  } else {
    await assertStock(productId, qty);
    const updated = await db
      .update(schema.cartItems)
      .set({ qty })
      .where(and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.productId, productId)))
      .returning();
    if (!updated.length) throw notFound("Cart item");
  }
  return getCart();
}

/** Moves a guest's cart into the user's cart at sign-in, summing quantities. */
export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const guestId = jar.get(GUEST_COOKIE)?.value;
  if (!guestId) return;
  await db.transaction(async (tx) => {
    const guestCart = await findCartId({ guestId }, tx);
    if (!guestCart) return;
    const userCart = await ensureCartId({ userId }, tx);
    await tx.execute(sql`
      insert into cart_items (cart_id, product_id, qty)
      select ${userCart}, g.product_id, least(g.qty, p.stock, ${MAX_QTY})
      from cart_items g join products p on p.id = g.product_id
      where g.cart_id = ${guestCart} and p.stock > 0
      on conflict (cart_id, product_id) do update
        set qty = least(cart_items.qty + excluded.qty, ${MAX_QTY})`);
    await tx.delete(schema.carts).where(eq(schema.carts.id, guestCart));
  });
  jar.delete(GUEST_COOKIE);
}

export async function userCartId(userId: string, tx: Tx) {
  return findCartId({ userId }, tx);
}
