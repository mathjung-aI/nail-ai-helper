import { calculateCounting } from "@/lib/counting";
import { mockChatReply } from "@/lib/mock/responses";
import {
  FRIENDLY_ERROR,
  chatModel,
  getOpenAI,
  isMockMode,
} from "@/lib/openai";
import {
  CALCULATE_COUNTING_TOOL,
  buildSystemPrompt,
} from "@/lib/prompts";
import { formatChunksForPrompt, retrieve, sourceBadges } from "@/lib/retrieve";
import type { ChatMode, CountingRequest, Profile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type IncomingMessage = { role: "user" | "assistant" | "system"; content: string };

function sseEncode(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function streamText(text: string, meta: unknown): Promise<Response> {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const chunkSize = 12;
      for (let i = 0; i < text.length; i += chunkSize) {
        const slice = text.slice(i, i + chunkSize);
        controller.enqueue(
          encoder.encode(sseEncode({ type: "token", content: slice }))
        );
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.enqueue(encoder.encode(sseEncode({ type: "meta", ...((meta as object) || {}) })));
      controller.enqueue(encoder.encode(sseEncode({ type: "done" })));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode = (body.mode as ChatMode) || "nail";
    const profile = body.profile as Profile;
    const messages = (body.messages as IncomingMessage[]) || [];

    if (!profile?.group) {
      return Response.json(
        { error: FRIENDLY_ERROR },
        { status: 400 }
      );
    }

    const lastUser =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";

    // MOCK
    if (isMockMode() || !getOpenAI()) {
      const mock = mockChatReply(mode, lastUser, profile);
      return streamText(mock.text, {
        sources: mock.sources,
        followUps: mock.followUps,
        counting: mock.counting,
      });
    }

    const openai = getOpenAI()!;
    const chunks = retrieve(lastUser, mode, 3);
    const system = buildSystemPrompt(
      mode,
      profile,
      formatChunksForPrompt(chunks)
    );
    const recent = messages.slice(-20); // ~10 turns

    const tools = mode === "math" ? [CALCULATE_COUNTING_TOOL] : undefined;

    let countingResult = null as ReturnType<typeof calculateCounting> | null;

    const baseMessages = [
      { role: "system" as const, content: system },
      ...recent.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    let completion = await openai.chat.completions.create({
      model: chatModel(),
      messages: baseMessages,
      tools,
      tool_choice: mode === "math" ? "auto" : undefined,
      max_tokens: 700,
      stream: false,
    });

    const first = completion.choices[0]?.message;
    if (first?.tool_calls?.length) {
      const toolMessages: {
        role: "tool";
        tool_call_id: string;
        content: string;
      }[] = [];

      for (const call of first.tool_calls) {
        if (
          call.type === "function" &&
          call.function.name === "calculate_counting"
        ) {
          let args: CountingRequest;
          try {
            args = JSON.parse(call.function.arguments) as CountingRequest;
          } catch {
            args = { steps: [], combine: "single" };
          }
          const result = calculateCounting(args);
          countingResult = result;
          toolMessages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        }
      }

      completion = await openai.chat.completions.create({
        model: chatModel(),
        messages: [
          ...baseMessages,
          first,
          ...toolMessages,
        ] as Parameters<typeof openai.chat.completions.create>[0]["messages"],
        max_tokens: 700,
        stream: false,
      });
    }

    // follow-ups: lightweight second ask or heuristic
    const text = completion.choices[0]?.message?.content || "";
    let followUps: string[] = [];
    try {
      const fu = await openai.chat.completions.create({
        model: chatModel(),
        messages: [
          {
            role: "system",
            content:
              '학생 후속 질문 후보 3개만 JSON으로: {"followUps":["...","...","..."]}. 한국어, 짧게.',
          },
          {
            role: "user",
            content: `질문: ${lastUser}\n답변: ${text.slice(0, 400)}`,
          },
        ],
        max_tokens: 200,
      });
      const raw = fu.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      if (Array.isArray(parsed.followUps)) followUps = parsed.followUps.slice(0, 3);
    } catch {
      followUps = [
        "조금 더 구체적으로 알려 주세요.",
        "안전 수칙도 같이 알려 주세요.",
        "활동지에 어떻게 적으면 좋을까요?",
      ];
    }

    const sources = sourceBadges(chunks);
    const counting =
      countingResult && countingResult.ok ? countingResult : null;

    return streamText(text, { sources, followUps, counting });
  } catch (e) {
    console.error(e);
    return Response.json({ error: FRIENDLY_ERROR }, { status: 500 });
  }
}
