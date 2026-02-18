"use client";

import { useState, useCallback } from "react";
import { Client as BotNFTClient } from "@/contracts/bot_nft";
import { networks } from "@/contracts/bot_nft";
import { useWallet } from "./useWallet";
import type { BotConfig } from "@/lib/types/types";
import type {
  BotConfig as ContractBotConfig,
  BotType as ContractBotType,
  SystemTargetId as ContractSystemTargetId,
  ResourceAttackType as ContractResourceAttackType,
  VictoryCondition as ContractVictoryCondition,
  SpecialAbility as ContractSpecialAbility,
  SpawnPattern as ContractSpawnPattern,
  SkillDiversity as ContractSkillDiversity,
} from "@/contracts/bot_nft";

// ─── Type Transformers ────────────────────────────────────────────────────────

function transformBotType(type: string): ContractBotType {
  const map: Record<string, string> = {
    malware: "Malware",
    trojan: "Trojan",
    ransomware: "Ransomware",
    worm: "Worm",
    rootkit: "Rootkit",
    spyware: "Spyware",
    botnet: "Botnet",
    logicbomb: "LogicBomb",
  };
  return { tag: map[type.toLowerCase()], values: undefined } as ContractBotType;
}

function transformSystemTarget(
  target: string | undefined,
): ContractSystemTargetId | undefined {
  if (!target) return undefined;
  const map: Record<string, string> = {
    compute: "Compute",
    storage: "Storage",
    network: "Network",
    auth: "Auth",
    analytics: "Analytics",
    communication: "Communication",
    transaction: "Transaction",
    api: "Api",
    endpoint: "Endpoint",
    cdn: "Cdn",
    iot: "Iot",
  };
  return {
    tag: map[target.toLowerCase()],
    values: undefined,
  } as ContractSystemTargetId;
}

function transformResourceAttack(attack: string): ContractResourceAttackType {
  const map: Record<string, string> = {
    cpu: "Cpu",
    memory: "Memory",
    bandwidth: "Bandwidth",
    disk: "Disk",
    none: "None",
  };
  return {
    tag: map[attack.toLowerCase()],
    values: undefined,
  } as ContractResourceAttackType;
}

function transformVictoryCondition(
  condition: string,
): ContractVictoryCondition {
  const map: Record<string, string> = {
    time_survival: "TimeSurvival",
    system_destruction: "SystemDestruction",
    data_exfiltration: "DataExfiltration",
  };
  return {
    tag: map[condition.toLowerCase()],
    values: undefined,
  } as ContractVictoryCondition;
}

function transformAbility(ability: string): ContractSpecialAbility {
  const map: Record<string, string> = {
    stealth: "Stealth",
    mutation: "Mutation",
    replication: "Replication",
    encryption: "Encryption",
    persistence: "Persistence",
  };
  return {
    tag: map[ability.toLowerCase()],
    values: undefined,
  } as ContractSpecialAbility;
}

function transformSpawnPattern(pattern: string): ContractSpawnPattern {
  const map: Record<string, string> = {
    steady: "Steady",
    burst: "Burst",
    crescendo: "Crescendo",
  };
  return {
    tag: map[pattern.toLowerCase()],
    values: undefined,
  } as ContractSpawnPattern;
}

function transformSkillDiversity(diversity: string): ContractSkillDiversity {
  const map: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };
  return {
    tag: map[diversity.toLowerCase()],
    values: undefined,
  } as ContractSkillDiversity;
}

function transformBotConfig(config: BotConfig): ContractBotConfig {
  return {
    version: 1,
    bot_name: config.botName,
    bot_type: transformBotType(config.botType),
    primary_target: config.primaryTarget
      ? transformSystemTarget(config.primaryTarget)
      : undefined,
    secondary_targets:
      config.secondaryTargets && config.secondaryTargets.length > 0
        ? (config.secondaryTargets
            .map(transformSystemTarget)
            .filter(Boolean) as ContractSystemTargetId[])
        : undefined,
    resource_attack: transformResourceAttack(config.resourceAttack),
    damage_multiplier: Math.round(config.damageMultiplier * 100), // 1.5 -> 150
    victory_condition: transformVictoryCondition(config.victoryCondition),
    abilities: config.abilities.map(transformAbility),
    threat_count: config.threatCount,
    spawn_pattern: transformSpawnPattern(config.spawnPattern),
    skill_diversity: transformSkillDiversity(config.skillDiversity),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface DeployBotState {
  isDeploying: boolean;
  tokenId: number | null;
  txHash: string | null;
  error: string | null;
}

export function useDeployBot() {
  const { wallet, signTransaction, networkPassphrase } = useWallet();
  const [state, setState] = useState<DeployBotState>({
    isDeploying: false,
    tokenId: null,
    txHash: null,
    error: null,
  });

  const deployBot = useCallback(
    async (config: BotConfig): Promise<number | null> => {
      if (!wallet) {
        setState((prev) => ({ ...prev, error: "No wallet connected" }));
        return null;
      }

      setState({
        isDeploying: true,
        tokenId: null,
        txHash: null,
        error: null,
      });

      try {
        console.log(
          "[useDeployBot] Starting deployment for wallet:",
          wallet.publicKey,
        );

        // Initialize contract client
        const client = new BotNFTClient({
          contractId: networks.testnet.contractId,
          networkPassphrase: networks.testnet.networkPassphrase,
          rpcUrl:
            process.env.NEXT_PUBLIC_RPC_URL ??
            "https://soroban-testnet.stellar.org",
          publicKey: wallet.publicKey,
        });

        // Set signing method
        client.options.signTransaction = signTransaction;

        // Transform config
        const contractConfig = transformBotConfig(config);
        console.log("[useDeployBot] Transformed config:", contractConfig);

        // Build and sign transaction using the contract client
        console.log("[useDeployBot] Calling deploy_bot");
        const tx = await client.deploy_bot({
          owner: wallet.publicKey,
          bot_config: contractConfig,
        });

        console.log("[useDeployBot] Signing and sending transaction");
        const { result } = await tx.signAndSend();

        const tokenId = result as number;

        // Extract transaction hash from the built transaction
        let txHash = "";
        try {
          if (tx.built) {
            console.log("[useDeployBot] tx built details", tx.built);
          }
        } catch (err) {
          console.warn("[useDeployBot] Could not extract tx hash:", err);
        }

        console.log("[useDeployBot] Success! TokenId:", tokenId);

        setState({
          isDeploying: false,
          tokenId,
          txHash,
          error: null,
        });

        return tokenId;
      } catch (err: any) {
        console.error("[useDeployBot] Error:", err);
        setState({
          isDeploying: false,
          tokenId: null,
          txHash: null,
          error: err?.message ?? "Deployment failed",
        });
        return null;
      }
    },
    [wallet, signTransaction, networkPassphrase],
  );

  const reset = useCallback(() => {
    setState({
      isDeploying: false,
      tokenId: null,
      txHash: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    deployBot,
    reset,
  };
}
