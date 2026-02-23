export default function AccuracyBadge({ bps }: { bps: number }) {
  const pct = bps / 100;
  const color =
    pct >= 80
      ? "text-green-400"
      : pct >= 50
        ? "text-amber-400"
        : "text-red-400";
  return (
    <span className={`font-mono text-sm tabular-nums ${color}`}>
      {pct.toFixed(0)}%
    </span>
  );
}
