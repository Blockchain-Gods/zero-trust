# Zero Trust: Asymmetric ZK Security Game

A competitive cybersecurity game where hackers design encrypted attack bots and security teams defend systems through skill-based developer assignment. Built for Stellar + Risc Zero Hackathon.

## 🎮 Core Gameplay

**Hacker Side:** Design attack bots with public configurations (target systems, required skills, spawn patterns, special abilities) stored as NFT metadata. Deploy bots and earn reputation based on average damage dealt to defenders. Bot configs are visible to all—the challenge is public, like a typing prompt.

**Defender Side:** Face public bot configs in timed rounds. Drag-and-drop specialist developers from a fixed pool onto incoming infections before damage meters hit 100%. Your strategic decisions (which devs, when to assign, timing) remain private—only you and the ZK circuit see your "solution."

**ZK Proof:** Risc Zero proves your defense score is legitimate by replaying your private action log against the public bot config using deterministic game rules. Your strategy stays hidden while your score is cryptographically verified—no one can copy your solution or cheat the leaderboard.

---

## 🏗️ Tech Stack

### Frontend + Backend

- **Next.js 15** (App Router) - Full-stack framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations (damage meters, cure progress, screen shake)
- **dnd-kit** - Drag-and-drop (dev assignment to threats)
- **Zustand** - State management (game state, dev assignments, threat queue)

### Blockchain + ZK

- **Risc Zero** - ZK proof generation (defender action verification + score computation)
- **Stellar** - Smart contracts (leaderboard, bot NFT registry, score settlement)
- **NFT Metadata** - Public bot configurations (no encryption needed)

### Development

- **pnpm** - Package manager
- **ESLint + Prettier** - Code quality
- **Vercel** - Deployment

---

## 📁 Project Structure

```
cyberdefense/
├── app/
│   ├── (routes)/
│   │   ├── page.tsx                 # Landing page
│   │   ├── bot-creator/
│   │   │   └── page.tsx             # Bot design studio
│   │   ├── defense/
│   │   │   └── page.tsx             # Defense gameplay screen
│   │   └── leaderboard/
│   │       └── page.tsx             # Dual leaderboards
│   ├── api/
│   │   ├── bots/
│   │   │   ├── create/route.ts      # Mint bot NFT
│   │   │   ├── list/route.ts        # Get available bot NFTs
│   │   │   │   └── [id]/route.ts        # Get bot config from NFT
│   │   ├── defense/
│   │   │   └── submit/route.ts      # Submit defense replay for proving
│   │   └── proof/
│   │       └── generate/route.ts    # Risc Zero proof gen
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── bot-creator/
│   │   ├── BotTypeSelector.tsx      # Step 1: Choose bot type
│   │   ├── TargetConfig.tsx         # Step 2: Primary/secondary targets
│   │   ├── ResourceAttackConfig.tsx # Step 3: Resource exploitation
│   │   ├── GoalSelector.tsx         # Step 4: Victory condition
│   │   ├── AbilityPicker.tsx        # Step 5: Special abilities
│   │   └── BotPreview.tsx           # Summary + deploy
│   │
│   ├── defense/
│   │   ├── ThreatQueue.tsx          # Left panel: active infections
│   │   ├── ThreatCard.tsx           # Individual threat w/ damage meter
│   │   ├── DeveloperPool.tsx        # Right panel: dev cards
│   │   ├── DeveloperCard.tsx        # Draggable dev with skills
│   │   ├── DefenseHUD.tsx           # Timer, score, stats
│   │   └── GameOverModal.tsx        # Results + ZK proof status
│   │
│   ├── leaderboard/
│   │   ├── AttackerBoard.tsx        # Bot designer rankings
│   │   └── DefenderBoard.tsx        # Defense rankings
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── ProgressBar.tsx          # Damage/cure meters
│       ├── SkillBadge.tsx           # Skill icons with tooltips
│       └── DragOverlay.tsx          # dnd-kit ghost element
│
├── lib/
│   ├── game/
│   │   ├── botConfig.ts             # Bot config types + validation
│   │   ├── threatGenerator.ts       # Deterministic threat generation
│   │   ├── skillMatching.ts         # Calculate cure speed from skills
│   │   ├── damageCalculation.ts     # Meter fill rates, mutations
│   │   └── gameLoop.ts              # Round timer, win/loss conditions
│   │
│   ├── blockchain/
│   │   ├── stellar.ts               # Stellar SDK integration
│   │   ├── riscZero.ts              # Risc Zero prover client
│   │   └── nft.ts                   # Bot NFT minting/reading
│   │
│   ├── stores/
│   │   ├── useGameStore.ts          # Zustand: game state
│   │   ├── useBotStore.ts           # Zustand: bot creation state
│   │   └── useDefenseStore.ts       # Zustand: defense round state
│   │
│   └── utils/
│       ├── constants.ts             # Skills, bot types, targets
│       ├── seedRandom.ts            # Deterministic RNG
│       └── helpers.ts               # Shared utilities
│
├── types/
│   ├── bot.ts                       # BotConfig, BotType, Ability
│   ├── threat.ts                    # Threat, ThreatSeverity
│   ├── developer.ts                 # Developer, Skill
│   └── game.ts                      # GameState, Assignment, Score
│
├── public/
│   ├── icons/                       # Skill icons, bot type icons
│   └── sounds/                      # Alert sounds, success chimes
│
├── risc-zero/                       # ZK circuit code (separate setup)
│   ├── guest/                       # RISC-V guest program
│   └── host/                        # Prover/verifier
│
├── stellar/                         # Smart contracts (separate setup)
│   └── contracts/
│       └── leaderboard.rs
│
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Risc Zero CLI (for ZK proofs)
- Stellar CLI (for smart contracts)

### Installation

```bash
# Clone repo
git clone https://github.com/yourusername/cyberdefense
cd cyberdefense

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Stellar RPC, IPFS endpoint, etc.

