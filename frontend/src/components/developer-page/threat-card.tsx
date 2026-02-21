import { getMatchQuality } from "@/lib/game-logic";
import { ThreatWithCommit, Developer } from "@/lib/types/defense-types";
import { useDroppable } from "@dnd-kit/core";

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
    ? "border-purple-500 scale-105"
    : isCommitting
      ? "border-amber-500"
      : threat.assignedDeveloperId
        ? "border-blue-500"
        : "border-gray-700";

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-800 rounded-lg p-4 border-2 transition ${borderClass}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{threat.target.icon}</span>
          <div>
            <h3 className="text-white font-semibold">{threat.target.name}</h3>
            <div className="text-xs text-gray-400">
              Threat #{threat.id.split("-")[1]}
            </div>
          </div>
        </div>
        {matchQuality && (
          <div className={`text-xs font-semibold ${matchQuality.color}`}>
            {matchQuality.label}
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">Required Skills:</div>
        <div className="flex gap-1 flex-wrap">
          {threat.requiredSkills.map((skill: any) => (
            <span
              key={skill.id}
              className={`px-2 py-1 rounded text-xs ${
                developer?.skills.some((s: any) => s.id === skill.id)
                  ? "bg-green-500/20 text-green-300 border border-green-500"
                  : "bg-slate-700 text-gray-300"
              }`}
            >
              {skill.icon} {skill.name}
            </span>
          ))}
        </div>
      </div>

      {/* Damage bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-red-400">Damage</span>
          <span className="text-red-400 font-semibold">
            {damagePercent.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              damagePercent > 70
                ? "bg-red-500 animate-pulse"
                : damagePercent > 30
                  ? "bg-orange-500"
                  : "bg-yellow-500"
            }`}
            style={{ width: `${damagePercent}%` }}
          />
        </div>
      </div>

      {/* Commit bar */}
      {isCommitting && developer && (
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-amber-400">
              ⏳ Committing {developer.name}…
            </span>
            <span className="text-amber-400 font-semibold">
              {commitProgress.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-100"
              style={{ width: `${commitProgress}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Lock-in in progress — cannot reassign
          </div>
        </div>
      )}

      {/* Cure bar — only once locked in */}
      {!isCommitting && developer && (
        <>
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-blue-400">Cure Progress</span>
              <span className="text-blue-400 font-semibold">
                {curePercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${curePercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-700 rounded p-2">
            <span className="text-xl">{developer.avatar}</span>
            <span className="text-sm text-white">{developer.name}</span>
            <span className="ml-auto text-xs text-slate-400">🔒 Locked in</span>
          </div>
        </>
      )}

      {!developer && !isCommitting && (
        <div className="text-center text-sm text-gray-400 py-2 border-2 border-dashed border-gray-600 rounded">
          Drag developer here
        </div>
      )}
    </div>
  );
}
