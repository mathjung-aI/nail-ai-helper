"use client";

import { Composer } from "@/components/Composer";
import { DesignUploader } from "@/components/DesignUploader";
import { GroupSelector } from "@/components/GroupSelector";
import { MessageBubble, SourceSheet } from "@/components/MessageBubble";
import { ModeTabs } from "@/components/ModeTabs";
import { SuggestedQuestions } from "@/components/SuggestedQuestions";
import { getGroup, getSamplesForGroup } from "@/lib/knowledge/artists";
import { LESSON_CHUNKS } from "@/lib/knowledge/lesson";
import { MATH_CHUNKS } from "@/lib/knowledge/math";
import { NAIL_CHUNKS } from "@/lib/knowledge/nail";
import {
  appendHistory,
  exportHistoryCsv,
  exportHistoryJson,
  loadHistory,
  loadProfile,
  saveProfile,
} from "@/lib/storage";
import type {
  ChatMessage,
  ChatMode,
  DesignFeedback,
  KnowledgeChunk,
  Profile,
} from "@/lib/types";
import { Download, History, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadingFor(mode: ChatMode) {
  if (mode === "math") return "조합 수를 계산하는 중…";
  if (mode === "lesson") return "학습지도안을 확인하는 중…";
  return "교재를 찾아보는 중…";
}

export function ChatWindow({ mockBadge }: { mockBadge: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showOnboard, setShowOnboard] = useState(false);
  const [mode, setMode] = useState<ChatMode>("nail");
  const [session, setSession] = useState<1 | 2 | 3>(2);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadLabel, setLoadLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState<{
    label: string;
    chunk?: KnowledgeChunk | null;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const accent = profile?.accentHex || getGroup(profile?.group || 1).accentHex;

  useEffect(() => {
    const p = loadProfile();
    if (p) {
      setProfile(p);
    } else {
      setShowOnboard(true);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function persistProfile(p: Profile) {
    saveProfile(p);
    setProfile(p);
    setShowOnboard(false);
  }

  async function sendQuestion(text: string) {
    if (!profile || busy) return;
    setError(null);
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      mode,
      createdAt: Date.now(),
    };
    const assistantId = uid();
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        mode,
        createdAt: Date.now(),
      },
    ]);
    setBusy(true);
    setLoadLabel(loadingFor(mode));

    try {
      const history = [...messages, userMsg]
        .filter((m) => m.content)
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages: history, profile }),
      });

      if (!res.ok || !res.body) throw new Error("fail");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      let meta: {
        sources?: string[];
        followUps?: string[];
        counting?: ChatMessage["counting"];
      } = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const json = JSON.parse(line.slice(5).trim());
          if (json.type === "token") {
            full += json.content;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: full } : m
              )
            );
          }
          if (json.type === "meta") {
            meta = json;
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: full,
                sources: meta.sources,
                followUps: meta.followUps,
                counting: meta.counting ?? null,
              }
            : m
        )
      );

      appendHistory({
        ts: Date.now(),
        group: profile.group,
        name: profile.name || "익명",
        mode,
        question: text,
        answerSummary: full.slice(0, 120),
      });
    } catch {
      setError(
        "지금은 답변을 가져오지 못했어요. 잠시 후 다시 시도하거나 선생님께 알려 주세요."
      );
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setBusy(false);
      setLoadLabel(null);
    }
  }

  async function showSamples() {
    if (!profile) return;
    setBusy(true);
    setLoadLabel("샘플 디자인을 불러오는 중…");
    try {
      const samples = getSamplesForGroup(profile.group);
      const msg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: `${profile.group}조 · ${profile.artist} 분위기에 맞춘 샘플 3안이에요. 예시이니 조 분석 요소로 바꿔 보세요.`,
        designs: samples,
        createdAt: Date.now(),
        mode,
      };
      setMessages((prev) => [...prev, msg]);
    } finally {
      setBusy(false);
      setLoadLabel(null);
    }
  }

  function onFeedback(feedback: DesignFeedback) {
    const msg: ChatMessage = {
      id: uid(),
      role: "assistant",
      content: "업로드한 디자인을 루브릭으로 살펴봤어요. 정답은 없으니 점검 질문으로 조에서 다듬어 보세요.",
      feedback,
      createdAt: Date.now(),
      mode: "nail",
    };
    setMessages((prev) => [...prev, msg]);
  }

  function findChunk(label: string): KnowledgeChunk | null {
    const all = [...NAIL_CHUNKS, ...MATH_CHUNKS, ...(LESSON_CHUNKS as KnowledgeChunk[])];
    return (
      all.find(
        (c) =>
          c.sourceLabel === label ||
          label.includes(c.page || "___") ||
          label.includes(c.title)
      ) || null
    );
  }

  const g = profile ? getGroup(profile.group) : null;

  return (
    <div className="flex h-[100dvh] flex-col bg-[#F7F3EC]">
      <header
        className="flex items-center justify-between gap-2 px-3 py-3 text-white"
        style={{ background: accent }}
      >
        <div>
          <h1 className="text-base font-bold sm:text-lg">
            🎨 네일아트 AI 학습 도우미
          </h1>
          {mockBadge && (
            <span className="mt-0.5 inline-block rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
              MOCK 모드
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="min-h-11 min-w-11 rounded-xl bg-white/15"
            aria-label="질문 기록"
          >
            <History className="mx-auto" size={18} />
          </button>
          <button
            type="button"
            onClick={() => setShowOnboard(true)}
            className="min-h-11 rounded-xl bg-white/15 px-3 text-sm font-semibold"
          >
            {profile ? `${profile.group}조 · ${profile.artist}` : "조 선택"}{" "}
            <Pencil className="ml-1 inline" size={14} />
          </button>
        </div>
      </header>

      <ModeTabs mode={mode} onChange={setMode} accent={accent} />

      <main className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && g && (
          <div className="mx-auto max-w-2xl rounded-2xl bg-white/80 p-5 border border-[#E8E0D4]">
            <p className="text-sm font-semibold" style={{ color: accent }}>
              {g.group}조 · {g.artist}
            </p>
            <p className="mt-2 text-[16px] leading-relaxed text-[#333]">{g.intro}</p>
            <p className="mt-3 text-[14px] text-[#666]">
              실습 중 궁금한 점을 물어보거나, 아래 추천 질문·샘플을 눌러 보세요.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "이 두께로 조형해도 경화가 잘 될까요?",
                "베이스 컬러 5, 아트 기법 4, 입체 모티브 3이면 팁 디자인은 몇 가지예요?",
                "미경화 젤은 어떻게 처리하나요?",
                "디자인을 확정할 때 무엇을 기준으로 판단해야 하나요?",
                "톱 젤은 언제 바르나요?",
                "우리 조 화가에 맞는 샘플 디자인을 보여주세요.",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() =>
                    q.includes("샘플") ? showSamples() : sendQuestion(q)
                  }
                  className="min-h-11 rounded-full border border-[#DDD6CB] bg-[#FFFCFA] px-3 text-left text-[13px]"
                >
                  {q}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={showSamples}
              className="mt-4 min-h-11 w-full rounded-xl font-bold text-white"
              style={{ background: accent }}
            >
              샘플 디자인 보기
            </button>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            accent={accent}
            onSourceClick={(label) =>
              setSourceOpen({ label, chunk: findChunk(label) })
            }
            onFollowUp={(q) => sendQuestion(q)}
          />
        ))}

        {error && (
          <div className="mb-3 rounded-xl border border-[#E8A0A0] bg-[#FFF5F5] p-3 text-[14px] text-[#8A2020]">
            <p>{error}</p>
            <button
              type="button"
              className="mt-2 min-h-10 rounded-lg bg-white px-3 font-semibold"
              onClick={() => setError(null)}
            >
              닫기 / 다시 시도
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <SuggestedQuestions
        session={session}
        mode={mode}
        onSelectSession={setSession}
        onAsk={sendQuestion}
        onUpload={() => setUploaderOpen(true)}
        onSamples={showSamples}
      />

      <Composer
        accent={accent}
        disabled={busy || !profile}
        loadingLabel={loadLabel}
        onSend={sendQuestion}
        onUpload={() => setUploaderOpen(true)}
        onSamples={showSamples}
      />

      <footer className="bg-[#EFEAE3] px-3 py-1.5 text-center text-[10px] text-[#777]">
        교육부(2025) NCS 「입체 네일아트」 · 공통수학1 경우의 수 · 지도교사 박기연
      </footer>

      <GroupSelector
        open={showOnboard}
        initial={profile}
        onSave={persistProfile}
        onClose={profile ? () => setShowOnboard(false) : undefined}
      />

      {profile && (
        <DesignUploader
          open={uploaderOpen}
          profile={profile}
          accent={accent}
          onClose={() => setUploaderOpen(false)}
          onResult={(fb) => onFeedback(fb)}
        />
      )}

      <SourceSheet
        open={!!sourceOpen}
        label={sourceOpen?.label || ""}
        chunk={sourceOpen?.chunk}
        onClose={() => setSourceOpen(null)}
      />

      {historyOpen && (
        <HistorySheet
          onClose={() => setHistoryOpen(false)}
          accent={accent}
        />
      )}
    </div>
  );
}

