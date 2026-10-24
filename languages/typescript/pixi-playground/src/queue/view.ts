import { Container, Graphics } from "pixi.js";
import type { Queue } from "./model/queue";
import type { Item } from "./model/utils";
import { boxWidth, stride, type Layout } from "./layout";

export type QueueView = {
  readonly root: Container;
  readonly render: (q: Queue, now: number) => void;
};

export const buildBoxGraphics = (item: Item, layout: Layout): Graphics =>
  new Graphics()
    .roundRect(0, 0, boxWidth(item.size, layout), layout.boxSize, 6)
    .fill(item.color);

/** Slot -1 is the "processor" that consumes the head of the queue */
export const createQueueView = (layout: Layout): QueueView => {
  const root = new Container();
  const boxes = new Map<number, Graphics>();
  const { boxSize } = layout;
  const step = stride(layout);

  const processor = new Graphics()
    .rect(0, 0, boxSize, boxSize)
    .stroke({ width: 3, color: 0xffffff });
  processor.x = -step;
  root.addChild(processor);

  const render = (q: Queue, now: number) => {
    const alive = new Set(q.items.map((item) => item.id));
    for (const [id, g] of boxes) {
      // Delete boxes that don't match any queue member anymore
      if (alive.has(id)) continue;
      g.destroy();
      boxes.delete(id);
    }

    q.items.forEach((item, i) => {
      let g = boxes.get(item.id);
      if (g === undefined) {
        g = buildBoxGraphics(item, layout);
        boxes.set(item.id, g);
        root.addChild(g);
      }
      g.x = q.slot(i, now) * step;
      // Drop inserted items in from above, otherwise they'd overlap the item they displace
      g.y = -q.entering(i, now) * step;
    });
  };

  return { root, render };
};
