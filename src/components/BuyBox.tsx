"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Price from "./Price";
import { addToCart, type CartItem } from "@/lib/store";

export default function BuyBox({
  item,
  delivery,
  fastest,
  returnPolicy,
}: {
  item: Omit<CartItem, "qty">;
  delivery: string;
  fastest: string;
  returnPolicy: string;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inStock = item.stock > 0;

  return (
    <div className="h-fit rounded-lg border border-line p-4 text-sm lg:sticky lg:top-32">
      <Price value={item.price} />
      <p className="mt-2">
        FREE delivery <b>{delivery}</b>
      </p>
      <p className="mt-1">
        Or fastest delivery <b>{fastest}</b>. Order within <span className="text-success">7 hrs 12 mins</span>
      </p>
      <p className="mt-2 flex items-center gap-1 text-xs text-link">📍 Deliver to New York 10001</p>
      <p className={`mt-3 text-lg ${inStock && item.stock >= 10 ? "text-success" : "text-deal"}`}>
        {!inStock ? "Currently unavailable." : item.stock < 10 ? `Only ${item.stock} left in stock - order soon.` : "In Stock"}
      </p>
      {inStock && (
        <>
          <label className="mt-3 inline-flex items-center gap-1 rounded-lg border border-line bg-[#f0f2f2] px-2 py-1 shadow-sm">
            Quantity:
            <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="bg-transparent outline-none">
              {Array.from({ length: Math.min(item.stock, 30) }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </label>
          <button
            className="btn-yellow mt-3 block w-full py-2"
            onClick={() => {
              addToCart(item, qty);
              setAdded(true);
            }}
          >
            Add to Cart
          </button>
          <button
            className="btn-orange mt-2 block w-full py-2"
            onClick={() => {
              addToCart(item, qty);
              router.push("/checkout");
            }}
          >
            Buy Now
          </button>
          {added && (
            <p className="mt-2 text-success">
              ✓ Added to cart. <Link href="/cart" className="link">Go to Cart</Link>
            </p>
          )}
        </>
      )}
      <table className="mt-4 text-xs">
        <tbody>
          {[["Ships from", "Amazon Clone"], ["Sold by", "Amazon Clone"], ["Returns", returnPolicy], ["Payment", "Secure transaction"]].map(([k, v]) => (
            <tr key={k}>
              <td className="pr-3 pb-1 text-muted">{k}</td>
              <td className="pb-1">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
