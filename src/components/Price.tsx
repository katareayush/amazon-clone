export default function Price({ cents, size = "md" }: { cents: number; size?: "sm" | "md" }) {
  const [dollars, rest] = (cents / 100).toFixed(2).split(".");
  return (
    <span className="inline-flex items-start leading-none" aria-label={`$${dollars}.${rest}`}>
      <span className="mt-[3px] text-xs">$</span>
      <span className={size === "sm" ? "text-lg" : "text-[28px]"}>{Number(dollars).toLocaleString("en-US")}</span>
      <span className="mt-[3px] text-xs">{rest}</span>
    </span>
  );
}
