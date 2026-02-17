"use client";

import { useEffect, useRef, useState } from "react";
import {
  Wallet,
  Zap,
  LogOut,
  ChevronDown,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWallet } from "@/hooks/useWallet";

// ─── Props ────────────────────────────────────────────────────────────────────

interface WalletButtonProps {
  /** Show the "Generate Wallet" ephemeral option. Default: true */
  allowEphemeral?: boolean;
  className?: string;
}

// ─── Glowing Border Button ────────────────────────────────────────────────────

interface GlowingBorderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "cyan" | "emerald" | "violet";
  /** true = fast spin, false = no animation, undefined = slow spin + hover accelerate */
  spinning?: boolean;
}

function GlowingBorderButton({
  className,
  children,
  variant = "cyan",
  spinning,
  ...props
}: GlowingBorderButtonProps) {
  const beamColor = {
    cyan: "[background:linear-gradient(to_right,transparent_20%,#00e5ff_50%,#00e5ff_60%,transparent_80%)]",
    emerald:
      "[background:linear-gradient(to_right,transparent_20%,#50C878_50%,#50C878_60%,transparent_80%)]",
    violet:
      "[background:linear-gradient(to_right,transparent_20%,#a78bfa_50%,#a78bfa_60%,transparent_80%)]",
  }[variant];

  const haloColor = {
    cyan: "[box-shadow:0_0_24px_6px_rgba(0,229,255,0.25)]",
    emerald: "[box-shadow:0_0_24px_6px_rgba(80,200,120,0.3)]",
    violet: "[box-shadow:0_0_24px_6px_rgba(167,139,250,0.3)]",
  }[variant];

  const innerHover = {
    cyan: "group-hover:bg-cyan-950 dark:group-hover:bg-cyan-950",
    emerald: "group-hover:bg-emerald-950 dark:group-hover:bg-emerald-950",
    violet: "group-hover:bg-violet-950 dark:group-hover:bg-violet-950",
  }[variant];

  return (
    <button
      className={cn(
        "glowing-border-button group relative h-[44px] cursor-pointer border-0 bg-transparent p-0 text-sm font-bold outline-none",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-[14px] p-[2px]",
          "transition-transform duration-200 ease-in-out",
          "group-hover:scale-[1.03] group-active:scale-[0.97]",
          "dark:bg-zinc-800 bg-zinc-200",
        )}
      >
        {/* Rotating border beam */}
        <div className="absolute inset-0 overflow-hidden rounded-[14px]">
          <div
            className={cn(
              "absolute left-1/2 top-1/2 h-[500%] w-[80px] -translate-x-1/2 -translate-y-1/2 blur-[2px]",
              beamColor,
              spinning === true && "animate-[spin_1.2s_linear_infinite]",
              spinning === undefined &&
                "animate-[spin_3s_linear_infinite] group-hover:animate-[spin_1.2s_linear_infinite]",
              // spinning === false → no animation class at all
            )}
          />
        </div>

        {/* Outer glow halo */}
        <div
          className={cn(
            "absolute inset-0 rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            haloColor,
          )}
        />

        {/* Inner content */}
        <div
          className={cn(
            "relative z-10 flex h-full w-full items-center justify-center gap-2 rounded-[12px]",
            "px-5 transition-colors duration-300 ease-in-out",
            "bg-white dark:bg-black",
            innerHover,
          )}
        >
          {children}
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WalletButton({
  allowEphemeral = true,
  className,
}: WalletButtonProps) {
  const {
    wallet,
    isConnected,
    isConnecting,
    isGenerating,
    balance,
    error,
    connectWithKit,
    generateEphemeral,
    disconnect,
    refreshBalance,
    kitRef,
    networkPassphrase,
  } = useWallet();

  // Derive network label once from the passphrase string
  const isMainnet = networkPassphrase.toLowerCase().includes("public global");
  const networkLabel = isMainnet ? "Mainnet" : "Testnet";

  const kitWrapperRef = useRef<HTMLDivElement>(null);
  const [kitMounted, setKitMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Mount kit button into hidden wrapper ───────────────────────────────────
  useEffect(() => {
    if (kitMounted || !kitWrapperRef.current) return;

    // Wait for kit to be ready
    const interval = setInterval(() => {
      if (kitRef.current && kitWrapperRef.current && !kitMounted) {
        kitRef.current.createButton(kitWrapperRef.current);
        setKitMounted(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [kitRef, kitMounted]);

  // ── MutationObserver: cancel connecting if modal closes without connect ─────
  useEffect(() => {
    if (!kitMounted) return;

    const observer = new MutationObserver(() => {
      const modalOpen = !!document.querySelector(
        "stellar-wallets-modal, dialog[open], .stellar-wallets-modal",
      );
      if (!modalOpen && isConnecting) {
        // Hook will handle state reset via polling — nothing to do here
        // unless you want an explicit cancel callback
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });

    return () => observer.disconnect();
  }, [kitMounted, isConnecting]);

  // ── Copy public key ────────────────────────────────────────────────────────
  function copyAddress() {
    if (!wallet?.publicKey) return;
    navigator.clipboard.writeText(wallet.publicKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Trigger kit modal ──────────────────────────────────────────────────────
  function openKitModal() {
    connectWithKit();
    kitWrapperRef.current?.querySelector("button")?.click();
  }

  // ── Render: connected ──────────────────────────────────────────────────────
  if (isConnected && wallet) {
    const isEphemeral = wallet.source === "ephemeral";
    const short = `${wallet.publicKey.slice(0, 4)}…${wallet.publicKey.slice(-4)}`;

    return (
      <div className="flex gap-2">
        <div className="relative flex  items-center gap-2">
          {/* Kit's hidden button stays in DOM */}
          <div ref={kitWrapperRef} className="sr-only" aria-hidden="true" />

          <GlowingBorderButton
            variant="emerald"
            spinning={false}
            onClick={() => setShowDropdown((v) => !v)}
            className={className}
          >
            {/* Live dot */}
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>

            <span className="font-mono text-sm tracking-wider dark:text-white text-black transition-colors duration-300">
              {short}
            </span>

            {/* Source badge */}
            <span
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded-full border",
                isEphemeral
                  ? "text-violet-400 border-violet-500/40 bg-violet-500/10"
                  : "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
              )}
            >
              {isEphemeral ? "demo" : "kit"}
            </span>

            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-emerald-500 transition-transform duration-200",
                showDropdown && "rotate-180",
              )}
            />
          </GlowingBorderButton>

          {/* Dropdown */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full mt-2 z-20 min-w-[260px] rounded-xl border border-white/10 bg-black/95 backdrop-blur-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
                      {isEphemeral ? "Demo Wallet" : "Connected Wallet"}
                    </p>
                    <button
                      onClick={copyAddress}
                      className="text-white/40 hover:text-white/80 transition-colors"
                      aria-label="Copy address"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-white/70 font-mono break-all leading-relaxed">
                    {wallet.publicKey}
                  </p>

                  {/* Balance */}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-white/50 font-mono">
                      {balance ?? "—"}
                    </p>
                    <button
                      onClick={() => refreshBalance()}
                      className="text-white/30 hover:text-white/70 transition-colors"
                      aria-label="Refresh balance"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Disconnect */}
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    disconnect();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs font-mono text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>
            </>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 h-fit my-auto rounded-full border font-mono text-xs select-none",
            isMainnet
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-amber-500/30 bg-amber-500/10 text-amber-400",
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              isMainnet ? "bg-emerald-400" : "bg-amber-400",
            )}
          />
          {networkLabel}
        </div>
      </div>
    );
  }

  // ── Render: disconnected ───────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-col items-start gap-1.5">
        {/* Kit's hidden button — owns the modal */}
        <div ref={kitWrapperRef} className="sr-only" aria-hidden="true" />

        <div className={cn("flex items-center gap-2", className)}>
          {/* Connect Wallet */}
          <Tooltip>
            <TooltipTrigger asChild>
              <GlowingBorderButton
                variant="cyan"
                spinning={isConnecting ? true : undefined}
                disabled={isConnecting || isGenerating}
                onClick={openKitModal}
                aria-label="Connect Stellar wallet"
              >
                {isConnecting ? (
                  <Spinner />
                ) : (
                  <Wallet className="w-4 h-4 dark:text-white text-black transition-colors duration-300" />
                )}
                <span className="dark:text-white text-black transition-colors duration-300 whitespace-nowrap">
                  {isConnecting ? "Connecting…" : "Connect Wallet"}
                </span>
              </GlowingBorderButton>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-center">
              <p className="font-semibold mb-0.5">Have a Stellar wallet?</p>
              <p className="text-xs text-muted-foreground">
                Connect with Freighter, xBull, or any supported Stellar wallet
                extension.
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Generate Wallet — conditionally shown */}
          {allowEphemeral && (
            <>
              <span className="text-xs text-white/20 font-mono select-none">
                or
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <GlowingBorderButton
                    variant="violet"
                    spinning={isGenerating ? true : undefined}
                    disabled={isConnecting || isGenerating}
                    onClick={() => generateEphemeral()}
                    aria-label="Generate a demo wallet"
                  >
                    {isGenerating ? (
                      <Spinner />
                    ) : (
                      <Zap className="w-4 h-4 dark:text-white text-black transition-colors duration-300" />
                    )}
                    <span className="dark:text-white text-black transition-colors duration-300 whitespace-nowrap">
                      {isGenerating ? "Generating…" : "Generate Wallet"}
                    </span>
                  </GlowingBorderButton>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-[200px] text-center"
                >
                  <p className="font-semibold mb-0.5">New to Stellar?</p>
                  <p className="text-xs text-muted-foreground">
                    Instantly creates a free testnet wallet so you can try the
                    game — no setup, no extensions needed.
                  </p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400/80 font-mono pl-1" role="alert">
            ⚠ {error}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin w-4 h-4 dark:text-white text-black shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
