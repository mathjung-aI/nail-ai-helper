import OpenAI from "openai";

export function isMockMode(): boolean {
  return process.env.MOCK_MODE === "true" || isDummyKey();
}

export function isDummyKey(): boolean {
  const key = process.env.OPENAI_API_KEY ?? "";
  return (
    key.startsWith("sk-proj-DUMMY") ||
    key.startsWith("sk-proj-YbkA8Ocn") || // PRD 가상 키
    key.includes("DUMMY")
  );
}

let warned = false;

export function getOpenAI(): OpenAI | null {
  if (isMockMode()) {
    if (!warned && typeof window === "undefined") {
      console.warn("⚠️ 가상 키 사용 중 — MOCK_MODE로 동작합니다.");
      warned = true;
    }
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ OPENAI_API_KEY 없음 — MOCK_MODE로 동작합니다.");
    return null;
  }

  if (isDummyKey() && !warned) {
    console.warn("⚠️ 가상 키 사용 중 — MOCK_MODE로 동작합니다.");
    warned = true;
  }

  return new OpenAI({ apiKey });
}

export function chatModel(): string {
  return process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";
}

export function visionModel(): string {
  return process.env.OPENAI_VISION_MODEL || "gpt-4.1";
}

export function imageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
}

export const FRIENDLY_ERROR =
  "지금은 답변을 가져오지 못했어요. 잠시 후 다시 시도하거나 선생님께 알려 주세요.";
