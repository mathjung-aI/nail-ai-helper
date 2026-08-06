import { describe, expect, it } from "vitest";
import { retrieve } from "@/lib/retrieve";

describe("retrieve", () => {
  it("finds top gel / finish chunks for nail", () => {
    const chunks = retrieve("톱 젤은 언제 바르나요?", "nail", 3);
    expect(chunks.length).toBeGreaterThan(0);
    expect(
      chunks.some(
        (c) =>
          c.body.includes("톱 젤") ||
          c.keywords.some((k) => k.includes("톱"))
      )
    ).toBe(true);
  });

  it("finds combination math chunk", () => {
    const chunks = retrieve("8C5 조합 고르기", "math", 3);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("finds lesson session info", () => {
    const chunks = retrieve("2차시 활동지 기준", "lesson", 3);
    expect(chunks.length).toBeGreaterThan(0);
  });
});
