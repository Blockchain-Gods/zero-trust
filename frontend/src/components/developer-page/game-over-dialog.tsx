"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type VictoryCondition =
  | "time_survival"
  | "system_destruction"
  | "data_exfiltration";

const VICTORY_META: Record<VictoryCondition, { label: string; icon: string }> =
  {
    time_survival: { label: "Time Survival", icon: "⏱️" },
    system_destruction: { label: "System Destruction", icon: "💀" },
    data_exfiltration: { label: "Data Exfiltration", icon: "📤" },
  };

interface GameOverDialogProps {
  open: boolean;
  defenderWon: boolean;
  endReason: string | null;
  victoryCondition: VictoryCondition;
  threatsCured: number;
  threatsTotal: number;
  systemsDestroyed: number;
  dataLeaked: number;
  score: number;
  onRestart: () => void;
  onExit: () => void;
}

export function GameOverDialog({
  open,
  defenderWon,
  endReason,
  victoryCondition,
  threatsCured,
  threatsTotal,
  systemsDestroyed,
  dataLeaked,
  score,
  onRestart,
  onExit,
}: GameOverDialogProps) {
  const meta = VICTORY_META[victoryCondition];
  const successRate =
    threatsTotal > 0 ? (threatsCured / threatsTotal) * 100 : 0;

  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-slate-800 border-slate-700 text-white max-w-md"
        // Prevent closing by clicking outside — player must make a choice
        onInteractOutside={(e: any) => e.preventDefault()}
      >
        <DialogHeader>
          {/* Result banner */}
          <div
            className={`text-center p-4 rounded-lg mb-2 ${
              defenderWon
                ? "bg-green-900/40 border border-green-500"
                : "bg-red-900/40 border border-red-500"
            }`}
          >
            <div className="text-4xl mb-2">{defenderWon ? "🛡️" : "🦠"}</div>
            <DialogTitle
              className={`text-2xl font-bold ${defenderWon ? "text-green-400" : "text-red-400"}`}
            >
              {defenderWon ? "Defender Wins!" : "Bot Wins!"}
            </DialogTitle>
            {endReason && (
              <p className="text-sm text-slate-300 mt-1">{endReason}</p>
            )}
          </div>
        </DialogHeader>

        {/* Victory condition context */}
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-700/50 rounded px-3 py-2">
          <span>{meta.icon}</span>
          <span>
            Win condition was{" "}
            <span className="text-white font-medium">{meta.label}</span>
          </span>
        </div>

        {/* Stats */}
        <div className="space-y-3 py-2">
          <StatRow
            label="Threats Cured"
            value={`${threatsCured} / ${threatsTotal}`}
            color="text-green-400"
          />
          <StatRow
            label="Systems Destroyed"
            value={String(systemsDestroyed)}
            color="text-red-400"
          />
          {victoryCondition === "data_exfiltration" && (
            <StatRow
              label="Data Exfiltrated"
              value={`${dataLeaked.toFixed(0)}%`}
              color="text-orange-400"
            />
          )}
          <StatRow
            label="Success Rate"
            value={`${successRate.toFixed(0)}%`}
            color="text-purple-400"
          />
          <div className="pt-3 border-t border-slate-700 flex justify-between items-center">
            <span className="text-slate-400">Final Score</span>
            <span className="text-3xl font-bold text-white">{score}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onRestart}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white"
          >
            Play Again
          </Button>
          <Button
            onClick={onExit}
            variant="secondary"
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
          >
            Main Menu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400">{label}</span>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
    </div>
  );
}
