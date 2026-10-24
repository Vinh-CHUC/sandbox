import { WorldPos, type Extent } from "../shared/common";
import { NO_SITE, type NodeKind, type Topology } from "./trace";
import { units } from "../shared/scale";

/**
 * Where everything goes, from the topology alone (a trace has no positions: that's presentation).
 *
 * Sites are rows, top to bottom, each fenced in. Within a site, flow runs left to right in columns:
 * the queues nothing flows into come first, then whatever their stations (or they) feed, and so on,
 * following `edges`. A queue is a left-to-right belt whose head points at the stations it feeds,
 * stacked beside it. Each inventory sits under the column of the stations it supplies. A queue that
 * feeds no station is a store (items sit there ready): it gets a compact spot of its own instead.
 * Places in no site (`NO_SITE`), e.g. one store shared by every site, go to the right of all the
 * sites, vertically centred on them, unfenced.
 *
 *   ┌─ Site A ──────────────────────────────────────────────┐
 *   │ [belt q1 ▶]  ▢ s1      [belt q2 ▶]  ▢ s3              │
 *   │              ▢ s2                   ▢ s4              │
 *   │                                     ▢ s5              │
 *   │ [inv 1: ▣ ▣ ▣ ▣ ▣]     [inv 2: ▣ ▣ ▣ ▣ ▣]              │
 *   └───────────────────────────────────────────────────────┘
 */

export type LayoutConfig = {
  readonly box: number;
  readonly gap: number;
  /** slots shown per belt; must match the queues' `Layout.length` */
  readonly beltLength: number;
  /** vertical distance between stations stacked in a column */
  readonly stationSpacing: number;
  /** from a belt's head to its stations */
  readonly stationGap: number;
  /** how many stacks wide a store is */
  readonly storeStacks: number;
  /** width kept for a column of stations (their widest item, plus its plate) */
  readonly stationColumn: number;
  /** after a column of stations, before the next belt */
  readonly columnGap: number;
  /** from a site's lowest station to its inventories */
  readonly inventoryGap: number;
  /** under an inventory row, for its rate labels */
  readonly inventoryLabels: number;
  /** between a site's fence and what's inside it */
  readonly fencePadding: number;
  /** extra room at the top of a fence, for the site's name */
  readonly fenceLabel: number;
  /** between two sites' fences */
  readonly siteGap: number;
  /** around everything */
  readonly margin: number;
};

/** Everything in proportion to `UNIT`, the one size knob */
export const DEFAULT_LAYOUT: LayoutConfig = {
  box: units(1),
  gap: units(0.22),
  beltLength: 8,
  stationSpacing: units(2.5),
  stationGap: units(1.67),
  storeStacks: 4,
  stationColumn: units(4.17),
  columnGap: units(1.67),
  inventoryGap: units(1.39),
  inventoryLabels: units(0.83),
  fencePadding: units(0.67),
  fenceLabel: units(0.61),
  siteGap: units(1.11),
  margin: units(1.11),
};

export type Placement = {
  /** each queue's head (`Layout` origin), all flowing left to right; stores aren't in here */
  readonly queues: ReadonlyMap<number, WorldPos>;
  /** each store's first stack top-left; stacks follow along x */
  readonly stores: ReadonlyMap<number, WorldPos>;
  /** each station's item top-left */
  readonly stations: ReadonlyMap<number, WorldPos>;
  /** each inventory's first stack top-left; stacks follow along x */
  readonly inventories: ReadonlyMap<number, WorldPos>;
  /** each site's fence: top-left and size */
  readonly sites: ReadonlyMap<
    number,
    { readonly pos: WorldPos; readonly extent: Extent }
  >;
  /** the ground everything sits on, from (0, 0) */
  readonly extent: Extent;
};

const key = (kind: NodeKind, id: number) => `${kind}:${id}`;

/** Queues of one site, grouped into columns by how far down the flow they are */
const columnsOf = (top: Topology, queues: readonly number[]): number[][] => {
  const next = new Map<string, number[]>(); // node → queues it flows into
  const fed = new Set<number>(); // queues something flows into
  for (const { from, to } of top.edges) {
    if (to.kind !== "queue") continue;
    fed.add(to.id);
    const k = key(from.kind, from.id);
    next.set(k, [...(next.get(k) ?? []), to.id]);
  }
  const feeds = feedsOf(top);

  const depth = new Map<number, number>();
  const roots = queues.filter((q) => !fed.has(q));
  const frontier = (roots.length > 0 ? roots : queues.slice(0, 1)).map((q) => {
    depth.set(q, 0);
    return q;
  });
  // Breadth first: a queue's column is one past the queue it's (first) reached from
  while (frontier.length > 0) {
    const q = frontier.shift()!;
    const d = depth.get(q)!;
    const downstream = [
      ...(next.get(key("queue", q)) ?? []),
      ...(feeds.get(q) ?? []).flatMap((s) => next.get(key("station", s)) ?? []),
    ];
    for (const q2 of downstream)
      if (queues.includes(q2) && !depth.has(q2)) {
        depth.set(q2, d + 1);
        frontier.push(q2);
      }
  }
  // Anything unreachable (e.g. a cycle with no way in) gets a column of its own at the end
  let last = Math.max(-1, ...depth.values());
  for (const q of queues) if (!depth.has(q)) depth.set(q, ++last);

  const columns: number[][] = [];
  for (const q of [...queues].sort((a, b) => a - b))
    (columns[depth.get(q)!] ??= []).push(q);
  return columns.filter((c) => c !== undefined);
};

