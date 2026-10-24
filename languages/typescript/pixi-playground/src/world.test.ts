import { describe, expect, it } from "vitest";
import { ScreenPos, SimMs, SkuId, WallMs } from "./shared/common";
import type { Projection } from "./shared/projection";
import type { Trace, TraceEvent } from "./trace/trace";
import { World } from "./world";

const P = SkuId(100);
const MIN = 60_000;
/** `n` minutes into the trace, in simulated time */
const min = (n: number) => SimMs(n * MIN);
/** Wall time doesn't matter to what the world holds, only to how it's animated */
const WALL = WallMs(0);

/**
 * queue 1 → station 10 → queue 2, inventory 5 stocking SKU 100 (as in data/'s validator tests):
 * item 2 overtakes item 1, gets processed taking 2 × SKU 100, then lands in queue 2.
 */
const events: TraceEvent[] = [
  { kind: "stock", seq: 0, t: min(0), inventory: 5, sku: P, count: 3 },
  { kind: "queue_enter", seq: 1, t: min(0), item: 1, queue: 1, index: 0 },
  { kind: "queue_enter", seq: 2, t: min(0), item: 2, queue: 1, index: 1 },
  { kind: "queue_move", seq: 3, t: min(5), item: 2, queue: 1, index: 0 },
  { kind: "queue_leave", seq: 4, t: min(10), item: 2, queue: 1 },
  {
    kind: "station_start",
    seq: 5,
    t: min(10),
    job: 1,
    item: 2,
    station: 10,
    expectedMs: null,
  },
  {
    kind: "consumption",
    seq: 6,
    t: min(10),
    job: 1,
    inventory: 5,
    sku: P,
    count: 2,
  },
  { kind: "stock", seq: 7, t: min(10), inventory: 5, sku: P, count: 1 },
  { kind: "station_end", seq: 8, t: min(30), job: 1 },
  { kind: "queue_enter", seq: 9, t: min(30), item: 2, queue: 2, index: 0 },
];

const trace = (evs: TraceEvent[] = events): Trace => ({
  topology: {
    sites: [1],
    queues: [
      { id: 1, site: 1 },
      { id: 2, site: 1 },
    ],
    stations: [{ id: 10, site: 1 }],
    inventories: [{ id: 5, site: 1 }],
    skus: [P],
    inventorySkus: new Map([[5, [P]]]),
    edges: [
      { from: { kind: "queue", id: 1 }, to: { kind: "station", id: 10 } },
      { from: { kind: "station", id: 10 }, to: { kind: "queue", id: 2 } },
    ],
  },
  events: evs,
  labels: new Map(),
  startUnixMs: 0,
  endMs: min(60),
});

describe("World", () => {
  it("draws site fences, the grid, then one container per inventory, queue and station", () => {
    expect(new World(trace()).root.children).toHaveLength(1 + 1 + 1 + 2 + 1);
  });

  it("tick replays the trace up to `now`", () => {
    const world = new World(trace());
    world.tick(min(0), WALL);
    expect(world.queueItems(1)).toEqual([1, 2]);
    expect(world.stock(5, P)).toBe(3);

    world.tick(min(5), WALL); // re-prioritised
    expect(world.queueItems(1)).toEqual([2, 1]);

    world.tick(min(10), WALL); // admitted, taking its parts
    expect(world.queueItems(1)).toEqual([1]);
    expect(world.stationItem(10)).toBe(2);
    expect(world.stock(5, P)).toBe(1);
    expect(world.skuThroughput(5, P, min(10))).toBeCloseTo(2 / 10); // 2 in 10 min

    world.tick(min(30), WALL); // done, on to the next queue
    expect(world.stationItem(10)).toBeNull();
    expect(world.queueItems(2)).toEqual([2]);
    expect(world.throughput(10, min(30))).toBeCloseTo(1 / 30); // 1 in 30 min
  });

  it("fails loudly on events the trace can't have", () => {
    const unknownQueue = trace([
      { kind: "queue_enter", seq: 0, t: min(0), item: 1, queue: 9, index: 0 },
    ]);
    expect(() => new World(unknownQueue).tick(min(0), WALL)).toThrow(
      "unknown queue 9",
    );
    const notRunning = trace([
      { kind: "station_end", seq: 0, t: min(0), job: 4 },
    ]);
    expect(() => new World(notRunning).tick(min(0), WALL)).toThrow(
      "job 4 isn't running",
    );
  });

  it("panning moves the whole drawing, and survives a projection change", () => {
    const world = new World(trace());
    world.panBy(ScreenPos(30, -10));
    world.panBy(ScreenPos(5, 5));
    expect([world.root.x, world.root.y]).toEqual([35, -5]);
    const iso: Projection = {
      kind: "iso",
      scale: 1,
      offset: ScreenPos(100, 0),
    };
    world.setProjection(iso);
    expect([world.root.x, world.root.y]).toEqual([135, -5]);
    world.resetView();
    expect([world.root.x, world.root.y]).toEqual([100, 0]);
  });

  it("zooms around a point, keeping what's under it in place", () => {
    const world = new World(trace());
    world.panBy(ScreenPos(10, 20));
    // The world point under screen (110, 220) before zooming…
    const under = (sx: number, sy: number) => [
      (sx - world.root.x) / world.zoom,
      (sy - world.root.y) / world.zoom,
    ];
    const before = under(110, 220);
    world.zoomBy(2, ScreenPos(110, 220));
    expect(world.zoom).toBe(2);
    expect(world.root.scale.x).toBe(2);
    expect(under(110, 220)).toEqual(before); // …is still under it
  });

  it("clamps zoom, and resetView restores pan and zoom", () => {
    const world = new World(trace());
    world.zoomBy(1000, ScreenPos(0, 0));
    expect(world.zoom).toBe(4);
    world.zoomBy(0.0001, ScreenPos(0, 0));
    expect(world.zoom).toBe(0.25);
    world.panBy(ScreenPos(5, 5));
    world.resetView();
    expect([world.zoom, world.root.x, world.root.y]).toEqual([1, 0, 0]);
  });
});
