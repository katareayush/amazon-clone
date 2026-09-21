export default function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <svg width={size * 5} height={size} viewBox="0 0 100 20" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        // Round to quarter stars, the way Amazon renders them.
        const fill = Math.round(Math.min(Math.max(rating - i, 0), 1) * 4) * 25;
        const id = `star-${fill}`;
        return (
          <g key={i} transform={`translate(${i * 20} 0)`}>
            <defs>
              <linearGradient id={id}>
                <stop offset={`${fill}%`} stopColor="#de7921" />
                <stop offset={`${fill}%`} stopColor="#fff" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.5l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L10 14.8l-5.3 2.9 1.2-5.9L1.4 7.7l6-.7z"
              fill={`url(#${id})`}
              stroke="#de7921"
            />
          </g>
        );
      })}
    </svg>
  );
}
