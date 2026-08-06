import { NAIL_CHUNKS } from "@/lib/knowledge/nail";
import { MATH_CHUNKS } from "@/lib/knowledge/math";
import { LESSON_CHUNKS } from "@/lib/knowledge/lesson";
import type { Domain, KnowledgeChunk } from "@/lib/types";

const BY_DOMAIN: Record<Domain, KnowledgeChunk[]> = {
  nail: NAIL_CHUNKS,
  math: MATH_CHUNKS,
  lesson: LESSON_CHUNKS as KnowledgeChunk[],
};

function scoreChunk(query: string, chunk: KnowledgeChunk): number {
  const q = query.toLowerCase();
  let score = 0;

  for (const kw of chunk.keywords) {
    if (q.includes(kw.toLowerCase())) score += 3;
  }
  if (chunk.title && q.includes(chunk.title.toLowerCase().slice(0, 4))) {
    score += 2;
  }
  // title partial
  for (const token of chunk.title.split(/[\s·—\-/,()]+/).filter((t) => t.length >= 2)) {
    if (q.includes(token.toLowerCase())) score += 2;
  }
  // body partial — sample meaningful tokens from keywords already counted;
  // also check a few body snippets
  const bodyLower = chunk.body.toLowerCase();
  const queryTokens = q.split(/\s+/).filter((t) => t.length >= 2);
  for (const t of queryTokens) {
    if (bodyLower.includes(t)) score += 1;
  }
  return score;
}

export function retrieve(
  query: string,
  domain: Domain,
  k = 3
): KnowledgeChunk[] {
  const pool = BY_DOMAIN[domain] ?? [];
  const scored = pool
    .map((chunk) => ({ chunk, score: scoreChunk(query, chunk) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.chunk);

  // 매칭 없으면 도메인 기본 청크 1개라도 (수업 안내용)
  if (scored.length === 0 && domain === "lesson") {
    return pool.slice(0, Math.min(k, pool.length));
  }
  return scored;
}

export function formatChunksForPrompt(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) {
    return "(매칭된 교재 청크 없음 — 교재에 해당 내용이 없으니 일반 지식으로 답하되 그 사실을 밝히세요.)";
  }
  return chunks
    .map((c) => {
      const tips = c.tips?.length ? `\n수행 tip: ${c.tips.join(" / ")}` : "";
      const safety = c.safety?.length
        ? `\n안전: ${c.safety.join(" / ")}`
        : "";
      const ex = c.nailExample ? `\n네일 예시: ${c.nailExample}` : "";
      return `[${c.id}] ${c.title}${c.page ? ` (${c.page})` : ""}\n${c.body}${tips}${safety}${ex}`;
    })
    .join("\n\n");
}

export function sourceBadges(chunks: KnowledgeChunk[]): string[] {
  return chunks.map((c) => {
    if (c.sourceLabel) return c.sourceLabel;
    if (c.page?.startsWith("p.")) {
      return `📖 NCS 입체 네일아트 ${c.page}`;
    }
    if (c.id.startsWith("m-")) return `📐 공통수학1 경우의 수 — ${c.title}`;
    if (c.id.startsWith("l-")) return `📋 ${c.title}`;
    return c.title;
  });
}
