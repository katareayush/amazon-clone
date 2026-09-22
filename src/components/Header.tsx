import Link from "next/link";
import { Suspense } from "react";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import CartLink from "./CartLink";
import AccountLink from "./AccountLink";
import { CATEGORY_LABELS } from "@/lib/categories";

const NAV = [
  ["Today's Deals", "/s?deals=1"],
  ["Smartphones", "/s?i=smartphones"],
  ["Laptops", "/s?i=laptops"],
  ["Beauty", "/s?i=beauty"],
  ["Home Decor", "/s?i=home-decoration"],
  ["Kitchen", "/s?i=kitchen-accessories"],
  ["Grocery", "/s?i=groceries"],
  ["Fashion", "/s?k=shoes"],
  ["Sports", "/s?i=sports-accessories"],
  ["Your Orders", "/orders"],
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 text-white">
      <div className="flex items-center gap-0.5 bg-nav px-2 py-1.5 sm:gap-1 sm:px-4">
        <Link href="/" className="shrink-0 rounded-sm border border-transparent px-1.5 pt-1.5 pb-1 hover:border-white">
          <Logo />
        </Link>
        <button className="hidden shrink-0 items-end gap-1 rounded-sm border border-transparent px-1.5 pt-2.5 pb-1.5 text-left hover:border-white lg:flex">
          <PinIcon />
          <span className="leading-tight">
            <span className="block text-xs text-gray-300">Deliver to</span>
            <span className="block text-sm font-bold">New York 10001</span>
          </span>
        </button>
        <Suspense fallback={<div className="h-10 flex-1 rounded-md bg-white" />}>
          <SearchBar departments={CATEGORY_LABELS} />
        </Suspense>
        <AccountLink />
        <Link href="/orders" className="hidden shrink-0 rounded-sm border border-transparent px-1.5 pt-2.5 pb-1.5 leading-tight hover:border-white md:block">
          <div className="text-xs">Returns</div>
          <div className="text-sm font-bold">&amp; Orders</div>
        </Link>
        <CartLink />
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto bg-nav-2 px-2 text-sm whitespace-nowrap sm:px-4">
        <Link href="/s" className="flex items-center gap-1 rounded-sm border border-transparent px-2 py-1.5 font-bold hover:border-white">
          <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden><path d="M0 1h18M0 7h18M0 13h18" stroke="white" strokeWidth="2" /></svg>
          All
        </Link>
        {NAV.map(([label, href]) => (
          <Link key={href} href={href} className="rounded-sm border border-transparent px-2 py-1.5 hover:border-white">
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function PinIcon() {
  return (
    <svg width="15" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="mb-0.5">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}
