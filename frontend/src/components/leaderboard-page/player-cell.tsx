export default function PlayerCell({
  name,
  player,
  currentPlayer,
}: {
  name: string;
  player: string;
  currentPlayer?: string;
}) {
  const isYou = currentPlayer && player === currentPlayer;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-mono font-semibold ${isYou ? "text-amber-400" : "text-stone-200"}`}
        >
          {name}
        </span>
        {isYou && (
          <span className="text-xs font-mono text-amber-400 border border-amber-400/30 px-1.5 py-px leading-none uppercase tracking-widest">
            you
          </span>
        )}
      </div>
      <span className="text-sm font-mono text-stone-700 tabular-nums">
        {player.slice(0, 8)}…{player.slice(-4)}
      </span>
    </div>
  );
}
