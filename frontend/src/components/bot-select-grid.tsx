"use client";

import { useState } from "react";
import { BotSelectCard } from "./bot-select-card";
import type { AvailableBot } from "@/hooks/useAvailableBots";
import type { DeployedBot } from "@/lib/storage";

type FilterTab = "all" | "onchain" | "local";

interface BotSelectGridProps {
  bots: AvailableBot[];
  selectedBot: AvailableBot | null;
  onSelect: (bot: AvailableBot) => void;
  isSyncing?: boolean;
  onRefresh?: () => void;
}

export function BotSelectGrid({
  bots,
  selectedBot,
  onSelect,
  isSyncing = false,
  onRefresh,
}: BotSelectGridProps) {
  const [filter, setFilter] = useState<FilterTab>("all");

  //   console.log("[BotSelectGrid] Bots: ", bots);
  const displayed = bots.filter((b) => {
    if (filter === "onchain") return "isOnChain" in b && b.isOnChain;
    if (filter === "local") return !("isOnChain" in b && b.isOnChain);
    return true;
  });

  const onChainCount = bots.filter(
    (b): b is DeployedBot => "isOnChain" in b && b.isOnChain,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Select a Bot to Defend Against
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="text-xs text-slate-400 hover:text-cyan-300 transition disabled:opacity-50 flex items-center gap-1"
          >
            <span className={isSyncing ? "animate-spin" : ""}>↻</span>
            {isSyncing ? "Syncing…" : "Refresh"}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 text-sm">
        {(
          [
            { key: "all", label: `All (${bots.length})` },
            { key: "onchain", label: `On-chain (${onChainCount})` },
            { key: "local", label: `Local (${bots.length - onChainCount})` },
          ] as { key: FilterTab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-full border transition ${
              filter === key
                ? "border-cyan-500 bg-cyan-900/40 text-cyan-300"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {displayed.length === 0 ? (
        <EmptyState filter={filter} isSyncing={isSyncing} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {displayed.map((bot) => (
            <BotSelectCard
              key={bot.id}
              bot={bot}
              isSelected={selectedBot?.id === bot.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  filter,
  isSyncing,
}: {
  filter: FilterTab;
  isSyncing: boolean;
}) {
  if (isSyncing) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-3xl mb-2 animate-pulse">🔄</div>
        <p>Fetching bots from chain…</p>
      </div>
    );
  }

  if (filter === "onchain") {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-3xl mb-2">⛓️</div>
        <p>No on-chain bots found.</p>
        <p className="text-xs mt-1 text-slate-500">
          Deploy a bot in Hacker Mode to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12 text-slate-400">
      <div className="text-3xl mb-2">🤖</div>
      <p>No bots available yet.</p>
      <p className="text-xs mt-1 text-slate-500">
        Create one in Hacker Mode first.
      </p>
    </div>
  );
}
