/** Server-safe count pill for portal chrome — no motion hooks, no webpack bind. */
export function ChromeBadge({
  value,
  className,
  max = 9,
}: {
  value: number;
  className?: string;
  max?: number;
}) {
  if (value <= 0) return null;
  return <span className={className}>{value > max ? `${max}+` : value}</span>;
}
