import { Container, Graphics } from "pixi.js";
import type { Queue } from "./model/queue";

export type Layout = { readonly boxSize: number; readonly gap: number };

export type QueueView = {
  readonly root: Container;
  readonly render: (q: Queue, now: number) => void;
};

/** Slot -1 is the "processor" that consumes the head of the queue */
export const createQueueView = ({ boxSize, gap }: Layout): QueueView => {
  const root = new Container();
  const boxes = new Map<number, Graphics>();
  const stride = boxSize + gap;

  const processor = new Graphics()
    .rect(0, 0, boxSize, boxSize)
    .stroke({ width: 3, color: 0xffffff });
  processor.x = -stride;
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
        g = new Graphics()
          .roundRect(0, 0, boxSize, boxSize, 6)
          .fill(item.color);
        boxes.set(item.id, g);
        root.addChild(g);
      }
      g.x = q.slot(i, now) * stride;
      // Drop inserted items in from above, otherwise they'd overlap the item they displace
      g.y = -q.entering(i, now) * stride;
    });
  };

  return { root, render };
};
