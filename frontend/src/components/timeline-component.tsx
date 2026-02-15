"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { SpecialAbility } from "@/lib/types";
import { SPECIAL_ABILITIES } from "@/lib/constants";

export interface TimelineEvent {
  id: string;
  ability: SpecialAbility;
  startTime: number; // seconds
  duration: number; // seconds (5, 10, 15, etc)
  cost: number;
}

interface TimelineProps {
  events: TimelineEvent[];
  onRemoveEvent: (id: string) => void;
  loopInterval: number;
  maxTime?: number;
}

export function VideoTimeline({
  events,
  onRemoveEvent,
  loopInterval,
  maxTime = 180,
}: TimelineProps) {
  const timeMarkers = Array.from(
    { length: Math.floor(maxTime / 5) + 1 },
    (_, i) => i * 15,
  );
  const pixelsPerSecond = 4; // 1 second = 4px
  const timelineWidth = maxTime * pixelsPerSecond;

  // Group events by ability type (for tracks)
  const tracks: Record<SpecialAbility, TimelineEvent[]> = {} as any;
  events.forEach((event) => {
    if (!tracks[event.ability]) tracks[event.ability] = [];
    tracks[event.ability].push(event);
  });

  return (
    <div className="relative overflow-x-auto">
      <div
        className="relative bg-[#0d1b2a] border-2 border-[#00e5ff]/30 rounded"
        style={{ width: timelineWidth, minWidth: "100%" }}
      >
        {/* Time markers */}
        <div className="relative left-30 h-8 border-b border-[#64748b]/30">
          {timeMarkers.map((time) => (
            <div
              key={time}
              className="absolute top-0 h-full border-l border-[#64748b]/30"
              style={{ left: time * pixelsPerSecond }}
            >
              <div className="text-[10px] text-[#94a3b8] ml-1 mt-1">
                {time}s
              </div>
            </div>
          ))}

          {/* 90s marker (main duration) */}
          <div
            className="absolute top-0 h-full border-l-2 border-[#fbbf24]/60"
            style={{ left: 90 * pixelsPerSecond }}
          >
            <div className="text-[10px] text-[#fbbf24] font-bold ml-1 mt-1">
              90s
            </div>
          </div>

          {/* Loop markers */}
          {loopInterval > 0 &&
            Array.from(
              { length: Math.floor(maxTime / loopInterval) },
              (_, i) => (i + 1) * loopInterval,
            ).map((loopTime) => (
              <div
                key={`loop-${loopTime}`}
                className="absolute top-0 h-full border-l border-dashed border-[#a78bfa]/40"
                style={{ left: loopTime * pixelsPerSecond }}
              >
                <div className="text-[8px] text-[#a78bfa] ml-1">♾️</div>
              </div>
            ))}
        </div>

        {/* Tracks */}
        <div className="relative">
          {Object.entries(SPECIAL_ABILITIES).map(([abilityId, info]) => (
            <TimelineTrack
              key={abilityId}
              ability={abilityId as SpecialAbility}
              abilityInfo={info}
              events={tracks[abilityId as SpecialAbility] || []}
              onRemoveEvent={onRemoveEvent}
              pixelsPerSecond={pixelsPerSecond}
              maxTime={maxTime}
            />
          ))}
        </div>
      </div>

      {/* Loop info */}
      {loopInterval > 0 && (
        <div className="mt-2 text-[10px] text-[#94a3b8] flex items-center gap-2">
          <span className="text-[#a78bfa]">♾️</span>
          <span>Events loop every {loopInterval}s</span>
        </div>
      )}
      {loopInterval === 0 && (
        <div className="mt-2 text-[10px] text-[#ff6b35] flex items-center gap-2">
          <span>⚠️</span>
          <span>One-time only (no loop)</span>
        </div>
      )}
    </div>
  );
}

function TimelineTrack({
  ability,
  abilityInfo,
  events,
  onRemoveEvent,
  pixelsPerSecond,
  maxTime,
}: {
  ability: SpecialAbility;
  abilityInfo: (typeof SPECIAL_ABILITIES)[SpecialAbility];
  events: TimelineEvent[];
  onRemoveEvent: (id: string) => void;
  pixelsPerSecond: number;
  maxTime: number;
}) {
  const hasEvents = events.length > 0;

  return (
    <div
      className={`relative h-12 border-b border-[#64748b]/20 ${hasEvents ? "bg-[#1a2332]/30" : ""}`}
    >
      {/* Track label */}
      <div className="absolute left-0 top-0 h-full w-30 flex items-center gap-2 px-2 bg-[#0d1b2a] border-r border-[#64748b]/30 z-10">
        <span className="text-lg">{abilityInfo.icon}</span>
        <span className="text-[9px] text-[#00e5ff] font-bold">
          {abilityInfo.name.split(" ")[0].toUpperCase()}
        </span>
      </div>

      {/* Drop zones every 5 seconds */}
      <div className="absolute left-20 top-0 h-full right-0">
        {Array.from({ length: Math.floor(maxTime / 5) }, (_, i) => i * 5).map(
          (time) => (
            <TimelineDropZone
              key={`${ability}-${time}`}
              ability={ability}
              timestamp={time}
              pixelsPerSecond={pixelsPerSecond}
            />
          ),
        )}

        {/* Event blocks */}
        {events.map((event) => (
          <TimelineEventBlock
            key={event.id}
            event={event}
            abilityInfo={abilityInfo}
            onRemove={() => onRemoveEvent(event.id)}
            pixelsPerSecond={pixelsPerSecond}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineDropZone({
  ability,
  timestamp,
  pixelsPerSecond,
}: {
  ability: SpecialAbility;
  timestamp: number;
  pixelsPerSecond: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-${ability}-${timestamp}`,
    data: { type: "timeline", ability, timestamp },
  });

  return (
    <div
      ref={setNodeRef}
      className={`absolute top-0 h-full transition ${
        isOver ? "bg-[#0ff]/20 border-2 border-[#0ff]" : ""
      }`}
      style={{
        left: timestamp * pixelsPerSecond,
        width: 5 * pixelsPerSecond, // 5 second slots
      }}
    />
  );
}

function TimelineEventBlock({
  event,
  abilityInfo,
  onRemove,
  pixelsPerSecond,
}: {
  event: TimelineEvent;
  abilityInfo: (typeof SPECIAL_ABILITIES)[SpecialAbility];
  onRemove: () => void;
  pixelsPerSecond: number;
}) {
  const colorMap: Record<SpecialAbility, string> = {
    stealth: "from-purple-500 to-purple-700",
    mutation: "from-green-500 to-green-700",
    replication: "from-blue-500 to-blue-700",
    encryption: "from-orange-500 to-orange-700",
    persistence: "from-pink-500 to-pink-700",
  };

  return (
    <div
      className={`absolute top-1 h-10 rounded group cursor-pointer bg-linear-to-r ${colorMap[event.ability]} border-2 border-white/20 hover:border-white/40 transition`}
      style={{
        left: event.startTime * pixelsPerSecond,
        width: event.duration * pixelsPerSecond,
      }}
    >
      <div className="relative h-full px-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-lg">{abilityInfo.icon}</span>
          <div>
            <div className="text-[10px] font-bold text-white">
              {abilityInfo.name}
            </div>
            <div className="text-[8px] text-white/70">{event.duration}s</div>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="w-5 h-5 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition hover:bg-red-400"
        >
          ×
        </button>
      </div>

      {/* Cost badge */}
      <div className="absolute -top-2 -right-2 bg-[#fbbf24] text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full">
        {event.cost}🪙
      </div>
    </div>
  );
}
