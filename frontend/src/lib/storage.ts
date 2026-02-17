import { BotConfig, SavedBot } from "./types/types";

const STORAGE_KEY = "cyberdefense_bots";

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

export function getAllBots(): SavedBot[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getBotById(id: string): SavedBot | null {
  const bots = getAllBots();
  return bots.find((b) => b.id === id) || null;
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
