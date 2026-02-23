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
    contractId: "CD7E5SQWX5EJ6ZRHNC2XGEOCP5BEGESXT43FKEJHGBSGNQC7RQ24MGMH",
  }
} as const


/**
 * Groth16 proof with XDR serialization support.
 * 
 * Contains three elliptic curve points that constitute a Groth16 zero-knowledge proof:
 * 
 * This structure uses Soroban-compatible types and can be passed across contract boundaries.
 */
export interface Groth16Proof {
  a: Buffer;
  b: Buffer;
  c: Buffer;
}


export interface Groth16Seal {
  proof: Groth16Proof;
  selector: Buffer;
}

/**
 * Errors that can occur during Groth16 proof verification.
 */
export const VerifierError = {
  /**
   * The proof verification failed (pairing check did not equal identity).
   */
  0: {message:"InvalidProof"},
  /**
   * The number of public inputs does not match the verification key.
   */
  1: {message:"MalformedPublicInputs"},
  /**
   * The seal data is malformed or has incorrect byte length.
   */
  2: {message:"MalformedSeal"},
  /**
   * The selector in the seal does not match this verifier.
   */
  3: {message:"InvalidSelector"},
  /**
   * The contract has already been initialized.
   */
  4: {message:"AlreadyInitialized"},
  /**
   * The selector was removed and can no longer be assigned.
   */
  5: {message:"SelectorRemoved"},
  /**
   * The selector is already assigned to a verifier.
   */
  6: {message:"SelectorInUse"},
  /**
   * The selector is not registered.
   */
  7: {message:"SelectorUnknown"}
}


/**
 * A receipt attesting to a claim using the RISC Zero proof system.
 * 
 * A receipt is the complete proof package that can be verified on-chain. It combines
 * a cryptographic proof (seal) with a claim about what was executed.
 * 
 * # Structure
 * 
 * - **[`seal`](Receipt::seal)**: A zero-knowledge proof attesting to knowledge of a witness for the claim
 * - **[`claim_digest`](Receipt::claim_digest)**: The SHA-256 hash of a [`ReceiptClaim`] struct containing
 * execution details (program ID, journal, exit code, etc.)
 * 
 * # Important: Claim Digest Validation
 * 
 * The `claim_digest` field **must** be correctly computed by the caller for verification to
 * have meaningful security guarantees. This is similar to verifying an ECDSA signature where
 * the message hash must be computed correctly.
 * 
 * For standard successful executions, use:
 * ```ignore
 * let claim = ReceiptClaim::new(&env, image_id, journal_digest);
 * let claim_digest = claim.digest(&env);
 * ```
 * 
 * # Example
 * 
 * ```ignore
 * use risc0_verifier_interface::{Receipt, ReceiptClaim, Seal};
 * 
 * let claim = ReceiptCla
 */
export interface Receipt {
  /**
 * SHA-256 digest of the [`ReceiptClaim`] struct.
 */
claim_digest: Buffer;
  /**
 * The zero-knowledge proof (SNARK) as raw bytes.
 */
seal: Buffer;
}


/**
 * A claim about the execution of a RISC Zero guest program.
 * 
 * This structure contains all the details about a program execution that the seal
 * cryptographically proves. It includes the program identifier, execution state,
 * exit status, and outputs.
 * 
 * # Fields
 * 
 * The claim follows RISC Zero's standard structure for zkVM execution:
 * 
 * - **pre_state_digest**: The image id of the guest program
 * - **post_state_digest**: Final state after execution (fixed constant for successful runs)
 * - **exit_code**: How the program terminated (system and user codes)
 * - **input**: Committed input digest (currently unused, set to zero)
 * - **output**: Digest of the [`Output`] containing journal and assumptions
 * 
 * # Usage
 * 
 * Most users should construct claims using [`ReceiptClaim::new()`] for standard
 * successful executions, which automatically sets appropriate defaults.
 */
