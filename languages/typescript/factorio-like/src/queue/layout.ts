import {
  clamp01,
  WorldPos,
  type Extent,
  type Fraction,
  type Pos,
  type Size,
} from "../shared/common";

/** Which way a queue advances, from its tail to its head */
export type Direction = "ltr" | "rtl" | "ttb" | "btt";

/**
 * Unit vectors per direction. `slot` points from the head (slot 0) toward the tail, so items
 * always advance in the `-slot` direction (e.g. `ltr` flows toward +x, exiting at the head).
 * `cross` is where an inserted item drops in from.
 */
const AXES: Record<Direction, { readonly slot: Pos; readonly cross: Pos }> = {
  ltr: { slot: { x: -1, y: 0 }, cross: { x: 0, y: -1 } }, // flows +x, head on the right
  rtl: { slot: { x: 1, y: 0 }, cross: { x: 0, y: -1 } }, // flows -x, head on the left
  ttb: { slot: { x: 0, y: -1 }, cross: { x: -1, y: 0 } }, // flows +y, head at the bottom
  btt: { slot: { x: 0, y: 1 }, cross: { x: 1, y: 0 } }, // flows -y, head at the top
};

export const isVertical = (d: Direction): boolean => d === "ttb" || d === "btt";

/** How many slots a belt shows before its tail is elided, unless the spec says otherwise */
export const DEFAULT_BELT_LENGTH = 8;

/**
 * The geometry of a conveyor belt: box size, spacing, flow direction, and how many slots long the
 * visible belt is (items beyond it are elided).
 *
 * Deliberately unaware of where the queue sits on screen: every `WorldPos` is relative to the queue
 * origin (the head's anchor, slot 0). The owner places the whole belt by positioning the pixi
 * container holding its boxes, so children inherit the translation and no method here adds an
 * origin. Callers that cross containers (e.g. dispatching to a station) add it themselves.
 */
export class Layout {
  constructor(
    readonly boxSize: number,
    readonly gap: number,
    readonly direction: Direction,
    readonly length: number = DEFAULT_BELT_LENGTH,
  ) {}

  /** Distance between the near edges of two adjacent slots */
  private get stride(): number {
    return this.boxSize + this.gap;
  }

  private get isVertical(): boolean {
    return isVertical(this.direction);
  }

  // A box of size > 1 incorporates gaps in it, helps to have a fixed grid layout simpler
  public boxWidth(size: Size): number {
    return size * this.boxSize + (size - 1) * this.gap;
  }

  /** Box dimensions of an item; the long side follows the queue axis */
  public boxExtent(size: Size): Extent {
    return this.isVertical
      ? { w: this.boxSize, h: this.boxWidth(size) }
      : { w: this.boxWidth(size), h: this.boxSize };
  }

  /** Pixel offset from the queue origin for a fractional `slot` and `entering` amount */
  public itemOffset(slot: number, entering: number): WorldPos {
    const { slot: s, cross: c } = AXES[this.direction];
    const d = this.stride;
    return WorldPos(
      (slot * s.x + entering * c.x) * d,
      (slot * s.y + entering * c.y) * d,
    );
  }

  /**
   * Top-left corner to draw an item's box at, given its slot position. The box spans `size`
   * slots *toward the tail*, i.e. along the slot axis, which may be negative.
   */
  public boxOrigin(pos: WorldPos, size: Size): WorldPos {
    const { slot: s } = AXES[this.direction];
    const { w, h } = this.boxExtent(size);
    return WorldPos(pos.x + (s.x < 0 ? -w : 0), pos.y + (s.y < 0 ? -h : 0));
  }

  /** The visible belt: a box `length` slots long sitting at slot 0, top-left and footprint */
  public belt(): { readonly pos: WorldPos; readonly extent: Extent } {
    return {
      pos: this.boxOrigin(this.itemOffset(0, 0), this.length),
      extent: this.boxExtent(this.length),
    };
  }

  /**
   * The belt shows slots `[from, from + length[` (`from` > 0 once scrolled toward the tail). The
   * nearest slot on it for an item of `size`: `slot` itself if it's shown, the window's nearest end
   * otherwise. Where to fly to (or from) an item whose real slot is elided, rather than some point
   * far past the belt (over whatever lies upstream).
   *
   *   clampToBelt(3, 1)      # 3    fits a length-8 belt
   *   clampToBelt(31, 1)     # 7    the last slot
   *   clampToBelt(31, 3)     # 5    the last place a size-3 item fits
   *   clampToBelt(2, 1, 8)   # 8    scrolled past it: the window's head end
   */
  public clampToBelt(slot: number, size: Size, from = 0): number {
    return Math.max(from, Math.min(slot, from + this.length - size));
  }

  /**
   * How visible an item at (fractional) `slot` is, with the window at `from`: 1 while it's shown,
   * fading to 0 as it sticks out of either end by up to one more slot.
   *
   *   windowAlpha(5, 3)       # 1     ends at slot 8: fits a length-8 belt
   *   windowAlpha(5.5, 3)     # 0.5   half a slot past the tail end
   *   windowAlpha(7, 3)       # 0     two slots past
   *   windowAlpha(7.5, 1, 8)  # 0.5   half a slot before the head end
   */
  public windowAlpha(slot: number, size: Size, from = 0): Fraction {
    const shown = slot - from;
    const tail = Math.max(0, shown + size - this.length);
    const head = Math.max(0, -shown);
    return (1 - clamp01(tail)) * (1 - clamp01(head));
  }

  /**
   * Where the window goes `pages` belt lengths on from `from`, for `total` slots of items: never
   * before the head, nor past where the last item shows at the tail end.
   *
   *   page(0, 1, 30)    # 8
   *   page(16, 1, 30)   # 22   the last full window
   *   page(8, -1, 30)   # 0
   *   page(22, 0, 10)   # 2    the queue shrank: pulled back
   */
  public page(from: number, pages: number, total: number): number {
    const last = Math.max(0, total - this.length);
    return Math.max(0, Math.min(from + pages * this.length, last));
  }
}
