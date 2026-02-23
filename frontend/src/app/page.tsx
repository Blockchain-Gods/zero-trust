"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBotSync } from "@/hooks/useBotSync";
import HudCorners from "@/components/hud-corners";
import { Bug, Shield, Bot, Trophy } from "lucide-react";

const ACTIONS = [
  {
    href: "/bot-creator",
    tag: "attacker",
    title: "hacker mode",
    description: "Design encrypted attack bots with custom threat strategies.",
    cta: "create bot",
    icon: Bug,
    tagColor: "text-red-400 border-red-400/30",
    iconBg: "bg-red-400/10 text-red-400",
  },
  {
    href: "/defense",
    tag: "defender",
    title: "defender mode",
    description: "Face encrypted threats and protect systems in real time.",
    cta: "play defense",
    icon: Shield,
    tagColor: "text-blue-400 border-blue-400/30",
    iconBg: "bg-blue-400/10 text-blue-400",
  },
];

const STATS = [
  { label: "proof system", value: "risc zero" },
  { label: "chain", value: "stellar" },
  { label: "mode", value: "asymmetric" },
];

export default function HomePage() {
  const router = useRouter();
  const { sync, isSyncing, totalFetched, lastSyncedAt } = useBotSync();

  useEffect(() => {
    void sync();
  }, [sync]);

  return (
    <div
      className="min-h-screen bg-stone-950 text-white"
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {/* Top bar */}
      {/* <div className="border-b border-stone-800 px-6 py-3 flex items-center justify-between">
        <span className="text-amber-400 text-sm font-bold uppercase tracking-widest">
          zero-trust
        </span>
        <div className="flex items-center gap-4 text-sm text-stone-600 uppercase tracking-widest">
          <span>stellar testnet</span>
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        </div>
      </div> */}

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-14">
        {/* Hero */}
        <div className="space-y-5">
          <div className="text-sm text-stone-600 uppercase tracking-widest">
            hackathon · stellar + risc zero
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-none text-amber-400">
            zero trust
          </h1>
          <p className="text-stone-500 text-base leading-relaxed max-w-md">
            asymmetric zk security game — design attack bots or defend systems.
            all scores verified on-chain via zero-knowledge proofs.
          </p>

          {/* Sync status */}
          <div className="h-5 flex items-center gap-2 text-sm text-stone-700">
            {isSyncing ? (
              <>
                <span className="animate-spin inline-block">↻</span>
                <span>syncing bots from chain…</span>
              </>
            ) : lastSyncedAt !== null ? (
              <span>
                {totalFetched} bot{totalFetched !== 1 ? "s" : ""} synced ·{" "}
                {new Date(lastSyncedAt).toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        </div>

        {/* Main action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {ACTIONS.map(
            ({
              href,
              tag,
              title,
              description,
              cta,
              icon: Icon,
              tagColor,
              iconBg,
            }) => (
              <HudCorners key={href} size="md" layer="front">
                <button
                  onClick={() => router.push(href)}
                  className="group w-full text-left border border-dashed border-stone-800 bg-stone-900/50 p-6 transition-colors hover:border-stone-700 space-y-5 h-full"
                >
                  {/* Icon + tag row */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 flex items-center justify-center ${iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-sm font-mono uppercase tracking-widest border px-2 py-0.5 ${tagColor}`}
                    >
                      {tag}
                    </span>
                  </div>

                  {/* Text */}
                  <div>
                    <h2 className="text-base font-bold uppercase tracking-widest text-white mb-2">
                      {title}
                    </h2>
                    <p className="text-sm text-stone-500 leading-relaxed">
                      {description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="text-sm text-stone-600 group-hover:text-amber-400 transition-colors cursor-pointer">
                    {cta} ›
                  </div>
                </button>
              </HudCorners>
            ),
          )}
        </div>

        {/* Secondary actions */}
        <div className="space-y-2">
          <HudCorners color="whiteMuted" size="sm" layer="front">
            <SecondaryButton
              label="your bots"
              description="manage and deploy attack bots"
              icon={Bot}
              onClick={() => router.push("/bots")}
            />
          </HudCorners>
          <HudCorners color="primary" size="sm" layer="front">
            <SecondaryButton
              label="leaderboard"
              description="global zk-verified scores"
              icon={Trophy}
              onClick={() => router.push("/leaderboard")}
              highlight
            />
          </HudCorners>
        </div>

        {/* Stats footer */}
        <div className="pt-6 border-t border-stone-900 grid grid-cols-3 gap-4">
          {STATS.map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <div className="text-sm text-stone-700 uppercase tracking-widest">
                {label}
              </div>
              <div className="text-sm text-stone-500">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecondaryButton({
  label,
  description,
  icon: Icon,
  onClick,
  highlight = false,
}: {
  label: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between border border-dashed bg-stone-950 px-5 py-4 transition-colors group ${
        highlight
          ? "border-amber-400/20 hover:border-amber-400/50"
          : "border-stone-800 hover:border-stone-700"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-8 h-8 flex items-center justify-center transition-colors ${
            highlight
              ? "bg-amber-400/10 text-amber-400"
              : "bg-white/5 text-stone-600 group-hover:text-stone-400"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-left">
          <div
            className={`text-sm font-semibold uppercase tracking-wide transition-colors ${
              highlight
                ? "text-amber-400"
                : "text-stone-400 group-hover:text-white"
            }`}
          >
            {label}
          </div>
          <div className="text-sm text-stone-600">{description}</div>
        </div>
      </div>
      <span
        className={`text-base transition-colors ${
          highlight
            ? "text-amber-400/50 group-hover:text-amber-400"
            : "text-stone-700 group-hover:text-stone-500"
        }`}
      >
        ›
      </span>
    </button>
  );
}
