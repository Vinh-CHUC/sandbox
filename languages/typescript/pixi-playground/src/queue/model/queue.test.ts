import { describe, expect, it } from "vitest";
import { Queue, clamp01, lag, smoothstep, type Shift } from "./queue";

const RED = 0xff0000;
const GREEN = 0x00ff00;
const BLUE = 0x0000ff;

describe("clamp01", () => {
  it.each([
    [0, 0], [0.25, 0.25], [1, 1], [1.4, 1],
  ])("clamp01(%d) = %d", (x, expected) => {
    expect(clamp01(x)).toBe(expected);
  });

  it("throws on negatives", () => {
    expect(() => clamp01(-0.2)).toThrow(RangeError);
  });
});

describe("smoothstep", () => {
  it.each([
    [0, 0], [0.25, 0.15625], [0.5, 0.5], [0.75, 0.84375], [1, 1],
  ])("smoothstep(%d) = %d", (x, expected) => {
    expect(smoothstep(x)).toBeCloseTo(expected);
  });

  it("goes wild outside [0, 1], hence clamp01", () => {
    expect(smoothstep(1.4)).toBeCloseTo(0.392); // would drift back
    expect(smoothstep(2)).toBe(-4);
  });
});

const removedAt = (at: number): Shift => ({ at, delta: +1 });
const insertedAt = (at: number): Shift => ({ at, delta: -1 });

describe("lag", () => {
  it("is 0 with no shifts", () => {
    expect(lag([], 1234)).toBe(0);
  });

  // single pop at t=1000: remaining distance 1 → 0 over exactly one second
  it.each([
    [1000, 1], // just popped: nothing travelled yet
    [1250, 0.84375],
    [1500, 0.5],
    [1750, 0.15625],
    [2000, 0], // exactly 1s later: arrived
    [2400, 0], // finished pops contribute nothing
  ])("single pop at 1000, now=%d → %d", (now, expected) => {
    expect(lag([removedAt(1000)], now)).toBeCloseTo(expected);
  });

  // pops at 1000 and 1500: each contributes its own remaining distance
  it.each([
    [1500, 1.5], // 0.5 + 1.0
    [1750, 1.0], // 0.15625 + 0.84375
    [2000, 0.5], // 0 + 0.5
    [2500, 0], // 0 + 0
  ])("overlapping pops at 1000 & 1500, now=%d → %d", (now, expected) => {
    expect(lag([removedAt(1000), removedAt(1500)], now)).toBeCloseTo(expected);
  });

  it("an insertion lags the other way", () => {
    expect(lag([insertedAt(1000)], 1500)).toBeCloseTo(-0.5);
  });

  it("simultaneous insertion and removal cancel out", () => {
    expect(lag([removedAt(1000), insertedAt(1000)], 1500)).toBe(0);
  });
});

