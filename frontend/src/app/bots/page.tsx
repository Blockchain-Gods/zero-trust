"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SavedBot } from "@/lib/types/types";
import { getAllBots, deleteBot } from "@/lib/storage";
import BotDetails from "@/components/bots-page/bot-details";
import BotCard from "@/components/bots-page/bot-card";
import { ArrowLeft, Plus, Bot } from "lucide-react";

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
      if (selectedBot?.id === id) setSelectedBot(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-stone-950 text-white"
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div className="space-y-2">
            <div className="text-sm text-stone-600 uppercase tracking-widest">
              zero-trust · attacker
            </div>
            <h1 className="text-4xl font-bold text-amber-400">your bots</h1>
            <p className="text-stone-500 text-sm">
              deploy these bots to challenge defenders
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 border border-stone-700 px-4 py-2 text-stone-400 text-sm hover:border-stone-500 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              back
            </button>
            <button
              onClick={() => router.push("/bot-creator2")}
              className="flex items-center gap-2 bg-amber-400 text-stone-950 px-4 py-2 text-sm font-bold hover:bg-amber-300 transition uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              new bot
            </button>
          </div>
        </div>

        {bots.length === 0 ? (
          <div className="border border-stone-800 bg-stone-900/30 p-16 flex flex-col items-center gap-4 text-center">
            <Bot className="w-12 h-12 text-stone-700" />
            <h2 className="text-xl font-bold text-stone-300">no bots yet</h2>
            <p className="text-stone-600 text-sm">
              create your first attack bot to get started
            </p>
            <button
              onClick={() => router.push("/bot-creator2")}
              className="flex items-center gap-2 bg-amber-400 text-stone-950 px-6 py-2.5 text-sm font-bold hover:bg-amber-300 transition uppercase tracking-widest mt-2"
            >
              <Plus className="w-4 h-4" />
              create your first bot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bot list */}
            <div className="space-y-3">
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

            {/* Details panel */}
            <div className="lg:sticky lg:top-8 h-fit">
              {selectedBot ? (
                <BotDetails bot={selectedBot} />
              ) : (
                <div className="border border-stone-800 bg-stone-900/30 p-8 flex items-center justify-center">
                  <span className="text-stone-600 text-sm">
                    select a bot to view details
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
