"use client";

import { useCallback } from "react";
import { Client as VerifierClient, networks } from "@/contracts/verifier"; // adjust path
import { useWallet } from "@/hooks/useWallet";
import type { ProofResult } from "@/hooks/useProver";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";

const SELECTOR =
  process.env.NEXT_PUBLIC_VERIFIER_CONTRACT_SELECTOR ?? "73c457ba";

export function useVerifier() {
  const { wallet, signTransaction } = useWallet();

  const verify = useCallback(
    async (proof: ProofResult): Promise<boolean> => {
      if (!wallet?.publicKey) throw new Error("No wallet connected");

      const client = new VerifierClient({
        contractId: networks.testnet.contractId,
        networkPassphrase: networks.testnet.networkPassphrase,
        rpcUrl: RPC_URL,
        publicKey: wallet.publicKey,
        signTransaction,
      });

      // seal = selector (4 bytes) + seal bytes (rest)
      // proof.seal_hex is "0x<hex>" — strip 0x, prepend selector
      const sealHex = proof.seal_hex.replace(/^0x/, "");
      const selectorHex = SELECTOR.replace(/^0x/, "");
      const fullSealHex = selectorHex + sealHex;

      const sealBuf = Buffer.from(fullSealHex, "hex");
      const imageIdBuf = Buffer.from(
        proof.image_id_hex.replace(/^0x/, ""),
        "hex",
      );
      // journal here is the sha256 digest (32 bytes), not raw journal bytes
      const journalBuf = Buffer.from(
        proof.journal_sha256_hex.replace(/^0x/, ""),
        "hex",
      );

      console.log("[useVerifier] verify call:", {
        seal: fullSealHex,
        image_id: proof.image_id_hex,
        journal: proof.journal_sha256_hex,
      });

      const tx = await client.verify({
        seal: sealBuf,
        image_id: imageIdBuf,
        journal: journalBuf,
      });

      console.log("[useVerifier] simulated tx result:", tx.result);

      await tx.signAndSend({ force: true });

      console.log("[useVerifier] verify tx sent");
      return true;
    },
    [wallet?.publicKey, signTransaction],
  );

  return { verify };
}
