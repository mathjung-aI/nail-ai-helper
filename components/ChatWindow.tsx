"use client";

import { Composer } from "@/components/Composer";
import { DesignUploader } from "@/components/DesignUploader";
import { MessageBubble, SourceSheet } from "@/components/MessageBubble";
import { ModeTabs } from "@/components/ModeTabs";
import { SuggestedQuestions } from "@/components/SuggestedQuestions";
import { getGroup, GROUPS } from "@/lib/knowledge/artists";
import { LESSON_CHUNKS } from "@/lib/knowledge/lesson";
import { MATH_CHUNKS } from "@/lib/knowledge/math";
import { NAIL_CHUNKS } from "@/lib/knowledge/nail";
import {
  appendHistory,
  bumpImageGenCount,
  canGenerateImages,
  loadProfile,
  saveProfile,
} from "@/lib/storage";
import type {
  ChatMessage,
  ChatMode,
  DesignFeedback,
  DesignSpecCard,
  KnowledgeChunk,
  Profile,
} from "@/lib/types";
import { useEffect, useRef, useState } from "react";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadingFor(mode: ChatMode) {
  if (mode === "math") return "조합 수를 계산하는 중…";
  return "교재를 찾아보는 중…";
}

function defaultProfile(group = 1): Profile {
  const g = getGroup(group);
  return {
    group: g.group,
    artist: g.artist,
    name: "익명",
    accentHex: g.accentHex,
  };
}

