"use client";

import { useCallback, useState } from "react";
import { Client as BotNFTClient, networks } from "@/contracts/bot_nft";
import type {
  BotConfig as ContractBotConfig,
  BotMetadata as ContractBotMetadata,
} from "@/contracts/bot_nft";
import { saveDeployedBot } from "@/lib/storage";
import { BotConfigFE } from "@/lib/types/types";
import { normaliseTag, normaliseTagHyphen } from "@/lib/utils";

// ─── Config ───────────────────────────────────────────────────────────────────

const SYNC_CACHE_KEY = "zero-trust-last-sync";
const SYNC_TTL_MS = 60_000; // re-fetch at most once per minute

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";

// ─── Contract → Local type normalisation ─────────────────────────────────────
// Contract returns PascalCase discriminated unions; local types use lowercase.

function contractConfigToLocal(
  config: ContractBotConfig,
  tokenId: number,
  metadata: ContractBotMetadata,
): BotConfigFE {
  return {
    id: `token_${tokenId}`,
    botName: config.bot_name,
    botType: normaliseTagHyphen(config.bot_type.tag) as BotConfigFE["botType"],
    primaryTarget: config.primary_target
      ? (normaliseTag(
          config.primary_target.tag,
        ) as BotConfigFE["primaryTarget"])
      : "compute",
    secondaryTargets: config.secondary_targets
      ? config.secondary_targets.map(
          (t) => normaliseTag(t.tag) as BotConfigFE["primaryTarget"],
        )
      : [],
    resourceAttack: normaliseTag(
      config.resource_attack.tag,
    ) as BotConfigFE["resourceAttack"],
    damageMultiplier: config.damage_multiplier / 100, // 150 → 1.5
    victoryCondition: normaliseTag(
      config.victory_condition.tag,
    ) as BotConfigFE["victoryCondition"],
    abilities: config.abilities.map(
      (a) => normaliseTag(a.tag) as BotConfigFE["abilities"][number],
    ),
    threatCount: config.threat_count,
    spawnPattern: normaliseTag(
      config.spawn_pattern.tag,
    ) as BotConfigFE["spawnPattern"],
    skillDiversity: normaliseTag(
      config.skill_diversity.tag,
    ) as BotConfigFE["skillDiversity"],
    createdAt: new Date(Number(metadata.created_at) * 1000).toISOString(),
    creatorName: metadata.creator,
    version: config.version,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface BotSyncState {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  totalFetched: number;
  error: string | null;
}

export function useBotSync() {
  const [state, setState] = useState<BotSyncState>({
    isSyncing: false,
    lastSyncedAt: null,
    totalFetched: 0,
    error: null,
  });

  const sync = useCallback(async (force = false) => {
    // Throttle: skip if synced recently
    if (!force) {
      try {
        const raw = localStorage.getItem(SYNC_CACHE_KEY);
        if (raw) {
          const last = parseInt(raw, 10);
          if (Date.now() - last < SYNC_TTL_MS) return;
        }
      } catch {
        // ignore storage errors
      }
    }

    setState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Read-only client - no wallet needed for simulated reads
      const client = new BotNFTClient({
        contractId: networks.testnet.contractId,
        networkPassphrase: networks.testnet.networkPassphrase,
        rpcUrl: RPC_URL,
      });

      let tokenId = 1;
      let fetched = 0;

      // Iterate until contract throws "not found" / any error
      while (true) {
        try {
          const [configTx, metaTx] = await Promise.all([
            client.get_bot_config({ token_id: tokenId }),
            client.get_bot_metadata({ token_id: tokenId }),
          ]);

          //   console.log("[useBotSync] localConfig: ", configTx);

          const config = configTx.result;
          const metadata = metaTx.result;

          const localConfig = contractConfigToLocal(config, tokenId, metadata);
          saveDeployedBot(localConfig, tokenId);

          fetched++;
          tokenId++;
        } catch {
          // No more tokens
          break;
        }
      }

      const now = Date.now();
      localStorage.setItem(SYNC_CACHE_KEY, String(now));

      setState({
        isSyncing: false,
        lastSyncedAt: now,
        totalFetched: fetched,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message ?? "Sync failed",
      }));
    }
  }, []);

  return { ...state, sync };
}
