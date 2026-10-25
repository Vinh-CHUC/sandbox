import { describe, expect, it } from "vitest";
import { WorldPos } from "./common";
import { depth } from "./draw";
import { AXES, FLAT, framing, project, type Projection } from "./projection";

const DIMETRIC: Projection = { kind: "dimetric", scale: 2 };
const ISOMETRIC: Projection = { kind: "isometric", scale: 1 };
const TRIMETRIC: Projection = { kind: "trimetric", scale: 1 };
const ALL = [FLAT, DIMETRIC, ISOMETRIC, TRIMETRIC];
const length = ({ x, y }: { x: number; y: number }) => Math.hypot(x, y);

describe("project", () => {
  it("flat is the identity and ignores height", () => {
    expect(project(FLAT, WorldPos(3, 4), 10)).toEqual({ x: 3, y: 4 });
  });

  it.each([
    [WorldPos(1, 0), 0, { x: 2, y: 1 }], // x axis: right and down
    [WorldPos(0, 1), 0, { x: -2, y: 1 }], // y axis: left and down
    [WorldPos(0, 0), 1, { x: 0, y: -2 }], // z axis: up
    [WorldPos(3, 1), 2, { x: 4, y: 0 }],
  ])("dimetric (2:1) %o at z=%d → %o", (pos, z, expected) => {
    expect(project(DIMETRIC, pos, z)).toEqual(expected);
  });

  it("isometric: all three axes equally foreshortened, ground axes 30° below horizontal", () => {
    const x = project(ISOMETRIC, WorldPos(1, 0));
    const y = project(ISOMETRIC, WorldPos(0, 1));
    const z = project(ISOMETRIC, WorldPos(0, 0), 1);
    expect(length(x)).toBeCloseTo(length(y));
    expect(length(x)).toBeCloseTo(length(z));
    expect(Math.atan2(x.y, x.x)).toBeCloseTo(Math.PI / 6);
    expect(Math.atan2(y.y, -y.x)).toBeCloseTo(Math.PI / 6);
  });

  it("trimetric: three different foreshortenings", () => {
    const a = AXES.trimetric;
    const lengths = new Set(
      [length(a.x), length(a.y), a.z].map((l) => l.toFixed(3)),
    );
    expect(lengths.size).toBe(3);
  });

  it.each(ALL)(
    "is linear, so container origin + local child positions add up (%o)",
    (p) => {
      const whole = project(p, WorldPos(7, 24), 3);
      const origin = project(p, WorldPos(10, 20));
      const local = project(p, WorldPos(-3, 4), 3);
      expect(whole.x).toBeCloseTo(origin.x + local.x);
      expect(whole.y).toBeCloseTo(origin.y + local.y);
    },
  );
});

describe("framing", () => {
  it.each(ALL)("puts the whole scene's top-left at the margin (%o)", (p) => {
    const extent = { w: 400, h: 300 };
    const offset = framing(p, extent, 50, { x: 16, y: 64 });
    const corners = [0, 400].flatMap((x) =>
      [0, 300].flatMap((y) =>
        [0, 50].map((z) => project(p, WorldPos(x, y), z)),
      ),
    );
    expect(Math.min(...corners.map((c) => c.x + offset.x))).toBeCloseTo(16);
    expect(Math.min(...corners.map((c) => c.y + offset.y))).toBeCloseTo(64);
  });
});

describe("depth", () => {
  it.each([DIMETRIC, ISOMETRIC, TRIMETRIC])(
    "a box nearer the viewer sorts on top (%o)",
    (p) => {
      const box = { w: 10, h: 10 };
      expect(depth(p, WorldPos(50, 50), box)).toBeGreaterThan(
        depth(p, WorldPos(0, 0), box),
      );
    },
  );
});
