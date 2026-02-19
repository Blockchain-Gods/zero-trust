import { Threat, Developer, Skill } from "./types/defense-types";
import { SYSTEM_TARGETS } from "./constants";
import seedrandom from "seedrandom";
import { BotConfigFE } from "./types/types";

export const SKILL_POOL: Skill[] = [
  { id: "python", name: "Python", icon: "🐍" },
  { id: "rust", name: "Rust", icon: "⚙️" },
  { id: "javascript", name: "JavaScript", icon: "📜" },
  { id: "network", name: "Network Security", icon: "🕸️" },
  { id: "endpoint", name: "Endpoint Protection", icon: "🛡️" },
  { id: "crypto", name: "Cryptography", icon: "🔐" },
  { id: "database", name: "Database Security", icon: "📊" },
  { id: "web", name: "Web Security", icon: "🌐" },
  { id: "forensics", name: "Forensics", icon: "🔍" },
];

export const FIXED_DEVELOPER_POOL: Developer[] = [
  {
    id: "dev-0",
    name: "Alice",
    avatar: "👩‍💻",
    skills: [
      { id: "python", name: "Python", icon: "🐍" },
      { id: "network", name: "Network Security", icon: "🕸️" },
      { id: "crypto", name: "Cryptography", icon: "🔐" },
    ],
    isAssigned: false,
    assignedToThreatId: null,
  },
  {
    id: "dev-1",
    name: "Bob",
    avatar: "👨‍💻",
    skills: [
      { id: "rust", name: "Rust", icon: "⚙️" },
      { id: "endpoint", name: "Endpoint Protection", icon: "🛡️" },
      { id: "database", name: "Database Security", icon: "📊" },
    ],
    isAssigned: false,
    assignedToThreatId: null,
  },
  {
    id: "dev-2",
    name: "Charlie",
    avatar: "🧑‍💻",
    skills: [
      { id: "javascript", name: "JavaScript", icon: "📜" },
      { id: "web", name: "Web Security", icon: "🌐" },
      { id: "forensics", name: "Forensics", icon: "🔍" },
    ],
    isAssigned: false,
    assignedToThreatId: null,
  },
  {
    id: "dev-3",
    name: "Diana",
    avatar: "👩‍🔬",
    skills: [
      { id: "crypto", name: "Cryptography", icon: "🔐" },
      { id: "python", name: "Python", icon: "🐍" },
      { id: "forensics", name: "Forensics", icon: "🔍" },
    ],
    isAssigned: false,
    assignedToThreatId: null,
  },
  {
    id: "dev-4",
    name: "Eve",
    avatar: "👨‍🔬",
    skills: [
      { id: "network", name: "Network Security", icon: "🕸️" },
      { id: "endpoint", name: "Endpoint Protection", icon: "🛡️" },
      { id: "web", name: "Web Security", icon: "🌐" },
    ],
    isAssigned: false,
    assignedToThreatId: null,
  },
  {
    id: "dev-5",
    name: "Frank",
    avatar: "🧑‍🔬",
    skills: [
      { id: "database", name: "Database Security", icon: "📊" },
      { id: "rust", name: "Rust", icon: "⚙️" },
      { id: "python", name: "Python", icon: "🐍" },
    ],
    isAssigned: false,
    assignedToThreatId: null,
  },
  {
    id: "dev-6",
    name: "Grace",
    avatar: "👩‍💻",
    skills: [
      { id: "web", name: "Web Security", icon: "🌐" },
      { id: "javascript", name: "JavaScript", icon: "📜" },
      { id: "database", name: "Database Security", icon: "📊" },
    ],
    isAssigned: false,
    assignedToThreatId: null,
  },
  {
    id: "dev-7",
    name: "Hiro",
    avatar: "👨‍💻",
    skills: [
      { id: "forensics", name: "Forensics", icon: "🔍" },
      { id: "network", name: "Network Security", icon: "🕸️" },
      { id: "rust", name: "Rust", icon: "⚙️" },
    ],
    isAssigned: false,
    assignedToThreatId: null,
  },
  {
    id: "dev-8",
    name: "Iris",
    avatar: "🧑‍💻",
    skills: [
      { id: "endpoint", name: "Endpoint Protection", icon: "🛡️" },
      { id: "crypto", name: "Cryptography", icon: "🔐" },
      { id: "javascript", name: "JavaScript", icon: "📜" },
    ],
    isAssigned: false,
    assignedToThreatId: null,
  },
  {
    id: "dev-9",
    name: "Jin",
    avatar: "👩‍🔬",
    skills: [
      { id: "python", name: "Python", icon: "🐍" },
      { id: "database", name: "Database Security", icon: "📊" },
      { id: "web", name: "Web Security", icon: "🌐" },
    ],
    isAssigned: false,
    assignedToThreatId: null,
  },
];

