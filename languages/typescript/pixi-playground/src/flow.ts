import type { Layout } from "./queue/layout";
import type { Queue } from "./queue/model/queue";
import type { Ms, Pos, Size } from "./shared/common";
import type { StationBoard } from "./station/station";

/** A queue placed on the stage: enough to know where its head sits */
export type Conveyor = {
  readonly queue: Queue;
  readonly layout: Layout;
  /** where the queue's head sits, in stage coords */
  readonly origin: Pos;
};

/** Where a conveyor's popped head goes next */
export type Node =
  | { readonly kind: "queue"; readonly conveyor: Conveyor }
  | { readonly kind: "stations"; readonly board: StationBoard };

/** Stage-coords top-left of the head item's box, so a hand-off starts exactly where it sat */
export const headBox = (c: Conveyor, size: Size): Pos => {
  const o = c.layout.boxOrigin(c.layout.itemOffset(0, 0), size);
  return { x: c.origin.x + o.x, y: c.origin.y + o.y };
};

/** Queues grow unbounded; stations need a free one */
export const canAccept = (to: Node): boolean => {
  switch (to.kind) {
    case "queue":
      return true;
    case "stations":
      return to.board.hasFree;
  }
};

/**
 * Pop `from`'s head into `to`; false (and nothing moves) if `from` is empty, its head is still
 * flying in from upstream, or `to` is full
 */
export const transfer = (from: Conveyor, to: Node, now: Ms): boolean => {
  if (!canAccept(to)) return false;
  if (from.queue.items.length > 0 && from.queue.arrival(0, now) !== null)
    return false;
  const item = from.queue.pop(now);
  if (item === undefined) return false;
  const source = headBox(from, item.size);
  switch (to.kind) {
    case "queue":
      to.conveyor.queue.arrive(item, source, now);
      return true;
    case "stations":
      return to.board.dispatch(item, source, now);
  }
};
