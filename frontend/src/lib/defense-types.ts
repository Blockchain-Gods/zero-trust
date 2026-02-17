// Defense game specific types

import { SystemTargetId, SkillId } from "./types/types";

export interface Skill {
  id: SkillId;
  name: string;
  icon: string;
}

export interface Threat {
  id: string;
  spawnTime: number;
  target: {
    id: SystemTargetId;
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