export function generateThreatsFromBot(
  botConfig: BotConfigFE,
  seed: string,
): Threat[] {
  const threats: Threat[] = [];
  const rng = seedrandom(seed);
  const count = botConfig.threatCount;
  const spawnInterval = getSpawnInterval(botConfig.spawnPattern, count);

  for (let i = 0; i < count; i++) {
    const spawnTime =
      botConfig.spawnPattern === "crescendo"
        ? (getSpawnInterval("crescendo", count) * i) / (1 + i * 0.15) // accelerates
        : getSpawnInterval(botConfig.spawnPattern, count) * i;

    const target =
      rng() < 0.7
        ? botConfig.primaryTarget
        : botConfig.secondaryTargets.length > 0
          ? botConfig.secondaryTargets[
              Math.floor(rng() * botConfig.secondaryTargets.length)
            ]
          : botConfig.primaryTarget;

    threats.push({
      id: `threat-${i}`,
      spawnTime,
      target: {
        id: target,
        ...SYSTEM_TARGETS[target],
      },
      requiredSkills: getRequiredSkills(botConfig, rng),
      damageRate: 1.2 * botConfig.damageMultiplier,
      currentDamage: 0,
      cureProgress: 0,
      assignedDeveloperId: null,
      isCured: false,
      isFailed: false,
    });
  }

  return threats;
}

function getSpawnInterval(
  pattern: "steady" | "burst" | "crescendo",
  count: number,
): number {
  switch (pattern) {
    case "steady":
      return 8;
    case "burst":
      return 3;
    case "crescendo":
      return 12;
    default:
      return 8;
  }
}

function getRequiredSkills(
  botConfig: BotConfigFE,
  rng: seedrandom.PRNG,
): Skill[] {
  const skillCount =
    botConfig.skillDiversity === "low"
      ? 2
      : botConfig.skillDiversity === "medium"
        ? 3
        : 4;

  const shuffled = [...SKILL_POOL].sort(() => rng() - 0.5);
  return shuffled.slice(0, skillCount);
}

// Developers are now fixed - just reset assignment state
export function generateDevelopers(): Developer[] {
  return FIXED_DEVELOPER_POOL.map((dev) => ({
    ...dev,
    isAssigned: false,
    assignedToThreatId: null,
  }));
}

export function calculateCureSpeed(
  threat: Threat,
  developer: Developer,
): number {
  const requiredSkillIds = threat.requiredSkills.map((s) => s.id);
  const devSkillIds = developer.skills.map((s) => s.id);

  const matchCount = requiredSkillIds.filter((id) =>
    devSkillIds.includes(id),
  ).length;
  const matchRatio = matchCount / requiredSkillIds.length;

  if (matchRatio === 1.0) return 3.0;
  if (matchRatio >= 0.66) return 2.0;
  if (matchRatio >= 0.33) return 1.0;
  return 0.5;
}

export function getMatchQuality(
  threat: Threat,
  developer: Developer,
): { label: string; color: string } {
  const requiredSkillIds = threat.requiredSkills.map((s) => s.id);
  const devSkillIds = developer.skills.map((s) => s.id);

  const matchCount = requiredSkillIds.filter((id) =>
    devSkillIds.includes(id),
  ).length;
  const matchRatio = matchCount / requiredSkillIds.length;

  if (matchRatio === 1.0)
    return { label: "Perfect Match", color: "text-green-400" };
  if (matchRatio >= 0.66)
    return { label: "Good Match", color: "text-blue-400" };
  if (matchRatio >= 0.33)
    return { label: "Partial Match", color: "text-yellow-400" };
  return { label: "Poor Match", color: "text-red-400" };
}

export function calculateScore(
  threatsCured: number,
  threatsTotal: number,
  systemsDestroyed: number,
  durationMs: number,
): number {
  const accuracy = threatsCured / threatsTotal;
  const accuracyBps = Math.floor(accuracy * 10000);

  // Reward faster completions (baseline: 8s per threat)
  const baselineDuration = threatsTotal * 8000;
  const timeFactor = Math.min(2.0, baselineDuration / durationMs);
  const timeBonus = Math.floor(timeFactor * 100);

  const damagePenalty = systemsDestroyed * 50;

  return Math.max(0, accuracyBps + timeBonus - damagePenalty);
}
