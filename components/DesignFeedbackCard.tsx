"use client";

import type { DesignFeedback } from "@/lib/types";

const LEVEL_COLOR: Record<string, string> = {
  좋음: "#2F7D4A",
  보통: "#C4A000",
  보완필요: "#C45C1A",
};

export function DesignFeedbackCard({ feedback }: { feedback: DesignFeedback }) {
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-[#E8E0D4] bg-[#FFFCFA] p-3">
      <p className="text-[15px] font-medium leading-relaxed">{feedback.overall}</p>

      <div className="space-y-2">
        {feedback.rubric.map((r) => (
          <div key={r.name} className="rounded-lg bg-white p-2.5 border border-[#F0EBE3]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{r.name}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                style={{ background: LEVEL_COLOR[r.level] || "#888" }}
              >
                {r.level}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#444]">{r.comment}</p>
          </div>
        ))}
      </div>

      {feedback.strengths.length > 0 && (
        <div>
          <p className="text-sm font-bold text-[#2F7D4A]">잘된 점</p>
          <ul className="mt-1 list-disc pl-5 text-[14px]">
            {feedback.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback.improvements.length > 0 && (
        <div>
          <p className="text-sm font-bold text-[#C45C1A]">보완점</p>
          <ul className="mt-1 list-disc pl-5 text-[14px]">
            {feedback.improvements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback.mathAdvice && (
        <div className="rounded-xl border border-[#B8C9E0] bg-[#F3F7FC] p-3">
          <p className="text-sm font-bold text-[#1E4B8F]">경우의 수 조언</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#333]">
            {feedback.mathAdvice.summary}
          </p>
          <p className="mt-2 text-[13px] text-[#444]">
            <span className="font-semibold">원리:</span>{" "}
            {feedback.mathAdvice.principle}
          </p>
          <p className="mt-1 text-[13px] text-[#444]">
            <span className="font-semibold">예시:</span>{" "}
            {feedback.mathAdvice.example}
          </p>
          <p className="mt-1 text-[13px] text-[#444]">
            <span className="font-semibold">실습 tip:</span>{" "}
            {feedback.mathAdvice.tip}
          </p>
        </div>
      )}

      <div className="rounded-xl border-2 border-[#C9A227]/30 bg-[#FFF9E8] p-3">
        <p className="text-sm font-bold text-[#7A5A00]">생각해 볼 질문</p>
        <ul className="mt-2 space-y-1.5 text-[14px] text-[#4A3A10]">
          {feedback.checkQuestions.map((q) => (
            <li key={q}>❓ {q}</li>
          ))}
        </ul>
      </div>

      {feedback.safetyNotes.length > 0 && (
        <div className="rounded-lg bg-[#FFF0EA] p-2.5 text-[13px] text-[#6A3020]">
          <p className="font-bold">안전</p>
          <ul className="list-disc pl-5">
            {feedback.safetyNotes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