/** queue → the stations it feeds, in id order */
const feedsOf = (top: Topology): Map<number, number[]> => {
  const feeds = new Map<number, number[]>();
  for (const { from, to } of top.edges)
    if (from.kind === "queue" && to.kind === "station")
      feeds.set(from.id, [...(feeds.get(from.id) ?? []), to.id]);
  for (const stations of feeds.values()) stations.sort((a, b) => a - b);
  return feeds;
};

/** inventory → the stations it supplies */
const suppliesOf = (top: Topology): Map<number, number[]> => {
  const supplies = new Map<number, number[]>();
  for (const { from, to } of top.edges)
    if (from.kind === "inventory" && to.kind === "station")
      supplies.set(from.id, [...(supplies.get(from.id) ?? []), to.id]);
  return supplies;
};

/** What one site's layout produced: positions, and the bottom-right corner of its content */
type SiteLayout = {
  readonly queues: Map<number, WorldPos>;
  readonly stores: Map<number, WorldPos>;
  readonly stations: Map<number, WorldPos>;
  readonly inventories: Map<number, WorldPos>;
  readonly right: number;
  readonly bottom: number;
};

/** Shift every position of `layout` by `dy`, into `into` */
const mergeShifted = (
  into: SiteLayout,
  layout: SiteLayout,
  dy: number,
): void => {
  const shift = (from: Map<number, WorldPos>, to: Map<number, WorldPos>) => {
    for (const [id, pos] of from) to.set(id, WorldPos(pos.x, pos.y + dy));
  };
  shift(layout.queues, into.queues);
  shift(layout.stores, into.stores);
  shift(layout.stations, into.stations);
  shift(layout.inventories, into.inventories);
};

