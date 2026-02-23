"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  NodeProps,
} from "@xyflow/react";

import { useDroppable } from "@dnd-kit/core";
import { Lock, UserPlus } from "lucide-react";
import { getMatchQuality } from "@/lib/game-logic";
import { ThreatWithCommit, Developer } from "@/lib/types/defense-types";
import { AvailableBot } from "@/hooks/useAvailableBots";

// ─── Layout constants ──────────────────────────────────────────
const NODE_W = 280;
const NODE_H = 200; // approximate, expands with content
const H_GAP = 32; // horizontal gap between nodes
const V_GAP = 60; // vertical gap between rows
const ROW_Y_START = 160; // y offset below bot core
const BOT_X = 0;
const BOT_Y = 0;
const PER_ROW = 3; // max threats per row

function getNodePositions(count: number) {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / PER_ROW);
    const col = i % PER_ROW;
    const rowCount = Math.min(PER_ROW, count - row * PER_ROW);
    const rowWidth = rowCount * NODE_W + (rowCount - 1) * H_GAP;
    const startX = BOT_X - rowWidth / 2 + NODE_W / 2;
    positions.push({
      x: startX + col * (NODE_W + H_GAP) - NODE_W / 2,
      y: ROW_Y_START + row * (NODE_H + V_GAP),
    });
  }
  return positions;
}

// ─── Bot Core Node ─────────────────────────────────────────────
//@ts-ignore
function BotCoreNode({ data }: NodeProps<{ bot?: AvailableBot }>) {
  //@ts-ignore
  const bot = data?.bot;
  return (
    <div
      style={{ width: 260 }}
      className="border border-red-500/40 bg-stone-900 px-4 py-3"
    >
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-red-400 font-bold tracking-widest uppercase">
          {bot?.botName ?? "Bot Core"}
        </span>
        <div className="ml-auto flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1 h-3 bg-red-500/60" />
          ))}
        </div>
      </div>
      <div className="mt-2 h-px bg-red-500/20" />
      {bot ? (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-stone-600">type</span>
            <span className="text-stone-400">{bot.botType}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-stone-600">target</span>
            <span className="text-stone-400">{bot.primaryTarget}</span>
          </div>
          {/* <div className="flex justify-between text-xs">
            <span className="text-stone-600">damage ×</span>
            <span className="text-red-400 font-semibold">
              {bot.damageMultiplier}
            </span>
          </div> */}
          <div className="flex justify-between text-xs">
            <span className="text-stone-600">threats</span>
            <span className="text-stone-400">{bot.threatCount}</span>
          </div>
          {/* {bot.abilities?.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1 pt-1 border-t border-stone-800">
              {bot.abilities.map((a: any) => (
                <span
                  key={a}
                  className="px-1.5 py-0.5 text-xs border border-red-500/20 bg-red-500/5 text-red-400/70"
                >
                  {a}
                </span>
              ))}
            </div>
          )} */}
        </div>
      ) : (
        <div className="mt-2 text-xs text-stone-600 tracking-widest">
          attack in progress
        </div>
      )}
    </div>
  );
}