export interface ReceiptClaim {
  /**
 * The exit code indicating how the execution terminated.
 * 
 * Contains both a system-level code (Halted, Paused, SystemSplit) and a
 * user-defined exit code from the guest program.
 */
exit_code: ExitCode;
  /**
 * Digest of the input committed to the guest program.
 * 
 * **Note**: This field is currently unused in the RISC Zero zkVM and must
 * always be set to the zero digest (32 zero bytes).
 */
input: Buffer;
  /**
 * Digest of the execution output.
 * 
 * This is the SHA-256 hash of an [`Output`] struct containing the journal
 * digest and assumptions digest. See [`Output::digest()`] for the hashing scheme.
 */
output: Buffer;
  /**
 * Digest of the system state after execution has completed.
 * 
 * This is a fixed constant value
 * (`0xa3acc27117418996340b84e5a90f3ef4c49d22c79e44aad822ec9c313e1eb8e2`)
 * representing the halted state.
 */
post_state_digest: Buffer;
  /**
 * Digest of the system state before execution (the program [`ImageId`]).
 * 
 * This identifies which guest program was executed. It must match the expected
 * program for verification to be meaningful.
 */
pre_state_digest: Buffer;
}


/**
 * Exit code indicating how a guest program execution terminated.
 * 
 * The exit code consists of two parts:
 * - **System code**: Indicates the execution mode (halted, paused, or split)
 * - **User code**: Application-specific exit code (8 bytes)
 * 
 * For standard successful executions, the system code is [`SystemExitCode::Halted`]
 * and the user code is zero.
 */
export interface ExitCode {
  /**
 * System-level exit code indicating the execution termination mode.
 */
system: SystemExitCode;
  /**
 * User-defined exit code (8 bytes) set by the guest program.
 */
user: Buffer;
}

/**
 * System-level exit codes for RISC Zero execution.
 * 
 * These codes indicate different execution termination modes.
 * 
 * # Variants
 * 
 * - **Halted**: Normal termination - the program completed successfully
 * - **Paused**: Execution paused (used for continuations and multi-segment proofs)
 * - **SystemSplit**: Execution split for parallel proving
 * 
 * # Encoding
 * 
 * These values are encoded as `u32` in the receipt claim digest computation,
 * shifted left by 24 bits.
 */
export enum SystemExitCode {
  Halted = 0,
  Paused = 1,
  SystemSplit = 2,
}


/**
 * Output of a RISC Zero guest program execution.
 * 
 * The output contains the public results of execution (journal) and any
 * assumptions (dependencies on other proofs). This structure is hashed
 * to produce the `output` field in [`ReceiptClaim`].
 * 
 * # Fields
 * 
 * - **journal_digest**: SHA-256 hash of the journal (public outputs)
 * - **assumptions_digest**: SHA-256 hash of assumptions (zero for unconditional proofs)
 */
export interface Output {
  /**
 * SHA-256 digest of assumptions (dependencies on other receipts).
 * 
 * For unconditional receipts (the common case), this is the zero digest.
 */
assumptions_digest: Buffer;
  /**
 * SHA-256 digest of the journal bytes (public outputs from the guest program).
 */
journal_digest: Buffer;
}

/**
 * Router mapping entry for a verifier selector.
 * 
 * This enum represents the raw state stored in the router mapping:
 * - `Active(Address)` means the selector routes to that verifier contract.
 * - `Tombstone` means the selector was removed and can never be reused.
 * 
 * The router `verifiers` getter returns `None` when a selector has never been set,
 * allowing callers to distinguish "unset" vs "removed" without relying on errors.
 */
export type VerifierEntry = {tag: "Active", values: readonly [string]} | {tag: "Tombstone", values: void};

