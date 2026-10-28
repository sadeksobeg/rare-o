/** Tiny 7-point sparkline from real daily counts. Never invents values. */
export function Sparkline({
  points,
  stroke = "var(--ro-amber-500)",
}: {
  points: readonly number[];
  stroke?: string;
}) {
  const width = 80;
  const height = 22;
  const pad = 1.6;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((value, i) => {
    const x = i * step;
    const y = height - pad - (value / max) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const d = coords.join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      aria-hidden
      className="mt-1"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={d}
      />
    </svg>
  );
}
