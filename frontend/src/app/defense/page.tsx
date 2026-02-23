"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  Threat,
  Developer,
  DefenseGameState,
  ExtendedGameState,
  ThreatWithCommit,
} from "@/lib/types/defense-types";
import {
  generateThreatsFromBot,
  generateDevelopers,
  calculateCureSpeed,
  getMatchQuality,
  calculateScore,
} from "@/lib/game-logic";
import { BotConfigFE, VictoryConditionTag } from "@/lib/types/types";
import { useAvailableBots, AvailableBot } from "@/hooks/useAvailableBots";
import { useBotSync } from "@/hooks/useBotSync";
import { BotSelectGrid } from "@/components/developer-page/bot-select-grid";
import { GameOverDialog } from "@/components/developer-page/game-over-dialog";
import {
  ROUND_DURATION,
  SYSTEM_DESTRUCTION_THRESHOLD,
  COMMIT_TICKS,
  DATA_EXFIL_THRESHOLD,
  VICTORY_META,
} from "@/lib/constants";
import DeveloperCard from "@/components/developer-page/developer-card";
import ThreatCard from "@/components/developer-page/threat-card";
import { useWallet } from "@/hooks/useWallet";
import { createHash } from "crypto";
import { useGameHub } from "@/hooks/useGameHub";
import { ProofResult, useProver } from "@/hooks/useProver";
import { StrKey } from "@stellar/stellar-sdk";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { ArrowLeft, ShieldCheck } from "lucide-react";

function getVictoryCondition(bot: AvailableBot): VictoryConditionTag {
  const vc = (bot as BotConfigFE).victoryCondition ?? "time_survival";
  if (vc.includes("destruction")) return "system_destruction";
  if (vc.includes("exfil")) return "data_exfiltration";
  return "time_survival";
}