export function ChatWindow({ mockBadge }: { mockBadge: boolean }) {
  const [profile, setProfile] = useState<Profile>(defaultProfile(1));
  const [mode, setMode] = useState<ChatMode>("nail");
  const [session, setSession] = useState<1 | 2 | 3>(2);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadLabel, setLoadLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState<{
    label: string;
    chunk?: KnowledgeChunk | null;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const accent = profile.accentHex || getGroup(profile.group).accentHex;

  useEffect(() => {
    const saved = loadProfile();
    if (saved?.group) {
      setProfile(defaultProfile(saved.group));
    } else {
      const p = defaultProfile(1);
      saveProfile(p);
      setProfile(p);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function changeGroup(group: number) {
    if (group === profile.group) return;
    const p = defaultProfile(group);
    saveProfile(p);
    setProfile(p);
    setMessages([]);
    setError(null);
  }

  async function sendQuestion(text: string) {
    if (busy) return;
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
    if (busy) return;
    setBusy(true);
    setError(null);
    setLoadLabel(
      mockBadge
        ? "MOCK 모드에서는 AI 샘플을 만들 수 없어요. MOCK_MODE=false 로 바꿔 주세요."
        : "AI가 샘플 3안을 새로 그리는 중… (1~2분 걸릴 수 있어요)"
    );

    try {
      // 캐시 사용 안 함 — 요청마다 다른 디자인
      if (mockBadge) {
        setError(
          "지금 MOCK 모드라 AI 이미지를 만들 수 없어요. .env.local 또는 Netlify에서 MOCK_MODE=false 와 API 키를 확인해 주세요."
        );
        return;
      }

      if (!canGenerateImages(3)) {
        setError(
          "이번 세션 AI 이미지 한도에 가까워요. 브라우저 탭을 새로고침한 뒤 다시 시도해 주세요."
        );
        return;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 150_000);

      const res = await fetch("/api/design-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          samplesOnly: true,
          withImage: true,
          group: profile.group,
          artist: profile.artist,
        }),
      });
      clearTimeout(timer);

      const data = await res.json().catch(() => null);
      if (!data?.ok || !Array.isArray(data.samples) || !data.samples.length) {
        throw new Error(data?.error || "fail");
      }

      const samples = data.samples as DesignSpecCard[];
      const hasAiImage = samples.some(
        (s) => s.imageUrl && !s.imageUrl.includes("/references/")
      );
      if (!hasAiImage) {
        throw new Error("no-ai-image");
      }

      bumpImageGenCount(samples.filter((s) => s.imageUrl).length);

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: generatedWithAi
            ? `${profile.group}조 · ${profile.artist} 화풍을 유지한 채, 샘플1 디자인 요소 + 학생 시안(샘플2·3)을 참고해 AI가 새로 그린 샘플이에요. 요청마다 변주됩니다. 예시이니 조 분석 요소로 바꿔 보세요.`
            : `${profile.group}조 · ${profile.artist} 샘플을 만들지 못했어요.`,
          designs: samples,
          createdAt: Date.now(),
          mode,
        },
      ]);
    } catch {
      setError(
        "샘플 디자인을 만들지 못했어요. 네트워크·API 키·MOCK_MODE를 확인한 뒤 다시 시도해 주세요."
      );
    } finally {
      setBusy(false);
      setLoadLabel(null);
    }
  }

  function onFeedback(feedback: DesignFeedback) {
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        content:
          "업로드한 디자인을 루브릭으로 살펴봤어요. 정답은 없으니 점검 질문으로 조에서 다듬어 보세요.",
        feedback,
        createdAt: Date.now(),
        mode: "nail",
      },
    ]);
  }

  function findChunk(label: string): KnowledgeChunk | null {
    const all = [
      ...NAIL_CHUNKS,
      ...MATH_CHUNKS,
      ...(LESSON_CHUNKS as KnowledgeChunk[]),
    ];
    return (
      all.find(
        (c) =>
          c.sourceLabel === label ||
          label.includes(c.page || "___") ||
          label.includes(c.title)
      ) || null
    );
  }

  const g = getGroup(profile.group);

  return (
    <div className="flex h-[100dvh] flex-col bg-[#F7F3EC]">
      <header className="bg-[#2A2A2A] px-3 py-3 text-white">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base font-bold sm:text-lg">
            🎨 네일아트 AI 학습 도우미
          </h1>
          {mockBadge && (
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
              MOCK 모드
            </span>
          )}
        </div>
        <div
          className="mt-3 flex flex-wrap gap-1.5"
          role="group"
          aria-label="조 선택"
        >
          {GROUPS.map((item) => {
            const active = profile.group === item.group;
            return (
              <button
                key={item.group}
                type="button"
                onClick={() => changeGroup(item.group)}
                className="min-h-11 flex-1 basis-[calc(50%-0.25rem)] rounded-xl px-2 text-[12px] font-bold leading-tight transition sm:basis-0 sm:text-[13px]"
                style={
                  active
                    ? { background: item.accentHex, color: "#fff" }
                    : { background: "rgba(255,255,255,0.12)", color: "#fff" }
                }
                aria-pressed={active}
              >
                {item.group}조 - {item.artist}
              </button>
            );
          })}
        </div>
      </header>

      <ModeTabs mode={mode} onChange={setMode} accent={accent} />

      <main className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#E8E0D4] bg-white/80 p-5">
            <p className="text-sm font-semibold" style={{ color: accent }}>
              {g.group}조 · {g.artist}
            </p>
            <p className="mt-2 text-[16px] leading-relaxed text-[#333]">
              {g.intro}
            </p>
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
        disabled={busy}
        loadingLabel={loadLabel}
        onSend={sendQuestion}
        onUpload={() => setUploaderOpen(true)}
        onSamples={showSamples}
      />

      <footer className="bg-[#EFEAE3] px-3 py-1.5 text-center text-[10px] text-[#777]">
        교육부(2025) NCS 「입체 네일아트」 · 공통수학1 경우의 수 · 지도교사 박기연
      </footer>

      <DesignUploader
        open={uploaderOpen}
        profile={profile}
        accent={accent}
        onClose={() => setUploaderOpen(false)}
        onResult={(fb) => onFeedback(fb)}
      />

      <SourceSheet
        open={!!sourceOpen}
        label={sourceOpen?.label || ""}
        chunk={sourceOpen?.chunk}
        onClose={() => setSourceOpen(null)}
      />
    </div>
  );
}
