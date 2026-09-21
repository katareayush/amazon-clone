"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = { departments: Record<string, string>; titles: string[] };

// Remount when the URL's query changes so the box reflects the current search.
export default function SearchBar(props: Props) {
  const params = useSearchParams();
  const k = params.get("k") ?? "";
  const i = params.get("i") ?? "";
  return <Search key={`${k}|${i}`} {...props} initialQuery={k} initialDept={i} />;
}

function Search({ departments, titles, initialQuery, initialDept }: Props & { initialQuery: string; initialDept: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [dept, setDept] = useState(initialDept);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const q = query.trim().toLowerCase();
  const suggestions = q
    ? titles.filter((t) => t.toLowerCase().includes(q)).slice(0, 8)
    : [];

  function go(k: string) {
    setOpen(false);
    setQuery(k);
    const sp = new URLSearchParams();
    if (k.trim()) sp.set("k", k.trim());
    if (dept) sp.set("i", dept);
    router.push(`/s?${sp}`);
  }

  return (
    <form
      role="search"
      className="relative flex h-10 min-w-0 flex-1 rounded-md focus-within:ring-3 focus-within:ring-[#febd69]"
      onSubmit={(e) => {
        e.preventDefault();
        go(active >= 0 ? suggestions[active] : query);
      }}
    >
      <select
        aria-label="Search in"
        value={dept}
        onChange={(e) => setDept(e.target.value)}
        className="hidden w-auto max-w-40 rounded-l-md border-r border-gray-300 bg-[#e6e6e6] px-2 text-xs text-[#555] hover:bg-[#d4d4d4] sm:block"
      >
        <option value="">All</option>
        {Object.entries(departments).map(([slug, label]) => (
          <option key={slug} value={slug}>
            {label}
          </option>
        ))}
      </select>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, suggestions.length - 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, -1));
          else if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search Amazon Clone"
        aria-label="Search"
        className="min-w-0 flex-1 rounded-l-md bg-white px-3 text-[15px] text-black outline-none sm:rounded-none"
      />
      <button type="submit" aria-label="Go" className="flex w-12 items-center justify-center rounded-r-md bg-[#febd69] hover:bg-[#f3a847]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" aria-hidden>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 21 21" strokeLinecap="round" />
        </svg>
      </button>
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full right-0 left-0 z-50 mt-0.5 overflow-hidden rounded-b-md border border-gray-300 bg-white py-1 text-black shadow-lg">
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(s)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[15px] font-bold ${i === active ? "bg-gray-100" : "hover:bg-gray-100"}`}
              >
                <span className="font-normal text-gray-500">⌕</span>
                {s.toLowerCase()}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
