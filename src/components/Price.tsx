export default function Price({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const [dollars, cents] = value.toFixed(2).split(".");
  const big = { sm: "text-lg", md: "text-[28px]", lg: "text-[28px]" }[size];
  return (
    <span className="inline-flex items-start leading-none" aria-label={`$${value.toFixed(2)}`}>
      <span className="mt-[3px] text-xs">$</span>
      <span className={big}>{Number(dollars).toLocaleString("en-US")}</span>
      <span className="mt-[3px] text-xs">{cents}</span>
    </span>
  );
}
