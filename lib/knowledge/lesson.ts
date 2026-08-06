import type { SuggestedQuestion } from "@/lib/types";

export const LESSON = {
  title: "화가의 작품을 담은 메이크업쇼 네일아트",
  subtitle: "경우의 수를 활용한 젤 2D 입체 네일아트 10팁 컬렉션 기획·제작",
  subject: "네일 미용(전공) × 수학(경우의 수)",
  target: "미디어메이크업과 2학년 1반 (5개 조)",
  teacher: "박기연",
  sessions: [
    {
      n: 1,
      title: "개념 이해 · 화가 분석 마인드맵 · AI 디자인 초안",
      activities: [
        "입체 네일아트 개념(2D/3D, 젤 특성, 경화 원리)",
        "팀별 화가 분석 마인드맵(색감·선·질감·분위기·소재)",
        "AI 디자인 아이디어 생성, 요소별 선택지 정리, 경우의 수 산출",
      ],
    },
    {
      n: 2,
      title: "★연구수업(본시) — 디자인 확정 · 젤 2D 조형·경화 실습",
      activities: [
        "AI 초안 분석·수정(제작 가능성·두께·위치·색 조화·통일감)",
        "조별 협의로 디자인 확정, 개인별 담당 팁 계획",
        "교사 시범 후 개인별 담당 팁 조형·경화(21분)",
      ],
    },
    {
      n: 3,
      title: "톱 젤 마무리 · 조별 발표 · 성찰",
      activities: [
        "톱 젤 도포·경화로 광택·지속성 마감, 10팁 배열·전시",
        "조별 발표(재해석 스토리 + 경우의 수 근거 + AI 수정 과정, 2분)",
        "동료 피드백·성찰(AI가 한 일 / 내가 한 일 구분)",
      ],
    },
  ],
  rubricSummary: {
    상: "AI 제안 디자인을 창의적으로 수정해 통일감 있는 10팁 컬렉션을 조형·경화·마감까지 완성하고, 경우의 수 원리를 정확히 적용해 조합을 산출·설명하며 근거를 논리적으로 발표한다.",
    중: "경우의 수로 조합 수를 구해 의미를 설명하고, AI 제안을 부분 수정해 담당 팁을 조형·경화하며 조별 활동에 기여한다.",
    하: "교사·동료·웹앱의 도움을 받아 경우의 수를 제한적으로 적용하고 담당 팁 제작을 시도한다.",
  },
  materials: [
    "팁 10개, 젤 램프, 컬러·베이스·톱 젤, 엠보/튜브 젤",
    "젤 브러시, 스패출러, 우드스틱, 젤 클렌저, 마스크",
    "활동지, 아이패드(디벗), 본 웹앱",
  ],
};

