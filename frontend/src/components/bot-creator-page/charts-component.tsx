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
    <ChartContainer className="h-48 w-full" config={chartConfig}>
      <AreaChart data={chartData} margin={{ right: 0, left: 0, top: 20 }}>
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
          isAnimationActive={true}
          dot={false}
          activeDot={false}
        />
        <defs>
          <linearGradient id="gradient-spawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
          </linearGradient>
        </defs>
      </AreaChart>
    </ChartContainer>
  );
}

export function DamageCurveChart({
  events,
  loopInterval,
  damageMultiplier,
}: SpawnChartProps) {
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
    <ChartContainer className="h-48 w-full" config={chartConfig}>
      <AreaChart data={chartData} margin={{ right: 0, left: 0, top: 20 }}>
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
          isAnimationActive={true}
          dot={false}
          activeDot={false}
        />
        <defs>
          <linearGradient id="gradient-damage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
          </linearGradient>
        </defs>
      </AreaChart>
    </ChartContainer>
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
