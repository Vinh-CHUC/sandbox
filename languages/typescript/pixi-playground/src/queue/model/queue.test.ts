import { describe, expect, it } from "vitest";
import { Queue } from "./queue";
import { WallMs, WorldPos, type Item } from "../../shared/common";
import { lag, type Shift } from "./utils";

const RED = 0xff0000;
const GREEN = 0x00ff00;
const BLUE = 0x0000ff;
const WHITE = 0xffffff;

const item = (id: number, color: number, size = 1): Item => ({
  id,
  color,
  size,
});

/** Queue animations run on wall time: every time below is one */
const w = WallMs;

const removedAt = (at: number): Shift => ({ at: w(at), delta: +1 });
const insertedAt = (at: number): Shift => ({ at: w(at), delta: -1 });

describe("lag", () => {
  it("is 0 with no shifts", () => {
    expect(lag([], w(1234))).toBe(0);
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
    expect(lag([removedAt(1000)], w(now))).toBeCloseTo(expected);
  });

  // pops at 1000 and 1500: each contributes its own remaining distance
  it.each([
    [1500, 1.5], // 0.5 + 1.0
    [1750, 1.0], // 0.15625 + 0.84375
    [2000, 0.5], // 0 + 0.5
    [2500, 0], // 0 + 0
  ])("overlapping pops at 1000 & 1500, now=%d → %d", (now, expected) => {
    expect(lag([removedAt(1000), removedAt(1500)], w(now))).toBeCloseTo(
      expected,
    );
  });

  it("an insertion lags the other way", () => {
    expect(lag([insertedAt(1000)], w(1500))).toBeCloseTo(-0.5);
  });

  it("simultaneous insertion and removal cancel out", () => {
    expect(lag([removedAt(1000), insertedAt(1000)], w(1500))).toBe(0);
  });
});

