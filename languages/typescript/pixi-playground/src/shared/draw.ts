import {
  Matrix,
  type Container,
  type FillInput,
  type Graphics,
  type Texture,
} from "pixi.js";
import {
  mixColor,
  WorldPos,
  type Color,
  type Extent,
  type Fraction,
  type ScreenPos,
} from "./common";
import { WHITE } from "./palette";
import { project, type Projection } from "./projection";
import { units } from "./scale";
import type { Skin } from "./skin";

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

/** Darker shades of the side faces, so the box reads as a solid: plain colours, and textures' tints */
const PLAIN_SHADE = { side: 0.55, end: 0.75 };
const TEXTURE_SHADE = { side: 0.78, end: 0.9 };
/** A textured box's outline when alerted, in px */
const ALERT_WIDTH = 3;

/** A face's corners in texture order: top-left, top-right, bottom-right, bottom-left */
type Quad = readonly [ScreenPos, ScreenPos, ScreenPos, ScreenPos];

/**
 * The affine map taking a `texture`-sized image onto `quad`, a parallelogram (every face is one,
 * projections being linear): texture px (0, 0), (w, 0) and (0, h) land on its corners 0, 1 and 3.
 *
 *   faceMatrix([(10, 0), (20, 5), (20, 25), (10, 20)], { w: 100, h: 50 })
 *   # Matrix(a=0.1, b=0.05, c=0, d=0.4, tx=10, ty=0)
 */
export const faceMatrix = ([o, u, , v]: Quad, texture: Extent): Matrix =>
  new Matrix(
    (u.x - o.x) / texture.w,
    (u.y - o.y) / texture.w,
    (v.x - o.x) / texture.h,
    (v.y - o.y) / texture.h,
    o.x,
    o.y,
  );

const textureFill = (quad: Quad, texture: Texture, tint: Color): FillInput => ({
  texture,
  color: tint,
  textureSpace: "global",
  matrix: faceMatrix(quad, {
    w: texture.frame.width,
    h: texture.frame.height,
  }),
});

/** A cuboid's visible faces, each in texture order (see `Faces`) */
const boxFaces = (
  p: Projection,
  { w, h }: Extent,
  height: number,
): { readonly top: Quad; readonly side: Quad; readonly end: Quad } => {
  const at = (x: number, y: number, z: number) => project(p, WorldPos(x, y), z);
  // The faces looking towards +x and +y are the visible ones: x + y grows towards the viewer
  return {
    top: [
      at(0, 0, height),
      at(w, 0, height),
      at(w, h, height),
      at(0, h, height),
    ],
    side: [at(0, h, height), at(w, h, height), at(w, h, 0), at(0, h, 0)],
    end: [at(w, h, height), at(w, 0, height), at(w, 0, 0), at(w, h, 0)],
  };
};

/**
 * A box whose footprint `extent` starts at the local origin: a rounded rect (flat), or a cuboid
 * `height` tall (iso). Plain: side faces are darker shades of the colour, so a white box still
 * shades under `tint`. Textured: each face its texture (only the top in flat), the sides tinted
 * darker.
 */
export const drawBox = (
  g: Graphics,
  p: Projection,
  extent: Extent,
  height: number,
  skin: Skin,
): Graphics => {
  const faces = boxFaces(p, extent, height);
  switch (skin.kind) {
    case "plain": {
      const { color } = skin;
      if (p.kind === "flat")
        return g.roundRect(0, 0, extent.w, extent.h, units(0.17)).fill(color);
      return g
        .poly(flatten(faces.end))
        .fill(shade(color, PLAIN_SHADE.end))
        .poly(flatten(faces.side))
        .fill(shade(color, PLAIN_SHADE.side))
        .poly(flatten(faces.top))
        .fill(color);
    }
    case "textured": {
      const { alert } = skin;
      // An alert tints the faces towards its colour, and outlines them in it
      const tint = (f: number) =>
        shade(alert === undefined ? WHITE : mixColor(WHITE, alert, 0.35), f);
      const stroke = { width: ALERT_WIDTH, color: alert ?? WHITE };
      const face = (quad: Quad, texture: Texture, f: number) => {
        g.poly(flatten(quad)).fill(textureFill(quad, texture, tint(f)));
        if (alert !== undefined) g.stroke(stroke);
      };
      if (p.kind !== "flat") {
        face(faces.end, skin.faces.end, TEXTURE_SHADE.end);
        face(faces.side, skin.faces.side, TEXTURE_SHADE.side);
      }
      face(faces.top, skin.faces.top, 1);
      return g;
    }
  }
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
