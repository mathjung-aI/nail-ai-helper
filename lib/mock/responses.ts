import {
  calculateCounting,
  detectCountingFromQuestion,
} from "@/lib/counting";
import { getGroup, getSamplesForGroup } from "@/lib/knowledge/artists";
import { retrieve, sourceBadges } from "@/lib/retrieve";
import type {
  ChatMode,
  CountingResult,
  DesignFeedback,
  DesignSpec,
  Profile,
} from "@/lib/types";

export type MockChatResult = {
  text: string;
  sources: string[];
  followUps: string[];
  counting: CountingResult | null;
};

export function mockChatReply(
  mode: ChatMode,
  question: string,
  profile: Profile
): MockChatResult {
  const chunks = retrieve(question, mode, 3);
  const sources = sourceBadges(chunks);
  const g = getGroup(profile.group);

  if (mode === "math") {
    const req = detectCountingFromQuestion(question);
    if (req) {
      const result = calculateCounting(req);
      if (result.ok) {
        const bd = result.breakdown
          .map((b) => `${b.label}: ${b.expression} = ${b.value}`)
          .join("\n");
        const why =
          req.steps[0]?.op === "combination"
            ? "순서를 생각하지 않고 '고르기'만 하므로 조합(C)을 씁니다."
            : req.steps[0]?.op === "permutation"
              ? "자리·배치·순서가 결과를 바꾸므로 순열(P)을 씁니다."
              : req.steps[0]?.op === "product"
                ? "단계가 '그리고'로 이어지므로 곱의 법칙입니다."
                : "합·곱·순열·조합 중 상황에 맞는 원리를 골랐어요.";

        return {
          text: `무엇을 세는지 정리하면, 질문하신 경우의 수입니다.\n\n${why}\n\n▸ 계산 결과: **${result.total}가지**\n${bd}\n\n이 수는 ${g.artist} 분위기의 10팁 컬렉션에서 '후보를 좁히는 출발점'이에요. 통일감·제작 가능성 기준으로 3안 정도로 압축해 보세요.\n\n점검: 순서를 바꾸면 다른 디자인이 되나요, 같은 디자인이 되나요?`,
          sources:
            sources.length > 0
              ? sources
              : ["📐 공통수학1 경우의 수"],
          followUps: [
            "순열과 조합은 어떻게 구분하나요?",
            "컬러 하나를 빼면 경우의 수가 어떻게 달라지나요?",
            "이 수를 활동지에 어떻게 적으면 좋을까요?",
          ],
          counting: result,
        };
      }
    }

    if (question.includes("곱하") || question.includes("더하")) {
      return {
        text: `'그리고·이어서'로 단계가 이어지면 곱하고, '또는'으로 동시에 일어나지 않으면 더합니다.\n\n예: 베이스 5 × 기법 4 × 모티브 3 = 60가지는 곱의 법칙이에요.\n\n점검: 지금 고르는 요소들이 "그리고"인가요, "또는"인가요?`,
        sources: sources.length ? sources : ["📐 공통수학1 — 합·곱의 법칙"],
        followUps: [
          "베이스 컬러 5, 아트 기법 4, 입체 모티브 3이면 팁 디자인은 몇 가지예요?",
          "순서가 중요하지 않으면 순열 대신 무엇을 써야 하나요?",
          "8C5는 왜 조합인가요?",
        ],
        counting: null,
      };
    }

    if (question.includes("순열 대신") || question.includes("순서")) {
      const p = calculateCounting({
        steps: [{ op: "permutation", n: 10, r: 3, label: "10P3" }],
        combine: "single",
      });
      const comb = calculateCounting({
        steps: [{ op: "combination", n: 10, r: 3, label: "10C3" }],
        combine: "single",
      });
      return {
        text: `순서가 결과를 바꾸지 않으면 **조합(nCr)** 을 씁니다.\n\n비교: 10P3 = ${p.ok ? p.total : "?"}가지, 10C3 = ${comb.ok ? comb.total : "?"}가지. 순열은 배치까지 세고, 조합은 고르기만 세요.\n\n점검: 지금 문제는 '고르기'인가요, '어디에 배치할지'인가요?`,
        sources: sources.length ? sources : ["📐 공통수학1 — 순열·조합"],
        followUps: [
          "10P3과 10C3은 얼마나 차이가 나나요?",
          "후보 모티브 8개 중 5개를 고르면 몇 가지인가요?",
          "시그니처 팁 위치를 정할 때는 순열인가요?",
        ],
        counting: comb.ok ? comb : null,
      };
    }
  }

  if (mode === "nail") {
    if (question.includes("미경화") || question.includes("클렌저")) {
      return {
        text: `미경화 젤이 남은 단계예요. 교재에 따라 **젤 클렌저**로 닦아냅니다.\n\n• 브러시도 클렌저로 닦으며 조형하면 형태가 또렷해져요.\n• 3D 모형처럼 닦기 어렵면 논 와이프 톱 젤로 마무리하는 방법도 있습니다.\n\n⚠️ 안전: 젤 램프 광원 직시 금지, 제품별 경화 시간 준수, 마스크·환기.\n\n점검: 지금 작업 중인 팁에 미경화 잔여가 남아 있지 않은가요?`,
        sources: sources.length
          ? sources
          : ["📖 NCS 입체 네일아트 p.31"],
        followUps: [
          "입체 장식 위에 톱 젤은 어떻게 발라야 하나요?",
          "젤 램프 쓸 때 안전 수칙을 알려주세요.",
          "이 두께로 조형해도 경화가 잘 될까요?",
        ],
        counting: null,
      };
    }
    if (question.includes("톱 젤") || question.includes("마무리")) {
      return {
        text: `톱 젤은 **조형·경화가 끝난 뒤 마무리 단계**에서 바릅니다.\n\n• 조형물 주변까지 꼼꼼히 도포·경화해 생활에 불편이 없도록 합니다.\n• 케이크처럼 입체감이 중요하면, 모형에 먼저 톱 젤을 바른 뒤 주변 장식을 올리면 층이 생겨요.\n\n⚠️ 안전: 경화 시간 준수, 미경화 젤은 클렌저 처리.\n\n점검: 10팁 전체로 봤을 때 톱 젤 광택이 통일감을 해치지 않나요?`,
        sources: sources.length
          ? sources
          : ["📖 NCS 입체 네일아트 p.31~37"],
        followUps: [
          "미경화 젤은 어떻게 처리하나요?",
          "톱 젤로 마무리할 때 입체감이 사라지지 않게 하려면?",
          "제 디자인 사진을 봐주세요.",
        ],
        counting: null,
      };
    }
    if (question.includes("두께") || question.includes("경화")) {
      return {
        text: `두께가 두꺼우면 경화가 덜 되거나 생활이 불편해질 수 있어요. 교재 tip대로 **얇게 나눠 조형하고 순차 경화·핀 큐어**로 형태를 고정하세요.\n\n• 한 번에 두껍게 올리지 않기\n• 부분 경화로 형태 안정\n• 프리에지(끝)에 몰리지 않게 위치 점검\n\n⚠️ 안전: 젤 램프 광원 직시 금지, 제품별 경화 시간 준수.\n\n점검: 이 두께가 10팁 통일감과 착용감에 괜찮을까요?`,
        sources: sources.length
          ? sources
          : ["📖 NCS 입체 네일아트 p.31~33"],
        followUps: [
          "젤이 자꾸 퍼지는데 어떻게 하면 형태가 잡히나요?",
          "젤 램프 쓸 때 안전 수칙을 알려주세요.",
          "디자인을 확정할 때 무엇을 기준으로 판단해야 하나요?",
        ],
        counting: null,
      };
    }
    if (question.includes("2D") || question.includes("3D") || question.includes("다른")) {
      return {
        text: `**2D**는 젤을 손톱 위에 직접 올려 만드는 반입체 아트이고, **3D**는 밖에서 만들어 붙이는 입체 장식이에요.\n\n이번 수업 메인은 젤 2D 입체 조형·경화입니다. 젤은 반고형이라 볼륨을 주며 형태를 잡을 수 있어요.\n\n점검: 우리 조(${g.artist}) 요소를 2D로 옮길 때 두께는 어느 정도가 적당할까요?`,
        sources: sources.length
          ? sources
          : ["📖 NCS 입체 네일아트 p.29"],
        followUps: [
          "젤은 어떤 특성이 있어서 입체 조형이 가능한가요?",
          "이 두께로 조형해도 경화가 잘 될까요?",
          "우리 조 화가에 맞는 샘플 디자인을 보여주세요.",
        ],
        counting: null,
      };
    }
    if (question.includes("안전") || question.includes("램프")) {
      return {
        text: `젤 램프·위생 안전 수칙을 꼭 지켜 주세요.\n\n• 램프 광원을 눈으로 직접 보지 않기\n• 제품별 경화 시간 준수\n• 미경화 젤은 젤 클렌저로 처리\n• 마스크 착용·환기\n• 장식 두께·위치를 사전 점검\n\n점검: 지금 작업대 환기와 마스크 상태는 괜찮은가요?`,
        sources: sources.length
          ? sources
          : ["📖 NCS 입체 네일아트 p.31,34,38,43"],
        followUps: [
          "미경화 젤은 어떻게 처리하나요?",
          "이 두께로 조형해도 경화가 잘 될까요?",
          "입체 장식 위에 톱 젤은 어떻게 발라야 하나요?",
        ],
        counting: null,
      };
    }
  }

  if (mode === "lesson") {
    if (question.includes("1차시") || question.includes("마인드맵")) {
      return {
        text: `1차시에는 개념 이해, **화가 분석 마인드맵**(색감·선·질감·분위기·소재), AI 초안과 경우의 수 산출을 합니다.\n\n우리 조 배정 화가는 **${g.artist}** 이에요.\n\n점검: 마인드맵 다섯 항목 중 아직 비어 있는 칸이 있나요?`,
        sources: sources.length ? sources : ["📋 학습지도안 1차시"],
        followUps: [
          "베이스 컬러 5, 아트 기법 4, 입체 모티브 3이면 팁 디자인은 몇 가지예요?",
          "우리 조 화가에 맞는 샘플 디자인을 보여주세요.",
          "2차시에 무엇을 하나요?",
        ],
        counting: null,
      };
    }
    if (question.includes("발표") || question.includes("평가") || question.includes("상")) {
      return {
        text: `발표(약 2분) 순서: **재해석 스토리 → 경우의 수 근거 → AI 수정 과정**.\n\n평가 '상'은 AI 제안을 창의적으로 수정해 통일감 있는 10팁을 완성하고, 경우의 수를 정확히 적용·설명하는 수준이에요.\n\n점검: 발표 세 부분 중 가장 약한 부분은 어디인가요?`,
        sources: sources.length ? sources : ["📋 학습지도안 3차시"],
        followUps: [
          "활동지에 무엇을 기록해야 하나요?",
          "10팁을 하나의 컬렉션으로 보이게 배열하려면 어떻게 하나요?",
          "순서가 중요하지 않으면 순열 대신 무엇을 써야 하나요?",
        ],
        counting: null,
      };
    }
    if (question.includes("확정") || question.includes("활동지") || question.includes("기준")) {
      return {
        text: `디자인 확정 기준은 **제작 가능성 · 두께 · 위치 · 색 조화 · 통일감**입니다.\n\n활동지에는 AI 제안, 수정 이유, 경우의 수 근거, 담당 팁 계획을 적어요. 정답을 단정하지 말고 조에서 기준에 맞게 고르세요.\n\n점검: 다섯 기준 중 가장 걱정되는 항목은 무엇인가요?`,
        sources: sources.length ? sources : ["📋 학습지도안 2차시"],
        followUps: [
          "제 디자인 사진을 봐주세요.",
          "이 두께로 조형해도 경화가 잘 될까요?",
          "우리 조 화가에 맞는 샘플 디자인을 보여주세요.",
        ],
        counting: null,
      };
    }
  }

  // generic fallback
  const chunkHint =
    chunks[0]?.body.slice(0, 120) ??
    "교재에서 바로 매칭되는 항목이 적어요. 일반 수업 맥락으로만 안내할게요.";
  return {
    text: `${profile.name ? profile.name + " 학생, " : ""}질문을 수업 맥락에서 살펴볼게요.\n\n${chunkHint}${chunkHint.endsWith(".") ? "" : "…"}\n\n더 구체적으로 물어보시면 해당 단계(조형·경화·경우의 수·차시 안내)에 맞춰 짧게 도와드릴게요.\n\n점검: 지금 가장 궁금한 게 전공 실습인가요, 경우의 수인가요?`,
    sources: sources.length ? sources : ["📋 학습지도안"],
    followUps: [
      "이 두께로 조형해도 경화가 잘 될까요?",
      "베이스 컬러 5, 아트 기법 4, 입체 모티브 3이면 팁 디자인은 몇 가지예요?",
      "2차시에 우리 조가 해야 할 일이 뭔가요?",
    ],
    counting: null,
  };
}

