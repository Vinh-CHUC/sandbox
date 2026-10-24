import { Text, type TextOptions } from "pixi.js";

/**
 * The one size knob: the side of an item's box, in world px. Every other size in the scene (gaps,
 * spacing, plates, parts, fonts…) is a multiple of it, so changing it scales the world as a whole.
 */
export const UNIT = 48;

/**
 * `k` units, rounded to whole px
 *
 *   units(1)     # 48
 *   units(0.25)  # 12
 */
export const units = (k: number): number => Math.round(k * UNIT);

/** The most the camera can zoom in: text is rendered sharp enough for that */
export const MAX_ZOOM = 4;

/**
 * Text, rendered at a resolution that stays sharp up to MAX_ZOOM (pixi rasterises text once, at
 * its resolution, so scaling it up afterwards would blur it)
 */
export const sharpText = (options: TextOptions): Text =>
  new Text({
    ...options,
    resolution: (globalThis.devicePixelRatio ?? 1) * MAX_ZOOM,
  });
