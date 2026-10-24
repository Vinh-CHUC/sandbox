import type { Container, Graphics } from "pixi.js";
import {
  mixColor,
  WorldPos,
  type Color,
  type Extent,
  type ScreenPos,
} from "./common";
import { project, type Projection } from "./projection";

/** The only way views place things: forces a `project()` on the way to pixi */
export const placeAt = (c: Container, s: ScreenPos): void => {
  c.position.set(s.x, s.y);
};

/** Painter's order in iso: boxes further along x + y are closer to the viewer */
export const depth = (pos: WorldPos, { w, h }: Extent): number =>
  pos.x + pos.y + (w + h) / 2;

const shade = (color: Color, f: number): Color => mixColor(0x000000, color, f);
const flatten = (corners: readonly ScreenPos[]): number[] =>
  corners.flatMap(({ x, y }) => [x, y]);

/**
 * A box whose footprint `extent` starts at the local origin: a rounded rect (flat), or a cuboid
 * `height` tall (iso). Side faces are darker shades of `color`, so a white box still shades under
 * `tint`.
 */
export const drawBox = (
  g: Graphics,
  p: Projection,
  { w, h }: Extent,
  height: number,
  color: Color,
): Graphics => {
  if (p.kind === "flat") return g.roundRect(0, 0, w, h, 6).fill(color);
  const at = (x: number, y: number, z: number) => project(p, WorldPos(x, y), z);
  // The faces looking towards +x and +y are the visible ones: x + y grows towards the viewer
  const right = [at(w, 0, 0), at(w, h, 0), at(w, h, height), at(w, 0, height)];
  const front = [at(0, h, 0), at(w, h, 0), at(w, h, height), at(0, h, height)];
  const top = [
    at(0, 0, height),
    at(w, 0, height),
    at(w, h, height),
    at(0, h, height),
  ];
  return g
    .poly(flatten(right))
    .fill(shade(color, 0.75))
    .poly(flatten(front))
    .fill(shade(color, 0.55))
    .poly(flatten(top))
    .fill(color);
};

/** A plate lying on the ground, footprint `extent` from the local origin: rounded rect or rhombus */
export const drawPlate = (
  g: Graphics,
  p: Projection,
  { w, h }: Extent,
  color: Color,
): Graphics => {
  if (p.kind === "flat") return g.roundRect(0, 0, w, h, 8).fill(color);
  const at = (x: number, y: number) => project(p, WorldPos(x, y));
  return g.poly(flatten([at(0, 0), at(w, 0), at(w, h), at(0, h)])).fill(color);
};
