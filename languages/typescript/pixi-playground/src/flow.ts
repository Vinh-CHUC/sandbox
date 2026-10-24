import type { Layout } from "./queue/layout";
import type { Queue } from "./queue/model/queue";
import type { Inventory } from "./inventory/inventory";
import {
  WorldPos,
  type Ms,
  type PartRequest,
  type Size,
} from "./shared/common";
import type { StationBoard } from "./station/station";

/** A queue placed on the stage: enough to know where its head sits */
export type Conveyor = {
  readonly queue: Queue;
  readonly layout: Layout;
  /** where the queue's head sits, in world coords */
  readonly origin: WorldPos;
};

/** Where a conveyor's popped head goes next */
export type Node =
  | { readonly kind: "queue"; readonly conveyor: Conveyor }
  | {
      readonly kind: "stations";
      readonly board: StationBoard;
      /** where each dispatched item's parts come from */
      readonly inventory: Inventory;
    };

/** World-coords top-left of the head item's box, so a hand-off starts exactly where it sat */
export const headBox = (c: Conveyor, size: Size): WorldPos => {
  const o = c.layout.boxOrigin(c.layout.itemOffset(0, 0), size);
  return WorldPos(c.origin.x + o.x, c.origin.y + o.y);
};

/** Queues grow unbounded; stations need a free one, and the inventory must cover `parts` */
export const canAccept = (to: Node, parts: PartRequest = []): boolean => {
  switch (to.kind) {
    case "queue":
      return true;
    case "stations":
      return to.board.hasFree && to.inventory.canSupply(parts);
  }
};

/**
 * Pop `from`'s head into `to`, taking `parts` from the inventory when `to` is stations (ignored
 * for queues); false (and nothing moves) if `from` is empty, its head is still flying in from
 * upstream, or `to` can't accept
 */
export const transfer = (
  from: Conveyor,
  to: Node,
  now: Ms,
  parts: PartRequest = [],
): boolean => {
  if (!canAccept(to, parts)) return false;
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
      to.inventory.take(parts);
      return to.board.dispatch(item, source, now, parts);
  }
};
