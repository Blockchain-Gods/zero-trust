/**
 * Application constants
 * Configuration loaded from environment variables
 */

import { getRuntimeConfig } from "@/lib/stellar/runtimeConfig";

const runtimeConfig = getRuntimeConfig();

export const SOROBAN_RPC_URL =
  runtimeConfig?.rpcUrl || "https://soroban-testnet.stellar.org";
export const RPC_URL = SOROBAN_RPC_URL; // Alias for compatibility
export const NETWORK_PASSPHRASE =
  runtimeConfig?.networkPassphrase || "Test SDF Network ; September 2015";
export const NETWORK = SOROBAN_RPC_URL.includes("testnet")
  ? "testnet"
  : "mainnet";

function contractEnvKey(crateName: string): string {
  // Crate name -> env key matches scripts/utils/contracts.ts: hyphens become underscores.
  const envKey = crateName.replace(/-/g, "_").toUpperCase();

  return `NEXT_PUBLIC_${envKey}_CONTRACT_ID`;
}

// export function getContractId(crateName: string): string {
//   const runtimeId = runtimeConfig?.contractIds?.[crateName];
//   if (runtimeId) return runtimeId;

//   console.log("getContractId: ", contractEnvKey(crateName));
//   return process.env[contractEnvKey(crateName)] || "";
// }

// export function getAllContractIds(): Record<string, string> {
//   const out: Record<string, string> = {};

//   if (runtimeConfig?.contractIds) {
//     for (const [key, value] of Object.entries(runtimeConfig.contractIds)) {
//       if (!value) continue;
//       out[key] = value;
//     }
//   }

//   // Next.js doesn't expose process.env as iterable, so list keys explicitly
//   const envEntries = Object.entries(process.env).filter(
//     ([key]) => key.startsWith("NEXT_PUBLIC_") && key.endsWith("_CONTRACT_ID"),
//   );

//   console.log("envEntries: ", envEntries);

//   for (const [key, value] of envEntries) {
//     if (!value) continue;
//     const envKey = key.slice(
//       "NEXT_PUBLIC_".length,
//       key.length - "_CONTRACT_ID".length,
//     );
//     const crateName = envKey.toLowerCase().replace(/_/g, "-");
//     if (!out[crateName]) out[crateName] = value;
//   }

//   return out;
// }

// Contract IDs (backwards-compatible named exports for built-in games)
// export const MOCK_GAME_HUB_CONTRACT = getContractId("mock-game-hub");
// export const TWENTY_ONE_CONTRACT = getContractId("twenty-one");
// export const MY_GAME_CONTRACT = getContractId("my-game");
// export const DICE_DUEL_CONTRACT = getContractId("dice-duel");

// Dev wallet addresses
export const ZERO_TRUST_CONTRACT_ID =
  process.env.NEXT_PUBLIC_ZERO_TRUST_CONTRACT_ID || "";

export const DEV_ADMIN_ADDRESS =
  process.env.NEXT_PUBLIC_DEV_ADMIN_ADDRESS || "";

export const DEV_PLAYER1_ADDRESS =
  process.env.NEXT_PUBLIC_DEV_PLAYER1_ADDRESS || "";
export const DEV_PLAYER2_ADDRESS =
  process.env.NEXT_PUBLIC_DEV_PLAYER2_ADDRESS || "";

// Runtime-configurable simulation source (for standalone builds)
export const RUNTIME_SIMULATION_SOURCE =
  runtimeConfig?.simulationSourceAddress ||
  process.env.NEXT_PUBLIC_SIMULATION_SOURCE_ADDRESS ||
  "";

// Transaction options
export const DEFAULT_METHOD_OPTIONS = {
  timeoutInSeconds: 30,
};

// Auth TTL constants (in minutes)
export const DEFAULT_AUTH_TTL_MINUTES = 5;
export const MULTI_SIG_AUTH_TTL_MINUTES = 60;