// ─── Threat Node ───────────────────────────────────────────────
interface ThreatNodeData {
  threat: ThreatWithCommit;
  developer?: Developer;
  isCommitting: boolean;
  commitProgress: number;
}
//@ts-ignore
function ThreatNode({ data }: NodeProps<ThreatNodeData>) {
  //@ts-ignore
  const { threat, developer, isCommitting, commitProgress } = data;

  const { setNodeRef, isOver } = useDroppable({
    id: threat.id,
    data: { threat },
  });

  const damagePercent = Math.min(100, threat.currentDamage);
  const curePercent = Math.min(100, threat.cureProgress);
  const matchQuality =
    developer && !isCommitting ? getMatchQuality(threat, developer) : null;

  const borderClass = isOver
    ? "border-amber-400/60"
    : isCommitting
      ? "border-amber-400/40"
      : threat.assignedDeveloperId
        ? "border-blue-500/40"
        : "border-stone-700";

  return (
    <div
      ref={setNodeRef}
      style={{ width: NODE_W }}
      className={`border bg-stone-900/90 p-3 transition-all ${borderClass} ${isOver ? "scale-[1.02]" : ""}`}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{threat.target.icon}</span>
          <div>
            <div className="text-xs text-white font-semibold">
              {threat.target.name}
            </div>
            <div className="text-xs text-stone-600">
              #{threat.id.split("-")[1]}
            </div>
          </div>
        </div>
        {matchQuality && (
          <div className={`text-xs font-semibold ${matchQuality.color}`}>
            {matchQuality.label}
          </div>
        )}
      </div>

      {/* Required skills */}
      <div className="mb-2">
        <div className="text-xs text-stone-600 mb-1">required skills</div>
        <div className="flex gap-1 flex-wrap">
          {threat.requiredSkills.map((skill: any) => (
            <span
              key={skill.id}
              className={`px-1.5 py-0.5 text-xs border ${
                developer?.skills.some((s: any) => s.id === skill.id)
                  ? "border-green-500/50 bg-green-500/10 text-green-400"
                  : "border-stone-700 bg-stone-800 text-stone-500"
              }`}
            >
              {skill.icon} {skill.name}
            </span>
          ))}
        </div>
      </div>

      {/* Damage bar */}
      <MiniBar
        label="damage"
        value={damagePercent}
        color={
          damagePercent > 70
            ? "bg-red-500"
            : damagePercent > 30
              ? "bg-orange-500"
              : "bg-amber-500"
        }
        labelColor="text-red-400"
        pulse={damagePercent > 70}
      />

      {/* Committing */}
      {isCommitting && developer && (
        <div className="mt-1.5">
          <MiniBar
            label={`committing ${developer.name}…`}
            value={commitProgress}
            color="bg-amber-400"
            labelColor="text-amber-400"
          />
          <div className="text-xs text-stone-700 mt-1">cannot reassign</div>
        </div>
      )}

      {/* Curing */}
      {!isCommitting && developer && (
        <div className="mt-1.5 space-y-1.5">
          <MiniBar
            label="cure progress"
            value={curePercent}
            color="bg-blue-500"
            labelColor="text-blue-400"
          />
          <div className="flex items-center gap-2 border border-stone-700 bg-stone-900 px-2 py-1">
            <span className="text-sm">{developer.avatar}</span>
            <span className="text-xs text-white">{developer.name}</span>
            <Lock className="ml-auto w-3 h-3 text-stone-600" />
          </div>
        </div>
      )}

      {/* Empty drop zone */}
      {!developer && !isCommitting && (
        <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-stone-600 border border-dashed border-stone-800 py-2">
          <UserPlus className="w-3.5 h-3.5" />
          drag developer here
        </div>
      )}
    </div>
  );
}

function MiniBar({
  label,
  value,
  color,
  labelColor,
  pulse = false,
}: {
  label: string;
  value: number;
  color: string;
  labelColor: string;
  pulse?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className={labelColor}>{label}</span>
        <span className={`${labelColor} font-semibold tabular-nums`}>
          {value.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 bg-stone-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${color} ${pulse ? "animate-pulse" : ""}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Glow Edge ─────────────────────────────────────────────────
function GlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: any) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const color = data?.damaged ? "#ef4444" : "#44aaff";
  const dashLen = 8;
  const gapLen = 12;

  return (
    <>
      {/* Glow layer */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: 3,
          strokeOpacity: 0.15,
          filter: `blur(4px)`,
        }}
      />
      {/* Animated dashes */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: 1.2,
          strokeOpacity: 0.5,
          strokeDasharray: `${dashLen} ${gapLen}`,
          strokeDashoffset: 0,
          animation: `edgeDash 1.2s linear infinite`,
          filter: `drop-shadow(0 0 3px ${color})`,
        }}
      />
      {/* Moving bright dot */}
      <circle
        r={3}
        fill={color}
        opacity={0.9}
        filter={`drop-shadow(0 0 4px ${color})`}
      >
        <animateMotion dur="1.8s" repeatCount="indefinite">
          <mpath href={`#${id}`} />
        </animateMotion>
      </circle>
    </>
  );
}

