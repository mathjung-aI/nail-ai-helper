import type { DesignSpecCard } from "@/lib/types";

export type GroupInfo = {
  group: number;
  artist: string;
  shortName: string;
  accentHex: string;
  mood: string;
  baseColors: string[];
  techniques: string[];
  motifs: string[];
  countingExample: string;
  intro: string;
};

export const GROUPS: GroupInfo[] = [
  {
    group: 1,
    artist: "빈센트 반 고흐",
    shortName: "고흐",
    accentHex: "#1E4B8F",
    mood: "thick short gel brush dabs like student hand-painted tips, cobalt and mustard contrast, raised swirling emboss ridges, classroom gel craft — not a museum painting copy",
    baseColors: [
      "딥 코발트 블루",
      "머스터드 옐로우",
      "다크 네이비",
      "아이보리",
      "올리브 그린",
    ],
    techniques: ["엠보 젤 라인 스트로크", "그러데이션", "글리터 믹스", "마블링"],
    motifs: ["소용돌이 라인", "별 모티브", "사이프러스 실루엣"],
    countingExample: "곱의 법칙 5×4×3 = 60가지",
    intro:
      "깊은 코발트와 골든 옐로우의 대비, 두툼한 붓터치 질감을 젤 엠보로 옮겨 보세요. 소용돌이 라인과 별 모티브가 컬렉션의 시그니처가 됩니다.",
  },
  {
    group: 2,
    artist: "구스타프 클림트",
    shortName: "클림트",
    accentHex: "#C9A227",
    mood: "ornate student gel craft: gold base, emerald stipple, pearl parts, red gem accents, gold chains and filigree charms, molded-gel tree or floral relief — decorative classroom tips, never reproduce a famous framed painting",
    baseColors: ["골드", "블랙", "앰버", "버건디", "샴페인 베이지"],
    techniques: ["골드 포일", "쪼물젤 조형", "진주파츠·스톤", "세필 라인"],
    motifs: ["해바라기·꽃 엠보", "골드 소용돌이", "진주·체인 드롭"],
    countingExample: "순열 10P3 = 720가지 (시그니처 팁 배치)",
    intro:
      "골드와 블랙의 대비, 기하 나선·모자이크가 핵심입니다. 시그니처 팁 위치를 경우의 수로 정한 뒤 나머지는 절제해 통일감을 잡으세요.",
  },
  {
    group: 3,
    artist: "파블로 피카소",
    shortName: "피카소",
    accentHex: "#C45C26",
    mood: "student cubist-inspired gel craft: fragmented color planes, bold outline seams, warm ochre with cobalt and charcoal blocks, geometric face-like tip accents reinterpreted as wearable nail shapes — never copy a famous painting",
    baseColors: ["오커 옐로우", "코발트 블루", "차콜 그레이", "크림 화이트", "테라코타"],
    techniques: ["면 분할 컬러링", "세필 아웃라인", "플랫 엠보 블록", "매트·유광 대비"],
    motifs: ["기하 면 분할", "단순화된 실루엣", "각도 있는 면"],
    countingExample: "조합 8C3 = 56가지 (면 색 선택)",
    intro:
      "면을 나누고 선으로 연결하는 구성이 핵심입니다. 원색 블록을 너무 복잡하게 쓰지 말고, 팁마다 면 개수를 경우의 수로 정해 보세요.",
  },
  {
    group: 4,
    artist: "에드바르 뭉크",
    shortName: "뭉크",
    accentHex: "#B33A3A",
    mood: "expressive student gel craft: swirling sky-like color bands, emotional warm orange against cool teal, loose painterly emboss strokes, tense curved lines — mood and color climate only, never reproduce a famous artwork",
    baseColors: ["선셋 오렌지", "딥 테일", "와인 레드", "미드나잇 블루", "아이보리"],
    techniques: ["긴 곡선 엠보", "감정 그러데이션", "러프 붓터치", "반투명 레이어"],
    motifs: ["소용돌이 하늘 밴드", "물결 곡선", "실루엣 포인트"],
    countingExample: "곱의 법칙 5×3×2 = 30가지 (색·곡선·포인트)",
    intro:
      "따뜻한 색과 차가운 색의 대비, 긴 곡선 리듬이 핵심입니다. 감정적인 분위기를 젤 질감으로 옮기되 두께는 얇게 유지하세요.",
  },
  {
    group: 5,
    artist: "클로드 모네",
    shortName: "모네",
    accentHex: "#6FA8B8",
    mood: "student impressionist gel painting on almond tips: short dabbed strokes of aqua, lavender, pink, soft pond-garden color layers, handmade brush texture — reinterpret mood only, never copy a famous canvas",
    baseColors: [
      "연보라",
      "파스텔 핑크",
      "미스티 블루",
      "세이지 그린",
      "크림 화이트",
    ],
    techniques: ["핸드페인팅 붓터치", "워터 그러데이션", "블러 엠보", "펄 톱 젤"],
    motifs: ["수련·연못 색면", "다리·산책로 실루엣", "꽃밭 스트로크"],
    countingExample: "합의 법칙 — 따뜻한 팔레트 또는 차가운 팔레트 선택",
    intro:
      "옅은 파스텔과 흐릿한 경계가 특징입니다. 수련·물결 모티브를 얇은 블러 엠보로 표현하면 무대 조명에서도 부드럽게 빛납니다.",
  },
];

