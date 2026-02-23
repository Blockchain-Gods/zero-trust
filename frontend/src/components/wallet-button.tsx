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
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWallet } from "@/hooks/useWallet";

interface WalletButtonProps {
  allowEphemeral?: boolean;
  className?: string;
}

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

  const isMainnet = networkPassphrase.toLowerCase().includes("public global");
  const networkLabel = isMainnet ? "mainnet" : "testnet";

  const kitWrapperRef = useRef<HTMLDivElement>(null);
  const [kitMounted, setKitMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (kitMounted || !kitWrapperRef.current) return;
    const interval = setInterval(() => {
      if (kitRef.current && kitWrapperRef.current && !kitMounted) {
        kitRef.current.createButton(kitWrapperRef.current);
        setKitMounted(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [kitRef, kitMounted]);

  useEffect(() => {
    if (!kitMounted) return;
    const observer = new MutationObserver(() => {
      const modalOpen = !!document.querySelector(
        "stellar-wallets-modal, dialog[open], .stellar-wallets-modal",
      );
      if (!modalOpen && isConnecting) {
        /* hook handles reset */
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

  function copyAddress() {
    if (!wallet?.publicKey) return;
    navigator.clipboard.writeText(wallet.publicKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function openKitModal() {
    connectWithKit();
    kitWrapperRef.current?.querySelector("button")?.click();
  }

  // ── Connected ────────────────────────────────────────────────────────────────
  if (isConnected && wallet) {
    const isEphemeral = wallet.source === "ephemeral";
    const short = `${wallet.publicKey.slice(0, 4)}…${wallet.publicKey.slice(-4)}`;

    return (
      <div
        className="flex items-center gap-2"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        <div ref={kitWrapperRef} className="sr-only" aria-hidden="true" />

        {/* Network badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 border text-sm select-none",
            isMainnet
              ? "border-green-500/30 bg-green-500/5 text-green-400"
              : "border-amber-400/30 bg-amber-400/5 text-amber-400",
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              isMainnet ? "bg-green-400" : "bg-amber-400",
            )}
          />
          {networkLabel}
        </div>

        {/* Connected button */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className={cn(
              "flex items-center gap-2 border border-stone-700 bg-stone-900 px-3 py-2 text-sm transition hover:border-stone-500",
              className,
            )}
          >
            {/* Live dot */}
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>

            <span className="text-stone-200 tracking-wider">{short}</span>

            {/* Source badge */}
            <span
              className={cn(
                "text-sm px-1.5 py-px border",
                isEphemeral
                  ? "text-violet-400 border-violet-500/30 bg-violet-500/5"
                  : "text-blue-400 border-blue-500/30 bg-blue-500/5",
              )}
            >
              {isEphemeral ? "demo" : "kit"}
            </span>

            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-stone-500 transition-transform duration-200",
                showDropdown && "rotate-180",
              )}
            />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full mt-1 z-20 min-w-64 border border-stone-700 bg-stone-950 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-stone-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm text-stone-600 uppercase tracking-widest">
                      {isEphemeral ? "demo wallet" : "connected wallet"}
                    </p>
                    <button
                      onClick={copyAddress}
                      className="text-stone-700 hover:text-stone-400 transition-colors"
                      aria-label="Copy address"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-stone-400 break-all leading-relaxed">
                    {wallet.publicKey}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-stone-600">{balance ?? "—"}</p>
                    <button
                      onClick={() => refreshBalance()}
                      className="text-stone-700 hover:text-stone-400 transition-colors"
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
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  disconnect
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Disconnected ──────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={400}>
      <div
        className="flex flex-col items-start gap-1.5"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        <div ref={kitWrapperRef} className="sr-only" aria-hidden="true" />

        <div className={cn("flex items-center gap-2", className)}>
          {/* Connect Wallet */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                disabled={isConnecting || isGenerating}
                onClick={openKitModal}
                aria-label="Connect Stellar wallet"
                className="flex items-center gap-2 border border-stone-700 bg-stone-900 px-4 py-2 text-sm text-stone-300 hover:border-stone-500 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                <span className="whitespace-nowrap">
                  {isConnecting ? "connecting…" : "connect wallet"}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="max-w-52 text-center bg-stone-900 border-stone-700"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <p className="font-bold text-sm mb-0.5">have a stellar wallet?</p>
              <p className="text-sm text-stone-500">
                connect with Freighter, xBull, or any supported Stellar wallet
                extension.
              </p>
            </TooltipContent>
          </Tooltip>

          {allowEphemeral && (
            <>
              <span className="text-sm text-stone-700 select-none">or</span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    disabled={isConnecting || isGenerating}
                    onClick={() => generateEphemeral()}
                    aria-label="Generate a demo wallet"
                    className="flex items-center gap-2 border border-stone-700 bg-stone-900 px-4 py-2 text-sm text-stone-300 hover:border-stone-500 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    <span className="whitespace-nowrap">
                      {isGenerating ? "generating…" : "generate wallet"}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-52 text-center bg-stone-900 border-stone-700"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  <p className="font-bold text-sm mb-0.5">new to stellar?</p>
                  <p className="text-sm text-stone-500">
                    instantly creates a free testnet wallet so you can try the
                    game — no setup, no extensions needed.
                  </p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {error && (
          <div
            className="flex items-center gap-1.5 text-sm text-red-400 pl-1"
            role="alert"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
