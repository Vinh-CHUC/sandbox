import { describe, expect, it } from "vitest";
import { Queue, clamp01, lag, smoothstep } from "./model";

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

describe("lag", () => {
  it("is 0 with no pops", () => {
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
    expect(lag([1000], now)).toBeCloseTo(expected);
  });

  // pops at 1000 and 1500: each contributes its own remaining distance
  it.each([
    [1500, 1.5], // 0.5 + 1.0
    [1750, 1.0], // 0.15625 + 0.84375
    [2000, 0.5], // 0 + 0.5
    [2500, 0], // 0 + 0
  ])("overlapping pops at 1000 & 1500, now=%d → %d", (now, expected) => {
    expect(lag([1000, 1500], now)).toBeCloseTo(expected);
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
});