# Run development server
pnpm dev
```

Visit `http://localhost:3000`

---

## 🎯 Development Roadmap (Hackathon Sprint)

### Day 1: Core Gameplay (No Blockchain)

**Goal:** Playable defense round locally

- [ ] Set up Next.js project + dependencies
- [ ] Create game constants (skills, bot types, targets)
- [ ] Build bot config types + threat generator
- [ ] Implement basic drag-and-drop with dnd-kit
- [ ] Create ThreatCard with animated damage meter
- [ ] Create DeveloperCard (draggable)
- [ ] Implement skill matching logic
- [ ] Build game loop (timer, cure progress, damage accumulation)
- [ ] Test: Can you drag devs onto threats and cure them?

**Deliverable:** Working defense gameplay in browser (hardcoded bot config)

---

### Day 2: Bot Creator + Polish

**Goal:** Full game loop with UI polish

- [ ] Build bot creator multi-step flow
- [ ] Implement bot preview simulation
- [ ] Add Framer Motion animations:
  - [ ] Damage meter pulsing at high %
  - [ ] Cure progress bar smooth fill
  - [ ] Screen shake on system failure
  - [ ] Dev card drag ghost/overlay
- [ ] Create game over modal with results
- [ ] Add sound effects (alerts, success, failure)
- [ ] Implement local bot storage (localStorage for now)
- [ ] Style with cyberpunk/Mr. Robot aesthetic
- [ ] Test: Can you create a bot, face it, and see results?

**Deliverable:** Complete game experience (local-only)

---

### Day 3: Blockchain Integration

**Goal:** ZK proofs + Stellar leaderboard

- [ ] Set up Risc Zero guest program:
  - [ ] Parse compact replay format
  - [ ] Reproduce threat generation from bot config + seed
  - [ ] Validate action constraints (timing, dev availability)
  - [ ] Calculate final score deterministically
  - [ ] Commit public outputs to journal
- [ ] Create proof generation API route
- [ ] Deploy Groth16 verifier contract (Nethermind)
- [ ] Deploy Stellar leaderboard contract
- [ ] Implement bot NFT minting (public metadata)
- [ ] Integrate proof submission flow
- [ ] Build dual leaderboards (attacker/defender)
- [ ] Add wallet connection (Freighter for Stellar)
- [ ] Test: Can you submit a verified score and see it on-chain?

