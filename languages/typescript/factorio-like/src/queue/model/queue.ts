import type {
  Fraction,
  Item,
  ItemId,
  Ms,
  Size,
  WallMs,
  WorldPos,
} from "../../shared/common";
import {
  isLive,
  lag,
  MOVE_DURATION_MS,
  remaining,
  sum,
  type Index,
  type Shift,
  type Slot,
  type SlotDelta,
} from "./utils";

/**
 * Items in order, plus how they're animated. Animations run on wall time (`WallMs`), so they
 * look the same at any playback speed: every `now` here is wall time.
 */
export class Queue {
  private readonly _items: Item[] = [];

  /** `moveMs`: how long every animation here takes (shifts, drop-ins, fly-ins), in wall ms */
  constructor(private readonly moveMs: Ms = MOVE_DURATION_MS) {}

  // "Shifts", e.g. popping() or deleting from the middle that haven't been fully animated yet
  // - The shift contains the timestamp! It allows to know how far along we are for the animation
  // of a given shift
  //
  // They are gargabe collected on:
  // - deleting an element: all of its shifts will be gone
  // - shift an element: delete stale shifts
  private readonly shifts = new Map<ItemId, Shift[]>();

  // Tracks when an item was inserted (for entrance animation that manipulates y-coordinate)
  // - Used to compute the `entering()` fraction that decays from 1 → 0
  private readonly insertedAt = new Map<ItemId, WallMs>();

  // Tracks items handed over by an upstream queue: where they fly in from (world coords) and when
  // - Used to compute `arrival()`, the fly-in from `source` to the item's slot
  private readonly arrivals = new Map<
    ItemId,
    { source: WorldPos; at: WallMs; fadeIn: boolean }
  >();

  ///////////
  // Logic //
  ///////////

  get items(): readonly Item[] {
    return this._items;
  }

  /** Appending displaces nobody, hence no `now` */
  push(item: Item): void {
    this._items.push(item);
  }

  /**
   * `item` joins at `index` (in [0, items.length]): flying in from `source` (world coords, e.g.
   * the station it just left) if given, dropping in from the side otherwise. `fadeIn` when it
   * wasn't drawn where it comes from (e.g. a store's stack), so it doesn't pop into view.
   */
  enter(
    index: Index,
    item: Item,
    now: WallMs,
    source?: WorldPos,
    fadeIn = false,
  ): void {
    if (index < 0 || index > this._items.length)
      throw new RangeError(
        `enter: index ${index} out of [0, ${this._items.length}]`,
      );
    this._items.splice(index, 0, item);
    if (source === undefined) this.insertedAt.set(item.id, now);
    else this.arrivals.set(item.id, { source, at: now, fadeIn });
    this.shiftFrom(index + 1, -item.size, now);
  }

  /** `index` in [0, items.length], `items.length` appends; drops in from the side */
  insertAt(index: Index, item: Item, now: WallMs): void {
    this.enter(index, item, now);
  }

  /** Position of item `id`, -1 if it isn't queued */
  indexOf(id: ItemId): Index {
    return this._items.findIndex((item) => item.id === id);
  }

  /** Take item `id` out from wherever it is; `undefined` if it isn't queued */
  remove(id: ItemId, now: WallMs): Item | undefined {
    const index = this.indexOf(id);
    return index < 0 ? undefined : this.removeAt(index, now);
  }

  /** Move item `id` to `index` (its position afterwards): it pops out and drops back in there */
  move(id: ItemId, index: Index, now: WallMs): void {
    const item = this.remove(id, now);
    if (item === undefined)
      throw new RangeError(`move: item ${id} isn't queued`);
    this.enter(index, item, now);
  }

  /** `undefined` when the queue is empty */
  pop(now: WallMs): Item | undefined {
    return this.removeAt(0, now);
  }

  /** `undefined` when `index` is out of range */
  removeAt(index: Index, now: WallMs): Item | undefined {
    if (index < 0 || index >= this._items.length) return undefined;
    const [removed] = this._items.splice(index, 1);
    this.shifts.delete(removed.id);
    this.insertedAt.delete(removed.id);
    this.arrivals.delete(removed.id);
    this.shiftFrom(index, +removed.size, now);
    return removed;
  }

  /////////////////////////////////
  // Helps drive animation logic //
  /////////////////////////////////

  /** Fractional visual slot of the item at `index` (0 = head), in units of one box width */
  slot(index: Index, now: WallMs): Slot {
    const item = this.itemAt(index);
    return (
      this.widthBefore(index) +
      lag(this.shifts.get(item.id) ?? [], now, this.moveMs)
    );
  }

  /** How much of its entrance the item at `index` still has to make: 1 → 0, 0 if never inserted */
  entering(index: Index, now: WallMs): Fraction {
    const at = this.insertedAt.get(this.itemAt(index).id);
    return at === undefined ? 0 : remaining(at, now, this.moveMs);
  }

  /** Fly-in of the item at `index`: `t` runs 0 → 1 (eased); null once landed or if it never flew */
  arrival(
    index: Index,
    now: WallMs,
  ): { source: WorldPos; t: Fraction; fadeIn: boolean } | null {
    const a = this.arrivals.get(this.itemAt(index).id);
    if (a === undefined || !isLive(a.at, now, this.moveMs)) return null;
    return {
      source: a.source,
      t: 1 - remaining(a.at, now, this.moveMs),
      fadeIn: a.fadeIn,
    };
  }

  ///////////////////////
  // Private functions //
  ///////////////////////
  private itemAt(index: Index): Item {
    const item = this._items[index];
    if (item === undefined)
      throw new RangeError(`index ${index} out of [0, ${this._items.length})`);
    return item;
  }

  /** Total width of the items before `index`, in box-width units */
  private widthBefore(index: Index): Size {
    return sum(this._items.slice(0, index).map((item) => item.size));
  }

  private shiftFrom(start: Index, delta: SlotDelta, now: WallMs): void {
    for (const { id } of this._items.slice(start)) {
      const live = (this.shifts.get(id) ?? []).filter((s) =>
        isLive(s.at, now, this.moveMs),
      );
      this.shifts.set(id, [...live, { at: now, delta }]);
    }
  }
}