describe("Queue", () => {
  const queueOf = (...colors: number[]) => {
    const q = new Queue();
    colors.forEach((c) => q.push(c));
    return q;
  };

  it("push appends with increasing ids", () => {
    expect(queueOf(RED, GREEN, BLUE).items).toEqual([
      { id: 0, color: RED },
      { id: 1, color: GREEN },
      { id: 2, color: BLUE },
    ]);
  });

  it("pop is FIFO", () => {
    const q = queueOf(RED, GREEN);
    expect(q.pop(0)).toEqual({ id: 0, color: RED });
    expect(q.pop(0)).toEqual({ id: 1, color: GREEN });
    expect(q.items).toEqual([]);
  });

  it("pop on an empty queue returns undefined", () => {
    expect(new Queue().pop(0)).toBeUndefined();
  });

  it("ids are never reused, so the view can key boxes by id", () => {
    const q = queueOf(RED);
    q.pop(0);
    q.push(GREEN);
    expect(q.items).toEqual([{ id: 1, color: GREEN }]);
  });

  it("items is readonly from the outside (type-level only)", () => {
    const q = queueOf(RED);
    // @ts-expect-error: 'push' does not exist on type 'readonly Item[]'
    q.items.push({ id: 9, color: BLUE });
    // ...but it's the same array at runtime: `readonly` is erased
    expect(q.items).toHaveLength(2);
  });

  it("slot equals index when nothing has been popped", () => {
    const q = queueOf(RED, GREEN, BLUE);
    expect([0, 1, 2].map((i) => q.slot(i, 1000))).toEqual([0, 1, 2]);
  });

  it("after a pop, items slide one slot left over exactly 1s", () => {
    const q = queueOf(RED, GREEN, BLUE); // GREEN at index 1, BLUE at 2
    q.pop(1000); // GREEN now index 0, BLUE index 1

    const slots = (now: number) => [0, 1].map((i) => q.slot(i, now));
    expect(slots(1000)).toEqual([1, 2]); // same place as before the pop: no jump
    expect(slots(1500)).toEqual([0.5, 1.5]); // halfway
    expect(slots(2000)).toEqual([0, 1]); // arrived
  });

  it("a pop mid-slide stacks on top of the running one", () => {
    const q = queueOf(RED, GREEN, BLUE);
    q.pop(1000);
    q.pop(1500); // BLUE now index 0, was halfway from slot 2 to 1
    expect(q.slot(0, 1500)).toBeCloseTo(1.5);
    expect(q.slot(0, 2500)).toBeCloseTo(0);
  });

  describe("insertAt / removeAt", () => {
    const colors = (q: Queue) => q.items.map((item) => item.color);
    const slots = (q: Queue, now: number) => q.items.map((_, i) => q.slot(i, now));

    it("insertAt places the item at index", () => {
      const q = queueOf(RED, BLUE);
      q.insertAt(1, GREEN, 0);
      expect(colors(q)).toEqual([RED, GREEN, BLUE]);
    });

    it.each([-1, 3])("insertAt(%d) on a 2-item queue throws", (index) => {
      expect(() => queueOf(RED, BLUE).insertAt(index, GREEN, 0)).toThrow(RangeError);
    });

    it("removeAt returns the item at index", () => {
      const q = queueOf(RED, GREEN, BLUE);
      expect(q.removeAt(1, 0)).toEqual({ id: 1, color: GREEN });
      expect(colors(q)).toEqual([RED, BLUE]);
    });

    it.each([-1, 3])("removeAt(%d) on a 3-item queue returns undefined", (index) => {
      expect(queueOf(RED, GREEN, BLUE).removeAt(index, 0)).toBeUndefined();
    });

    it("insertAt: items after the insertion start 1 slot left and slide right", () => {
      const q = queueOf(RED, GREEN, BLUE);
      q.insertAt(1, 0xffffff, 1000); // GREEN and BLUE now at 2 and 3
      expect(slots(q, 1000)).toEqual([0, 1, 1, 2]); // inserted item overlaps GREEN, see `entering`
      expect(slots(q, 1500)).toEqual([0, 1, 1.5, 2.5]);
      expect(slots(q, 2000)).toEqual([0, 1, 2, 3]);
    });

    it("removeAt: items after the removal start 1 slot right and slide left", () => {
      const q = queueOf(RED, GREEN, BLUE, 0xffffff);
      q.removeAt(1, 1000);
      expect(slots(q, 1000)).toEqual([0, 2, 3]); // RED unaffected
      expect(slots(q, 1500)).toEqual([0, 1.5, 2.5]);
      expect(slots(q, 2000)).toEqual([0, 1, 2]);
    });

    it("shifts follow items across later edits", () => {
      const q = queueOf(RED, GREEN, BLUE);
      q.removeAt(1, 1000); // BLUE: index 1, starts at 2
      q.insertAt(0, 0xffffff, 1500); // BLUE: index 2, owes +0.5 (removal) and -1 (insertion)
      expect(q.slot(2, 1500)).toBeCloseTo(1.5); // no jump: still halfway between 2 and 1
      expect(q.slot(2, 2500)).toBeCloseTo(2);
    });

    it("entering decays 1 → 0 for inserted items, is 0 for pushed ones", () => {
      const q = queueOf(RED);
      q.insertAt(0, GREEN, 1000);
      expect([1000, 1500, 2000].map((now) => q.entering(0, now))).toEqual([1, 0.5, 0]);
      expect(q.entering(1, 1000)).toBe(0);
    });

    it("slot/entering on an out of range index throw", () => {
      expect(() => queueOf(RED).slot(1, 0)).toThrow(RangeError);
      expect(() => queueOf(RED).entering(1, 0)).toThrow(RangeError);
    });
  });
});