export const placeTopology = (
  top: Topology,
  cfg: LayoutConfig = DEFAULT_LAYOUT,
): Placement => {
  const { box, gap, margin } = cfg;
  const belt = cfg.beltLength * box + (cfg.beltLength - 1) * gap;
  const columnWidth = belt + cfg.stationGap + cfg.stationColumn + cfg.columnGap;
  // A stack per item type, when the trace has types; `storeStacks` otherwise
  const storeStacks =
    top.itemTypes.length > 0 ? top.itemTypes.length : cfg.storeStacks;
  const storeWidth = storeStacks * (box + gap) - gap;
  const feeds = feedsOf(top);
  const supplies = suppliesOf(top);
  /** station → the queue feeding it (the first one, if several) */
  const fedBy = new Map<number, number>();
  for (const [q, ss] of feeds)
    for (const s of ss) if (!fedBy.has(s)) fedBy.set(s, q);

  /** Lay out the places of `site`, starting at (`left`, `rowTop`) */
  const placeSite = (
    site: number,
    left: number,
    rowTop: number,
  ): SiteLayout => {
    const queues = new Map<number, WorldPos>();
    const stores = new Map<number, WorldPos>();
    const stations = new Map<number, WorldPos>();
    const inventories = new Map<number, WorldPos>();
    const siteQueues = top.queues
      .filter((q) => q.site === site)
      .map((q) => q.id);
    const siteStations = new Set(
      top.stations.filter((s) => s.site === site).map((s) => s.id),
    );
    let rowHeight = cfg.stationSpacing;
    let x = left;

    const placeStations = (ids: readonly number[], at: number, y: number) =>
      ids.forEach((s, i) =>
        stations.set(
          s,
          WorldPos(
            at,
            y + i * cfg.stationSpacing + (cfg.stationSpacing - box) / 2,
          ),
        ),
      );

    for (const column of columnsOf(top, siteQueues)) {
      let blockTop = rowTop;
      let width = 0;
      for (const q of column) {
        if (!feeds.has(q)) {
          // A store: one row of stacks, centred on a station's height
          stores.set(q, WorldPos(x, blockTop + (cfg.stationSpacing - box) / 2));
          blockTop += cfg.stationSpacing;
          width = Math.max(width, storeWidth + cfg.columnGap);
          continue;
        }
        width = columnWidth;
        // Stations fed by several queues stay beside the first one placed
        const own = (feeds.get(q) ?? []).filter(
          (s) => siteStations.has(s) && !stations.has(s),
        );
        const blockHeight = Math.max(1, own.length) * cfg.stationSpacing;
        const head = WorldPos(x + belt, blockTop + (blockHeight - box) / 2);
        queues.set(q, head);
        placeStations(own, head.x + cfg.stationGap, blockTop);
        blockTop += blockHeight;
      }
      rowHeight = Math.max(rowHeight, blockTop - rowTop);
      x += width;
    }
    // Stations no queue feeds get a column at the end
    const loose = [...siteStations]
      .filter((s) => !stations.has(s))
      .sort((a, b) => a - b);
    if (loose.length > 0) {
      placeStations(loose, x, rowTop);
      rowHeight = Math.max(rowHeight, loose.length * cfg.stationSpacing);
      x += cfg.stationColumn + cfg.columnGap;
    }

    // Each inventory under the stations it supplies: at the start of their queue's belt (or
    // their own column). Several in one column go side by side; unconnected ones go last.
    const siteInventories = top.inventories
      .filter((i) => i.site === site)
      .map((i) => i.id);
    const inventoryTop = rowTop + rowHeight + cfg.inventoryGap;
    const widthOf = (id: number) =>
      (top.inventorySkus.get(id)?.length ?? 0) * (box + gap);
    let free = left; // leftmost x not taken by an inventory yet
    const anchorOf = (id: number): number | undefined => {
      const supplied = (supplies.get(id) ?? []).find((s) => stations.has(s));
      if (supplied === undefined) return undefined;
      const queue = fedBy.get(supplied);
      const head = queue === undefined ? undefined : queues.get(queue);
      return head === undefined ? stations.get(supplied)!.x : head.x - belt;
    };
    const anchored = siteInventories
      .map((id) => [id, anchorOf(id)] as const)
      .filter(
        (pair): pair is readonly [number, number] => pair[1] !== undefined,
      )
      .sort((a, b) => a[1] - b[1]);
    const unanchored = siteInventories.filter(
      (id) => anchorOf(id) === undefined,
    );
    for (const [id, anchor] of anchored) {
      const at = Math.max(anchor, free);
      inventories.set(id, WorldPos(at, inventoryTop));
      free = at + widthOf(id) + cfg.columnGap;
    }
    for (const id of unanchored) {
      inventories.set(id, WorldPos(free, inventoryTop));
      free += widthOf(id) + cfg.columnGap;
    }

    return {
      queues,
      stores,
      stations,
      inventories,
      right: Math.max(x - cfg.columnGap, free - cfg.columnGap),
      bottom:
        siteInventories.length === 0
          ? rowTop + rowHeight
          : inventoryTop + box + cfg.inventoryLabels,
    };
  };

  const placed: SiteLayout = {
    queues: new Map(),
    stores: new Map(),
    stations: new Map(),
    inventories: new Map(),
    right: 0,
    bottom: 0,
  };
  const sites = new Map<number, { pos: WorldPos; extent: Extent }>();
  let right = 0;
  // Sites are rows, top to bottom; each one's content starts inside its fence, under its name
  const sitesTop = margin;
  let fenceTop = sitesTop;
  for (const site of top.sites) {
    const rowTop = fenceTop + cfg.fencePadding + cfg.fenceLabel;
    const layout = placeSite(site, margin, rowTop);
    mergeShifted(placed, layout, 0);
    const fenceLeft = margin - cfg.fencePadding;
    const fence = {
      pos: WorldPos(fenceLeft, fenceTop),
      extent: {
        w: layout.right + cfg.fencePadding - fenceLeft,
        h: layout.bottom + cfg.fencePadding - fenceTop,
      },
    };
    sites.set(site, fence);
    right = Math.max(right, fence.pos.x + fence.extent.w);
    fenceTop += fence.extent.h + cfg.siteGap;
  }
  const sitesBottom = Math.max(sitesTop, fenceTop - cfg.siteGap);

  // Places in no site (e.g. a store shared by every site): to the right of all the sites,
  // vertically centred on them, unfenced
  let bottom = sitesBottom;
  const outside = placeSite(NO_SITE, right + cfg.columnGap, 0);
  if (outside.right > right + cfg.columnGap) {
    const dy = Math.max(
      sitesTop,
      (sitesTop + sitesBottom - outside.bottom) / 2,
    );
    mergeShifted(placed, outside, dy);
    right = outside.right;
    bottom = Math.max(bottom, outside.bottom + dy);
  }

  return {
    queues: placed.queues,
    stores: placed.stores,
    stations: placed.stations,
    inventories: placed.inventories,
    sites,
    extent: { w: right + margin, h: bottom + margin },
  };
};
