"use client";

import { useCallback, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { StrKey } from "@stellar/stellar-sdk";

const PROVER_URL = process.env.NEXT_PUBLIC_PROVER_URL ?? "http://0.0.0.0:8080";

export interface ProofResult {
  seal_hex: string;
  image_id_hex: string;
  journal_sha256_hex: string;
  journal_bytes_hex: string;
  journal: {
    challenge_id: string;
    player_pubkey: string;
    bot_config_id: number;
    threats_cured: number;
    systems_destroyed: number;
    data_leaked_x100: number;
    score: number;
    duration_ms: number;
    accuracy_bps: number;
  };
}

export type ProverStatus = "idle" | "proving" | "success" | "error";

export function useProver() {
  const { wallet } = useWallet();
  const [status, setStatus] = useState<ProverStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProofResult | null>(null);

  const prove = useCallback(
    async (
      challengeId: string,
      botConfigId: number,
      actionLog: {
        dev_index: number;
        threat_index: number;
        assigned_at_ms: number;
        unassigned_at_ms: number;
      }[],
    ): Promise<ProofResult | null> => {
      if (!wallet?.publicKey) {
        setError("No wallet connected");
        return null;
      }

      const pubkeyBytes = StrKey.decodeEd25519PublicKey(wallet.publicKey);
      const pubkeyHex = Buffer.from(pubkeyBytes).toString("hex");
      console.log("[useProver] Pubkey Hex: ", pubkeyHex);
      console.log("[useProver] challengeID: ", challengeId);

      setStatus("proving");
      setError(null);
      setResult(null);

      //   try {
      //     const resp = await fetch(`${PROVER_URL}/prove`, {
      //       method: "POST",
      //       headers: { "Content-Type": "application/json" },
      //       body: JSON.stringify({
      //         challenge_id: challengeId,
      //         player_pubkey: pubkeyHex,
      //         bot_config_id: botConfigId,
      //         action_log: actionLog,
      //       }),
      //     });

      //     const data = await resp.json();

      //     if (!data.success) {
      //       throw new Error(data.error ?? "Proof generation failed");
      //     }

      //     setStatus("success");
      //     setResult(data);
      //     return data;
      //   } catch (e: any) {
      //     const msg = e?.message ?? "Unknown prover error";
      //     setError(msg);
      //     setStatus("error");
      //     return null;
      //   }
    },
    [wallet?.publicKey],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
  }, []);

  return { prove, status, error, result, reset };
}
