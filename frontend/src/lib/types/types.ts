import type {
  BotType,
  SystemTargetId,
  ResourceAttackType,
  VictoryCondition,
  SpecialAbility,
  SpawnPattern,
  SkillDiversity,
  BotConfig as ContractBotConfig,
} from "@/contracts/bot_nft";

// export type BotType =
//   | "malware"
//   | "trojan"
//   | "ransomware"
//   | "worm"
//   | "rootkit"
//   | "spyware"
//   | "botnet"
//   | "logicbomb";
// Extracts the tag string from a discriminated union
// { tag: "Malware"; values: void } | { tag: "Trojan"; values: void } → "Malware" | "Trojan"
export type TagOf<T extends { tag: string }> = Lowercase<T["tag"]>;

export type BotTypeTag = TagOf<BotType>;
export type SystemTargetIdTag = TagOf<SystemTargetId>;
export type ResourceAttackTypeTag = TagOf<ResourceAttackType>;
export type VictoryConditionTag =
  | "time_survival"
  | "system_destruction"
  | "data_exfiltration";
export type SpecialAbilityTag = TagOf<SpecialAbility>;
export type SpawnPatternTag = TagOf<SpawnPattern>;
export type SkillDiversityTag = TagOf<SkillDiversity>;

export interface BotConfigFE {
  id?: string;
  createdAt?: string;
  creatorName?: string;
  timesPlayed?: number;
  avgDamageDealt?: number;
  abilities: Array<SpecialAbilityTag>;
  botName: string;
  botType: BotTypeTag;
  damageMultiplier: number;
  primaryTarget: SystemTargetIdTag;
  resourceAttack: ResourceAttackTypeTag;
  secondaryTargets: SystemTargetIdTag[];
  skillDiversity: SkillDiversityTag;
  spawnPattern: SpawnPatternTag;
  threatCount: number;
  version: number;
  victoryCondition: VictoryConditionTag;
}

export type SkillId =
  | "python"
  | "rust"
  | "java"
  | "cpp"
  | "javascript"
  | "assembly"
  | "network"
  | "endpoint"
  | "crypto"
  | "database"
  | "web"
  | "forensics"
  | "wireshark"
  | "ida"
  | "burp"
  | "metasploit"
  | "splunk"
  | "volatility";

// export type SystemTargetId =
//   | "compute"
//   | "storage"
//   | "network"
//   | "auth"
//   | "analytics"
//   | "communication"
//   | "transaction"
//   | "api"
//   | "endpoint"
//   | "cdn"
//   | "iot";

// export type ResourceAttackType =
//   | "cpu"
//   | "memory"
//   | "bandwidth"
//   | "disk"
//   | "none";
// export type VictoryCondition =
//   | "time_survival"
//   | "system_destruction"
//   | "data_exfiltration";
// export type SpecialAbility =
//   | "stealth"
//   | "mutation"
//   | "replication"
//   | "encryption"
//   | "persistence";

export interface Skill {
  id: SkillId;
  name: string;
  icon: string;
}

export interface SystemTarget {
  id: SystemTargetIdTag;
  name: string;
  icon: string;
}

// export interface BotConfig {
//   id?: string;
//   createdAt?: string;
//   creatorName?: string;

//   // Bot Identity
//   botName: string;
//   botType: BotType;

//   // Targeting
//   primaryTarget: SystemTargetId;
//   secondaryTargets: SystemTargetId[];

//   // Attack Strategy
//   resourceAttack: ResourceAttackType;
//   damageMultiplier: number; // 0.5 to 2.0

//   // Victory Condition
//   victoryCondition: VictoryCondition;

//   // Special Abilities (max 5)
//   abilities: SpecialAbility[];

//   // Threat Pattern
//   threatCount: number; // 3-8
//   spawnPattern: "steady" | "burst" | "crescendo";

//   // Skill Requirements (affects difficulty)
//   skillDiversity: "low" | "medium" | "high"; // how many different skills needed
// }

export interface SavedBot extends BotConfigFE {
  id?: string;
  createdAt?: string;
  creatorName?: string;
  timesPlayed?: number;
  avgDamageDealt?: number;
}
