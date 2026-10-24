import { Container, Graphics } from "pixi.js";
import type { Queue } from "./model/queue";
import { lerp, type Item, type Pos } from "../shared/common";
import { type Layout } from "./layout";

export const buildBoxGraphics = (item: Item, layout: Layout): Graphics => {
  const { w, h } = layout.boxExtent(item.size);
  return new Graphics().roundRect(0, 0, w, h, 6).fill(item.color);
};

export class QueueView {
  public readonly queue_container = new Container();
  private readonly boxes = new Map<number, Graphics>();

  constructor(
    private readonly queue: Queue,
    private readonly layout: Layout,
  ) {}

  public setPosition(origin: Pos): void {
    this.queue_container.position.set(origin.x, origin.y);
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
        g = buildBoxGraphics(item, this.layout);
        this.boxes.set(item.id, g);
        this.queue_container.addChild(g);
      }
      const pos = this.layout.itemOffset(q.slot(i, now), q.entering(i, now));
      const slotBox = this.layout.boxOrigin(pos, item.size);

      // Items handed over from upstream fly in from `source` (stage → local coords)
      const arrival = q.arrival(i, now);
      if (arrival !== null) {
        // Use arrival interpolation
        const origin = this.queue_container.position;
        g.x = lerp(arrival.source.x - origin.x, slotBox.x, arrival.t);
        g.y = lerp(arrival.source.y - origin.y, slotBox.y, arrival.t);
        return;
      } else {
        g.x = slotBox.x;
        g.y = slotBox.y;
      }
    });
  }
}
