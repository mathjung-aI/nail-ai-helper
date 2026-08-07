import { getGroup } from "@/lib/knowledge/artists";
import { mockDesignSpec } from "@/lib/mock/responses";
import {
  FRIENDLY_ERROR,
  getOpenAI,
  imageModel,
  isMockMode,
  chatModel,
} from "@/lib/openai";
import { buildImagePrompt, buildImproveImagePrompt } from "@/lib/prompts";
import { toFile } from "openai";
import { NextResponse } from "next/server";

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

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) return null;
  try {
    return { mime: m[1], buffer: Buffer.from(m[2], "base64") };
  } catch {
    return null;
  }
}

function openaiErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "이미지 API 호출에 실패했어요.";
  const e = err as {
    message?: string;
    status?: number;
    error?: { message?: string; code?: string };
  };
  const msg = e.error?.message || e.message || "이미지 API 호출에 실패했어요.";
  if (e.status === 401 || e.status === 403) {
    return "OpenAI API 키 권한을 확인해 주세요. (이미지 모델 사용 가능 여부)";
  }
  if (e.status === 429) {
    return "이미지 생성 요청이 많아요. 잠시 후 다시 시도해 주세요.";
  }
  return msg.slice(0, 240);
}

function extractImageUrl(data: { b64_json?: string | null; url?: string | null } | undefined) {
  if (!data) return null;
  if (data.b64_json) {
    // jpeg 응답이면 jpeg로, 아니면 png로
    return `data:image/jpeg;base64,${data.b64_json}`;
  }
  if (data.url) return data.url;
  return null;
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

  try {
    const img = await openai.images.generate({
      model: imageModel(),
      prompt,
      size: "1024x1024",
      n: 1,
      quality: "medium",
      output_format: "jpeg",
    });
    return extractImageUrl(img.data?.[0]);
  } catch (err) {
    console.error("image generate failed", err);
  }
  return null;
}

async function improveFromStudentPhoto(opts: {
  mime: string;
  buffer: Buffer;
  artistMood: string;
  overall: string;
  improvements: string[];
  strengths: string[];
}): Promise<{ imageUrl: string | null; detail?: string }> {
  const openai = getOpenAI();
  if (!openai) {
    return {
      imageUrl: null,
      detail: "OPENAI_API_KEY와 MOCK_MODE=false 를 확인해 주세요.",
    };
  }

  const mime = opts.mime.includes("png")
    ? "image/png"
    : opts.mime.includes("webp")
      ? "image/webp"
      : "image/jpeg";
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";

  // 너무 큰 입력은 타임아웃·본문 한도에 걸리기 쉬움
  if (opts.buffer.length > 3.5 * 1024 * 1024) {
    return {
      imageUrl: null,
      detail: "이미지가 너무 커요. 4MB 이하로 다시 찍어 올려 주세요.",
    };
  }

  const prompt = buildImproveImagePrompt({
    artistMood: opts.artistMood,
    overall: opts.overall,
    improvements: opts.improvements,
    strengths: opts.strengths,
  });

  const craft =
    "Classroom handmade gel nail craft. Keep wearable student-made look. No hands, no text, no watermark.";

  let lastDetail = "";

  try {
    const studentFile = await toFile(opts.buffer, `student-work.${ext}`, {
      type: mime,
    });
    const edited = await openai.images.edit({
      model: imageModel(),
      image: studentFile,
      prompt: `${craft}\n\n${prompt}`,
      size: "1024x1024",
      // low + medium: Netlify 타임아웃을 줄이기 위함
      input_fidelity: "low",
      quality: "medium",
      output_format: "jpeg",
    });
    const url = extractImageUrl(edited.data?.[0]);
    if (url) return { imageUrl: url };
    lastDetail = "편집 결과에 이미지가 없어요.";
  } catch (err) {
    lastDetail = openaiErrorMessage(err);
    console.error("improve edit failed, falling back to generate", err);
  }

  try {
    const img = await openai.images.generate({
      model: imageModel(),
      prompt: `${craft}

${prompt}

Create one horizontal set of gel nail tips on clean white that shows the suggested improvements.`,
      size: "1024x1024",
      n: 1,
      quality: "medium",
      output_format: "jpeg",
    });
    const url = extractImageUrl(img.data?.[0]);
    if (url) return { imageUrl: url };
    lastDetail = lastDetail || "생성 결과에 이미지가 없어요.";
  } catch (err) {
    lastDetail = openaiErrorMessage(err);
    console.error("improve generate fallback failed", err);
  }

  return { imageUrl: null, detail: lastDetail };
}

