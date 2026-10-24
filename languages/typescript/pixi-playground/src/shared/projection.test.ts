import { describe, expect, it } from "vitest";
import { ScreenPos, WorldPos } from "./common";
import { cameraOffset, FLAT, project, type Projection } from "./projection";

const ISO: Projection = { kind: "iso", scale: 2, offset: ScreenPos(5, 7) };

describe("project", () => {
  it("flat is the identity and ignores height", () => {
    expect(project(FLAT, WorldPos(3, 4), 10)).toEqual({ x: 3, y: 4 });
  });

  it.each([
    [WorldPos(1, 0), 0, { x: 2, y: 1 }], // x axis: right and down
    [WorldPos(0, 1), 0, { x: -2, y: 1 }], // y axis: left and down
    [WorldPos(0, 0), 1, { x: 0, y: -2 }], // z axis: up
    [WorldPos(3, 1), 2, { x: 4, y: 0 }],
  ])("iso %o at z=%d → %o", (pos, z, expected) => {
    expect(project(ISO, pos, z)).toEqual(expected);
  });

  it("is linear, so container origin + local child positions add up", () => {
    const origin = WorldPos(10, 20);
    const local = WorldPos(-3, 4);
    const whole = project(ISO, WorldPos(7, 24));
    const parts = [project(ISO, origin), project(ISO, local)];
    expect(whole).toEqual({
      x: parts[0].x + parts[1].x,
      y: parts[0].y + parts[1].y,
    });
  });
});

describe("cameraOffset", () => {
  it("only iso moves the camera", () => {
    expect(cameraOffset(FLAT)).toEqual({ x: 0, y: 0 });
    expect(cameraOffset(ISO)).toEqual({ x: 5, y: 7 });
  });
});
