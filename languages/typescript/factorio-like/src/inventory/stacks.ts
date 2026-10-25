import { WorldPos, type SkuId, type SkuType } from "../shared/common";
import type { Skin } from "../shared/skin";

/** Where a SKU's stack sits (box top-left, world coords) and how it's painted */
export type Stack = { readonly pos: WorldPos; readonly skin: Skin };

/**
 * Lay `skus` out in a row along x from `origin`, one `stride` apart.
 *
 *   layoutStacks((100, 50), [a, b], 44)  # {a: (100, 50), b: (144, 50)}
 */
export const layoutStacks = (
  origin: WorldPos,
  skus: readonly SkuType[],
  stride: number,
): Map<SkuId, Stack> =>
  new Map(
    skus.map(({ id, skin }, i) => [
      id,
      { pos: WorldPos(origin.x + i * stride, origin.y), skin },
    ]),
  );
