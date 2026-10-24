import type { Skin } from "./skin";

/** A duration in milliseconds, on whichever clock: the difference of two timestamps */
export type Ms = number;
/**
 * Simulated time: ms since the trace's start. When things happen (events, progress, throughput).
 * Branded, like `WorldPos`, so it can't be mixed up with `WallMs`.
 */
export type SimMs = number & { readonly __brand: "SimMs" };
export const SimMs = (ms: number) => ms as SimMs;
/** Wall-clock time, e.g. `performance.now()`: how long things take on screen (animations) */
export type WallMs = number & { readonly __brand: "WallMs" };
export const WallMs = (ms: number) => ms as WallMs;
export type ItemId = number;
/** 0xRRGGBB */
export type Color = number;
/** Width of an item, as a multiple of the base box size (1 = one box wide) */
export type Size = number;
/** In [0, 1] */
export type Fraction = number;

/** A plain 2D vector; actual positions are either a `WorldPos` or a `ScreenPos` */
export type Pos = { readonly x: number; readonly y: number };
/** Position on the world's ground plane (px), whatever the projection: what models and looks use */
export type WorldPos = Pos & { readonly __brand: "WorldPos" };
export const WorldPos = (x: number, y: number) => ({ x, y }) as WorldPos;
/** Position in pixi's coords, i.e. a projected `WorldPos`: only views deal with these */
export type ScreenPos = Pos & { readonly __brand: "ScreenPos" };
export const ScreenPos = (x: number, y: number) => ({ x, y }) as ScreenPos;
export type Extent = { readonly w: number; readonly h: number };

/** A stock-keeping unit: a type of part an inventory stocks */
export type SkuId = number & { readonly __brand: "SkuId" };
export const SkuId = (id: number) => id as SkuId;
export type SkuType = { readonly id: SkuId; readonly skin: Skin };
/** `count` units of `sku` taken from `inventory` */
export type PartUse = {
  readonly inventory: number;
  readonly sku: SkuId;
  readonly count: number;
};

/** Something that flows through queues and stations; skin and size are presentation only */
export type Item = {
  readonly id: ItemId;
  readonly skin: Skin;
  readonly size: Size;
};

export const clamp01 = (x: number): Fraction => {
  if (x < 0) throw new RangeError(`clamp01: expected x >= 0, got ${x}`);
  return Math.min(1, x);
};
export const smoothstep = (x: number) => x * x * (3 - 2 * x);

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

const mixChannel = (a: number, b: number, t: Fraction): number =>
  Math.round(lerp(a, b, t));

/** straight RGB blend (a "nicer" red→green would detour through HSV/yellow) */
export const mixColor = (a: Color, b: Color, t: Fraction): Color =>
  (mixChannel((a >> 16) & 0xff, (b >> 16) & 0xff, t) << 16) |
  (mixChannel((a >> 8) & 0xff, (b >> 8) & 0xff, t) << 8) |
  mixChannel(a & 0xff, b & 0xff, t);

/**
 * A colour from hue (degrees), saturation and lightness (0-1)
 *
 *   hsl(0, 1, 0.5)    # 0xff0000
 *   hsl(120, 1, 0.5)  # 0x00ff00
 */
export const hsl = (h: number, s: number, l: number): Color => {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return (channel(0) << 16) | (channel(8) << 8) | channel(4);
};
