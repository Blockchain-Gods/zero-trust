export default function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-stone-600 uppercase tracking-widest">
        {label}
      </div>
      <div
        className={`text-base font-mono font-bold tabular-nums ${accent ? "text-amber-400" : "text-stone-400"}`}
      >
        {value}
      </div>
    </div>
  );
}
