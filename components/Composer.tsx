"use client";

import { Camera, Send } from "lucide-react";
import { useState } from "react";

export function Composer({
  accent,
  disabled,
  loadingLabel,
  onSend,
  onUpload,
}: {
  accent: string;
  disabled?: boolean;
  loadingLabel?: string | null;
  onSend: (text: string) => void;
  onUpload: () => void;
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
      <button
        type="button"
        onClick={onUpload}
        disabled={disabled}
        className="mb-2 inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-white disabled:opacity-50"
        style={{ background: accent }}
      >
        <Camera size={18} /> 작품 피드백 받기
      </button>
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
          placeholder="네일·경우의 수 질문이 있으면 입력 (선택)"
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
