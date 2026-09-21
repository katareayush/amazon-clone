"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SLIDES = [
  { title: "Deals on the latest phones", sub: "Up to 20% off smartphones", href: "/s?i=smartphones", bg: "from-[#8fd3f4] to-[#84fab0]" },
  { title: "Kitchen favorites", sub: "Cookware, tools and more", href: "/s?i=kitchen-accessories", bg: "from-[#fbc2eb] to-[#a6c1ee]" },
  { title: "Fresh looks for the season", sub: "Shoes, bags and watches", href: "/s?k=shoes", bg: "from-[#ffecd2] to-[#fcb69f]" },
];

export default function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [i]);
  const s = SLIDES[i];
  return (
    <div className={`relative h-64 bg-gradient-to-r sm:h-80 lg:h-[420px] ${s.bg} transition-colors`}>
      <Link href={s.href} className="block h-full px-16 pt-8 sm:pt-12">
        <h1 className="text-3xl font-bold sm:text-5xl">{s.title}</h1>
        <p className="mt-2 text-lg sm:text-xl">{s.sub}</p>
      </Link>
      {[-1, 1].map((d) => (
        <button
          key={d}
          aria-label={d < 0 ? "Previous slide" : "Next slide"}
          onClick={() => setI((n) => (n + d + SLIDES.length) % SLIDES.length)}
          className={`absolute top-0 h-40 w-12 text-4xl text-gray-700 hover:outline-2 hover:outline-white ${d < 0 ? "left-0" : "right-0"}`}
        >
          {d < 0 ? "‹" : "›"}
        </button>
      ))}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-page" />
    </div>
  );
}
