import type { Size } from "./model/utils";

export type Layout = { readonly boxSize: number; readonly gap: number };

/** Distance between the left edges of two adjacent slots */
export const stride = ({ boxSize, gap }: Layout): number => boxSize + gap;

/** Width of an item spanning `size` slots: `size` boxes plus the `size - 1` inner gaps */
export const boxWidth = (size: Size, { boxSize, gap }: Layout): number =>
  size * boxSize + (size - 1) * gap;
