"use client";

import { useCallback, useState } from "react";
import {
  Client as LeaderboardClient,
  networks,
  LeaderboardRow,
  ScoreEntry,
} from "@/contracts/leaderboard";
import { useWallet } from "@/hooks/useWallet";
import type { ProofResult } from "@/hooks/useProver";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";

const SELECTOR =
  process.env.NEXT_PUBLIC_VERIFIER_CONTRACT_SELECTOR ?? "73c457ba";

export type SubmitStatus = "idle" | "submitting" | "success" | "error";

export function useLeaderboard() {
  const { wallet, signTransaction } = useWallet();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [topScores, setTopScores] = useState<LeaderboardRow[]>([]);
  const [personalBest, setPersonalBest] = useState<ScoreEntry | null>(null);

  const buildClient = useCallback(() => {
    if (!wallet?.publicKey) return null;
    return new LeaderboardClient({
      contractId: networks.testnet.contractId,
      networkPassphrase: networks.testnet.networkPassphrase,
      rpcUrl: RPC_URL,
      publicKey: wallet.publicKey,
      signTransaction,
    });
  }, [wallet?.publicKey, signTransaction]);

  const submitScore = useCallback(
    async (
      proof: ProofResult,
      playerName: string,
      botConfigId: number,
    ): Promise<boolean> => {
      const client = buildClient();
      if (!client || !wallet?.publicKey) {
        setSubmitError("No wallet connected");
        return false;
      }

      setSubmitStatus("submitting");
      setSubmitError(null);

      try {
        // seal = selector (4 bytes) + seal bytes
        const sealHex = proof.seal_hex.replace(/^0x/, "");
        const selectorHex = SELECTOR.replace(/^0x/, "");
        const fullSealHex = selectorHex + sealHex;

        const sealBuf = Buffer.from(fullSealHex, "hex");
        const imageIdBuf = Buffer.from(
          proof.image_id_hex.replace(/^0x/, ""),
          "hex",
        );
        const journalHashBuf = Buffer.from(
          proof.journal_sha256_hex.replace(/^0x/, ""),
          "hex",
        );

        console.log("[useLeaderboard] submit_score:", {
          player: wallet.publicKey,
          name: playerName,
          score: proof.journal.score,
          threats_cured: proof.journal.threats_cured,
          accuracy_bps: proof.journal.accuracy_bps,
          duration_ms: proof.journal.duration_ms,
          bot_id: botConfigId,
          journal_hash: proof.journal_sha256_hex,
          image_id: proof.image_id_hex,
          seal: `0x${fullSealHex.slice(0, 16)}...`,
        });

        const tx = await client.submit_score({
          player: wallet.publicKey,
          name: playerName,
          score: proof.journal.score,
          threats_cured: proof.journal.threats_cured,
          accuracy_bps: proof.journal.accuracy_bps,
          duration_ms: proof.journal.duration_ms,
          bot_id: botConfigId,
          journal_hash: journalHashBuf,
          image_id: imageIdBuf,
          seal: sealBuf,
        });

        await tx.signAndSend({ force: true });

        console.log("[useLeaderboard] submit_score success");
        setSubmitStatus("success");
        return true;
      } catch (e: any) {
        const msg = e?.message ?? "Score submission failed";
        console.error("[useLeaderboard] submit_score error:", e);
        setSubmitError(msg);
        setSubmitStatus("error");
        return false;
      }
    },
    [buildClient, wallet?.publicKey],
  );

  const fetchTopScores = useCallback(async (): Promise<LeaderboardRow[]> => {
    const client = buildClient();
    if (!client) return [];
    try {
      const tx = await client.get_top();
      const rows = tx.result as LeaderboardRow[];
      setTopScores(rows);
      return rows;
    } catch (e) {
      console.error("[useLeaderboard] get_top error:", e);
      return [];
    }
  }, [buildClient]);

  const fetchPersonalBest = useCallback(
    async (player?: string): Promise<ScoreEntry | null> => {
      const client = buildClient();
      if (!client) return null;
      const address = player ?? wallet?.publicKey;
      if (!address) return null;
      try {
        const tx = await client.get_best({ player: address });
        const entry = tx.result as ScoreEntry | null;
        if (!player) setPersonalBest(entry); // only cache if own best
        return entry;
      } catch (e) {
        console.error("[useLeaderboard] get_best error:", e);
        return null;
      }
    },
    [buildClient, wallet?.publicKey],
  );

  return {
    submitScore,
    fetchTopScores,
    fetchPersonalBest,
    submitStatus,
    submitError,
    topScores,
    personalBest,
  };
}
