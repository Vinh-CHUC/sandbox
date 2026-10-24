import { SimMs, SkuId } from "../shared/common";
import {
  labelKey,
  type Edge,
  type LabelTable,
  type NodeKind,
  type Trace,
  type TraceEvent,
} from "./trace";

/**
 * The pure half of loading: parquet tables as columns in, a `Trace` out. Reading the files is
 * `load.ts`'s job, so this can be tested on plain arrays.
 *
 *   toTrace({ queues: { queue_id: [1], site_id: [1] }, ... }).topology.queues  # [{ id: 1, site: 1 }]
 */

/** One table: column name → values (int64 columns arrive as bigint) */
export type Columns = Readonly<Record<string, readonly unknown[]>>;
export type Tables = Readonly<Record<string, Columns | undefined>>;

/** The sentinel the format uses for "unknown" */
const UNKNOWN = -1;
const NODE_KINDS: Record<number, NodeKind> = {
  0: "queue",
  1: "station",
  2: "inventory",
};

const ints = (
  table: string,
  columns: Columns | undefined,
  name: string,
): number[] => {
  const column = columns?.[name] ?? [];
  return column.map((value, row) => {
    const n = typeof value === "bigint" ? Number(value) : value;
    if (typeof n !== "number" || !Number.isSafeInteger(n))
      throw new TypeError(
        `${table}.${name}[${row}]: not a safe integer (${String(value)})`,
      );
    return n;
  });
};

const strings = (
  table: string,
  columns: Columns | undefined,
  name: string,
): string[] =>
  (columns?.[name] ?? []).map((value, row) => {
    if (typeof value !== "string")
      throw new TypeError(
        `${table}.${name}[${row}]: not a string (${String(value)})`,
      );
    return value;
  });

/** Row-wise view of a table: `rows(t, ["a", "b"])` → [[a0, b0], [a1, b1], …] */
const rows = (
  tables: Tables,
  table: string,
  names: readonly string[],
): number[][] => {
  const columns = names.map((name) => ints(table, tables[table], name));
  return (columns[0] ?? []).map((_, i) => columns.map((c) => c[i]));
};

const usToMs = (us: number) => us / 1000;
const simMs = (us: number) => SimMs(usToMs(us));

export const toTrace = (tables: Tables): Trace => {
  const required = (table: string): Tables => {
    if (tables[table] === undefined)
      throw new Error(`trace: missing table ${table}`);
    return tables;
  };
  const place = (table: string, id: string) =>
    rows(required(table), table, [id, "site_id"]).map(([i, site]) => ({
      id: i,
      site,
    }));

  const inventorySkus = new Map<number, SkuId[]>();
  for (const [inventory, sku] of rows(
    required("inventory_skus"),
    "inventory_skus",
    ["inventory_id", "sku_id"],
  ))
    inventorySkus.set(inventory, [
      ...(inventorySkus.get(inventory) ?? []),
      SkuId(sku),
    ]);

  const kind = (k: number): NodeKind => {
    const named = NODE_KINDS[k];
    if (named === undefined)
      throw new TypeError(`edges: unknown node kind ${k}`);
    return named;
  };
  const edges: Edge[] = rows(required("edges"), "edges", [
    "from_kind",
    "from_id",
    "to_kind",
    "to_id",
  ]).map(([fk, fi, tk, ti]) => ({
    from: { kind: kind(fk), id: fi },
    to: { kind: kind(tk), id: ti },
  }));

  const at = ["seq", "sim_time_us"];
  const events: TraceEvent[] = [
    ...rows(tables, "queue_enter", [...at, "item_id", "queue_id", "index"]).map(
      ([seq, t, item, queue, index]): TraceEvent => ({
        kind: "queue_enter",
        seq,
        t: simMs(t),
        item,
        queue,
        index,
      }),
    ),
    ...rows(tables, "queue_leave", [...at, "item_id", "queue_id"]).map(
      ([seq, t, item, queue]): TraceEvent => ({
        kind: "queue_leave",
        seq,
        t: simMs(t),
        item,
        queue,
      }),
    ),
    ...rows(tables, "queue_move", [...at, "item_id", "queue_id", "index"]).map(
      ([seq, t, item, queue, index]): TraceEvent => ({
        kind: "queue_move",
        seq,
        t: simMs(t),
        item,
        queue,
        index,
      }),
    ),
    ...rows(tables, "station_start", [
      ...at,
      "job_id",
      "item_id",
      "station_id",
      "expected_duration_us",
    ]).map(([seq, t, job, item, station, expected]): TraceEvent => ({
      kind: "station_start",
      seq,
      t: simMs(t),
      job,
      item,
      station,
      expectedMs: expected === UNKNOWN ? null : usToMs(expected),
    })),
    ...rows(tables, "station_end", [...at, "job_id"]).map(
      ([seq, t, job]): TraceEvent => ({
        kind: "station_end",
        seq,
        t: simMs(t),
        job,
      }),
    ),
    ...rows(tables, "consumption", [
      ...at,
      "job_id",
      "inventory_id",
      "sku_id",
      "count",
    ]).map(([seq, t, job, inventory, sku, count]): TraceEvent => ({
      kind: "consumption",
      seq,
      t: simMs(t),
      job,
      inventory,
      sku: SkuId(sku),
      count,
    })),
    ...rows(tables, "stock", [...at, "inventory_id", "sku_id", "count"]).map(
      ([seq, t, inventory, sku, count]): TraceEvent => ({
        kind: "stock",
        seq,
        t: simMs(t),
        inventory,
        sku: SkuId(sku),
        count,
      }),
    ),
  ].sort((a, b) => a.seq - b.seq);

  const labels = new Map<string, string>();
  const labelColumns = tables["labels"];
  if (labelColumns !== undefined) {
    const table = strings("labels", labelColumns, "table");
    const ids = ints("labels", labelColumns, "id");
    const names = strings("labels", labelColumns, "label");
    table.forEach((t, i) =>
      labels.set(labelKey(t as LabelTable, ids[i]), names[i]),
    );
  }

  const [[startUs, endUs]] = rows(required("meta"), "meta", [
    "start_unix_us",
    "end_sim_time_us",
  ]);
  return {
    topology: {
      sites: ints("sites", required("sites")["sites"], "site_id"),
      queues: place("queues", "queue_id"),
      stations: place("stations", "station_id"),
      inventories: place("inventories", "inventory_id"),
      skus: ints("skus", required("skus")["skus"], "sku_id").map(SkuId),
      inventorySkus,
      edges,
    },
    events,
    labels,
    startUnixMs: usToMs(startUs),
    endMs: simMs(endUs),
  };
};
