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
    contractId: "CB2AD24HOZPNMVLOD2PR7Y6ZNDSL7P26WYDB27JMQNHXKH5K5R3HDFGX",
  }
} as const


export interface ScoreEntry {
  accuracy_bps: u32;
  bot_id: u32;
  duration_ms: u32;
  name: string;
  score: u32;
  submitted_ledger: u32;
  threats_cured: u32;
}


export interface LeaderboardRow {
  accuracy_bps: u32;
  bot_id: u32;
  name: string;
  player: string;
  score: u32;
  threats_cured: u32;
}

export const Errors = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"InvalidName"},
  4: {message:"InvalidImageId"},
  5: {message:"ProofVerificationFailed"}
}

export interface Client {
  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deploy once: sets admin, verifier contract, and guest image_id
   */
  init: ({admin, verifier_id, image_id}: {admin: string, verifier_id: string, image_id: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_image_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin can update image_id when guest program is redeployed
   */
  set_image_id: ({image_id}: {image_id: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a submit_score transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Submit a verified score. Proof is verified inside this call.
   */
  submit_score: ({player, name, score, threats_cured, accuracy_bps, duration_ms, bot_id, journal_hash, image_id, seal}: {player: string, name: string, score: u32, threats_cured: u32, accuracy_bps: u32, duration_ms: u32, bot_id: u32, journal_hash: Buffer, image_id: Buffer, seal: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_best transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get a player's personal best
   */
  get_best: ({player}: {player: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<ScoreEntry>>>

  /**
   * Construct and simulate a get_top transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get global top 20
   */
  get_top: (options?: MethodOptions) => Promise<AssembledTransaction<Array<LeaderboardRow>>>

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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAAClNjb3JlRW50cnkAAAAAAAcAAAAAAAAADGFjY3VyYWN5X2JwcwAAAAQAAAAAAAAABmJvdF9pZAAAAAAABAAAAAAAAAALZHVyYXRpb25fbXMAAAAABAAAAAAAAAAEbmFtZQAAABAAAAAAAAAABXNjb3JlAAAAAAAABAAAAAAAAAAQc3VibWl0dGVkX2xlZGdlcgAAAAQAAAAAAAAADXRocmVhdHNfY3VyZWQAAAAAAAAE",
        "AAAAAQAAAAAAAAAAAAAADkxlYWRlcmJvYXJkUm93AAAAAAAGAAAAAAAAAAxhY2N1cmFjeV9icHMAAAAEAAAAAAAAAAZib3RfaWQAAAAAAAQAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAAAAAAABXNjb3JlAAAAAAAABAAAAAAAAAANdGhyZWF0c19jdXJlZAAAAAAAAAQ=",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABQAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAAAAAAAALSW52YWxpZE5hbWUAAAAAAwAAAAAAAAAOSW52YWxpZEltYWdlSWQAAAAAAAQAAAAAAAAAF1Byb29mVmVyaWZpY2F0aW9uRmFpbGVkAAAAAAU=",
        "AAAAAAAAAD5EZXBsb3kgb25jZTogc2V0cyBhZG1pbiwgdmVyaWZpZXIgY29udHJhY3QsIGFuZCBndWVzdCBpbWFnZV9pZAAAAAAABGluaXQAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAAC3ZlcmlmaWVyX2lkAAAAABMAAAAAAAAACGltYWdlX2lkAAAD7gAAACAAAAAA",
        "AAAAAAAAADpBZG1pbiBjYW4gdXBkYXRlIGltYWdlX2lkIHdoZW4gZ3Vlc3QgcHJvZ3JhbSBpcyByZWRlcGxveWVkAAAAAAAMc2V0X2ltYWdlX2lkAAAAAQAAAAAAAAAIaW1hZ2VfaWQAAAPuAAAAIAAAAAA=",
        "AAAAAAAAADxTdWJtaXQgYSB2ZXJpZmllZCBzY29yZS4gUHJvb2YgaXMgdmVyaWZpZWQgaW5zaWRlIHRoaXMgY2FsbC4AAAAMc3VibWl0X3Njb3JlAAAACgAAAAAAAAAGcGxheWVyAAAAAAATAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAFc2NvcmUAAAAAAAAEAAAAAAAAAA10aHJlYXRzX2N1cmVkAAAAAAAABAAAAAAAAAAMYWNjdXJhY3lfYnBzAAAABAAAAAAAAAALZHVyYXRpb25fbXMAAAAABAAAAAAAAAAGYm90X2lkAAAAAAAEAAAAAAAAAAxqb3VybmFsX2hhc2gAAAPuAAAAIAAAAAAAAAAIaW1hZ2VfaWQAAAPuAAAAIAAAAAAAAAAEc2VhbAAAAA4AAAAA",
        "AAAAAAAAABxHZXQgYSBwbGF5ZXIncyBwZXJzb25hbCBiZXN0AAAACGdldF9iZXN0AAAAAQAAAAAAAAAGcGxheWVyAAAAAAATAAAAAQAAA+gAAAfQAAAAClNjb3JlRW50cnkAAA==",
        "AAAAAAAAABFHZXQgZ2xvYmFsIHRvcCAyMAAAAAAAAAdnZXRfdG9wAAAAAAAAAAABAAAD6gAAB9AAAAAOTGVhZGVyYm9hcmRSb3cAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<null>,
        set_image_id: this.txFromJSON<null>,
        submit_score: this.txFromJSON<null>,
        get_best: this.txFromJSON<Option<ScoreEntry>>,
        get_top: this.txFromJSON<Array<LeaderboardRow>>
  }
}