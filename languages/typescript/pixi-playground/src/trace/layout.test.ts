import { describe, expect, it } from "vitest";
import { SkuId } from "../shared/common";
import { DEFAULT_LAYOUT, placeTopology } from "./layout";
import { NO_SITE, type Edge, type NodeKind, type Topology } from "./trace";

const edge = (fk: NodeKind, fi: number, tk: NodeKind, ti: number): Edge => ({
  from: { kind: fk, id: fi },
  to: { kind: tk, id: ti },
});

/**
 * Two sites, each: queue → 2 stations → queue → 1 station. Site 1 has an inventory per queue,
 * each supplying that queue's stations; site 2 has one inventory supplying nothing.
 */
const topology: Topology = {
  sites: [1, 2],
  queues: [1, 2, 3, 4].map((id) => ({ id, site: id <= 2 ? 1 : 2 })),
  stations: [10, 11, 12, 20, 21, 22].map((id) => ({
    id,
    site: id < 20 ? 1 : 2,
  })),
  inventories: [
    { id: 1, site: 1 },
    { id: 2, site: 1 },
    { id: 3, site: 2 },
  ],
  skus: [100, 200, 300].map(SkuId),
  itemTypes: [],
  itemType: new Map(),
  inventorySkus: new Map([
    [1, [100, 200, 300].map(SkuId)],
    [2, [100, 200].map(SkuId)],
    [3, [100].map(SkuId)],
  ]),
  // Site 1 listed downstream first, to check the order comes from the edges, not the ids
  edges: [
    edge("queue", 2, "station", 12),
    edge("station", 10, "queue", 2),
    edge("station", 11, "queue", 2),
    edge("queue", 1, "station", 10),
    edge("queue", 1, "station", 11),
    edge("queue", 3, "station", 20),
    edge("queue", 3, "station", 21),
    edge("station", 20, "queue", 4),
    edge("queue", 4, "station", 22),
    // Listed out of order on purpose: placement follows the stations, not the edge order
    edge("inventory", 2, "station", 12),
    edge("inventory", 1, "station", 10),
    edge("inventory", 1, "station", 11),
  ],
};

describe("placeTopology", () => {
  const p = placeTopology(topology);
  const q = (id: number) => p.queues.get(id)!;
  const s = (id: number) => p.stations.get(id)!;
  const belt =
    DEFAULT_LAYOUT.beltLength * DEFAULT_LAYOUT.box + 7 * DEFAULT_LAYOUT.gap;

  it("flows left to right along the edges: queue, its stations, the next queue…", () => {
    expect(s(10).x).toBeGreaterThan(q(1).x); // stations right of their belt's head
    expect(q(2).x - belt).toBeGreaterThan(s(10).x); // next belt starts after them
    expect(s(12).x).toBeGreaterThan(q(2).x);
  });

  it("stacks a queue's stations, centred on its belt", () => {
    expect(s(10).x).toBe(s(11).x);
    expect(s(11).y - s(10).y).toBe(DEFAULT_LAYOUT.stationSpacing);
    expect((s(10).y + s(11).y) / 2).toBeCloseTo(q(1).y);
  });

  it("puts each inventory under the belt of the stations it supplies", () => {
    const inv = (id: number) => p.inventories.get(id)!;
    expect(inv(1).y).toBeGreaterThan(Math.max(s(10).y, s(11).y, s(12).y));
    expect(inv(1).x).toBe(q(1).x - belt); // under queue 1's belt, feeding stations 10 and 11
    expect(inv(2).x).toBe(q(2).x - belt); // under queue 2's, feeding station 12
    expect(inv(2).y).toBe(inv(1).y);
    expect(q(3).y).toBeGreaterThan(inv(1).y); // the next site below
  });

  it("fences each site around its content, without overlapping the next", () => {
    const fence = (site: number) => p.sites.get(site)!;
    const inside = (site: number, pos: { x: number; y: number }) => {
      const { pos: at, extent } = fence(site);
      return (
        pos.x > at.x &&
        pos.x < at.x + extent.w &&
        pos.y > at.y &&
        pos.y < at.y + extent.h
      );
    };
    for (const id of [10, 11, 12]) expect(inside(1, s(id))).toBe(true);
    for (const id of [20, 21, 22]) expect(inside(2, s(id))).toBe(true);
    expect(inside(1, p.inventories.get(1)!)).toBe(true);
    expect(inside(2, p.inventories.get(3)!)).toBe(true); // unconnected: still in its site
    const one = fence(1);
    expect(fence(2).pos.y).toBeGreaterThan(one.pos.y + one.extent.h);
  });

  it("a queue feeding no station is a store, placed as a compact row after its feeders", () => {
    const withStore: Topology = {
      ...topology,
      queues: [...topology.queues, { id: 9, site: 1 }],
      edges: [
        ...topology.edges,
        edge("station", 12, "queue", 9),
        edge("queue", 9, "queue", 1),
      ],
    };
    const placed = placeTopology(withStore);
    expect(placed.queues.has(9)).toBe(false);
    const store = placed.stores.get(9)!;
    expect(store.x).toBeGreaterThan(placed.stations.get(12)!.x); // after the stations feeding it
    expect(placed.queues.get(1)!.x).toBe(q(1).x); // the cycle back doesn't move queue 1
  });

  it("places in no site go right of every site, centred on them, unfenced", () => {
    const shared: Topology = {
      ...topology,
      queues: [...topology.queues, { id: 9, site: NO_SITE }],
      edges: [
        ...topology.edges,
        edge("station", 12, "queue", 9),
        edge("station", 22, "queue", 9),
        edge("queue", 9, "queue", 1),
        edge("queue", 9, "queue", 3),
      ],
    };
    const placed = placeTopology(shared);
    const store = placed.stores.get(9)!;
    const fences = [...placed.sites.values()];
    const fencesRight = Math.max(...fences.map((f) => f.pos.x + f.extent.w));
    const fencesTop = Math.min(...fences.map((f) => f.pos.y));
    const fencesBottom = Math.max(...fences.map((f) => f.pos.y + f.extent.h));
    expect(store.x).toBeGreaterThan(fencesRight);
    expect(store.y).toBeGreaterThan(fencesTop);
    expect(store.y).toBeLessThan(fencesBottom);
    expect(Math.abs(store.y - (fencesTop + fencesBottom) / 2)).toBeLessThan(
      DEFAULT_LAYOUT.stationSpacing,
    );
    expect(placed.sites.has(NO_SITE)).toBe(false); // no fence
    expect(store.x).toBeLessThan(placed.extent.w); // and the ground still covers it
  });

  it("places everything, inside the extent", () => {
    expect([p.queues.size, p.stations.size, p.inventories.size]).toEqual([
      4, 6, 3,
    ]);
    for (const pos of [...p.queues.values(), ...p.stations.values()]) {
      expect(pos.x).toBeLessThan(p.extent.w);
      expect(pos.y).toBeLessThan(p.extent.h);
    }
  });
});
