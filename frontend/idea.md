# Zero Trust: Asymmetric ZK Security Game

A competitive cybersecurity game where hackers design encrypted attack bots and security teams defend systems through skill-based developer assignment. Built for Stellar + Risc Zero Hackathon.

## 🎮 Core Gameplay

**Hacker Side:** Design attack bots with encrypted configurations (target systems, required skills, spawn patterns, special abilities). Deploy bots and earn reputation based on average damage dealt to defenders.

**Defender Side:** Face encrypted bots in 90-second rounds. Drag-and-drop specialist developers onto incoming infections before damage meters hit 100%. Learn bot strategy through symptoms while racing against time.

**ZK Proof:** Risc Zero verifies bot config validity and defender actions were legitimate, then updates dual leaderboards on Stellar—without revealing bot strategies.

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

- **Risc Zero** - ZK proof generation (bot config validity + score verification)
- **Stellar** - Smart contracts (leaderboard, bot registry, score settlement)
- **IPFS / Backend storage** - Encrypted bot configs

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
│   │   │   ├── create/route.ts      # Store encrypted bot
│   │   │   ├── list/route.ts        # Get available bots
│   │   │   └── [id]/route.ts        # Get bot by ID
│   │   ├── defense/
│   │   │   └── submit/route.ts      # Submit defense result
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
│   │   └── ipfs.ts                  # Bot config storage
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
  - [ ] Verify bot config structure
  - [ ] Reproduce threat generation
  - [ ] Validate defender actions
  - [ ] Calculate final score
- [ ] Create proof generation API route
- [ ] Deploy Stellar smart contract (leaderboard storage)
- [ ] Implement bot encryption/decryption
- [ ] Store encrypted bots on IPFS or backend
- [ ] Integrate proof submission flow
- [ ] Build dual leaderboards (attacker/defender)
- [ ] Add wallet connection (Freighter for Stellar)
- [ ] Test: Can you submit a score and see it on-chain?

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
STELLAR_CONTRACT_ADDRESS=C...

RISC_ZERO_PROVER_URL=http://localhost:8080
RISC_ZERO_IMAGE_ID=...

IPFS_GATEWAY=https://ipfs.io/ipfs/
IPFS_API_URL=https://api.pinata.cloud

DATABASE_URL=postgresql://... (for bot storage, optional)
```

---

## 🚢 Deployment

```bash
# Deploy frontend
vercel deploy

# Deploy Stellar contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/leaderboard.wasm \
  --network testnet

# Set up Risc Zero prover (can run locally or use Bonsai)
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

---

**Let's build something the judges haven't seen before. 🚀**
