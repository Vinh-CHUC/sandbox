import { describe, expect, it } from "vitest";
import { SimMs, SkuId, WallMs, WorldPos, type Item } from "../shared/common";
import { Station, type Busy, type StationConfig } from "./station";

const cfg: StationConfig = { flightMs: 100 };
const item = (id: number): Item => ({ id, color: 0, size: 1 });
const at = (x: number, y: number) => WorldPos(x, y);
const sim = SimMs;
const wall = WallMs;
/** State at simulated `now` and wall time `w` */
const busy = (s: Station, now: number, w: number) =>
  s.state(sim(now), wall(w), cfg) as Busy;
/** Start a job at simulated and wall time 0 */
const started = (expectedMs: number | null = null) => {
  const s = new Station();
  s.start(item(1), at(5, 5), sim(0), wall(0), expectedMs);
  return s;
};

describe("Station", () => {
  it("starts free", () => {
    const s = new Station();
    expect(s.item).toBeNull();
    expect(s.state(sim(0), wall(0), cfg)).toEqual({ kind: "free" });
  });

  it("a job holds its item until it ends", () => {
    const s = started();
    expect(s.item?.id).toBe(1);
    expect(s.end().id).toBe(1);
    expect(s.item).toBeNull();
  });

  it("refuses a second job while busy, and ending while free", () => {
    expect(() => new Station().end()).toThrow();
    expect(() =>
      started().start(item(2), at(0, 0), sim(0), wall(0), null),
    ).toThrow();
  });

  it("the item flies in over flightMs of wall time, keeping its source", () => {
    const s = started();
    expect(busy(s, 0, 0).arrival).toBe(0);
    expect(busy(s, 0, 50).arrival).toBeCloseTo(0.5);
    expect(busy(s, 0, 1000).arrival).toBe(1);
    expect(busy(s, 0, 50).source).toEqual(at(5, 5));
  });

  it("progress runs over the expected duration in simulated time, null when unknown", () => {
    expect(busy(started(1000), 250, 0).progress).toBeCloseTo(0.25);
    expect(busy(started(1000), 5000, 0).progress).toBe(1); // overran: stays full
    expect(busy(started(null), 250, 0)).toMatchObject({
      progress: null,
      elapsedMs: 250,
    });
  });

  it("the two clocks are independent: fast playback finishes jobs, not fly-ins", () => {
    // An hour of simulated time in 40 ms of wall time (e.g. at a very high speed)
    const state = busy(started(30 * 60_000), 60 * 60_000, 40);
    expect(state.progress).toBe(1);
    expect(state.arrival).toBeCloseTo(0.4); // still flying in, at its own pace
    expect(state.shownMs).toBe(40); // so the heartbeat beats at its own pace too
  });

  it("parts are added to the running job", () => {
    const s = started();
    s.addParts({ inventory: 5, sku: SkuId(100), count: 2 });
    expect(busy(s, 0, 0).parts).toEqual([{ inventory: 5, sku: 100, count: 2 }]);
    s.end();
    expect(() =>
      s.addParts({ inventory: 5, sku: SkuId(100), count: 1 }),
    ).toThrow();
  });
});