**Deliverable:** Full ZK-enabled game on testnet

---

## 🎨 Key Implementation Details

### Drag-and-Drop with dnd-kit

```tsx
// Example: DeveloperCard.tsx
import { useDraggable } from "@dnd-kit/core";

export function DeveloperCard({ dev }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: dev.id,
    data: { developer: dev },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {/* Dev card UI */}
    </div>
  );
}
```

```tsx
// Example: ThreatCard.tsx
import { useDroppable } from "@dnd-kit/core";

export function ThreatCard({ threat }) {
  const { setNodeRef, isOver } = useDroppable({
    id: threat.id,
    data: { threat },
  });

  return (
    <div ref={setNodeRef} className={isOver ? "ring-2 ring-green-500" : ""}>
      {/* Threat card UI */}
    </div>
  );
}
```

```tsx
// Example: DefenseScreen.tsx
import { DndContext } from "@dnd-kit/core";

export function DefenseScreen() {
  const assignDeveloper = useDefenseStore((state) => state.assignDeveloper);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.data.current?.developer) {
      assignDeveloper(
        over.data.current.threat.id,
        active.data.current.developer.id,
      );
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <ThreatQueue />
      <DeveloperPool />
    </DndContext>
  );
}
```

---

### Framer Motion Animations

```tsx
// Damage meter pulsing
<motion.div
  className="h-4 bg-red-500"
  style={{ width: `${damagePercent}%` }}
  animate={damagePercent > 70 ? {
    opacity: [1, 0.6, 1],
  } : {}}
  transition={{ duration: 0.5, repeat: Infinity }}
/>

// Cure progress smooth fill
<motion.div
  className="h-4 bg-green-500"
  initial={{ width: 0 }}
  animate={{ width: `${cureProgress}%` }}
  transition={{ duration: 0.3, ease: "easeOut" }}
/>

// Screen shake on failure
<motion.div
  animate={systemFailed ? {
    x: [0, -10, 10, -10, 10, 0],
  } : {}}
  transition={{ duration: 0.5 }}
>
  {children}
</motion.div>
```

---

### Zustand Game Store

```typescript
// lib/stores/useDefenseStore.ts
import { create } from "zustand";

interface DefenseStore {
  threats: Threat[];
  developers: Developer[];
  assignments: Map<string, string>; // threatId -> developerId
  score: number;
  timeRemaining: number;

  assignDeveloper: (threatId: string, devId: string) => void;
  removeDeveloper: (threatId: string) => void;
  updateCureProgress: (threatId: string, delta: number) => void;
  updateDamageMeters: (delta: number) => void;
  startRound: (botConfig: BotConfig) => void;
}

export const useDefenseStore = create<DefenseStore>((set, get) => ({
  threats: [],
  developers: [],
  assignments: new Map(),
  score: 0,
  timeRemaining: 90,

  assignDeveloper: (threatId, devId) => {
    const { assignments, developers, threats } = get();

    // Remove dev from previous assignment if any
    const prevAssignment = Array.from(assignments.entries()).find(
      ([_, id]) => id === devId,
    );
    if (prevAssignment) {
      assignments.delete(prevAssignment[0]);
    }

    // Assign to new threat
    assignments.set(threatId, devId);
    set({ assignments: new Map(assignments) });
  },

  // ... other actions
}));
```

---

### Threat Generation (Deterministic)

