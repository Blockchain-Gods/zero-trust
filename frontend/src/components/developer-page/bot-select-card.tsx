"use client";

import Image from "next/image";
import { BOT_TYPES, SYSTEM_TARGETS } from "@/lib/constants";
import type { AvailableBot } from "@/hooks/useAvailableBots";
import type { DeployedBot } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { BotTypeTag } from "@/lib/types/types";
import { Bot, Zap, Target, Link } from "lucide-react";

interface BotSelectCardProps {
  bot: AvailableBot;
  isSelected: boolean;
  onSelect: (bot: AvailableBot) => void;
}

export function BotSelectCard({
  bot,
  isSelected,
  onSelect,
}: BotSelectCardProps) {
  const isOnChain = "isOnChain" in bot && bot.isOnChain;
  const botSlug = slugify(bot.botType) as BotTypeTag;
  const botMeta = BOT_TYPES[botSlug];

  return (
    <button
      onClick={() => onSelect(bot)}
      className={`w-full text-left border p-4 transition cursor-pointer ${
        isSelected
          ? "border-amber-400/60 bg-amber-400/5"
          : "border-stone-800 bg-stone-900/30 hover:border-stone-600"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Bot image */}
        <div className="relative shrink-0 w-12 h-12 flex items-center justify-center">
          {botMeta?.icon ? (
            <Image
              src={slugify(botMeta.icon)}
              alt={botMeta.name}
              width={48}
              height={48}
              className="object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <Bot className="w-8 h-8 text-stone-600" />
          )}
          {isOnChain && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-stone-950" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-white truncate">
              {bot.botName}
            </span>
            {isOnChain && (
              <span className="text-sm text-green-400 border border-green-400/30 px-1.5 py-px shrink-0 flex items-center gap-1">
                <Link className="w-2.5 h-2.5" />#{(bot as DeployedBot).tokenId}
              </span>
            )}
          </div>
          <div className="text-sm text-stone-500 mb-2">
            {botMeta?.name ?? bot.botType}
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-orange-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {bot.damageMultiplier.toFixed(1)}x
            </span>
            <span className="text-stone-500 flex items-center gap-1">
              <Target className="w-3 h-3" />
              {bot.threatCount} threats
            </span>
            <span className="text-stone-600">
              {bot.abilities.length > 0
                ? `+${bot.abilities.length} abilities`
                : "no abilities"}
            </span>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-amber-400/20 flex justify-between text-sm text-stone-500">
          <span>victory: {bot.victoryCondition.replace(/_/g, " ")}</span>
          <span>spawn: {bot.spawnPattern}</span>
        </div>
      )}
    </button>
  );
}
