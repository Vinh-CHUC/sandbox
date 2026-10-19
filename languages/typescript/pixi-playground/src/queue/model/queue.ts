// Removing an element from the queue releases "1 slot" worth of space for the items after it,
// inserting one takes "1 slot" from them. Each such edit leaves a `Shift` on every affected item:
// - removal: delta = +1, the item starts 1 slot right of its new index and slides left
// - insertion: delta = -1, the item starts 1 slot left of its new index and slides right
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
/** In [0, 1] */
export type Fraction = number;

export type Item = { readonly id: ItemId; readonly color: Color };

/** `delta` slots of displacement still owed by an item, decaying to 0 from time `at` (ms) */
export type Shift = { readonly at: Ms; readonly delta: SlotDelta };

export const MOVE_DURATION_MS: Ms = 1000;

export const clamp01 = (x: number): Fraction => {
  if (x < 0) throw new RangeError(`clamp01: expected x >= 0, got ${x}`);
  return Math.min(1, x);
};
export const smoothstep = (x: number) => x * x * (3 - 2 * x);

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

/** Fraction of a move started at `at` still to travel: 1 → 0 */
export const remaining = (at: Ms, now: Ms): Fraction => {
  const progress = clamp01((now - at) / MOVE_DURATION_MS);
  return 1 - smoothstep(progress);
};

const isLive = (at: Ms, now: Ms) => now - at < MOVE_DURATION_MS;

export const lag = (shifts: readonly Shift[], now: Ms): SlotDelta =>
  sum(shifts.map((s) => s.delta * remaining(s.at, now)));

export class Queue {
  private readonly _items: Item[] = [];
  private nextId: ItemId = 0;
  /**
   * Shifts whose animation may still be running, keyed by item id rather than index: later edits
   * move indices around but never ids, so a shift can't end up attached to the wrong item.
   */
  private readonly shifts = new Map<ItemId, Shift[]>();
  /** When an item was inserted mid-queue, keyed by id */
  private readonly insertedAt = new Map<ItemId, Ms>();

  get items(): readonly Item[] {
    return this._items;
  }

  /** Appending displaces nobody, hence no `now` */
  push(color: Color): void {
    this._items.push({ id: this.nextId++, color });
  }

  /** `undefined` when the queue is empty */
  pop(now: Ms): Item | undefined {
    return this.removeAt(0, now);
  }

  /** `index` in [0, items.length], `items.length` appends */
  insertAt(index: Index, color: Color, now: Ms): void {
    if (index < 0 || index > this._items.length)
      throw new RangeError(`insertAt: index ${index} out of [0, ${this._items.length}]`);
    const item = { id: this.nextId++, color };
    this._items.splice(index, 0, item);
    this.insertedAt.set(item.id, now);
    this.shiftFrom(index + 1, -1, now);
  }

  /** `undefined` when `index` is out of range */
  removeAt(index: Index, now: Ms): Item | undefined {
    if (index < 0 || index >= this._items.length) return undefined;
    const [removed] = this._items.splice(index, 1);
    this.shifts.delete(removed.id);
    this.insertedAt.delete(removed.id);
    this.shiftFrom(index, +1, now);
    return removed;
  }

  /** Fractional visual slot of the item at `index` (0 = head) */
  slot(index: Index, now: Ms): Slot {
    return index + lag(this.shifts.get(this.itemAt(index).id) ?? [], now);
  }

  /** How much of its entrance the item at `index` still has to make: 1 → 0, 0 if never inserted */
  entering(index: Index, now: Ms): Fraction {
    const at = this.insertedAt.get(this.itemAt(index).id);
    return at === undefined ? 0 : remaining(at, now);
  }

  private itemAt(index: Index): Item {
    const item = this._items[index];
    if (item === undefined) throw new RangeError(`index ${index} out of [0, ${this._items.length})`);
    return item;
  }

  /**
   * The before/after-the-edit question is answered here, once, while indices are exact. Only bother
   * keeping the shifts that are recent enough, a finished one would contribute 0 to the lag anyway.
   *
   * Note that this is NOT redundant with clamp01, as `slot` might be called "long after" the last
   * edit touching an item.
   */
  private shiftFrom(start: Index, delta: SlotDelta, now: Ms): void {
    for (const { id } of this._items.slice(start)) {
      const live = (this.shifts.get(id) ?? []).filter((s) => isLive(s.at, now));
      this.shifts.set(id, [...live, { at: now, delta }]);
    }
  }
}
