export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`inline-flex items-end leading-none ${dark ? "text-black" : "text-white"}`}>
      <span className="relative pb-2.5">
        <span className="text-[26px] font-bold tracking-[-0.04em]">amazon</span>
        {/* The smile spans the wordmark only and curls up into an arrowhead under the "n". */}
        <svg viewBox="0 0 100 16" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-3.5 w-full" aria-hidden>
          <path d="M3 4 Q50 18 93 5" stroke="#ff9900" strokeWidth="3.5" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d="M86 1.5 L95.5 4.5 L89 11.5" stroke="#ff9900" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
      <span className="pb-2.5 pl-0.5 text-[11px] font-normal">.clone</span>
    </span>
  );
}
