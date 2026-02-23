"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
} from "@dnd-kit/core";
import {
  BotConfigFE,
  BotTypeTag,
  SpecialAbilityTag,
  TagOf,
} from "@/lib/types/types";
import { BOT_TYPES, BOTS_VERSION, SPECIAL_ABILITIES } from "@/lib/constants";
import { saveDeployedBot } from "@/lib/storage";
import {
  VideoTimeline,
  TimelineEvent,
} from "@/components/bot-creator-page/timeline-component";
import {
  SpawnCurveChart,
  DamageCurveChart,
} from "@/components/bot-creator-page/charts-component";
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
import {
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Rocket,
  Coins,
  Info,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { slugify } from "@/lib/utils";

interface BotCreatorState {
  botName: string;
  botType: BotTypeTag | null;
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
        setProgress((prev) => (prev >= 90 ? 90 : prev + 5));
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
    } else if (dragData?.type === "ability" && dropData?.type === "timeline") {
      const abilityId = dragData.abilityId as SpecialAbilityTag;
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
        setState({ ...state, timeline: [...state.timeline, newEvent] });
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
    const fullConfig: BotConfigFE = {
      botName: state.botName || "Unnamed Bot",
      botType: state.botType || "malware",
      primaryTarget: "compute",
      secondaryTargets: [],
      resourceAttack: "cpu",
      damageMultiplier: botConfig?.damageMultiplier || 1.0,
      victoryCondition: botConfig?.victoryCondition || "time_survival",
      abilities: [...new Set(state.timeline.map((e) => e.ability))],
      threatCount: state.timeline.length + 2,
      spawnPattern: "steady",
      skillDiversity: "medium",
      version: BOTS_VERSION,
    };
    setProgress(10);
    const deployedTokenId = await deployBot(fullConfig);
    if (deployedTokenId) {
      setProgress(100);
      saveDeployedBot(fullConfig, deployedTokenId);
      setShowSuccess(true);
    }
  };

  return (
    <>
      <DndContext
        onDragEnd={handleDragEnd}
        onDragStart={(e) => setActiveDrag(e.active.data.current)}
      >
        <div
          className="min-h-screen bg-stone-950 text-white"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="max-w-screen-2xl mx-auto mb-6">
              <div className="border border-stone-800 bg-stone-900/40 p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-stone-600 uppercase tracking-widest mb-1">
                    zero-trust · attacker
                  </div>
                  <h1 className="text-2xl font-bold text-amber-400 uppercase tracking-wider">
                    bot development lab
                  </h1>
                  <p className="text-stone-500 text-sm mt-1">
                    drag abilities to timeline · design your attack pattern
                  </p>
                </div>
                <div className="flex items-center gap-2 border border-amber-400/30 bg-amber-400/5 px-4 py-3">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-stone-500 uppercase tracking-widest">
                    tokens
                  </span>
                  <span className="text-3xl font-bold text-amber-400 tabular-nums ml-1">
                    {tokensRemaining}
                  </span>
                  <span className="text-sm text-stone-600">
                    / {botConfig?.baseTokens || 100}
                  </span>
                </div>
              </div>
            </div>

            {/* Main 12-col grid */}
            <div className="max-w-screen-2xl mx-auto grid grid-cols-12 gap-6">
              {/* Left Panel */}
              <div className="col-span-3 space-y-4">
                <ConfigPanel title="bot identity">
                  <input
                    type="text"
                    value={state.botName}
                    onChange={(e) =>
                      setState({ ...state, botName: e.target.value })
                    }
                    placeholder="enter bot name..."
                    className="w-full bg-stone-950 border border-stone-700 text-amber-400 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none placeholder:text-stone-700"
                  />
                </ConfigPanel>

                <ConfigPanel title="bot type">
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      Object.entries(BOT_TYPES) as [
                        BotTypeTag,
                        (typeof BOT_TYPES)[BotTypeTag],
                      ][]
                    ).map(([type, info]) => (
                      <button
                        key={type}
                        onClick={() =>
                          setState({ ...state, botType: type, timeline: [] })
                        }
                        className={`p-2 border transition text-center ${
                          state.botType === type
                            ? "border-amber-400/60 bg-amber-400/10"
                            : "border-stone-700 bg-stone-900/50 hover:border-stone-500"
                        }`}
                      >
                        <Image
                          src={slugify(info.icon)}
                          alt={info.name}
                          width={44}
                          height={44}
                          className="mb-2 mx-auto"
                        />
                        <div className="text-sm text-stone-200 font-bold leading-tight">
                          {info.name.toUpperCase()}
                        </div>
                        <div className="text-sm text-stone-600 mt-0.5">
                          {info.baseTokens}t
                        </div>
                      </button>
                    ))}
                  </div>
                </ConfigPanel>

                {botConfig && (
                  <ConfigPanel title="bot stats">
                    <div className="space-y-2">
                      <StatRow
                        label="damage"
                        value={`${botConfig.damageMultiplier}x`}
                      />
                      <StatRow
                        label="loop"
                        value={
                          botConfig.loopInterval === 0
                            ? "none"
                            : `${botConfig.loopInterval}s`
                        }
                      />
                      {botConfig.specialAbilityDiscount && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-green-400/5 border border-green-400/20">
                          <Image
                            src={
                              SPECIAL_ABILITIES[
                                botConfig.specialAbilityDiscount
                              ].icon
                            }
                            alt={
                              SPECIAL_ABILITIES[
                                botConfig.specialAbilityDiscount
                              ].name
                            }
                            width={24}
                            height={24}
                          />
                          <span className="text-sm text-green-400">
                            -30% cost
                          </span>
                        </div>
                      )}
                    </div>
                  </ConfigPanel>
                )}

                <ConfigPanel title="abilities shop">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(
                      Object.entries(SPECIAL_ABILITIES) as [
                        SpecialAbilityTag,
                        (typeof SPECIAL_ABILITIES)[SpecialAbilityTag],
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

              {/* Center — Timeline */}
              <div className="col-span-6 space-y-4">
                {/* Bot Preview */}
                <div className="relative h-72 border border-stone-800 bg-rose-950/20 overflow-hidden flex items-center justify-center">
                  <FlickeringGrid
                    className="absolute inset-0 z-0"
                    squareSize={4}
                    gridGap={6}
                    color="#ef4444"
                    maxOpacity={0.4}
                    flickerChance={0.1}
                  />
                  <div className="relative z-10 animate-float">
                    {state.botType ? (
                      <Image
                        src={slugify(BOT_TYPES[state.botType].icon)}
                        alt={BOT_TYPES[state.botType].name}
                        width={160}
                        height={160}
                        className="mx-auto drop-shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 border border-dashed border-stone-700 flex items-center justify-center">
                        <span className="text-stone-700 text-sm">none</span>
                      </div>
                    )}
                  </div>
                </div>

                <ConfigPanel title="attack timeline">
                  <VideoTimeline
                    events={state.timeline}
                    onRemoveEvent={removeEvent}
                    loopInterval={botConfig?.loopInterval || 0}
                    maxTime={180}
                  />
                </ConfigPanel>

                <div className="flex gap-2 text-sm text-stone-600 border border-stone-800 bg-stone-900/30 p-3">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-stone-700" />
                  <span>
                    Drag abilities from the shop onto the timeline. Events loop
                    based on your bot type — worm loops at 60s, standard at 90s,
                    logic bomb never loops.
                  </span>
                </div>
              </div>

              {/* Right Panel */}
              <div className="col-span-3 space-y-4">
                <ConfigPanel title="spawn curve">
                  <SpawnCurveChart
                    events={state.timeline}
                    loopInterval={botConfig?.loopInterval || 0}
                  />
                </ConfigPanel>

                <ConfigPanel title="damage projection">
                  <DamageCurveChart
                    events={state.timeline}
                    loopInterval={botConfig?.loopInterval || 0}
                    damageMultiplier={botConfig?.damageMultiplier || 1.0}
                  />
                </ConfigPanel>

                <ConfigPanel title="timeline events">
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {state.timeline.length === 0 ? (
                      <div className="text-stone-600 text-sm text-center py-4">
                        no events scheduled
                      </div>
                    ) : (
                      [...state.timeline]
                        .sort((a, b) => a.startTime - b.startTime)
                        .map((event) => (
                          <div
                            key={event.id}
                            className="flex justify-between items-center border border-stone-800 bg-stone-900/30 p-2"
                          >
                            <div className="flex items-center gap-2">
                              <Image
                                src={SPECIAL_ABILITIES[event.ability].icon}
                                alt={SPECIAL_ABILITIES[event.ability].name}
                                width={28}
                                height={28}
                              />
                              <div>
                                <div className="text-sm text-amber-400 font-bold tabular-nums">
                                  {event.startTime}s
                                </div>
                                <div className="text-sm text-stone-600">
                                  {event.duration}s duration
                                </div>
                              </div>
                            </div>
                            <span className="text-sm text-amber-400 font-bold tabular-nums">
                              {event.cost}t
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </ConfigPanel>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="max-w-screen-2xl mx-auto mt-6">
              <div className="border border-stone-800 bg-stone-900/40 p-4 flex gap-4 items-center justify-between">
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center gap-2 border border-stone-700 px-5 py-2.5 text-stone-400 text-sm font-bold hover:border-stone-500 hover:text-white transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  back
                </button>

                <button
                  onClick={handleDeploy}
                  disabled={!state.botType || state.timeline.length === 0}
                  className="flex items-center gap-2 bg-amber-400 text-stone-950 px-10 py-2.5 font-bold text-sm hover:bg-amber-300 transition disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest"
                >
                  <Rocket className="w-4 h-4" />
                  deploy bot
                </button>
              </div>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeDrag && (
              <div className="bg-amber-400/10 border border-amber-400/40 h-16 w-32" />
            )}
          </DragOverlay>

          <style jsx global>{`
            @keyframes float {
              0%,
              100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-16px);
              }
            }
            .animate-float {
              animation: float 3s ease-in-out infinite;
            }
          `}</style>
        </div>
      </DndContext>

      {/* Deploying Dialog */}
      <AlertDialog open={isDeploying}>
        <AlertDialogContent
          className="bg-stone-900 border-stone-700"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-400 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              deploying bot to blockchain
            </AlertDialogTitle>
            <AlertDialogDescription className="text-stone-400">
              {progress < 30 && "building transaction..."}
              {progress >= 30 && progress < 60 && "signing with your wallet..."}
              {progress >= 60 &&
                progress < 90 &&
                "submitting to stellar network..."}
              {progress >= 90 && "waiting for confirmation..."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Progress value={progress} className="h-0.5" />
            {txHash && (
              <p className="text-sm text-stone-500 font-mono break-all border border-stone-800 bg-stone-950 p-2">
                {txHash}
              </p>
            )}
            {deployError && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/5 p-2 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {deployError}
              </div>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent
          className="bg-stone-900 border-green-500/40"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              bot deployed successfully
            </AlertDialogTitle>
            <AlertDialogDescription className="text-stone-400">
              your bot has been minted as an NFT on the stellar blockchain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="border border-stone-700 bg-stone-950 p-4">
              <p className="text-sm text-stone-600 uppercase tracking-widest mb-1">
                token id
              </p>
              <p className="text-3xl font-bold text-white tabular-nums">
                {tokenId}
              </p>
            </div>
            {txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
              >
                view on stellar expert
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <AlertDialogFooter>
            <Button
              onClick={() => router.push("/bots")}
              className="w-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold uppercase tracking-widest"
            >
              view my bots
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DraggableAbility({
  abilityId,
  info,
  cost,
  isDiscounted,
  canAfford,
}: {
  abilityId: SpecialAbilityTag;
  info: (typeof SPECIAL_ABILITIES)[SpecialAbilityTag];
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
      className={`p-2 border transition ${
        !canAfford
          ? "opacity-30 cursor-not-allowed border-stone-800"
          : isDragging
            ? "opacity-50 border-amber-400/60 bg-amber-400/5"
            : "border-stone-700 bg-stone-900/50 hover:border-stone-500 cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Image
            src={info.icon}
            alt={info.name}
            width={36}
            height={36}
            className="shrink-0"
          />
          <div>
            <div className="text-sm text-stone-200 font-bold">
              {info.name.toUpperCase()}
            </div>
            <div className="text-sm text-stone-500">{info.description}</div>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div
            className={`text-sm font-bold tabular-nums ${isDiscounted ? "text-green-400" : "text-amber-400"}`}
          >
            {cost}t
          </div>
          {isDiscounted && <div className="text-sm text-green-400">-30%</div>}
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
    <div className="border border-stone-800">
      <div className="px-3 py-2 border-b border-stone-800 bg-stone-900/40">
        <h3 className="text-sm text-stone-500 uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-stone-200 font-bold">{value}</span>
    </div>
  );
}
