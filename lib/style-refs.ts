import fs from "fs";
import path from "path";

/** 학생 실습 스타일 참고 이미지 (public/references) */
export const STYLE_REF_FILES = {
  ethereal: "style-ethereal.png",
  impressionist: "style-impressionist.png",
  ornament: "style-ornament.png",
} as const;

export type StyleRefKey = keyof typeof STYLE_REF_FILES;

/** 조별 우선 참고 스타일 (첫 이미지가 fidelity가 가장 높음) */
export function styleRefsForGroup(group: number): StyleRefKey[] {
  switch (group) {
    case 1: // 고흐 — 두툼한 붓터치·인상파 질감 + 섬세한 조형
      return ["impressionist", "ethereal", "ornament"];
    case 2: // 모네 — 인상파 핸드페인팅
      return ["impressionist", "ethereal", "ornament"];
    case 3: // 클림트 — 골드·진주·파츠 장식
      return ["ornament", "ethereal", "impressionist"];
    case 4: // 몬드리안 — 정교한 핸드크래프트 라인
      return ["ethereal", "ornament", "impressionist"];
    case 5: // 쿠사마 — 파츠·반복 조형 감성
      return ["ornament", "ethereal", "impressionist"];
    default:
      return ["ethereal", "impressionist", "ornament"];
  }
}

export function resolveStyleRefPaths(group: number): string[] {
  const dir = path.join(process.cwd(), "public", "references");
  return styleRefsForGroup(group)
    .map((key) => path.join(dir, STYLE_REF_FILES[key]))
    .filter((p) => fs.existsSync(p));
}

/** MOCK/폴백용 public URL */
export function styleRefPublicUrls(group: number): string[] {
  return styleRefsForGroup(group).map(
    (key) => `/references/${STYLE_REF_FILES[key]}`
  );
}

/**
 * 학생 네일아트 실습 스타일 공통 가이드.
 * 첨부 샘플: 아몬드/스틸레토 팁, 쪼물젤·진주파츠·세필 라인, 핸드크래프트 감성.
 */
export const STUDENT_NAIL_CRAFT_STYLE = `
Match the CRAFT STYLE of Korean vocational high-school gel nail practice samples (student handwork), NOT glossy commercial CGI nails.

Must look like:
- A row of 5 long almond or soft-stiletto artificial nail tips on a plain white background
- Hand-sculpted 2D embossed gel (쪼물젤 / molded gel), pearl parts (진주 파츠), fine-line illustration, gold filigree charms, or thick painterly gel brush dabs — as in classroom student work
- Visible handmade texture: stippling, short brush strokes, raised gel ridges, small pearls/gems/chains when ornamental
- Soft pastel OR impressionist layered color OR ornate gold+jewel craft — depending on the mood below
- Photographed or cleanly presented tip collection (product photo or neat flat-lay), no hands, no fingers, no text, no watermark, no labels

Do NOT:
- Copy or reproduce any famous painting or existing artwork (no The Kiss, no Water Lilies, no Starry Night, etc.)
- Generate fantasy CGI chrome nails or Instagram influencer hyper-gloss unrelated to gel craft class
- Put artist names or artwork titles in the image
`.trim();
