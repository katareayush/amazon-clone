"use client";

import Link from "next/link";
import { useCart } from "@/lib/client/api";

export default function CartLink() {
  const { count } = useCart().cart;
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} items`}
      className="flex h-[46px] shrink-0 items-end gap-0.5 rounded-sm border border-transparent px-1.5 pb-1.5 hover:border-white"
    >
      <span className="relative block">
        {/* The count floats over the basket's top-left, the way Amazon's does. */}
        <span className="absolute top-0 left-[11px] w-6 -translate-x-1/2 text-center text-base leading-none font-bold text-[#f08804]">
          {count}
        </span>
        <svg width="36" height="26" viewBox="0 0 40 30" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden className="mt-3.5">
          <path d="M1 3h6.5l5.5 17h20l5-12.5H12" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="15.5" cy="25.5" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="30" cy="25.5" r="2.4" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="hidden text-sm leading-none font-bold sm:inline">Cart</span>
    </Link>
  );
}