export function mockDesignFeedback(artist: string): DesignFeedback {
  return {
    overall: `${artist} 분위기를 의식한 시도가 보여요. 정답은 없으니, 아래 기준으로 조에서 한 번 더 다듬어 보세요.`,
    rubric: [
      {
        name: "제작 가능성",
        level: "좋음",
        comment: "젤로 조형 가능한 형태로 보여요. 세밀한 부분은 브러시로 다듬으면 좋겠습니다.",
      },
      {
        name: "두께",
        level: "보통",
        comment: "입체감은 있으나 일부 구간이 두꺼워 보일 수 있어요. 얇게 나눠 경화해 보세요.",
      },
      {
        name: "위치",
        level: "보통",
        comment: "장식이 끝쪽으로 약간 쏠린 느낌이 있어요. 중앙~큐티클 쪽 균형을 점검해 주세요.",
      },
      {
        name: "색 조화",
        level: "좋음",
        comment: "베이스와 장식 색의 대비가 분명합니다. 10팁에서 같은 비율을 유지하면 좋겠어요.",
      },
      {
        name: "컬렉션 통일감",
        level: "보완필요",
        comment: "한 팁만 보면 괜찮지만, 10팁 전체 리듬은 조원과 맞춰 보시면 좋겠습니다.",
      },
    ],
    strengths: [
      "색 대비가 분명해 무대에서도 잘 드러날 가능성이 있어요.",
      "엠보 질감 시도가 수업 목표(젤 2D 입체)와 잘 맞습니다.",
    ],
    improvements: [
      "두꺼운 구간은 나눠 조형·핀 큐어로 고정하세요.",
      "장식 위치를 프리에지에서 조금 안쪽으로 조정해 보세요.",
      "10팁 공통 요소(라인 두께·모티브 크기)를 조에서 합의해 주세요.",
    ],
    checkQuestions: [
      "이 두께로 경화와 착용감이 괜찮을까요?",
      "장식이 팁 끝에 몰려 보이지는 않나요?",
      "10팁을 나란히 놓았을 때 화가의 분위기가 한눈에 읽히나요?",
    ],
    safetyNotes: [
      "젤 램프 광원을 직접 보지 마세요.",
      "미경화 젤은 젤 클렌저로 처리하세요.",
    ],
  };
}