const nodeTypes = { botCore: BotCoreNode, threat: ThreatNode };
const edgeTypes = { glow: GlowEdge };

// ─── Main Board ────────────────────────────────────────────────
interface ThreatFlowBoardProps {
  selectedBot: AvailableBot | null;
  activeThreats: ThreatWithCommit[];
  developers: Developer[];
}

function ThreatFlowBoardInner({
  selectedBot,
  activeThreats = [],
  developers = [],
}: ThreatFlowBoardProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const positions = useMemo(
    () => getNodePositions(activeThreats?.length ?? 0),
    [activeThreats?.length ?? 0],
  );

  const threatCount = activeThreats?.length ?? 0;

  useEffect(() => {
    const positions = getNodePositions(threatCount);

    const botNode = {
      id: "bot-core",
      type: "botCore",
      position: { x: BOT_X - 110, y: BOT_Y },
      data: { bot: selectedBot },
      draggable: false,
      selectable: false,
    };

    const threatNodes = (activeThreats ?? []).map((threat, i) => {
      const developer = (developers ?? []).find(
        (d) =>
          d.id === threat.assignedDeveloperId ||
          d.id === threat.committingDevId,
      );
      return {
        id: threat.id,
        type: "threat",
        position: positions[i] || { x: 0, y: ROW_Y_START },
        data: {
          threat,
          developer,
          isCommitting: !!threat.committingDevId,
          commitProgress: threat.commitProgress,
        },
        draggable: false,
        selectable: false,
      };
    });

    const threatEdges = (activeThreats ?? []).map((threat) => ({
      id: `e-bot-${threat.id}`,
      source: "bot-core",
      target: threat.id,
      type: "glow",
      data: { damaged: threat.currentDamage > 50 },
    }));

    //@ts-ignore
    setNodes([botNode, ...threatNodes]);
    //@ts-ignore
    setEdges(threatEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(activeThreats),
    JSON.stringify(developers),
    JSON.stringify(selectedBot),
  ]);

  // Canvas height based on row count
  const rowCount = Math.ceil((activeThreats?.length ?? 0) / PER_ROW);
  const canvasH = Math.max(420, ROW_Y_START + rowCount * (NODE_H + V_GAP) + 80);

  return (
    <div
      style={{ height: canvasH, minHeight: 420 }}
      className="w-full relative"
    >
      <style>{`
        @keyframes dash { to { stroke-dashoffset: -24; } }
        .react-flow__renderer { background: transparent !important; }
        .react-flow__node { background: transparent !important; border: none !important; padding: 0 !important; }
        .react-flow__handle { opacity: 0 !important; pointer-events: none !important; }
        .react-flow__attribution { display: none !important; }
        .react-flow__background { opacity: 0.3 !important; }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        //@ts-ignore
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 0.9 }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
      >
        {/* Subtle dot grid matching stone-950 theme */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="0.8" fill="rgba(120,113,108,0.2)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </ReactFlow>

      {(activeThreats?.length ?? 0) === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="border border-stone-800 bg-stone-900/30 px-8 py-6 text-center text-stone-600 text-xs tracking-widest">
            waiting for threats to spawn…
          </div>
        </div>
      )}
    </div>
  );
}

export default function ThreatFlowBoard(props: ThreatFlowBoardProps) {
  return (
    <ReactFlowProvider>
      <ThreatFlowBoardInner {...props} />
    </ReactFlowProvider>
  );
}
