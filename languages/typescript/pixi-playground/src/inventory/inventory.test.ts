import { describe, expect, it } from "vitest";
import { PartId, WorldPos } from "../shared/common";
import { Inventory } from "./inventory";
import { layoutStacks } from "./stacks";

const A = PartId("a");
const B = PartId("b");

describe("Inventory", () => {
  it("starts every stack full", () => {
    const inv = new Inventory([A, B], 100);
    expect([inv.count(A), inv.count(B), inv.count(PartId("?"))]).toEqual([
      100, 100, 0,
    ]);
  });

  it("take removes the whole request", () => {
    const inv = new Inventory([A, B], 10);
    inv.take([
      { part: A, count: 3 },
      { part: B, count: 1 },
    ]);
    expect([inv.count(A), inv.count(B)]).toEqual([7, 9]);
  });

  it("refuses a request any stack can't cover, taking nothing", () => {
    const inv = new Inventory([A, B], 2);
    const request = [
      { part: A, count: 1 },
      { part: B, count: 3 },
    ];
    expect(inv.canSupply(request)).toBe(false);
    expect(() => inv.take(request)).toThrow(RangeError);
    expect(inv.count(A)).toBe(2);
  });

  it("restock adds one, up to capacity", () => {
    const inv = new Inventory([A], 2);
    inv.take([{ part: A, count: 2 }]);
    inv.restock(A);
    expect(inv.count(A)).toBe(1);
    inv.restock(A);
    inv.restock(A);
    expect(inv.count(A)).toBe(2);
  });
});

describe("layoutStacks", () => {
  it("lines the stacks up along x, one stride apart", () => {
    const stacks = layoutStacks(
      WorldPos(100, 50),
      [
        { id: A, color: 1 },
        { id: B, color: 2 },
      ],
      44,
    );
    expect(stacks.get(B)).toEqual({ pos: { x: 144, y: 50 }, color: 2 });
  });
});
