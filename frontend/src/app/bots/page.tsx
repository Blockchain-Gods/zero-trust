"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SavedBot } from "@/lib/types";
import { getAllBots, deleteBot } from "@/lib/storage";
import { BOT_TYPES, SYSTEM_TARGETS, SPECIAL_ABILITIES } from "@/lib/constants";

export default function BotsPage() {
  const router = useRouter();
  const [bots, setBots] = useState<SavedBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<SavedBot | null>(null);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = () => {
    const loadedBots = getAllBots();
    setBots(loadedBots);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this bot?")) {
      deleteBot(id);
      loadBots();
      if (selectedBot?.id === id) {
        setSelectedBot(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Your Attack Bots
              </h1>
              <p className="text-gray-400">
                Deploy these bots to challenge defenders
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/bot-creator")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-500 transition"
          >
            + Create New Bot
          </button>
        </div>

        {bots.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Bots Yet</h2>
            <p className="text-gray-400 mb-6">
              Create your first attack bot to get started
            </p>
            <button
              onClick={() => router.push("/bot-creator")}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-500 transition"
            >
              Create Your First Bot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bots List */}
            <div className="space-y-4">
              {bots.map((bot) => (
                <BotCard
                  key={bot.id}
                  bot={bot}
                  isSelected={selectedBot?.id === bot.id}
                  onSelect={() => setSelectedBot(bot)}
                  onDelete={() => handleDelete(bot.id)}
                />
              ))}
            </div>

            {/* Bot Details Panel */}
            <div className="lg:sticky lg:top-8 h-fit">
              {selectedBot ? (
                <BotDetails bot={selectedBot} />
              ) : (
                <div className="bg-slate-800 rounded-lg p-8 text-center">
                  <div className="text-gray-400">
                    Select a bot to view details
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BotCard({
  bot,
  isSelected,
  onSelect,
  onDelete,
}: {
  bot: SavedBot;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const botType = BOT_TYPES[bot.botType];

  return (
    <div
      onClick={onSelect}
      className={`bg-slate-800 rounded-lg p-6 cursor-pointer transition border-2 ${
        isSelected
          ? "border-purple-500 bg-purple-500/10"
          : "border-transparent hover:border-gray-600"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{botType.icon}</div>
          <div>
            <h3 className="text-xl font-bold text-white">{bot.botName}</h3>
            <p className="text-sm text-gray-400">{botType.name}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-red-400 hover:text-red-300 transition"
        >
          🗑️
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-white">{bot.timesPlayed}</div>
          <div className="text-xs text-gray-400">Times Played</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-400">
            {bot.avgDamageDealt.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-400">Avg Damage</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-400">
            {bot.threatCount}
          </div>
          <div className="text-xs text-gray-400">Threats</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          Created {new Date(bot.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function BotDetails({ bot }: { bot: SavedBot }) {
  const botType = BOT_TYPES[bot.botType];
  const primaryTarget = SYSTEM_TARGETS[bot.primaryTarget];

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-700">
        <div className="text-6xl">{botType.icon}</div>
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">{bot.botName}</h2>
          <p className="text-gray-400">{botType.name}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Targeting */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Target Systems
          </h3>
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{primaryTarget.icon}</span>
              <div>
                <div className="text-white font-medium">
                  {primaryTarget.name}
                </div>
                <div className="text-xs text-gray-400">
                  Primary Target (70%)
                </div>
              </div>
            </div>
            {bot.secondaryTargets.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="text-xs text-gray-400 mb-2">
                  Secondary Targets (30%)
                </div>
                <div className="flex gap-2">
                  {bot.secondaryTargets.map((targetId) => {
                    const target = SYSTEM_TARGETS[targetId];
                    return (
                      <div
                        key={targetId}
                        className="flex items-center gap-1 text-sm text-gray-300"
                      >
                        <span>{target.icon}</span>
                        <span>{target.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Abilities */}
        {bot.abilities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Special Abilities
            </h3>
            <div className="space-y-2">
              {bot.abilities.map((abilityId) => {
                const ability = SPECIAL_ABILITIES[abilityId];
                return (
                  <div
                    key={abilityId}
                    className="bg-slate-700 rounded-lg p-3 flex items-start gap-3"
                  >
                    <span className="text-2xl">{ability.icon}</span>
                    <div>
                      <div className="text-white font-medium">
                        {ability.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {ability.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Configuration
          </h3>
          <div className="bg-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Victory Condition</span>
              <span className="text-white font-medium capitalize">
                {bot.victoryCondition.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Damage Multiplier</span>
              <span className="text-white font-medium">
                {bot.damageMultiplier}x
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Threat Count</span>
              <span className="text-white font-medium">{bot.threatCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Spawn Pattern</span>
              <span className="text-white font-medium capitalize">
                {bot.spawnPattern}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Skill Diversity</span>
              <span className="text-white font-medium capitalize">
                {bot.skillDiversity}
              </span>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Performance</h3>
          <div className="bg-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Times Deployed</span>
              <span className="text-white font-medium">{bot.timesPlayed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Average Damage</span>
              <span className="text-purple-400 font-medium">
                {bot.avgDamageDealt.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Deploy Button */}
        <button className="w-full py-4 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-500 hover:to-pink-500 transition">
          🎮 Deploy to Defense Game
        </button>
      </div>
    </div>
  );
}