describe("Queue", () => {
  const queueOf = (...colors: number[]) => {
    const q = new Queue();
    colors.forEach((color, id) => q.push(item(id, color)));
    return q;
  };

  it("push appends the caller's items", () => {
    expect(queueOf(RED, GREEN, BLUE).items).toEqual([
      { id: 0, color: RED, size: 1 },
      { id: 1, color: GREEN, size: 1 },
      { id: 2, color: BLUE, size: 1 },
    ]);
  });

  it("pop is FIFO", () => {
    const q = queueOf(RED, GREEN);
    expect(q.pop(w(0))).toEqual({ id: 0, color: RED, size: 1 });
    expect(q.pop(w(0))).toEqual({ id: 1, color: GREEN, size: 1 });
    expect(q.items).toEqual([]);
  });

  it("pop on an empty queue returns undefined", () => {
    expect(new Queue().pop(w(0))).toBeUndefined();
  });

  it("stores the item verbatim, so the view can key boxes by the caller's id", () => {
    const q = new Queue();
    q.push(item(42, GREEN, 2));
    expect(q.items).toEqual([{ id: 42, color: GREEN, size: 2 }]);
  });

  it("items is readonly from the outside (type-level only)", () => {
    const q = queueOf(RED);
    // @ts-expect-error: 'push' does not exist on type 'readonly Item[]'
    q.items.push(item(9, BLUE));
    // ...but it's the same array at runtime: `readonly` is erased
    expect(q.items).toHaveLength(2);
  });

  it("slot equals index when nothing has been popped", () => {
    const q = queueOf(RED, GREEN, BLUE);
    expect([0, 1, 2].map((i) => q.slot(i, w(1000)))).toEqual([0, 1, 2]);
  });

  it("after a pop, items slide one slot left over exactly 1s", () => {
    const q = queueOf(RED, GREEN, BLUE); // GREEN at index 1, BLUE at 2
    q.pop(w(1000)); // GREEN now index 0, BLUE index 1

    const slots = (now: number) => [0, 1].map((i) => q.slot(i, w(now)));
    expect(slots(1000)).toEqual([1, 2]); // same place as before the pop: no jump
    expect(slots(1500)).toEqual([0.5, 1.5]); // halfway
    expect(slots(2000)).toEqual([0, 1]); // arrived
  });

  it("a pop mid-slide stacks on top of the running one", () => {
    const q = queueOf(RED, GREEN, BLUE);
    q.pop(w(1000));
    q.pop(w(1500)); // BLUE now index 0, was halfway from slot 2 to 1
    expect(q.slot(0, w(1500))).toBeCloseTo(1.5);
    expect(q.slot(0, w(2500))).toBeCloseTo(0);
  });

  describe("size", () => {
    it("at rest, slot is the cumulative width of the items before it", () => {
      const q = new Queue();
      q.push(item(0, RED, 2));
      q.push(item(1, GREEN, 1));
      q.push(item(2, BLUE, 3));
      expect([0, 1, 2].map((i) => q.slot(i, w(0)))).toEqual([0, 2, 3]);
    });

    it("removing a wide item shifts the rest by its size", () => {
      const q = new Queue();
      q.push(item(0, RED, 2));
      q.push(item(1, GREEN, 1));
      q.removeAt(0, w(1000)); // RED (size 2) out, GREEN owes +2
      expect(q.slot(0, w(1000))).toBeCloseTo(2); // no jump
      expect(q.slot(0, w(1500))).toBeCloseTo(1); // halfway
      expect(q.slot(0, w(2000))).toBeCloseTo(0); // arrived
    });

    it("inserting a wide item shifts the rest by its size", () => {
      const q = new Queue();
      q.push(item(0, GREEN, 1));
      q.insertAt(0, item(1, RED, 2), w(1000)); // GREEN owes -2
      expect(q.slot(1, w(1000))).toBeCloseTo(0); // no jump
      expect(q.slot(1, w(1500))).toBeCloseTo(1); // halfway
      expect(q.slot(1, w(2000))).toBeCloseTo(2); // arrived
    });
  });

  describe("insertAt / removeAt", () => {
    const colors = (q: Queue) => q.items.map((item) => item.color);
    const slots = (q: Queue, now: number) =>
      q.items.map((_, i) => q.slot(i, w(now)));

    it("insertAt places the item at index", () => {
      const q = queueOf(RED, BLUE);
      q.insertAt(1, item(9, GREEN), w(0));
      expect(colors(q)).toEqual([RED, GREEN, BLUE]);
    });

    it.each([-1, 3])("insertAt(%d) on a 2-item queue throws", (index) => {
      expect(() =>
        queueOf(RED, BLUE).insertAt(index, item(9, GREEN), w(0)),
      ).toThrow(RangeError);
    });

    it("removeAt returns the item at index", () => {
      const q = queueOf(RED, GREEN, BLUE);
      expect(q.removeAt(1, w(0))).toEqual({
        id: 1,
        color: GREEN,
        size: 1,
      });
      expect(colors(q)).toEqual([RED, BLUE]);
    });

    it.each([-1, 3])(
      "removeAt(%d) on a 3-item queue returns undefined",
      (index) => {
        expect(queueOf(RED, GREEN, BLUE).removeAt(index, w(0))).toBeUndefined();
      },
    );

    it("insertAt: items after the insertion start 1 slot left and slide right", () => {
      const q = queueOf(RED, GREEN, BLUE);
      q.insertAt(1, item(9, WHITE), w(1000)); // GREEN and BLUE now at 2 and 3
      expect(slots(q, 1000)).toEqual([0, 1, 1, 2]); // inserted item overlaps GREEN, see `entering`
      expect(slots(q, 1500)).toEqual([0, 1, 1.5, 2.5]);
      expect(slots(q, 2000)).toEqual([0, 1, 2, 3]);
    });

    it("removeAt: items after the removal start 1 slot right and slide left", () => {
      const q = queueOf(RED, GREEN, BLUE, WHITE);
      q.removeAt(1, w(1000));
      expect(slots(q, 1000)).toEqual([0, 2, 3]); // RED unaffected
      expect(slots(q, 1500)).toEqual([0, 1.5, 2.5]);
      expect(slots(q, 2000)).toEqual([0, 1, 2]);
    });

    it("shifts follow items across later edits", () => {
      const q = queueOf(RED, GREEN, BLUE);
      q.removeAt(1, w(1000)); // BLUE: index 1, starts at 2
      q.insertAt(0, item(9, WHITE), w(1500)); // BLUE: index 2, owes +0.5 (removal) and -1 (insertion)
      expect(q.slot(2, w(1500))).toBeCloseTo(1.5); // no jump: still halfway between 2 and 1
      expect(q.slot(2, w(2500))).toBeCloseTo(2);
    });

    it("entering decays 1 → 0 for inserted items, is 0 for pushed ones", () => {
      const q = queueOf(RED);
      q.insertAt(0, item(9, GREEN), w(1000));
      expect([1000, 1500, 2000].map((now) => q.entering(0, w(now)))).toEqual([
        1, 0.5, 0,
      ]);
      expect(q.entering(1, w(1000))).toBe(0);
    });

    it("slot/entering on an out of range index throw", () => {
      expect(() => queueOf(RED).slot(1, w(0))).toThrow(RangeError);
      expect(() => queueOf(RED).entering(1, w(0))).toThrow(RangeError);
    });
  });
});

