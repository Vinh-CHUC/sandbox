import { describe, expect, it } from "vitest";
import { SkuId, WorldPos } from "../shared/common";
import { Inventory } from "./inventory";
import { layoutStacks } from "./stacks";

const A = SkuId(100);
const B = SkuId(200);

describe("Inventory", () => {
  it("carries its SKUs in order, empty until set", () => {
    const inv = new Inventory([B, A]);
    expect(inv.skus).toEqual([B, A]);
    expect([inv.count(A), inv.count(SkuId(9))]).toEqual([0, 0]);
  });

  it("set replaces a level", () => {
    const inv = new Inventory([A]);
    inv.set(A, 7);
    inv.set(A, 3);
    expect(inv.count(A)).toBe(3);
  });

  it("refuses SKUs it doesn't carry", () => {
    expect(() => new Inventory([A]).set(B, 1)).toThrow(RangeError);
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
