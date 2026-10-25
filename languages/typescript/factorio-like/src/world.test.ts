import { describe, expect, it } from "vitest";
import { ScreenPos, SimMs, SkuId, WallMs } from "./shared/common";
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
    itemTypes: [],
    itemType: new Map(),
    roads: [],
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

  it("ships stock along a road: the source drops, the stack moves along, the far end gets it", () => {
    const base = trace();
    const roadTrace: Trace = {
      ...base,
      topology: {
        ...base.topology,
        inventories: [...base.topology.inventories, { id: 6, site: 1 }],
        inventorySkus: new Map([
          [5, [P]],
          [6, [P]],
        ]),
        roads: [{ id: 1, a: 5, b: 6, length: 20 }],
      },
      events: [
        ...events,
        {
          kind: "road_enter",
          seq: 10,
          t: min(30),
          shipment: 1,
          road: 1,
          from: 5,
          sku: P,
          count: 1,
          speed: 2,
        },
        { kind: "stock", seq: 11, t: min(30), inventory: 5, sku: P, count: 0 },
        { kind: "road_leave", seq: 12, t: min(40), shipment: 1 },
        { kind: "stock", seq: 13, t: min(40), inventory: 6, sku: P, count: 1 },
      ],
    };
    const world = new World(roadTrace);
    world.tick(min(35), WALL);
    expect(world.stock(5, P)).toBe(0);
    expect(world.roadShipments(1, min(35))).toEqual([[1, 0.5]]); // 10 of 20 cells, at 2 a minute
    expect(world.kpis(min(35))).toMatchObject({ inTransit: 1, transferred: 0 });
    world.tick(min(40), WALL);
    expect(world.roadShipments(1, min(40))).toEqual([]);
    expect(world.stock(6, P)).toBe(1);
    expect(world.kpis(min(40))).toMatchObject({ inTransit: 0, transferred: 1 });
    expect(new World(trace()).kpis(min(0)).inTransit).toBeNull(); // no roads
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
    const framed = { x: world.root.x, y: world.root.y }; // where the projection frames it
    world.panBy(ScreenPos(30, -10));
    world.panBy(ScreenPos(5, 5));
    expect([world.root.x - framed.x, world.root.y - framed.y]).toEqual([
      35, -5,
    ]);
    world.setProjection({ kind: "isometric", scale: 1 });
    world.resetView();
    const isoFramed = { x: world.root.x, y: world.root.y };
    expect(isoFramed).not.toEqual(framed); // each projection frames the scene its own way
    world.panBy(ScreenPos(35, -5));
    world.setProjection({ kind: "trimetric", scale: 1 });
    world.setProjection({ kind: "isometric", scale: 1 });
    expect([world.root.x - isoFramed.x, world.root.y - isoFramed.y]).toEqual([
      35, -5,
    ]);
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
    world.resetView();
    const framed = [world.root.x, world.root.y];
    world.zoomBy(2, ScreenPos(100, 100));
    world.panBy(ScreenPos(5, 5));
    world.resetView();
    expect([world.zoom, world.root.x, world.root.y]).toEqual([1, ...framed]);
  });

  it("KPIs: waiting, blocked, median wait, items moving on vs leaving", () => {
    const blocked: TraceEvent = {
      kind: "item_status",
      seq: 3.5,
      t: min(5),
      item: 1,
      status: 1,
    };
    const world = new World(
      trace([...events.slice(0, 4), blocked, ...events.slice(4)]),
    );
    world.tick(min(5), WALL);
    expect(world.kpis(min(5))).toMatchObject({
      waiting: 2,
      blocked: 1,
      medianWaitMs: null,
    });

    world.tick(min(10), WALL); // item 2 leaves queue 1 after 10 min
    expect(world.kpis(min(10))).toMatchObject({
      waiting: 1,
      medianWaitMs: 10 * MIN,
    });

    world.tick(min(30), WALL); // item 2 finishes, into queue 2: a store (it feeds nothing), so done
    expect(world.kpis(min(30))).toMatchObject({
      done: 1,
      waiting: 1,
      blocked: 1,
      ready: 1,
    });
  });

  it("an item finishing a job and going nowhere has left: done", () => {
    const world = new World(trace(events.slice(0, -1))); // without the final queue_enter
    world.tick(min(30), WALL);
    expect(world.kpis(min(30))).toMatchObject({ done: 1, waiting: 1 });
  });

  it("describes a queued item: how long it's waited, where, and if it's stuck", () => {
    const blocked: TraceEvent = {
      kind: "item_status",
      seq: 3.5,
      t: min(5),
      item: 1,
      status: 1,
    };
    const world = new World(
      trace([...events.slice(0, 4), blocked, ...events.slice(4)]),
      {
        labels: {
          kinds: { item: { one: "Widget", many: "Widgets" } },
          names: { queues: { "1": "Intake" } },
        },
      },
    );
    world.tick(min(12), WALL);
    expect(world.describeQueued(1, 1, min(12))).toBe(
      "Widget 1\nwaiting 12 min · 1st in Intake\nblocked",
    );
    expect(world.describeQueued(2, 1, min(12))).toBeNull(); // it's at the station by then
  });

  it("counts an item that leaves and comes back as done, even within one big tick", () => {
    const back: TraceEvent[] = [
      ...events.slice(0, -1), // item 2 leaves the world at 30 min…
      { kind: "queue_enter", seq: 9, t: min(50), item: 2, queue: 1, index: 1 }, // …and is back
    ];
    const world = new World(trace(back));
    world.tick(min(60), WALL); // all of it in a single tick
    expect(world.kpis(min(60)).done).toBe(1);
    expect(world.queueItems(1)).toEqual([1, 2]);
  });

  it("a queue feeding no station is a store: items in it are done, and ready", () => {
    // Queue 2 feeds nothing: with the store at the end, item 2 lands there after station 10
    const world = new World(trace());
    world.tick(min(30), WALL);
    expect(world.queueItems(2)).toEqual([2]);
    expect(world.kpis(min(30))).toMatchObject({
      done: 1,
      waiting: 1,
      ready: 1,
      readyShare: 0.5,
    });

    // …and leaving it, back to queue 1, is a move along the store → queue 1 edge
    const back: TraceEvent[] = [
      { kind: "queue_leave", seq: 10, t: min(40), item: 2, queue: 2 },
      { kind: "queue_enter", seq: 11, t: min(40), item: 2, queue: 1, index: 1 },
    ];
    const again = new World(trace([...events, ...back]));
    again.tick(min(40), WALL);
    expect(again.queueItems(2)).toEqual([]);
    expect(again.queueItems(1)).toEqual([1, 2]);
    expect(again.kpis(min(40))).toMatchObject({
      done: 1,
      ready: 0,
      waiting: 2,
    });
  });

  it("a blocked item's tooltip says which parts it's short of", () => {
    const short: TraceEvent[] = [
      {
        kind: "item_shortage",
        seq: 3.2,
        t: min(5),
        item: 1,
        inventory: 5,
        sku: P,
        missing: 2,
      },
      { kind: "item_status", seq: 3.4, t: min(5), item: 1, status: 1 },
    ];
    const world = new World(
      trace([...events.slice(0, 4), ...short, ...events.slice(4)]),
      {
        labels: {
          states: { "1": "awaiting parts" },
          names: { skus: { "100": "bolt" } },
        },
      },
    );
    world.tick(min(6), WALL);
    expect(world.describeQueued(1, 1, min(6))).toBe(
      "Item 1\nwaiting 6 min · 2nd in Queue 1\nawaiting parts: bolt ×2",
    );
  });

  it("names an item with its type, when it has one", () => {
    const base = trace();
    const typed: Trace = {
      ...base,
      topology: {
        ...base.topology,
        itemTypes: [7, 8],
        itemType: new Map([[1, 8]]),
      },
    };
    const world = new World(typed, {
      labels: { names: { item_types: { "8": "Model B" } } },
    });
    world.tick(min(1), WALL);
    expect(world.describeQueued(1, 1, min(1))?.split("\n")[0]).toBe(
      "Item 1 · Model B",
    );
  });
});
