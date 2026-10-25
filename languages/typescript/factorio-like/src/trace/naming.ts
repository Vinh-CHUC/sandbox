import { labelKey, type LabelTable, type Trace } from "./trace";

/**
 * What things are called on screen. The code only knows generic kinds (item, queue, station…);
 * every domain word comes from an optional, git-ignored `labels.json` (see `labels.example.json`),
 * then from the trace's own `labels` table, then falls back to "‹Kind› ‹id›".
 */

export type Kind =
  | "site"
  | "queue"
  | "station"
  | "inventory"
  | "sku"
  | "item"
  | "item_type"
  | "road";
export type KindName = { readonly one: string; readonly many: string };

/** The shape of `labels.json`; every part is optional */
export type LabelsFile = {
  readonly kinds?: Partial<Record<Kind, KindName>>;
  /** item states (`item_status.status`) by code, e.g. { "1": "awaiting parts" } */
  readonly states?: Readonly<Record<string, string>>;
  /** overrides for the KPI captions, by KPI id (see `kpiTiles`) */
  readonly captions?: Readonly<Record<string, string>>;
  /** per-id names, by table then id, e.g. { "queues": { "1": "Intake" } } */
  readonly names?: Partial<
    Record<LabelTable, Readonly<Record<string, string>>>
  >;
};

const DEFAULT_KINDS: Record<Kind, KindName> = {
  site: { one: "Site", many: "Sites" },
  queue: { one: "Queue", many: "Queues" },
  station: { one: "Station", many: "Stations" },
  inventory: { one: "Inventory", many: "Inventories" },
  sku: { one: "SKU", many: "SKUs" },
  item: { one: "Item", many: "Items" },
  item_type: { one: "Type", many: "Types" },
  road: { one: "Road", many: "Roads" },
};
const DEFAULT_STATES: Record<string, string> = {
  "0": "waiting",
  "1": "blocked",
};

const TABLE_KIND: Record<LabelTable, Kind> = {
  sites: "site",
  queues: "queue",
  stations: "station",
  inventories: "inventory",
  skus: "sku",
  items: "item",
  item_types: "item_type",
  roads: "road",
};

export type Naming = {
  readonly kind: (kind: Kind) => KindName;
  /** e.g. name("queues", 2) → "Intake", or "Queue 2" when nothing names it */
  readonly name: (table: LabelTable, id: number) => string;
  readonly state: (code: number) => string;
  readonly caption: (kpi: string, fallback: string) => string;
};

/**
 *   naming(trace, { kinds: { item: { one: "Widget", many: "Widgets" } } }).name("items", 7)
 *   # "Widget 7"
 */
export const naming = (
  trace: Pick<Trace, "labels">,
  file: LabelsFile = {},
): Naming => {
  const kind = (k: Kind): KindName => file.kinds?.[k] ?? DEFAULT_KINDS[k];
  return {
    kind,
    name: (table, id) =>
      file.names?.[table]?.[String(id)] ??
      trace.labels.get(labelKey(table, id)) ??
      `${kind(TABLE_KIND[table]).one} ${id}`,
    state: (code) =>
      file.states?.[String(code)] ??
      DEFAULT_STATES[String(code)] ??
      `state ${code}`,
    caption: (kpi, fallback) => file.captions?.[kpi] ?? fallback,
  };
};

const isRecordOf = (value: unknown, check: (v: unknown) => boolean): boolean =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every(check);
const isString = (v: unknown) => typeof v === "string";
const isKindName = (v: unknown) =>
  isRecordOf(v, isString) &&
  isString((v as KindName).one) &&
  isString((v as KindName).many);

/** `labels.json` parsed and checked; throws, saying where, when it's malformed */
export const parseLabels = (json: unknown): LabelsFile => {
  if (!isRecordOf(json, () => true))
    throw new TypeError("labels.json: not an object");
  const file = json as Record<string, unknown>;
  const checks: Record<string, (v: unknown) => boolean> = {
    kinds: (v) => isRecordOf(v, isKindName),
    states: (v) => isRecordOf(v, isString),
    captions: (v) => isRecordOf(v, isString),
    names: (v) => isRecordOf(v, (table) => isRecordOf(table, isString)),
  };
  for (const [key, value] of Object.entries(file)) {
    const check = checks[key];
    if (check === undefined)
      throw new TypeError(`labels.json: unknown key "${key}"`);
    if (!check(value))
      throw new TypeError(`labels.json: "${key}" isn't shaped as expected`);
  }
  return file as LabelsFile;
};

/** `labels.json` from `url` if there's one: it's optional, so a 404 means "no labels" */
export const fetchLabels = async (url: string): Promise<LabelsFile> => {
  const response = await fetch(url);
  if (response.status === 404) return {};
  if (!response.ok)
    throw new Error(`${url}: ${response.status} ${response.statusText}`);
  return parseLabels(await response.json());
};
