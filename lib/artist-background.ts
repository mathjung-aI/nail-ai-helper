/**
 * 화가 분위기 배경 설정
 *
 * 전환 한 줄:
 *   ARTIST_BACKGROUND_MODE = "palette"  → 방식 B (현재)
 *   ARTIST_BACKGROUND_MODE = "artwork"  → 방식 A (public/artworks 이미지)
 */
export type ArtistBackgroundMode = "palette" | "artwork";

/** ← 여기만 바꾸면 배경 방식이 전환됩니다 */
export const ARTIST_BACKGROUND_MODE: ArtistBackgroundMode = "palette";

/** 방식 B: 화가별 대표 색 3색 (radial blob) */
export const ARTIST_PALETTES: Record<
  number,
  readonly [string, string, string]
> = {
  1: ["#1B3A8C", "#E8A317", "#2E5C8A"], // 고흐
  2: ["#C9A227", "#1A1614", "#8B6F3A"], // 클림트
  3: ["#C45C26", "#1E4B8F", "#E8C547"], // 피카소
  4: ["#D96C2C", "#4A6B8A", "#E3B04B"], // 뭉크
  5: ["#6B9AC4", "#A8BFA0", "#E8C4D4"], // 모네
};

/**
 * 방식 A: public/artworks/ 대표작 이미지 경로
 * (파일을 넣은 뒤 ARTIST_BACKGROUND_MODE = "artwork" 로 전환)
 */
export const ARTWORK_PATHS: Record<number, string> = {
  1: "/artworks/gogh.jpg",
  2: "/artworks/klimt.jpg",
  3: "/artworks/picasso.jpg",
  4: "/artworks/munch.jpg",
  5: "/artworks/monet.jpg",
};

export const BACKGROUND_SCRIM = "#FAF8F5";
export const BACKGROUND_TEXT = "#1A1A1A";
export const BACKGROUND_MUTED = "#3D3A36";

export function getArtistPalette(group: number): readonly [string, string, string] {
  return ARTIST_PALETTES[group] ?? ARTIST_PALETTES[1];
}

export function getArtworkPath(group: number): string {
  return ARTWORK_PATHS[group] ?? ARTWORK_PATHS[1];
}
