import fs from "fs";
import path from "path";

/**
 * 학생·수업 스타일 참고 이미지 (결과로 그대로 보여주지 않음)
 * - sample1: 디자인 요소 필수 참고
 * - sample2·3: 현재 학생들이 제작한 시안 (함께 참고)
 */
export const STYLE_REF_FILES = {
  sample1: "student-sample-1.png",
  sample2: "student-sample-2.png",
  sample3: "student-sample-3.png",
} as const;

export type StyleRefKey = keyof typeof STYLE_REF_FILES;

/** 항상 1 → 2 → 3 순 (sample1이 API 입력 1번이라 fidelity가 가장 높음) */
export function styleRefsForGroup(): StyleRefKey[] {
  return ["sample1", "sample2", "sample3"];
}

export function resolveStyleRefPaths(): string[] {
  const dir = path.join(process.cwd(), "public", "references");
  return styleRefsForGroup()
    .map((key) => path.join(dir, STYLE_REF_FILES[key]))
    .filter((p) => fs.existsSync(p));
}

/**
 * 공통 크래프트 가이드 + 참고 우선순위
 */
export const STUDENT_NAIL_CRAFT_STYLE = `
You are designing ORIGINAL gel nail art for a Korean high-school fusion class.
References (in order of importance):
1) Reference image #1 (필수): MUST borrow its DESIGN ELEMENTS — tip presentation, handmade gel craft language, decorative vocabulary (fine lines, pearls/parts, emboss, charms, layout rhythm). Do NOT copy tip-for-tip.
2) Reference images #2 and #3: student design drafts currently made by classmates — also use as craft/technique references (how students actually build tips in class).
3) Artist mood adjectives below: keep the assigned painter's inherent visual character (color climate, stroke/texture language, ornamental vs painterly feel) while translating into wearable gel nail craft.

Ignore blank/empty nail outlines with no design, ignore arrows and handwritten labels/text.

Output must look like classroom gel craft (쪼물젤, pearl parts, fine-line or painterly dabs), not commercial CGI chrome nails.
No hands, no fingers, no text, no watermark, no famous painting reproduction.
`.trim();

/** 이미지 edit API에 붙이는 참고 설명 */
export function buildReferenceInstruction(artistMood: string): string {
  return `
REFERENCE RULES (follow strictly):
- Image 1 = mandatory design-element reference (composition language, craft details, tip set presentation). Reinterpret — do not clone.
- Images 2–3 = current student draft designs — also reference their handmade gel techniques and classroom aesthetic.
- Ignore any blank empty nail outlines; ignore labels/arrows/text on the sketches.
- Preserve the painterly character described here (artist inherent style as mood only, never artwork titles): ${artistMood}
- Invent a NEW nail collection that feels like it belongs in this class and this artist mood, while staying distinct from the references.
`.trim();
}
