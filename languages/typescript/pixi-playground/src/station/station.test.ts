import { describe, expect, it } from "vitest";
import {
  Station,
  StationBoard,
  mixColor,
  type PickStation,
  type StationConfig,
} from "./station";
import type { Item } from "../queue/model/utils";

const cfg: StationConfig = {
  dispatchMs: 100,
  heartbeatMs: 400,
  alphaMin: 0.3,
  alphaMax: 1,
  fromColor: 0xff0000,
  toColor: 0x00ff00,
  margin: 8,
  padColor: 0x000000,
};

const item = (id: number, processMs = 1000): Item => ({
  id,
  color: 0,
  size: 1,
  processMs,
});

const at = (x: number, y: number) => ({ x, y });

describe("Station", () => {
  it("starts free", () => {
    const s = new Station(at(0, 0));
    expect(s.isFree).toBe(true);
    expect(s.item).toBeNull();
  });

  it("dispatch fills it; a second dispatch while busy is ignored", () => {
    const s = new Station(at(0, 0));
    s.dispatch(item(1), at(10, 0), 0);
    s.dispatch(item(2), at(10, 0), 50);
    expect(s.item?.id).toBe(1);
  });

  it("position tweens from source to target during dispatch", () => {
    const s = new Station(at(100, 0));
    s.dispatch(item(1), at(0, 0), 0);
    expect(s.position(0, cfg)).toEqual({ x: 0, y: 0 }); // no jump
    expect(s.position(50, cfg).x).toBeCloseTo(50); // smoothstep(0.5) = 0.5
    expect(s.position(100, cfg)).toEqual({ x: 100, y: 0 }); // arrived
    expect(s.position(500, cfg)).toEqual({ x: 100, y: 0 }); // stays put
  });

  it("progress runs 0 → 1 over the item's own processMs, after dispatch", () => {
    const s = new Station(at(0, 0));
    s.dispatch(item(1, 1000), at(0, 0), 0);
    expect(s.progress(100, cfg)).toBe(0); // processing starts at dispatchMs
    expect(s.progress(600, cfg)).toBeCloseTo(0.5);
    expect(s.progress(1100, cfg)).toBe(1);
  });

  it("isDone at the exact end of the processing window", () => {
    const s = new Station(at(0, 0));
    s.dispatch(item(1, 200), at(0, 0), 0); // window is [100, 300]
    expect(s.isDone(299, cfg)).toBe(false);
    expect(s.isDone(300, cfg)).toBe(true);
  });

  it("alpha beats between alphaMin and alphaMax", () => {
    const s = new Station(at(0, 0));
    s.dispatch(item(1), at(0, 0), 0);
    expect(s.alpha(100, cfg)).toBeCloseTo(0.3); // trough
    expect(s.alpha(300, cfg)).toBeCloseTo(1); // peak
    expect(s.alpha(500, cfg)).toBeCloseTo(0.3); // trough again
  });

  it("stays visible while still dispatching (never below alphaMin)", () => {
    const s = new Station(at(0, 0));
    s.dispatch(item(1), at(0, 0), 0); // processing starts at dispatchMs = 100
    expect(s.alpha(0, cfg)).toBeGreaterThanOrEqual(cfg.alphaMin);
    expect(s.alpha(50, cfg)).toBeGreaterThanOrEqual(cfg.alphaMin);
  });

  it("color blends fromColor → toColor by progress", () => {
    const s = new Station(at(0, 0));
    s.dispatch(item(1, 1000), at(0, 0), 0);
    expect(s.color(100, cfg)).toBe(0xff0000); // 0 → red
    expect(s.color(600, cfg)).toBe(0x808000); // 0.5 → muddy midpoint
    expect(s.color(1100, cfg)).toBe(0x00ff00); // 1 → green
  });

  it("reap frees the station only once the item is done", () => {
    const s = new Station(at(0, 0));
    s.dispatch(item(1, 200), at(0, 0), 0);
    expect(s.reap(200, cfg)).toBe(false); // still processing
    expect(s.isFree).toBe(false);
    expect(s.reap(300, cfg)).toBe(true); // done → item disappears
    expect(s.isFree).toBe(true);
    expect(s.item).toBeNull();
  });
});

describe("StationBoard", () => {
  const boardWith = (pick?: PickStation) =>
    new StationBoard([new Station(at(0, 0)), new Station(at(100, 0))], pick);

  it("hasFree follows the stations", () => {
    const board = boardWith();
    expect(board.hasFree).toBe(true);
    board.dispatch(item(1), at(0, 0), 0);
    board.dispatch(item(2), at(0, 0), 0);
    expect(board.hasFree).toBe(false);
  });

  it("dispatch returns false when every station is busy", () => {
    const board = boardWith();
    board.dispatch(item(1), at(0, 0), 0);
    board.dispatch(item(2), at(0, 0), 0);
    expect(board.dispatch(item(3), at(0, 0), 0)).toBe(false);
  });

  it("uses the injected pick policy", () => {
    const last: PickStation = (free) => free[free.length - 1];
    const board = boardWith(last);
    board.dispatch(item(1), at(0, 0), 0);
    expect(board.stations[0].isFree).toBe(true); // first skipped
    expect(board.stations[1].item?.id).toBe(1);
  });

  it("reap frees every done station", () => {
    const board = boardWith();
    board.dispatch(item(1, 200), at(0, 0), 0);
    board.dispatch(item(2, 200), at(0, 0), 0);
    board.reap(150, cfg);
    expect(board.hasFree).toBe(false);
    board.reap(300, cfg);
    expect(board.hasFree).toBe(true);
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
