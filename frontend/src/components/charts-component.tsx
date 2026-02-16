"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import { useRef, useState } from "react";
import { useSpring, useMotionValueEvent } from "framer-motion";
import { TimelineEvent } from "./timeline-component";

interface SpawnChartProps {
  events: TimelineEvent[];
  loopInterval: number;
  damageMultiplier: number;
}

export function SpawnCurveChart({
  events,
  loopInterval,
}: Omit<SpawnChartProps, "damageMultiplier">) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [axis, setAxis] = useState(0);

  const springX = useSpring(0, {
    damping: 30,
    stiffness: 100,
  });
  const springY = useSpring(0, {
    damping: 30,
    stiffness: 100,
  });

  useMotionValueEvent(springX, "change", (latest) => {
    setAxis(latest);
  });

  // Generate spawn data
  const chartData = generateSpawnData(events, loopInterval);

  const chartConfig = {
    spawns: {
      label: "Threats",
      color: "#4ade80",
    },
  } satisfies ChartConfig;

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[#64748b] text-sm">
        Add abilities to see spawn curve
      </div>
    );
  }

  return (
    <div className="relative">
      {/* <div className="absolute top-2 left-2 z-10">
        <div className="text-2xl font-bold text-[#4ade80]">
          {Math.round(springY.get())}
        </div>
        <div className="text-[10px] text-[#94a3b8]">Threats/10s</div>
      </div> */}

      <ChartContainer
        ref={chartRef}
        className="h-48 w-full"
        config={chartConfig}
      >
        <AreaChart
          className="overflow-visible"
          data={chartData}
          onMouseMove={(state: any) => {
            const x = state.activeCoordinate?.x;
            const dataValue = state.activePayload?.[0]?.value;
            if (x && dataValue !== undefined) {
              springX.set(x);
              springY.set(dataValue);
            }
          }}
          onMouseLeave={() => {
            springX.set(chartRef.current?.getBoundingClientRect().width || 0);
            springY.jump(chartData[chartData.length - 1].spawns);
          }}
          margin={{
            right: 0,
            left: 0,
            top: 20,
          }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="#64748b"
            opacity={0.2}
          />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickFormatter={(value: any) => `${value}s`}
          />
          <Area
            dataKey="spawns"
            type="monotone"
            fill="url(#gradient-spawn)"
            fillOpacity={0.4}
            stroke="#4ade80"
            strokeWidth={2}
            clipPath={`inset(0 ${
              Number(chartRef.current?.getBoundingClientRect().width) - axis
            } 0 0)`}
          />
          {/* <line
            x1={axis}
            y1={0}
            x2={axis}
            y2="85%"
            stroke="#4ade80"
            strokeDasharray="3 3"
            strokeLinecap="round"
            strokeOpacity={0.3}
          /> */}
          {/* <rect
            x={axis - 30}
            y={0}
            width={60}
            height={18}
            fill="#4ade80"
            rx={4}
          />
          <text
            x={axis}
            fontWeight={600}
            fontSize={12}
            y={13}
            textAnchor="middle"
            fill="#0d1b2a"
          >
            {Math.round(springY.get())}
          </text> */}
          {/* Ghost line behind */}
          <Area
            dataKey="spawns"
            type="monotone"
            fill="none"
            stroke="#4ade80"
            strokeOpacity={0.1}
            strokeWidth={2}
          />
          <defs>
            <linearGradient id="gradient-spawn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

export function DamageCurveChart({
  events,
  loopInterval,
  damageMultiplier,
}: SpawnChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [axis, setAxis] = useState(0);

  const springX = useSpring(0, {
    damping: 30,
    stiffness: 100,
  });
  const springY = useSpring(0, {
    damping: 30,
    stiffness: 100,
  });

  useMotionValueEvent(springX, "change", (latest) => {
    setAxis(latest);
  });

  // Generate damage data
  const chartData = generateDamageData(events, loopInterval, damageMultiplier);

  const chartConfig = {
    damage: {
      label: "Damage",
      color: "#ff6b35",
    },
  } satisfies ChartConfig;

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[#64748b] text-sm">
        Add abilities to see damage curve
      </div>
    );
  }

  return (
    <div className="relative">
      {/* <div className="absolute top-2 left-2 z-10">
        <div className="text-2xl font-bold text-[#ff6b35]">
          {Math.round(springY.get())}%
        </div>
        <div className="text-[10px] text-[#94a3b8]">Cumulative Damage</div>
      </div> */}

      <ChartContainer
        ref={chartRef}
        className="h-48 w-full"
        config={chartConfig}
      >
        <AreaChart
          className="overflow-visible"
          data={chartData}
          onMouseMove={(state: any) => {
            const x = state.activeCoordinate?.x;
            const dataValue = state.activePayload?.[0]?.value;
            if (x && dataValue !== undefined) {
              springX.set(x);
              springY.set(dataValue);
            }
          }}
          onMouseLeave={() => {
            springX.set(chartRef.current?.getBoundingClientRect().width || 0);
            springY.jump(chartData[chartData.length - 1].damage);
          }}
          margin={{
            right: 0,
            left: 0,
            top: 20,
          }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="#64748b"
            opacity={0.2}
          />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickFormatter={(value: any) => `${value}s`}
          />
          <Area
            dataKey="damage"
            type="monotone"
            fill="url(#gradient-damage)"
            fillOpacity={0.4}
            stroke="#ff6b35"
            strokeWidth={2}
            clipPath={`inset(0 ${
              Number(chartRef.current?.getBoundingClientRect().width) - axis
            } 0 0)`}
          />
          {/* <line
            x1={axis}
            y1={0}
            x2={axis}
            y2="85%"
            stroke="#ff6b35"
            strokeDasharray="3 3"
            strokeLinecap="round"
            strokeOpacity={0.3}
          />
          <rect
            x={axis - 30}
            y={0}
            width={60}
            height={18}
            fill="#ff6b35"
            rx={4}
          />
          <text
            x={axis}
            fontWeight={600}
            fontSize={12}
            y={13}
            textAnchor="middle"
            fill="white"
          >
            {Math.round(springY.get())}%
          </text> */}
          {/* Ghost line behind */}
          <Area
            dataKey="damage"
            type="monotone"
            fill="none"
            stroke="#ff6b35"
            strokeOpacity={0.1}
            strokeWidth={2}
          />
          <defs>
            <linearGradient id="gradient-damage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

// Helper functions

function generateSpawnData(events: TimelineEvent[], loopInterval: number) {
  const data: { time: number; spawns: number }[] = [];
  const maxTime = 180;
  const bucketSize = 10; // 10 second buckets

  // Calculate spawns for each bucket
  for (let t = 0; t <= maxTime; t += bucketSize) {
    let count = 0;

    events.forEach((event) => {
      // Count initial spawn
      if (event.startTime >= t && event.startTime < t + bucketSize) {
        count++;
      }

      // Count looped spawns
      if (loopInterval > 0) {
        let loopTime = event.startTime + loopInterval;
        while (loopTime <= maxTime) {
          if (loopTime >= t && loopTime < t + bucketSize) {
            count++;
          }
          loopTime += loopInterval;
        }
      }
    });

    data.push({ time: t, spawns: count });
  }

  return data;
}

function generateDamageData(
  events: TimelineEvent[],
  loopInterval: number,
  damageMultiplier: number,
) {
  const data: { time: number; damage: number }[] = [];
  const maxTime = 180;
  const bucketSize = 10;

  let cumulativeDamage = 0;

  for (let t = 0; t <= maxTime; t += bucketSize) {
    // Calculate damage from active events in this bucket
    let activeDamage = 0;

    events.forEach((event) => {
      // Check if event is active in this time bucket (including loops)
      const isActive = (startTime: number) => {
        const endTime = startTime + event.duration;
        return startTime <= t + bucketSize && endTime >= t;
      };

      // Initial occurrence
      if (isActive(event.startTime)) {
        activeDamage += 5 * damageMultiplier; // Base damage per event per bucket
      }

      // Looped occurrences
      if (loopInterval > 0) {
        let loopTime = event.startTime + loopInterval;
        while (loopTime <= maxTime) {
          if (isActive(loopTime)) {
            activeDamage += 5 * damageMultiplier;
          }
          loopTime += loopInterval;
        }
      }
    });

    cumulativeDamage += activeDamage;
    data.push({ time: t, damage: Math.min(100, cumulativeDamage) });
  }

  return data;
}
