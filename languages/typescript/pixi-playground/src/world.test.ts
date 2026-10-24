import { describe, expect, it } from "vitest";
import type { Item } from "./shared/common";
import {
  BoardId,
  ConveyorId,
  World,
  resolveEdges,
  type Edge,
  type WorldSpec,
} from "./world";

const items = () => {
  let nextId = 0;
  return (): Item => ({ id: nextId++, color: 0, size: 1, processMs: 1000 });
};

const C = ConveyorId("C");
const D = ConveyorId("D");
const S = BoardId("S");
const origin = { x: 0, y: 0 };

// C → S → D
const spec = (
  edges: readonly Edge[] = [
    { from: { kind: "queue", id: C }, to: { kind: "stations", id: S } },
    { from: { kind: "stations", id: S }, to: { kind: "queue", id: D } },
  ],
): WorldSpec => ({
  conveyors: [
    { id: C, origin, direction: "ltr" },
    { id: D, origin, direction: "ltr" },
  ],
  boards: [{ id: S, positions: [{ x: 50, y: 0 }] }],
  edges,
});

describe("resolveEdges", () => {
  it("throws on an unknown id", () => {
    expect(() =>
      resolveEdges(
        [{ from: { kind: "queue", id: C }, to: { kind: "queue", id: D } }],
        new Map(),
        new Map(),
      ),
    ).toThrow("unknown id: C");
  });
});

describe("World", () => {
  it("one container per conveyor and per station", () => {
    expect(new World(spec(), items()).containers).toHaveLength(2 + 1);
  });

  it("only roots start filled", () => {
    const world = new World(spec(), items());
    expect(world.items(C)).toHaveLength(5);
    expect(world.items(D)).toEqual([]);
  });

  it("rejects a source with two downstream edges", () => {
    const edges: Edge[] = [
      { from: { kind: "queue", id: C }, to: { kind: "queue", id: D } },
      { from: { kind: "queue", id: C }, to: { kind: "stations", id: S } },
    ];
    expect(() => new World(spec(edges), items())).toThrow(
      "C has two downstream edges",
    );
  });

  it("tick: feeds free stations, then moves finished items downstream", () => {
    const world = new World(spec(), items());
    world.tick(0); // head 0 → the only station; nothing else is free
    expect(world.items(C).map((i) => i.id)).toEqual([1, 2, 3, 4]);

    // done after dispatchMs (900) + processMs (1000): 0 lands in D, 1 takes the free station
    world.tick(1900);
    expect(world.items(D).map((i) => i.id)).toEqual([0]);
    expect(world.items(C).map((i) => i.id)).toEqual([2, 3, 4]);
  });
});
