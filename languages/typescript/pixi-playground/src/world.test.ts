import { describe, expect, it } from "vitest";
import { Inventory } from "./inventory/inventory";
import { PartId, WorldPos, type Item, type PartRequest } from "./shared/common";
import {
  BoardId,
  ConveyorId,
  World,
  resolveEdges,
  type Edge,
  type WorldRandom,
  type WorldSpec,
} from "./world";

const items = () => {
  let nextId = 0;
  return (): Item => ({ id: nextId++, color: 0, size: 1, processMs: 1000 });
};

/** Fresh item ids per world; every dispatched item asks for `parts` */
const random = (parts: PartRequest = []): WorldRandom => ({
  newItem: items(),
  pickParts: () => parts,
});

const P = PartId("p");

const C = ConveyorId("C");
const D = ConveyorId("D");
const S = BoardId("S");
const origin = WorldPos(0, 0);

// C → S → D
const spec = (
  edges: readonly Edge[] = [
    { from: { kind: "queue", id: C }, to: { kind: "stations", id: S } },
    { from: { kind: "stations", id: S }, to: { kind: "queue", id: D } },
  ],
  capacity = 10,
): WorldSpec => ({
  conveyors: [
    { id: C, origin, direction: "ltr" },
    { id: D, origin, direction: "ltr" },
  ],
  boards: [{ id: S, positions: [WorldPos(50, 0)] }],
  inventory: {
    origin: WorldPos(0, 100),
    parts: [{ id: P, color: 0 }],
    capacity,
  },
  edges,
});

describe("resolveEdges", () => {
  it("throws on an unknown id", () => {
    expect(() =>
      resolveEdges(
        [{ from: { kind: "queue", id: C }, to: { kind: "queue", id: D } }],
        new Map(),
        new Map(),
        new Inventory([], 0),
      ),
    ).toThrow("unknown id: C");
  });
});

describe("World", () => {
  it("draws the grid, the inventory, then one container per conveyor and per station", () => {
    expect(new World(spec(), random()).root.children).toHaveLength(
      1 + 1 + 2 + 1,
    );
  });

  it("only roots start filled", () => {
    const world = new World(spec(), random());
    expect(world.items(C)).toHaveLength(5);
    expect(world.items(D)).toEqual([]);
  });

  it("rejects a source with two downstream edges", () => {
    const edges: Edge[] = [
      { from: { kind: "queue", id: C }, to: { kind: "queue", id: D } },
      { from: { kind: "queue", id: C }, to: { kind: "stations", id: S } },
    ];
    expect(() => new World(spec(edges), random())).toThrow(
      "C has two downstream edges",
    );
  });

  it("tick: feeds free stations, then moves finished items downstream", () => {
    const world = new World(spec(), random());
    world.tick(0); // head 0 → the only station; nothing else is free
    expect(world.items(C).map((i) => i.id)).toEqual([1, 2, 3, 4]);

    // done after dispatchMs (900) + processMs (1000): 0 lands in D, 1 takes the free station
    world.tick(1900);
    expect(world.items(D).map((i) => i.id)).toEqual([0]);
    expect(world.items(C).map((i) => i.id)).toEqual([2, 3, 4]);
  });

  it("dispatching takes the item's parts from the inventory", () => {
    const world = new World(spec(), random([{ part: P, count: 2 }]));
    world.tick(0);
    expect(world.stock(P)).toBe(8);
  });

  it("an item waits in the queue while the inventory can't cover its parts", () => {
    const world = new World(
      spec(undefined, 1),
      random([{ part: P, count: 2 }]),
    );
    world.tick(0);
    expect(world.items(C)).toHaveLength(5);
    expect(world.stock(P)).toBe(1);
  });

  it("restocks one part every 200 ms, up to capacity", () => {
    const world = new World(spec(), random([{ part: P, count: 2 }]));
    world.tick(0); // 10 → 8; the only station is now busy until 1900
    world.tick(450); // two restocks: at 200 and 400
    expect(world.stock(P)).toBe(10);
    world.tick(650);
    expect(world.stock(P)).toBe(10); // already full
  });
});
