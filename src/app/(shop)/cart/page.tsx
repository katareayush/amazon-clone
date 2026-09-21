"use client";

import Image from "next/image";
import Link from "next/link";
import { setQty, useCart } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, count, subtotal } = useCart();

  return (
    <div className="bg-page py-5">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 lg:flex-row-reverse lg:items-start">
        {items.length > 0 && (
          <aside className="bg-white p-5 lg:w-72">
            <p className="text-lg">
              Subtotal ({count} {count === 1 ? "item" : "items"}): <b>{formatPrice(subtotal)}</b>
            </p>
            <Link href="/checkout" className="btn-yellow mt-3 block py-2 text-center">
              Proceed to checkout
            </Link>
          </aside>
        )}

        <section className="flex-1 bg-white p-5">
          {items.length === 0 ? (
            <div className="py-6">
              <h1 className="text-2xl font-bold">Your Amazon Clone Cart is empty</h1>
              <p className="mt-2 text-sm">
                <Link href="/s?deals=1" className="link">Shop today&apos;s deals</Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-[28px]">Shopping Cart</h1>
              <p className="text-right text-sm text-muted">Price</p>
              <ul className="border-t border-gray-200">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 border-b border-gray-200 py-4">
                    <Link href={`/dp/${item.id}`} className="flex h-44 w-44 shrink-0 items-center justify-center">
                      <Image src={item.thumbnail} alt={item.title} width={180} height={180} className="max-h-44 w-auto object-contain" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/dp/${item.id}`} className="line-clamp-2 text-lg hover:text-link-hover">{item.title}</Link>
                      <p className={`text-xs ${item.stock < 10 ? "text-deal" : "text-success"}`}>
                        {item.stock < 10 ? `Only ${item.stock} left in stock - order soon.` : "In Stock"}
                      </p>
                      <p className="text-xs text-muted">FREE Returns</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center overflow-hidden rounded-full border-[3px] border-yellow">
                          <button
                            aria-label={item.qty === 1 ? "Delete" : "Decrease quantity"}
                            onClick={() => setQty(item.id, item.qty - 1)}
                            className="px-3 py-1 text-base hover:bg-gray-100"
                          >
                            {item.qty === 1 ? "🗑" : "−"}
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                          <button
                            aria-label="Increase quantity"
                            disabled={item.qty >= Math.min(item.stock, 30)}
                            onClick={() => setQty(item.id, item.qty + 1)}
                            className="px-3 py-1 text-base hover:bg-gray-100 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => setQty(item.id, 0)} className="link">Delete</button>
                      </div>
                    </div>
                    <div className="text-right text-lg font-bold">{formatPrice(item.price)}</div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-right text-lg">
                Subtotal ({count} {count === 1 ? "item" : "items"}): <b>{formatPrice(subtotal)}</b>
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
