"use client";

import type { DesignSpecCard } from "@/lib/types";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function DesignGallery({ designs }: { designs: DesignSpecCard[] }) {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-[13px] font-medium text-[#666]">
        이건 예시일 뿐입니다. 조에서 분석한 화가 요소로 바꿔 보세요.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
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
    `베이스: ${design.base} / 기법: ${design.technique} / 모티브: ${design.motif}`,
    `배열: ${design.tipPlan}`,
    `경우의 수: ${design.countingBasis}`,
    `순서: ${design.makeSteps.join(" → ")}`,
    `주의: ${design.cautions.join(" / ")}`,
  ].join("\n");

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
          className="h-36 w-full object-cover bg-[#F5F1EA]"
        />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-[#F5F1EA] text-[13px] text-[#888]">
          이미지 생성 대기 / 실패
        </div>
      )}
      <div className="p-3">
        <h4 className="font-bold text-[#1A1A1A]">{design.name}</h4>
        <p className="mt-1 text-[13px] leading-snug text-[#444]">{design.concept}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {[design.base, design.technique, design.motif].map((t) => (
            <span
              key={t}
              className="rounded-md bg-[#F3EEE5] px-1.5 py-0.5 text-[11px] text-[#555]"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-[#666]">{design.countingBasis}</p>
        <button
          type="button"
          onClick={copy}
          className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-lg bg-[#F0EBE3] text-sm font-semibold"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "복사됨" : "이 안으로 활동지에 기록하기(복사)"}
        </button>
      </div>
    </article>
  );
}
