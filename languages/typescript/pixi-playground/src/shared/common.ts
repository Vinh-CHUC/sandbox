/** Timestamp, e.g. from `performance.now()` */
export type Ms = number;
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

export type PartId = string & { readonly __brand: "PartId" };
export const PartId = (id: string) => id as PartId;
export type PartType = { readonly id: PartId; readonly color: Color };
/** What a vehicle needs from the inventory: distinct parts, each with how many */
export type PartRequest = readonly {
  readonly part: PartId;
  readonly count: number;
}[];

export type Item = {
  readonly id: ItemId;
  readonly color: Color;
  readonly size: Size;
  /** How long a station takes to process this item */
  readonly processMs: Ms;
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
