"use client";

import type { CountingResult } from "@/lib/types";

export function CountingResultCard({ result }: { result: CountingResult }) {
  const main = result.breakdown[0];
  return (
    <div className="mt-3 rounded-xl border border-[#D9E2F0] bg-[#F4F8FF] p-3 text-[#1A2A44]">
      <p className="text-xl font-bold tracking-tight">
        {main ? `${main.expression} = ${result.total}` : result.total} 가지
      </p>
      {result.breakdown.map((b, i) => (
        <p key={i} className="mt-1 text-[14px]">
          {b.label}
          {result.breakdown.length > 1 ? `: ${b.expression} = ${b.value}` : ""}
        </p>
      ))}
      <ul className="mt-2 space-y-1 text-[14px] text-[#334]">
        {result.breakdown.map((b, i) => (
          <li key={`ex-${i}`}>
            ▸ {b.expression}
            {b.label ? ` (${b.label})` : ""} = {b.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
