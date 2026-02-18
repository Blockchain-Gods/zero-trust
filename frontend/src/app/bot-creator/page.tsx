"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
} from "@dnd-kit/core";
import { BotConfig, BotType, SpecialAbility } from "@/lib/types/types";
import { BOT_TYPES, SPECIAL_ABILITIES } from "@/lib/constants";
import { saveBotToLocalStorage, saveDeployedBot } from "@/lib/storage";
import { VideoTimeline, TimelineEvent } from "@/components/timeline-component";
import {
  SpawnCurveChart,
  DamageCurveChart,
} from "@/components/charts-component";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { useDeployBot } from "@/hooks/useDeployBot";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface BotCreatorState {
  botName: string;
  botType: BotType | null;
  timeline: TimelineEvent[];
}

export default function BotCreatorFinalPage() {
  const router = useRouter();
  const [state, setState] = useState<BotCreatorState>({
    botName: "Sneaky Bot",
    botType: "malware",
    timeline: [],
  });
  const [activeDrag, setActiveDrag] = useState<any>(null);
  const [eventCounter, setEventCounter] = useState(0);
  const {
    deployBot,
    isDeploying,
    tokenId,
    txHash,
    error: deployError,
  } = useDeployBot();
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const botConfig = state.botType ? BOT_TYPES[state.botType] : null;
  const tokensUsed = state.timeline.reduce((sum, event) => sum + event.cost, 0);
  const tokensRemaining = (botConfig?.baseTokens || 100) - tokensUsed;

  useEffect(() => {
    if (isDeploying) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90; // Stop at 90%, wait for actual result
          return prev + 5;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isDeploying]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);

    if (!over) return;

    const dragData = active.data.current;
    const dropData = over.data.current;

    // Moving existing timeline event
    if (dragData?.type === "timeline-event" && dropData?.type === "timeline") {
      const existingEvent = dragData.event as TimelineEvent;
      setState({
        ...state,
        timeline: state.timeline.map((e) =>
          e.id === existingEvent.id
            ? { ...e, startTime: dropData.timestamp, ability: dropData.ability }
            : e,
        ),
      });
    }
    // Drop new ability on timeline
    else if (dragData?.type === "ability" && dropData?.type === "timeline") {
      const abilityId = dragData.abilityId as SpecialAbility;
      const ability = SPECIAL_ABILITIES[abilityId];

      const isDiscounted = botConfig?.specialAbilityDiscount === abilityId;
      const cost = isDiscounted
        ? Math.floor(ability.baseCost * 0.7)
        : ability.baseCost;

      if (tokensRemaining >= cost) {
        setEventCounter((prev) => prev + 1);
        const newEvent: TimelineEvent = {
          id: `event-${eventCounter}`,
          ability: abilityId,
          startTime: dropData.timestamp,
          duration: 10,
          cost,
        };

        setState({
          ...state,
          timeline: [...state.timeline, newEvent],
        });
      }
    }
  };

  const removeEvent = (eventId: string) => {
    setState({
      ...state,
      timeline: state.timeline.filter((e) => e.id !== eventId),
    });
  };

  const handleDeploy = async () => {
    const fullConfig: BotConfig = {
      botName: state.botName || "Unnamed Bot",
      botType: state.botType || "malware",
      primaryTarget: "compute",
      secondaryTargets: [],
      resourceAttack: "cpu",
      damageMultiplier: botConfig?.damageMultiplier || 1.0,
      victoryCondition: "time_survival",
      abilities: [...new Set(state.timeline.map((e) => e.ability))], // unique abilities
      threatCount: state.timeline.length + 2,
      spawnPattern: "steady",
      skillDiversity: "medium",
      // creatorName: "Player",
    };

    setProgress(10);
    const deployedTokenId = await deployBot(fullConfig);

    if (deployedTokenId) {
      setProgress(100);
      saveDeployedBot(fullConfig, deployedTokenId);
      setShowSuccess(true);
      // router.push("/bots");
    }
    // saveBotToLocalStorage(fullConfig);
    // console.log("🤖 Bot Config:", fullConfig);
    // router.push("/bots");
  };

  return (
    <>
      <DndContext
        onDragEnd={handleDragEnd}
        onDragStart={(e) => setActiveDrag(e.active.data.current)}
      >
        <div className="min-h-screen bg-[#0d1b2a] relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-15">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(90deg, #00e5ff 1px, transparent 1px), linear-gradient(0deg, #00e5ff 1px, transparent 1px)`,
                backgroundSize: "50px 50px",
              }}
            />
          </div>

          <div className="relative z-10 p-6">
            {/* Header */}
            <div className="max-w-400 mx-auto mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-r from-[#00e5ff]/20 to-[#a78bfa]/20 blur-xl" />
                <div className="relative bg-[#1a2332]/90 backdrop-blur-sm border-2 border-[#00e5ff]/60 p-4 ">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-4xl font-bold text-[#00e5ff] tracking-wider font-mono">
                        BOT DEVELOPMENT LAB
                      </h1>
                      <p className="text-[#94a3b8] text-sm mt-1">
                        DRAG ABILITIES TO TIMELINE • DESIGN YOUR ATTACK PATTERN
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 bg-[#fbbf24]/20 border border-[#fbbf24]/60 px-4 py-2 ">
                        <span className="text-sm text-[#fbbf24]">TOKENS</span>
                        <span className="text-2xl font-bold text-[#fbbf24]">
                          {tokensRemaining}
                        </span>
                        <span className="text-sm text-[#94a3b8]">
                          / {botConfig?.baseTokens || 100}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-400 mx-auto grid grid-cols-12 gap-6">
              {/* Left Panel - Bot Config & Abilities */}
              <div className="col-span-3 space-y-4">
                {/* Bot Identity */}
                <ConfigPanel title="BOT IDENTITY">
                  <input
                    type="text"
                    value={state.botName}
                    onChange={(e) =>
                      setState({ ...state, botName: e.target.value })
                    }
                    placeholder="ENTER BOT NAME..."
                    className="w-full bg-[#1a2332]/50 border-2 border-[#00e5ff]/30 text-[#00e5ff] px-3 py-2 font-mono text-sm focus:border-[#00e5ff] focus:outline-none rounded"
                  />
                </ConfigPanel>

                {/* Bot Type */}
                <ConfigPanel title="BOT TYPE">
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      Object.entries(BOT_TYPES) as [
                        BotType,
                        (typeof BOT_TYPES)[BotType],
                      ][]
                    ).map(([type, info]) => (
                      <button
                        key={type}
                        onClick={() =>
                          setState({ ...state, botType: type, timeline: [] })
                        }
                        className={`p-2 border-2 transition rounded ${
                          state.botType === type
                            ? "border-[#4ade80] bg-[#4ade80]/15"
                            : "border-[#64748b] bg-[#1a2332]/50 hover:border-[#0ff]/60"
                        }`}
                      >
                        <Image
                          src={info.icon}
                          alt={info.name}
                          width={50}
                          height={50}
                          className="mb-2 mx-auto"
                        />
                        <div className="text-md text-[#00e5ff] font-bold leading-tight">
                          {info.name.toUpperCase()}
                        </div>
                        <div className="text-sm text-[#94a3b8] mt-1">
                          {info.baseTokens}
                        </div>
                      </button>
                    ))}
                  </div>
                </ConfigPanel>

                {/* Bot Stats */}
                {botConfig && (
                  <ConfigPanel title="BOT STATS">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">Damage:</span>
                        <span className="text-[#00e5ff] font-bold">
                          {botConfig.damageMultiplier}x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">Loop:</span>
                        <span className="text-[#00e5ff] font-bold">
                          {botConfig.loopInterval === 0
                            ? "NO LOOP"
                            : `${botConfig.loopInterval}s`}
                        </span>
                      </div>
                      {botConfig.specialAbilityDiscount && (
                        <div className="text-[10px] text-[#4ade80] mt-2 p-2 bg-[#4ade80]/10 rounded">
                          💰{" "}
                          {
                            SPECIAL_ABILITIES[botConfig.specialAbilityDiscount]
                              .icon
                          }{" "}
                          -30% cost
                        </div>
                      )}
                    </div>
                  </ConfigPanel>
                )}

                {/* Abilities Palette */}
                <ConfigPanel title="ABILITIES SHOP">
                  <div className="space-y-2 max-h-100 overflow-y-auto">
                    {(
                      Object.entries(SPECIAL_ABILITIES) as [
                        SpecialAbility,
                        (typeof SPECIAL_ABILITIES)[SpecialAbility],
                      ][]
                    ).map(([abilityId, info]) => {
                      const isDiscounted =
                        botConfig?.specialAbilityDiscount === abilityId;
                      const cost = isDiscounted
                        ? Math.floor(info.baseCost * 0.7)
                        : info.baseCost;
                      const canAfford = tokensRemaining >= cost;

                      return (
                        <DraggableAbility
                          key={abilityId}
                          abilityId={abilityId}
                          info={info}
                          cost={cost}
                          isDiscounted={isDiscounted}
                          canAfford={canAfford}
                        />
                      );
                    })}
                  </div>
                </ConfigPanel>
              </div>

              {/* Center - Timeline */}
              <div className="col-span-6 space-y-4">
                {/* Bot Preview */}
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-700/40 blur-3xl animate-pulse" />
                  <div className="relative h-80 border-4 border-[#00e5ff]/50 bg-rose-950/30 backdrop-blur-sm rounded-lg overflow-hidden flex items-center justify-center">
                    <FlickeringGrid
                      className="absolute inset-0 z-0"
                      squareSize={4}
                      gridGap={6}
                      color="#ef4444"
                      maxOpacity={0.5}
                      flickerChance={0.1}
                    />
                    <div className="relative z-10 text-8xl animate-float">
                      {state.botType ? (
                        <Image
                          src={BOT_TYPES[state.botType].icon}
                          alt={BOT_TYPES[state.botType].name}
                          width={180}
                          height={180}
                          className="mb-1 mx-auto"
                        />
                      ) : (
                        "❓"
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <ConfigPanel title="ATTACK TIMELINE">
                  <VideoTimeline
                    events={state.timeline}
                    onRemoveEvent={removeEvent}
                    loopInterval={botConfig?.loopInterval || 0}
                    maxTime={180}
                  />
                </ConfigPanel>

                {/* Instructions */}
                <div className="text-[10px] text-[#94a3b8] bg-[#1a2332]/50 p-3 rounded border border-[#64748b]/30">
                  💡 <strong>Tip:</strong> Drag abilities from the shop onto the
                  timeline. Each ability creates a timed event. Events loop
                  based on your bot type (Worm = 60s, Standard = 90s, Logic Bomb
                  = no loop).
                </div>
              </div>

              {/* Right Panel - Charts */}
              <div className="col-span-3 space-y-4">
                {/* Spawn Chart */}
                <ConfigPanel title="SPAWN CURVE">
                  <SpawnCurveChart
                    events={state.timeline}
                    loopInterval={botConfig?.loopInterval || 0}
                  />
                </ConfigPanel>

                {/* Damage Chart */}
                <ConfigPanel title="DAMAGE PROJECTION">
                  <DamageCurveChart
                    events={state.timeline}
                    loopInterval={botConfig?.loopInterval || 0}
                    damageMultiplier={botConfig?.damageMultiplier || 1.0}
                  />
                </ConfigPanel>

                {/* Event Summary */}
                <ConfigPanel title="TIMELINE EVENTS">
                  <div className="space-y-1 max-h-50 overflow-y-auto">
                    {state.timeline.length === 0 ? (
                      <div className="text-[#64748b] text-xs text-center py-4">
                        No events scheduled
                      </div>
                    ) : (
                      state.timeline
                        .sort((a, b) => a.startTime - b.startTime)
                        .map((event) => (
                          <div
                            key={event.id}
                            className="flex justify-between items-center text-xs bg-[#1a2332]/30 p-2 rounded"
                          >
                            <div className="flex items-center gap-2">
                              {/* <span className="text-lg">
                              {SPECIAL_ABILITIES[event.ability].icon}
                            </span> */}
                              <Image
                                src={SPECIAL_ABILITIES[event.ability].icon}
                                alt={SPECIAL_ABILITIES[event.ability].name}
                                width={40}
                                height={40}
                                className="my-auto mx-auto"
                              />
                              <div>
                                <div className="text-[#00e5ff] font-bold">
                                  {event.startTime}s
                                </div>
                                <div className="text-[#94a3b8] text-[10px]">
                                  {event.duration}s duration
                                </div>
                              </div>
                            </div>
                            <span className="text-[#fbbf24]">
                              {event.cost}🪙
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </ConfigPanel>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="max-w-400 mx-auto mt-6">
              <div className="bg-[#1a2332]/90 backdrop-blur-sm border-2 border-[#00e5ff]/60 p-4 ">
                <div className="flex gap-4 items-center justify-between">
                  <button
                    onClick={() => router.push("/")}
                    className="bg-[#1a2332] border-2 border-[#64748b] px-6 py-3 rounded text-[#94a3b8] font-bold hover:border-[#00e5ff]/60 hover:text-[#00e5ff] transition"
                  >
                    ← BACK
                  </button>

                  <button
                    onClick={handleDeploy}
                    disabled={!state.botType || state.timeline.length === 0}
                    className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-[#ff6b35] to-[#fbbf24] blur-lg opacity-80 group-hover:opacity-100 transition" />
                    <div className="relative bg-linear-to-r from-[#ff6b35] to-[#ff8c42] border-2 border-[#fbbf24] px-12 py-3 rounded font-bold text-xl text-white hover:from-[#ff8c42] hover:to-[#fbbf24] transition">
                      DEPLOY BOT
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeDrag && (
              <div className="bg-[#00ffff]/25 border-2 h-16 border-[#0ff]/20 p-3 rounded backdrop-blur-sm">
                {/* <Image
                src={
                  SPECIAL_ABILITIES[activeDrag.abilityId].icon ||
                  activeDrag.icon
                }
                alt={
                  SPECIAL_ABILITIES[activeDrag.abilityId]?.name ||
                  activeDrag.name
                }
                width={50}
                height={50}
                className="mb-2 mx-auto"
              /> */}
              </div>
            )}
          </DragOverlay>

          <style jsx global>{`
            @keyframes float {
              0%,
              100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-20px);
              }
            }

            .animate-float {
              animation: float 3s ease-in-out infinite;
            }

            .clip-corners {
              clip-path: polygon(
                0 8px,
                8px 0,
                calc(100% - 8px) 0,
                100% 8px,
                100% calc(100% - 8px),
                calc(100% - 8px) 100%,
                8px 100%,
                0 calc(100% - 8px)
              );
            }
          `}</style>
        </div>
      </DndContext>

      {/* Deploying Dialog */}
      <AlertDialog open={isDeploying}>
        <AlertDialogContent className="bg-[#0d1b2a] border-[#00e5ff]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#00e5ff] flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Deploying Bot to Blockchain
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {progress < 30 && "Building transaction..."}
              {progress >= 30 && progress < 60 && "Signing with your wallet..."}
              {progress >= 60 &&
                progress < 90 &&
                "Submitting to Stellar network..."}
              {progress >= 90 && "Waiting for confirmation..."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <Progress value={progress} className="h-2" />

            {txHash && (
              <p className="text-xs text-white/50 font-mono break-all bg-black/40 p-2 rounded">
                {txHash}
              </p>
            )}

            {deployError && (
              <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                ⚠️ {deployError}
              </p>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent className="bg-[#0d1b2a] border-emerald-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-500 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              Bot Deployed Successfully!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your bot has been minted as an NFT on the Stellar blockchain.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="bg-black/40 rounded-lg p-4 border border-white/10">
              <p className="text-xs text-white/50 mb-1">Token ID</p>
              <p className="text-2xl font-mono font-bold text-white">
                {tokenId}
              </p>
            </div>

            {txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#00e5ff] hover:underline flex items-center gap-1"
              >
                View on Stellar Expert
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </div>

          <AlertDialogFooter>
            <Button
              onClick={() => router.push("/bots")}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
            >
              View My Bots
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Components

function DraggableAbility({
  abilityId,
  info,
  cost,
  isDiscounted,
  canAfford,
}: {
  abilityId: SpecialAbility;
  info: (typeof SPECIAL_ABILITIES)[SpecialAbility];
  cost: number;
  isDiscounted: boolean;
  canAfford: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `ability-${abilityId}`,
    data: { type: "ability", abilityId, icon: info.icon },
    disabled: !canAfford,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-2 border-2 transition rounded ${
        !canAfford
          ? "opacity-30 cursor-not-allowed border-[#64748b]"
          : isDragging
            ? "opacity-50 border-[#0ff]"
            : "border-[#64748b] bg-[#1a2332]/50 hover:border-[#0ff]/60 cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src={info.icon}
            alt={info.name}
            width={50}
            height={50}
            className="mb-2 mx-auto"
          />
          <div>
            <div className="text-[10px] text-[#00e5ff] font-bold">
              {info.name.toUpperCase()}
            </div>
            <div className="text-xs text-[#94a3b8] text-wrap">
              {info.description}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div
            className={`text-sm font-bold ${isDiscounted ? "text-[#4ade80]" : "text-[#fbbf24]"}`}
          >
            {cost}🪙
          </div>
          {isDiscounted && (
            <div className="text-[8px] text-[#4ade80]">-30%</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfigPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-[#00e5ff]/12 blur-xl" />
      <div className="relative bg-[#1a2332]/90 backdrop-blur-sm border-2 border-[#00e5ff]/60 p-3 ">
        <h3 className="text-[#00e5ff] font-bold text-[10px] mb-2 tracking-wider">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}
