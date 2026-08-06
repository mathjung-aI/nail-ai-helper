import type { HistoryEntry, Profile } from "@/lib/types";

const PROFILE_KEY = "nailapp.profile";
const HISTORY_KEY = "nailapp.history";
const IMAGE_GEN_KEY = "nailapp.imageGenCount";

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendHistory(entry: HistoryEntry): void {
  const list = loadHistory();
  list.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-200)));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function exportHistoryJson(): string {
  return JSON.stringify(loadHistory(), null, 2);
}

export function exportHistoryCsv(): string {
  const rows = loadHistory();
  const header = "ts,group,name,mode,question,answerSummary";
  const lines = rows.map((r) =>
    [
      new Date(r.ts).toISOString(),
      r.group,
      csvEscape(r.name),
      r.mode,
      csvEscape(r.question),
      csvEscape(r.answerSummary),
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

function csvEscape(s: string): string {
  const v = s.replace(/"/g, '""');
  return `"${v}"`;
}

export function getImageGenCount(): number {
  if (typeof window === "undefined") return 0;
  return Number(sessionStorage.getItem(IMAGE_GEN_KEY) || "0");
}

export function bumpImageGenCount(n: number): number {
  const next = getImageGenCount() + n;
  sessionStorage.setItem(IMAGE_GEN_KEY, String(next));
  return next;
}

export function canGenerateImages(n: number): boolean {
  return getImageGenCount() + n <= 6;
}