function HistorySheet({
  onClose,
  accent,
}: {
  onClose: () => void;
  accent: string;
}) {
  const rows = loadHistory();

  function download(kind: "json" | "csv") {
    const content = kind === "json" ? exportHistoryJson() : exportHistoryCsv();
    const blob = new Blob([content], {
      type: kind === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nailapp-history.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">내 질문 기록</h3>
          <button type="button" onClick={onClose} className="min-h-10 min-w-10 rounded-lg bg-[#F0EBE3]">
            ✕
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => download("json")}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl text-sm font-bold text-white"
            style={{ background: accent }}
          >
            <Download size={16} /> 교사에게 제출 (JSON)
          </button>
          <button
            type="button"
            onClick={() => download("csv")}
            className="min-h-11 flex-1 rounded-xl bg-[#F0EBE3] text-sm font-bold"
          >
            CSV
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {rows.length === 0 && (
            <li className="text-[14px] text-[#666]">아직 기록이 없어요.</li>
          )}
          {[...rows].reverse().map((r, i) => (
            <li key={i} className="rounded-lg border border-[#EEE] p-2 text-[13px]">
              <p className="font-semibold">
                {r.group}조 · {r.name} · {r.mode}
              </p>
              <p className="text-[#333]">Q. {r.question}</p>
              <p className="text-[#666]">A. {r.answerSummary}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
