export default function ScoreBar({
  score,
  max,
}: {
  score: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, (score / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-sm text-stone-200 font-bold tabular-nums w-16 text-right shrink-0">
        {score.toLocaleString()}
      </span>
      <div className="flex-1 h-px bg-stone-800 relative min-w-16">
        <div
          className="absolute inset-y-0 left-0 bg-stone-400 transition-all duration-700"
          style={{ width: `${pct}%`, height: "1px" }}
        />
      </div>
    </div>
  );
}