export function getGroup(group: number): GroupInfo {
  return GROUPS.find((g) => g.group === group) ?? GROUPS[0];
}

/** 조별 샘플 디자인 3안 (텍스트 명세) */
export const SAMPLE_DESIGNS: DesignSpecCard[] = [
  // ── 1조 고흐 ──
  {
    id: "g1-a",
    group: 1,
    name: "별밤 소용돌이 포인트",
    concept: "딥 코발트 베이스에 머스터드 소용돌이 라인을 3팁에만 강조",
    base: "딥 코발트 블루",
    technique: "엠보 젤 라인 스트로크",
    motif: "소용돌이 라인",
    tipPlan: "2·5·8번 팁에 시그니처 소용돌이, 나머지는 단색+미세 글리터",
    countingBasis:
      "곱의 법칙 5×4×3=60가지 중, 통일감 기준으로 소용돌이 포인트 3안 압축",
    makeSteps: [
      "소독",
      "딥 코발트 컬러 도포·경화",
      "엠보 젤로 소용돌이 조형",
      "핀 큐어로 형태 고정",
      "머스터드 포인트",
      "톱 젤 마무리",
    ],
    cautions: ["소용돌이 두께 1mm 이하", "프리에지 쪽으로 몰리지 않게"],
  },
  {
    id: "g1-b",
    group: 1,
    name: "사이프러스 실루엣",
    concept: "네이비 그라데이션 위에 올리브 실루엣을 얇게 엠보",
    base: "다크 네이비",
    technique: "그러데이션",
    motif: "사이프러스 실루엣",
    tipPlan: "엄지·검지에 실루엣, 나머지 팁은 그러데이션만",
    countingBasis: "모티브 3종 중 1종 선택 × 배치 위치 조합으로 압축",
    makeSteps: [
      "소독",
      "네이비→아이보리 그러데이션",
      "올리브 실루엣 조형",
      "부분 경화",
      "톱 젤",
    ],
    cautions: ["실루엣이 너무 두껍지 않게", "생활 착용성 점검"],
  },
  {
    id: "g1-c",
    group: 1,
    name: "골드 별 미니멀",
    concept: "아이보리 베이스에 작은 별 모티브를 리듬 있게 배치",
    base: "아이보리",
    technique: "글리터 믹스",
    motif: "별 모티브",
    tipPlan: "홀수 팁에만 별 1개씩, 짝수는 글리터 미스트",
    countingBasis: "10팁 중 별 배치 위치를 고르는 조합으로 리듬 설계",
    makeSteps: [
      "소독",
      "아이보리 컬러",
      "별 엠보 조형",
      "글리터 믹스",
      "톱 젤",
    ],
    cautions: ["별 크기 균일", "끝부분 몰림 주의"],
  },
  // ── 2조 모네 ──
  {
    id: "g2-a",
    group: 5,
    name: "수련 파스텔 블러",
    concept: "연보라·핑크 워터 그러데이션 위에 얇은 수련 꽃잎 엠보",
    base: "연보라",
    technique: "워터 그러데이션",
    motif: "수련 꽃잎",
    tipPlan: "중앙 3팁에 꽃잎, 양끝은 미스티 블루 그러데이션",
    countingBasis: "따뜻한/차가운 팔레트 합의 법칙 후 꽃잎 배치로 압축",
    makeSteps: [
      "소독",
      "워터 그러데이션",
      "블러 엠보 꽃잎",
      "펄 톱 젤",
    ],
    cautions: ["꽃잎은 반투명하게", "두께 과다 금지"],
  },
  {
    id: "g2-b",
    group: 5,
    name: "물결 미스트",
    concept: "세이지→크림 블렌딩에 잔잔한 물결 라인",
    base: "세이지 그린",
    technique: "블러 엠보",
    motif: "물결 라인",
    tipPlan: "전 팁 공통 물결, 2팁만 잎사귀 포인트",
    countingBasis: "모티브 선택 후 포인트 팁 위치로 경우의 수 좁히기",
    makeSteps: ["소독", "세이지 베이스", "물결 라인", "잎사귀", "펄 톱"],
    cautions: ["라인이 끊기지 않게", "핀 큐어 활용"],
  },
  {
    id: "g2-c",
    group: 5,
    name: "안개 도트",
    concept: "크림 화이트에 미스티 블루 도트로 분위기만 암시",
    base: "크림 화이트",
    technique: "도트 텍스처",
    motif: "작은 잎사귀",
    tipPlan: "도트 밀도 그라데이션 + 잎사귀 2팁",
    countingBasis: "기법·모티브 곱의 법칙에서 미니멀 안 선택",
    makeSteps: ["소독", "화이트 베이스", "도트", "잎사귀", "펄 톱"],
    cautions: ["도트 크기 변주", "과밀 배치 피하기"],
  },
  // ── 3조 클림트 ──
  {
    id: "g3-a",
    group: 2,
    name: "골드 모자이크 미니멀",
    concept: "10팁 중 3팁만 골드 나선 포인트, 나머지는 블랙 무광으로 절제",
    base: "블랙",
    technique: "엠보 기하 패턴",
    motif: "나선 문양",
    tipPlan: "1·5·10번 팁에 시그니처 나선, 나머지는 단색 + 코너 도트",
    countingBasis:
      "시그니처 팁 3개 위치를 정하는 경우 10P3 = 720가지 중, 좌우 균형 조건으로 3안 압축",
    makeSteps: [
      "소독",
      "블랙 컬러 젤 도포·경화",
      "엠보 젤로 나선 조형",
      "부분 경화 후 형태 고정",
      "골드 포일 포인트",
      "톱 젤 마무리",
    ],
    cautions: ["나선 두께가 1mm를 넘지 않게", "장식이 프리에지 쪽으로 몰리지 않게"],
  },
  {
    id: "g3-b",
    group: 2,
    name: "앰버 타일",
    concept: "샴페인 베이지에 사각 모자이크와 골드 라인",
    base: "샴페인 베이지",
    technique: "골드 포일",
    motif: "사각 모자이크",
    tipPlan: "짝수 팁 모자이크, 홀수는 단색+골드 라인",
    countingBasis: "모티브 배치 순열을 통일감 기준으로 압축",
    makeSteps: [
      "소독",
      "베이지 베이스",
      "모자이크 엠보",
      "골드 포일",
      "톱 젤",
    ],
    cautions: ["포일 들뜸 주의", "매트/유광 혼용 점검"],
  },
  {
    id: "g3-c",
    group: 2,
    name: "버건디 눈물방울",
    concept: "버건디 베이스에 눈물방울 스톤·엠보 포인트",
    base: "버건디",
    technique: "스톤 세팅",
    motif: "눈물방울",
    tipPlan: "약지·검지에만 눈물방울, 나머지는 얇은 골드 라인",
    countingBasis: "포인트 팁 위치 선택으로 경우의 수 축소",
    makeSteps: [
      "소독",
      "버건디 컬러",
      "눈물방울 조형",
      "스톤 고정",
      "논와이프 톱",
    ],
    cautions: ["스톤 고정 후 경화 확인", "생활 불편 여부 점검"],
  },
  // ── 4조 몬드리안 ──
  {
    id: "g4-a",
    group: 3,
    name: "프라이머리 그리드",
    concept: "화이트 바탕에 원색 블록과 검정 엠보 그리드",
    base: "화이트",
    technique: "블록 컬러링",
    motif: "사각 블록",
    tipPlan: "팁마다 블록 비율만 다르게, 그리드 두께는 통일",
    countingBasis: "조합 8C5=56가지 후보에서 원색 비율로 5안 압축",
    makeSteps: [
      "소독",
      "화이트 베이스",
      "원색 블록",
      "검정 라인 그리드",
      "매트 톱",
    ],
    cautions: ["라인 두께 일정", "블록이 끝으로 몰리지 않게"],
  },
  {
    id: "g4-b",
    group: 3,
    name: "코너 포인트",
    concept: "면 분할 후 한쪽 코너에만 원색 포인트",
    base: "화이트",
    technique: "면 분할",
    motif: "코너 포인트",
    tipPlan: "교차 라인 공통 + 코너 색만 팁별 변주",
    countingBasis: "색 선택 × 코너 위치 곱의 법칙으로 설계",
    makeSteps: ["소독", "면 분할", "코너 컬러", "매트 톱"],
    cautions: ["분할선 흔들림 주의", "두께 최소화"],
  },
  {
    id: "g4-c",
    group: 3,
    name: "레드 액센트 미니멀",
    concept: "대부분 화이트·블랙, 2팁만 레드 블록 강조",
    base: "화이트",
    technique: "엠보 라인 그리드",
    motif: "교차 라인",
    tipPlan: "5·6번 팁에 레드, 나머지는 그리드만",
    countingBasis: "시그니처 2팁 위치 조합으로 좌우 균형 선택",
    makeSteps: ["소독", "화이트", "그리드", "레드 블록", "매트 톱"],
    cautions: ["레드 면적 과다 금지", "통일감 점검"],
  },
  // ── 5조 쿠사마(요소 형용사만) ──
  {
    id: "g5-a",
    group: 4,
    name: "리듬 도트 대비",
    concept: "화이트·블랙 교차 베이스에 비비드 도트 크기 변주",
    base: "화이트",
    technique: "도트 반복",
    motif: "원형 도트",
    tipPlan: "팁마다 도트 크기 리듬, 2팁은 핫핑크 포인트",
    countingBasis: "순열 6P4=360가지 포인트 배열 중 리듬감 있는 3안 압축",
    makeSteps: [
      "소독",
      "베이스 컬러",
      "크기 변주 도트",
      "부분 경화",
      "톱 젤",
    ],
    cautions: ["도트 높이 과다 금지", "끝 몰림 주의"],
  },
  {
    id: "g5-b",
    group: 4,
    name: "호박 실루엣 미니",
    concept: "비비드 옐로우에 작은 원형 실루엣과 도트 그리드",
    base: "비비드 옐로우",
    technique: "엠보 볼 조형",
    motif: "호박 실루엣",
    tipPlan: "중앙 팁에만 실루엣, 나머지는 반복 도트",
    countingBasis: "모티브 배치 위치를 순열로 점검 후 압축",
    makeSteps: ["소독", "옐로우 베이스", "실루엣", "도트", "톱 젤"],
    cautions: ["실루엣은 납작하게", "경화 분할"],
  },
  {
    id: "g5-c",
    group: 4,
    name: "핫핑크 반복 그리드",
    concept: "블랙 바탕에 핫핑크·화이트 도트 그리드",
    base: "블랙",
    technique: "반복 패턴 그리드",
    motif: "반복 패턴 그리드",
    tipPlan: "전 팁 동일 그리드, 엄지에만 크기 확대",
    countingBasis: "기법·모티브 곱의 법칙에서 고대비 안 선택",
    makeSteps: ["소독", "블랙", "도트 그리드", "엄지 확대", "톱 젤"],
    cautions: ["간격 균일", "생활 착용성 확인"],
  },
];