```typescript
// lib/game/threatGenerator.ts
import seedrandom from "seedrandom";

export function generateThreats(botConfig: BotConfig, seed: string): Threat[] {
  const rng = seedrandom(botConfig.hash + seed);
  const threats: Threat[] = [];
  let currentTime = 0;

  const totalThreats = calculateThreatCount(botConfig);

  for (let i = 0; i < totalThreats; i++) {
    const target = selectTarget(botConfig, rng);
    const skills = determineRequiredSkills(botConfig, target, rng);
    const spawnDelay = calculateSpawnDelay(botConfig, i, rng);

    currentTime += spawnDelay;

    threats.push({
      id: `threat-${i}`,
      spawnTime: currentTime,
      target,
      requiredSkills: skills,
      damageRate: calculateDamageRate(botConfig),
      severity: calculateSeverity(botConfig, currentTime),
      currentDamage: 0,
      cureProgress: 0,
    });
  }

  return threats;
}

function selectTarget(config: BotConfig, rng: () => number): SystemTarget {
  // 70% primary, 30% secondary
  const roll = rng();
  if (roll < 0.7) {
    return config.primaryTarget;
  } else if (config.secondaryTargets.length > 0) {
    const idx = Math.floor(rng() * config.secondaryTargets.length);
    return config.secondaryTargets[idx];
  }
  return config.primaryTarget;
}
```

---

## 🔐 ZK Architecture (TypeZERO-Aligned Privacy Model)

### Privacy Philosophy

