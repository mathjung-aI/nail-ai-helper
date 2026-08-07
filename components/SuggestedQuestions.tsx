"use client";

import { SUGGESTED_QUESTIONS } from "@/lib/knowledge/lesson";
import type { ChatMode, SuggestedQuestion } from "@/lib/types";

const MODE_TO_CAT: Record<"nail" | "math", SuggestedQuestion["category"]> = {
  nail: "nail",
  math: "math",
};

export function SuggestedQuestions({
  session,
  mode,
  onSelectSession,
  onAsk,
  onUpload,
  extra,
}: {
  session: 1 | 2 | 3;
  mode: ChatMode;
  onSelectSession: (s: 1 | 2 | 3) => void;
  onAsk: (text: string) => void;
  onUpload: () => void;
  extra?: string[];
}) {
  const cat = mode === "math" ? MODE_TO_CAT.math : MODE_TO_CAT.nail;
  const chips = [
    ...SUGGESTED_QUESTIONS.filter(
      (q) =>
        (q.session === session || q.session === "common") &&
        q.category !== "lesson" &&
        (q.category === cat || q.category === "design")
    ),
  ];

  return (
    <div className="border-t border-[#EBE6DE] bg-[#FFFCFA] px-3 py-2">
      <div className="mb-2 flex gap-1.5">
        {([1, 2, 3] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSelectSession(s)}
            className="min-h-9 rounded-lg px-3 text-sm font-semibold"
            style={
              session === s
                ? { background: "#2A2A2A", color: "#fff" }
                : { background: "#EFEAE3", color: "#444" }
            }
          >
            {s}차시
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {chips.map((q) => (
          <button
            key={q.text}
            type="button"
            onClick={() => {
              if (q.action === "upload") onUpload();
              else onAsk(q.text);
            }}
            className="min-h-11 shrink-0 rounded-full border border-[#DDD6CB] bg-white px-3 text-left text-[13px] text-[#333]"
          >
            {q.text}
          </button>
        ))}
        {extra?.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onAsk(t)}
            className="min-h-11 shrink-0 rounded-full border border-dashed border-[#C9B8A0] bg-[#FFF9F0] px-3 text-left text-[13px] text-[#333]"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