export const LESSON_CHUNKS = [
  {
    id: "l-01",
    title: "1차시 활동 안내",
    page: "1차시",
    keywords: ["1차시", "마인드맵", "개념", "초안", "해야"],
    body: `1차시 목표: ${LESSON.sessions[0].title}. 활동: ${LESSON.sessions[0].activities.join(" / ")}. 마인드맵에는 색감·선·질감·분위기·소재를 분석해 적습니다.`,
    sourceLabel: "학습지도안 1차시",
  },
  {
    id: "l-02",
    title: "2차시(연구수업) 활동 안내",
    page: "2차시",
    keywords: ["2차시", "연구수업", "확정", "조형", "활동지", "기준", "기록"],
    body: `2차시 목표: ${LESSON.sessions[1].title}. 활동: ${LESSON.sessions[1].activities.join(" / ")}. 디자인 확정 기준은 제작 가능성·두께·위치·색 조화·통일감입니다. 활동지에는 AI 제안, 수정 이유, 경우의 수 근거, 담당 팁 계획을 기록합니다.`,
    sourceLabel: "학습지도안 2차시",
  },
  {
    id: "l-03",
    title: "3차시 활동·발표 안내",
    page: "3차시",
    keywords: ["3차시", "발표", "톱 젤", "성찰", "평가", "상"],
    body: `3차시 목표: ${LESSON.sessions[2].title}. 발표(2분) 순서: 재해석 스토리 → 경우의 수 근거 → AI 수정 과정. 평가 '상' 기준: ${LESSON.rubricSummary.상}`,
    sourceLabel: "학습지도안 3차시",
  },
  {
    id: "l-04",
    title: "준비물·평가 기준 요약",
    page: "공통",
    keywords: ["준비물", "평가", "루브릭", "상", "중", "하"],
    body: `준비물: ${LESSON.materials.join(" / ")}. 평가 상/중/하: 상=${LESSON.rubricSummary.상} / 중=${LESSON.rubricSummary.중} / 하=${LESSON.rubricSummary.하}`,
    sourceLabel: "학습지도안 평가·준비물",
  },
];

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    session: 1,
    category: "nail",
    text: "2D 입체 네일아트와 3D 입체 네일아트는 뭐가 다른가요?",
  },
  {
    session: 1,
    category: "nail",
    text: "젤은 어떤 특성이 있어서 입체 조형이 가능한가요?",
  },
  {
    session: 1,
    category: "nail",
    text: "젤 램프로 경화하는 원리가 뭔가요?",
  },
  {
    session: 1,
    category: "nail",
    text: "무대 조명 아래에서 2D 입체 장식이 주는 효과는 뭔가요?",
  },
  {
    session: 1,
    category: "math",
    text: "베이스 컬러 5, 아트 기법 4, 입체 모티브 3이면 팁 디자인은 몇 가지예요?",
  },
  { session: 1, category: "math", text: "왜 더하는 게 아니라 곱하나요?" },
  {
    session: 1,
    category: "math",
    text: "후보 모티브 8개 중 5개를 고르면 몇 가지인가요?",
  },
  {
    session: 1,
    category: "lesson",
    text: "1차시에 우리 조가 해야 할 일이 뭔가요?",
  },
  {
    session: 1,
    category: "lesson",
    text: "마인드맵에 무엇을 분석해서 적어야 하나요?",
  },
  {
    session: 2,
    category: "nail",
    text: "이 두께로 조형해도 경화가 잘 될까요?",
  },
  {
    session: 2,
    category: "nail",
    text: "젤이 자꾸 퍼지는데 어떻게 하면 형태가 잡히나요?",
  },
  {
    session: 2,
    category: "nail",
    text: "입체 장식 위에 톱 젤은 어떻게 발라야 하나요?",
  },
  {
    session: 2,
    category: "nail",
    text: "미경화 젤은 어떻게 처리하나요?",
  },
  {
    session: 2,
    category: "nail",
    text: "튜브 젤로 조형할 때 주의할 점은 뭔가요?",
  },
  {
    session: 2,
    category: "nail",
    text: "3D 모형은 어떤 접착제로 어떻게 붙이나요?",
  },
  {
    session: 2,
    category: "nail",
    text: "젤 램프 쓸 때 안전 수칙을 알려주세요.",
  },
  {
    session: 2,
    category: "math",
    text: "후보 중 5개를 고르는 조합 수를 계산해 주세요.",
  },
  {
    session: 2,
    category: "math",
    text: "컬러 하나를 빼면 경우의 수가 어떻게 달라지나요?",
  },
  {
    session: 2,
    category: "lesson",
    text: "디자인을 확정할 때 무엇을 기준으로 판단해야 하나요?",
  },
  {
    session: 2,
    category: "lesson",
    text: "활동지에 무엇을 기록해야 하나요?",
  },
  {
    session: 3,
    category: "nail",
    text: "톱 젤로 마무리할 때 입체감이 사라지지 않게 하려면?",
  },
  {
    session: 3,
    category: "nail",
    text: "10팁을 하나의 컬렉션으로 보이게 배열하려면 어떻게 하나요?",
  },
  {
    session: 3,
    category: "math",
    text: "순서가 중요하지 않으면 순열 대신 무엇을 써야 하나요?",
  },
  {
    session: 3,
    category: "math",
    text: "10P3과 10C3은 얼마나 차이가 나나요?",
  },
  {
    session: 3,
    category: "lesson",
    text: "발표는 어떤 순서로 구성해야 하나요?",
  },
  {
    session: 3,
    category: "lesson",
    text: "평가에서 '상'을 받으려면 무엇이 필요한가요?",
  },
  {
    session: "common",
    category: "design",
    text: "제 디자인 사진을 봐주세요.",
    action: "upload",
  },
  {
    session: "common",
    category: "design",
    text: "우리 조 화가에 맞는 샘플 디자인을 보여주세요.",
    action: "samples",
  },
];
