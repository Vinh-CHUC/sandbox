import type { ItemId, Ms, SimMs, SkuId } from "../shared/common";

/** A trace as the viewer replays it; see `data/` for the parquet format it's read from */

/** "inventory" only appears as an edge's `from`: inventory → station means "supplies" */
export type NodeKind = "queue" | "station" | "inventory";
export type NodeRef = { readonly kind: NodeKind; readonly id: number };
export type Edge = { readonly from: NodeRef; readonly to: NodeRef };

/** A place, belonging to a site */
export type Place = { readonly id: number; readonly site: number };

/** The static part of a trace: every place things flow between, and how they connect */
export type Topology = {
  readonly sites: readonly number[];
  readonly queues: readonly Place[];
  readonly stations: readonly Place[];
  readonly inventories: readonly Place[];
  readonly skus: readonly SkuId[];
  /** What each inventory carries, in stack order */
  readonly inventorySkus: ReadonlyMap<number, readonly SkuId[]>;
  readonly edges: readonly Edge[];
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
      readonly kind: "stock";
      readonly inventory: number;
      readonly sku: SkuId;
      readonly count: number;
    });

export type LabelTable =
  "sites" | "queues" | "stations" | "inventories" | "skus" | "items";

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
