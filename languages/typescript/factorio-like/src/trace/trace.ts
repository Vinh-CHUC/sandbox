import type { ItemId, Ms, SimMs, SkuId } from "../shared/common";

/** A trace as the viewer replays it; see `data/` for the parquet format it's read from */

/** "inventory" only appears as an edge's `from`: inventory → station means "supplies" */
export type NodeKind = "queue" | "station" | "inventory";
export type NodeRef = { readonly kind: NodeKind; readonly id: number };
export type Edge = { readonly from: NodeRef; readonly to: NodeRef };

/** A place's site when it belongs to none, e.g. a store shared by every site */
export const NO_SITE = 0;

/** A place, belonging to a site (or to none, see `NO_SITE`) */
export type Place = { readonly id: number; readonly site: number };

/** A two-way road between inventories `a` and `b`, `length` grid cells long */
export type RoadSpec = {
  readonly id: number;
  readonly a: number;
  readonly b: number;
  readonly length: number;
};

/** The static part of a trace: every place things flow between, and how they connect */
export type Topology = {
  readonly sites: readonly number[];
  readonly queues: readonly Place[];
  readonly stations: readonly Place[];
  readonly inventories: readonly Place[];
  readonly skus: readonly SkuId[];
  /** What each inventory carries, in stack order */
  readonly inventorySkus: ReadonlyMap<number, readonly SkuId[]>;
  /** The item types, if the trace has any (e.g. product models), in catalogue order */
  readonly itemTypes: readonly number[];
  /** Each typed item's type; untyped items aren't in here */
  readonly itemType: ReadonlyMap<ItemId, number>;
  readonly edges: readonly Edge[];
  /** Roads stock is shipped along, if the trace has any */
  readonly roads: readonly RoadSpec[];
};

type At = { readonly seq: number; readonly t: SimMs };

/** What happens, as a sum type: one variant per event table. `t` is simulated time. */
export type TraceEvent =
  | (At & {
      readonly kind: "queue_enter";
      readonly item: ItemId;
      readonly queue: number;
      readonly index: number;
    })
  | (At & {
      readonly kind: "queue_leave";
      readonly item: ItemId;
      readonly queue: number;
    })
  | (At & {
      readonly kind: "queue_move";
      readonly item: ItemId;
      readonly queue: number;
      readonly index: number;
    })
  | (At & {
      readonly kind: "station_start";
      readonly job: number;
      readonly item: ItemId;
      readonly station: number;
      /** null when the trace doesn't know how long the job takes */
      readonly expectedMs: Ms | null;
    })
  | (At & { readonly kind: "station_end"; readonly job: number })
  | (At & {
      readonly kind: "consumption";
      readonly job: number;
      readonly inventory: number;
      readonly sku: SkuId;
      readonly count: number;
    })
  | (At & {
      readonly kind: "item_status";
      readonly item: ItemId;
      /** see `ItemState` in data/: 0 waiting, 1 blocked */
      readonly status: number;
    })
  | (At & {
      readonly kind: "item_shortage";
      readonly item: ItemId;
      readonly inventory: number;
      readonly sku: SkuId;
      /** how many it's short of; 0 clears the shortage */
      readonly missing: number;
    })
  | (At & {
      readonly kind: "road_enter";
      readonly shipment: number;
      readonly road: number;
      /** the inventory it sets off from, one end of the road, for the other */
      readonly from: number;
      readonly sku: SkuId;
      readonly count: number;
      /** grid cells per minute (simulated) */
      readonly speed: number;
    })
  | (At & { readonly kind: "road_leave"; readonly shipment: number })
  | (At & {
      readonly kind: "stock";
      readonly inventory: number;
      readonly sku: SkuId;
      readonly count: number;
    });

export type LabelTable =
  | "sites"
  | "queues"
  | "stations"
  | "inventories"
  | "skus"
  | "items"
  | "item_types"
  | "roads";

export type Trace = {
  readonly topology: Topology;
  /** Every event of every table, in `seq` order */
  readonly events: readonly TraceEvent[];
  /** Display names, keyed by `labelKey` */
  readonly labels: ReadonlyMap<string, string>;
  /** Wall-clock time (unix ms) of t = 0, for display */
  readonly startUnixMs: number;
  /** When the trace ends, in simulated time */
  readonly endMs: SimMs;
};

export const labelKey = (table: LabelTable, id: number) => `${table}:${id}`;

/** The trace's name for `id` in `table`, or `fallback` */
export const labelOf = (
  trace: Pick<Trace, "labels">,
  table: LabelTable,
  id: number,
  fallback: string,
): string => trace.labels.get(labelKey(table, id)) ?? fallback;
