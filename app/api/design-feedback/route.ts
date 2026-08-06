import { mockDesignFeedback } from "@/lib/mock/responses";
import {
  FRIENDLY_ERROR,
  getOpenAI,
  isMockMode,
  visionModel,
} from "@/lib/openai";
import { designFeedbackPrompt } from "@/lib/prompts";
import type { DesignFeedback, Profile } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;

function parseFeedback(raw: string): DesignFeedback | null {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleaned) as DesignFeedback;
    if (!data.checkQuestions || data.checkQuestions.length < 3) {
      data.checkQuestions = [
        ...(data.checkQuestions || []),
        "이 두께로 경화와 착용감이 괜찮을까요?",
        "장식 위치가 팁 끝에 몰려 있지 않나요?",
        "10팁 전체에서 화가의 분위기가 읽히나요?",
      ].slice(0, 3);
    }
    return data;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    const note = String(form.get("note") || "");
    const profileRaw = String(form.get("profile") || "{}");
    let profile: Profile;
    try {
      profile = JSON.parse(profileRaw) as Profile;
    } catch {
      profile = { group: 1, artist: "빈센트 반 고흐" };
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "이미지 파일이 필요해요." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "이미지는 4MB 이하로 올려 주세요." },
        { status: 400 }
      );
    }

    if (isMockMode() || !getOpenAI()) {
      return NextResponse.json({
        ok: true,
        feedback: mockDesignFeedback(profile.artist),
      });
    }

    const openai = getOpenAI()!;
    const buf = Buffer.from(await file.arrayBuffer());
    const b64 = buf.toString("base64");
    const mime = file.type || "image/jpeg";

    const completion = await openai.chat.completions.create({
      model: visionModel(),
      messages: [
        { role: "system", content: designFeedbackPrompt(profile.artist) },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: note
                ? `학생 메모: ${note}`
                : "이 네일 팁 사진을 루브릭으로 봐 주세요.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${b64}` },
            },
          ],
        },
      ],
      max_tokens: 900,
    });

    const raw = completion.choices[0]?.message?.content || "";
    const feedback = parseFeedback(raw);
    if (!feedback) {
      return NextResponse.json({
        ok: true,
        feedback: {
          overall: raw.slice(0, 500) || FRIENDLY_ERROR,
          rubric: [],
          strengths: [],
          improvements: [],
          checkQuestions: [
            "제작 가능성은 어떤가요?",
            "두께는 적당한가요?",
            "10팁 통일감은 어떤가요?",
          ],
          safetyNotes: [],
        } satisfies DesignFeedback,
        rawFallback: true,
      });
    }

    return NextResponse.json({ ok: true, feedback });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: FRIENDLY_ERROR }, { status: 500 });
  }
}
