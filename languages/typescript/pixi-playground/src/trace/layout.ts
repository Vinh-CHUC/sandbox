import { WorldPos, type Extent } from "../shared/common";
import type { NodeKind, Topology } from "./trace";
import { units } from "../shared/scale";

/**
 * Where everything goes, from the topology alone (a trace has no positions: that's presentation).
 *
 * Sites are rows, top to bottom, each fenced in. Within a site, flow runs left to right in columns:
 * the queues nothing flows into come first, then whatever their stations (or they) feed, and so on,
 * following `edges`. A queue is a left-to-right belt whose head points at the stations it feeds,
 * stacked beside it. Each inventory sits under the column of the stations it supplies.
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
  /** each queue's head (`Layout` origin), all flowing left to right */
  readonly queues: ReadonlyMap<number, WorldPos>;
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

export const placeTopology = (
  top: Topology,
  cfg: LayoutConfig = DEFAULT_LAYOUT,
): Placement => {
  const { box, gap, margin } = cfg;
  const belt = cfg.beltLength * box + (cfg.beltLength - 1) * gap;
  const columnWidth = belt + cfg.stationGap + cfg.stationColumn + cfg.columnGap;
  const feeds = feedsOf(top);
  const supplies = suppliesOf(top);
  /** station → the queue feeding it (the first one, if several) */
  const fedBy = new Map<number, number>();
  for (const [q, ss] of feeds)
    for (const s of ss) if (!fedBy.has(s)) fedBy.set(s, q);

  const queues = new Map<number, WorldPos>();
  const stations = new Map<number, WorldPos>();
  const inventories = new Map<number, WorldPos>();
  const sites = new Map<number, { pos: WorldPos; extent: Extent }>();
  let right = 0;
  // Content of the first site starts inside its fence, under its name
  let rowTop = margin + cfg.fencePadding + cfg.fenceLabel;

  for (const site of top.sites) {
    const siteQueues = top.queues
      .filter((q) => q.site === site)
      .map((q) => q.id);
    const siteStations = new Set(
      top.stations.filter((s) => s.site === site).map((s) => s.id),
    );
    let rowHeight = cfg.stationSpacing;
    let x = margin;

    const placeStations = (ids: readonly number[], left: number, top: number) =>
      ids.forEach((s, i) =>
        stations.set(
          s,
          WorldPos(
            left,
            top + i * cfg.stationSpacing + (cfg.stationSpacing - box) / 2,
          ),
        ),
      );

    for (const column of columnsOf(top, siteQueues)) {
      let blockTop = rowTop;
      for (const q of column) {
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
      x += columnWidth;
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
    const inventoryTop = rowTop + rowHeight + cfg.inventoryGap;
    const widthOf = (id: number) =>
      (top.inventorySkus.get(id)?.length ?? 0) * (box + gap);
    let free = margin; // leftmost x not taken by an inventory yet
    const anchorOf = (id: number): number | undefined => {
      const supplied = (supplies.get(id) ?? []).find((s) => stations.has(s));
      if (supplied === undefined) return undefined;
      const queue = fedBy.get(supplied);
      const head = queue === undefined ? undefined : queues.get(queue);
      return head === undefined ? stations.get(supplied)!.x : head.x - belt;
    };
    const siteInventories = top.inventories
      .filter((i) => i.site === site)
      .map((i) => i.id);
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
      const left = Math.max(anchor, free);
      inventories.set(id, WorldPos(left, inventoryTop));
      free = left + widthOf(id) + cfg.columnGap;
    }
    for (const id of unanchored) {
      inventories.set(id, WorldPos(free, inventoryTop));
      free += widthOf(id) + cfg.columnGap;
    }

    // The fence: around everything placed, plus room for the site's name on top
    const contentRight = Math.max(x - cfg.columnGap, free - cfg.columnGap);
    const contentBottom = inventoryTop + box + cfg.inventoryLabels;
    const fenceTop = rowTop - cfg.fencePadding - cfg.fenceLabel;
    const fenceLeft = margin - cfg.fencePadding;
    sites.set(site, {
      pos: WorldPos(fenceLeft, fenceTop),
      extent: {
        w: contentRight + cfg.fencePadding - fenceLeft,
        h: contentBottom + cfg.fencePadding - fenceTop,
      },
    });

    right = Math.max(right, contentRight + cfg.fencePadding);
    rowTop =
      contentBottom + 2 * cfg.fencePadding + cfg.siteGap + cfg.fenceLabel;
  }
  const bottom = rowTop - cfg.fencePadding - cfg.fenceLabel - cfg.siteGap;
  return {
    queues,
    stations,
    inventories,
    sites,
    extent: { w: right + margin, h: bottom + margin },
  };
};
