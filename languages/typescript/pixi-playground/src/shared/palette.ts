import { mixColor, type Color } from "./common";

/**
 * The scene's colours, by role: what something *is* picks its hue family; members of a family
 * differ by lightness only (which survives colour blindness and greyscale).
 *
 * - ground: neutrals, light inside sites so shaded iso faces read well
 * - items: a teal family; parts (SKUs): an amber family
 * - coral: reserved for trouble (e.g. an empty stack)
 */

/** Outside the sites */
export const GROUND = 0x5f666d;
/** Inside a site */
export const SITE_FLOOR = 0xebe7df;
/** Belts, plates, fences, arcs and text on the floor */
export const CHARCOAL = 0x3d4247;
export const CORAL = 0xe4572e;
export const WHITE = 0xffffff;

/** Dark → light */
export const ITEM_RAMP: readonly Color[] = [
  0x1f6f78, 0x2a8a94, 0x3aa3ad, 0x5cbcc4,
];
const SKU_RAMP_ENDS: readonly [Color, Color] = [0x7a4a0c, 0xf3cc85];

/**
 * An item's colour: one of the teal steps, by id, just enough texture to follow one along a
 * belt (it doesn't mean anything)
 *
 *   itemColor(0)  # 0x1f6f78
 *   itemColor(5)  # 0x2a8a94
 */
export const itemColor = (id: number): Color => ITEM_RAMP[itemShade(id)];

/** Which teal step an item gets, 0 (darkest) to ITEM_RAMP.length - 1 */
export const itemShade = (id: number): number =>
  ((id % ITEM_RAMP.length) + ITEM_RAMP.length) % ITEM_RAMP.length;

/**
 * The `index`th of `count` SKUs: evenly spaced along the amber ramp, dark to light, so a row of
 * stacks reads as a gradient and a flying part matches its stack
 *
 *   skuColor(0, 5)  # 0x7a4a0c
 *   skuColor(4, 5)  # 0xf3cc85
 */
export const skuColor = (index: number, count: number): Color =>
  mixColor(
    SKU_RAMP_ENDS[0],
    SKU_RAMP_ENDS[1],
    count <= 1 ? 0 : index / (count - 1),
  );

/**
 * The `index`th of `count` item types: spread along the teal family, dark to light, so a
 * type reads as a shade of "item"
 *
 *   itemTypeColor(0, 4)  # 0x1f6f78
 *   itemTypeColor(3, 4)  # 0x5cbcc4
 */
export const itemTypeColor = (index: number, count: number): Color =>
  mixColor(
    ITEM_RAMP[0],
    ITEM_RAMP[ITEM_RAMP.length - 1],
    count <= 1 ? 0 : index / (count - 1),
  );
