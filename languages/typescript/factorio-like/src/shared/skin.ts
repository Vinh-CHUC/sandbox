import type { Texture } from "pixi.js";
import type { Color } from "./common";
import { CORAL } from "./palette";

/**
 * Textures for a box's visible faces, each drawn as seen from outside the box ("unfolded"):
 *
 * - top: from above, texture x along world +x, texture y along world +y
 * - side: the face looking towards +y, texture x along world +x, texture y down (ground at the bottom)
 * - end: the face looking towards +x (where a belt's items head), texture x along world -y
 */
export type Faces = {
  readonly top: Texture;
  readonly side: Texture;
  readonly end: Texture;
};

/** How a box is painted: a plain colour (sides shaded darker), or textured faces */
export type Skin =
  | { readonly kind: "plain"; readonly color: Color }
  /** `alert`: outlined and tinted in that colour, e.g. a blocked item */
  | {
      readonly kind: "textured";
      readonly faces: Faces;
      readonly alert?: Color;
    };

export const plain = (color: Color): Skin => ({ kind: "plain", color });

/** `faces` when there are some, else plain `color`: what an unthemed id falls back to */
export const skinOf = (faces: Faces | undefined, color: Color): Skin =>
  faces === undefined ? plain(color) : { kind: "textured", faces };

/** The same skin, flagged as trouble: a plain box turns coral, a textured one is outlined in it */
export const alerted = (skin: Skin): Skin =>
  skin.kind === "plain" ? plain(CORAL) : { ...skin, alert: CORAL };
