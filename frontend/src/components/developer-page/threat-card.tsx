import { getMatchQuality } from "@/lib/game-logic";
import { ThreatWithCommit, Developer } from "@/lib/types/defense-types";
import { useDroppable } from "@dnd-kit/core";
import { Lock, UserPlus } from "lucide-react";

export default function ThreatCard({
  threat,
  developer,
  isCommitting,
  commitProgress,
}: {
  threat: ThreatWithCommit;
  developer?: Developer;
  isCommitting: boolean;
  commitProgress: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: threat.id,
    data: { threat },
  });
  const damagePercent = Math.min(100, threat.currentDamage);
  const curePercent = Math.min(100, threat.cureProgress);
  const matchQuality =
    developer && !isCommitting ? getMatchQuality(threat, developer) : null;

  const borderClass = isOver
    ? "border-amber-400/60 scale-[1.02]"
    : isCommitting
      ? "border-amber-400/40"
      : threat.assignedDeveloperId
        ? "border-blue-500/40"
        : "border-stone-700";

  return (
    <div
      ref={setNodeRef}
      className={`border bg-stone-900/50 p-4 transition ${borderClass}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{threat.target.icon}</span>
          <div>
            <h3 className="text-sm text-white font-semibold">
              {threat.target.name}
            </h3>
            <div className="text-sm text-stone-600">
              threat #{threat.id.split("-")[1]}
            </div>
          </div>
        </div>
        {matchQuality && (
          <div className={`text-sm font-semibold ${matchQuality.color}`}>
            {matchQuality.label}
          </div>
        )}
      </div>

      {/* Required skills */}
      <div className="mb-3">
        <div className="text-sm text-stone-600 mb-1.5">required skills</div>
        <div className="flex gap-1 flex-wrap">
          {threat.requiredSkills.map((skill: any) => (
            <span
              key={skill.id}
              className={`px-2 py-0.5 text-sm border ${
                developer?.skills.some((s: any) => s.id === skill.id)
                  ? "border-green-500/50 bg-green-500/10 text-green-400"
                  : "border-stone-700 bg-stone-800 text-stone-500"
              }`}
            >
              {skill.icon} {skill.name}
            </span>
          ))}
        </div>
      </div>

      {/* Damage bar */}
      <ProgressBar
        label="damage"
        value={damagePercent}
        valueLabel={`${damagePercent.toFixed(0)}%`}
        color={
          damagePercent > 70
            ? "bg-red-500 animate-pulse"
            : damagePercent > 30
              ? "bg-orange-500"
              : "bg-amber-500"
        }
        labelColor="text-red-400"
      />

      {/* Commit bar */}
      {isCommitting && developer && (
        <div className="mt-2">
          <ProgressBar
            label={`committing ${developer.name}…`}
            value={commitProgress}
            valueLabel={`${commitProgress.toFixed(0)}%`}
            color="bg-amber-400"
            labelColor="text-amber-400"
          />
          <div className="text-sm text-stone-700 mt-1">
            lock-in in progress — cannot reassign
          </div>
        </div>
      )}

      {/* Cure bar */}
      {!isCommitting && developer && (
        <div className="mt-2 space-y-2">
          <ProgressBar
            label="cure progress"
            value={curePercent}
            valueLabel={`${curePercent.toFixed(0)}%`}
            color="bg-blue-500"
            labelColor="text-blue-400"
          />
          <div className="flex items-center gap-2 border border-stone-700 bg-stone-900 p-2">
            <span className="text-lg">{developer.avatar}</span>
            <span className="text-sm text-white">{developer.name}</span>
            <Lock className="ml-auto w-3.5 h-3.5 text-stone-600" />
          </div>
        </div>
      )}

      {!developer && !isCommitting && (
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-stone-600 border border-dashed border-stone-800 py-2">
          <UserPlus className="w-4 h-4" />
          drag developer here
        </div>
      )}
    </div>
  );
}

function ProgressBar({
  label,
  value,
  valueLabel,
  color,
  labelColor,
}: {
  label: string;
  value: number;
  valueLabel: string;
  color: string;
  labelColor: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={labelColor}>{label}</span>
        <span className={`${labelColor} font-semibold tabular-nums`}>
          {valueLabel}
        </span>
      </div>
      <div className="h-2 bg-stone-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
