"use client";

import {
  ARTIST_BACKGROUND_MODE,
  BACKGROUND_SCRIM,
  getArtistPalette,
  getArtworkPath,
  type ArtistBackgroundMode,
} from "@/lib/artist-background";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

/**
 * 화가 분위기 배경.
 * 모드는 lib/artist-background.ts 의 ARTIST_BACKGROUND_MODE 한 줄로 전환.
 */
export function ArtistBackground({
  group,
  mode = ARTIST_BACKGROUND_MODE,
}: {
  group: number;
  mode?: ArtistBackgroundMode;
}) {
  if (mode === "artwork") {
    return <ArtworkAtmosphereBackground group={group} />;
  }
  return <PaletteAtmosphereBackground group={group} />;
}

/** 방식 B — 팔레트 radial-gradient 블롭 (스크림은 약하게만 — 색이 보여야 함) */
function PaletteAtmosphereBackground({ group }: { group: number }) {
  const [a, b, c] = getArtistPalette(group);

  return (
    <div
      aria-hidden
      className="artist-bg pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={
        {
          "--blob-1": a,
          "--blob-2": b,
          "--blob-3": c,
          backgroundColor: BACKGROUND_SCRIM,
        } as CSSProperties
      }
    >
      <div
        className="artist-blob artist-blob-1"
        style={{ backgroundColor: a }}
      />
      <div
        className="artist-blob artist-blob-2"
        style={{ backgroundColor: b }}
      />
      <div
        className="artist-blob artist-blob-3"
        style={{ backgroundColor: c }}
      />
      {/* 방식 B: 색 분위기가 보이도록 스크림은 두지 않음 (가독성은 카드 frosted glass로 확보) */}
    </div>
  );
}

/**
 * 방식 A — 작품 이미지 배경
 * public/artworks/ 에 파일을 두고 ARTIST_BACKGROUND_MODE = "artwork" 로 전환하면 활성화됩니다.
 *
 * 처리 3단계:
 *  1) filter: blur(24px) saturate(1.1)
 *  2) opacity: 0.28
 *  3) #FAF8F5 88% 스크림
 */
function ArtworkAtmosphereBackground({ group }: { group: number }) {
  const [activeGroup, setActiveGroup] = useState(group);
  const [prevGroup, setPrevGroup] = useState<number | null>(null);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    if (group === activeGroup) return;
    setPrevGroup(activeGroup);
    setActiveGroup(group);
    setFadeIn(false);
    const id = requestAnimationFrame(() => setFadeIn(true));
    const t = window.setTimeout(() => setPrevGroup(null), 400);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(t);
    };
  }, [group, activeGroup]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: BACKGROUND_SCRIM }}
    >
      {prevGroup != null && (
        <ArtworkLayer group={prevGroup} opacity={fadeIn ? 0 : 1} priority={false} />
      )}
      <ArtworkLayer
        group={activeGroup}
        opacity={fadeIn ? 1 : 0}
        priority={activeGroup === 1 && prevGroup == null}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `color-mix(in srgb, ${BACKGROUND_SCRIM} 88%, transparent)`,
        }}
      />
    </div>
  );
}

function ArtworkLayer({
  group,
  opacity,
  priority,
}: {
  group: number;
  opacity: number;
  priority: boolean;
}) {
  return (
    <div
      className="absolute inset-0 transition-opacity duration-[400ms] ease-in-out"
      style={{ opacity }}
    >
      <div
        className="absolute inset-0"
        style={{
          filter: "blur(24px) saturate(1.1)",
          opacity: 0.28,
          transform: "scale(1.1)",
        }}
      >
        <Image
          src={getArtworkPath(group)}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority={priority}
          unoptimized
        />
      </div>
    </div>
  );
}

/*
 * ─── 방식 A 단독 사용 예시 (참고용 주석) ───
 *
 * // lib/artist-background.ts
 * export const ARTIST_BACKGROUND_MODE: ArtistBackgroundMode = "artwork";
 *
 * // public/artworks/gogh.jpg, klimt.jpg, picasso.jpg, munch.jpg, monet.jpg 배치
 *
 * // 이미지 레이어 CSS 요약:
 * //   position: fixed; inset: 0; z-index: -1;
 * //   object-fit: cover; transform: scale(1.1);
 * //   filter: blur(24px) saturate(1.1); opacity: 0.28;
 * //   + #FAF8F5 @ 88% scrim
 * //   crossfade 400ms ease-in-out
 */
