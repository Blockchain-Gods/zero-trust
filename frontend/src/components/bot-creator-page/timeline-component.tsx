"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { SpecialAbilityTag } from "@/lib/types/types";
import { SPECIAL_ABILITIES } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Ban, X } from "lucide-react";
import Image from "next/image";

export interface TimelineEvent {
  id: string;
  ability: SpecialAbilityTag;
  startTime: number;
  duration: number;
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
    { length: Math.floor(maxTime / 15) + 1 },
    (_, i) => i * 15,
  );
  const pixelsPerSecond = 4;
  const timelineWidth = maxTime * pixelsPerSecond;

  const tracks: Record<SpecialAbilityTag, TimelineEvent[]> = {} as any;
  events.forEach((event) => {
    if (!tracks[event.ability]) tracks[event.ability] = [];
    tracks[event.ability].push(event);
  });

  return (
    <div className="relative overflow-x-clip">
      <div
        className="relative bg-stone-950 border border-stone-800"
        style={{ width: timelineWidth, minWidth: "100%" }}
      >
        {/* Time ruler */}
        <div className="relative h-8 border-b border-stone-800 ml-28">
          {timeMarkers.map((time) => (
            <div
              key={time}
              className="absolute top-0 h-full border-l border-stone-800"
              style={{ left: time * pixelsPerSecond }}
            >
              <span className="text-sm text-stone-600 ml-1 mt-1 inline-block">
                {time}s
              </span>
            </div>
          ))}
          {/* 90s marker */}
          <div
            className="absolute top-0 h-full border-l-2 border-amber-400/50"
            style={{ left: 90 * pixelsPerSecond }}
          >
            <span className="text-sm text-amber-400 font-bold ml-1 mt-1 inline-block">
              90s
            </span>
          </div>
          {/* Loop markers */}
          {loopInterval > 0 &&
            Array.from(
              { length: Math.floor(maxTime / loopInterval) },
              (_, i) => (i + 1) * loopInterval,
            ).map((loopTime) => (
              <div
                key={`loop-${loopTime}`}
                className="absolute top-0 h-full border-l border-dashed border-violet-400/40"
                style={{ left: loopTime * pixelsPerSecond }}
              >
                <RefreshCw className="w-3 h-3 text-violet-400 ml-0.5 mt-1" />
              </div>
            ))}
        </div>

        {/* Tracks */}
        <div className="relative">
          {Object.entries(SPECIAL_ABILITIES).map(([abilityId, info]) => (
            <TimelineTrack
              key={abilityId}
              ability={abilityId as SpecialAbilityTag}
              abilityInfo={info}
              events={tracks[abilityId as SpecialAbilityTag] || []}
              onRemoveEvent={onRemoveEvent}
              pixelsPerSecond={pixelsPerSecond}
              maxTime={maxTime}
            />
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-2 flex items-center gap-4">
        {loopInterval > 0 ? (
          <div className="text-sm text-stone-500 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-violet-400" />
            events loop every {loopInterval}s
          </div>
        ) : (
          <div className="text-sm text-orange-400 flex items-center gap-1.5">
            <Ban className="w-3 h-3" />
            one-time only — no loop
          </div>
        )}
      </div>
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
  ability: SpecialAbilityTag;
  abilityInfo: (typeof SPECIAL_ABILITIES)[SpecialAbilityTag];
  events: TimelineEvent[];
  onRemoveEvent: (id: string) => void;
  pixelsPerSecond: number;
  maxTime: number;
}) {
  const hasEvents = events.length > 0;

  return (
    <div
      className={`relative h-16 border-b border-stone-800/50 ${hasEvents ? "bg-stone-900/20" : ""}`}
    >
      {/* Track label */}
      <div className="absolute left-0 top-0 h-full w-28 flex items-center justify-center bg-stone-950 border-r border-stone-800 z-10 shrink-0">
        <Image
          src={abilityInfo.icon}
          alt={abilityInfo.name}
          width={36}
          height={36}
        />
      </div>

      {/* Drop zones + events */}
      <div className="absolute left-28 top-0 h-full right-0">
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
  ability: SpecialAbilityTag;
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
        isOver ? "bg-amber-400/10 border-x border-amber-400/50" : ""
      }`}
      style={{ left: timestamp * pixelsPerSecond, width: 10 * pixelsPerSecond }}
    />
  );
}

const COLOR_MAP: Record<SpecialAbilityTag, string> = {
  stealth: "from-purple-400/20 to-purple-500/20 border-purple-400/40",
  mutation: "from-green-400/20 to-green-500/20 border-green-400/40",
  replication: "from-blue-400/20 to-blue-500/20 border-blue-400/40",
  encryption: "from-orange-400/20 to-orange-500/20 border-orange-400/40",
  persistence: "from-pink-400/20 to-pink-500/20 border-pink-400/40",
};

function TimelineEventBlock({
  event,
  abilityInfo,
  onRemove,
  pixelsPerSecond,
}: {
  event: TimelineEvent;
  abilityInfo: (typeof SPECIAL_ABILITIES)[SpecialAbilityTag];
  onRemove: () => void;
  pixelsPerSecond: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { type: "timeline-event", event },
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`absolute h-full group cursor-move bg-gradient-to-r border ${COLOR_MAP[event.ability]} hover:brightness-125 transition ${isDragging ? "opacity-40" : ""}`}
            style={{
              left: event.startTime * pixelsPerSecond,
              width: event.duration * pixelsPerSecond,
            }}
          >
            <div className="h-full flex items-center justify-center">
              <Image
                src={abilityInfo.icon}
                alt={abilityInfo.name}
                width={28}
                height={28}
              />
            </div>
            <button
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500/60 hover:bg-red-500 text-white flex items-center justify-center border border-stone-900 transition"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-stone-900 border-stone-700"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <div className="space-y-1">
            <div className="font-bold text-amber-400 text-sm">
              {abilityInfo.name}
            </div>
            <div className="text-stone-400 text-sm">
              {abilityInfo.description}
            </div>
            <div className="text-stone-300 text-sm">
              {event.duration}s duration
            </div>
            <div className="text-amber-400 font-bold text-sm">
              {event.cost}t
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
