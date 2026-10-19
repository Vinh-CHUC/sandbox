// Popping an element from the queeu releases "1 slot" worth of space
// The index lag corresponding to one pop cannot:
// - exceed 1: happens if the frame rate is very slow and we've exceeded the animation length. This
// would basically be equivalent to the new index without any interpolation.
// - be < 0: not possible?
export type Item = { readonly id: number; readonly color: number };

export const MOVE_DURATION_MS = 1000;

export const clamp01 = (x: number) => {
  if (x < 0) throw new RangeError(`clamp01: expected x >= 0, got ${x}`);
  return Math.min(1, x);
};
export const smoothstep = (x: number) => x * x * (3 - 2 * x);

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

const remaining = (poppedAt: number, now: number) => {
  const progress = clamp01((now - poppedAt) / MOVE_DURATION_MS);
  return 1 - smoothstep(progress);
};

// Each pop releases 1 unit worth of space
export const lag = (pops: readonly number[], now: number): number =>
  sum(pops.map((t) => remaining(t, now)));

export class Queue {
  private readonly _items: Item[] = [];
  private nextId = 0;
  /** Timestamps (ms) of pops whose advance animation may still be running */
  private pops: number[] = [];

  get items(): readonly Item[] {
    return this._items;
  }

  push(color: number): void {
    this._items.push({ id: this.nextId++, color });
  }

  pop(now: number): Item | undefined {
    const head = this._items.shift();
    if (head === undefined) return undefined;
    // Only bother keeping the pops that are recent enough, if a pop is too old it would contribute
    // 0 to the index lag anyway
    //
    // Note that this is NOT redundant with clamp01, as it might be that slot is called "long
    // after" pop() for example
    this.pops = [...this.pops.filter((t) => now - t < MOVE_DURATION_MS), now];
    return head;
  }

  slot(index: number, now: number): number {
    return index + lag(this.pops, now);
  }
}