**PUBLIC (Like TypeZERO's prompt):**

- Bot configuration NFT (the "challenge")
- Developer pool (fixed set, same for all players)
- Game rules & scoring formulas

**PRIVATE (Like TypeZERO's replay):**

- Defender's action log (the "solution")
- Strategic decisions & timing
- Assignment sequences

**COMMITTED (Like TypeZERO's public outputs):**

- Bot ID (config hash)
- Defender address
- Final score
- Threats cured/failed
- Duration
- Action log hash (for auditability)

### Data Flow

```
1. ATTACKER CREATES BOT
   ├─ Design bot config in UI
   ├─ Mint NFT with config as metadata (PUBLIC)
   └─ Config cached by backend

2. DEFENDER PLAYS
   ├─ Fetch bot config from NFT (PUBLIC)
   ├─ Generate seed = hash(botId + defenderId + timestamp)
   ├─ Generate threats deterministically (RNG from seed)
   ├─ Player drags devs, actions logged LOCALLY (PRIVATE)
   └─ Game ends, compact replay created

3. PROOF GENERATION
   ├─ Frontend sends to backend:
   │  ├─ Public: botId, defenderId, claimed score
   │  └─ Private: action replay (compact binary)
   ├─ Backend Risc Zero:
   │  ├─ Fetches bot config from cache/NFT
   │  ├─ Replays actions deterministically
   │  ├─ Validates constraints (timing, validity)
   │  ├─ Computes score independently
   │  └─ Commits public outputs to journal
   └─ Returns: proof seal, journal hash, image ID

4. ON-CHAIN SUBMISSION
   ├─ Frontend calls Stellar contract
   ├─ Contract verifies:
   │  ├─ Proof via Groth16 verifier
   │  ├─ Image ID matches (prevents program substitution)
   │  └─ Invoker == defender in journal
   └─ Updates leaderboard if valid
```

### Action Replay Format

Compact binary encoding (similar to TypeZERO's keystroke log):

```typescript
interface DefenseReplay {
  botId: BytesN<32>;           // Which bot was faced
  defenderId: Address;          // Who played
  gameSeed: BytesN<32>;        // Deterministic RNG seed
  startTimestamp: u64;         // Game start time
  events: ReplayEvent[];       // Compact action log
}

// Compact event encoding (5-7 bytes each)
struct ReplayEvent {
  timestamp_ms: u32,    // Time from game start
  action_type: u8,      // ASSIGN=0, UNASSIGN=1
  dev_id: u8,           // Developer 0-9 (fixed pool)
  threat_id: u8,        // Threat index
}
```

### ZK Guest Program Logic

```rust
// risc0/defense_verifier/guest/src/main.rs

pub fn main() {
    // Read public inputs
    let public: PublicInputs = env::read();

    // Read private inputs (the replay)
    let private: PrivateInputs = env::read();

    // 1. Verify bot config hash
    let bot_config = fetch_bot_config(public.bot_id);
    assert_eq!(hash(bot_config), public.bot_id);

    // 2. Generate threats deterministically
    let threats = generate_threats(
        &bot_config,
        private.replay.gameSeed
    );

    // 3. Replay defender actions
    let result = replay_defense(
        &threats,
        &private.replay.events,
        FIXED_DEVELOPER_POOL
    );

    // 4. Validate timing constraints
    for event in &private.replay.events {
        assert!(event.timestamp_ms >= MIN_ACTION_INTERVAL);
    }

    // 5. Compute score deterministically
    let score = calculate_score(&result);

    // 6. Commit public outputs
    env::commit(&PublicOutputs {
        bot_id: public.bot_id,
        defender: private.replay.defenderId,
        score,
        threats_total: threats.len(),
        threats_cured: result.cured_count,
        threats_failed: result.failed_count,
        duration_ms: result.duration_ms,
        replay_hash: hash(&private.replay.events),
    });
}
```

### Soroban Contract Interface

```rust
// contracts/leaderboard/src/lib.rs

#[contract]
pub struct LeaderboardContract;

#[contractimpl]
impl LeaderboardContract {
    // Submit verified score
    pub fn submit_score(
        env: Env,
        bot_id: BytesN<32>,
        defender: Address,
        score: u64,
        threats_cured: u32,
        threats_failed: u32,
        duration_ms: u32,
        journal_hash: BytesN<32>,
        image_id: BytesN<32>,
        seal: Bytes
    ) {
        // Enforce: only defender can submit their own score
        defender.require_auth();

        // Verify proof via Groth16 verifier
        let verifier: Address = env.storage().instance().get(&VERIFIER_ID).unwrap();
        verify_proof(env, verifier, image_id, journal_hash, seal);

        // Update best score if improved
        update_leaderboard(env, bot_id, defender, score, ...);
    }

    // Get top N defenders for a bot
    pub fn get_top(env: Env, bot_id: BytesN<32>) -> Vec<LeaderboardEntry>;

    // Get defender's best score
    pub fn get_best(env: Env, bot_id: BytesN<32>, defender: Address) -> Option<ScoreEntry>;
}
```

### Fixed Developer Pool

```typescript
// lib/utils/constants.ts

export const FIXED_DEVELOPER_POOL = [
  {
    id: 0,
    name: "Alice",
    skills: ["Python", "Network Security", "Wireshark"],
  },
  {
    id: 1,
    name: "Bob",
    skills: ["Rust", "Cryptography", "IDA Pro"],
  },
  {
    id: 2,
    name: "Charlie",
    skills: ["JavaScript", "Web Security", "Burp Suite"],
  },
  {
    id: 3,
    name: "Diana",
    skills: ["C/C++", "Endpoint Protection", "Volatility"],
  },
  {
    id: 4,
    name: "Eve",
    skills: ["Java", "Database Security", "Splunk"],
  },
  {
    id: 5,
    name: "Frank",
    skills: ["Assembly", "Forensics", "Metasploit"],
  },
  // ... up to 10 developers
] as const;
```

### Deterministic Scoring

```typescript
// Identical implementation in:
// - Frontend (for preview)
// - ZK Guest (for verification)
// - Contract (for validation)

function calculateScore(result: DefenseResult): number {
  const cureRate = result.threats_cured / result.threats_total;
  const accuracy_bps = Math.floor(cureRate * 10000);

  // Time bonus (faster = better)
  const expectedTime = result.threats_total * 5000; // 5s per threat
  const timeFactor = Math.max(0, expectedTime / result.duration_ms);

  // Final score (scaled integer)
  return Math.floor(accuracy_bps * timeFactor);
}
```

### Security Guarantees

✅ **Defender can't cheat:**

- Can't fake cure times (ZK recalculates with deterministic rates)
- Can't claim higher scores (ZK independently computes)
- Can't copy solutions (action logs stay private)

✅ **Attacker creativity rewarded:**

- Bot configs are public (showcases design skill)
- Leaderboard shows average defender performance
- Hard bots = more reputation

✅ **No backend trust required:**

- Backend can't submit fake scores (defender auth required)
- Backend can't see defender strategies (replay is private)
- Proof verification enforces correctness

---

## 🧪 Testing Locally

```bash
# Run defense gameplay with hardcoded bot
pnpm dev
# Navigate to /defense

# Test bot creator
# Navigate to /bot-creator

# Test threat generation determinism
pnpm test lib/game/threatGenerator.test.ts
```

---

## 🎯 Hackathon Judging Criteria

**✅ Innovation:** Asymmetric gameplay + ZK strategy privacy (novel use case)

**✅ Technical Complexity:** Risc Zero proofs + Stellar contracts + real-time gameplay

**✅ UX/Polish:** Drag-and-drop + Framer Motion animations + Mr. Robot aesthetic

**✅ Completeness:** Full game loop + both player sides + leaderboards

**✅ ZK Integration:** Meaningful use (not bolted-on) - strategy privacy enhances competitive depth

---

## 📝 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_LEADERBOARD_CONTRACT_ID=C...
STELLAR_VERIFIER_CONTRACT_ID=C...

RISC_ZERO_PROVER_URL=http://localhost:8080
RISC_ZERO_IMAGE_ID=...

# Bot NFT contract (if using separate NFT standard)
STELLAR_BOT_NFT_CONTRACT_ID=C...

DATABASE_URL=postgresql://... (for bot config cache, optional)
```

---

## 🚢 Deployment

```bash
# 1. Deploy Groth16 verifier contract (Nethermind)
stellar contract deploy \
  --wasm verifier.wasm \
  --network testnet

# 2. Deploy leaderboard contract
cd contracts/leaderboard
stellar contract build

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/leaderboard.wasm \
  --network testnet

# 3. Initialize leaderboard
stellar contract invoke \
  --id <LEADERBOARD_CONTRACT> \
  --network testnet \
  -- init \
  --verifier_id <VERIFIER_CONTRACT> \
  --image_id <RISC_ZERO_IMAGE_ID> \
  --admin <ADMIN_ADDRESS>

# 4. Deploy frontend
vercel deploy

# 5. Set up Risc Zero prover (can run locally or use Bonsai)
# Follow Risc Zero docs for production deployment
```

---

## 🎮 Game Design Constants

```typescript
// lib/utils/constants.ts

export const SKILLS = {
  // Programming Languages
  PYTHON: { id: "python", name: "Python", icon: "🐍" },
  RUST: { id: "rust", name: "Rust", icon: "⚙️" },
  JAVA: { id: "java", name: "Java", icon: "☕" },
  CPP: { id: "cpp", name: "C/C++", icon: "🔷" },
  JAVASCRIPT: { id: "javascript", name: "JavaScript", icon: "📜" },
  ASSEMBLY: { id: "assembly", name: "Assembly", icon: "🔧" },

  // Security Specializations
  NETWORK_SECURITY: { id: "network", name: "Network Security", icon: "🕸️" },
  ENDPOINT_PROTECTION: {
    id: "endpoint",
    name: "Endpoint Protection",
    icon: "🛡️",
  },
  CRYPTOGRAPHY: { id: "crypto", name: "Cryptography", icon: "🔐" },
  DATABASE_SECURITY: { id: "database", name: "Database Security", icon: "📊" },
  WEB_SECURITY: { id: "web", name: "Web Security", icon: "🌐" },
  FORENSICS: { id: "forensics", name: "Forensics", icon: "🔍" },

  // Tools
  WIRESHARK: { id: "wireshark", name: "Wireshark", icon: "🦈" },
  IDA_PRO: { id: "ida", name: "IDA Pro", icon: "🐉" },
  BURP_SUITE: { id: "burp", name: "Burp Suite", icon: "🔬" },
  METASPLOIT: { id: "metasploit", name: "Metasploit", icon: "🧰" },
  SPLUNK: { id: "splunk", name: "Splunk", icon: "📡" },
  VOLATILITY: { id: "volatility", name: "Volatility", icon: "🔎" },
} as const;

export const BOT_TYPES = {
  MALWARE: { id: "malware", name: "Malware", icon: "🦠" },
  TROJAN: { id: "trojan", name: "Trojan", icon: "🐴" },
  RANSOMWARE: { id: "ransomware", name: "Ransomware", icon: "🔒" },
  WORM: { id: "worm", name: "Worm", icon: "🪱" },
  ROOTKIT: { id: "rootkit", name: "Rootkit", icon: "👻" },
  SPYWARE: { id: "spyware", name: "Spyware", icon: "🕵️" },
  BOTNET: { id: "botnet", name: "Botnet Agent", icon: "🤖" },
  LOGIC_BOMB: { id: "logicbomb", name: "Logic Bomb", icon: "💣" },
} as const;

export const SYSTEM_TARGETS = {
  COMPUTE: { id: "compute", name: "Compute Nodes", icon: "🖥️" },
  STORAGE: { id: "storage", name: "Storage Systems", icon: "💾" },
  NETWORK: { id: "network", name: "Network Devices", icon: "🌐" },
  AUTH: { id: "auth", name: "Authentication Services", icon: "🔐" },
  ANALYTICS: { id: "analytics", name: "Analytics Systems", icon: "📊" },
  COMMUNICATION: {
    id: "communication",
    name: "Communication Servers",
    icon: "💬",
  },
  TRANSACTION: {
    id: "transaction",
    name: "Transaction Processors",
    icon: "🛒",
  },
  API: { id: "api", name: "API Gateways", icon: "📱" },
  ENDPOINT: { id: "endpoint", name: "User Endpoints", icon: "🖱️" },
  CDN: { id: "cdn", name: "CDN/Edge Nodes", icon: "🌍" },
  IOT: { id: "iot", name: "IoT Devices", icon: "🔌" },
} as const;

export const GAME_CONFIG = {
  ROUND_DURATION: 90, // seconds
  MAX_SIMULTANEOUS_THREATS: 5,
  BASE_DAMAGE_RATE: 1, // % per second
  BASE_CURE_RATE: 2, // % per second

  SKILL_MATCH_MULTIPLIERS: {
    PERFECT: 1.0, // All skills match
    GOOD: 0.6, // 2/3 skills match
    PARTIAL: 0.3, // 1/3 skills match
    NONE: 0, // Can't assign
  },

  SEVERITY_THRESHOLDS: {
    CRITICAL: 70, // % damage
    MEDIUM: 30,
    LOW: 0,
  },
} as const;
```

---

## 🐛 Common Issues

**dnd-kit not working?**

- Ensure `DndContext` wraps both draggable and droppable components
- Check that `id` props are unique strings

**Framer Motion animations laggy?**

- Use `transform` CSS instead of `left/top`
- Enable GPU acceleration with `transform: translate3d()`

**Zustand state not updating?**

- Make sure you're creating new objects/arrays (immutable updates)
- Use `set(() => ({ ... }))` not `set({ ... })` for complex updates

**Risc Zero proof generation slow?**

- Expected for complex circuits - show loading UI
- Consider proof batching for multiple scores

---

## 📚 Resources

- [dnd-kit Documentation](https://docs.dndkit.com/)
- [Framer Motion API](https://www.framer.com/motion/)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Risc Zero Docs](https://dev.risczero.com/)
- [Stellar Soroban Docs](https://developers.stellar.org/docs/smart-contracts)

---

## 🏆 Success Metrics

**Minimum Viable Demo:**

- [ ] Can create a bot with 3+ configuration choices
- [ ] Can play a 90-second defense round
- [ ] Drag-and-drop works smoothly
- [ ] Damage/cure meters animate correctly
- [ ] Score is calculated and displayed

**Hackathon Winner:**

- [ ] All of MVP +
- [ ] ZK proof generation works
- [ ] Scores appear on Stellar testnet
- [ ] Dual leaderboards functional
- [ ] Polished UI with animations
- [ ] Sound effects and feedback
- [ ] Mobile-responsive (bonus)

---

## 🤝 Contributing

This is a hackathon project, but PRs welcome for:

- Bug fixes
- Animation improvements
- Additional bot abilities
- Balance adjustments

---

## 📄 License

Creative Commons Zero
