import { describe, expect, it } from "vitest";
import { ScreenPos, WorldPos } from "./common";
import { faceMatrix } from "./draw";
import { project, type Projection } from "./projection";

const ISOMETRIC: Projection = { kind: "isometric", scale: 1 };

describe("faceMatrix", () => {
  it("matches its docstring", () => {
    const m = faceMatrix(
      [
        ScreenPos(10, 0),
        ScreenPos(20, 5),
        ScreenPos(20, 25),
        ScreenPos(10, 20),
      ],
      { w: 100, h: 50 },
    );
    expect([m.a, m.b, m.c, m.d, m.tx, m.ty]).toEqual([
      0.1, 0.05, 0, 0.4, 10, 0,
    ]);
  });

  // The front face of a 48 × 30 × 20 box: texture corners must land on the face's corners
  const at = (x: number, y: number, z: number) =>
    project(ISOMETRIC, WorldPos(x, y), z);
  const side = [
    at(0, 30, 20),
    at(48, 30, 20),
    at(48, 30, 0),
    at(0, 30, 0),
  ] as const;

  it.each([
    [{ x: 0, y: 0 }, side[0]],
    [{ x: 256, y: 0 }, side[1]],
    [{ x: 256, y: 128 }, side[2]],
    [{ x: 0, y: 128 }, side[3]],
  ])("texture px %o → face corner %o", (px, corner) => {
    const p = faceMatrix(side, { w: 256, h: 128 }).apply(px);
    expect(p.x).toBeCloseTo(corner.x);
    expect(p.y).toBeCloseTo(corner.y);
  });
});
