"use client";

import { useState } from "react";
import { BotSelectCard } from "./bot-select-card";
import type { AvailableBot } from "@/hooks/useAvailableBots";
import type { DeployedBot } from "@/lib/storage";
import { RefreshCw, Link, HardDrive, LayoutGrid, Bot } from "lucide-react";

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

  const displayed = bots.filter((b) => {
    if (filter === "onchain") return "isOnChain" in b && b.isOnChain;
    if (filter === "local") return !("isOnChain" in b && b.isOnChain);
    return true;
  });

  const onChainCount = bots.filter(
    (b): b is DeployedBot => "isOnChain" in b && b.isOnChain,
  ).length;

  const TABS: {
    key: FilterTab;
    label: string;
    count: number;
    Icon: React.ElementType;
  }[] = [
    { key: "all", label: "all", count: bots.length, Icon: LayoutGrid },
    { key: "onchain", label: "on-chain", count: onChainCount, Icon: Link },
    {
      key: "local",
      label: "local",
      count: bots.length - onChainCount,
      Icon: HardDrive,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-stone-500 uppercase tracking-widest">
          select a bot to defend against
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-400 transition disabled:opacity-40"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "syncing…" : "refresh"}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {TABS.map(({ key, label, count, Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border text-sm transition ${
              filter === key
                ? "border-amber-400/60 bg-amber-400/10 text-amber-400"
                : "border-stone-800 text-stone-600 hover:border-stone-600 hover:text-stone-400"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label} ({count})
          </button>
        ))}
      </div>

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
      <div className="text-center py-12 text-stone-600 space-y-2">
        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-stone-700" />
        <p className="text-sm">fetching bots from chain…</p>
      </div>
    );
  }
  if (filter === "onchain") {
    return (
      <div className="text-center py-12 text-stone-600 space-y-2">
        <Link className="w-8 h-8 mx-auto text-stone-700" />
        <p className="text-sm">no on-chain bots found</p>
        <p className="text-sm text-stone-700">
          deploy a bot in hacker mode to see it here
        </p>
      </div>
    );
  }
  return (
    <div className="text-center py-12 text-stone-600 space-y-2">
      <Bot className="w-8 h-8 mx-auto text-stone-700" />
      <p className="text-sm">no bots available yet</p>
      <p className="text-sm text-stone-700">create one in hacker mode first</p>
    </div>
  );
}
