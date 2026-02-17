import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBSTBYNBRPSQWSDDVFEBYDQNLKQWINVCT4AGHQ4FN2W7F6H6ESQUKXRX",
  }
} as const

export type BotType = {tag: "Malware", values: void} | {tag: "Trojan", values: void} | {tag: "Ransomware", values: void} | {tag: "Worm", values: void} | {tag: "Rootkit", values: void} | {tag: "Spyware", values: void} | {tag: "Botnet", values: void} | {tag: "LogicBomb", values: void};

export type SystemTargetId = {tag: "Compute", values: void} | {tag: "Storage", values: void} | {tag: "Network", values: void} | {tag: "Auth", values: void} | {tag: "Analytics", values: void} | {tag: "Communication", values: void} | {tag: "Transaction", values: void} | {tag: "Api", values: void} | {tag: "Endpoint", values: void} | {tag: "Cdn", values: void} | {tag: "Iot", values: void};

export type ResourceAttackType = {tag: "Cpu", values: void} | {tag: "Memory", values: void} | {tag: "Bandwidth", values: void} | {tag: "Disk", values: void} | {tag: "None", values: void};

export type VictoryCondition = {tag: "TimeSurvival", values: void} | {tag: "SystemDestruction", values: void} | {tag: "DataExfiltration", values: void};

export type SpecialAbility = {tag: "Stealth", values: void} | {tag: "Mutation", values: void} | {tag: "Replication", values: void} | {tag: "Encryption", values: void} | {tag: "Persistence", values: void};

export type SpawnPattern = {tag: "Steady", values: void} | {tag: "Burst", values: void} | {tag: "Crescendo", values: void};

export type SkillDiversity = {tag: "Low", values: void} | {tag: "Medium", values: void} | {tag: "High", values: void};


export interface BotConfig {
  abilities: Array<SpecialAbility>;
  bot_name: string;
  bot_type: BotType;
  damage_multiplier: u32;
  primary_target: Option<SystemTargetId>;
  resource_attack: ResourceAttackType;
  secondary_targets: Option<Array<SystemTargetId>>;
  skill_diversity: SkillDiversity;
  spawn_pattern: SpawnPattern;
  threat_count: u32;
  version: u32;
  victory_condition: VictoryCondition;
}


export interface BotMetadata {
  created_at: u64;
  creator: string;
}

