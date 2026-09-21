export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`relative inline-flex flex-col leading-none ${dark ? "text-black" : "text-white"}`}>
      <span className="text-[24px] font-bold tracking-tight">
        amazon<span className="text-[13px] font-normal">.clone</span>
      </span>
      <svg viewBox="0 0 100 14" className="-mt-1 ml-1 w-[62px]" aria-hidden>
        <path d="M2 3 Q50 16 92 4" stroke="#ff9900" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M84 1 L95 3.5 L89 12" stroke="#ff9900" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
