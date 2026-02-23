# Zero Trust

An asymmetric cybersecurity game built for the Stellar ZK Hackathon. Inspired by Cook, Serve, Delicious, Game Dev Story, and Papers Please.

Hackers design attack bots and mint them as NFTs on Stellar. Defenders drag and drop developers to neutralise incoming threats in real time. When the round ends, the defender's private action log is verified by a RISC Zero zkVM circuit running off-chain. The resulting Groth16 proof is submitted on-chain — the leaderboard contract calls the verifier contract before accepting any score.

---

## How It Works

**Hacker mode** — Design an attack bot in a timeline-based editor. Configure bot type, primary and secondary targets, resource attack, damage multiplier, spawn pattern, skill diversity, special abilities, and victory condition. Once satisfied, call `deploy_bot` on the bot NFT contract. The full configuration is stored as public NFT metadata, readable by anyone. The token ID returned from the contract is used later to load the bot in defender mode.

<image src="bot-lab.png" alt="Bot Development Lab" width="400px"/>
<br>
<br>

**Defender mode** — Bots minted by players are fetched from the bot NFT contract and cached locally (throttled to once per minute). Select a bot and begin a 90-second defense round. Threats spawn deterministically based on the bot config and a seed derived from the player's public key and bot type. Drag developers with matching skills onto active threats. When a developer is assigned, there is a short window to swap them out; after that they are locked in until the threat is neutralised or the round ends.

<image src="defender-gameplay.png" alt="Defense Gameplay" width="400px"/>
<br>
<br>
**ZK verification** — After the round ends, the action log is submitted to the prover server. The server fetches the bot config from Stellar, feeds it into the RISC Zero guest program alongside the private action log, and runs a Groth16 proof. The guest program regenerates the same threat sequence deterministically and simulates the round tick by tick to compute the final score. The server returns a `job_id` immediately; the frontend polls `/status/:job_id` until the proof is ready. Once done, the frontend calls both the verifier contract (`verify`) and the leaderboard contract (`submit_score`). The leaderboard contract also calls the verifier internally before recording the score.

**Game hub** — The Stellar-provided game hub contract is called at the start and end of each round via `start_game` and `end_game`.

---

## Architecture

```
zero-trust/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── bot-creator/        # Timeline-based bot designer
│       │   ├── bots/               # Browse and select deployed bot NFTs
│       │   ├── defense/            # Real-time defense gameplay
│       │   └── leaderboard/        # Top 20 + personal best
│       │
│       ├── contracts/              # Auto-generated Soroban contract bindings
│       │   ├── bot_nft.ts          # deploy_bot, get_bot_config, get_bot_metadata
│       │   ├── leaderboard.ts      # submit_score, get_top, get_best
│       │   ├── game_hub.ts         # start_game, end_game (Stellar-provided)
│       │   └── verifier.ts         # verify (Nethermind, redeployed)
│       │
│       ├── hooks/
│       │   ├── useWallet.ts        # Freighter + ephemeral wallet, unified signTransaction
│       │   ├── useDeployBot.ts     # Transforms FE config to contract types, calls deploy_bot
│       │   ├── useBotSync.ts       # Fetches all NFTs from contract, caches to localStorage
│       │   ├── useAvailableBots.ts # Merges on-chain + local bots, handles selection
│       │   ├── useGameHub.ts       # start_game / end_game wrappers
│       │   ├── useProver.ts        # POST /prove, polls /status/:job_id, Sonner toasts
│       │   ├── useLeaderboard.ts   # submit_score, get_top, get_best
│       │   └── useVerifier.tsx     # verify(seal, image_id, journal_sha256)
│       │
│       └── lib/
│           ├── game-logic.ts       # Deterministic threat generation + scoring
│           ├── storage.ts          # localStorage adapter; DeployedBot / SavedBot
│           ├── constants.ts
│           └── types/
│               ├── types.ts        # BotConfigFE, SavedBot, etc.
│               ├── defense-types.ts
│               └── walletTypes.ts
│
├── contracts/
│   ├── bot-nft/src/lib.rs          # Soroban NFT: deploy_bot, get_bot_config, transfer
│   └── leaderboard/src/lib.rs      # Soroban leaderboard: init, submit_score, get_top, get_best
│
└── zerotrust_zkvm/
    ├── host/src/
    │   ├── main.rs                 # Actix server: POST /prove, GET /status/:job_id
    │   └── lib.rs                  # prove_game, fetch_bot_config_from_stellar, ProveInput
    └── methods/guest/src/main.rs   # RISC Zero guest: regenerates threats, simulates round, commits journal
```

