import { describe, expect, it } from "vitest";
import { clamp01, mixColor, smoothstep } from "./common";

describe("clamp01", () => {
  it.each([
    [0, 0],
    [0.25, 0.25],
    [1, 1],
    [1.4, 1],
  ])("clamp01(%d) = %d", (x, expected) => {
    expect(clamp01(x)).toBe(expected);
  });

  it("throws on negatives", () => {
    expect(() => clamp01(-0.2)).toThrow(RangeError);
  });
});

describe("smoothstep", () => {
  it.each([
    [0, 0],
    [0.25, 0.15625],
    [0.5, 0.5],
    [0.75, 0.84375],
    [1, 1],
  ])("smoothstep(%d) = %d", (x, expected) => {
    expect(smoothstep(x)).toBeCloseTo(expected);
  });

  it("goes wild outside [0, 1], hence clamp01", () => {
    expect(smoothstep(1.4)).toBeCloseTo(0.392); // would drift back
    expect(smoothstep(2)).toBe(-4);
  });
});

describe("mixColor", () => {
  it.each([
    [0, 0xff0000],
    [0.5, 0x808000],
    [1, 0x00ff00],
  ])("blends red→green at %d to %d", (t, expected) => {
    expect(mixColor(0xff0000, 0x00ff00, t)).toBe(expected);
  });
});
