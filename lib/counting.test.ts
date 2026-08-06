import { describe, expect, it } from "vitest";
import {
  calculateCounting,
  combination,
  factorial,
  permutation,
} from "@/lib/counting";

describe("counting", () => {
  it("8C5 = 56", () => {
    expect(combination(8, 5).toString()).toBe("56");
  });
  it("10P3 = 720", () => {
    expect(permutation(10, 3).toString()).toBe("720");
  });
  it("6P4 = 360", () => {
    expect(permutation(6, 4).toString()).toBe("360");
  });
  it("5×4×3 = 60", () => {
    const r = calculateCounting({
      steps: [{ op: "product", values: [5, 4, 3], label: "곱" }],
      combine: "single",
    });
    expect(r.ok && r.total).toBe("60");
  });
  it("0! = 1", () => {
    expect(factorial(0).toString()).toBe("1");
  });
  it("nC0 = 1", () => {
    expect(combination(10, 0).toString()).toBe("1");
  });
  it("nCr = nC(n-r)", () => {
    expect(combination(8, 5).toString()).toBe(combination(8, 3).toString());
  });
  it("rejects r > n", () => {
    const r = calculateCounting({
      steps: [{ op: "combination", n: 3, r: 5, label: "bad" }],
      combine: "single",
    });
    expect(r.ok).toBe(false);
  });
});
