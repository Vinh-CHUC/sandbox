import { Container, Graphics } from "pixi.js";
import type { Queue } from "./model/queue";
import { lerp, WorldPos, type Item } from "../shared/common";
import { depth, drawBox, placeAt } from "../shared/draw";
import { FLAT, project, type Projection } from "../shared/projection";
import { type Layout } from "./layout";

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
  private origin = WorldPos(0, 0);
  private projection: Projection = FLAT;

  constructor(
    private readonly queue: Queue,
    private readonly layout: Layout,
  ) {
    // Painter's order in iso: boxes closer to the viewer on top
    this.queue_container.sortableChildren = true;
  }

  /** Place the whole belt in the world; box offsets stay relative to this origin */
  public setPosition(origin: WorldPos): void {
    this.origin = origin;
    placeAt(this.queue_container, project(this.projection, origin));
  }

  /** Re-place the belt, and drop the boxes so `render` rebuilds them for `p` */
  public setProjection(p: Projection): void {
    this.projection = p;
    for (const g of this.boxes.values()) g.destroy();
    this.boxes.clear();
    this.setPosition(this.origin);
  }

  public render(now: number): void {
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
    });
  }

  /** Top-left of the box at `index`, in world coords relative to the belt's origin */
  private boxPos(index: number, now: number): WorldPos {
    const q = this.queue;
    const size = q.items[index].size;
    const pos = this.layout.itemOffset(
      q.slot(index, now),
      q.entering(index, now),
    );
    const slotBox = this.layout.boxOrigin(pos, size);

    // Items handed over from upstream fly in from `source` (world → local coords)
    const arrival = q.arrival(index, now);
    if (arrival === null) return slotBox;
    return WorldPos(
      lerp(arrival.source.x - this.origin.x, slotBox.x, arrival.t),
      lerp(arrival.source.y - this.origin.y, slotBox.y, arrival.t),
    );
  }
}
