"use client";

import { getGroup, GROUPS } from "@/lib/knowledge/artists";
import type { Profile } from "@/lib/types";
import { useEffect, useState } from "react";

export function GroupSelector({
  open,
  initial,
  onSave,
  onClose,
}: {
  open: boolean;
  initial?: Profile | null;
  onSave: (p: Profile) => void;
  onClose?: () => void;
}) {
  const [group, setGroup] = useState(initial?.group ?? 1);
  const [name, setName] = useState(initial?.name ?? "");
  const g = getGroup(group);

  useEffect(() => {
    if (initial) {
      setGroup(initial.group);
      setName(initial.name ?? "");
    }
  }, [initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-[#FFFCFA] p-6 shadow-xl"
        role="dialog"
        aria-labelledby="onboard-title"
      >
        <h2 id="onboard-title" className="text-xl font-bold text-[#1A1A1A]">
          조를 선택해 주세요
        </h2>
        <p className="mt-1 text-[15px] text-[#555]">
          배정 화가에 맞춰 답변·샘플이 달라져요. 이름은 선택이에요.
        </p>

        <div className="mt-4 grid grid-cols-5 gap-2">
          {GROUPS.map((item) => (
            <button
              key={item.group}
              type="button"
              onClick={() => setGroup(item.group)}
              className="min-h-11 rounded-xl text-sm font-bold"
              style={
                group === item.group
                  ? { background: item.accentHex, color: "#fff" }
                  : { background: "#EEEAE4", color: "#333" }
              }
            >
              {item.group}조
            </button>
          ))}
        </div>

        <div
          className="mt-4 rounded-xl border border-[#E6E0D6] p-3"
          style={{ borderLeftWidth: 4, borderLeftColor: g.accentHex }}
        >
          <p className="text-sm font-semibold text-[#666]">배정 화가</p>
          <p className="text-lg font-bold" style={{ color: g.accentHex }}>
            {g.artist}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-[#444]">
            {g.intro}
          </p>
        </div>

        <label className="mt-4 block text-sm font-semibold text-[#444]">
          이름 (선택)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="미입력 시 익명"
            className="mt-1 w-full min-h-11 rounded-xl border border-[#DDD6CB] bg-white px-3 text-base outline-none focus:border-[#999]"
          />
        </label>

        <div className="mt-5 flex gap-2">
          {onClose && initial && (
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 flex-1 rounded-xl bg-[#EDE8E0] font-semibold"
            >
              취소
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              onSave({
                group: g.group,
                artist: g.artist,
                name: name.trim() || "익명",
                accentHex: g.accentHex,
              })
            }
            className="min-h-11 flex-[2] rounded-xl font-bold text-white"
            style={{ background: g.accentHex }}
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
