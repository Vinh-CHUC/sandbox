import { describe, expect, it } from "vitest";
import { formatDuration, ordinal } from "./format";

describe("formatDuration", () => {
  it.each([
    [0, "0 s"],
    [42_000, "42 s"],
    [59_400, "59 s"],
    [60_000, "1 min"],
    [720_000, "12 min"],
    [3_600_000, "1 h"],
    [4_320_000, "1 h 12 min"],
    [-5_000, "0 s"],
  ])("%d ms → %s", (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});

describe("ordinal", () => {
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [112, "112th"],
  ])("%d → %s", (n, expected) => {
    expect(ordinal(n)).toBe(expected);
  });
});
