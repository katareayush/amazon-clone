"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  stock: number;
  qty: number;
};

export type Address = {
  name: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
};

export type Order = {
  id: string;
  placedAt: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  address: Address;
  payment: string;
  delivery: string;
};

const CART_KEY = "amz.cart";
const ORDERS_KEY = "amz.orders";
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {}
  // Return the same reference while storage is unchanged, as useSyncExternalStore requires.
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value = fallback;
  try {
    if (raw) value = JSON.parse(raw);
  } catch {}
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const EMPTY: never[] = [];

export function useCart() {
  const items = useSyncExternalStore(
    subscribe,
    () => read<CartItem[]>(CART_KEY, EMPTY),
    () => EMPTY as CartItem[],
  );
  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);
  return { items, count, subtotal };
}

export function useOrders() {
  return useSyncExternalStore(
    subscribe,
    () => read<Order[]>(ORDERS_KEY, EMPTY),
    () => EMPTY as Order[],
  );
}

const cart = () => read<CartItem[]>(CART_KEY, EMPTY);

export function addToCart(item: Omit<CartItem, "qty">, qty = 1) {
  const items = cart();
  const existing = items.find((i) => i.id === item.id);
  write(
    CART_KEY,
    existing
      ? items.map((i) => (i.id === item.id ? { ...i, qty: Math.min(i.qty + qty, i.stock, 30) } : i))
      : [...items, { ...item, qty: Math.min(qty, item.stock) }],
  );
}

export function setQty(id: number, qty: number) {
  write(
    CART_KEY,
    qty <= 0 ? cart().filter((i) => i.id !== id) : cart().map((i) => (i.id === id ? { ...i, qty } : i)),
  );
}

export function clearCart() {
  write(CART_KEY, []);
}

export function saveOrder(order: Order) {
  write(ORDERS_KEY, [order, ...read<Order[]>(ORDERS_KEY, EMPTY)]);
}
