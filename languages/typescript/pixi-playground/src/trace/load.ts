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
  "labels",
] as const;
const OPTIONAL = new Set<string>(["labels"]);

/** Opens one table's file; resolves to null when an optional table isn't there */
export type Open = (table: string) => Promise<AsyncBuffer | null>;

/** Tables served over HTTP from `base`, e.g. "/trace" (Vite serves `public/` as is) */
export const openUrl =
  (base: string): Open =>
  async (table) => {
    const url = `${base}/${table}.parquet`;
    try {
      return await asyncBufferFromUrl({ url });
    } catch (error) {
      if (OPTIONAL.has(table)) return null;
      throw new Error(`trace: can't read ${url}: ${String(error)}`);
    }
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
