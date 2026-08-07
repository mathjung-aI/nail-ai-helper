import { getGroup, getSamplesForGroup } from "@/lib/knowledge/artists";
import { mockDesignSpec } from "@/lib/mock/responses";
import {
  FRIENDLY_ERROR,
  getOpenAI,
  imageModel,
  isMockMode,
  chatModel,
} from "@/lib/openai";
import { buildImagePrompt } from "@/lib/prompts";
import {
  resolveStyleRefPaths,
  styleRefPublicUrls,
} from "@/lib/style-refs";
import type { DesignSpecCard } from "@/lib/types";
import fs from "fs";
import { toFile } from "openai";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

const AI_TIMEOUT_MS = 40_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch(() => {
        clearTimeout(t);
        resolve(null);
      });
  });
}

async function generateNailImage(opts: {
  group: number;
  baseColor: string;
  motif: string;
  technique: string;
  artistMood: string;
}): Promise<string | null> {
  const openai = getOpenAI();
  if (!openai) return null;

  const prompt = buildImagePrompt({
    n: 5,
    baseColor: opts.baseColor,
    motif: opts.motif,
    technique: opts.technique,
    artistMood: opts.artistMood,
  });

  // 참고 이미지는 조별 1장만 사용 (속도·안정성)
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

Use the attached student nail-art sample ONLY as craft-style reference (tip shape, gel emboss, pearls/brush texture, white-background tip row). Create a NEW original design. Do not copy tips from the reference.`,
        size: "1024x1024",
        input_fidelity: "low",
      });

      const b64 = edited.data?.[0]?.b64_json;
      const url = edited.data?.[0]?.url;
      if (b64) return `data:image/png;base64,${b64}`;
      if (url) return url;
    } catch (err) {
      console.error("style-ref image edit failed, falling back to generate", err);
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

function attachFallbackImages(
  samples: DesignSpecCard[],
  group: number
): DesignSpecCard[] {
  const urls = styleRefPublicUrls(group);
  return samples.map((s, i) => ({
    ...s,
    // AI 결과가 있어도 너무 크면 클라이언트 파싱 실패할 수 있어,
    // data URL은 유지하되 없는 칸만 참고 이미지로 채움
    imageUrl: s.imageUrl || urls[i % urls.length],
  }));
}

export async function POST(req: Request) {
  let groupForFallback = 1;
  let samplesOnlyFallback = false;
  try {
    const body = await req.json();
    const group = Number(body.group || body.profile?.group || 1);
    groupForFallback = group;
    samplesOnlyFallback = Boolean(body.samplesOnly);
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
    // 명시적으로 false면 AI 생략 (빠른 샘플 카드)
    const wantAi = withImage !== false;

    if (samplesOnly) {
      let samples: DesignSpecCard[] = getSamplesForGroup(group);
      let generatedWithAi = false;
      const useAi = wantAi && !isMockMode() && !!getOpenAI();

      if (useAi && samples.length > 0) {
        // 타임아웃 방지를 위해 첫 안 1장만 AI 생성 시도
        const s = samples[0];
        const imageUrl = await withTimeout(
          generateNailImage({
            group,
            baseColor: s.base,
            motif: s.motif,
            technique: s.technique,
            artistMood: g.mood,
          }),
          AI_TIMEOUT_MS
        );
        if (imageUrl) {
          samples[0] = { ...s, imageUrl };
          generatedWithAi = true;
        }
      }

      samples = attachFallbackImages(samples, group);

      return NextResponse.json({
        ok: true,
        samples,
        generatedWithAi,
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
              content: `화가분위기(형용사): ${g.mood}\n베이스:${baseColor}\n기법:${technique}\n모티브:${motif}\n메모:${freeText}`,
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
    if (withImage) {
      if (isMockMode() || !getOpenAI()) {
        images.push(...styleRefPublicUrls(group).slice(0, count));
      } else {
        const imageUrl = await withTimeout(
          generateNailImage({
            group,
            baseColor,
            motif,
            technique,
            artistMood: g.mood,
          }),
          AI_TIMEOUT_MS
        );
        if (imageUrl) images.push(imageUrl);
        while (images.length < count) {
          const urls = styleRefPublicUrls(group);
          images.push(urls[images.length % urls.length]);
        }
      }
    }

    return NextResponse.json({ ok: true, spec, images });
  } catch (e) {
    console.error(e);
    if (samplesOnlyFallback) {
      return NextResponse.json({
        ok: true,
        samples: attachFallbackImages(
          getSamplesForGroup(groupForFallback),
          groupForFallback
        ),
        generatedWithAi: false,
      });
    }
    return NextResponse.json(
      { ok: false, error: FRIENDLY_ERROR },
      { status: 500 }
    );
  }
}
