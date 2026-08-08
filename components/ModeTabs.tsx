"use client";

import type { ChatMode } from "@/lib/types";

const TABS: { id: "nail" | "math"; label: string; emoji: string }[] =
  [
    { id: "nail", label: "전공 실습", emoji: "🎨" },
    { id: "math", label: "경우의 수", emoji: "🔢" },
  ];

export function ModeTabs({
  mode,
  onChange,
  accent,
}: {
  mode: ChatMode;
  onChange: (m: "nail" | "math") => void;
  accent: string;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-3 py-2"
      role="tablist"
      aria-label="답변 모드"
    >
      {TABS.map((t) => {
        const active = mode === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className="min-h-11 shrink-0 rounded-xl px-4 text-[15px] font-semibold transition"
            style={
              active
                ? { background: accent, color: "#fff" }
                : { background: "#F3F1EC", color: "#2A2A2A" }
            }
          >
            <span aria-hidden>{t.emoji}</span> {t.label}
          </button>
        );
      })}
    </div>
  );
}
