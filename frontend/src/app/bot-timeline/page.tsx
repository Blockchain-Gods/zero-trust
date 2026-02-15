"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BotConfig, BotType, SpecialAbility } from "@/lib/types";
import { BOT_TYPES, SPECIAL_ABILITIES } from "@/lib/constants";
import { saveBotToLocalStorage } from "@/lib/storage";
import {
  TimelineProvider,
  Timeline,
  TimelineHeader,
  TimelineGrid,
  TimelineRow,
  TimelineSlot,
  TimelineSlotLabel,
  TimelineSlotContent,
  TimelineSlotData,
  TimelineRowData,
} from "@/components/ui/timeline";
import {
  SpawnCurveChart,
  DamageCurveChart,
} from "@/components/charts-component";
import { cn } from "@/lib/utils";

interface BotCreatorState {
  botName: string;
  botType: BotType;
  timelineSlots: TimelineSlotData[];
}

// Utility functions
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const secondsToTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

const timeToSeconds = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60;
};

export default function BotCreatorWithTimeline() {
  const router = useRouter();
  const [state, setState] = useState<BotCreatorState>({
    botName: "",
    botType: "malware",
    timelineSlots: [],
  });
  const [percentageInView, setPercentageInView] = useState(100);

  const botConfig = BOT_TYPES[state.botType];

  // Calculate tokens
  const tokensUsed = state.timelineSlots.reduce(
    (sum, slot) => sum + (slot.cost || 0),
    0,
  );
  const tokensRemaining = botConfig.baseTokens - tokensUsed;

  // Timeline config: 0-3 hours = 0-180 seconds (1 minute = 1 second)
  const timelineConfig = {
    startHour: 0,
    endHour: 3,
    snapIntervalMinutes: 5, // 5 minutes = 5 seconds
    columnWidth: 160,
  };

  // Timeline rows (one per ability type)
  const timelineRows: TimelineRowData[] = Object.entries(SPECIAL_ABILITIES).map(
    ([abilityId, info]) => ({
      id: abilityId,
      label: info.name,
      icon: info.icon,
    }),
  );

  // Handle slot position change (drag)
  const handleSlotPositionChange = async (
    slotId: string,
    newTime: string,
    newRowId: string,
  ): Promise<boolean> => {
    setState((prev) => ({
      ...prev,
      timelineSlots: prev.timelineSlots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              startTime: newTime,
              rowId: newRowId,
              ability: newRowId as SpecialAbility,
            }
          : slot,
      ),
    }));
    return true;
  };

  // Validate drop (prevent overlaps)
  const validateDrop = (
    slotId: string,
    newTime: string,
    newRowId: string,
  ): boolean => {
    const draggedSlot = state.timelineSlots.find((s) => s.id === slotId);
    if (!draggedSlot) return false;

    const conflicts = state.timelineSlots.filter((s) => {
      if (s.id === slotId) return false;
      if (s.rowId !== newRowId) return false;

      const sStart = timeToMinutes(s.startTime);
      const sEnd = sStart + s.duration;
      const dragStart = timeToMinutes(newTime);
      const dragEnd = dragStart + draggedSlot.duration;

      return dragStart < sEnd && dragEnd > sStart;
    });

    return conflicts.length === 0;
  };

  // Handle slot click (remove)
  const handleSlotClick = (slotId: string) => {
    if (confirm("Remove this ability event?")) {
      setState((prev) => ({
        ...prev,
        timelineSlots: prev.timelineSlots.filter((s) => s.id !== slotId),
      }));
    }
  };

  // Add ability to timeline
  const addAbilityToTimeline = (abilityId: SpecialAbility) => {
    const ability = SPECIAL_ABILITIES[abilityId];
    const isDiscounted = botConfig.specialAbilityDiscount === abilityId;
    const cost = isDiscounted
      ? Math.floor(ability.baseCost * 0.7)
      : ability.baseCost;

    if (tokensRemaining < cost) return;

    const newSlot: TimelineSlotData = {
      id: `slot-${Date.now()}`,
      rowId: abilityId,
      startTime: "00:00",
      duration: 10, // 10 minutes = 10 seconds
      ability: abilityId,
      cost,
      title: ability.name,
      type: abilityId,
    };

    setState((prev) => ({
      ...prev,
      timelineSlots: [...prev.timelineSlots, newSlot],
    }));
  };

  const handleDeploy = () => {
    const abilities = [
      ...new Set(state.timelineSlots.map((s) => s.ability as SpecialAbility)),
    ];

    const fullConfig: BotConfig = {
      botName: state.botName || "Unnamed Bot",
      botType: state.botType,
      primaryTarget: "compute",
      secondaryTargets: [],
      resourceAttack: "cpu",
      damageMultiplier: botConfig.damageMultiplier,
      victoryCondition: "time_survival",
      abilities,
      threatCount: state.timelineSlots.length + 2,
      spawnPattern: "steady",
      skillDiversity: "medium",
      creatorName: "Player",
    };

    saveBotToLocalStorage(fullConfig);
    router.push("/bots");
  };

  // Convert slots for charts
  const chartEvents = state.timelineSlots.map((slot) => ({
    id: slot.id,
    ability: slot.ability as SpecialAbility,
    startTime: timeToSeconds(slot.startTime),
    duration: slot.duration * 60,
    cost: slot.cost || 0,
  }));

  function getAbilityBgClass(abilityId: SpecialAbility): string {
    const colors: Record<SpecialAbility, string> = {
      stealth: "bg-purple-500",
      mutation: "bg-green-500",
      replication: "bg-blue-500",
      encryption: "bg-orange-500",
      persistence: "bg-pink-500",
    };
    return colors[abilityId];
  }

  return (
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
        <div className="max-w-[1800px] mx-auto mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00e5ff]/20 to-[#a78bfa]/20 blur-xl" />
            <div className="relative bg-[#1a2332]/90 backdrop-blur-sm border-2 border-[#00e5ff]/60 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-bold text-[#00e5ff] tracking-wider font-mono">
                    BOT DEVELOPMENT LAB
                  </h1>
                  <p className="text-[#94a3b8] text-sm mt-1">
                    DRAG ABILITIES TO TIMELINE • 1 HOUR = 60 SECONDS
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 bg-[#fbbf24]/20 border border-[#fbbf24]/60 px-4 py-2 rounded">
                    <span className="text-sm text-[#fbbf24]">TOKENS</span>
                    <span className="text-2xl font-bold text-[#fbbf24]">
                      {tokensRemaining}
                    </span>
                    <span className="text-sm text-[#94a3b8]">
                      / {botConfig.baseTokens}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1800px] mx-auto grid grid-cols-12 gap-6">
          {/* Left Panel */}
          <div className="col-span-3 space-y-4">
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
                      setState({ ...state, botType: type, timelineSlots: [] })
                    }
                    className={`p-2 border-2 transition rounded ${
                      state.botType === type
                        ? "border-[#4ade80] bg-[#4ade80]/15"
                        : "border-[#64748b] bg-[#1a2332]/50 hover:border-[#0ff]/60"
                    }`}
                  >
                    <div className="text-2xl mb-1">{info.icon}</div>
                    <div className="text-[9px] text-[#00e5ff] font-bold">
                      {info.name.toUpperCase()}
                    </div>
                    <div className="text-[8px] text-[#94a3b8]">
                      {info.baseTokens}🪙
                    </div>
                  </button>
                ))}
              </div>
            </ConfigPanel>

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
                    {SPECIAL_ABILITIES[botConfig.specialAbilityDiscount].icon}{" "}
                    -30% cost
                  </div>
                )}
              </div>
            </ConfigPanel>

            <ConfigPanel title="ABILITIES SHOP">
              <div className="space-y-2">
                {(
                  Object.entries(SPECIAL_ABILITIES) as [
                    SpecialAbility,
                    (typeof SPECIAL_ABILITIES)[SpecialAbility],
                  ][]
                ).map(([abilityId, info]) => {
                  const isDiscounted =
                    botConfig.specialAbilityDiscount === abilityId;
                  const cost = isDiscounted
                    ? Math.floor(info.baseCost * 0.7)
                    : info.baseCost;
                  const canAfford = tokensRemaining >= cost;

                  return (
                    <button
                      key={abilityId}
                      onClick={() =>
                        canAfford && addAbilityToTimeline(abilityId)
                      }
                      disabled={!canAfford}
                      className={`w-full p-2 border-2 transition rounded text-left ${
                        !canAfford
                          ? "opacity-30 cursor-not-allowed border-[#64748b]"
                          : "border-[#64748b] bg-[#1a2332]/50 hover:border-[#0ff]/60 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{info.icon}</span>
                          <div>
                            <div className="text-[10px] text-[#00e5ff] font-bold">
                              {info.name.toUpperCase()}
                            </div>
                            <div className="text-[8px] text-[#94a3b8]">
                              {info.description.slice(0, 25)}...
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
                            <div className="text-[8px] text-[#4ade80]">
                              -30%
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ConfigPanel>
          </div>

          {/* Center - Timeline */}
          <div className="col-span-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[#00e5ff]/40 blur-3xl animate-pulse" />
              <div className="relative h-32 border-4 border-[#00e5ff]/50 bg-[#1a2332]/30 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="relative text-7xl animate-float">
                  {BOT_TYPES[state.botType].icon}
                </div>
              </div>
            </div>

            <ConfigPanel title="ATTACK TIMELINE (0-180s)">
              <div className="bg-[#0d1b2a] rounded-lg overflow-hidden border-2 border-[#00e5ff]/20">
                <TimelineProvider
                  config={timelineConfig}
                  percentageInView={percentageInView}
                  onSlotPositionChange={handleSlotPositionChange}
                  onValidateDrop={validateDrop}
                  onSlotClick={handleSlotClick}
                >
                  <Timeline slots={state.timelineSlots} rows={timelineRows}>
                    <TimelineGrid>
                      <TimelineHeader
                        columnLabel="Ability"
                        className="bg-[#1a2332] border-[#00e5ff]/30"
                      />
                      {timelineRows.map((row) => (
                        <TimelineRow
                          key={row.id}
                          row={row}
                          slots={state.timelineSlots}
                          className="text-xs bg-[#0d1b2a] border-[#00e5ff]/20"
                          renderRowHeader={(row: TimelineRowData) => (
                            <div className="flex items-center gap-2 px-3">
                              <span className="text-lg">
                                {(row as any).icon}
                              </span>
                              <span className="text-xs text-[#00e5ff] font-bold">
                                {row.label}
                              </span>
                            </div>
                          )}
                        >
                          {(slot: TimelineSlotData) => (
                            <TimelineSlot
                              slot={slot}
                              className={cn(
                                "gap-0 flex flex-col items-start justify-center px-2",
                                getAbilityBgClass(
                                  slot.ability as SpecialAbility,
                                ),
                              )}
                            >
                              <TimelineSlotLabel className="text-white font-bold text-[10px]">
                                {
                                  SPECIAL_ABILITIES[
                                    slot.ability as SpecialAbility
                                  ].icon
                                }{" "}
                                {slot.title}
                              </TimelineSlotLabel>
                              <TimelineSlotContent className="text-white/80 text-[9px]">
                                {slot.cost}🪙 • {slot.duration}min
                              </TimelineSlotContent>
                            </TimelineSlot>
                          )}
                        </TimelineRow>
                      ))}
                    </TimelineGrid>
                  </Timeline>
                </TimelineProvider>
              </div>

              <div className="mt-2 text-[10px] text-[#94a3b8]">
                {botConfig.loopInterval > 0 ? (
                  <span>♾️ Events loop every {botConfig.loopInterval}s</span>
                ) : (
                  <span className="text-[#ff6b35]">⚠️ One-time only</span>
                )}
              </div>
            </ConfigPanel>
          </div>

          {/* Right Panel - Charts */}
          <div className="col-span-3 space-y-4">
            <ConfigPanel title="SPAWN CURVE">
              <SpawnCurveChart
                events={chartEvents}
                loopInterval={botConfig.loopInterval}
              />
            </ConfigPanel>

            <ConfigPanel title="DAMAGE PROJECTION">
              <DamageCurveChart
                events={chartEvents}
                loopInterval={botConfig.loopInterval}
                damageMultiplier={botConfig.damageMultiplier}
              />
            </ConfigPanel>

            <ConfigPanel title="TIMELINE EVENTS">
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {state.timelineSlots.length === 0 ? (
                  <div className="text-[#64748b] text-xs text-center py-4">
                    No events scheduled
                  </div>
                ) : (
                  state.timelineSlots
                    .sort(
                      (a, b) =>
                        timeToSeconds(a.startTime) - timeToSeconds(b.startTime),
                    )
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex justify-between items-center text-xs bg-[#1a2332]/30 p-2 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {
                              SPECIAL_ABILITIES[slot.ability as SpecialAbility]
                                .icon
                            }
                          </span>
                          <div>
                            <div className="text-[#00e5ff] font-bold">
                              {timeToSeconds(slot.startTime)}s
                            </div>
                            <div className="text-[#94a3b8] text-[10px]">
                              {slot.duration}min
                            </div>
                          </div>
                        </div>
                        <span className="text-[#fbbf24]">{slot.cost}🪙</span>
                      </div>
                    ))
                )}
              </div>
            </ConfigPanel>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-[1800px] mx-auto mt-6">
          <div className="bg-[#1a2332]/90 backdrop-blur-sm border-2 border-[#00e5ff]/60 p-4 rounded-lg">
            <div className="flex gap-4 items-center justify-between">
              <button
                onClick={() => router.push("/")}
                className="bg-[#1a2332] border-2 border-[#64748b] px-6 py-3 rounded text-[#94a3b8] font-bold hover:border-[#00e5ff]/60 hover:text-[#00e5ff] transition"
              >
                ← BACK
              </button>

              <button
                onClick={handleDeploy}
                disabled={!state.botType || state.timelineSlots.length === 0}
                className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b35] to-[#fbbf24] blur-lg opacity-80 group-hover:opacity-100 transition" />
                <div className="relative bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] border-2 border-[#fbbf24] px-12 py-3 rounded font-bold text-xl text-white transition">
                  🚀 DEPLOY BOT
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

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
      `}</style>
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
      <div className="relative bg-[#1a2332]/90 backdrop-blur-sm border-2 border-[#00e5ff]/60 p-3 rounded-lg">
        <h3 className="text-[#00e5ff] font-bold text-[10px] mb-2 tracking-wider">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

function getAbilityColor(abilityId: SpecialAbility): string {
  const colors: Record<SpecialAbility, string> = {
    stealth: "#a78bfa",
    mutation: "#4ade80",
    replication: "#3b82f6",
    encryption: "#ff6b35",
    persistence: "#ec4899",
  };
  return colors[abilityId];
}