async function readImprovePayload(req: Request): Promise<{
  group: number;
  artist?: string;
  confirmed: boolean;
  withImage: boolean;
  overall: string;
  improvements: string[];
  strengths: string[];
  mime: string;
  buffer: Buffer;
} | { error: string; status: number }> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return { error: "학생 작품 이미지가 필요해요.", status: 400 };
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const improvementsRaw = String(form.get("improvements") || "[]");
    const strengthsRaw = String(form.get("strengths") || "[]");
    let improvements: string[] = [];
    let strengths: string[] = [];
    try {
      improvements = JSON.parse(improvementsRaw);
    } catch {
      improvements = [];
    }
    try {
      strengths = JSON.parse(strengthsRaw);
    } catch {
      strengths = [];
    }
    return {
      group: Number(form.get("group") || 1),
      artist: String(form.get("artist") || "") || undefined,
      confirmed: String(form.get("confirmed")) === "true",
      withImage: String(form.get("withImage")) === "true",
      overall: String(form.get("overall") || ""),
      improvements: improvements.map(String),
      strengths: strengths.map(String),
      mime: file.type || "image/jpeg",
      buffer: buf,
    };
  }

  const body = await req.json();
  let mime = "image/jpeg";
  let buffer: Buffer | null = null;

  if (typeof body.studentImageDataUrl === "string") {
    const parsed = parseDataUrl(body.studentImageDataUrl);
    if (parsed) {
      mime = parsed.mime;
      buffer = parsed.buffer;
    }
  }

  if (!buffer) {
    return { error: "학생 작품 이미지가 필요해요.", status: 400 };
  }

  return {
    group: Number(body.group || body.profile?.group || 1),
    artist: body.artist,
    confirmed: Boolean(body.confirmed),
    withImage: Boolean(body.withImage),
    overall: String(body.overall || ""),
    improvements: Array.isArray(body.improvements)
      ? body.improvements.map(String)
      : [],
    strengths: Array.isArray(body.strengths) ? body.strengths.map(String) : [],
    mime,
    buffer,
  };
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // FormData면 improve 전용으로 처리
    if (contentType.includes("multipart/form-data")) {
      const payload = await readImprovePayload(req);
      if ("error" in payload) {
        return NextResponse.json(
          { ok: false, error: payload.error },
          { status: payload.status }
        );
      }
      if (!payload.confirmed || !payload.withImage) {
        return NextResponse.json(
          { ok: false, error: "이미지 생성은 확인 후에만 진행해요." },
          { status: 400 }
        );
      }
      if (isMockMode() || !getOpenAI()) {
        return NextResponse.json({
          ok: false,
          error:
            "AI 이미지 생성을 쓸 수 없어요. OPENAI_API_KEY와 MOCK_MODE=false 를 확인해 주세요.",
        });
      }

      const g = getGroup(payload.group);
      const result = await improveFromStudentPhoto({
        mime: payload.mime,
        buffer: payload.buffer,
        artistMood: g.mood,
        overall: payload.overall,
        improvements: payload.improvements,
        strengths: payload.strengths,
      });

      if (!result.imageUrl) {
        return NextResponse.json({
          ok: false,
          error:
            result.detail ||
            "개선 예시 이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
        });
      }

      return NextResponse.json({
        ok: true,
        imageUrl: result.imageUrl,
        mode: "improve",
      });
    }

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
    const mode = String(body.mode || "");

    if (mode === "improve") {
      if (!body.confirmed || !withImage) {
        return NextResponse.json(
          { ok: false, error: "이미지 생성은 확인 후에만 진행해요." },
          { status: 400 }
        );
      }
      if (isMockMode() || !getOpenAI()) {
        return NextResponse.json({
          ok: false,
          error:
            "AI 이미지 생성을 쓸 수 없어요. OPENAI_API_KEY와 MOCK_MODE=false 를 확인해 주세요.",
        });
      }

      const parsed =
        typeof body.studentImageDataUrl === "string"
          ? parseDataUrl(body.studentImageDataUrl)
          : null;
      if (!parsed) {
        return NextResponse.json(
          { ok: false, error: "학생 작품 이미지가 필요해요." },
          { status: 400 }
        );
      }

      const result = await improveFromStudentPhoto({
        mime: parsed.mime,
        buffer: parsed.buffer,
        artistMood: g.mood,
        overall: String(body.overall || ""),
        improvements: Array.isArray(body.improvements)
          ? body.improvements.map(String)
          : [],
        strengths: Array.isArray(body.strengths)
          ? body.strengths.map(String)
          : [],
      });

      if (!result.imageUrl) {
        return NextResponse.json({
          ok: false,
          error:
            result.detail ||
            "개선 예시 이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
        });
      }

      return NextResponse.json({
        ok: true,
        imageUrl: result.imageUrl,
        mode: "improve",
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
