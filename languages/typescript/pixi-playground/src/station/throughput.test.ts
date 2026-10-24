import { describe, expect, it } from "vitest";
import { Throughput } from "./throughput";

describe("Throughput", () => {
  it("is 0 before anything was observed over any time", () => {
    expect(new Throughput(300_000).perMinute(0, 60_000)).toBe(0);
  });

  it("warm-up: divides by the time seen so far, not the whole window", () => {
    const t = new Throughput(300_000);
    t.perMinute(0, 60_000);
    t.record(10_000);
    t.record(20_000);
    expect(t.perMinute(30_000, 60_000)).toBeCloseTo(4); // 2 in 30 s
  });

  it("steady rate over a full window", () => {
    const t = new Throughput(300_000);
    t.perMinute(0, 60_000);
    for (let at = 5_000; at <= 120_000; at += 5_000) t.record(at);
    expect(t.perMinute(120_000, 60_000)).toBeCloseTo(12); // one every 5 s
    expect(t.perMinute(120_000, 15_000)).toBeCloseTo(12); // same rate, shorter window
  });

  it("old completions slide out of the window", () => {
    const t = new Throughput(300_000);
    t.perMinute(0, 60_000);
    t.record(10_000);
    expect(t.perMinute(100_000, 60_000)).toBe(0);
  });

  it("windows are capped at what is retained", () => {
    const t = new Throughput(60_000);
    t.perMinute(0, 60_000);
    t.record(10_000);
    t.record(200_000); // drops the first one
    expect(t.perMinute(200_000, 300_000)).toBeCloseTo(1); // 1 in the 60 s kept
  });

  it("records quantities, counting one recorded at the very first observation", () => {
    const t = new Throughput(300_000);
    t.record(0, 2); // e.g. 2 parts taken at the first tick
    t.record(500, 1);
    expect(t.perMinute(1_000, 60_000)).toBeCloseTo(180); // 3 in 1 s
  });
});
