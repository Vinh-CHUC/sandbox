import type { Container, Graphics } from "pixi.js";
import {
  mixColor,
  WorldPos,
  type Color,
  type Extent,
  type Fraction,
  type ScreenPos,
} from "./common";
import { project, type Projection } from "./projection";
import { units } from "./scale";

/** The only way views place things: forces a `project()` on the way to pixi */
export const placeAt = (c: Container, s: ScreenPos): void => {
  c.position.set(s.x, s.y);
};

/**
 * Painter's order: boxes lower on screen (closer to the viewer, in any axonometric view) on top.
 * The screen height of the box's footprint centre, so it holds whatever the axes' angles.
 */
export const depth = (p: Projection, pos: WorldPos, { w, h }: Extent): number =>
  project(p, WorldPos(pos.x + w / 2, pos.y + h / 2)).y;

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
  if (p.kind === "flat")
    return g.roundRect(0, 0, w, h, units(0.17)).fill(color);
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
  if (p.kind === "flat")
    return g.roundRect(0, 0, w, h, units(0.22)).fill(color);
  const at = (x: number, y: number) => project(p, WorldPos(x, y));
  return g.poly(flatten([at(0, 0), at(w, 0), at(w, h), at(0, h)])).fill(color);
};

/** Live rate labels change at most this often, in real time, so they stay readable at any speed */
export const RATE_REFRESH_MS = 1000;

/**
 * Runs what it's given at most once per `ms` of *real* time (`performance.now()`), dropping the
 * calls in between; the first call always runs.
 */
export const throttle = (ms: number) => {
  let last = -Infinity;
  return (run: () => void): void => {
    const now = performance.now();
    if (now - last < ms) return;
    last = now;
    run();
  };
};

/**
 * A fenced patch of ground around `extent` from the local origin, e.g. a site: painted `floor`,
 * outlined in `outline`, as a rounded rect (flat) or a rhombus (iso)
 */
export const drawFence = (
  g: Graphics,
  p: Projection,
  { w, h }: Extent,
  colors: { readonly floor: Color; readonly outline: Color },
): Graphics => {
  const fill = { color: colors.floor };
  const outline = { width: 2, color: colors.outline, alpha: 0.7 };
  if (p.kind === "flat")
    return g.roundRect(0, 0, w, h, units(0.39)).fill(fill).stroke(outline);
  const at = (x: number, y: number) => project(p, WorldPos(x, y));
  return g
    .poly(flatten([at(0, 0), at(w, 0), at(w, h), at(0, h)]))
    .fill(fill)
    .stroke(outline);
};

/**
 * Part of a circle on the ground, from `from` to `to` (fractions of a turn, clockwise from 12
 * o'clock): sampled in world coords and projected, so it's an ellipse in iso
 */
export const drawArc = (
  g: Graphics,
  p: Projection,
  center: WorldPos,
  radius: number,
  from: Fraction,
  to: Fraction,
  style: {
    readonly color: Color;
    readonly width: number;
    readonly alpha?: number;
  },
): Graphics => {
  if (to <= from) return g;
  const steps = Math.max(2, Math.ceil(64 * (to - from)));
  const at = (k: number) => {
    const angle =
      2 * Math.PI * (from + ((to - from) * k) / steps) - Math.PI / 2;
    return project(
      p,
      WorldPos(
        center.x + radius * Math.cos(angle),
        center.y + radius * Math.sin(angle),
      ),
    );
  };
  const start = at(0);
  g.moveTo(start.x, start.y);
  for (let k = 1; k <= steps; k++) {
    const point = at(k);
    g.lineTo(point.x, point.y);
  }
  return g.stroke({ ...style, cap: "round" });
};
