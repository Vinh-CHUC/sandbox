import { Container, Graphics } from "pixi.js";
import type { Queue } from "./model/queue";
import type { Item } from "./model/utils";
import { type Layout } from "./layout";

export type QueueView = {
  readonly root: Container;
  readonly render: (q: Queue, now: number) => void;
};

export const buildBoxGraphics = (item: Item, layout: Layout): Graphics => {
  const { w, h } = layout.boxExtent(item.size);
  return new Graphics().roundRect(0, 0, w, h, 6).fill(item.color);
};

export const createQueueView = (layout: Layout): QueueView => {
  const root = new Container();
  const boxes = new Map<number, Graphics>();

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
      const pos = layout.itemOffset(q.slot(i, now), q.entering(i, now));
      const { x, y } = layout.boxOrigin(pos, item.size);
      g.x = x;
      g.y = y;
    });
  };

  return { root, render };
};
