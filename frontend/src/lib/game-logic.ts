import { BotConfig } from "./types";
import { Threat, Developer, Skill } from "./defense-types";
import { SYSTEM_TARGETS } from "./constants";

// Available skills pool
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

// Generate threats from bot config
export function generateThreatsFromBot(botConfig: BotConfig): Threat[] {
  const threats: Threat[] = [];
  const count = botConfig.threatCount;
  const spawnInterval = getSpawnInterval(botConfig.spawnPattern, count);

  for (let i = 0; i < count; i++) {
    const spawnTime = spawnInterval * i;
    const target =
      i % 3 === 0
        ? botConfig.primaryTarget
        : botConfig.secondaryTargets[i % botConfig.secondaryTargets.length] ||
          botConfig.primaryTarget;

    threats.push({
      id: `threat-${i}`,
      spawnTime,
      target: {
        id: target,
        ...SYSTEM_TARGETS[target],
      },
      requiredSkills: getRequiredSkills(botConfig, i),
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
      return 90 / count; // Even distribution
    case "burst":
      return 5; // Quick bursts
    case "crescendo":
      return 90 / (count * 1.5); // Accelerating
    default:
      return 90 / count;
  }
}

function getRequiredSkills(botConfig: BotConfig, threatIndex: number): Skill[] {
  const skillCount =
    botConfig.skillDiversity === "low"
      ? 2
      : botConfig.skillDiversity === "medium"
        ? 3
        : 4;

  // Pick random skills from pool
  const shuffled = [...SKILL_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, skillCount);
}

// Generate random developers
export function generateDevelopers(): Developer[] {
  const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];
  const avatars = ["👩‍💻", "👨‍💻", "🧑‍💻", "👩‍🔬", "👨‍🔬", "🧑‍🔬"];

  return names.map((name, i) => ({
    id: `dev-${i}`,
    name,
    avatar: avatars[i],
    skills: getRandomSkills(3 + Math.floor(Math.random() * 2)), // 3-4 skills
    isAssigned: false,
    assignedToThreatId: null,
  }));
}

function getRandomSkills(count: number): Skill[] {
  const shuffled = [...SKILL_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Calculate cure speed based on skill match
export function calculateCureSpeed(
  threat: Threat,
  developer: Developer,
): number {
  const requiredSkillIds = threat.requiredSkills.map((s: any) => s.id);
  const devSkillIds = developer.skills.map((s: any) => s.id);

  const matchCount = requiredSkillIds.filter((id: any) =>
    devSkillIds.includes(id),
  ).length;
  const matchRatio = matchCount / requiredSkillIds.length;

  if (matchRatio === 1.0) return 3.0; // Perfect match - 3% per second
  if (matchRatio >= 0.66) return 2.0; // Good match - 2% per second
  if (matchRatio >= 0.33) return 1.0; // Partial match - 1% per second
  return 0.5; // Poor match - 0.5% per second
}

// Get match quality label
export function getMatchQuality(
  threat: Threat,
  developer: Developer,
): {
  label: string;
  color: string;
} {
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

// Calculate final score
export function calculateScore(
  threatsCured: number,
  systemsDestroyed: number,
  timeRemaining: number,
): number {
  const cureBonus = threatsCured * 100;
  const damagesPenalty = systemsDestroyed * 50;
  const timeBonus = Math.floor(timeRemaining * 2);

  return Math.max(0, cureBonus - damagesPenalty + timeBonus);
}
