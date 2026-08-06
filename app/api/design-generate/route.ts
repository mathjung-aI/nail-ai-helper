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
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

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
    const count = Math.min(3, Math.max(1, Number(body.count || 1))) as 1 | 2 | 3;
    const withImage = Boolean(body.withImage);
    const samplesOnly = Boolean(body.samplesOnly);

    if (samplesOnly) {
      return NextResponse.json({
        samples: getSamplesForGroup(group),
      });
    }

    const spec = mockDesignSpec({
      artist,
      baseColor,
      technique,
      motif,
      freeText,
    });

    // Enhance spec with chat model when not mock
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
          const letter = String.fromCharCode(97 + i); // a,b,c
          images.push(`/samples/${group}-${letter}.svg`);
        }
      } else {
        const openai = getOpenAI()!;
        const prompt = buildImagePrompt({
          n: 5,
          baseColor,
          motif,
          technique,
          artistMood: g.mood, // 작가명 없음
        });
        for (let i = 0; i < count; i++) {
          const img = await openai.images.generate({
            model: imageModel(),
            prompt,
            size: "1024x1024",
            n: 1,
          });
          const b64 = img.data?.[0]?.b64_json;
          const url = img.data?.[0]?.url;
          if (b64) images.push(`data:image/png;base64,${b64}`);
          else if (url) images.push(url);
        }
      }
    }

    return NextResponse.json({ ok: true, spec, images });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: FRIENDLY_ERROR }, { status: 500 });
  }
}
