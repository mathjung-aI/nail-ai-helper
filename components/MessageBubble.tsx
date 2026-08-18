"use client";

import { CountingResultCard } from "@/components/CountingResultCard";
import { DesignFeedbackCard } from "@/components/DesignFeedbackCard";
import { DesignGallery } from "@/components/DesignGallery";
import type { ChatMessage, KnowledgeChunk } from "@/lib/types";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function MessageBubble({
  message,
  accent,
  onSourceClick,
  onFollowUp,
}: {
  message: ChatMessage;
  accent: string;
  onSourceClick?: (label: string) => void;
  onFollowUp?: (q: string) => void;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-[16px] leading-relaxed ${
          isUser
            ? "text-white"
            : "border border-[#EBE6DE] bg-white/85 text-[#1A1A1A] shadow-sm backdrop-blur-[8px]"
        }`}
        style={isUser ? { background: accent } : undefined}
      >
        <div className="whitespace-pre-wrap">{renderMarkdownLite(message.content)}</div>

        {message.counting?.ok && <CountingResultCard result={message.counting} />}

        {message.feedback && <DesignFeedbackCard feedback={message.feedback} />}

        {message.designs && message.designs.length > 0 && (
          <DesignGallery designs={message.designs} />
        )}

        {!isUser && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#F3F0EA] px-2 text-xs font-semibold text-[#444]"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "복사됨" : "복사"}
            </button>
            {message.sources?.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSourceClick?.(s)}
                className="rounded-full bg-[#EEF3EA] px-2.5 py-1 text-[11px] font-medium text-[#3A5A2A]"
              >
                {s.startsWith("📖") || s.startsWith("📐") || s.startsWith("📋")
                  ? s
                  : `📖 ${s}`}
              </button>
            ))}
          </div>
        )}

        {!isUser && message.followUps && message.followUps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.followUps.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFollowUp?.(f)}
                className="rounded-full border border-[#DDD6CB] bg-[#FFFCFA] px-2.5 py-1 text-left text-[12px] text-[#333]"
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-bold">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export function SourceSheet({
  open,
  label,
  chunk,
  onClose,
}: {
  open: boolean;
  label: string;
  chunk?: KnowledgeChunk | null;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="max-h-[70vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-base font-bold">{label}</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 min-w-10 rounded-lg bg-[#F0EBE3] font-bold"
          >
            ✕
          </button>
        </div>
        {chunk ? (
          <>
            <p className="text-sm font-semibold text-[#666]">
              {chunk.title}
              {chunk.page ? ` · ${chunk.page}` : ""}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[#222]">
              {chunk.body}
            </p>
            {chunk.tips && (
              <ul className="mt-2 list-disc pl-5 text-[14px] text-[#444]">
                {chunk.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            {chunk.safety && (
              <div className="mt-3 rounded-lg bg-[#FFF6F0] p-3 text-[14px] text-[#5A3A20]">
                <p className="font-bold">안전 수칙</p>
                <ul className="mt-1 list-disc pl-5">
                  {chunk.safety.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="text-[15px] text-[#444]">
            교재·지도안의 해당 부분을 직접 확인해 보세요. 출처 배지를 눌러 원문을
            여는 기능입니다.
          </p>
        )}
      </div>
    </div>
  );
}
