export default function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="font-mono text-sm text-amber-400 tabular-nums font-bold">
        01
      </span>
    );
  if (rank === 2)
    return (
      <span className="font-mono text-sm text-stone-400 tabular-nums font-bold">
        02
      </span>
    );
  if (rank === 3)
    return (
      <span className="font-mono text-sm text-stone-500 tabular-nums font-bold">
        03
      </span>
    );
  return (
    <span className="font-mono text-sm text-stone-700 tabular-nums">
      {String(rank).padStart(2, "0")}
    </span>
  );
}
