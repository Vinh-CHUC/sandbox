import { ScreenPos, WorldPos, type Extent, type Pos } from "./common";

/**
 * How the world's ground plane is drawn: top-down (`flat`), or one of three axonometric views,
 * where the world's x, y (ground) and z (height) axes become three screen directions:
 *
 * - dimetric: 2:1 "pixel-art": one unit along x is 1 across and ½ down; x and y alike
 * - isometric: true isometric, every axis at 30° and equally foreshortened
 * - trimetric: three different angles and foreshortenings
 *
 * `scale` sizes the whole view.
 */
export type AxonometricKind = "dimetric" | "isometric" | "trimetric";
export type Projection =
  | { readonly kind: "flat" }
  | { readonly kind: AxonometricKind; readonly scale: number };

export const FLAT: Projection = { kind: "flat" };

/** Screen vectors of one world unit along x, y (y grows downward), and up along z */
type Axes = { readonly x: Pos; readonly y: Pos; readonly z: number };

/** A screen vector `length` long, `degrees` below the horizontal (clockwise: y is down) */
const axis = (degrees: number, length: number): Pos => ({
  x: Math.cos((degrees * Math.PI) / 180) * length,
  y: Math.sin((degrees * Math.PI) / 180) * length,
});

export const AXES: Record<AxonometricKind, Axes> = {
  dimetric: { x: { x: 1, y: 0.5 }, y: { x: -1, y: 0.5 }, z: 1 },
  isometric: { x: axis(30, 1), y: axis(150, 1), z: 1 },
  trimetric: { x: axis(15, 1), y: axis(130, 0.75), z: 0.9 },
};

/**
 * World → screen. Linear (no offset), so a container's origin and its children's local positions
 * can be projected independently and still add up. `z` is height above the ground; flat is
 * top-down, so height doesn't show there.
 *
 *   project(dimetric, (1, 0))    → ( s, s/2)   x axis: right and down
 *   project(dimetric, (0, 1))    → (-s, s/2)   y axis: left and down
 *   project(dimetric, (0, 0), 1) → ( 0,  -s)   z axis: up
 */
export const project = (p: Projection, pos: WorldPos, z = 0): ScreenPos => {
  if (p.kind === "flat") return ScreenPos(pos.x, pos.y);
  const { x, y, z: up } = AXES[p.kind];
  return ScreenPos(
    p.scale * (pos.x * x.x + pos.y * y.x),
    p.scale * (pos.x * x.y + pos.y * y.y - z * up),
  );
};

/**
 * Where to put the world's origin on screen so that the ground (`extent` from (0, 0)), and
 * what stands `height` on it, starts `margin` from the top-left of the screen
 */
export const framing = (
  p: Projection,
  extent: Extent,
  height: number,
  margin: Pos,
): ScreenPos => {
  const corners = [0, extent.w].flatMap((x) =>
    [0, extent.h].flatMap((y) =>
      [0, height].map((z) => project(p, WorldPos(x, y), z)),
    ),
  );
  return ScreenPos(
    margin.x - Math.min(...corners.map((c) => c.x)),
    margin.y - Math.min(...corners.map((c) => c.y)),
  );
};
