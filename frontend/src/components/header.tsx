"use client";

import { useRouter, usePathname } from "next/navigation";
import { WalletButton } from "./wallet-button";

const NAV = [
  { label: "play", href: "/defense" },
  { label: "create", href: "/bot-creator" },
  { label: "leaderboard", href: "/leaderboard" },
];

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header
      className="w-full border-b border-stone-800 bg-stone-950 px-6 py-3"
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-6">
        <a
          onClick={() => router.push("/")}
          className="text-amber-400 text-sm font-bold uppercase tracking-widest cursor-pointer hover:text-amber-300 transition-colors shrink-0"
        >
          zero-trust
        </a>

        <nav className="hidden sm:flex items-center gap-6">
          {NAV.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <a
                key={href}
                onClick={() => router.push(href)}
                className={`text-sm uppercase tracking-widest cursor-pointer transition-colors ${
                  active ? "text-white" : "text-stone-600 hover:text-stone-400"
                }`}
              >
                {active && <span className="text-amber-400 mr-1.5">›</span>}
                {label}
              </a>
            );
          })}
        </nav>

        <WalletButton />
      </div>
    </header>
  );
};

export default Header;
