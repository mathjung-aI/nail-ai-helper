import {
  buildVariedSamples,
  getGroup,
  getSamplesForGroup,
} from "@/lib/knowledge/artists";
import { mockDesignSpec } from "@/lib/mock/responses";
import {
  FRIENDLY_ERROR,
  getOpenAI,
  imageModel,
  isMockMode,
  chatModel,
} from "@/lib/openai";
import { buildImagePrompt } from "@/lib/prompts";
import { resolveStyleRefPaths } from "@/lib/style-refs";
import type { DesignSpecCard } from "@/lib/types";
import fs from "fs";
import { toFile } from "openai";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 120;

const VARIATION_POOL = [
  "soft pastel wash with sparse accents",
  "higher contrast accents on outer tips",
  "fine-line dominant with tiny pearl dots",
  "thicker emboss only on signature tips",
  "cooler undertone shift",
  "warmer undertone shift",
  "more negative space / breathing room",
  "denser motif clustering near cuticle",
  "motifs drifting toward free edge lightly",
  "matte-gloss mix within one collection",
];

function randomVariation(extra?: string): string {
  const a = VARIATION_POOL[Math.floor(Math.random() * VARIATION_POOL.length)];
  const b = VARIATION_POOL[Math.floor(Math.random() * VARIATION_POOL.length)];
  const seed = Math.random().toString(36).slice(2, 8);
  return [extra, a, b, `unique seed ${seed}`].filter(Boolean).join("; ");
}

async function generateNailImage(opts: {
  group: number;
  baseColor: string;
  motif: string;
  technique: string;
  artistMood: string;
  variation?: string;
}): Promise<string | null> {
  const openai = getOpenAI();
  if (!openai) return null;

  const variation = opts.variation || randomVariation();
  const prompt = buildImagePrompt({
    n: 5,
    baseColor: opts.baseColor,
    motif: opts.motif,
    technique: opts.technique,
    artistMood: opts.artistMood,
    variation,
  });

  // 참고 이미지는 '스타일만' 참고 — 결과로 그대로 보여주지 않음
  const refPaths = resolveStyleRefPaths(opts.group).slice(0, 1);

  if (refPaths.length > 0) {
    try {
      const files = await Promise.all(
        refPaths.map((p) =>
          toFile(fs.createReadStream(p), path.basename(p), {
            type: "image/png",
          })
        )
      );

      const edited = await openai.images.edit({
        model: imageModel(),
        image: files,
        prompt: `${prompt}

The attached image is ONLY a craft-style reference (gel texture, tip shape, handmade look).
Invent a completely different layout and motif arrangement. Never reproduce the reference tips.`,
        size: "1024x1024",
        input_fidelity: "low",
      });

      const b64 = edited.data?.[0]?.b64_json;
      const url = edited.data?.[0]?.url;
      if (b64) return `data:image/png;base64,${b64}`;
      if (url) return url;
    } catch (err) {
      console.error("style-ref edit failed, falling back to generate", err);
    }
  }

  try {
    const img = await openai.images.generate({
      model: imageModel(),
      prompt,
      size: "1024x1024",
      n: 1,
    });
    const b64 = img.data?.[0]?.b64_json;
    const url = img.data?.[0]?.url;
    if (b64) return `data:image/png;base64,${b64}`;
    if (url) return url;
  } catch (err) {
    console.error("image generate failed", err);
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const group = Number(body.group || body.profile?.group || 1);
    const g = getGroup(group);
    const artist = body.artist || g.artist;
    const baseColor = body.baseColor || g.baseColors[0];
    const technique = body.technique || g.techniques[0];
    const motif = body.motif || g.motifs[0];
    const freeText = body.freeText || "";
    const count = Math.min(3, Math.max(1, Number(body.count || 1))) as
      | 1
      | 2
      | 3;
    const withImage = Boolean(body.withImage);
    const samplesOnly = Boolean(body.samplesOnly);

    if (samplesOnly) {
      const useAi = withImage && !isMockMode() && !!getOpenAI();
      // 매번 다른 텍스트 명세 3안
      let samples: DesignSpecCard[] = buildVariedSamples(group);

      if (!useAi) {
        return NextResponse.json({
          ok: false,
          error:
            "AI 이미지 생성을 쓸 수 없어요. OPENAI_API_KEY와 MOCK_MODE=false 를 확인해 주세요.",
          samples: getSamplesForGroup(group),
          generatedWithAi: false,
        });
      }

      // 3안을 병렬 생성 — 참고 스타일만 반영, 결과는 매번 다름
      const results = await Promise.all(
        samples.map(async (s, i) => {
          const imageUrl = await generateNailImage({
            group,
            baseColor: s.base,
            motif: s.motif,
            technique: s.technique,
            artistMood: g.mood,
            variation: randomVariation(s.tipPlan),
          });
          return { i, imageUrl };
        })
      );

      let generated = 0;
      for (const r of results) {
        if (r.imageUrl) {
          samples[r.i] = { ...samples[r.i], imageUrl: r.imageUrl };
          generated += 1;
        }
      }

      if (generated === 0) {
        return NextResponse.json({
          ok: false,
          error:
            "샘플 이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
          samples,
          generatedWithAi: false,
        });
      }

      // 이미지 없는 안은 목록에서 제외하지 않고, 텍스트만이라도 유지
      return NextResponse.json({
        ok: true,
        samples,
        generatedWithAi: true,
        generatedCount: generated,
      });
    }

    const spec = mockDesignSpec({
      artist,
      baseColor,
      technique,
      motif,
      freeText,
    });

    if (!isMockMode() && getOpenAI()) {
      try {
        const openai = getOpenAI()!;
        const completion = await openai.chat.completions.create({
          model: chatModel(),
          messages: [
            {
              role: "system",
              content:
                "네일 10팁 컬렉션 디자인 명세를 JSON으로만 작성. 키: concept, tipPlan, tipElements, materials, makeSteps, countingBasis, cautions. 한국어. 정답 단정 금지. 저작권: 작품 재현 금지. 학생 실습 스타일(쪼물젤·진주파츠·세필·핸드페인팅)을 전제로 작성.",
            },
            {
              role: "user",
              content: `화가분위기(형용사): ${g.mood}\n베이스:${baseColor}\n기법:${technique}\n모티브:${motif}\n메모:${freeText}\n변주:${randomVariation()}`,
            },
          ],
          max_tokens: 700,
        });
        const raw = completion.choices[0]?.message?.content || "";
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        Object.assign(spec, parsed);
      } catch {
        // keep mock spec
      }
    }

    const images: string[] = [];
    if (withImage && !isMockMode() && getOpenAI()) {
      const jobs = Array.from({ length: count }, (_, i) =>
        generateNailImage({
          group,
          baseColor,
          motif,
          technique,
          artistMood: g.mood,
          variation: randomVariation(`option ${i + 1}`),
        })
      );
      const outs = await Promise.all(jobs);
      for (const u of outs) {
        if (u) images.push(u);
      }
    }

    return NextResponse.json({ ok: true, spec, images });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: FRIENDLY_ERROR },
      { status: 500 }
    );
  }
}