export function getSamplesForGroup(group: number): DesignSpecCard[] {
  // 이미지 URL은 넣지 않음 — API가 매번 새로 생성
  return SAMPLE_DESIGNS.filter((s) => s.group === group).map((s) => ({
    ...s,
    imageUrl: undefined,
  }));
}

/** 요청마다 팔레트 조합을 섞어 다른 3안 텍스트 명세 생성 */
export function buildVariedSamples(group: number): DesignSpecCard[] {
  const g = getGroup(group);
  const seed = Date.now() + Math.floor(Math.random() * 1000);
  const pick = <T,>(arr: T[], offset: number) =>
    arr[Math.abs(seed + offset) % arr.length];

  const variations = [
    "minimal: only 2 tips carry the main motif, others stay quieter",
    "center focus: tip 3 is the signature, neighbors echo lightly",
    "rhythmic: small repeated motifs with size changes across all tips",
  ];

  const nameHints = ["리듬 안", "포인트 안", "변주 안"];

  return [0, 1, 2].map((i) => {
    const base = pick(g.baseColors, i * 3);
    const technique = pick(g.techniques, i * 5 + 1);
    const motif = pick(g.motifs, i * 7 + 2);
    return {
      id: `g${group}-${seed}-${i}`,
      group,
      name: `${g.artist.split(" ").slice(-1)[0]} ${nameHints[i]}`,
      concept: `${base} 베이스에 ${motif}를 ${technique}로 — ${variations[i]}`,
      base,
      technique,
      motif,
      tipPlan: variations[i],
      countingBasis: g.countingExample,
      makeSteps: [
        "소독",
        `${base} 도포·경화`,
        `${technique}로 ${motif} 조형`,
        "부분 경화",
        "톱 젤 마무리",
      ],
      cautions: ["두께 과다 금지", "프리에지 몰림 주의", "유명 작품 직접 재현 금지"],
      imageUrl: undefined,
    };
  });
}
