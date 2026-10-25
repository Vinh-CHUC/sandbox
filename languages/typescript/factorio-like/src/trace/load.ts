import { asyncBufferFromUrl, parquetRead, type AsyncBuffer } from "hyparquet";
import { toTrace, type Columns } from "./columns";
import type { Trace } from "./trace";

/** Every parquet table of a trace, by file name (without `.parquet`) */
export const TABLES = [
  "sites",
  "queues",
  "stations",
  "inventories",
  "skus",
  "inventory_skus",
  "edges",
  "queue_enter",
  "queue_leave",
  "queue_move",
  "station_start",
  "station_end",
  "consumption",
  "stock",
  "meta",
  "item_status",
  "item_shortage",
  "item_types",
  "items",
  "labels",
  "roads",
  "road_enter",
  "road_leave",
] as const;
const OPTIONAL = new Set<string>([
  "item_status",
  "item_shortage",
  "item_types",
  "items",
  "labels",
  "roads",
  "road_enter",
  "road_leave",
]);

/** The scenario shown without `?scenario=` */
export const DEFAULT_SCENARIO = "one-site";

/**
 * Which scenario's trace to show: `?scenario=<name>`, else `DEFAULT_SCENARIO`
 *
 *   scenarioOf("?scenario=road")  # "road"
 *   scenarioOf("")                # "one-site"
 */
export const scenarioOf = (search: string): string =>
  new URLSearchParams(search).get("scenario") || DEFAULT_SCENARIO;

/**
 * Where that trace is: one directory per scenario, as `data/` writes them
 *
 *   traceUrl("/", "?scenario=road")  # "/traces/road"
 */
export const traceUrl = (base: string, search: string): string =>
  `${base}traces/${encodeURIComponent(scenarioOf(search))}`;

/** Opens one table's file; resolves to null when an optional table isn't there */
export type Open = (table: string) => Promise<AsyncBuffer | null>;

/** Whether `file` starts like a parquet file ("PAR1") */
const isParquet = async (file: AsyncBuffer): Promise<boolean> =>
  file.byteLength >= 4 &&
  new TextDecoder().decode(await file.slice(0, 4)) === "PAR1";

/**
 * Tables served over HTTP from `base`, e.g. "/traces/one-site" (Vite serves `public/` as is). A
 * missing file may come back as something else (Vite's dev server answers with index.html), hence
 * the magic-number check.
 */
export const openUrl =
  (base: string): Open =>
  async (table) => {
    const url = `${base}/${table}.parquet`;
    let reason: string;
    try {
      const file = await asyncBufferFromUrl({ url });
      if (await isParquet(file)) return file;
      reason = "not a parquet file";
    } catch (error) {
      reason = String(error);
    }
    if (OPTIONAL.has(table)) return null;
    throw new Error(`trace: can't read ${url}: ${reason}`);
  };

/** All columns of one parquet file, read column by column (no per-row objects) */
export const readColumns = async (file: AsyncBuffer): Promise<Columns> => {
  const columns: Record<string, unknown[]> = {};
  await parquetRead({
    file,
    onChunk: ({ columnName, columnData, rowStart }) => {
      const column = (columns[columnName] ??= []);
      for (let i = 0; i < columnData.length; i++)
        column[rowStart + i] = columnData[i];
    },
  });
  return columns;
};

/** Read every table (in parallel), then build the trace */
export const loadTrace = async (open: Open): Promise<Trace> => {
  const entries = await Promise.all(
    TABLES.map(async (table) => {
      const file = await open(table);
      return [
        table,
        file === null ? undefined : await readColumns(file),
      ] as const;
    }),
  );
  return toTrace(Object.fromEntries(entries));
};
