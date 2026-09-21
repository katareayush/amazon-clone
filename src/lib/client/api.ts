"use client";

import useSWR, { mutate } from "swr";
import type { CartView } from "@/server/cart";
import type { SessionUser } from "@/server/auth";

export class RequestError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

export async function api<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = data.error ?? {};
    throw new RequestError(res.status, e.code ?? "error", e.message ?? "Something went wrong", e.fields);
  }
  return data as T;
}

const fetcher = <T,>(url: string) => api<T>(url);

export type Cart = CartView;
const EMPTY_CART: Cart = { items: [], count: 0, subtotalCents: 0 };

export function useCart() {
  const { data, isLoading } = useSWR<Cart>("/api/cart", fetcher);
  return { cart: data ?? EMPTY_CART, isLoading };
}

export function useUser() {
  const { data, isLoading } = useSWR<{ user: SessionUser | null }>("/api/auth/me", fetcher);
  return { user: data?.user ?? null, isLoading };
}

const setCart = (cart: Cart) => mutate("/api/cart", cart, { revalidate: false });

export const addToCart = (productId: number, qty = 1) =>
  api<Cart>("/api/cart/items", { method: "POST", body: { productId, qty } }).then(setCart);

export const setCartQty = (productId: number, qty: number) =>
  api<Cart>(`/api/cart/items/${productId}`, { method: "PATCH", body: { qty } }).then(setCart);

/** Refetch everything session-scoped after sign-in, sign-out or checkout. */
export const refreshSession = () => Promise.all([mutate("/api/auth/me"), mutate("/api/cart")]);
