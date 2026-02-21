"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BotTypeTag, SavedBot } from "@/lib/types/types";
import { getAllBots, deleteBot } from "@/lib/storage";
import { BOT_TYPES, SYSTEM_TARGETS, SPECIAL_ABILITIES } from "@/lib/constants";
import Image from "next/image";
import { normaliseTagHyphen, slugify } from "@/lib/utils";
import BotDetails from "@/components/bots-page/bot-details";
import BotCard from "@/components/bots-page/bot-card";

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

  const handleDelete = (id: string | undefined) => {
    if (id && confirm("Are you sure you want to delete this bot?")) {
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
            onClick={() => router.push("/bot-creator2")}
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
              onClick={() => router.push("/bot-creator2")}
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
