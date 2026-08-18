export type Domain = "nail" | "math" | "lesson" | "assistant";

export type ChatMode = Domain;

export type Profile = {
  group: number;
  artist: string;
  name?: string;
  accentHex?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: ChatMode;
  sources?: string[];
  followUps?: string[];
  counting?: CountingResult | null;
  feedback?: DesignFeedback | null;
  designs?: DesignSpecCard[] | null;
  createdAt: number;
};

export type CountingStep = {
  op: "permutation" | "combination" | "product" | "sum" | "factorial" | "power";
  n?: number;
  r?: number;
  values?: number[];
  label: string;
};

export type CountingRequest = {
  steps: CountingStep[];
  combine: "product" | "sum" | "single";
};

export type CountingBreakdown = {
  label: string;
  expression: string;
  value: string;
};

export type CountingResult = {
  ok: true;
  total: string;
  breakdown: CountingBreakdown[];
  combine: "product" | "sum" | "single";
};

export type CountingError = {
  ok: false;
  error: string;
};

export type KnowledgeChunk = {
  id: string;
  title: string;
  page?: string;
  keywords: string[];
  body: string;
  safety?: string[];
  tips?: string[];
  nailExample?: string;
  sourceLabel?: string;
};

export type RubricLevel = "좋음" | "보통" | "보완필요";

export type DesignFeedback = {
  overall: string;
  rubric: { name: string; level: RubricLevel; comment: string }[];
  strengths: string[];
  improvements: string[];
  checkQuestions: string[];
  safetyNotes: string[];
  /** 색·모티브 선택과 연결한 경우의 수 조언 */
  mathAdvice?: {
    summary: string;
    principle: string;
    example: string;
    tip: string;
  } | null;
};

export type DesignSpec = {
  concept: string;
  tipPlan: string;
  tipElements: string[];
  materials: string[];
  makeSteps: string[];
  countingBasis: string;
  cautions: string[];
};

export type DesignSpecCard = {
  id: string;
  group: number;
  name: string;
  concept: string;
  base: string;
  technique: string;
  motif: string;
  tipPlan: string;
  countingBasis: string;
  makeSteps: string[];
  cautions: string[];
  imageUrl?: string;
  /** 수정 이미지에 적용한 변경 설명 */
  editExplanation?: string;
};

export type HistoryEntry = {
  ts: number;
  group: number;
  name: string;
  mode: ChatMode;
  question: string;
  answerSummary: string;
};

export type SuggestedQuestion = {
  session: 1 | 2 | 3 | "common";
  category: "nail" | "math" | "lesson" | "design";
  text: string;
  action?: "upload";
};
