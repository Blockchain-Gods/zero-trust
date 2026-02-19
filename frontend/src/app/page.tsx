"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBotSync } from "@/hooks/useBotSync";

export default function HomePage() {
  const router = useRouter();
  const { sync, isSyncing, totalFetched, lastSyncedAt } = useBotSync();

  // Background sync on mount — respects TTL so won't hammer the chain
  useEffect(() => {
    void sync();
  }, [sync]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">Zero Trust</h1>
          <p className="text-2xl text-purple-300 mb-2">
            Asymmetric ZK Security Game
          </p>
          <p className="text-gray-400">
            Design attack bots or defend systems in this cybersecurity game
          </p>

          {/* Sync status — subtle, non-blocking */}
          <div className="mt-3 h-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            {isSyncing && (
              <>
                <span className="animate-spin">↻</span>
                <span>Syncing bots from chain…</span>
              </>
            )}
            {!isSyncing && lastSyncedAt !== null && (
              <span>
                {totalFetched} bot{totalFetched !== 1 ? "s" : ""} synced ·{" "}
                {new Date(lastSyncedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Hacker Mode */}
          <button
            onClick={() => router.push("/bot-creator")}
            className="group bg-slate-800 rounded-xl p-8 border-2 border-red-500/50 hover:border-red-500 transition transform hover:scale-105"
          >
            <div className="text-6xl mb-4">🦠</div>
            <h2 className="text-2xl font-bold text-white mb-2">Hacker Mode</h2>
            <p className="text-gray-400 mb-4">
              Design encrypted attack bots with custom strategies
            </p>
            <div className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg font-semibold group-hover:bg-red-500 transition">
              Create Bot →
            </div>
          </button>

          {/* Defender Mode */}
          <button
            onClick={() => router.push("/defense")}
            className="group bg-slate-800 rounded-xl p-8 border-2 border-blue-500/50 hover:border-blue-500 transition transform hover:scale-105 relative overflow-hidden"
          >
            <div className="text-4xl mb-4">🛡️</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Defender Mode
            </h2>
            <p className="text-gray-400 mb-4">
              Face encrypted threats and protect systems
            </p>
            <div className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold group-hover:bg-blue-500 transition">
              Play Defense →
            </div>
          </button>
        </div>

        {/* View Bots */}
        <button
          onClick={() => router.push("/bots")}
          className="w-full bg-slate-800 rounded-xl p-6 border-2 border-purple-500/50 hover:border-purple-500 transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🤖</div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-white">View Your Bots</h3>
                <p className="text-gray-400">
                  Manage and deploy your attack bots
                </p>
              </div>
            </div>
            <div className="text-purple-400 text-xl">→</div>
          </div>
        </button>

        {/* Footer Info */}
        <div className="mt-12 text-center space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-purple-400 font-bold">ZK Proofs</div>
              <div className="text-gray-400 text-xs">
                Strategy privacy via Risc Zero
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-purple-400 font-bold">Stellar Chain</div>
              <div className="text-gray-400 text-xs">
                Decentralized leaderboards
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-purple-400 font-bold">Asymmetric</div>
              <div className="text-gray-400 text-xs">
                Attackers vs Defenders
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-sm">
            Built for Stellar + Risc Zero Hackathon
          </p>
        </div>
      </div>
    </div>
  );
}
