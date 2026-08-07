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
export const maxDuration = 120;

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

  const refPaths = resolveStyleRefPaths(opts.group);

  // 학생 샘플 스타일 참고 이미지와 함께 생성 (images.edit)
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

Use the attached student nail-art samples ONLY as craft-style / technique / presentation references (tip shape, gel emboss, pearls, brush texture, white-background tip row). Create a NEW original design for the palette and motif above. Do not copy any tip from the references.`,
        size: "1024x1024",
        // input_fidelity: gpt-image-1 계열에서 참고 이미지 디테일 유지
        input_fidelity: "high" as "high",
      });

      const b64 = edited.data?.[0]?.b64_json;
      const url = edited.data?.[0]?.url;
      if (b64) return `data:image/png;base64,${b64}`;
      if (url) return url;
    } catch (err) {
      console.error("style-ref image edit failed, falling back to generate", err);
    }
  }

  // 폴백: 텍스트 프롬프트만으로 생성
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

function attachFallbackImages(
  samples: DesignSpecCard[],
  group: number
): DesignSpecCard[] {
  const urls = styleRefPublicUrls(group);
  return samples.map((s, i) => ({
    ...s,
    imageUrl: s.imageUrl || urls[i % urls.length],
  }));
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
      let samples: DesignSpecCard[] = getSamplesForGroup(group);
      const useAi = withImage && !isMockMode() && !!getOpenAI();

      if (useAi) {
        for (let i = 0; i < samples.length; i++) {
          const s = samples[i];
          try {
            const imageUrl = await generateNailImage({
              group,
              baseColor: s.base,
              motif: s.motif,
              technique: s.technique,
              artistMood: g.mood,
            });
            if (imageUrl) samples[i] = { ...s, imageUrl };
          } catch (err) {
            console.error(`sample image ${s.id} failed`, err);
          }
        }
      }

      // AI 실패·MOCK 시 학생 참고 스타일 이미지로 폴백
      samples = attachFallbackImages(samples, group);

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
        for (let i = 0; i < count; i++) {
          try {
            const imageUrl = await generateNailImage({
              group,
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
        if (images.length === 0) {
          images.push(...styleRefPublicUrls(group).slice(0, count));
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
