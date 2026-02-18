import { BotConfig, SavedBot } from "./types/types";

const STORAGE_KEY = "cyberdefense_bots";

export interface DeployedBot extends SavedBot {
  tokenId: number;
  deployedAt: string;
  txHash?: string;
  isOnChain: true;
}

export function saveBotToLocalStorage(bot: BotConfig): SavedBot {
  const savedBot: SavedBot = {
    ...bot,
    id: bot.id || generateId(),
    createdAt: bot.createdAt || new Date().toISOString(),
    creatorName: bot.creatorName || "Anonymous",
    timesPlayed: 0,
    avgDamageDealt: 0,
  };

  const bots = getAllBots();
  const existingIndex = bots.findIndex((b) => b.id === savedBot.id);

  if (existingIndex >= 0) {
    bots[existingIndex] = savedBot;
  } else {
    bots.push(savedBot);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
  return savedBot;
}

/**
 * Save a blockchain-deployed bot to localStorage
 */
export function saveDeployedBot(
  bot: BotConfig,
  tokenId: number,
  txHash?: string,
): DeployedBot {
  const deployedBot: DeployedBot = {
    ...bot,
    id: `token_${tokenId}`,
    createdAt: bot.createdAt || new Date().toISOString(),
    creatorName: bot.creatorName || "Anonymous",
    timesPlayed: 0,
    avgDamageDealt: 0,
    tokenId,
    deployedAt: new Date().toISOString(),
    txHash,
    isOnChain: true,
  };

  const bots = getAllBots();

  // Remove any existing bot with same token ID
  const filtered = bots.filter(
    (b) => !("tokenId" in b && b.tokenId === tokenId),
  );

  filtered.push(deployedBot);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  return deployedBot;
}

export function getAllBots(): (SavedBot | DeployedBot)[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getBotById(id: string): SavedBot | DeployedBot | null {
  const bots = getAllBots();
  return bots.find((b) => b.id === id) || null;
}

export function getBotByTokenId(tokenId: number): DeployedBot | null {
  const bots = getAllBots();
  const bot = bots.find(
    (b): b is DeployedBot => "tokenId" in b && b.tokenId === tokenId,
  );
  return bot || null;
}

export function deleteBot(id: string): void {
  const bots = getAllBots().filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
}

export function updateBotStats(id: string, damageDealt: number): void {
  const bots = getAllBots();
  const bot = bots.find((b) => b.id === id);

  if (bot) {
    bot.timesPlayed += 1;
    bot.avgDamageDealt =
      (bot.avgDamageDealt * (bot.timesPlayed - 1) + damageDealt) /
      bot.timesPlayed;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
  }
}

function generateId(): string {
  return `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
