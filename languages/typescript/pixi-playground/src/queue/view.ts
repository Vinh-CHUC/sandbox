import { Container, Graphics, type FederatedPointerEvent } from "pixi.js";
import type { Queue } from "./model/queue";
import {
  lerp,
  WorldPos,
  type Color,
  type Item,
  type ItemId,
  type Pos,
  type WallMs,
} from "../shared/common";
import { depth, drawBox, drawPlate, placeAt } from "../shared/draw";
import { CHARCOAL } from "../shared/palette";
import { FLAT, project, type Projection } from "../shared/projection";
import { type Layout } from "./layout";
import { sharpText, units } from "../shared/scale";

/** The belt plate under the boxes, `BELT_MARGIN` beyond them on every side */
const BELT_MARGIN = units(0.17);
const BELT_COLOR = CHARCOAL;

export const buildBoxGraphics = (
  item: Item,
  color: Color,
  layout: Layout,
  p: Projection,
): Graphics =>
  drawBox(
    new Graphics(),
    p,
    layout.boxExtent(item.size),
    layout.boxSize,
    color,
  );

export type QueueViewOptions = {
  /** shown above the belt's tail end */
  readonly name?: string;
  /** an item's colour now, e.g. to flag blocked ones; its own colour by default */
  readonly colorOf?: (item: Item) => Color;
  /** the item under the pointer (client coords), or null once the pointer leaves it */
  readonly onItemHover?: (item: ItemId | null, at: Pos) => void;
};

// The container will be positioned by a layer upstream, see `setPosition`
export class QueueView {
  public readonly queue_container = new Container();
  /** One box per queued item, with the colour it was drawn in (redrawn when that changes) */
  private readonly boxes = new Map<
    ItemId,
    { graphic: Graphics; color: Color }
  >();
  private readonly belt = new Graphics();
  private readonly title = sharpText({
    text: "",
    style: { fontSize: units(0.33), fontWeight: "bold", fill: CHARCOAL },
  });
  /** "+N" just past the belt's tail end: how many items don't fit on it */
  private readonly elided = sharpText({
    text: "",
    style: { fontSize: units(0.39), fontWeight: "bold", fill: CHARCOAL },
  });
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
    this.elided.anchor.set(0.5);
    this.elided.zIndex = Infinity;
    this.title.text = options.name ?? "";
    this.title.anchor.set(0, 1);
    this.title.zIndex = Infinity;
    this.queue_container.addChild(this.belt, this.elided, this.title);
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

  /** Redraw as of wall time `now`: queue animations run on wall time, see `Queue` */
  public render(now: WallMs): void {
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

    const hidden = q.items.filter(
      (item, i) => this.layout.tailAlpha(q.slot(i, now), item.size) < 1,
    ).length;
    this.elided.visible = hidden > 0;
    if (hidden > 0 && this.elided.text !== `+${hidden}`)
      this.elided.text = `+${hidden}`;
  }

  /** The item's box in its current colour: built on first sight, rebuilt when the colour changes */
  private boxOf(item: Item): Graphics {
    const color = this.options.colorOf?.(item) ?? item.color;
    const box = this.boxes.get(item.id);
    if (box !== undefined && box.color === color) return box.graphic;
    box?.graphic.destroy();
    const graphic = buildBoxGraphics(item, color, this.layout, this.projection);
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
    this.boxes.set(item.id, { graphic, color });
    this.queue_container.addChild(graphic);
    return graphic;
  }

  /**
   * Items past the belt's end fade out (see `Layout.tailAlpha`); one flying in towards such a slot
   * fades away on its way, rather than landing somewhere invisible.
   */
  private alpha(index: number, now: WallMs): number {
    const q = this.queue;
    const tail = this.layout.tailAlpha(q.slot(index, now), q.items[index].size);
    const arrival = q.arrival(index, now);
    if (arrival === null) return tail;
    // Coming from somewhere it wasn't drawn (a store): fade in over the first fifth of the flight
    const fadeIn = arrival.fadeIn ? Math.min(1, arrival.t / 0.2) : 1;
    return lerp(1, tail, arrival.t) * fadeIn;
  }

  /** The belt plate, and the "+N" label centred on the cell just past its tail end */
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
    placeAt(
      this.title,
      project(p, WorldPos(pos.x - m, pos.y - m - units(0.1))),
    );

    const { boxSize, length } = this.layout;
    const cell = this.layout.boxOrigin(this.layout.itemOffset(length, 0), 1);
    const centre = WorldPos(cell.x + boxSize / 2, cell.y + boxSize / 2);
    placeAt(this.elided, project(p, centre));
  }

  /** Top-left of the box at `index`, in world coords relative to the belt's origin */
  private boxPos(index: number, now: WallMs): WorldPos {
    const q = this.queue;
    const size = q.items[index].size;
    const pos = this.layout.itemOffset(
      q.slot(index, now),
      q.entering(index, now),
    );
    const slotBox = this.layout.boxOrigin(pos, size);

    // Items handed over from upstream fly in from `source` (world → local coords), to their
    // slot, or the belt's tail end if that's elided (they fade out there, see `alpha`)
    const arrival = q.arrival(index, now);
    if (arrival === null) return slotBox;
    const landing = this.layout.boxOrigin(
      this.layout.itemOffset(
        this.layout.clampToBelt(q.slot(index, now), size),
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
