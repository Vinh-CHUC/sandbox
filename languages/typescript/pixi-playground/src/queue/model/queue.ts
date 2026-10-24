import type { Fraction, Item, ItemId, Ms, Size } from "../../shared/common";
import {
  isLive,
  lag,
  remaining,
  sum,
  type Index,
  type Shift,
  type Slot,
  type SlotDelta,
} from "./utils";

export class Queue {
  private readonly _items: Item[] = [];

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
  private readonly insertedAt = new Map<ItemId, Ms>();

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

  /** `index` in [0, items.length], `items.length` appends */
  insertAt(index: Index, item: Item, now: Ms): void {
    if (index < 0 || index > this._items.length)
      throw new RangeError(
        `insertAt: index ${index} out of [0, ${this._items.length}]`,
      );
    this._items.splice(index, 0, item);
    this.insertedAt.set(item.id, now);
    this.shiftFrom(index + 1, -item.size, now);
  }

  /** `undefined` when the queue is empty */
  pop(now: Ms): Item | undefined {
    return this.removeAt(0, now);
  }

  /** `undefined` when `index` is out of range */
  removeAt(index: Index, now: Ms): Item | undefined {
    if (index < 0 || index >= this._items.length) return undefined;
    const [removed] = this._items.splice(index, 1);
    this.shifts.delete(removed.id);
    this.insertedAt.delete(removed.id);
    this.shiftFrom(index, +removed.size, now);
    return removed;
  }

  /////////////////////////////////
  // Helps drive animation logic //
  /////////////////////////////////

  /** Fractional visual slot of the item at `index` (0 = head), in units of one box width */
  slot(index: Index, now: Ms): Slot {
    const item = this.itemAt(index);
    return this.widthBefore(index) + lag(this.shifts.get(item.id) ?? [], now);
  }

  /** How much of its entrance the item at `index` still has to make: 1 → 0, 0 if never inserted */
  entering(index: Index, now: Ms): Fraction {
    const at = this.insertedAt.get(this.itemAt(index).id);
    return at === undefined ? 0 : remaining(at, now);
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

  private shiftFrom(start: Index, delta: SlotDelta, now: Ms): void {
    for (const { id } of this._items.slice(start)) {
      const live = (this.shifts.get(id) ?? []).filter((s) => isLive(s.at, now));
      this.shifts.set(id, [...live, { at: now, delta }]);
    }
  }
}