export default function DefensePage() {
  const router = useRouter();
  const [selectedBot, setSelectedBot] = useState<AvailableBot | null>(null);
  const [gameState, setGameState] = useState<ExtendedGameState | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);

  const { submitScore, fetchPersonalBest, topScores, personalBest } =
    useLeaderboard();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const actionLogRef = useRef<
    {
      assigned_at_ms: number;
      unassigned_at_ms: number;
      dev_index: number;
      threat_index: number;
    }[]
  >([]);
  const openAssignmentsRef = useRef<
    Map<
      string,
      { dev_index: number; threat_index: number; assigned_at_ms: number }
    >
  >(new Map());
  const hasLoggedRef = useRef(false);

  const { wallet } = useWallet();
  const pubkeyHex = wallet?.publicKey
    ? Buffer.from(StrKey.decodeEd25519PublicKey(wallet.publicKey)).toString(
        "hex",
      )
    : null;

  const generatedHash = createHash("sha256")
    .update(
      pubkeyHex && selectedBot?.botType
        ? pubkeyHex + selectedBot.botType.toLowerCase()
        : "1234",
    )
    .digest("hex");
  const SEED = generatedHash;

  const {
    bots,
    selectedBot: pickedBot,
    selectBot,
    reload,
  } = useAvailableBots();
  const { sync, isSyncing } = useBotSync();
  const {
    startGame: callHubStart,
    endGame: callHubEnd,
    sessionIdRef,
  } = useGameHub();
  const {
    prove,
    status: proverStatus,
    error: proverError,
    reset: resetProver,
  } = useProver();

  useEffect(() => {
    sync().then(() => reload());
  }, []);
  useEffect(() => {
    setSelectedBot(pickedBot);
  }, [pickedBot]);

  const startGame = async () => {
    if (!selectedBot) return;
    resetProver();
    const rawThreats = generateThreatsFromBot(selectedBot as BotConfigFE, SEED);
    const threats: ThreatWithCommit[] = rawThreats.map((t) => ({
      ...t,
      committingDevId: null,
      commitProgress: 0,
    }));
    const developers = generateDevelopers();
    const victoryCondition = getVictoryCondition(selectedBot);
    setGameState({
      isPlaying: true,
      isPaused: false,
      timeRemaining: ROUND_DURATION,
      threats,
      developers,
      systemsDestroyed: 0,
      threatsCured: 0,
      score: 0,
      startTime: Date.now(),
      victoryCondition,
      dataLeaked: 0,
      defenderWon: null,
      endReason: null,
    });
    setShowGameOver(false);
    actionLogRef.current = [];
    openAssignmentsRef.current = new Map();
    hasLoggedRef.current = false;
    callHubStart(0).catch(console.error);
  };

  useEffect(() => {
    if (!gameState?.isPlaying || gameState.isPaused) return;
    intervalRef.current = setInterval(() => {
      setGameState((prev) => {
        if (!prev) return null;
        const elapsed = (Date.now() - (prev.startTime || 0)) / 1000;
        const newTimeRemaining = Math.max(0, ROUND_DURATION - elapsed);
        const vc = prev.victoryCondition;

        const updatedThreats: ThreatWithCommit[] = prev.threats.map(
          (threat) => {
            if (threat.isCured || threat.isFailed) return threat;
            if (threat.spawnTime > elapsed) return threat;
            let newDamage = threat.currentDamage;
            let newCureProgress = threat.cureProgress;
            if (threat.committingDevId) {
              const newCommitProgress =
                threat.commitProgress + 100 / COMMIT_TICKS;
              if (newCommitProgress >= 100) {
                const devIndex = prev.developers.findIndex(
                  (d) => d.id === threat.committingDevId,
                );
                const threatIndex = parseInt(threat.id.split("-")[1], 10);
                openAssignmentsRef.current.set(`${devIndex}-${threatIndex}`, {
                  dev_index: devIndex,
                  threat_index: threatIndex,
                  assigned_at_ms: Date.now() - (prev.startTime ?? 0),
                });
                return {
                  ...threat,
                  assignedDeveloperId: threat.committingDevId,
                  committingDevId: null,
                  commitProgress: 0,
                };
              }
              newDamage += threat.damageRate / 10;
              return {
                ...threat,
                commitProgress: newCommitProgress,
                currentDamage: Math.min(100, newDamage),
              };
            }
            if (!threat.assignedDeveloperId)
              newDamage += threat.damageRate / 10;
            if (threat.assignedDeveloperId) {
              const dev = prev.developers.find(
                (d) => d.id === threat.assignedDeveloperId,
              );
              if (dev) newCureProgress += calculateCureSpeed(threat, dev) / 10;
            }
            if (newCureProgress >= 100)
              return {
                ...threat,
                isCured: true,
                cureProgress: 100,
                committingDevId: null,
                commitProgress: 0,
              };
            if (newDamage >= 100)
              return {
                ...threat,
                isFailed: true,
                currentDamage: 100,
                committingDevId: null,
                commitProgress: 0,
              };
            return {
              ...threat,
              currentDamage: Math.min(100, newDamage),
              cureProgress: Math.min(100, newCureProgress),
            };
          },
        );

        const cured = updatedThreats.filter((t) => t.isCured).length;
        const destroyed = updatedThreats.filter((t) => t.isFailed).length;
        const allResolved = updatedThreats.every(
          (t) => t.isCured || t.isFailed,
        );
        const newlyLeaked = updatedThreats.filter(
          (t) =>
            t.isFailed &&
            !t.assignedDeveloperId &&
            !t.committingDevId &&
            !prev.threats.find((p) => p.id === t.id)?.isFailed,
        ).length;
        const newDataLeaked =
          prev.dataLeaked + (vc === "data_exfiltration" ? newlyLeaked : 0);
        const score = calculateScore(
          cured,
          updatedThreats.length,
          destroyed,
          Math.floor(elapsed),
        );

        let defenderWon: boolean | null = null;
        let endReason: string | null = null;
        if (vc === "time_survival") {
          if (newTimeRemaining <= 0) {
            defenderWon = false;
            endReason = `The bot survived all ${ROUND_DURATION}s — bot wins`;
          } else if (allResolved) {
            defenderWon = true;
            endReason = "All threats neutralised before time ran out";
          }
        }
        if (vc === "system_destruction") {
          if (destroyed >= SYSTEM_DESTRUCTION_THRESHOLD) {
            defenderWon = false;
            endReason = `${destroyed} systems destroyed — bot wins`;
          } else if (allResolved || newTimeRemaining <= 0) {
            defenderWon = destroyed < SYSTEM_DESTRUCTION_THRESHOLD;
            endReason = defenderWon
              ? `Time's up — held to ${destroyed}/${SYSTEM_DESTRUCTION_THRESHOLD} destructions`
              : `${destroyed} systems destroyed — bot wins`;
          }
        }
        if (vc === "data_exfiltration") {
          if (newDataLeaked >= DATA_EXFIL_THRESHOLD) {
            defenderWon = false;
            endReason = "Data fully exfiltrated — bot wins";
          } else if (allResolved || newTimeRemaining <= 0) {
            defenderWon = newDataLeaked < DATA_EXFIL_THRESHOLD;
            endReason = defenderWon
              ? `Time's up — exfiltration stopped at ${newDataLeaked.toFixed(0)}%`
              : "Data fully exfiltrated — bot wins";
          }
        }

        if (defenderWon !== null) {
          const roundEndMs = Math.floor(elapsed * 1000);
          for (const [_, open] of openAssignmentsRef.current) {
            actionLogRef.current.push({
              ...open,
              unassigned_at_ms: roundEndMs,
            });
          }
          openAssignmentsRef.current.clear();
          callHubEnd(sessionIdRef.current, defenderWon).catch(console.error);
          setShowGameOver(true);
          return {
            ...prev,
            isPlaying: false,
            timeRemaining: newTimeRemaining,
            threats: updatedThreats,
            threatsCured: cured,
            systemsDestroyed: destroyed,
            dataLeaked: newDataLeaked,
            score,
            defenderWon,
            endReason,
          };
        }
        return {
          ...prev,
          timeRemaining: newTimeRemaining,
          threats: updatedThreats,
          threatsCured: cured,
          systemsDestroyed: destroyed,
          dataLeaked: newDataLeaked,
          score,
        };
      });
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState?.isPlaying, gameState?.isPaused]);

  useEffect(() => {
    if (
      gameState?.defenderWon !== null &&
      gameState?.defenderWon !== undefined &&
      !hasLoggedRef.current
    ) {
      hasLoggedRef.current = true;
    }
  }, [gameState?.defenderWon]);

  useEffect(() => {
    const handler = async (e: Event) => {
      const proof = (e as CustomEvent).detail as ProofResult;
      setProofResult(proof);
      const playerName = wallet?.publicKey
        ? wallet.publicKey.slice(0, 4) + "..." + wallet.publicKey.slice(-4)
        : "anon";
      const ok = await submitScore(
        proof,
        playerName,
        proof.journal.bot_config_id,
      );
      if (ok) await fetchPersonalBest();
    };
    window.addEventListener("zk-proof-ready", handler);
    return () => window.removeEventListener("zk-proof-ready", handler);
  }, [submitScore, fetchPersonalBest, wallet?.publicKey]);

  const handleSubmitScore = async () => {
    if (!gameState || !selectedBot) return;
    const botConfig = selectedBot as BotConfigFE;
    if (!botConfig.id) return;
    const tokenId = parseInt(botConfig.id.replace("token_", ""), 10);
    if (isNaN(tokenId)) return;
    await prove(SEED, tokenId, actionLogRef.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || !gameState) return;
    const developerId = active.id as string;
    const threatId = over.id as string;
    setGameState((prev) => {
      if (!prev) return null;
      const targetThreat = prev.threats.find((t) => t.id === threatId);
      if (!targetThreat || targetThreat.isCured || targetThreat.isFailed)
        return prev;
      if (targetThreat.committingDevId || targetThreat.assignedDeveloperId)
        return prev;
      const prevAssignedThreat = prev.threats.find(
        (t) => t.assignedDeveloperId === developerId,
      );
      const prevCommittingThreat = prev.threats.find(
        (t) => t.committingDevId === developerId,
      );
      const previousDevId =
        targetThreat.assignedDeveloperId ?? targetThreat.committingDevId;
      const updatedThreats = prev.threats.map((t) => {
        if (t.id === prevAssignedThreat?.id) {
          const devIndex = prev.developers.findIndex(
            (d) => d.id === prevAssignedThreat.assignedDeveloperId,
          );
          const threatIndex = parseInt(prevAssignedThreat.id.split("-")[1], 10);
          const key = `${devIndex}-${threatIndex}`;
          const open = openAssignmentsRef.current.get(key);
          if (open) {
            actionLogRef.current.push({
              ...open,
              unassigned_at_ms: Date.now() - (prev.startTime ?? 0),
            });
            openAssignmentsRef.current.delete(key);
          }
          return { ...t, assignedDeveloperId: null };
        }
        if (t.id === prevCommittingThreat?.id)
          return { ...t, committingDevId: null, commitProgress: 0 };
        if (t.id === threatId)
          return { ...t, committingDevId: developerId, commitProgress: 0 };
        return t;
      });
      const updatedDevelopers = prev.developers.map((d) => {
        if (d.id === developerId)
          return { ...d, isAssigned: true, assignedToThreatId: threatId };
        if (d.id === previousDevId)
          return { ...d, isAssigned: false, assignedToThreatId: null };
        return d;
      });
      return {
        ...prev,
        threats: updatedThreats,
        developers: updatedDevelopers,
      };
    });
  };

  // ── Bot selection screen ───────────────────────────────────────────────────
  if (!gameState || (!gameState.isPlaying && gameState.defenderWon === null)) {
    return (
      <div
        className="min-h-screen bg-stone-950 text-white p-8"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="text-sm text-stone-600 uppercase tracking-widest">
                zero-trust · defender
              </div>
              <h1 className="text-4xl font-bold text-amber-400">
                defense mode
              </h1>
              <p className="text-stone-500 text-sm">
                select a bot to defend against
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 border border-stone-700 px-4 py-2 text-stone-400 text-sm hover:border-stone-500 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              back
            </button>
          </div>

          <BotSelectGrid
            bots={bots}
            selectedBot={selectedBot}
            onSelect={selectBot}
            isSyncing={isSyncing}
            onRefresh={() => sync(true).then(() => reload())}
          />

          {selectedBot &&
            (() => {
              const vc = getVictoryCondition(selectedBot);
              const meta = VICTORY_META[vc];
              return (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 border border-stone-700 bg-stone-900/50 px-4 py-2">
                    <span className="text-sm text-stone-400">
                      win condition:{" "}
                      <span className="text-white font-bold">{meta.label}</span>
                      {" — "}
                      <span className="text-stone-500">{meta.description}</span>
                    </span>
                  </div>
                  <button
                    onClick={startGame}
                    className="flex items-center gap-2 bg-amber-400 text-stone-950 px-12 py-3 font-bold text-base hover:bg-amber-300 transition uppercase tracking-widest"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    start defense round
                  </button>
                </div>
              );
            })()}
        </div>
      </div>
    );
  }

  // ── Active game ────────────────────────────────────────────────────────────
  const elapsed = ROUND_DURATION - gameState.timeRemaining;
  const activeThreats = gameState.threats.filter(
    (t) => t.spawnTime <= elapsed && !t.isCured && !t.isFailed,
  );
  const activeDeveloper = activeDragId
    ? gameState.developers.find((d) => d.id === activeDragId)
    : null;

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={(e) => setActiveDragId(e.active.id as string)}
    >
      <div
        className="min-h-screen bg-stone-950 p-4"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {/* HUD */}
        <div className="max-w-7xl mx-auto mb-4">
          <div className="border border-stone-800 bg-stone-900/60 p-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-8">
              <HudStat
                label="time"
                value={`${Math.floor(gameState.timeRemaining)}s`}
                alert={
                  gameState.victoryCondition === "time_survival" &&
                  gameState.timeRemaining < 20
                }
              />
              <HudStat
                label="cured"
                value={String(gameState.threatsCured)}
                color="text-green-400"
              />
              <HudStat
                label="destroyed"
                value={String(gameState.systemsDestroyed)}
                color="text-red-400"
              />
            </div>
            <VictoryConditionTracker gameState={gameState} />
          </div>
        </div>

        {/* Main game area */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-base font-bold text-stone-400 uppercase tracking-widest">
              active threats
            </h2>
            <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
              {activeThreats.map((threat) => {
                const developer = gameState.developers.find(
                  (d) =>
                    d.id === threat.assignedDeveloperId ||
                    d.id === threat.committingDevId,
                );
                return (
                  <ThreatCard
                    key={threat.id}
                    threat={threat}
                    developer={developer}
                    isCommitting={!!threat.committingDevId}
                    commitProgress={threat.commitProgress}
                  />
                );
              })}
              {activeThreats.length === 0 && (
                <div className="border border-stone-800 bg-stone-900/30 p-8 text-center text-stone-600 text-sm">
                  waiting for threats to spawn…
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-bold text-stone-400 uppercase tracking-widest">
              developers
            </h2>
            <div className="space-y-2">
              {gameState.developers.map((dev) => {
                const isCommitting = gameState.threats.some(
                  (t) => t.committingDevId === dev.id,
                );
                return (
                  <DeveloperCard
                    key={dev.id}
                    developer={dev}
                    isCommitting={isCommitting}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {showGameOver && gameState.defenderWon !== null && (
          <GameOverDialog
            open={showGameOver}
            defenderWon={gameState.defenderWon}
            endReason={gameState.endReason}
            victoryCondition={gameState.victoryCondition}
            threatsCured={gameState.threatsCured}
            threatsTotal={gameState.threats.length}
            systemsDestroyed={gameState.systemsDestroyed}
            dataLeaked={gameState.dataLeaked}
            personalBest={personalBest}
            score={gameState.score}
            journalScore={proofResult?.journal.score ?? null}
            proverStatus={proverStatus}
            proverError={proverError}
            onSubmitScore={handleSubmitScore}
            onRestart={startGame}
            onExit={() => router.push("/")}
          />
        )}
      </div>

      <DragOverlay>
        {activeDeveloper && (
          <div className="border border-amber-400/50 bg-stone-900 p-3 shadow-xl">
            <span className="text-sm text-white font-semibold">
              {activeDeveloper.name}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function HudStat({
  label,
  value,
  color = "text-white",
  alert = false,
}: {
  label: string;
  value: string;
  color?: string;
  alert?: boolean;
}) {
  return (
    <div>
      <div className="text-sm text-stone-600 uppercase tracking-widest">
        {label}
      </div>
      <div
        className={`text-2xl font-bold tabular-nums ${alert ? "text-red-400 animate-pulse" : color}`}
      >
        {value}
      </div>
    </div>
  );
}

function VictoryConditionTracker({
  gameState,
}: {
  gameState: ExtendedGameState;
}) {
  const { victoryCondition, timeRemaining, systemsDestroyed, dataLeaked } =
    gameState;
  const meta = VICTORY_META[victoryCondition];

  if (victoryCondition === "time_survival") {
    const pct = (timeRemaining / ROUND_DURATION) * 100;
    return (
      <div className="flex-1 min-w-48 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500 uppercase tracking-widest">
            {meta.label}
          </span>
          <span className="text-red-400">bot wins at 0s</span>
        </div>
        <div className="h-2 bg-stone-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-500" : "bg-red-500 animate-pulse"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (victoryCondition === "system_destruction") {
    return (
      <div className="flex-1 min-w-48 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500 uppercase tracking-widest">
            {meta.label}
          </span>
          <span
            className={`font-semibold ${systemsDestroyed >= 2 ? "text-red-400 animate-pulse" : "text-stone-300"}`}
          >
            {systemsDestroyed} / {SYSTEM_DESTRUCTION_THRESHOLD} lost
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: SYSTEM_DESTRUCTION_THRESHOLD }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 transition-all duration-300 ${i < systemsDestroyed ? "bg-red-500" : "bg-stone-700"}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-48 space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-500 uppercase tracking-widest">
          {meta.label}
        </span>
        <span
          className={`font-semibold ${dataLeaked > 70 ? "text-red-400 animate-pulse" : "text-stone-300"}`}
        >
          {dataLeaked.toFixed(0)}% exfiltrated
        </span>
      </div>
      <div className="h-2 bg-stone-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${dataLeaked > 70 ? "bg-red-500 animate-pulse" : dataLeaked > 40 ? "bg-orange-500" : "bg-blue-500"}`}
          style={{ width: `${dataLeaked}%` }}
        />
      </div>
    </div>
  );
}
