import { describe, expect, it } from "vitest";
import { SimMs } from "../shared/common";
import { formatRate, Throughput } from "./throughput";

/** Throughput runs on simulated time */
const s = SimMs;

describe("Throughput", () => {
  it("is 0 before anything was observed over any time", () => {
    expect(new Throughput(300_000).perMinute(s(0), 60_000)).toBe(0);
  });

  it("warm-up: divides by the time seen so far, not the whole window", () => {
    const t = new Throughput(300_000);
    t.perMinute(s(0), 60_000);
    t.record(s(10_000));
    t.record(s(20_000));
    expect(t.perMinute(s(30_000), 60_000)).toBeCloseTo(4); // 2 in 30 s
  });

  it("steady rate over a full window", () => {
    const t = new Throughput(300_000);
    t.perMinute(s(0), 60_000);
    for (let at = 5_000; at <= 120_000; at += 5_000) t.record(s(at));
    expect(t.perMinute(s(120_000), 60_000)).toBeCloseTo(12); // one every 5 s
    expect(t.perMinute(s(120_000), 15_000)).toBeCloseTo(12); // same rate, shorter window
  });

  it("old completions slide out of the window", () => {
    const t = new Throughput(300_000);
    t.perMinute(s(0), 60_000);
    t.record(s(10_000));
    expect(t.perMinute(s(100_000), 60_000)).toBe(0);
  });

  it("windows are capped at what is retained", () => {
    const t = new Throughput(60_000);
    t.perMinute(s(0), 60_000);
    t.record(s(10_000));
    t.record(s(200_000)); // drops the first one
    expect(t.perMinute(s(200_000), 300_000)).toBeCloseTo(1); // 1 in the 60 s kept
  });

  it("records quantities, counting one recorded at the very first observation", () => {
    const t = new Throughput(300_000);
    t.record(s(0), 2); // e.g. 2 parts taken at the first tick
    t.record(s(500), 1);
    expect(t.perMinute(s(1_000), 60_000)).toBeCloseTo(180); // 3 in 1 s
  });
});

describe("formatRate", () => {
  it.each([
    [4.2, "4.2 / min"],
    [1, "1.0 / min"],
    [0.025, "1.5 / h"], // a job every 40 min: would read "0.0 / min"
    [1 / 60, "1.0 / h"],
    [0.001, "1.4 / day"],
    [0.0000001, "0.0 / day"], // slower than that still says per day
    [0, "0"],
  ])("%d per minute → %s", (perMinute, expected) => {
    expect(formatRate(perMinute)).toBe(expected);
  });
});
