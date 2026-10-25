import { describe, expect, it } from "vitest";
import { WorldPos } from "../shared/common";
import { along, cumulative, sideways } from "./layout";

const P = (x: number, y: number) => WorldPos(x, y);
/** Right, then down: 10 + 10 long */
const elbow = [P(0, 0), P(10, 0), P(10, 10)];

describe("cumulative", () => {
  it.each([
    [
      [P(0, 0), P(3, 4), P(3, 10)],
      [0, 5, 11],
    ],
    [elbow, [0, 10, 20]],
    [[P(1, 1)], [0]],
  ])("%j → %j", (path, expected) => {
    expect(cumulative(path)).toEqual(expected);
  });
});

describe("along", () => {
  it.each([
    [0, P(0, 0)],
    [0.25, P(5, 0)],
    [0.5, P(10, 0)], // the corner
    [0.75, P(10, 5)],
    [1, P(10, 10)],
  ])("%d of the way → %j", (f, expected) => {
    expect(along(elbow, f)).toEqual(expected);
  });

  it("goes at a constant speed whatever the segments' lengths", () => {
    const uneven = [P(0, 0), P(2, 0), P(2, 18)];
    const steps = [0, 0.1, 0.2, 0.3].map((f) => along(uneven, f));
    const gaps = steps
      .slice(1)
      .map((p, i) => Math.hypot(p.x - steps[i].x, p.y - steps[i].y));
    for (const gap of gaps) expect(gap).toBeCloseTo(2);
  });
});

describe("sideways", () => {
  it("moves a path to the right of travel, corners mitred", () => {
    expect(sideways(elbow, 1)).toEqual([P(0, 1), P(9, 1), P(9, 10)]);
  });

  it("two lanes: the way back is on the other side", () => {
    const back = sideways([...elbow].reverse(), 1);
    expect(back).toEqual([P(11, 10), P(11, -1), P(0, -1)]);
  });
});
