import { describe, expect, it } from "vitest";
import { Queue } from "./model/queue";
import { boxWidth, stride, type Layout } from "./layout";

const layout: Layout = { boxSize: 48, gap: 12 };

describe("boxWidth", () => {
  it.each([
    [1, 48], // one box
    [2, 108], // 2*48 + 12
    [3, 168], // 3*48 + 2*12
  ])("size %d → %d px", (size, expected) => {
    expect(boxWidth(size, layout)).toBe(expected);
  });
});

describe("layout", () => {
  // Regression: a size-s item used to leave `s * gap` after it instead of `gap`, because the box
  // was only `size * boxSize` wide while slots advanced by `size * stride`.
  it("consecutive boxes are exactly `gap` apart, whatever their sizes", () => {
    const q = new Queue();
    [2, 1, 3, 1].forEach((size, id) => q.push({ id, color: 0, size }));

    const left = (i: number) => q.slot(i, 0) * stride(layout);
    const right = (i: number) => left(i) + boxWidth(q.items[i].size, layout);
    const gaps = q.items.slice(1).map((_, i) => left(i + 1) - right(i));

    expect(gaps).toEqual([layout.gap, layout.gap, layout.gap]);
  });
});