export function mockDesignSpec(opts: {
  artist: string;
  baseColor: string;
  technique: string;
  motif: string;
  freeText?: string;
}): DesignSpec {
  return {
    concept: `${opts.artist} 분위기 — ${opts.baseColor} 베이스에 ${opts.motif}를 ${opts.technique}로 표현한 컬렉션`,
    tipPlan: `시그니처 팁 2~3개에 ${opts.motif} 강조, 나머지는 ${opts.baseColor} 단색·미세 디테일로 통일`,
    tipElements: [opts.baseColor, opts.technique, opts.motif],
    materials: ["베이스·컬러 젤", "엠보/튜브 젤", "젤 브러시", "젤 클렌저", "톱 젤", "젤 램프"],
    makeSteps: [
      "소독",
      `${opts.baseColor} 도포·경화`,
      `${opts.technique}로 ${opts.motif} 조형`,
      "부분 경화(핀 큐어)",
      "디테일",
      "톱 젤 마무리",
    ],
    countingBasis:
      opts.freeText?.includes("경우") || true
        ? "5×4×3=60가지 중 통일감·제작 가능성 기준으로 3안 압축"
        : "경우의 수로 후보를 좁힌 뒤 조별 협의로 확정",
    cautions: [
      "두께 1mm 전후 유지",
      "프리에지 몰림 방지",
      "작가 작품 직접 재현 금지 — 색·선·질감만 반영",
    ],
  };
}

export function mockSamplePayload(group: number) {
  return getSamplesForGroup(group);
}
