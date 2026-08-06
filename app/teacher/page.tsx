"use client";

import type { HistoryEntry } from "@/lib/types";
import { useMemo, useState } from "react";

export default function TeacherPage() {
  const [ok, setOk] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  async function unlock() {
    setError(null);
    const res = await fetch("/api/teacher-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: pass }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError("비밀번호가 올바르지 않아요.");
      return;
    }
    setOk(true);
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result)) as HistoryEntry[];
          if (Array.isArray(parsed)) {
            setEntries((prev) => [...prev, ...parsed]);
          }
        } catch {
          setError(`${file.name}을(를) 읽지 못했어요.`);
        }
      };
      reader.readAsText(file);
    });
  }

  const byGroup = useMemo(() => {
    const map = new Map<number, number>();
    for (const e of entries) {
      map.set(e.group, (map.get(e.group) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [entries]);

  const byMode = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.mode, (map.get(e.mode) || 0) + 1);
    }
    return [...map.entries()];
  }, [entries]);

  if (!ok) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F7F3EC] p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
          <h1 className="text-xl font-bold">교사용 질문 이력</h1>
          <p className="mt-1 text-sm text-[#666]">패스코드를 입력해 주세요.</p>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="mt-4 w-full min-h-11 rounded-xl border border-[#DDD] px-3"
            placeholder="비밀번호"
          />
          {error && <p className="mt-2 text-sm text-[#B33]">{error}</p>}
          <button
            type="button"
            onClick={unlock}
            className="mt-4 min-h-11 w-full rounded-xl bg-[#2A2A2A] font-bold text-white"
          >
            입장
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F7F3EC] p-4">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">교사용 질문 이력</h1>
        <p className="mt-1 text-sm text-[#666]">
          학생이 내보낸 JSON을 여기에 올려 조별·모드별 빈도를 확인하세요. 서버에는
          저장되지 않습니다.
        </p>

        <label className="mt-6 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C9B8A0] bg-white">
          <span className="font-semibold">JSON 파일 드래그 & 드롭 / 선택</span>
          <input
            type="file"
            accept="application/json,.json"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          />
        </label>

        {error && <p className="mt-2 text-sm text-[#B33]">{error}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl bg-white p-4">
            <h2 className="font-bold">조별 질문 수</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {byGroup.length === 0 && <li>데이터 없음</li>}
              {byGroup.map(([g, n]) => (
                <li key={g}>
                  {g}조: <strong>{n}</strong>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl bg-white p-4">
            <h2 className="font-bold">모드별 질문 수</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {byMode.length === 0 && <li>데이터 없음</li>}
              {byMode.map(([m, n]) => (
                <li key={m}>
                  {m}: <strong>{n}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-xl bg-white p-4">
          <h2 className="font-bold">최근 질문 ({entries.length})</h2>
          <ul className="mt-2 max-h-96 space-y-2 overflow-y-auto text-sm">
            {[...entries].reverse().slice(0, 100).map((e, i) => (
              <li key={i} className="border-b border-[#F0EBE3] pb-2">
                <span className="text-[#888]">
                  {new Date(e.ts).toLocaleString("ko-KR")} · {e.group}조 · {e.name} ·{" "}
                  {e.mode}
                </span>
                <p className="font-medium">{e.question}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
