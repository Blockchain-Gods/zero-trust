"use client";

import { useCallback, useEffect, useState } from "react";
import { getAllBots } from "@/lib/storage";
import type { SavedBot } from "@/lib/types/types";
import type { DeployedBot } from "@/lib/storage";

export type AvailableBot = SavedBot | DeployedBot;

export interface UseAvailableBotsReturn {
  bots: AvailableBot[];
  onChainBots: DeployedBot[];
  localBots: SavedBot[];
  selectedBot: AvailableBot | null;
  selectBot: (bot: AvailableBot) => void;
  clearSelection: () => void;
  reload: () => void;
}

export function useAvailableBots(): UseAvailableBotsReturn {
  const [bots, setBots] = useState<AvailableBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<AvailableBot | null>(null);

  const reload = useCallback(() => {
    const all = getAllBots();
    // Newest first
    const sorted = [...all].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );
    setBots(sorted);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const onChainBots = bots.filter(
    (b): b is DeployedBot => "isOnChain" in b && b.isOnChain === true,
  );

  const localBots = bots.filter(
    (b): b is SavedBot => !("isOnChain" in b) || !b.isOnChain,
  );

  return {
    bots,
    onChainBots,
    localBots,
    selectedBot,
    selectBot: setSelectedBot,
    clearSelection: () => setSelectedBot(null),
    reload,
  };
}
