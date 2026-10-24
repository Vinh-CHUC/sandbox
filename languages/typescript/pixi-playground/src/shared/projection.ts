import { ScreenPos, type WorldPos } from "./common";

/**
 * How the world's ground plane is drawn: top-down (`flat`), or 2:1 "pixel-art" isometric where
 * one world px along x moves `scale` px right and `scale / 2` px down.
 */
export type Projection =
  | { readonly kind: "flat" }
  | {
      readonly kind: "iso";
      readonly scale: number;
      /** where the world's origin lands on screen, to keep the scene in view */
      readonly offset: ScreenPos;
    };

export const FLAT: Projection = { kind: "flat" };

/**
 * World → screen. Linear (no offset), so a container's origin and its children's local positions
 * can be projected independently and still add up. `z` is height above the ground; flat is
 * top-down, so height doesn't show there.
 *
 *   project(iso, (1, 0))    → ( s, s/2)   x axis: right and down
 *   project(iso, (0, 1))    → (-s, s/2)   y axis: left and down
 *   project(iso, (0, 0), 1) → ( 0,  -s)   z axis: up
 */
export const project = (p: Projection, pos: WorldPos, z = 0): ScreenPos => {
  switch (p.kind) {
    case "flat":
      return ScreenPos(pos.x, pos.y);
    case "iso":
      return ScreenPos(
        p.scale * (pos.x - pos.y),
        (p.scale / 2) * (pos.x + pos.y) - p.scale * z,
      );
  }
};

/** Where the world's origin lands on screen: applied once, to the world's root container */
export const cameraOffset = (p: Projection): ScreenPos =>
  p.kind === "flat" ? ScreenPos(0, 0) : p.offset;
