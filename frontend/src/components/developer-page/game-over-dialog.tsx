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
import { ScoreEntry } from "@/contracts/leaderboard";
import {
  Shield,
  Bug,
  ShieldCheck,
  RefreshCw,
  Home,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
} from "lucide-react";

const VICTORY_META: Record<VictoryConditionTag, { label: string }> = {
  time_survival: { label: "Time Survival" },
  system_destruction: { label: "System Destruction" },
  data_exfiltration: { label: "Data Exfiltration" },
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
  journalScore: number | null;
  personalBest: ScoreEntry | null;
  proverStatus: ProverStatus;
  proverError: string | null;
  onSubmitScore: () => void;
  onRestart: () => void;
  onExit: () => void;
  showZkSection?: boolean;
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
  journalScore,
  personalBest,
  proverStatus,
  proverError,
  onSubmitScore,
  onRestart,
  onExit,
  showZkSection = true,
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
        className="bg-stone-900 border-stone-700 text-white max-w-md"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        onInteractOutside={(e: any) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <div
            className={`text-center p-4 border mb-2 ${defenderWon ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"}`}
          >
            <div className="flex justify-center mb-2">
              {defenderWon ? (
                <Shield className="w-10 h-10 text-green-400" />
              ) : (
                <Bug className="w-10 h-10 text-red-400" />
              )}
            </div>
            <DialogTitle
              className={`text-2xl font-bold ${defenderWon ? "text-green-400" : "text-red-400"}`}
            >
              {defenderWon ? "defender wins" : "bot wins"}
            </DialogTitle>
            {endReason && (
              <p className="text-sm text-stone-400 mt-1">{endReason}</p>
            )}
          </div>
        </DialogHeader>

        {/* Victory condition */}
        <div className="flex items-center gap-2 text-sm text-stone-500 border border-stone-800 bg-stone-950 px-3 py-2">
          <span>win condition was</span>
          <span className="text-stone-300 font-bold">{meta.label}</span>
        </div>

        {/* Stats */}
        <div className="space-y-2 py-1">
          <StatRow
            label="threats cured"
            value={`${threatsCured} / ${threatsTotal}`}
            color="text-green-400"
          />
          <StatRow
            label="systems destroyed"
            value={String(systemsDestroyed)}
            color="text-red-400"
          />
          {victoryCondition === "data_exfiltration" && (
            <StatRow
              label="data exfiltrated"
              value={`${dataLeaked.toFixed(0)}%`}
              color="text-orange-400"
            />
          )}
          <StatRow
            label="success rate"
            value={`${successRate.toFixed(0)}%`}
            color="text-amber-400"
          />
          {journalScore !== null ? (
            <div className="flex justify-between items-center pt-2 border-t border-stone-800">
              <span className="text-stone-500 text-sm">final score</span>
              <span className="text-2xl font-bold text-amber-400 tabular-nums">
                {journalScore}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center pt-2 border-t border-stone-800">
              <span className="text-stone-500 text-sm">score</span>
              <span className="text-2xl font-bold text-amber-400 tabular-nums">
                {score}
              </span>
            </div>
          )}
        </div>

        {/* ZK Proof */}
        {showZkSection && (
          <div className="border border-stone-700 bg-stone-950 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500 uppercase tracking-widest">
                zk verification
              </span>
              <ProofStatusBadge status={proverStatus} />
            </div>

            {isError && proverError && (
              <div className="flex items-start gap-2 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-all">{proverError}</span>
              </div>
            )}

            {isProved && (
              <div className="text-sm text-green-400 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  proof generated — score verified on-chain
                </div>
                {personalBest?.score && (
                  <div className="text-stone-400">
                    personal best:{" "}
                    <span className="text-white font-bold">
                      {personalBest.score}
                    </span>
                  </div>
                )}
              </div>
            )}

            {proverStatus === "idle" && (
              <Button
                onClick={onSubmitScore}
                className="w-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm uppercase tracking-widest flex items-center gap-2 justify-center"
              >
                <Lock className="w-4 h-4" />
                submit score with zk proof
              </Button>
            )}

            {isProving && (
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                generating proof… this may take a minute
              </div>
            )}

            {isError && (
              <Button
                onClick={onSubmitScore}
                variant="secondary"
                className="w-full bg-stone-800 hover:bg-stone-700 text-white text-sm"
              >
                retry
              </Button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onRestart}
            className="flex-1 flex items-center gap-2 justify-center bg-green-700 hover:bg-green-600 text-white font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            play again
          </Button>
          <Button
            onClick={onExit}
            variant="secondary"
            className="flex-1 flex items-center gap-2 justify-center bg-stone-800 hover:bg-stone-700 text-white"
          >
            <Home className="w-4 h-4" />
            main menu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProofStatusBadge({ status }: { status: ProverStatus }) {
  switch (status) {
    case "idle":
      return <span className="text-sm text-stone-600">not submitted</span>;
    case "proving":
      return (
        <span className="text-sm text-amber-400 animate-pulse flex items-center gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          proving…
        </span>
      );
    case "success":
      return (
        <span className="text-sm text-green-400 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          verified
        </span>
      );
    case "error":
      return (
        <span className="text-sm text-red-400 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          failed
        </span>
      );
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
    <div className="flex justify-between items-center border border-stone-800 bg-stone-950 px-3 py-2">
      <span className="text-sm text-stone-500">{label}</span>
      <span className={`text-base font-bold tabular-nums ${color}`}>
        {value}
      </span>
    </div>
  );
}
