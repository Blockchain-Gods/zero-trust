"use client";

import { useCallback, useRef } from "react";
import { Client as GameHubClient, networks } from "@/contracts/game_hub";
import { useWallet } from "@/hooks/useWallet";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";

// Game contract address — used as game_id in start_game
const GAME_CONTRACT_ID =
  process.env.NEXT_PUBLIC_GAME_CONTRACT_ID ??
  "CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG";

const BOT_ADDRESS = "GDL5QR3YRT5SWTWLBWCTQTPLYWOQRYXIDIPNKJQZV6IYVQ4VAT2LBT6Q"; // Dummy generated address since this is a single player game

export function useGameHub() {
  const { wallet, signTransaction } = useWallet(); // ← signTransaction from hook
  const sessionIdRef = useRef<number>(0);

  const buildClient = useCallback(() => {
    if (!wallet?.publicKey) return null;
    return new GameHubClient({
      contractId: networks.testnet.contractId,
      networkPassphrase: networks.testnet.networkPassphrase,
      rpcUrl: RPC_URL,
      publicKey: wallet.publicKey,
      signTransaction, // ← pass here so AssembledTransaction can use it
    });
  }, [wallet?.publicKey, signTransaction]);

  const startGame = useCallback(
    async (currentScore: number): Promise<number> => {
      const client = buildClient();
      if (!client || !wallet?.publicKey) {
        console.warn("[GameHub] No wallet, skipping start_game");
        return 0;
      }

      const sessionId = Math.floor(Date.now() / 1000) % 0xffffffff;
      sessionIdRef.current = sessionId;

      try {
        const tx = await client.start_game({
          game_id: GAME_CONTRACT_ID,
          session_id: sessionId,
          player1: wallet.publicKey,
          player2: BOT_ADDRESS,
          player1_points: BigInt(currentScore),
          player2_points: BigInt(0),
        });
        await tx.signAndSend(); // ← no args needed, signTransaction already in client
        console.log("[GameHub] start_game session_id:", sessionId);
      } catch (e) {
        console.error("[GameHub] start_game failed:", e);
      }

      return sessionId;
    },
    [buildClient, wallet?.publicKey],
  );

  const endGame = useCallback(
    async (sessionId: number, defenderWon: boolean): Promise<void> => {
      const client = buildClient();
      if (!client || !wallet?.publicKey) {
        console.warn("[GameHub] No wallet, skipping end_game");
        return;
      }

      try {
        const tx = await client.end_game({
          session_id: sessionId,
          player1_won: defenderWon,
        });
        await tx.signAndSend({ force: true });
        console.log("[GameHub] end_game player1_won:", defenderWon);
      } catch (e) {
        console.error("[GameHub] end_game failed:", e);
      }
    },
    [buildClient, wallet?.publicKey],
  );

  return { startGame, endGame, sessionIdRef };
}
