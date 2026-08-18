"use client";

import type { DesignSpecCard } from "@/lib/types";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function DesignGallery({ designs }: { designs: DesignSpecCard[] }) {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-[13px] font-medium text-[#666]">
        수정 예시 이미지입니다. 참고용이며 그대로 따라 할 필요는 없어요.
      </p>
      <div className="grid gap-3">
        {designs.map((d) => (
          <DesignCard key={d.id} design={d} />
        ))}
      </div>
    </div>
  );
}

function DesignCard({ design }: { design: DesignSpecCard }) {
  const [copied, setCopied] = useState(false);
  const text = [
    `[${design.name}]`,
    design.concept,
    design.editExplanation ? `수정 내용: ${design.editExplanation}` : "",
    `배열: ${design.tipPlan}`,
    design.countingBasis ? `경우의 수: ${design.countingBasis}` : "",
    design.makeSteps.length
      ? `반영한 보완점: ${design.makeSteps.join(" / ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className="overflow-hidden rounded-xl border border-[#E6DFD4] bg-white">
      {design.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={design.imageUrl}
          alt={design.name}
          className="max-h-72 w-full object-contain bg-[#F5F1EA]"
        />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-[#F5F1EA] text-[13px] text-[#888]">
          이미지 생성 대기 / 실패
        </div>
      )}
      <div className="p-3">
        <h4 className="font-bold text-[#1A1A1A]">{design.name}</h4>
        <p className="mt-1 text-[13px] leading-snug text-[#444]">
          {design.concept}
        </p>
        {design.editExplanation && (
          <div className="mt-3 rounded-lg border border-[#D6E4F5] bg-[#F5F9FD] p-2.5">
            <p className="text-sm font-bold text-[#1E4B8F]">어떻게 수정했나요?</p>
            <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-[#333]">
              {design.editExplanation}
            </p>
          </div>
        )}
        {design.makeSteps.length > 0 && !design.editExplanation && (
          <ul className="mt-2 list-disc pl-5 text-[13px] text-[#444]">
            {design.makeSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={copy}
          className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-lg bg-[#F0EBE3] text-sm font-semibold"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "복사됨" : "피드백 요약 복사하기"}
        </button>
      </div>
    </article>
  );
}
