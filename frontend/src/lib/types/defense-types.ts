// Defense game specific types

import { DeployedBot } from "../storage";
import {
  SystemTargetIdTag,
  SkillId,
  BotTypeTag,
  SavedBot,
  VictoryConditionTag,
} from "./types";

export interface Skill {
  id: SkillId;
  name: string;
  icon: string;
}

export interface Threat {
  id: string;
  spawnTime: number;
  target: {
    id: SystemTargetIdTag;
    name: string;
    icon: string;
  };
  requiredSkills: Skill[];
  damageRate: number; // % per second
  currentDamage: number; // 0-100
  cureProgress: number; // 0-100
  assignedDeveloperId: string | null;
  isCured: boolean;
  isFailed: boolean;
}

export interface Developer {
  id: string;
  name: string;
  skills: Skill[];
  avatar: string;
  isAssigned: boolean;
  assignedToThreatId: string | null;
}

export interface DefenseGameState {
  isPlaying: boolean;
  isPaused: boolean;
  timeRemaining: number; // seconds
  threats: Threat[];
  developers: Developer[];
  systemsDestroyed: number;
  threatsCured: number;
  score: number;
  startTime: number | null;
}

export interface DefenseAction {
  timestamp: number;
  type: "ASSIGN" | "UNASSIGN";
  developerId: string;
  threatId: string;
}

export interface DefenseReplay {
  botId: string;
  defenderId: string;
  gameSeed: string;
  startTimestamp: number;
  actions: DefenseAction[];
}

const BOT_TYPE_DISPLAY: Record<BotTypeTag, string> = {
  malware: "malware",
  trojan: "trojan",
  ransomware: "ransomware",
  worm: "worm",
  rootkit: "rootkit",
  spyware: "spyware",
  botnet: "botnet-agent",
  logicbomb: "logic-bomb",
};

// export function normaliseBotTypes(
//   bots: (SavedBot | DeployedBot)[],
// ): (SavedBot | DeployedBot)[] {
//   return bots.map((bot) => ({
//     ...bot,
//     botType: BOT_TYPE_DISPLAY[bot.botType] ?? bot.botType,
//   }));
// }

export interface ThreatWithCommit extends Threat {
  committingDevId: string | null;
  commitProgress: number; // 0-100
}

export interface ExtendedGameState extends Omit<DefenseGameState, "threats"> {
  threats: ThreatWithCommit[];
  victoryCondition: VictoryConditionTag;
  dataLeaked: number;
  defenderWon: boolean | null;
  endReason: string | null;
}
