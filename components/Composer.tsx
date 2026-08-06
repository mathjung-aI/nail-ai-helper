"use client";

import { Camera, Sparkles, Send } from "lucide-react";
import { useState } from "react";

export function Composer({
  accent,
  disabled,
  loadingLabel,
  onSend,
  onUpload,
  onSamples,
}: {
  accent: string;
  disabled?: boolean;
  loadingLabel?: string | null;
  onSend: (text: string) => void;
  onUpload: () => void;
  onSamples: () => void;
}) {
  const [text, setText] = useState("");

  function submit() {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
  }

  return (
    <div className="border-t border-[#EBE6DE] bg-white px-3 py-2 safe-pb">
      {loadingLabel && (
        <p className="mb-1.5 text-[13px] font-medium text-[#666] animate-pulse">
          {loadingLabel}
        </p>
      )}
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={onUpload}
          disabled={disabled}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F3EEE5] px-2 text-sm font-semibold text-[#333]"
        >
          <Camera size={18} /> 내 디자인 피드백
        </button>
        <button
          type="button"
          onClick={onSamples}
          disabled={disabled}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F3EEE5] px-2 text-sm font-semibold text-[#333]"
        >
          <Sparkles size={18} /> 샘플 디자인
        </button>
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="질문을 입력하세요"
          disabled={disabled}
          className="min-h-12 flex-1 rounded-xl border border-[#DDD6CB] bg-[#FFFCFA] px-3 text-base outline-none focus:border-[#999]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-xl text-white disabled:opacity-40"
          style={{ background: accent }}
          aria-label="전송"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
