"use client";

import Link from "next/link";
import { useCart } from "@/lib/client/api";

export default function CartLink() {
  const { count } = useCart().cart;
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} items`}
      className="flex shrink-0 items-end gap-1 rounded-sm border border-transparent px-1.5 pt-2.5 pb-1.5 hover:border-white"
    >
      <span className="relative block h-9 w-9">
        <span className="absolute inset-x-0 top-0 h-4 text-center text-base leading-4 font-bold text-[#f08804]">
          {count}
        </span>
        <svg width="36" height="26" viewBox="0 0 40 30" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden className="absolute bottom-0 left-0">
          <path d="M1 3h6.5l5.5 17h20l5-12.5H12" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="15.5" cy="25.5" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="30" cy="25.5" r="2.4" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="hidden text-sm leading-5 font-bold sm:inline">Cart</span>
    </Link>
  );
}