export interface Client {
  /**
   * Construct and simulate a selector transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the verifier's selector
   */
  selector: (options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the RISC Zero verifier version
   */
  version: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a verify_proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verifies a Groth16 proof with the given public signals.
   * 
   * This function implements the core Groth16 verification algorithm using the BN254
   * pairing-friendly elliptic curve. The verification checks the pairing equation:
   * 
   * `e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1`
   * 
   * where `vk_x` is computed as a linear combination of the verification key's IC points
   * weighted by the public signals.
   * 
   * # Parameters
   * 
   * - `proof`: The Groth16 proof containing points A, B, and C
   * - `pub_signals`: Vector of public input signals (scalar field elements)
   * 
   */
  verify_proof: ({proof, pub_signals}: {proof: Groth16Proof, pub_signals: Array<u256>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<boolean>>>

  /**
   * Construct and simulate a verify transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  verify: ({seal, image_id, journal}: {seal: Buffer, image_id: Buffer, journal: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a verify_integrity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  verify_integrity: ({receipt}: {receipt: Receipt}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

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
      new ContractSpec([ "AAAAAQAAAN9Hcm90aDE2IHByb29mIHdpdGggWERSIHNlcmlhbGl6YXRpb24gc3VwcG9ydC4KCkNvbnRhaW5zIHRocmVlIGVsbGlwdGljIGN1cnZlIHBvaW50cyB0aGF0IGNvbnN0aXR1dGUgYSBHcm90aDE2IHplcm8ta25vd2xlZGdlIHByb29mOgoKVGhpcyBzdHJ1Y3R1cmUgdXNlcyBTb3JvYmFuLWNvbXBhdGlibGUgdHlwZXMgYW5kIGNhbiBiZSBwYXNzZWQgYWNyb3NzIGNvbnRyYWN0IGJvdW5kYXJpZXMuAAAAAAAAAAAMR3JvdGgxNlByb29mAAAAAwAAAAAAAAABYQAAAAAAA+4AAABgAAAAAAAAAAFiAAAAAAAD7gAAAMAAAAAAAAAAAWMAAAAAAAPuAAAAYA==",
        "AAAAAQAAAAAAAAAAAAAAC0dyb3RoMTZTZWFsAAAAAAIAAAAAAAAABXByb29mAAAAAAAH0AAAAAxHcm90aDE2UHJvb2YAAAAAAAAACHNlbGVjdG9yAAAD7gAAAAQ=",
        "AAAAAAAAAB9SZXR1cm5zIHRoZSB2ZXJpZmllcidzIHNlbGVjdG9yAAAAAAhzZWxlY3RvcgAAAAAAAAABAAAD7gAAAAQ=",
        "AAAAAAAAACZSZXR1cm5zIHRoZSBSSVNDIFplcm8gdmVyaWZpZXIgdmVyc2lvbgAAAAAAB3ZlcnNpb24AAAAAAAAAAAEAAAAQ",
        "AAAAAAAAAiJWZXJpZmllcyBhIEdyb3RoMTYgcHJvb2Ygd2l0aCB0aGUgZ2l2ZW4gcHVibGljIHNpZ25hbHMuCgpUaGlzIGZ1bmN0aW9uIGltcGxlbWVudHMgdGhlIGNvcmUgR3JvdGgxNiB2ZXJpZmljYXRpb24gYWxnb3JpdGhtIHVzaW5nIHRoZSBCTjI1NApwYWlyaW5nLWZyaWVuZGx5IGVsbGlwdGljIGN1cnZlLiBUaGUgdmVyaWZpY2F0aW9uIGNoZWNrcyB0aGUgcGFpcmluZyBlcXVhdGlvbjoKCmBlKC1BLCBCKSAqIGUoYWxwaGEsIGJldGEpICogZSh2a194LCBnYW1tYSkgKiBlKEMsIGRlbHRhKSA9PSAxYAoKd2hlcmUgYHZrX3hgIGlzIGNvbXB1dGVkIGFzIGEgbGluZWFyIGNvbWJpbmF0aW9uIG9mIHRoZSB2ZXJpZmljYXRpb24ga2V5J3MgSUMgcG9pbnRzCndlaWdodGVkIGJ5IHRoZSBwdWJsaWMgc2lnbmFscy4KCiMgUGFyYW1ldGVycwoKLSBgcHJvb2ZgOiBUaGUgR3JvdGgxNiBwcm9vZiBjb250YWluaW5nIHBvaW50cyBBLCBCLCBhbmQgQwotIGBwdWJfc2lnbmFsc2A6IFZlY3RvciBvZiBwdWJsaWMgaW5wdXQgc2lnbmFscyAoc2NhbGFyIGZpZWxkIGVsZW1lbnRzKQoAAAAAAAx2ZXJpZnlfcHJvb2YAAAACAAAAAAAAAAVwcm9vZgAAAAAAB9AAAAAMR3JvdGgxNlByb29mAAAAAAAAAAtwdWJfc2lnbmFscwAAAAPqAAAADAAAAAEAAAPpAAAAAQAAB9AAAAANVmVyaWZpZXJFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAGdmVyaWZ5AAAAAAADAAAAAAAAAARzZWFsAAAADgAAAAAAAAAIaW1hZ2VfaWQAAAPuAAAAIAAAAAAAAAAHam91cm5hbAAAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAANVmVyaWZpZXJFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAQdmVyaWZ5X2ludGVncml0eQAAAAEAAAAAAAAAB3JlY2VpcHQAAAAH0AAAAAdSZWNlaXB0AAAAAAEAAAPpAAAAAgAAB9AAAAANVmVyaWZpZXJFcnJvcgAAAA==",
        "AAAABAAAADhFcnJvcnMgdGhhdCBjYW4gb2NjdXIgZHVyaW5nIEdyb3RoMTYgcHJvb2YgdmVyaWZpY2F0aW9uLgAAAAAAAAANVmVyaWZpZXJFcnJvcgAAAAAAAAgAAABFVGhlIHByb29mIHZlcmlmaWNhdGlvbiBmYWlsZWQgKHBhaXJpbmcgY2hlY2sgZGlkIG5vdCBlcXVhbCBpZGVudGl0eSkuAAAAAAAADEludmFsaWRQcm9vZgAAAAAAAABAVGhlIG51bWJlciBvZiBwdWJsaWMgaW5wdXRzIGRvZXMgbm90IG1hdGNoIHRoZSB2ZXJpZmljYXRpb24ga2V5LgAAABVNYWxmb3JtZWRQdWJsaWNJbnB1dHMAAAAAAAABAAAAOFRoZSBzZWFsIGRhdGEgaXMgbWFsZm9ybWVkIG9yIGhhcyBpbmNvcnJlY3QgYnl0ZSBsZW5ndGguAAAADU1hbGZvcm1lZFNlYWwAAAAAAAACAAAANlRoZSBzZWxlY3RvciBpbiB0aGUgc2VhbCBkb2VzIG5vdCBtYXRjaCB0aGlzIHZlcmlmaWVyLgAAAAAAD0ludmFsaWRTZWxlY3RvcgAAAAADAAAAKlRoZSBjb250cmFjdCBoYXMgYWxyZWFkeSBiZWVuIGluaXRpYWxpemVkLgAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAABAAAADdUaGUgc2VsZWN0b3Igd2FzIHJlbW92ZWQgYW5kIGNhbiBubyBsb25nZXIgYmUgYXNzaWduZWQuAAAAAA9TZWxlY3RvclJlbW92ZWQAAAAABQAAAC9UaGUgc2VsZWN0b3IgaXMgYWxyZWFkeSBhc3NpZ25lZCB0byBhIHZlcmlmaWVyLgAAAAANU2VsZWN0b3JJblVzZQAAAAAAAAYAAAAfVGhlIHNlbGVjdG9yIGlzIG5vdCByZWdpc3RlcmVkLgAAAAAPU2VsZWN0b3JVbmtub3duAAAAAAc=",
        "AAAAAQAABABBIHJlY2VpcHQgYXR0ZXN0aW5nIHRvIGEgY2xhaW0gdXNpbmcgdGhlIFJJU0MgWmVybyBwcm9vZiBzeXN0ZW0uCgpBIHJlY2VpcHQgaXMgdGhlIGNvbXBsZXRlIHByb29mIHBhY2thZ2UgdGhhdCBjYW4gYmUgdmVyaWZpZWQgb24tY2hhaW4uIEl0IGNvbWJpbmVzCmEgY3J5cHRvZ3JhcGhpYyBwcm9vZiAoc2VhbCkgd2l0aCBhIGNsYWltIGFib3V0IHdoYXQgd2FzIGV4ZWN1dGVkLgoKIyBTdHJ1Y3R1cmUKCi0gKipbYHNlYWxgXShSZWNlaXB0OjpzZWFsKSoqOiBBIHplcm8ta25vd2xlZGdlIHByb29mIGF0dGVzdGluZyB0byBrbm93bGVkZ2Ugb2YgYSB3aXRuZXNzIGZvciB0aGUgY2xhaW0KLSAqKltgY2xhaW1fZGlnZXN0YF0oUmVjZWlwdDo6Y2xhaW1fZGlnZXN0KSoqOiBUaGUgU0hBLTI1NiBoYXNoIG9mIGEgW2BSZWNlaXB0Q2xhaW1gXSBzdHJ1Y3QgY29udGFpbmluZwpleGVjdXRpb24gZGV0YWlscyAocHJvZ3JhbSBJRCwgam91cm5hbCwgZXhpdCBjb2RlLCBldGMuKQoKIyBJbXBvcnRhbnQ6IENsYWltIERpZ2VzdCBWYWxpZGF0aW9uCgpUaGUgYGNsYWltX2RpZ2VzdGAgZmllbGQgKiptdXN0KiogYmUgY29ycmVjdGx5IGNvbXB1dGVkIGJ5IHRoZSBjYWxsZXIgZm9yIHZlcmlmaWNhdGlvbiB0bwpoYXZlIG1lYW5pbmdmdWwgc2VjdXJpdHkgZ3VhcmFudGVlcy4gVGhpcyBpcyBzaW1pbGFyIHRvIHZlcmlmeWluZyBhbiBFQ0RTQSBzaWduYXR1cmUgd2hlcmUKdGhlIG1lc3NhZ2UgaGFzaCBtdXN0IGJlIGNvbXB1dGVkIGNvcnJlY3RseS4KCkZvciBzdGFuZGFyZCBzdWNjZXNzZnVsIGV4ZWN1dGlvbnMsIHVzZToKYGBgaWdub3JlCmxldCBjbGFpbSA9IFJlY2VpcHRDbGFpbTo6bmV3KCZlbnYsIGltYWdlX2lkLCBqb3VybmFsX2RpZ2VzdCk7CmxldCBjbGFpbV9kaWdlc3QgPSBjbGFpbS5kaWdlc3QoJmVudik7CmBgYAoKIyBFeGFtcGxlCgpgYGBpZ25vcmUKdXNlIHJpc2MwX3ZlcmlmaWVyX2ludGVyZmFjZTo6e1JlY2VpcHQsIFJlY2VpcHRDbGFpbSwgU2VhbH07CgpsZXQgY2xhaW0gPSBSZWNlaXB0Q2xhAAAAAAAAAAdSZWNlaXB0AAAAAAIAAAAuU0hBLTI1NiBkaWdlc3Qgb2YgdGhlIFtgUmVjZWlwdENsYWltYF0gc3RydWN0LgAAAAAADGNsYWltX2RpZ2VzdAAAA+4AAAAgAAAALlRoZSB6ZXJvLWtub3dsZWRnZSBwcm9vZiAoU05BUkspIGFzIHJhdyBieXRlcy4AAAAAAARzZWFsAAAADg==",
        "AAAAAQAAA0hBIGNsYWltIGFib3V0IHRoZSBleGVjdXRpb24gb2YgYSBSSVNDIFplcm8gZ3Vlc3QgcHJvZ3JhbS4KClRoaXMgc3RydWN0dXJlIGNvbnRhaW5zIGFsbCB0aGUgZGV0YWlscyBhYm91dCBhIHByb2dyYW0gZXhlY3V0aW9uIHRoYXQgdGhlIHNlYWwKY3J5cHRvZ3JhcGhpY2FsbHkgcHJvdmVzLiBJdCBpbmNsdWRlcyB0aGUgcHJvZ3JhbSBpZGVudGlmaWVyLCBleGVjdXRpb24gc3RhdGUsCmV4aXQgc3RhdHVzLCBhbmQgb3V0cHV0cy4KCiMgRmllbGRzCgpUaGUgY2xhaW0gZm9sbG93cyBSSVNDIFplcm8ncyBzdGFuZGFyZCBzdHJ1Y3R1cmUgZm9yIHprVk0gZXhlY3V0aW9uOgoKLSAqKnByZV9zdGF0ZV9kaWdlc3QqKjogVGhlIGltYWdlIGlkIG9mIHRoZSBndWVzdCBwcm9ncmFtCi0gKipwb3N0X3N0YXRlX2RpZ2VzdCoqOiBGaW5hbCBzdGF0ZSBhZnRlciBleGVjdXRpb24gKGZpeGVkIGNvbnN0YW50IGZvciBzdWNjZXNzZnVsIHJ1bnMpCi0gKipleGl0X2NvZGUqKjogSG93IHRoZSBwcm9ncmFtIHRlcm1pbmF0ZWQgKHN5c3RlbSBhbmQgdXNlciBjb2RlcykKLSAqKmlucHV0Kio6IENvbW1pdHRlZCBpbnB1dCBkaWdlc3QgKGN1cnJlbnRseSB1bnVzZWQsIHNldCB0byB6ZXJvKQotICoqb3V0cHV0Kio6IERpZ2VzdCBvZiB0aGUgW2BPdXRwdXRgXSBjb250YWluaW5nIGpvdXJuYWwgYW5kIGFzc3VtcHRpb25zCgojIFVzYWdlCgpNb3N0IHVzZXJzIHNob3VsZCBjb25zdHJ1Y3QgY2xhaW1zIHVzaW5nIFtgUmVjZWlwdENsYWltOjpuZXcoKWBdIGZvciBzdGFuZGFyZApzdWNjZXNzZnVsIGV4ZWN1dGlvbnMsIHdoaWNoIGF1dG9tYXRpY2FsbHkgc2V0cyBhcHByb3ByaWF0ZSBkZWZhdWx0cy4AAAAAAAAADFJlY2VpcHRDbGFpbQAAAAUAAACsVGhlIGV4aXQgY29kZSBpbmRpY2F0aW5nIGhvdyB0aGUgZXhlY3V0aW9uIHRlcm1pbmF0ZWQuCgpDb250YWlucyBib3RoIGEgc3lzdGVtLWxldmVsIGNvZGUgKEhhbHRlZCwgUGF1c2VkLCBTeXN0ZW1TcGxpdCkgYW5kIGEKdXNlci1kZWZpbmVkIGV4aXQgY29kZSBmcm9tIHRoZSBndWVzdCBwcm9ncmFtLgAAAAlleGl0X2NvZGUAAAAAAAfQAAAACEV4aXRDb2RlAAAArkRpZ2VzdCBvZiB0aGUgaW5wdXQgY29tbWl0dGVkIHRvIHRoZSBndWVzdCBwcm9ncmFtLgoKKipOb3RlKio6IFRoaXMgZmllbGQgaXMgY3VycmVudGx5IHVudXNlZCBpbiB0aGUgUklTQyBaZXJvIHprVk0gYW5kIG11c3QKYWx3YXlzIGJlIHNldCB0byB0aGUgemVybyBkaWdlc3QgKDMyIHplcm8gYnl0ZXMpLgAAAAAABWlucHV0AAAAAAAD7gAAACAAAAC4RGlnZXN0IG9mIHRoZSBleGVjdXRpb24gb3V0cHV0LgoKVGhpcyBpcyB0aGUgU0hBLTI1NiBoYXNoIG9mIGFuIFtgT3V0cHV0YF0gc3RydWN0IGNvbnRhaW5pbmcgdGhlIGpvdXJuYWwKZGlnZXN0IGFuZCBhc3N1bXB0aW9ucyBkaWdlc3QuIFNlZSBbYE91dHB1dDo6ZGlnZXN0KClgXSBmb3IgdGhlIGhhc2hpbmcgc2NoZW1lLgAAAAZvdXRwdXQAAAAAA+4AAAAgAAAAv0RpZ2VzdCBvZiB0aGUgc3lzdGVtIHN0YXRlIGFmdGVyIGV4ZWN1dGlvbiBoYXMgY29tcGxldGVkLgoKVGhpcyBpcyBhIGZpeGVkIGNvbnN0YW50IHZhbHVlCihgMHhhM2FjYzI3MTE3NDE4OTk2MzQwYjg0ZTVhOTBmM2VmNGM0OWQyMmM3OWU0NGFhZDgyMmVjOWMzMTNlMWViOGUyYCkKcmVwcmVzZW50aW5nIHRoZSBoYWx0ZWQgc3RhdGUuAAAAABFwb3N0X3N0YXRlX2RpZ2VzdAAAAAAAA+4AAAAgAAAAv0RpZ2VzdCBvZiB0aGUgc3lzdGVtIHN0YXRlIGJlZm9yZSBleGVjdXRpb24gKHRoZSBwcm9ncmFtIFtgSW1hZ2VJZGBdKS4KClRoaXMgaWRlbnRpZmllcyB3aGljaCBndWVzdCBwcm9ncmFtIHdhcyBleGVjdXRlZC4gSXQgbXVzdCBtYXRjaCB0aGUgZXhwZWN0ZWQKcHJvZ3JhbSBmb3IgdmVyaWZpY2F0aW9uIHRvIGJlIG1lYW5pbmdmdWwuAAAAABBwcmVfc3RhdGVfZGlnZXN0AAAD7gAAACA=",
        "AAAAAQAAAVdFeGl0IGNvZGUgaW5kaWNhdGluZyBob3cgYSBndWVzdCBwcm9ncmFtIGV4ZWN1dGlvbiB0ZXJtaW5hdGVkLgoKVGhlIGV4aXQgY29kZSBjb25zaXN0cyBvZiB0d28gcGFydHM6Ci0gKipTeXN0ZW0gY29kZSoqOiBJbmRpY2F0ZXMgdGhlIGV4ZWN1dGlvbiBtb2RlIChoYWx0ZWQsIHBhdXNlZCwgb3Igc3BsaXQpCi0gKipVc2VyIGNvZGUqKjogQXBwbGljYXRpb24tc3BlY2lmaWMgZXhpdCBjb2RlICg4IGJ5dGVzKQoKRm9yIHN0YW5kYXJkIHN1Y2Nlc3NmdWwgZXhlY3V0aW9ucywgdGhlIHN5c3RlbSBjb2RlIGlzIFtgU3lzdGVtRXhpdENvZGU6OkhhbHRlZGBdCmFuZCB0aGUgdXNlciBjb2RlIGlzIHplcm8uAAAAAAAAAAAIRXhpdENvZGUAAAACAAAAQVN5c3RlbS1sZXZlbCBleGl0IGNvZGUgaW5kaWNhdGluZyB0aGUgZXhlY3V0aW9uIHRlcm1pbmF0aW9uIG1vZGUuAAAAAAAABnN5c3RlbQAAAAAH0AAAAA5TeXN0ZW1FeGl0Q29kZQAAAAAAOlVzZXItZGVmaW5lZCBleGl0IGNvZGUgKDggYnl0ZXMpIHNldCBieSB0aGUgZ3Vlc3QgcHJvZ3JhbS4AAAAAAAR1c2VyAAAD7gAAAAg=",
        "AAAAAwAAAbpTeXN0ZW0tbGV2ZWwgZXhpdCBjb2RlcyBmb3IgUklTQyBaZXJvIGV4ZWN1dGlvbi4KClRoZXNlIGNvZGVzIGluZGljYXRlIGRpZmZlcmVudCBleGVjdXRpb24gdGVybWluYXRpb24gbW9kZXMuCgojIFZhcmlhbnRzCgotICoqSGFsdGVkKio6IE5vcm1hbCB0ZXJtaW5hdGlvbiAtIHRoZSBwcm9ncmFtIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkKLSAqKlBhdXNlZCoqOiBFeGVjdXRpb24gcGF1c2VkICh1c2VkIGZvciBjb250aW51YXRpb25zIGFuZCBtdWx0aS1zZWdtZW50IHByb29mcykKLSAqKlN5c3RlbVNwbGl0Kio6IEV4ZWN1dGlvbiBzcGxpdCBmb3IgcGFyYWxsZWwgcHJvdmluZwoKIyBFbmNvZGluZwoKVGhlc2UgdmFsdWVzIGFyZSBlbmNvZGVkIGFzIGB1MzJgIGluIHRoZSByZWNlaXB0IGNsYWltIGRpZ2VzdCBjb21wdXRhdGlvbiwKc2hpZnRlZCBsZWZ0IGJ5IDI0IGJpdHMuAAAAAAAAAAAADlN5c3RlbUV4aXRDb2RlAAAAAAADAAAAKVByb2dyYW0gZXhlY3V0aW9uIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkuAAAAAAAABkhhbHRlZAAAAAAAAAAAAC1Qcm9ncmFtIGV4ZWN1dGlvbiBwYXVzZWQgKGZvciBjb250aW51YXRpb25zKS4AAAAAAAAGUGF1c2VkAAAAAAABAAAAJUV4ZWN1dGlvbiBzcGxpdCBmb3IgcGFyYWxsZWwgcHJvdmluZy4AAAAAAAALU3lzdGVtU3BsaXQAAAAAAg==",
        "AAAAAQAAAZFPdXRwdXQgb2YgYSBSSVNDIFplcm8gZ3Vlc3QgcHJvZ3JhbSBleGVjdXRpb24uCgpUaGUgb3V0cHV0IGNvbnRhaW5zIHRoZSBwdWJsaWMgcmVzdWx0cyBvZiBleGVjdXRpb24gKGpvdXJuYWwpIGFuZCBhbnkKYXNzdW1wdGlvbnMgKGRlcGVuZGVuY2llcyBvbiBvdGhlciBwcm9vZnMpLiBUaGlzIHN0cnVjdHVyZSBpcyBoYXNoZWQKdG8gcHJvZHVjZSB0aGUgYG91dHB1dGAgZmllbGQgaW4gW2BSZWNlaXB0Q2xhaW1gXS4KCiMgRmllbGRzCgotICoqam91cm5hbF9kaWdlc3QqKjogU0hBLTI1NiBoYXNoIG9mIHRoZSBqb3VybmFsIChwdWJsaWMgb3V0cHV0cykKLSAqKmFzc3VtcHRpb25zX2RpZ2VzdCoqOiBTSEEtMjU2IGhhc2ggb2YgYXNzdW1wdGlvbnMgKHplcm8gZm9yIHVuY29uZGl0aW9uYWwgcHJvb2ZzKQAAAAAAAAAAAAAGT3V0cHV0AAAAAAACAAAAh1NIQS0yNTYgZGlnZXN0IG9mIGFzc3VtcHRpb25zIChkZXBlbmRlbmNpZXMgb24gb3RoZXIgcmVjZWlwdHMpLgoKRm9yIHVuY29uZGl0aW9uYWwgcmVjZWlwdHMgKHRoZSBjb21tb24gY2FzZSksIHRoaXMgaXMgdGhlIHplcm8gZGlnZXN0LgAAAAASYXNzdW1wdGlvbnNfZGlnZXN0AAAAAAPuAAAAIAAAAExTSEEtMjU2IGRpZ2VzdCBvZiB0aGUgam91cm5hbCBieXRlcyAocHVibGljIG91dHB1dHMgZnJvbSB0aGUgZ3Vlc3QgcHJvZ3JhbSkuAAAADmpvdXJuYWxfZGlnZXN0AAAAAAPuAAAAIA==",
        "AAAAAgAAAaBSb3V0ZXIgbWFwcGluZyBlbnRyeSBmb3IgYSB2ZXJpZmllciBzZWxlY3Rvci4KClRoaXMgZW51bSByZXByZXNlbnRzIHRoZSByYXcgc3RhdGUgc3RvcmVkIGluIHRoZSByb3V0ZXIgbWFwcGluZzoKLSBgQWN0aXZlKEFkZHJlc3MpYCBtZWFucyB0aGUgc2VsZWN0b3Igcm91dGVzIHRvIHRoYXQgdmVyaWZpZXIgY29udHJhY3QuCi0gYFRvbWJzdG9uZWAgbWVhbnMgdGhlIHNlbGVjdG9yIHdhcyByZW1vdmVkIGFuZCBjYW4gbmV2ZXIgYmUgcmV1c2VkLgoKVGhlIHJvdXRlciBgdmVyaWZpZXJzYCBnZXR0ZXIgcmV0dXJucyBgTm9uZWAgd2hlbiBhIHNlbGVjdG9yIGhhcyBuZXZlciBiZWVuIHNldCwKYWxsb3dpbmcgY2FsbGVycyB0byBkaXN0aW5ndWlzaCAidW5zZXQiIHZzICJyZW1vdmVkIiB3aXRob3V0IHJlbHlpbmcgb24gZXJyb3JzLgAAAAAAAAANVmVyaWZpZXJFbnRyeQAAAAAAAAIAAAABAAAAIUFjdGl2ZSB2ZXJpZmllciBmb3IgdGhlIHNlbGVjdG9yLgAAAAAAAAZBY3RpdmUAAAAAAAEAAAATAAAAAAAAACBTZWxlY3RvciBpcyBwZXJtYW5lbnRseSByZW1vdmVkLgAAAAlUb21ic3RvbmUAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    selector: this.txFromJSON<Buffer>,
        version: this.txFromJSON<string>,
        verify_proof: this.txFromJSON<Result<boolean>>,
        verify: this.txFromJSON<Result<void>>,
        verify_integrity: this.txFromJSON<Result<void>>
  }
}