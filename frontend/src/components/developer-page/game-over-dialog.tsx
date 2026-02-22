"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProverStatus } from "@/hooks/useProver";
import { VictoryConditionTag } from "@/lib/types/types";

const VICTORY_META: Record<
  VictoryConditionTag,
  { label: string; icon: string }
> = {
  time_survival: { label: "Time Survival", icon: "⏱️" },
  system_destruction: { label: "System Destruction", icon: "💀" },
  data_exfiltration: { label: "Data Exfiltration", icon: "📤" },
};

interface GameOverDialogProps {
  open: boolean;
  defenderWon: boolean;
  endReason: string | null;
  victoryCondition: VictoryConditionTag;
  threatsCured: number;
  threatsTotal: number;
  systemsDestroyed: number;
  dataLeaked: number;
  score: number;
  proverStatus: ProverStatus;
  proverError: string | null;
  onSubmitScore: () => void;
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
  proverStatus,
  proverError,
  onSubmitScore,
  onRestart,
  onExit,
}: GameOverDialogProps) {
  const meta = VICTORY_META[victoryCondition];
  const successRate =
    threatsTotal > 0 ? (threatsCured / threatsTotal) * 100 : 0;

  const isProving = proverStatus === "proving";
  const isProved = proverStatus === "success";
  const isError = proverStatus === "error";

  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-slate-800 border-slate-700 text-white max-w-md"
        onInteractOutside={(e: any) => e.preventDefault()}
      >
        <DialogHeader>
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

        {/* ZK Proof submission */}
        <div className="border border-slate-600 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              ZK Score Verification
            </span>
            <ProofStatusBadge status={proverStatus} />
          </div>

          {isError && proverError && (
            <p className="text-xs text-red-400 break-all">{proverError}</p>
          )}

          {isProved && (
            <p className="text-xs text-green-400">
              ✓ Proof generated — score verified on-chain
            </p>
          )}

          {proverStatus === "idle" && (
            <Button
              onClick={onSubmitScore}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm"
            >
              🔐 Submit Score with ZK Proof
            </Button>
          )}

          {isProving && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="animate-spin">⚙️</span>
              <span>Generating proof… this may take a minute</span>
            </div>
          )}

          {isError && (
            <Button
              onClick={onSubmitScore}
              variant="secondary"
              className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm"
            >
              Retry
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onRestart}
            disabled={isProving}
            className="flex-1 bg-green-700 hover:bg-green-600 text-white"
          >
            Play Again
          </Button>
          <Button
            onClick={onExit}
            disabled={isProving}
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

function ProofStatusBadge({ status }: { status: ProverStatus }) {
  switch (status) {
    case "idle":
      return <span className="text-xs text-slate-500">Not submitted</span>;
    case "proving":
      return (
        <span className="text-xs text-yellow-400 animate-pulse">Proving…</span>
      );
    case "success":
      return <span className="text-xs text-green-400">✓ Verified</span>;
    case "error":
      return <span className="text-xs text-red-400">✗ Failed</span>;
  }
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
