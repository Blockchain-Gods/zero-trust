"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { StrKey } from "@stellar/stellar-sdk";
import { useWallet } from "@/hooks/useWallet";

const PROVER_URL = process.env.NEXT_PUBLIC_PROVER_URL ?? "http://0.0.0.0:8080";

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

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

export type ProverStatus =
  | "idle"
  | "submitting"
  | "proving"
  | "success"
  | "error";

export function useProver() {
  const { wallet } = useWallet();
  const [status, setStatus] = useState<ProverStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProofResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastIdRef = useRef<string | number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

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
    ): Promise<void> => {
      if (!wallet?.publicKey) {
        setError("No wallet connected");
        return;
      }

      stopPolling();
      setStatus("submitting");
      setError(null);
      setResult(null);
      setJobId(null);

      const pubkeyHex = Buffer.from(
        StrKey.decodeEd25519PublicKey(wallet.publicKey),
      ).toString("hex");

      // Step 1: Submit, get job_id immediately
      let job_id: string;
      try {
        const resp = await fetch(`${PROVER_URL}/prove`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challenge_id: challengeId,
            player_pubkey: pubkeyHex,
            bot_config_id: botConfigId,
            action_log: actionLog,
          }),
        });

        const data = await resp.json();

        if (!resp.ok || !data.job_id) {
          throw new Error(data.error ?? "Failed to submit proof job");
        }

        job_id = data.job_id;
      } catch (e: any) {
        setError(e?.message ?? "Failed to submit");
        setStatus("error");
        toast.error("Proof submission failed", {
          description: e?.message ?? "Could not reach prover",
        });
        return;
      }

      setJobId(job_id);
      setStatus("proving");

      // Step 2: Persistent loading toast
      toastIdRef.current = toast.loading("Generating ZK proof…", {
        description: `Job ${job_id.slice(0, 8)}… — this takes ~9 minutes`,
        duration: Infinity,
      });

      // Step 3: Poll /status/:job_id
      const startedAt = Date.now();

      pollRef.current = setInterval(async () => {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          stopPolling();
          setStatus("error");
          setError("Proof timed out after 15 minutes");
          toast.dismiss(toastIdRef.current ?? undefined);
          toast.error("Proof timed out", {
            description: "The prover took too long. Try again.",
          });
          return;
        }

        try {
          const resp = await fetch(`${PROVER_URL}/status/${job_id}`);
          const data = await resp.json();

          if (data.status === "done") {
            stopPolling();
            setStatus("success");
            setResult(data.result);
            toast.dismiss(toastIdRef.current ?? undefined);
            toast.success("ZK Proof ready!", {
              description: `Score ${data.result.journal?.score ?? "?"} verified — ready to submit on-chain`,
              duration: 15_000,
              //   action: {
              //     label: "Submit Score",
              //     onClick: () => {
              //       window.dispatchEvent(
              //         new CustomEvent("zk-proof-ready", { detail: data.result }),
              //       );
              //     },
              //   },
            });
            window.dispatchEvent(
              new CustomEvent("zk-proof-ready", { detail: data.result }),
            );
          } else if (data.status === "failed") {
            stopPolling();
            setStatus("error");
            setError(data.error ?? "Proof failed");
            toast.dismiss(toastIdRef.current ?? undefined);
            toast.error("Proof failed", { description: data.error });
          }
          // "pending" | "proving" → keep polling
        } catch (e) {
          console.warn("[useProver] Poll error, will retry:", e);
        }
      }, POLL_INTERVAL_MS);
    },
    [wallet?.publicKey, stopPolling],
  );

  const reset = useCallback(() => {
    stopPolling();
    toast.dismiss(toastIdRef.current ?? undefined);
    setStatus("idle");
    setError(null);
    setResult(null);
    setJobId(null);
  }, [stopPolling]);

  return { prove, status, error, result, jobId, reset };
}
