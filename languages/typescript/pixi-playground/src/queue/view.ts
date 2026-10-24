import {
  Container,
  Graphics,
  type FederatedPointerEvent,
  type Text,
} from "pixi.js";
import type { Queue } from "./model/queue";
import {
  clamp01,
  lerp,
  smoothstep,
  WallMs,
  WorldPos,
  type Item,
  type ItemId,
  type Pos,
} from "../shared/common";
import { depth, drawBox, drawPlate, placeAt } from "../shared/draw";
import { CHARCOAL } from "../shared/palette";
import { FLAT, project, type Projection } from "../shared/projection";
import { alerted } from "../shared/skin";
import { type Layout } from "./layout";
import { FONT, LABEL_GAP, sharpText, units } from "../shared/scale";

/** The belt plate under the boxes, `BELT_MARGIN` beyond them on every side */
const BELT_MARGIN = units(0.17);
const BELT_COLOR = CHARCOAL;
/** How long the belt takes to scroll a page, in wall ms */
const SCROLL_MS = 300;

/** A "+N" count past one end of the belt; clicking it scrolls the belt that way */
const elisionLabel = (onClick: () => void): Text => {
  const label = sharpText({
    text: "",
    style: { fontSize: FONT.title, fontWeight: "bold", fill: CHARCOAL },
  });
  label.anchor.set(0.5);
  label.zIndex = Infinity;
  label.eventMode = "static";
  label.cursor = "pointer";
  // Not the start of a drag-pan
  label.on("pointerdown", (e) => e.stopPropagation());
  label.on("pointertap", onClick);
  return label;
};

export const buildBoxGraphics = (
  item: Item,
  alert: boolean,
  layout: Layout,
  p: Projection,
): Graphics =>
  drawBox(
    new Graphics(),
    p,
    layout.boxExtent(item.size),
    layout.boxSize,
    alert ? alerted(item.skin) : item.skin,
  );

export type QueueViewOptions = {
  /** shown above the belt's tail end */
  readonly name?: string;
  /** whether an item is in trouble now, e.g. blocked: drawn alerted (see `alerted`) */
  readonly alertOf?: (item: Item) => boolean;
  /** the item under the pointer (client coords), or null once the pointer leaves it */
  readonly onItemHover?: (item: ItemId | null, at: Pos) => void;
};

// The container will be positioned by a layer upstream, see `setPosition`
export class QueueView {
  public readonly queue_container = new Container();
  /** One box per queued item, and whether it was drawn alerted (redrawn when that changes) */
  private readonly boxes = new Map<
    ItemId,
    { graphic: Graphics; alert: boolean }
  >();
  private readonly belt = new Graphics();
  private readonly title = sharpText({
    text: "",
    style: { fontSize: FONT.title, fontWeight: "bold", fill: CHARCOAL },
  });
  /** "+N" just past the belt's ends: how many items are hidden that way; click to scroll there */
  private readonly behind = elisionLabel(() => this.pageBy(1));
  private readonly ahead = elisionLabel(() => this.pageBy(-1));
  /**
   * The belt shows slots `[offset, offset + length[`; `offset` eases from `from` to `to` since
   * wall time `at` (see `offset`)
   */
  private scroll = { from: 0, to: 0, at: WallMs(0) };
  /** The last `render`'s wall time: when a click happens, as far as animations go */
  private now = WallMs(0);
  private origin = WorldPos(0, 0);
  private projection: Projection = FLAT;

  constructor(
    private readonly queue: Queue,
    private readonly layout: Layout,
    private readonly options: QueueViewOptions = {},
  ) {
    // Painter's order in iso: boxes closer to the viewer on top; the belt under all of them
    this.queue_container.sortableChildren = true;
    this.belt.zIndex = -Infinity;
    this.title.text = options.name ?? "";
    this.title.anchor.set(0, 1);
    this.title.zIndex = Infinity;
    this.queue_container.addChild(
      this.belt,
      this.behind,
      this.ahead,
      this.title,
    );
    this.setProjection(FLAT);
  }

  /** Place the whole belt in the world; box offsets stay relative to this origin */
  public setPosition(origin: WorldPos): void {
    this.origin = origin;
    placeAt(this.queue_container, project(this.projection, origin));
  }

  /** Re-place and redraw the belt, and drop the boxes so `render` rebuilds them for `p` */
  public setProjection(p: Projection): void {
    this.projection = p;
    for (const { graphic } of this.boxes.values()) graphic.destroy();
    this.boxes.clear();
    this.drawBelt();
    this.setPosition(this.origin);
  }

  /** Where the belt's window starts, in slots, at wall time `now` (0 unless scrolled) */
  public offset(now: WallMs): number {
    const { from, to, at } = this.scroll;
    return lerp(from, to, smoothstep(clamp01((now - at) / SCROLL_MS)));
  }

  /** Scroll `pages` belt lengths toward the tail (or the head, if negative) */
  public pageBy(pages: number): void {
    this.scrollTo(this.layout.page(this.scroll.to, pages, this.totalSlots()));
  }

  /** Back to showing the head */
  public resetScroll(): void {
    this.scrollTo(0);
  }

