import { lerp, WorldPos, type Fraction } from "../shared/common";

/** A polyline on the ground, e.g. a road's centreline from its `a` end to its `b` end */
export type Path = readonly WorldPos[];

/**
 * Distance along `path` at each of its points
 *
 *   cumulative([(0, 0), (3, 4), (3, 10)])  # [0, 5, 11]
 */
export const cumulative = (path: Path): number[] =>
  path.reduce<number[]>(
    (acc, p, i) =>
      i === 0
        ? [0]
        : [
            ...acc,
            acc[i - 1] + Math.hypot(p.x - path[i - 1].x, p.y - path[i - 1].y),
          ],
    [],
  );

/**
 * The point `f` of the way along `path` by length, so a constant `f` rate is a constant speed:
 * the segment the distance falls in (from the cumulative lengths), then where within it
 *
 *   along([(0, 0), (10, 0), (10, 10)], 0.75)  # (10, 5)
 */
export const along = (path: Path, f: Fraction): WorldPos => {
  const lengths = cumulative(path);
  const d = f * lengths[lengths.length - 1];
  // The last segment starting at or before `d` (zero-length ones skipped)
  let i = 0;
  while (i < path.length - 2 && lengths[i + 1] <= d) i++;
  const span = lengths[i + 1] - lengths[i];
  const t = span === 0 ? 0 : (d - lengths[i]) / span;
  const [p, q] = [path[i], path[i + 1]];
  return WorldPos(lerp(p.x, q.x, t), lerp(p.y, q.y, t));
};

/** Unit normal to the right of travel from `p` to `q` (y grows downward) */
const rightOf = (p: WorldPos, q: WorldPos) => {
  const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
  return { x: -(q.y - p.y) / len, y: (q.x - p.x) / len };
};

/**
 * `path` moved `offset` to the right of travel, corners mitred: a lane
 *
 *   sideways([(0, 0), (10, 0), (10, 10)], 1)  # [(0, 1), (9, 1), (9, 10)]
 */
export const sideways = (path: Path, offset: number): WorldPos[] =>
  path.map((p, i) => {
    const before = i > 0 ? rightOf(path[i - 1], p) : undefined;
    const after = i < path.length - 1 ? rightOf(p, path[i + 1]) : undefined;
    const [n1, n2] = [before ?? after!, after ?? before!];
    // The mitre: where both segments' offset lines meet
    const k = offset / (1 + n1.x * n2.x + n1.y * n2.y);
    return WorldPos(p.x + (n1.x + n2.x) * k, p.y + (n1.y + n2.y) * k);
  });
