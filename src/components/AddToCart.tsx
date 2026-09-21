"use client";

import { useState } from "react";
import { addToCart, type CartItem } from "@/lib/store";

export default function AddToCart({ item, className = "" }: { item: Omit<CartItem, "qty">; className?: string }) {
  const [added, setAdded] = useState(false);
  return (
    <button
      type="button"
      className={`btn-yellow ${className}`}
      onClick={() => {
        addToCart(item);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? "✓ Added" : "Add to cart"}
    </button>
  );
}
