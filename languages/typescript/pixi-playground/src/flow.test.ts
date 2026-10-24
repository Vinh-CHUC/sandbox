import { describe, expect, it } from "vitest";
import { canAccept, headBox, transfer, type Conveyor, type Node } from "./flow";
import { Layout } from "./queue/layout";
import { Queue } from "./queue/model/queue";
import { Inventory } from "./inventory/inventory";
import { PartId, WorldPos, type Item } from "./shared/common";
import { Station, StationBoard } from "./station/station";

const item = (id: number, size = 1): Item => ({
  id,
  color: 0,
  size,
  processMs: 1000,
});

const conveyor = (ids: number[], origin = WorldPos(100, 50)): Conveyor => {
  const queue = new Queue();
  for (const id of ids) queue.push(item(id));
  return { queue, layout: new Layout(20, 5, "ltr"), origin };
};

const ids = (c: Conveyor) => c.queue.items.map((i) => i.id);

describe("headBox", () => {
  it("is the head box's top-left in stage coords", () => {
    // ltr: the head box extends leftwards from the origin
    expect(headBox(conveyor([]), 1)).toEqual(WorldPos(80, 50));
    expect(headBox(conveyor([]), 2)).toEqual(WorldPos(55, 50)); // boxWidth(2) = 45
  });
});

describe("transfer", () => {
  it("queue → queue: the head flies from `from`'s head to `to`'s tail", () => {
    const from = conveyor([1, 2]);
    const to = conveyor([9], WorldPos(500, 50));
    expect(transfer(from, { kind: "queue", conveyor: to }, 0)).toBe(true);
    expect(ids(from)).toEqual([2]);
    expect(ids(to)).toEqual([9, 1]);
    expect(to.queue.arrival(1, 0)?.source).toEqual(WorldPos(80, 50));
  });

  it("queue → stations: dispatches into a free station", () => {
    const station = new Station();
    const from = conveyor([1]);
    const to: Node = {
      kind: "stations",
      board: new StationBoard([station]),
      inventory: new Inventory([], 0),
    };
    expect(transfer(from, to, 0)).toBe(true);
    expect(station.item?.id).toBe(1);
  });

  it("nothing moves when every station is busy", () => {
    const from = conveyor([1, 2]);
    const to: Node = {
      kind: "stations",
      board: new StationBoard([new Station()]),
      inventory: new Inventory([], 0),
    };
    transfer(from, to, 0);
    expect(canAccept(to)).toBe(false);
    expect(transfer(from, to, 0)).toBe(false);
    expect(ids(from)).toEqual([2]); // the head stays put
  });

  it("nothing moves while `from`'s head is still flying in", () => {
    const from = conveyor([]);
    from.queue.arrive(item(1), WorldPos(0, 0), 0);
    const to = conveyor([]);
    const node: Node = { kind: "queue", conveyor: to };
    expect(transfer(from, node, 500)).toBe(false); // mid-flight
    expect(transfer(from, node, 1000)).toBe(true); // landed (MOVE_DURATION_MS)
    expect(ids(to)).toEqual([1]);
  });

  it("queue → stations: takes the item's parts from the inventory", () => {
    const P = PartId("p");
    const inventory = new Inventory([P], 3);
    const to: Node = {
      kind: "stations",
      board: new StationBoard([new Station(), new Station()]),
      inventory,
    };
    const from = conveyor([1, 2]);
    expect(transfer(from, to, 0, [{ part: P, count: 2 }])).toBe(true);
    expect(inventory.count(P)).toBe(1);
    // Not enough left for the next one: it stays in the queue
    expect(transfer(from, to, 0, [{ part: P, count: 2 }])).toBe(false);
    expect(ids(from)).toEqual([2]);
  });

  it("nothing moves when `from` is empty", () => {
    const to = conveyor([]);
    expect(transfer(conveyor([]), { kind: "queue", conveyor: to }, 0)).toBe(
      false,
    );
    expect(ids(to)).toEqual([]);
  });
});
