import { describe, expect, it } from "vitest";
import {
  Station,
  StationBoard,
  type Busy,
  type PickStation,
  type StationConfig,
} from "./station";
import { WorldPos, type Item } from "../shared/common";

const cfg: StationConfig = { dispatchMs: 100 };

const item = (id: number, processMs = 1000): Item => ({
  id,
  color: 0,
  size: 1,
  processMs,
});

const at = (x: number, y: number) => WorldPos(x, y);

describe("Station", () => {
  it("starts free", () => {
    const s = new Station();
    expect(s.isFree).toBe(true);
    expect(s.item).toBeNull();
    expect(s.state(0, cfg)).toEqual({ kind: "free" });
  });

  it("dispatch fills it; a second dispatch while busy is ignored", () => {
    const s = new Station();
    s.dispatch(item(1), at(10, 0), 0);
    s.dispatch(item(2), at(10, 0), 50);
    expect(s.item?.id).toBe(1);
  });

  it("arrival runs 0 → 1 over dispatchMs, keeping the source", () => {
    const s = new Station();
    s.dispatch(item(1), at(0, 0), 0);
    const busy = (now: number) => s.state(now, cfg) as Busy;
    expect(busy(0).arrival).toBe(0);
    expect(busy(50).arrival).toBeCloseTo(0.5);
    expect(busy(500).arrival).toBe(1);
    expect(busy(50).source).toEqual(at(0, 0));
  });

  it("progress and processedMs start once the item has arrived", () => {
    const s = new Station();
    s.dispatch(item(1, 1000), at(0, 0), 0);
    const busy = (now: number) => s.state(now, cfg) as Busy;
    expect(busy(50)).toMatchObject({ progress: 0, processedMs: 0 }); // still flying in
    expect(busy(100)).toMatchObject({ progress: 0, processedMs: 0 }); // processing starts at dispatchMs
    expect(busy(600)).toMatchObject({ progress: 0.5, processedMs: 500 });
    expect(busy(1100).progress).toBe(1);
  });

  it("reap frees the station only once the item is done", () => {
    const s = new Station();
    s.dispatch(item(1, 200), at(0, 0), 0); // processing window is [100, 300]
    expect(s.reap(299, cfg)).toBeNull(); // still processing
    expect(s.isFree).toBe(false);
    expect(s.reap(300, cfg)?.id).toBe(1); // done → the item is handed back
    expect(s.isFree).toBe(true);
    expect(s.item).toBeNull();
  });
});

describe("StationBoard", () => {
  const boardWith = (pick?: PickStation) =>
    new StationBoard([new Station(), new Station()], pick);

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

  it("reap frees every done station, returning items with their station's index", () => {
    const last: PickStation = (free) => free[free.length - 1];
    const board = boardWith(last);
    board.dispatch(item(1, 200), at(0, 0), 0); // → station 1
    board.dispatch(item(2, 200), at(0, 0), 0); // → station 0
    expect(board.reap(150, cfg)).toEqual([]);
    expect(board.hasFree).toBe(false);
    expect(
      board.reap(300, cfg).map(({ item, index }) => [item.id, index]),
    ).toEqual([
      [2, 0],
      [1, 1],
    ]);
    expect(board.hasFree).toBe(true);
  });
});
