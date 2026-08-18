"use client";

import { ArtistBackground } from "@/components/ArtistBackground";
import { Composer } from "@/components/Composer";
import { DesignUploader } from "@/components/DesignUploader";
import { MessageBubble, SourceSheet } from "@/components/MessageBubble";
import {
  BACKGROUND_MUTED,
  BACKGROUND_TEXT,
} from "@/lib/artist-background";
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
  DesignFeedback,
  DesignSpecCard,
  KnowledgeChunk,
  Profile,
} from "@/lib/types";
import { useEffect, useRef, useState } from "react";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
      mode: "assistant",
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
        mode: "assistant",
        createdAt: Date.now(),
      },
    ]);
    setBusy(true);
    setLoadLabel("답변을 준비하는 중…");

    try {
      const history = [...messages, userMsg]
        .filter((m) => m.content)
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "assistant",
          messages: history,
          profile,
        }),
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
        mode: "assistant",
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

  async function onFeedback(feedback: DesignFeedback, studentImage: File) {
    const feedbackMsgId = uid();
    setMessages((prev) => [
      ...prev,
      {
        id: feedbackMsgId,
        role: "assistant",
        content:
          "작품을 평가하고, 발전적인 피드백과 경우의 수 조언을 정리했어요. 이어서 수정 예시 이미지를 만들고 있어요.",
        feedback,
        createdAt: Date.now(),
        mode: "assistant",
      },
    ]);

    // 확인 없이 바로 수정 이미지 생성
    await generateImproveImage(feedbackMsgId, feedback, studentImage);
  }

  async function generateImproveImage(
    feedbackMsgId: string,
    feedback: DesignFeedback,
    studentImage: File
  ) {
    if (mockBadge) {
      setError(
        "지금 MOCK 모드라 수정 이미지를 만들 수 없어요. MOCK_MODE=false 와 API 키를 확인해 주세요."
      );
      return;
    }
    if (!canGenerateImages(1)) {
      setError(
        "이번 세션 AI 이미지 한도에 가까워요. 브라우저 탭을 새로고침한 뒤 다시 시도해 주세요."
      );
      return;
    }

    setBusy(true);
    setError(null);
    setLoadLabel("수정 예시 이미지를 만드는 중… (최대 1~2분)");

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 180_000);

      const fd = new FormData();
      fd.append("image", studentImage);
      fd.append("mode", "improve");
      fd.append("withImage", "true");
      fd.append("confirmed", "true");
      fd.append("group", String(profile.group));
      fd.append("artist", profile.artist || "");
      fd.append("overall", feedback.overall || "");
      fd.append(
        "improvements",
        JSON.stringify(feedback.improvements || [])
      );
      fd.append("strengths", JSON.stringify(feedback.strengths || []));

      const res = await fetch("/api/design-generate", {
        method: "POST",
        signal: controller.signal,
        body: fd,
      });
      clearTimeout(timer);

      const data = await res.json().catch(() => null);
      if (!data?.ok || !data.imageUrl) {
        throw new Error(
          data?.error ||
            "수정 예시 이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요."
        );
      }

      bumpImageGenCount(1);

      const editExplanation =
        (feedback.improvements || []).length > 0
          ? feedback.improvements
              .map((item, i) => `${i + 1}) ${item}`)
              .join("\n")
          : "색 균형·장식 위치·통일감을 조금씩 다듬은 예시입니다.";

      const card: DesignSpecCard = {
        id: `improve-${uid()}`,
        group: profile.group,
        name: "수정 예시 이미지",
        concept:
          "업로드한 작품을 바탕으로, 피드백 보완점을 반영해 부분 수정한 예시입니다.",
        base: getGroup(profile.group).baseColors[0],
        technique: getGroup(profile.group).techniques[0],
        motif: getGroup(profile.group).motifs[0],
        tipPlan:
          feedback.improvements.slice(0, 2).join(" · ") ||
          "피드백 보완점을 반영한 예시",
        countingBasis: feedback.mathAdvice?.example || "",
        makeSteps: feedback.improvements.slice(0, 4),
        cautions: feedback.safetyNotes || [],
        imageUrl: data.imageUrl as string,
        editExplanation,
      };

      setMessages((prev) =>
        prev.map((m) =>
          m.id === feedbackMsgId
            ? {
                ...m,
                content:
                  "1) 작품 평가  2) 발전 피드백·경우의 수 조언  3) 수정 예시 이미지와 수정 설명까지 준비했어요. 참고용이며 그대로 따라 할 필요는 없어요.",
                designs: [card],
              }
            : m
        )
      );
    } catch (err) {
      const aborted =
        err instanceof DOMException && err.name === "AbortError";
      const msg = aborted
        ? "이미지 생성 시간이 너무 길어요. 네트워크가 안정적일 때 다시 시도해 주세요."
        : err instanceof Error && err.message
          ? err.message
          : "수정 예시 이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.";
      setError(msg);
    } finally {
      setBusy(false);
      setLoadLabel(null);
    }
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
    <div
      className="relative isolate flex h-[100dvh] flex-col"
      style={{ color: BACKGROUND_TEXT }}
    >
      <ArtistBackground group={profile.group} />

      <header className="relative z-10 bg-[#2A2A2A]/95 px-3 py-3 text-white backdrop-blur-[8px]">
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
                {item.group}조 - {item.shortName}
              </button>
            );
          })}
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#E8E0D4] bg-white/85 p-5 shadow-sm backdrop-blur-[8px]">
            <p className="text-sm font-semibold" style={{ color: accent }}>
              {g.group}조 · {g.artist}
            </p>
            <p
              className="mt-2 text-[16px] leading-relaxed"
              style={{ color: BACKGROUND_TEXT }}
            >
              {g.intro}
            </p>
            <p
              className="mt-4 text-[15px] leading-relaxed"
              style={{ color: BACKGROUND_MUTED }}
            >
              조를 고른 뒤 작품을 올리면 <strong>평가</strong>,{" "}
              <strong>발전 피드백</strong>, <strong>수정 이미지</strong>,{" "}
              <strong>수정 설명</strong>을 바로 받을 수 있어요.
            </p>
            <p
              className="mt-2 text-[13px]"
              style={{ color: BACKGROUND_MUTED }}
            >
              네일 실습이나 경우의 수 질문이 있으면 아래 입력창으로도 물어볼 수
              있어요.
            </p>
            <button
              type="button"
              onClick={() => setUploaderOpen(true)}
              className="mt-5 min-h-12 w-full rounded-xl text-[15px] font-bold text-white"
              style={{ background: accent }}
            >
              작품 피드백 받기
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

      <Composer
        accent={accent}
        disabled={busy}
        loadingLabel={loadLabel}
        onSend={sendQuestion}
        onUpload={() => setUploaderOpen(true)}
      />

      <footer className="relative z-10 bg-[#EFEAE3]/90 px-3 py-1.5 text-center text-[10px] backdrop-blur-[8px]" style={{ color: BACKGROUND_MUTED }}>
        교육부(2025) NCS 「입체 네일아트」 · 공통수학1 경우의 수 · 지도교사 박기연
      </footer>

      <DesignUploader
        open={uploaderOpen}
        profile={profile}
        accent={accent}
        onClose={() => setUploaderOpen(false)}
        onResult={onFeedback}
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
