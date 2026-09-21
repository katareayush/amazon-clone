"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  ["featured", "Featured"],
  ["price-asc", "Price: Low to High"],
  ["price-desc", "Price: High to Low"],
  ["review", "Avg. Customer Review"],
  ["newest", "Newest Arrivals"],
];

export default function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-1 rounded-lg border border-line bg-[#f0f2f2] px-2 py-1 text-[13px] shadow-sm">
      Sort by:
      <select
        value={value}
        onChange={(e) => {
          const sp = new URLSearchParams(params);
          sp.set("sort", e.target.value);
          router.push(`${pathname}?${sp}`);
        }}
        className="bg-transparent outline-none"
      >
        {OPTIONS.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
