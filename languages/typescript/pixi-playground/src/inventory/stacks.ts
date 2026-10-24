import {
  WorldPos,
  type Color,
  type PartId,
  type PartType,
} from "../shared/common";

/** Where a part's stack sits (box top-left, world coords) and how it's painted */
export type Stack = { readonly pos: WorldPos; readonly color: Color };

/**
 * Lay `parts` out in a row along x from `origin`, one `stride` apart.
 *
 *   layoutStacks((100, 50), [a, b], 44)  # {a: (100, 50), b: (144, 50)}
 */
export const layoutStacks = (
  origin: WorldPos,
  parts: readonly PartType[],
  stride: number,
): Map<PartId, Stack> =>
  new Map(
    parts.map(({ id, color }, i) => [
      id,
      { pos: WorldPos(origin.x + i * stride, origin.y), color },
    ]),
  );
