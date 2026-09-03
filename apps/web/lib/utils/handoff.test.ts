import { describe, expect, it } from "vitest";
import { setHandoffText, takeHandoffText } from "./handoff";

// Runs in a plain Node environment with no `sessionStorage` global — this is
// exactly the SSR condition the try/catch in handoff.ts is meant to survive.
describe("handoff without sessionStorage (SSR-like environment)", () => {
  it("setHandoffText does not throw when sessionStorage is unavailable", () => {
    expect(() => setHandoffText("some text")).not.toThrow();
  });

  it("takeHandoffText returns null instead of throwing", () => {
    expect(takeHandoffText()).toBeNull();
  });
});
