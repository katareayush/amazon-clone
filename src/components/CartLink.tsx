"use client";

import Link from "next/link";
import { useCart } from "@/lib/store";

export default function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="flex shrink-0 items-end rounded-sm border border-transparent px-1.5 py-1 hover:border-white" aria-label={`Cart, ${count} items`}>
      <span className="relative">
        <svg width="40" height="32" viewBox="0 0 40 32" fill="none" stroke="white" strokeWidth="2.2" aria-hidden>
          <path d="M2 4h6l5 18h20l4-13H11" strokeLinejoin="round" />
          <circle cx="15" cy="27" r="2.3" fill="white" />
          <circle cx="30" cy="27" r="2.3" fill="white" />
        </svg>
        <span className="absolute top-0 left-[19px] w-5 text-center text-base font-bold text-[#f08804]">{count}</span>
      </span>
      <span className="hidden text-sm font-bold sm:inline">Cart</span>
    </Link>
  );
}
