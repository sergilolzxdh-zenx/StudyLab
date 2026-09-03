import { describe, expect, it } from "vitest";
import { PLAN_LABEL, PLAN_POWERMONEY } from "./plans";

describe("PLAN_POWERMONEY", () => {
  it("increases strictly from free to pro", () => {
    expect(PLAN_POWERMONEY.pro).toBeGreaterThan(PLAN_POWERMONEY.free);
  });

  it("makes premium unlimited", () => {
    expect(PLAN_POWERMONEY.premium).toBe(Number.POSITIVE_INFINITY);
  });

  it("gives every plan a finite, positive limit except premium", () => {
    expect(Number.isFinite(PLAN_POWERMONEY.free)).toBe(true);
    expect(Number.isFinite(PLAN_POWERMONEY.pro)).toBe(true);
    expect(PLAN_POWERMONEY.free).toBeGreaterThan(0);
    expect(PLAN_POWERMONEY.pro).toBeGreaterThan(0);
  });
});

describe("PLAN_LABEL", () => {
  it("has a human label for every plan key in PLAN_POWERMONEY", () => {
    for (const plan of Object.keys(PLAN_POWERMONEY)) {
      expect(PLAN_LABEL[plan as keyof typeof PLAN_LABEL]).toBeTruthy();
    }
  });
});
