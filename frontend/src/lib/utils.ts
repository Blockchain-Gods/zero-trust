import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

export function normaliseTag(tag: string): string {
  // "LogicBomb" → "logicbomb", "TimeSurvival" → "time_survival", etc.
  return tag
    .replace(/([A-Z])/g, (m, c, i) => (i > 0 ? "_" + c : c))
    .toLowerCase()
    .replace(/^_/, "");
}

export function normaliseTagHyphen(tag: string): string {
  return tag
    .replace(/([A-Z])/g, (m, c, i) => (i > 0 ? "-" + c : c))
    .toLowerCase()
    .replace(/^-/, "");
}

export function slugify(str: string) {
  return str.replace(/-/g, "").toLowerCase();
}

export function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${s}s`;
}