  /** Redraw as of wall time `now`: queue animations run on wall time, see `Queue` */
  public render(now: WallMs): void {
    this.now = now;
    // Stays within the queue as it shrinks
    this.pageBy(0);
    const off = this.offset(now);
    const q = this.queue;
    const alive = new Set(q.items.map((item) => item.id));
    for (const [id, { graphic }] of this.boxes) {
      // Delete boxes that don't match any queue member anymore
      if (alive.has(id)) continue;
      graphic.destroy();
      this.boxes.delete(id);
    }

    q.items.forEach((item, i) => {
      const g = this.boxOf(item);
      const pos = this.boxPos(i, now);
      placeAt(g, project(this.projection, pos));
      g.zIndex = depth(this.projection, pos, this.layout.boxExtent(item.size));
      g.alpha = this.alpha(i, now);
      g.visible = g.alpha > 0;
    });

    let ahead = 0;
    let behind = 0;
    q.items.forEach((item, i) => {
      const shown = q.slot(i, now) - off;
      if (shown < 0) ahead++;
      else if (shown + item.size > this.layout.length) behind++;
    });
    showCount(this.ahead, ahead);
    showCount(this.behind, behind);
  }

  private scrollTo(target: number): void {
    if (target === this.scroll.to) return;
    this.scroll = { from: this.offset(this.now), to: target, at: this.now };
  }

  /** How many slots all the queue's items take */
  private totalSlots(): number {
    return this.queue.items.reduce((total, item) => total + item.size, 0);
  }

  /** The item's box, alerted or not: built on first sight, rebuilt when that changes */
  private boxOf(item: Item): Graphics {
    const alert = this.options.alertOf?.(item) ?? false;
    const box = this.boxes.get(item.id);
    if (box !== undefined && box.alert === alert) return box.graphic;
    box?.graphic.destroy();
    const graphic = buildBoxGraphics(item, alert, this.layout, this.projection);
    const { onItemHover } = this.options;
    if (onItemHover !== undefined) {
      graphic.eventMode = "static";
      const hover = (e: FederatedPointerEvent) =>
        onItemHover(item.id, { x: e.clientX, y: e.clientY });
      graphic.on("pointerover", hover);
      graphic.on("pointermove", hover);
      graphic.on("pointerout", (e) =>
        onItemHover(null, { x: e.clientX, y: e.clientY }),
      );
    }
    this.boxes.set(item.id, { graphic, alert });
    this.queue_container.addChild(graphic);
    return graphic;
  }

  /**
   * Items past the belt's end fade out (see `Layout.tailAlpha`); one flying in towards such a slot
   * fades away on its way, rather than landing somewhere invisible.
   */
  private alpha(index: number, now: WallMs): number {
    const q = this.queue;
    const tail = this.layout.windowAlpha(
      q.slot(index, now),
      q.items[index].size,
      this.offset(now),
    );
    const arrival = q.arrival(index, now);
    if (arrival === null) return tail;
    // Coming from somewhere it wasn't drawn (a store): fade in over the first fifth of the flight
    const fadeIn = arrival.fadeIn ? Math.min(1, arrival.t / 0.2) : 1;
    return lerp(1, tail, arrival.t) * fadeIn;
  }

  /** The belt plate, and the "+N" labels centred on the cells just past either end */
  private drawBelt(): void {
    const p = this.projection;
    const { pos, extent } = this.layout.belt();
    const m = BELT_MARGIN;
    drawPlate(
      this.belt.clear(),
      p,
      { w: extent.w + 2 * m, h: extent.h + 2 * m },
      BELT_COLOR,
    );
    placeAt(this.belt, project(p, WorldPos(pos.x - m, pos.y - m)));
    // The name sits just above the belt's tail end
    placeAt(this.title, project(p, WorldPos(pos.x - m, pos.y - m - LABEL_GAP)));

    const { boxSize, length } = this.layout;
    const centreOf = (slot: number) => {
      const cell = this.layout.boxOrigin(this.layout.itemOffset(slot, 0), 1);
      return WorldPos(cell.x + boxSize / 2, cell.y + boxSize / 2);
    };
    placeAt(this.behind, project(p, centreOf(length)));
    placeAt(this.ahead, project(p, centreOf(-1)));
  }

  /** Top-left of the box at `index`, in world coords relative to the belt's origin */
  private boxPos(index: number, now: WallMs): WorldPos {
    const q = this.queue;
    const size = q.items[index].size;
    const off = this.offset(now);
    const pos = this.layout.itemOffset(
      q.slot(index, now) - off,
      q.entering(index, now),
    );
    const slotBox = this.layout.boxOrigin(pos, size);

    // Items handed over from upstream fly in from `source` (world → local coords), to their
    // slot, or the window's nearest end if that's elided (they fade out there, see `alpha`)
    const arrival = q.arrival(index, now);
    if (arrival === null) return slotBox;
    const landing = this.layout.boxOrigin(
      this.layout.itemOffset(
        this.layout.clampToBelt(q.slot(index, now), size, off) - off,
        q.entering(index, now),
      ),
      size,
    );
    return WorldPos(
      lerp(arrival.source.x - this.origin.x, landing.x, arrival.t),
      lerp(arrival.source.y - this.origin.y, landing.y, arrival.t),
    );
  }
}

/** A "+N" label showing `count`, hidden at 0 */
const showCount = (label: Text, count: number): void => {
  label.visible = count > 0;
  const text = `+${count}`;
  if (count > 0 && label.text !== text) label.text = text;
};