describe("enter with a source / arrival", () => {
  const source = WorldPos(10, 20);

  it("flies in from `source` over MOVE_DURATION_MS", () => {
    const q = new Queue();
    q.push(item(1, RED));
    q.enter(1, item(2, GREEN), w(0), source);
    expect(q.items.map((i) => i.id)).toEqual([1, 2]);
    expect(q.arrival(1, w(0))).toEqual({ source, t: 0, fadeIn: false });
    expect(q.arrival(1, w(500))?.t).toBeCloseTo(0.5); // smoothstep(0.5) = 0.5
    expect(q.arrival(1, w(1000))).toBeNull(); // landed
  });

  it("is null for items that were pushed or inserted", () => {
    const q = new Queue();
    q.push(item(1, RED));
    q.insertAt(0, item(2, GREEN), w(0));
    expect(q.arrival(0, w(0))).toBeNull();
    expect(q.arrival(1, w(0))).toBeNull();
  });
});

describe("remove / move", () => {
  const ids = (q: Queue) => q.items.map((i) => i.id);
  const queueOf123 = () => {
    const q = new Queue();
    for (const id of [1, 2, 3]) q.push(item(id, RED));
    return q;
  };

  it("remove takes an item out by id, from anywhere", () => {
    const q = queueOf123();
    expect(q.remove(2, w(0))?.id).toBe(2);
    expect(ids(q)).toEqual([1, 3]);
    expect(q.remove(9, w(0))).toBeUndefined();
  });

  it("move puts an item at its new index, dropping it back in", () => {
    const q = queueOf123();
    q.move(3, 0, w(0));
    expect(ids(q)).toEqual([3, 1, 2]);
    expect(q.entering(0, w(0))).toBe(1); // starts its drop-in
    expect(() => q.move(9, 0, w(0))).toThrow(RangeError);
  });
});

describe("animation duration", () => {
  it("is set per queue, e.g. longer for hours-long traces", () => {
    const q = new Queue(10_000);
    q.insertAt(0, item(1, RED), w(0));
    expect(q.entering(0, w(5_000))).toBeCloseTo(0.5); // halfway through a 10 s drop-in
    expect(q.entering(0, w(10_000))).toBe(0);
  });
});

describe("arrival fade-in", () => {
  it("is carried on the arrival, for items that weren't drawn where they came from", () => {
    const q = new Queue();
    q.enter(0, item(1, RED), w(0), WorldPos(5, 5), true);
    q.enter(1, item(2, RED), w(0), WorldPos(5, 5));
    expect(q.arrival(0, w(100))?.fadeIn).toBe(true);
    expect(q.arrival(1, w(100))?.fadeIn).toBe(false);
  });
});
