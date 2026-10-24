import {
  clamp01,
  smoothstep,
  type Fraction,
  type Ms,
  type WallMs,
} from "../../shared/common";

// Removing an element releases its `size` worth of space for the items after it, inserting one takes
// that much from them. Each such edit leaves a `Shift` on every affected item:
// - removal: delta = +size, the item starts `size` slots right of its new index and slides left
// - insertion: delta = -size, the item starts `size` slots left of its new index and slides right
// The lag of a single shift is in [0, delta]: once the animation is over it is 0, i.e. the new
// index without any interpolation.
/** Position in the queue, 0 = head */
export type Index = number;
/** Fractional visual position, in units of one item's width */
export type Slot = number;
/** Displacement, in slots */
export type SlotDelta = number;
/** `delta` slots of displacement still owed by an item, decaying to 0 from `at` (wall time) */
export type Shift = { readonly at: WallMs; readonly delta: SlotDelta };

export const MOVE_DURATION_MS: Ms = 1000;

export const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

/** Fraction of a move started at `at` still to travel: 1 → 0, over `duration` */
export const remaining = (
  at: WallMs,
  now: WallMs,
  duration: Ms = MOVE_DURATION_MS,
): Fraction => {
  const progress = clamp01((now - at) / duration);
  return 1 - smoothstep(progress);
};

export const isLive = (
  at: WallMs,
  now: WallMs,
  duration: Ms = MOVE_DURATION_MS,
) => now - at < duration;

export const lag = (
  shifts: readonly Shift[],
  now: WallMs,
  duration: Ms = MOVE_DURATION_MS,
): SlotDelta =>
  sum(shifts.map((s) => s.delta * remaining(s.at, now, duration)));
