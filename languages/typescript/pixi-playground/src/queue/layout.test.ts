import { describe, expect, it } from "vitest";
import { WallMs } from "../shared/common";
import { Queue } from "./model/queue";
import { isVertical, Layout, type Direction } from "./layout";

const layout = new Layout(48, 12, "ltr");

describe("boxWidth", () => {
  it.each([
    [1, 48], // one box
    [2, 108], // 2*48 + 12
    [3, 168], // 3*48 + 2*12
  ])("size %d → %d px", (size, expected) => {
    expect(layout.boxWidth(size)).toBe(expected);
  });
});

describe("layout", () => {
  /** Gaps between consecutive boxes at rest, taken along the queue axis */
  const gaps = (direction: Direction, sizes: number[]): number[] => {
    const ly = new Layout(48, 12, direction);
    const q = new Queue();
    sizes.forEach((size, id) => q.push({ id, color: 0, size }));

    const spans = q.items
      .map((item, i) => {
        const pos = ly.itemOffset(q.slot(i, WallMs(0)), 0);
        const { x, y } = ly.boxOrigin(pos, item.size);
        const { w, h } = ly.boxExtent(item.size);
        return isVertical(direction) ? [y, y + h] : [x, x + w];
      })
      .sort((a, b) => a[0] - b[0]);

    return spans.slice(1).map((s, i) => s[0] - spans[i][1]);
  };

  // Regression: a size-s item used to leave `s * gap` after it instead of `gap`, because the box
  // was only `size * boxSize` wide while slots advanced by `size * stride`.
  it("consecutive boxes are exactly `gap` apart, whatever their sizes", () => {
    expect(gaps("ltr", [2, 1, 3, 1])).toEqual([12, 12, 12]);
  });

  // Regression: with the slot axis reversed (ltr flows +x), boxes used to be drawn extending the
  // wrong way, overlapping the head-ward neighbour and leaving extra space toward the tail.
  it.each<Direction>(["ltr", "rtl", "ttb", "btt"])(
    "%s leaves a uniform gap on the correct side",
    (direction) => {
      expect(gaps(direction, [2, 1, 3, 1])).toEqual([12, 12, 12]);
    },
  );
});

describe("itemOffset", () => {
  const at = (direction: Direction, slot: number, entering = 0) =>
    new Layout(48, 12, direction).itemOffset(slot, entering);

  it.each<[Direction, { x: number; y: number }]>([
    ["ltr", { x: -60, y: 0 }], // tail extends -x; items advance toward +x
    ["rtl", { x: 60, y: 0 }], // reversed
    ["ttb", { x: 0, y: -60 }], // tail extends -y; items advance toward +y
    ["btt", { x: 0, y: 60 }], // reversed
  ])("%s lays its tail one stride back", (direction, expected) => {
    expect(at(direction, 1)).toEqual(expected);
  });

  it("insertions drop in along the cross axis, one stride deep", () => {
    expect(at("ltr", 0, 1)).toEqual({ x: 0, y: -60 });
    expect(at("ttb", 0, 1)).toEqual({ x: -60, y: 0 });
  });
});

describe("belt", () => {
  it("is a `length`-slot box at the head, extending towards the tail", () => {
    // ltr: the tail is leftwards, so the belt ends at the origin
    expect(new Layout(48, 12, "ltr", 2).belt()).toEqual({
      pos: { x: -108, y: 0 },
      extent: { w: 108, h: 48 },
    });
  });
});

describe("tailAlpha", () => {
  const belt = new Layout(48, 12, "ltr", 8);
  it.each([
    [0, 1, 1], // head item
    [5, 3, 1], // ends exactly at the belt's end
    [5.5, 3, 0.5], // half a slot past
    [6, 3, 0], // a whole slot past: gone
    [12, 1, 0], // way past
  ])("slot %d, size %d → %d", (slot, size, expected) => {
    expect(belt.tailAlpha(slot, size)).toBeCloseTo(expected);
  });
});

describe("clampToBelt", () => {
  const belt = new Layout(48, 12, "ltr", 8);
  it.each([
    [3, 1, 3], // fits
    [7, 1, 7], // the last slot
    [31, 1, 7], // elided: the tail end
    [31, 3, 5], // a size-3 item's last place
    [6.5, 2, 6], // part-way off: pulled back on
  ])("slot %d, size %d → %d", (slot, size, expected) => {
    expect(belt.clampToBelt(slot, size)).toBe(expected);
  });
});
