import { describe, expect, it } from "vitest";
import { SimClock } from "./clock";

describe("SimClock", () => {
  it("starts at 0, at real-time speed", () => {
    const clock = new SimClock();
    expect([clock.now, clock.speed, clock.paused]).toEqual([0, 1, false]);
    expect(clock.advance(16)).toBe(16);
  });

  it("scales real time by the speed", () => {
    const clock = new SimClock();
    clock.faster(); // 2×
    expect(clock.advance(10)).toBe(20);
    clock.slower();
    clock.slower(); // 0.5×
    expect(clock.advance(10)).toBe(25);
  });

  it("stands still while paused, and resumes from where it stopped", () => {
    const clock = new SimClock();
    clock.advance(10);
    clock.togglePause();
    expect(clock.advance(1000)).toBe(10);
    clock.togglePause();
    expect(clock.advance(5)).toBe(15);
  });

  it("speed steps are clamped at both ends", () => {
    const clock = new SimClock();
    for (let i = 0; i < 10; i++) clock.faster();
    expect(clock.speed).toBe(4);
    for (let i = 0; i < 10; i++) clock.slower();
    expect(clock.speed).toBe(0.25);
  });

  it("takes its own speeds, e.g. much faster for hours-long traces", () => {
    const clock = new SimClock([1, 60, 600], 60);
    expect(clock.advance(1000)).toBe(60_000); // a real second is a simulated minute
    clock.faster();
    expect(clock.speed).toBe(600);
    expect(() => new SimClock([1, 2], 3)).toThrow(RangeError);
  });
});
