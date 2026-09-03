import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatRelativeDate } from "./date";

const NOW = new Date("2026-09-03T12:00:00Z");

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function minutesAgo(min: number): Date {
    return new Date(NOW.getTime() - min * 60_000);
  }

  it("reports under a minute as 'ahora mismo'", () => {
    expect(formatRelativeDate(minutesAgo(0))).toBe("ahora mismo");
  });

  it("reports minutes for anything under an hour", () => {
    expect(formatRelativeDate(minutesAgo(1))).toBe("hace 1 min");
    expect(formatRelativeDate(minutesAgo(59))).toBe("hace 59 min");
  });

  it("switches to hours at the 60-minute boundary", () => {
    expect(formatRelativeDate(minutesAgo(60))).toBe("hace 1 h");
    expect(formatRelativeDate(minutesAgo(23 * 60))).toBe("hace 23 h");
  });

  it("switches to 'ayer' at exactly one day", () => {
    expect(formatRelativeDate(minutesAgo(24 * 60))).toBe("ayer");
  });

  it("reports days for 2-6 days ago", () => {
    expect(formatRelativeDate(minutesAgo(3 * 24 * 60))).toBe("hace 3 días");
    expect(formatRelativeDate(minutesAgo(6 * 24 * 60))).toBe("hace 6 días");
  });

  it("falls back to a calendar date at 7+ days", () => {
    const result = formatRelativeDate(minutesAgo(7 * 24 * 60));
    expect(result).not.toMatch(/hace|ayer/);
  });
});
