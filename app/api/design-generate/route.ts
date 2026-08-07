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
import type { DesignSpecCard } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

async function generateNailImage(opts: {
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

    // 조별 샘플 3안 + (키 사용 시) AI 이미지 생성
    if (samplesOnly) {
      const samples: DesignSpecCard[] = getSamplesForGroup(group);
      const useAi = withImage && !isMockMode() && !!getOpenAI();

      if (useAi) {
        for (let i = 0; i < samples.length; i++) {
          const s = samples[i];
          try {
            const imageUrl = await generateNailImage({
              baseColor: s.base,
              motif: s.motif,
              technique: s.technique,
              artistMood: g.mood,
            });
            if (imageUrl) samples[i] = { ...s, imageUrl };
          } catch (err) {
            console.error(`sample image ${s.id} failed`, err);
            // 실패 시 SVG 폴백 유지
          }
        }
      }

      return NextResponse.json({
        ok: true,
        samples,
        generatedWithAi: useAi,
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
                "네일 10팁 컬렉션 디자인 명세를 JSON으로만 작성. 키: concept, tipPlan, tipElements, materials, makeSteps, countingBasis, cautions. 한국어. 정답 단정 금지. 저작권: 작품 재현 금지.",
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
        for (let i = 0; i < count; i++) {
          const letter = String.fromCharCode(97 + i);
          images.push(`/samples/${group}-${letter}.svg`);
        }
      } else {
        for (let i = 0; i < count; i++) {
          try {
            const imageUrl = await generateNailImage({
              baseColor,
              motif,
              technique,
              artistMood: g.mood,
            });
            if (imageUrl) images.push(imageUrl);
          } catch (err) {
            console.error("image generate failed", err);
          }
        }
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
