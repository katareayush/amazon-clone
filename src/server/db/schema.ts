import { sql } from "drizzle-orm";
import {
  check, index, integer, jsonb, pgTable, primaryKey, real, serial, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

export type Review = { rating: number; comment: string; date: string; reviewerName: string };
export type Address = { name: string; line1: string; city: string; state: string; zip: string; phone: string };

export const products = pgTable(
  "products",
  {
    id: integer("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    brand: text("brand"),
    priceCents: integer("price_cents").notNull(),
    discountPercentage: real("discount_percentage").notNull().default(0),
    rating: real("rating").notNull(),
    ratingCount: integer("rating_count").notNull(),
    boughtLastMonth: integer("bought_last_month"),
    badge: text("badge", { enum: ["Best Seller", "Amazon's Choice"] }),
    stock: integer("stock").notNull(),
    thumbnail: text("thumbnail").notNull(),
    images: jsonb("images").$type<string[]>().notNull(),
    reviews: jsonb("reviews").$type<Review[]>().notNull(),
    tags: jsonb("tags").$type<string[]>().notNull(),
    warranty: text("warranty").notNull(),
    shipping: text("shipping").notNull(),
    returnPolicy: text("return_policy").notNull(),
    dimensions: jsonb("dimensions").$type<{ width: number; height: number; depth: number }>().notNull(),
    weight: real("weight").notNull(),
    searchText: text("search_text").notNull(),
  },
  (t) => [
    index("products_category_idx").on(t.category),
    check("products_stock_nonneg", sql`${t.stock} >= 0`),
  ],
);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  // SHA-256 of the cookie token, so a leaked table can't be replayed.
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// A cart belongs to a signed-in user or to an anonymous guest cookie.
export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("carts_user_idx").on(t.userId),
    uniqueIndex("carts_guest_idx").on(t.guestId),
    check("carts_owner", sql`(${t.userId} is null) <> (${t.guestId} is null)`),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id),
    qty: integer("qty").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.cartId, t.productId] }), check("cart_items_qty", sql`${t.qty} between 1 and 30`)],
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    status: text("status", { enum: ["placed", "cancelled"] }).notNull().default("placed"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    address: jsonb("address").$type<Address>().notNull(),
    payment: text("payment").notNull(),
    deliverySpeed: text("delivery_speed").notNull(),
    deliveryDate: timestamp("delivery_date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_user_idx").on(t.userId, t.createdAt)],
);

// Title and price are snapshotted so order history survives catalog changes.
export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id),
    title: text("title").notNull(),
    thumbnail: text("thumbnail").notNull(),
    priceCents: integer("price_cents").notNull(),
    qty: integer("qty").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);
