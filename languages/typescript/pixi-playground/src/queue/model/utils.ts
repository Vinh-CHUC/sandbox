// Removing an element releases its `size` worth of space for the items after it, inserting one takes
// that much from them. Each such edit leaves a `Shift` on every affected item:
// - removal: delta = +size, the item starts `size` slots right of its new index and slides left
// - insertion: delta = -size, the item starts `size` slots left of its new index and slides right
// The lag of a single shift is in [0, delta]: once the animation is over it is 0, i.e. the new
// index without any interpolation.
/** Timestamp, e.g. from `performance.now()` */
export type Ms = number;
export type ItemId = number;
/** 0xRRGGBB */
export type Color = number;
/** Position in the queue, 0 = head */
export type Index = number;
/** Fractional visual position, in units of one item's width */
export type Slot = number;
/** Displacement, in slots */
export type SlotDelta = number;
/** Width of an item, as a multiple of the base box size (1 = one box wide) */
export type Size = number;
/** In [0, 1] */
export type Fraction = number;

export type Item = {
  readonly id: ItemId;
  readonly color: Color;
  readonly size: Size;
  /** How long a station takes to process this item */
  readonly processMs: Ms;
};

/** `delta` slots of displacement still owed by an item, decaying to 0 from time `at` (ms) */
export type Shift = { readonly at: Ms; readonly delta: SlotDelta };

export const MOVE_DURATION_MS: Ms = 1000;

export const clamp01 = (x: number): Fraction => {
  if (x < 0) throw new RangeError(`clamp01: expected x >= 0, got ${x}`);
  return Math.min(1, x);
};
export const smoothstep = (x: number) => x * x * (3 - 2 * x);

export const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

/** Fraction of a move started at `at` still to travel: 1 → 0 */
export const remaining = (at: Ms, now: Ms): Fraction => {
  const progress = clamp01((now - at) / MOVE_DURATION_MS);
  return 1 - smoothstep(progress);
};

export const isLive = (at: Ms, now: Ms) => now - at < MOVE_DURATION_MS;

export const lag = (shifts: readonly Shift[], now: Ms): SlotDelta =>
  sum(shifts.map((s) => s.delta * remaining(s.at, now)));
