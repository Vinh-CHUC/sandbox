import { formatDuration } from "./shared/format";
import { formatRate } from "./station/throughput";
import type { Naming } from "./trace/naming";
import type { Kpis } from "./world";

/** One KPI as shown: `alert` when it signals trouble (it's then painted coral) */
export type Tile = {
  readonly id: string;
  readonly value: string;
  readonly caption: string;
  readonly alert: boolean;
};

/**
 * The KPI strip, worded with the trace's kinds and states; any caption can be replaced from
 * `labels.json`'s `captions`, by id.
 *
 *   kpiTiles({ done: 12, waiting: 40, blocked: 3, … }, naming)
 *   # [{ id: "done", value: "12", caption: "Items done", alert: false }, …]
 */
export const kpiTiles = (k: Kpis, n: Naming): Tile[] => {
  const items = n.kind("item").many;
  const skus = n.kind("sku").many;
  const tile = (
    id: string,
    value: string,
    caption: string,
    alert = false,
  ): Tile => ({
    id,
    value,
    caption: n.caption(id, caption),
    alert,
  });
  return [
    tile("done", String(k.done), `${items} done`),
    tile("rate", formatRate(k.donePerMinute), "done rate"),
    tile("waiting", String(k.waiting), `${items} waiting`),
    tile("blocked", String(k.blocked), n.state(1), k.blocked > 0),
    tile(
      "wait",
      k.medianWaitMs === null ? "–" : formatDuration(k.medianWaitMs),
      "median wait",
    ),
    tile("stock_outs", String(k.stockOuts), "stock-outs", k.stockOuts > 0),
    tile(
      "ready",
      k.readyShare === null
        ? String(k.ready)
        : `${k.ready} (${Math.round(k.readyShare * 100)}%)`,
      `${items} ready`,
    ),
    // Only with roads: stock shipped between inventories
    ...(k.inTransit === null
      ? []
      : [
          tile("in_transit", String(k.inTransit), `${skus} in transit`),
          tile("transferred", String(k.transferred), `${skus} transferred`),
        ]),
  ];
};