export type DataKey = {tag: "NextTokenId", values: void} | {tag: "Owner", values: readonly [u32]} | {tag: "BotConfig", values: readonly [u32]} | {tag: "BotMetadata", values: readonly [u32]};

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize contract
   */
  initialize: (options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a deploy_bot transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deploy a bot - mints NFT
   */
  deploy_bot: ({owner, bot_config}: {owner: string, bot_config: BotConfig}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_bot_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get bot config
   */
  get_bot_config: ({token_id}: {token_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<BotConfig>>

  /**
   * Construct and simulate a get_bot_metadata transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get bot metadata
   */
  get_bot_metadata: ({token_id}: {token_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<BotMetadata>>

  /**
   * Construct and simulate a owner_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get owner
   */
  owner_of: ({token_id}: {token_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Transfer ownership
   */
  transfer: ({from, to, token_id}: {from: string, to: string, token_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0JvdFR5cGUAAAAACAAAAAAAAAAAAAAAB01hbHdhcmUAAAAAAAAAAAAAAAAGVHJvamFuAAAAAAAAAAAAAAAAAApSYW5zb213YXJlAAAAAAAAAAAAAAAAAARXb3JtAAAAAAAAAAAAAAAHUm9vdGtpdAAAAAAAAAAAAAAAAAdTcHl3YXJlAAAAAAAAAAAAAAAABkJvdG5ldAAAAAAAAAAAAAAAAAAJTG9naWNCb21iAAAA",
        "AAAAAgAAAAAAAAAAAAAADlN5c3RlbVRhcmdldElkAAAAAAALAAAAAAAAAAAAAAAHQ29tcHV0ZQAAAAAAAAAAAAAAAAdTdG9yYWdlAAAAAAAAAAAAAAAAB05ldHdvcmsAAAAAAAAAAAAAAAAEQXV0aAAAAAAAAAAAAAAACUFuYWx5dGljcwAAAAAAAAAAAAAAAAAADUNvbW11bmljYXRpb24AAAAAAAAAAAAAAAAAAAtUcmFuc2FjdGlvbgAAAAAAAAAAAAAAAANBcGkAAAAAAAAAAAAAAAAIRW5kcG9pbnQAAAAAAAAAAAAAAANDZG4AAAAAAAAAAAAAAAADSW90AA==",
        "AAAAAgAAAAAAAAAAAAAAElJlc291cmNlQXR0YWNrVHlwZQAAAAAABQAAAAAAAAAAAAAAA0NwdQAAAAAAAAAAAAAAAAZNZW1vcnkAAAAAAAAAAAAAAAAACUJhbmR3aWR0aAAAAAAAAAAAAAAAAAAABERpc2sAAAAAAAAAAAAAAAROb25l",
        "AAAAAgAAAAAAAAAAAAAAEFZpY3RvcnlDb25kaXRpb24AAAADAAAAAAAAAAAAAAAMVGltZVN1cnZpdmFsAAAAAAAAAAAAAAARU3lzdGVtRGVzdHJ1Y3Rpb24AAAAAAAAAAAAAAAAAABBEYXRhRXhmaWx0cmF0aW9u",
        "AAAAAgAAAAAAAAAAAAAADlNwZWNpYWxBYmlsaXR5AAAAAAAFAAAAAAAAAAAAAAAHU3RlYWx0aAAAAAAAAAAAAAAAAAhNdXRhdGlvbgAAAAAAAAAAAAAAC1JlcGxpY2F0aW9uAAAAAAAAAAAAAAAACkVuY3J5cHRpb24AAAAAAAAAAAAAAAAAC1BlcnNpc3RlbmNlAA==",
        "AAAAAgAAAAAAAAAAAAAADFNwYXduUGF0dGVybgAAAAMAAAAAAAAAAAAAAAZTdGVhZHkAAAAAAAAAAAAAAAAABUJ1cnN0AAAAAAAAAAAAAAAAAAAJQ3Jlc2NlbmRvAAAA",
        "AAAAAgAAAAAAAAAAAAAADlNraWxsRGl2ZXJzaXR5AAAAAAADAAAAAAAAAAAAAAADTG93AAAAAAAAAAAAAAAABk1lZGl1bQAAAAAAAAAAAAAAAAAESGlnaA==",
        "AAAAAQAAAAAAAAAAAAAACUJvdENvbmZpZwAAAAAAAAwAAAAAAAAACWFiaWxpdGllcwAAAAAAA+oAAAfQAAAADlNwZWNpYWxBYmlsaXR5AAAAAAAAAAAACGJvdF9uYW1lAAAAEAAAAAAAAAAIYm90X3R5cGUAAAfQAAAAB0JvdFR5cGUAAAAAAAAAABFkYW1hZ2VfbXVsdGlwbGllcgAAAAAAAAQAAAAAAAAADnByaW1hcnlfdGFyZ2V0AAAAAAPoAAAH0AAAAA5TeXN0ZW1UYXJnZXRJZAAAAAAAAAAAAA9yZXNvdXJjZV9hdHRhY2sAAAAH0AAAABJSZXNvdXJjZUF0dGFja1R5cGUAAAAAAAAAAAARc2Vjb25kYXJ5X3RhcmdldHMAAAAAAAPoAAAD6gAAB9AAAAAOU3lzdGVtVGFyZ2V0SWQAAAAAAAAAAAAPc2tpbGxfZGl2ZXJzaXR5AAAAB9AAAAAOU2tpbGxEaXZlcnNpdHkAAAAAAAAAAAANc3Bhd25fcGF0dGVybgAAAAAAB9AAAAAMU3Bhd25QYXR0ZXJuAAAAAAAAAAx0aHJlYXRfY291bnQAAAAEAAAAAAAAAAd2ZXJzaW9uAAAAAAQAAAAAAAAAEXZpY3RvcnlfY29uZGl0aW9uAAAAAAAH0AAAABBWaWN0b3J5Q29uZGl0aW9u",
        "AAAAAQAAAAAAAAAAAAAAC0JvdE1ldGFkYXRhAAAAAAIAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAAB2NyZWF0b3IAAAAAEw==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAAC05leHRUb2tlbklkAAAAAAEAAAAAAAAABU93bmVyAAAAAAAAAQAAAAQAAAABAAAAAAAAAAlCb3RDb25maWcAAAAAAAABAAAABAAAAAEAAAAAAAAAC0JvdE1ldGFkYXRhAAAAAAEAAAAE",
        "AAAAAAAAABNJbml0aWFsaXplIGNvbnRyYWN0AAAAAAppbml0aWFsaXplAAAAAAAAAAAAAA==",
        "AAAAAAAAABhEZXBsb3kgYSBib3QgLSBtaW50cyBORlQAAAAKZGVwbG95X2JvdAAAAAAAAgAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAApib3RfY29uZmlnAAAAAAfQAAAACUJvdENvbmZpZwAAAAAAAAEAAAAE",
        "AAAAAAAAAA5HZXQgYm90IGNvbmZpZwAAAAAADmdldF9ib3RfY29uZmlnAAAAAAABAAAAAAAAAAh0b2tlbl9pZAAAAAQAAAABAAAH0AAAAAlCb3RDb25maWcAAAA=",
        "AAAAAAAAABBHZXQgYm90IG1ldGFkYXRhAAAAEGdldF9ib3RfbWV0YWRhdGEAAAABAAAAAAAAAAh0b2tlbl9pZAAAAAQAAAABAAAH0AAAAAtCb3RNZXRhZGF0YQA=",
        "AAAAAAAAAAlHZXQgb3duZXIAAAAAAAAIb3duZXJfb2YAAAABAAAAAAAAAAh0b2tlbl9pZAAAAAQAAAABAAAAEw==",
        "AAAAAAAAABJUcmFuc2ZlciBvd25lcnNoaXAAAAAAAAh0cmFuc2ZlcgAAAAMAAAAAAAAABGZyb20AAAATAAAAAAAAAAJ0bwAAAAAAEwAAAAAAAAAIdG9rZW5faWQAAAAEAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        deploy_bot: this.txFromJSON<u32>,
        get_bot_config: this.txFromJSON<BotConfig>,
        get_bot_metadata: this.txFromJSON<BotMetadata>,
        owner_of: this.txFromJSON<string>,
        transfer: this.txFromJSON<null>
  }
}