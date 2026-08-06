import type {
  CountingBreakdown,
  CountingError,
  CountingRequest,
  CountingResult,
  CountingStep,
} from "@/lib/types";

const MAX_N = 170;

function assertNonNegInt(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name}은(는) 0 이상의 정수여야 해요.`);
  }
}

export function factorial(n: number): bigint {
  assertNonNegInt(n, "n");
  if (n > MAX_N) {
    throw new Error("수업 범위를 벗어난 값이에요. n은 170 이하여야 합니다.");
  }
  let result = 1n;
  for (let i = 2; i <= n; i++) result *= BigInt(i);
  return result;
}

export function permutation(n: number, r: number): bigint {
  assertNonNegInt(n, "n");
  assertNonNegInt(r, "r");
  if (r > n) {
    throw new Error(`r(${r})은 n(${n})보다 클 수 없어요.`);
  }
  if (n > MAX_N) {
    throw new Error("수업 범위를 벗어난 값이에요. n은 170 이하여야 합니다.");
  }
  let result = 1n;
  for (let i = 0; i < r; i++) {
    result *= BigInt(n - i);
  }
  return result;
}

export function combination(n: number, r: number): bigint {
  assertNonNegInt(n, "n");
  assertNonNegInt(r, "r");
  if (r > n) {
    throw new Error(`r(${r})은 n(${n})보다 클 수 없어요.`);
  }
  if (n > MAX_N) {
    throw new Error("수업 범위를 벗어난 값이에요. n은 170 이하여야 합니다.");
  }
  const k = Math.min(r, n - r);
  let result = 1n;
  for (let i = 0; i < k; i++) {
    result = (result * BigInt(n - i)) / BigInt(i + 1);
  }
  return result;
}

function power(base: number, exp: number): bigint {
  assertNonNegInt(base, "밑");
  assertNonNegInt(exp, "지수");
  if (exp > 20 || base > 100) {
    throw new Error("수업 범위를 벗어난 거듭제곱이에요.");
  }
  let result = 1n;
  for (let i = 0; i < exp; i++) result *= BigInt(base);
  return result;
}

function evalStep(step: CountingStep): { expression: string; value: bigint } {
  switch (step.op) {
    case "factorial": {
      const n = step.n ?? 0;
      return { expression: `${n}!`, value: factorial(n) };
    }
    case "permutation": {
      const n = step.n ?? 0;
      const r = step.r ?? 0;
      return { expression: `${n}P${r}`, value: permutation(n, r) };
    }
    case "combination": {
      const n = step.n ?? 0;
      const r = step.r ?? 0;
      return { expression: `${n}C${r}`, value: combination(n, r) };
    }
    case "product": {
      const values = step.values ?? [];
      if (values.length === 0) throw new Error("곱할 값이 없어요.");
      const value = values.reduce((acc, v) => {
        assertNonNegInt(v, "값");
        return acc * BigInt(v);
      }, 1n);
      return { expression: values.join("×"), value };
    }
    case "sum": {
      const values = step.values ?? [];
      if (values.length === 0) throw new Error("더할 값이 없어요.");
      const value = values.reduce((acc, v) => {
        assertNonNegInt(v, "값");
        return acc + BigInt(v);
      }, 0n);
      return { expression: values.join("+"), value };
    }
    case "power": {
      const n = step.n ?? 0;
      const r = step.r ?? 0;
      return { expression: `${n}^${r}`, value: power(n, r) };
    }
    default:
      throw new Error("알 수 없는 연산이에요.");
  }
}

export function calculateCounting(
  req: CountingRequest
): CountingResult | CountingError {
  try {
    if (!req.steps?.length) {
      return { ok: false, error: "계산할 단계가 없어요." };
    }
    const breakdown: CountingBreakdown[] = [];
    const values: bigint[] = [];

    for (const step of req.steps) {
      const { expression, value } = evalStep(step);
      values.push(value);
      breakdown.push({
        label: step.label,
        expression,
        value: value.toString(),
      });
    }

    let total: bigint;
    if (req.combine === "single" || values.length === 1) {
      total = values[0];
    } else if (req.combine === "product") {
      total = values.reduce((a, b) => a * b, 1n);
    } else {
      total = values.reduce((a, b) => a + b, 0n);
    }

    return {
      ok: true,
      total: total.toString(),
      breakdown,
      combine: req.combine,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "계산 중 오류가 났어요.",
    };
  }
}

/** 질문 텍스트에서 자주 쓰는 식을 휴리스틱으로 감지 (MOCK/보조) */
export function detectCountingFromQuestion(
  question: string
): CountingRequest | null {
  const q = question.replace(/\s/g, "");

  const productMatch = q.match(/(\d+)[,×xX*](\d+)[,×xX*](\d+)/);
  if (
    productMatch &&
    (q.includes("몇") || q.includes("가지") || q.includes("곱"))
  ) {
    return {
      steps: [
        {
          op: "product",
          values: [
            Number(productMatch[1]),
            Number(productMatch[2]),
            Number(productMatch[3]),
          ],
          label: "디자인 요소 곱의 법칙",
        },
      ],
      combine: "single",
    };
  }

  const comb = q.match(/(\d+)\s*[CcＣｃ]\s*(\d+)/) || q.match(/(\d+)C(\d+)/);
  if (comb) {
    return {
      steps: [
        {
          op: "combination",
          n: Number(comb[1]),
          r: Number(comb[2]),
          label: "조합",
        },
      ],
      combine: "single",
    };
  }

  const perm = q.match(/(\d+)\s*[PpＰｐ]\s*(\d+)/) || q.match(/(\d+)P(\d+)/);
  if (perm) {
    return {
      steps: [
        {
          op: "permutation",
          n: Number(perm[1]),
          r: Number(perm[2]),
          label: "순열",
        },
      ],
      combine: "single",
    };
  }

  if (
    (q.includes("8") && q.includes("5") && (q.includes("고르") || q.includes("모티브"))) ||
    q.includes("후보모티브8") ||
    (q.includes("8개") && q.includes("5"))
  ) {
    return {
      steps: [{ op: "combination", n: 8, r: 5, label: "후보 모티브 선택" }],
      combine: "single",
    };
  }

  if (q.includes("5") && q.includes("4") && q.includes("3") && q.includes("가지")) {
    return {
      steps: [
        {
          op: "product",
          values: [5, 4, 3],
          label: "베이스×기법×모티브",
        },
      ],
      combine: "single",
    };
  }

  if (q.includes("10P3") || (q.includes("10") && q.includes("P3"))) {
    return {
      steps: [{ op: "permutation", n: 10, r: 3, label: "시그니처 팁 배치" }],
      combine: "single",
    };
  }

  if (q.includes("10C3") || (q.includes("10") && q.includes("C3"))) {
    return {
      steps: [{ op: "combination", n: 10, r: 3, label: "팁 선택(순서 무관)" }],
      combine: "single",
    };
  }

  if (q.includes("6P4") || (q.includes("6") && q.includes("P4"))) {
    return {
      steps: [{ op: "permutation", n: 6, r: 4, label: "포인트 배열" }],
      combine: "single",
    };
  }

  if (q.includes("빼면") && q.includes("컬러")) {
    return {
      steps: [
        {
          op: "product",
          values: [4, 4, 3],
          label: "컬러 1개 제외 후 곱의 법칙",
        },
      ],
      combine: "single",
    };
  }

  if (q.includes("후보") && q.includes("5") && q.includes("조합")) {
    return {
      steps: [{ op: "combination", n: 8, r: 5, label: "후보 중 5개 선택" }],
      combine: "single",
    };
  }

  return null;
}