---

## Smart Contracts

**Bot NFT** (`contracts/bot-nft`) — Mints a new token for each deployed bot. Stores the full `BotConfig` struct (bot type, targets, damage multiplier, abilities, spawn pattern, etc.) and a `BotMetadata` struct (creator address, `created_at` timestamp) keyed by token ID. Exposes `deploy_bot`, `get_bot_config`, `get_bot_metadata`, `owner_of`, and `transfer`.

Testnet: `CBSTBYNBRPSQWSDDVFEBYDQNLKQWINVCT4AGHQ4FN2W7F6H6ESQUKXRX`

**Leaderboard** (`contracts/leaderboard`) — Adapted from [typezero by jamesbachini](https://github.com/jamesbachini/typezero/tree/main/contracts/leaderboard). Initialised with the verifier contract address and the RISC Zero guest image ID. `submit_score` calls the verifier contract internally before recording a score. Stores a personal best per player and a global top-20 list. Admin can update the image ID when the guest program changes.

Testnet: `CB2AD24HOZPNMVLOD2PR7Y6ZNDSL7P26WYDB27JMQNHXKH5K5R3HDFGX`

**Verifier** — Groth16 verifier by [Nethermind](https://github.com/NethermindEth/stellar-risc0-verifier/), redeployed. Exposes `verify(seal, image_id, journal)` where `seal` is the 4-byte selector `73c457ba` prepended to the raw proof bytes.

Testnet: `CD7E5SQWX5EJ6ZRHNC2XGEOCP5BEGESXT43FKEJHGBSGNQC7RQ24MGMH`

**Game Hub** — Provided by Stellar. `start_game` and `end_game` are called around each defense session.

Testnet: `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`

---

## ZK Circuit

The RISC Zero guest (`zerotrust_zkvm/methods/guest/src/main.rs`) receives as public inputs the challenge ID, player public key, bot config ID, and full bot config. The action log is the private input.

Threat generation is deterministic: the seed is `pubkey_hex + bot_type`, mixed into a xorshift64 state. Threats are generated from that state using the bot config (spawn pattern, skill diversity, threat count, damage multiplier), with skill assignments using a Fisher-Yates shuffle over the fixed 9-skill pool.

The round is simulated at 100ms ticks over 90 seconds. Each tick, active assignments are read from the action log, cure progress accumulates on assigned threats, and damage accumulates on unattended ones. The circuit validates that no developer is double-assigned across overlapping windows.

The journal committed to the proof contains: challenge ID, player public key, bot config ID, threats cured, systems destroyed, data leaked (×100), score, duration in ms, and accuracy in basis points.

The host server is an Actix web application. `POST /prove` validates the request, fetches the bot config from Stellar, creates a job entry, and spawns a blocking task. `GET /status/:job_id` returns the current state (`pending`, `proving`, `done`, `failed`). On completion, `done` includes the seal hex, image ID hex, journal SHA-256, raw journal bytes, and decoded journal fields.

---

## Wallet Support

`useWallet` supports two modes behind a unified `signTransaction` interface used by all contract hooks:

- **Freighter** — via Stellar Wallets Kit, polled at 500ms to detect connect/disconnect.
- **Ephemeral** — generates a random keypair, funds it via Friendbot, persists the secret key in localStorage, and signs transactions locally. Intended for users without an existing Stellar wallet.

---

## Proof Submission Flow

```
1. Round ends
2. useProver.prove(challengeId, botConfigId, actionLog)
3.   POST /prove  →  { job_id }
4.   Poll GET /status/:job_id every 5s (15-minute timeout)
5.   On "done": dispatch window event "zk-proof-ready" with proof data
6. useVerifier.verify(proof)
     → verifier contract: verify(seal, image_id, journal_sha256)
7. useLeaderboard.submitScore(proof, playerName, botConfigId)
     → leaderboard contract: submit_score(..., journal_hash, image_id, seal)
     → leaderboard contract calls verifier internally before writing the score
8. Leaderboard page: get_top, get_best
```

The seal passed to both contracts is the 4-byte selector `73c457ba` prepended to the raw seal bytes from the prover response.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Stellar CLI (for contract deployment)
- Rust toolchain + RISC Zero toolchain (for the prover; requires a CUDA-capable GPU for Groth16)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local — see below
npm run dev
```

### Environment Variables

```bash
NEXT_PUBLIC_FRIENDBOT_URL=https://friendbot.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_PROVER_URL=http://<your-prover-host>:8080
NEXT_PUBLIC_VERIFIER_CONTRACT_SELECTOR=73c457ba
```

Contract IDs are hardcoded in `src/contracts/*.ts` for testnet. Update the `contractId` field in each file if redeploying.

### Prover Server

```bash
cd zerotrust_zkvm
cargo build --release
RUST_LOG=info ./target/release/host
# Starts on 0.0.0.0:8080
```

Proof generation takes approximately 9 minutes on an RTX 3090. The project uses rented GPU instances for this.

### Contract Deployment

```bash
# Build
cd contracts/bot-nft && stellar contract build
cd contracts/leaderboard && stellar contract build

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/bot_nft.wasm \
  --network testnet \
  --source <account>

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/leaderboard.wasm \
  --network testnet \
  --source <account>

# Initialise leaderboard (once after deploy)
stellar contract invoke \
  --id <LEADERBOARD_CONTRACT_ID> \
  --network testnet \
  --source <account> \
  -- init \
  --admin <address> \
  --verifier_id <VERIFIER_CONTRACT_ID> \
  --image_id <GUEST_IMAGE_ID_HEX>

# Update image_id after redeploying the guest program
stellar contract invoke \
  --id <LEADERBOARD_CONTRACT_ID> \
  --network testnet \
  --source <account> \
  -- set_image_id \
  --image_id <NEW_IMAGE_ID_HEX>
```

---

## Bot Configuration

Each bot is defined by the following fields, all stored on-chain as NFT metadata:

- **Bot type** — Malware, Trojan, Ransomware, Worm, Rootkit, Spyware, Botnet, LogicBomb
- **Primary / secondary targets** — Compute, Storage, Network, Auth, Analytics, Communication, Transaction, API, Endpoint, CDN, IoT
- **Resource attack** — CPU, Memory, Bandwidth, Disk, None
- **Damage multiplier** — stored as integer × 100 (e.g. 150 = 1.5×)
- **Threat count** — number of threats spawned during the round
- **Spawn pattern** — Steady (8s interval), Burst (3s), Crescendo (accelerating from 12s)
- **Skill diversity** — Low (2 skills per threat), Medium (3), High (4)
- **Special abilities** — Stealth, Mutation, Replication, Encryption, Persistence
- **Victory condition** — TimeSurvival, SystemDestruction, DataExfiltration

The developer pool is fixed at 10 developers, each with 3 skills drawn from a pool of 9: python, rust, javascript, network, endpoint, crypto, database, web, forensics. The pool and skill assignments are identical in the frontend (`game-logic.ts`) and the zkVM guest (`main.rs`) to ensure deterministic replay.

---

## Planned

- Purchasable developer upgrades and skill expansions
- Richer in-game feedback: per-developer activity details, attack notifications, more real-time UI
- Faster-paced gameplay overall

---

## Credits

- Leaderboard contract adapted from [typezero by jamesbachini](https://github.com/jamesbachini/typezero/tree/main/contracts/leaderboard)
- Verifier contract by [Nethermind](https://github.com/NethermindEth/stellar-risc0-verifier/), redeployed on testnet
- Game hub contract provided by Stellar

---

## License

Creative Commons Zero (CC0)
