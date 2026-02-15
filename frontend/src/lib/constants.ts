import {
  BotType,
  SystemTargetId,
  ResourceAttackType,
  VictoryCondition,
  SpecialAbility,
} from "./types";

export const BOT_TYPES: Record<
  BotType,
  { name: string; icon: string; description: string }
> = {
  malware: {
    name: "Malware",
    icon: "🦠",
    description: "General purpose attack bot - balanced stats",
  },
  trojan: {
    name: "Trojan",
    icon: "🐴",
    description: "Disguises as legitimate process - harder to detect",
  },
  ransomware: {
    name: "Ransomware",
    icon: "🔒",
    description: "Encrypts data rapidly - high damage rate",
  },
  worm: {
    name: "Worm",
    icon: "🪱",
    description: "Self-replicating - spawns multiple threats",
  },
  rootkit: {
    name: "Rootkit",
    icon: "👻",
    description: "Deep system access - requires advanced skills",
  },
  spyware: {
    name: "Spyware",
    icon: "🕵️",
    description: "Silent data exfiltration - slow but persistent",
  },
  botnet: {
    name: "Botnet Agent",
    icon: "🤖",
    description: "Coordinated attack - multiple simultaneous threats",
  },
  logicbomb: {
    name: "Logic Bomb",
    icon: "💣",
    description: "Delayed activation - sudden burst damage",
  },
};

export const SYSTEM_TARGETS: Record<
  SystemTargetId,
  { name: string; icon: string }
> = {
  compute: { name: "Compute Nodes", icon: "🖥️" },
  storage: { name: "Storage Systems", icon: "💾" },
  network: { name: "Network Devices", icon: "🌐" },
  auth: { name: "Authentication Services", icon: "🔐" },
  analytics: { name: "Analytics Systems", icon: "📊" },
  communication: { name: "Communication Servers", icon: "💬" },
  transaction: { name: "Transaction Processors", icon: "🛒" },
  api: { name: "API Gateways", icon: "📱" },
  endpoint: { name: "User Endpoints", icon: "🖱️" },
  cdn: { name: "CDN/Edge Nodes", icon: "🌍" },
  iot: { name: "IoT Devices", icon: "🔌" },
};

export const RESOURCE_ATTACKS: Record<
  ResourceAttackType,
  { name: string; icon: string }
> = {
  cpu: { name: "CPU Exhaustion", icon: "⚡" },
  memory: { name: "Memory Leak", icon: "📈" },
  bandwidth: { name: "Bandwidth Flood", icon: "🌊" },
  disk: { name: "Disk Fill", icon: "💽" },
  none: { name: "None", icon: "➖" },
};

export const VICTORY_CONDITIONS: Record<
  VictoryCondition,
  { name: string; description: string }
> = {
  time_survival: {
    name: "Time Survival",
    description: "Bot wins if it survives the full 90 seconds",
  },
  system_destruction: {
    name: "System Destruction",
    description: "Bot wins if it destroys 3+ systems",
  },
  data_exfiltration: {
    name: "Data Exfiltration",
    description: "Bot wins based on data stolen over time",
  },
};

export const SPECIAL_ABILITIES: Record<
  SpecialAbility,
  { name: string; icon: string; description: string }
> = {
  stealth: {
    name: "Stealth Mode",
    icon: "🥷",
    description: "Harder to detect - shows fewer symptoms initially",
  },
  mutation: {
    name: "Code Mutation",
    icon: "🧬",
    description: "Changes required skills mid-cure",
  },
  replication: {
    name: "Self-Replication",
    icon: "👯",
    description: "Spawns additional threats when damaged",
  },
  encryption: {
    name: "Heavy Encryption",
    icon: "🔐",
    description: "Requires crypto skills to cure",
  },
  persistence: {
    name: "Persistence",
    icon: "♾️",
    description: "Harder to fully remove - slow cure rate",
  },
};

export const SPAWN_PATTERNS = {
  steady: {
    name: "Steady Stream",
    description: "Threats appear at regular intervals",
  },
  burst: {
    name: "Burst Attack",
    description: "Multiple threats spawn simultaneously",
  },
  crescendo: {
    name: "Crescendo",
    description: "Threats spawn faster over time",
  },
};

export const SKILL_DIVERSITY = {
  low: {
    name: "Low Diversity",
    description: "1-2 different skill types needed",
  },
  medium: {
    name: "Medium Diversity",
    description: "3-4 different skill types needed",
  },
  high: {
    name: "High Diversity",
    description: "5+ different skill types needed",
  },
};
