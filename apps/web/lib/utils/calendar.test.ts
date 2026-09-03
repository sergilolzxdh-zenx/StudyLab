import { describe, expect, it } from "vitest";
import { capitalizeFirst, getMonthGrid, toDateKey } from "./calendar";

describe("capitalizeFirst", () => {
  it("uppercases only the first letter", () => {
    expect(capitalizeFirst("septiembre")).toBe("Septiembre");
    expect(capitalizeFirst("lunes")).toBe("Lunes");
  });

  it("leaves an already-capitalized string unchanged", () => {
    expect(capitalizeFirst("Enero")).toBe("Enero");
  });
});

describe("toDateKey", () => {
  it("formats as YYYY-MM-DD with zero-padding", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toDateKey(new Date(2026, 8, 3))).toBe("2026-09-03");
  });

  it("pads single-digit months and days", () => {
    expect(toDateKey(new Date(2026, 10, 25))).toBe("2026-11-25");
  });
});

describe("getMonthGrid", () => {
  it("always returns exactly 42 cells (6 Monday-start weeks)", () => {
    // September 2026 starts on a Tuesday, February 2026 starts on a Sunday —
    // different first weekdays exercise different amounts of lead-in padding.
    expect(getMonthGrid(2026, 8)).toHaveLength(42);
    expect(getMonthGrid(2026, 1)).toHaveLength(42);
  });

  it("starts the grid on a Monday", () => {
    const grid = getMonthGrid(2026, 8); // September 2026
    expect(grid[0].getDay()).toBe(1); // 1 = Monday
  });

  it("includes every day of the target month in order", () => {
    const grid = getMonthGrid(2026, 8); // September 2026 has 30 days
    const septemberDays = grid.filter((d) => d.getMonth() === 8);
    expect(septemberDays).toHaveLength(30);
    expect(septemberDays[0].getDate()).toBe(1);
    expect(septemberDays[29].getDate()).toBe(30);
  });

  it("produces consecutive calendar days with no gaps or jumps", () => {
    const grid = getMonthGrid(2026, 8);
    for (let i = 1; i < grid.length; i++) {
      const diffDays = (grid[i].getTime() - grid[i - 1].getTime()) / 86_400_000;
      expect(diffDays).toBe(1);
    }
  });
});
