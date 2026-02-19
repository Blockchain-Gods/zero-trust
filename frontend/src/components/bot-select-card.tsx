"use client";

import Image from "next/image";
import { BOT_TYPES, SYSTEM_TARGETS } from "@/lib/constants";
import type { AvailableBot } from "@/hooks/useAvailableBots";
import type { DeployedBot } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { BotTypeTag } from "@/lib/types/types";

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
  const primaryTargetMeta = bot.primaryTarget
    ? SYSTEM_TARGETS[bot.primaryTarget]
    : null;

  return (
    <button
      onClick={() => onSelect(bot)}
      className={`
        w-full text-left rounded-xl p-4 border-2 transition-all duration-150 cursor-pointer
        ${
          isSelected
            ? "border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20"
            : "border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800"
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Bot image */}
        <div className="relative shrink-0 w-14 h-14 rounded-lg flex items-center justify-center">
          {botMeta?.icon ? (
            <Image
              src={slugify(botMeta.icon)}
              alt={botMeta.name}
              width={56}
              height={56}
              className="object-contain"
              onError={(e) => {
                // Fallback to emoji if image missing
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-2xl">🤖</span>
          )}
          {isOnChain && (
            <span
              title="On-chain NFT"
              className="absolute top-0 right-0 w-3 h-3 bg-cyan-400 rounded-full border border-slate-900"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white truncate">
              {bot.botName}
            </span>
            {isOnChain && (
              <span className="text-xs bg-cyan-900/60 text-cyan-300 border border-cyan-700 px-1.5 py-0.5 rounded-full shrink-0">
                #{(bot as DeployedBot).tokenId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span className="text-slate-300">
              {botMeta?.name ?? bot.botType}
            </span>
            {primaryTargetMeta && (
              <>
                <span>·</span>
                <span>
                  {primaryTargetMeta.icon} {primaryTargetMeta.name}
                </span>
              </>
            )}
          </div>

          {/* Stats row */}
          <div className="flex gap-3 text-xs">
            <span className="text-orange-400">
              ⚡ {bot.damageMultiplier.toFixed(1)}x
            </span>
            <span className="text-purple-400">
              🎯 {bot.threatCount} threats
            </span>
            <span className="text-slate-400">
              {bot.abilities.length > 0
                ? `+${bot.abilities.length} abilities`
                : "no abilities"}
            </span>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-cyan-700/40 flex justify-between text-xs text-cyan-300">
          <span>Victory: {bot.victoryCondition.replace(/_/g, " ")}</span>
          <span>Spawn: {bot.spawnPattern}</span>
        </div>
      )}
    </button>
  );
}
