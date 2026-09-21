"use client";

import { useState } from "react";
import { addToCart } from "@/lib/client/api";

export default function AddToCart({ productId, className = "" }: { productId: number; className?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "added" | "error">("idle");
  const label = { idle: "Add to cart", busy: "Adding…", added: "✓ Added", error: "Try again" }[state];
  return (
    <button
      type="button"
      disabled={state === "busy"}
      className={`btn-yellow ${className}`}
      onClick={async () => {
        setState("busy");
        try {
          await addToCart(productId);
          setState("added");
          setTimeout(() => setState("idle"), 1500);
        } catch {
          setState("error");
        }
      }}
    >
      {label}
    </button>
  );
}
