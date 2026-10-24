import { Container, Graphics } from "pixi.js";
import type { Queue } from "./model/queue";
import { lerp, WorldPos, type Item, type WallMs } from "../shared/common";
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
  layout: Layout,
  p: Projection,
): Graphics =>
  drawBox(
    new Graphics(),
    p,
    layout.boxExtent(item.size),
    layout.boxSize,
    item.color,
  );

// The container will be positioned by a layer upstream, see `setPosition`
export class QueueView {
  public readonly queue_container = new Container();
  private readonly boxes = new Map<number, Graphics>();
  private readonly belt = new Graphics();
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
  ) {
    // Painter's order in iso: boxes closer to the viewer on top; the belt under all of them
    this.queue_container.sortableChildren = true;
    this.belt.zIndex = -Infinity;
    this.elided.anchor.set(0.5);
    this.elided.zIndex = Infinity;
    this.queue_container.addChild(this.belt, this.elided);
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
    for (const g of this.boxes.values()) g.destroy();
    this.boxes.clear();
    this.drawBelt();
    this.setPosition(this.origin);
  }

  /** Redraw as of wall time `now`: queue animations run on wall time, see `Queue` */
  public render(now: WallMs): void {
    const q = this.queue;
    const alive = new Set(q.items.map((item) => item.id));
    for (const [id, g] of this.boxes) {
      // Delete boxes that don't match any queue member anymore
      if (alive.has(id)) continue;
      g.destroy();
      this.boxes.delete(id);
    }

    q.items.forEach((item, i) => {
      let g = this.boxes.get(item.id);
      if (g === undefined) {
        g = buildBoxGraphics(item, this.layout, this.projection);
        this.boxes.set(item.id, g);
        this.queue_container.addChild(g);
      }
      const pos = this.boxPos(i, now);
      placeAt(g, project(this.projection, pos));
      g.zIndex = depth(pos, this.layout.boxExtent(item.size));
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

  /**
   * Items past the belt's end fade out (see `Layout.tailAlpha`); one flying in towards such a slot
   * fades away on its way, rather than landing somewhere invisible.
   */
  private alpha(index: number, now: WallMs): number {
    const q = this.queue;
    const tail = this.layout.tailAlpha(q.slot(index, now), q.items[index].size);
    const arrival = q.arrival(index, now);
    return arrival === null ? tail : lerp(1, tail, arrival.t);
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
