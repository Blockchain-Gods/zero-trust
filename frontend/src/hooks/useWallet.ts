"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ConnectedWallet, WalletState } from "@/lib/types/walletTypes";

// ─── Config ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "zero-trust-wallet";
const FRIENDBOT_URL =
  process.env.NEXT_PUBLIC_FRIENDBOT_URL ?? "https://friendbot.stellar.org";
const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ??
  "Test SDF Network ; September 2015";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseWalletReturn extends WalletState {
  connectWithKit: () => void;
  generateEphemeral: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (txXdr: string) => Promise<string>;
  refreshBalance: () => Promise<void>;
  kitRef: React.MutableRefObject<any>;
  networkPassphrase: string;
}

export function useWallet(): UseWalletReturn {
  const kitRef = useRef<any>(null);

  // Use a ref for the current wallet source so the polling interval
  // can read it without going stale — never read state inside setInterval
  const walletSourceRef = useRef<"kit" | "ephemeral" | null>(null);
  const prevAddressRef = useRef<string | null>(null);

  const [state, setState] = useState<WalletState>({
    wallet: null,
    isConnected: false,
    isConnecting: false,
    isGenerating: false,
    balance: null,
    error: null,
  });

  // Keep walletSourceRef in sync with state
  useEffect(() => {
    walletSourceRef.current = state.wallet?.source ?? null;
  }, [state.wallet?.source]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function setPartial(patch: Partial<WalletState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function persistEphemeral(wallet: ConnectedWallet) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    } catch {
      /* ignore */
    }
  }

  function clearPersisted() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function setConnected(wallet: ConnectedWallet) {
    prevAddressRef.current = wallet.publicKey;
    walletSourceRef.current = wallet.source;
    setState({
      wallet,
      isConnected: true,
      isConnecting: false,
      isGenerating: false,
      balance: null,
      error: null,
    });
  }

  // ── Init: restore persisted ephemeral wallet ───────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: ConnectedWallet = JSON.parse(raw);
      if (parsed?.publicKey && parsed?.source === "ephemeral") {
        setConnected(parsed);
      }
    } catch {
      clearPersisted();
    }
  }, []);

  // ── Init: Stellar Wallets Kit ──────────────────────────────────────────────
  useEffect(() => {
    async function initKit() {
      try {
        const [{ StellarWalletsKit }, { defaultModules }] = await Promise.all([
          import("@creit-tech/stellar-wallets-kit/sdk"),
          import("@creit-tech/stellar-wallets-kit/modules/utils"),
        ]);
        StellarWalletsKit.init({ modules: defaultModules() });
        kitRef.current = StellarWalletsKit;
      } catch (err) {
        console.error("[useWallet] Kit init failed:", err);
      }
    }
    initKit();
  }, []);

  // ── Poll kit — stable interval, reads refs not state ──────────────────────
  // Deps: empty — runs once, interval reads refs so it never goes stale.
  useEffect(() => {
    const interval = setInterval(async () => {
      // Don't poll if an ephemeral wallet is active
      if (walletSourceRef.current === "ephemeral") return;
      if (!kitRef.current) return;

      try {
        const result = await kitRef.current.getAddress();
        const address: string | null = result?.address ?? null;

        if (address && address !== prevAddressRef.current) {
          // New kit wallet connected
          prevAddressRef.current = address;
          walletSourceRef.current = "kit";
          setState({
            wallet: { publicKey: address, source: "kit" },
            isConnected: true,
            isConnecting: false,
            isGenerating: false,
            balance: null,
            error: null,
          });
        } else if (
          !address &&
          prevAddressRef.current &&
          walletSourceRef.current === "kit"
        ) {
          // Kit wallet disconnected externally
          prevAddressRef.current = null;
          walletSourceRef.current = null;
          setState({
            wallet: null,
            isConnected: false,
            isConnecting: false,
            isGenerating: false,
            balance: null,
            error: null,
          });
        }
      } catch {
        // getAddress() throws when nothing connected — only clear if we
        // thought we had a kit wallet
        if (walletSourceRef.current === "kit") {
          prevAddressRef.current = null;
          walletSourceRef.current = null;
          setState({
            wallet: null,
            isConnected: false,
            isConnecting: false,
            isGenerating: false,
            balance: null,
            error: null,
          });
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []); // ← empty deps: stable forever

  // ── Auto-refresh balance on connect ───────────────────────────────────────
  useEffect(() => {
    if (state.isConnected && state.wallet?.publicKey) {
      void refreshBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.wallet?.publicKey]);

  // ── Connect via Kit ────────────────────────────────────────────────────────
  const connectWithKit = useCallback(() => {
    setPartial({ isConnecting: true, error: null });
  }, []);

  // ── Generate ephemeral wallet ──────────────────────────────────────────────
  const generateEphemeral = useCallback(async () => {
    setPartial({ isGenerating: true, error: null });

    try {
      const StellarSdk = await import("@stellar/stellar-sdk");
      const keypair = StellarSdk.Keypair.random();
      const publicKey = keypair.publicKey();
      const secretKey = keypair.secret();

      const wallet: ConnectedWallet = {
        publicKey,
        secretKey,
        source: "ephemeral",
      };

      const url = new URL(FRIENDBOT_URL);
      url.searchParams.set("addr", publicKey);
      const res = await fetch(url.toString());
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Friendbot failed (${res.status}): ${text || "unknown"}`,
        );
      }

      persistEphemeral(wallet);
      setConnected(wallet);
    } catch (err: any) {
      setPartial({
        isGenerating: false,
        error: err?.message ?? "Wallet generation failed",
      });
    }
  }, []);

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (walletSourceRef.current === "kit") {
      kitRef.current?.disconnect?.().catch(() => {});
    }
    clearPersisted();
    prevAddressRef.current = null;
    walletSourceRef.current = null;
    setState({
      wallet: null,
      isConnected: false,
      isConnecting: false,
      isGenerating: false,
      balance: null,
      error: null,
    });
  }, []);

  // ── Unified signTransaction ────────────────────────────────────────────────
  const signTransaction = useCallback(
    async (txXdr: string): Promise<string> => {
      const wallet = walletSourceRef.current;
      if (!wallet) throw new Error("No wallet connected");

      if (wallet === "ephemeral") {
        // Read secret from state via functional update to avoid stale closure
        return new Promise((resolve, reject) => {
          setState((prev) => {
            if (!prev.wallet?.secretKey) {
              reject(new Error("Missing secret key"));
              return prev;
            }
            import("@stellar/stellar-sdk").then((StellarSdk) => {
              try {
                const keypair = StellarSdk.Keypair.fromSecret(
                  prev.wallet!.secretKey!,
                );
                const tx = StellarSdk.TransactionBuilder.fromXDR(
                  txXdr,
                  NETWORK_PASSPHRASE,
                );
                tx.sign(keypair);
                resolve(tx.toXDR());
              } catch (err) {
                reject(err);
              }
            });
            return prev;
          });
        });
      }

      if (!kitRef.current) throw new Error("Wallet kit not initialized");
      const { signedTxXdr } = await kitRef.current.signTransaction(txXdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: prevAddressRef.current,
      });
      return signedTxXdr;
    },
    [],
  );

  // ── Refresh balance ────────────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    const publicKey = prevAddressRef.current;
    if (!publicKey) return;
    try {
      const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
      if (!res.ok) throw new Error("Account not found");
      const data = await res.json();
      const native = data.balances?.find((b: any) => b.asset_type === "native");
      setPartial({
        balance: native
          ? `${parseFloat(native.balance).toFixed(2)} XLM`
          : "0 XLM",
      });
    } catch {
      setPartial({ balance: "unavailable" });
    }
  }, []); // stable — reads ref, not state

  return {
    ...state,
    connectWithKit,
    generateEphemeral,
    disconnect,
    signTransaction,
    refreshBalance,
    kitRef,
    networkPassphrase: NETWORK_PASSPHRASE,
  };
}
