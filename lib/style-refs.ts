import fs from "fs";
import path from "path";

/** 학생 실습 스타일 참고 이미지 (public/references) — 결과로 그대로 보여주지 않음 */
export const STYLE_REF_FILES = {
  sample1: "student-sample-1.png",
  sample2: "student-sample-2.png",
  sample3: "student-sample-3.png",
} as const;

export type StyleRefKey = keyof typeof STYLE_REF_FILES;

/** 조별 우선 참고 샘플 (첫 이미지가 기본, 생성 시 랜덤으로 하나 선택) */
export function styleRefsForGroup(group: number): StyleRefKey[] {
  switch (group) {
    case 1: // 고흐 — 붓터치·핸드크래프트
      return ["sample2", "sample1", "sample3"];
    case 2: // 모네 — 인상파 핸드페인팅 (샘플2 우선)
      return ["sample2", "sample1", "sample3"];
    case 3: // 클림트 — 골드·파츠 (샘플3 우선)
      return ["sample3", "sample1", "sample2"];
    case 4:
      return ["sample1", "sample2", "sample3"];
    case 5:
      return ["sample1", "sample3", "sample2"];
    default:
      return ["sample1", "sample2", "sample3"];
  }
}

export function resolveStyleRefPaths(group: number): string[] {
  const dir = path.join(process.cwd(), "public", "references");
  return styleRefsForGroup(group)
    .map((key) => path.join(dir, STYLE_REF_FILES[key]))
    .filter((p) => fs.existsSync(p));
}

/** 생성마다 다른 참고 샘플 1장을 고름 (다양성) */
export function pickStyleRefPath(group: number): string | null {
  const paths = resolveStyleRefPaths(group);
  if (paths.length === 0) return null;
  return paths[Math.floor(Math.random() * paths.length)];
}

/**
 * 학생 네일아트 실습 스타일 공통 가이드.
 * 샘플예시 1·2·3: 스타일 참고만. 비어 있는(윤곽만 있는) 네일 팁은 무시.
 */
export const STUDENT_NAIL_CRAFT_STYLE = `
Match the CRAFT STYLE of Korean vocational high-school gel nail practice samples (student handwork), NOT glossy commercial CGI nails.

Must look like:
- A row of finished artificial nail tips on a plain white background (almond / soft-stiletto)
- Hand-sculpted 2D embossed gel (쪼물젤), pearl parts, fine-line illustration, gold filigree/charms, or thick painterly gel brush dabs
- Visible handmade texture: stippling, short brush strokes, raised gel ridges, small pearls/gems/chains when ornamental
- Soft pastel OR impressionist layered color OR ornate gold+jewel craft — depending on the mood below
- No hands, no fingers, no Korean/English text labels, no arrows, no watermark

When looking at reference sketches/photos:
- IGNORE blank or empty nail outlines that have no design filled in
- IGNORE annotation text, arrows, and handwritten labels
- Use ONLY the crafted/painted tips as style cues (texture, technique, tip shape)

Do NOT:
- Copy or reproduce any famous painting or existing artwork
- Copy the reference tips tip-for-tip
- Generate fantasy CGI chrome nails unrelated to gel craft class
`.trim();
