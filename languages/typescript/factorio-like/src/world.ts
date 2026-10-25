import { Container } from "pixi.js";
import { Inventory } from "./inventory/inventory";
import { layoutStacks, type Stack } from "./inventory/stacks";
import { InventoryView } from "./inventory/view";
import { Layout } from "./queue/layout";
import { Queue } from "./queue/model/queue";
import { QueueView } from "./queue/view";
import { Road, type End } from "./road/model/road";
import { RoadView } from "./road/view";
import {
  ScreenPos,
  WorldPos,
  type Extent,
  type Item,
  type ItemId,
  type Ms,
  type Pos,
  type SimMs,
  type SkuId,
  type WallMs,
} from "./shared/common";
import { placeAt } from "./shared/draw";
import { MAX_ZOOM } from "./shared/scale";
import {
  CHARCOAL,
  ITEM_RAMP,
  itemColor,
  itemShade,
  itemTypeColor,
  skuColor,
} from "./shared/palette";
import { StoreView } from "./store/view";
import { formatDuration, ordinal } from "./shared/format";
import { GridView } from "./shared/grid";
import { FLAT, framing, type Projection } from "./shared/projection";
import { SiteView } from "./site/view";
import { DEFAULT_LOOK, StationLook, type Names } from "./station/look";
import { Station } from "./station/station";
import { Throughput } from "./station/throughput";
import type { Hover } from "./shared/hover";
import { StationView } from "./station/view";
import { DEFAULT_LAYOUT, placeTopology } from "./trace/layout";
import { Replay } from "./trace/replay";
import { naming, type LabelsFile, type Naming } from "./trace/naming";
import { plain, skinOf, type Skin } from "./shared/skin";
import { NO_SKINS, type Skins } from "./theme/theme";
import type { RoadSpec, Trace, TraceEvent } from "./trace/trace";

const { box: BOX, gap: GAP, beltLength: BELT_LENGTH } = DEFAULT_LAYOUT;
/** Where the scene starts on screen: clear of the controls bar at the top */
const FRAME_MARGIN = { x: 16, y: 64 };
/** The furthest the camera zooms out */
export const MIN_ZOOM = 0.25;
/** The longest throughput window that can be asked for: older completions are forgotten */
export const MAX_THROUGHPUT_WINDOW_MS = 4 * 60 * 60_000;
/** How long animations last on screen (wall time), whatever the playback speed */
export const DEFAULT_ANIMATION_MS = 800;

export type WorldOptions = {
  /** how long fly-ins, drop-ins and queue shifts take, in wall ms */
  readonly animationMs?: Ms;
  /** called while a station, a queued item or a stock stack is hovered, see `Hover`; omitted in tests */
  readonly onHover?: Hover;
  /** display names, see `naming`; generic ones ("Queue 2") without */
  readonly labels?: LabelsFile;
  /** textures for item types and SKUs, see `loadSkins`; plain boxes for whatever has none */
  readonly skins?: Skins;
};

/** Where things stand, for the KPI strip (see `kpiTiles`) */
export type Kpis = {
  /** items that went all the way through: into a store, or out of the world */
  readonly done: number;
  /** how fast they leave, over the throughput window */
  readonly donePerMinute: number;
  /** items queued now, and how many of those are blocked */
  readonly waiting: number;
  readonly blocked: number;
  /** median time spent queued, by items that left a queue within the window */
  readonly medianWaitMs: Ms | null;
  /** SKUs at 0 in some inventory */
  readonly stockOuts: number;
  /** items sitting ready in a store, and their share of all the items seen so far */
  readonly ready: number;
  readonly readyShare: number | null;
  /** units of stock on the roads now, null when there are no roads; and units delivered so far */
  readonly inTransit: number | null;
  readonly transferred: number;
};

/** What happens to the items still in the system: `ItemState` codes in data/ */
const BLOCKED = 1;

type QueueEntry = {
  readonly queue: Queue;
  readonly layout: Layout;
  readonly origin: WorldPos;
  readonly view: QueueView;
};
type StationEntry = {
  readonly station: Station;
  readonly pos: WorldPos;
  readonly view: StationView;
  readonly throughput: Throughput;
};
type RoadEntry = {
  readonly spec: RoadSpec;
  readonly road: Road;
  readonly view: RoadView;
};
type InventoryEntry = {
  readonly inventory: Inventory;
  readonly view: InventoryView;
  /** units consumed, per SKU */
  readonly consumption: ReadonlyMap<SkuId, Throughput>;
};

/**
 * The trace, replayed: builds a model and a view per place from the trace's topology (laid out
 * automatically), then applies the trace's events as time goes on. It decides nothing: every
 * change comes from an event. What it adds is presentation, e.g. fly-ins: an item that leaves a
 * place and arrives at another at the same instant is animated between the two.
 *
 * Two clocks: simulated time (`SimMs`) says what happens when; wall time (`WallMs`) drives the
 * animations, so they look the same at any playback speed.
 */
export class World {
  /** Everything drawn: the grid, then every view, for `app.stage.addChild` */
  public readonly root = new Container();
  private readonly grid: GridView;
  /** The ground everything stands on, from (0, 0): what each projection frames */
  private readonly ground: Extent;
  private _projection: Projection = FLAT;
  /** How far the view has been dragged, in screen px: on top of the projection's own offset */
  private pan = ScreenPos(0, 0);
  /** Camera zoom: scales the whole drawing at once (1 = world px are screen px) */
  private _zoom = 1;
  /** One fence per site, under everything else */
  private readonly siteViews: SiteView[] = [];
  private readonly queues = new Map<number, QueueEntry>();
  /** Queues that feed no station: items sit there ready (unordered) */
  private readonly stores = new Map<
    number,
    { members: Set<ItemId>; view: StoreView }
  >();
  private readonly stations = new Map<number, StationEntry>();
  private readonly inventories = new Map<number, InventoryEntry>();
  private readonly roads = new Map<number, RoadEntry>();
  /** shipment → the road it's on */
  private readonly shipments = new Map<number, number>();
  /** job → the station running it */
  private readonly jobs = new Map<number, number>();
  /** One `Item` per id seen, so views can key boxes on it */
  private readonly items = new Map<ItemId, Item>();
  /** Where each item last was (world coords) and when it left: the origin of a same-time move */
  private readonly lastSeen = new Map<
    ItemId,
    { pos: WorldPos; t: SimMs; hidden: boolean }
  >();
  private readonly replay: Replay;
  private readonly naming: Naming;
  /** Each typed item's type, and where each type sits in the catalogue (its colour, its stack) */
  private readonly itemType: ReadonlyMap<ItemId, number>;
  private readonly typeIndex: ReadonlyMap<number, number>;
  /** Queued items that aren't simply waiting (`item_status`), by state code */
  private readonly states = new Map<ItemId, number>();
  /** What each queued item is short of: "inventory:sku" → the shortage */
  private readonly shortages = new Map<
    ItemId,
    Map<string, { sku: SkuId; missing: number }>
  >();
  /** When each queued item joined its queue */
  private readonly queuedSince = new Map<ItemId, SimMs>();
  /** The queued item under the pointer, if any */
  private hovered: { item: ItemId; queue: number; at: Pos } | null = null;
  /** Items that just finished a job and haven't gone anywhere (yet): leaving, unless they move on */
  private readonly exiting = new Map<ItemId, SimMs>();
  private done = 0;
  private readonly doneRate = new Throughput(MAX_THROUGHPUT_WINDOW_MS);
  /** How long items waited, as they left their queue */
  private waits: { readonly t: SimMs; readonly ms: Ms }[] = [];
  /** Sliding window for the stations' and stacks' per-minute labels */
  private throughputWindowMs: Ms = 60 * 60_000;

  private readonly onHover?: Hover;
  private readonly skins: Skins;
  /** Which store stack an item goes on, see the constructor */
  private readonly stackOf: (item: ItemId) => number;

  constructor(trace: Trace, options: WorldOptions = {}) {
    this.onHover = options.onHover;
    const animationMs = options.animationMs ?? DEFAULT_ANIMATION_MS;
    const top = trace.topology;
    const n = (this.naming = naming(trace, options.labels));
    this.itemType = top.itemType;
    this.typeIndex = new Map(top.itemTypes.map((type, i) => [type, i]));
    // A store's stacks: one per item type if the trace has types, else one per item shade
    const typed = top.itemTypes.length > 0;
    const skins = (this.skins = options.skins ?? NO_SKINS);
    const stackSkins = typed
      ? top.itemTypes.map((type) => this.typeSkin(type))
      : ITEM_RAMP.map(plain);
    const stackOf = (item: ItemId) =>
      typed
        ? (this.typeIndex.get(this.itemType.get(item) ?? -1) ?? 0)
        : itemShade(item);
    this.stackOf = stackOf;
    const placement = placeTopology(top);
    this.ground = placement.extent;
    const stride = BOX + GAP;
    const at = <T>(
      map: ReadonlyMap<number, T>,
      what: string,
      id: number,
    ): T => {
      const value = map.get(id);
      if (value === undefined)
        throw new Error(`layout: no position for ${what} ${id}`);
      return value;
    };

    // Inventories first: stations need to know where each stack sits for the parts' fly-in
    const skuColors = new Map(
      top.skus.map((sku, i) => [sku, skuColor(i, top.skus.length)]),
    );
    const skuSkin = (sku: SkuId) =>
      skinOf(skins.skus.get(sku), skuColors.get(sku) ?? CHARCOAL);
    const stacks = new Map<number, Map<SkuId, Stack>>();
    for (const { id } of top.inventories) {
      const skus = top.inventorySkus.get(id) ?? [];
      const ownStacks = layoutStacks(
        at(placement.inventories, "inventory", id),
        skus.map((sku) => ({ id: sku, skin: skuSkin(sku) })),
        stride,
      );
      stacks.set(id, ownStacks);
      const inventory = new Inventory(skus);
      this.inventories.set(id, {
        inventory,
        view: new InventoryView(
          inventory,
          ownStacks,
          BOX,
          DEFAULT_LOOK.margin,
          CHARCOAL,
          n.name("inventories", id),
          (sku) => n.name("skus", sku),
          options.onHover,
        ),
        consumption: new Map(
          skus.map((sku) => [sku, new Throughput(MAX_THROUGHPUT_WINDOW_MS)]),
        ),
      });
    }

    // Roads: an end is called by its inventory and that inventory's site
    const siteOf = new Map(top.inventories.map((i) => [i.id, i.site]));
    const endName = (inventory: number) =>
      `${n.name("inventories", inventory)}, ${n.name("sites", siteOf.get(inventory) ?? 0)}`;
    for (const spec of top.roads) {
      const road = new Road(spec.length);
      const view = new RoadView(
        road,
        at(placement.roads, "road", spec.id),
        stride,
        BOX,
        skuSkin,
        {
          road: n.name("roads", spec.id),
          sku: (sku) => n.name("skus", sku),
          ends: { a: endName(spec.a), b: endName(spec.b) },
        },
        options.onHover,
      );
      this.roads.set(spec.id, { spec, road, view });
    }

    const names: Names = {
      item: (id) => this.itemName(id),
      sku: (id) => n.name("skus", id),
    };
    const look = new StationLook(
      { flightMs: animationMs },
      new Layout(BOX, GAP, "ltr"),
      DEFAULT_LOOK,
      (inventory, sku) => stacks.get(inventory)?.get(sku),
      names,
    );

    for (const { id } of top.queues) {
      const storePos = placement.stores.get(id);
      if (storePos !== undefined) {
        const view = new StoreView(
          storePos,
          BOX,
          stride,
          DEFAULT_LOOK.margin,
          n.name("queues", id),
          animationMs,
          stackSkins,
          stackOf,
          typed ? top.itemTypes.map((t) => n.name("item_types", t)) : [],
          options.onHover,
        );
        this.stores.set(id, { members: new Set(), view });
        continue;
      }
      const layout = new Layout(BOX, GAP, "ltr", BELT_LENGTH);
      const queue = new Queue(animationMs);
      const origin = at(placement.queues, "queue", id);
      const view = new QueueView(queue, layout, {
        name: n.name("queues", id),
        // Blocked items stand out: coral is kept for trouble
        alertOf: (item) => this.states.get(item.id) === BLOCKED,
        onItemHover: (item, at) => {
          this.hovered = item === null ? null : { item, queue: id, at };
          if (item === null) options.onHover?.(null, at);
        },
      });
      view.setPosition(origin);
      this.queues.set(id, { queue, layout, origin, view });
    }
    for (const { id } of top.stations) {
      const station = new Station();
      const pos = at(placement.stations, "station", id);
      const view = new StationView(
        station,
        look,
        options.onHover,
        n.name("stations", id),
      );
      view.setPosition(pos);
      this.stations.set(id, {
        station,
        pos,
        view,
        throughput: new Throughput(MAX_THROUGHPUT_WINDOW_MS),
      });
    }

    for (const [id, { pos, extent }] of placement.sites)
      this.siteViews.push(new SiteView(pos, extent, n.name("sites", id)));

    this.replay = new Replay(trace.events);
    this.grid = new GridView(placement.extent, stride);
    this.root.addChild(
      // Site floors first, so the grid shows on top of them
      ...this.siteViews.map((v) => v.site_container),
      this.grid.graphic,
      ...[...this.roads.values()].map((r) => r.view.road_container),
      ...[...this.inventories.values()].map((i) => i.view.inventory_container),
      ...[...this.queues.values()].map((q) => q.view.queue_container),
      ...[...this.stores.values()].map((s) => s.view.store_container),
      ...[...this.stations.values()].map((s) => s.view.station_container),
    );
    this.setProjection(FLAT);
  }

  /** How things are called on screen, see `naming` */
  public get names(): Naming {
    return this.naming;
  }

  public get projection(): Projection {
    return this._projection;
  }

  /** Redraw the whole world under `p`: models and their world coords are untouched */
  public setProjection(p: Projection): void {
    this._projection = p;
    this.placeRoot();
    this.grid.setProjection(p);
    for (const view of this.siteViews) view.setProjection(p);
    for (const { view } of this.inventories.values()) view.setProjection(p);
    for (const { view } of this.roads.values()) view.setProjection(p);
    for (const { view } of this.queues.values()) view.setProjection(p);
    for (const { view } of this.stores.values()) view.setProjection(p);
    for (const { view } of this.stations.values()) view.setProjection(p);
  }

  /** Drag the view by `delta` screen px; kept across projection changes */
  public panBy(delta: ScreenPos): void {
    this.pan = ScreenPos(this.pan.x + delta.x, this.pan.y + delta.y);
    this.placeRoot();
  }

  public get zoom(): number {
    return this._zoom;
  }

  /**
   * Zoom by `factor` (> 1 zooms in), keeping the point under `at` (screen px) where it is, as a
   * mouse wheel would. Clamped to [MIN_ZOOM, MAX_ZOOM].
   */
  public zoomBy(factor: number, at: ScreenPos): void {
    const zoom = Math.min(Math.max(this._zoom * factor, MIN_ZOOM), MAX_ZOOM);
    const k = zoom / this._zoom;
    // Whatever was under `at` stays there: the root moves towards `at` as it scales about it
    const root = this.root.position;
    const offset = this.frame();
    this.pan = ScreenPos(
      at.x - (at.x - root.x) * k - offset.x,
      at.y - (at.y - root.y) * k - offset.y,
    );
    this._zoom = zoom;
    this.placeRoot();
  }

  /** Back to the projection's own framing, at zoom 1, with every belt showing its head */
  public resetView(): void {
    for (const { view } of this.queues.values()) view.resetScroll();
    this.pan = ScreenPos(0, 0);
    this._zoom = 1;
    this.placeRoot();
  }

  /** Change the window the throughput labels average over, capped at MAX_THROUGHPUT_WINDOW_MS */
  public setThroughputWindow(ms: Ms): void {
    this.throughputWindowMs = Math.min(ms, MAX_THROUGHPUT_WINDOW_MS);
  }

  /** Apply the trace up to simulated `now`, then redraw, animating as of wall time `wall` */
  public tick(now: SimMs, wall: WallMs): void {
    this.replay.advance(now, (event) => this.apply(event, wall));
    // Every event up to `now` is in, so nothing more happens at those instants
    this.settleExits((t) => t <= now);
    this.render(now, wall);
  }

  /**
   * Apply one event, its animations starting at wall time `wall`. Throws on ids or states the
   * trace can't have (see data/'s validator).
   */
  public apply(e: TraceEvent, wall: WallMs): void {
    // Time moved past some exits: nothing can pick those items up at their instant any more
    this.settleExits((t) => t < e.t);
    switch (e.kind) {
      case "queue_enter": {
        this.exiting.delete(e.item); // moved on: not leaving
        const store = this.stores.get(e.queue);
        if (store !== undefined) {
          // Into a store: through, and ready
          store.members.add(e.item);
          store.view.arrive(
            this.itemOf(e.item),
            wall,
            this.cameFrom(e.item, e.t)?.pos,
          );
          this.done++;
          this.doneRate.record(e.t);
          return;
        }
        this.queuedSince.set(e.item, e.t);
        const from = this.cameFrom(e.item, e.t);
        this.queueOf(e.queue).queue.enter(
          e.index,
          this.itemOf(e.item),
          wall,
          from?.pos,
          from?.hidden,
        );
        return;
      }
      case "queue_leave": {
        const store = this.stores.get(e.queue);
        if (store !== undefined) {
          // Out of a store, back to work: from its stack
          store.members.delete(e.item);
          this.lastSeen.set(e.item, {
            pos: store.view.stackPos(this.stackOf(e.item)),
            t: e.t,
            hidden: true, // it was only a count on a stack
          });
          return;
        }
        const q = this.queueOf(e.queue);
        const index = q.queue.indexOf(e.item);
        if (index < 0)
          throw new Error(
            `seq ${e.seq}: item ${e.item} isn't in queue ${e.queue}`,
          );
        this.lastSeen.set(e.item, {
          pos: this.slotPos(q, index, wall),
          t: e.t,
          hidden: false,
        });
        q.queue.removeAt(index, wall);
        this.states.delete(e.item);
        this.shortages.delete(e.item);
        this.recordWait(e.t, e.t - (this.queuedSince.get(e.item) ?? e.t));
        this.queuedSince.delete(e.item);
        return;
      }
      case "queue_move":
        if (this.stores.has(e.queue)) return; // unordered
        this.queueOf(e.queue).queue.move(e.item, e.index, wall);
        return;
      case "station_start": {
        const s = this.stationOf(e.station);
        // Coming from nowhere at this instant: it just appears at the station
        this.exiting.delete(e.item);
        const source = this.cameFrom(e.item, e.t)?.pos ?? s.pos;
        s.station.start(this.itemOf(e.item), source, e.t, wall, e.expectedMs);
        this.jobs.set(e.job, e.station);
        return;
      }
      case "station_end": {
        const s = this.stationOf(this.stationRunning(e.job, e.seq));
        const item = s.station.end();
        this.jobs.delete(e.job);
        s.throughput.record(e.t);
        this.lastSeen.set(item.id, { pos: s.pos, t: e.t, hidden: false });
        // Leaving, unless it shows up somewhere at this same instant (see `tick`)
        this.exiting.set(item.id, e.t);
        return;
      }
      case "consumption":
        this.stationOf(this.stationRunning(e.job, e.seq)).station.addParts({
          inventory: e.inventory,
          sku: e.sku,
          count: e.count,
        });
        this.inventoryOf(e.inventory)
          .consumption.get(e.sku)
          ?.record(e.t, e.count);
        return;
      case "stock":
        this.inventoryOf(e.inventory).inventory.set(e.sku, e.count);
        return;
      case "item_shortage": {
        const own = this.shortages.get(e.item) ?? new Map();
        const key = `${e.inventory}:${e.sku}`;
        if (e.missing === 0) own.delete(key);
        else own.set(key, { sku: e.sku, missing: e.missing });
        if (own.size === 0) this.shortages.delete(e.item);
        else this.shortages.set(e.item, own);
        return;
      }
      case "item_status":
        if (e.status === 0) this.states.delete(e.item);
        else this.states.set(e.item, e.status);
        return;
      case "road_enter": {
        // The source's stock drops through its own `stock` event: the road only takes it on
        const { spec, road } = this.roadOf(e.road);
        road.enter({
          id: e.shipment,
          sku: e.sku,
          count: e.count,
          from: this.endOf(spec, e.from, e.seq),
          departed: e.t,
          speed: e.speed,
        });
        this.shipments.set(e.shipment, e.road);
        return;
      }
      case "road_leave": {
        const id = this.shipments.get(e.shipment);
        if (id === undefined)
          throw new Error(
            `seq ${e.seq}: shipment ${e.shipment} isn't on a road`,
          );
        this.roadOf(id).road.leave(e.shipment);
        this.shipments.delete(e.shipment);
        return;
      }
    }
  }

  /** Where things stand as of simulated `now`, see `Kpis` */
  public kpis(now: SimMs): Kpis {
    const window = this.throughputWindowMs;
    const recent = this.waits
      .filter(({ t }) => t > now - window)
      .map(({ ms }) => ms)
      .sort((a, b) => a - b);
    const waiting = [...this.queues.values()].reduce(
      (n, { queue }) => n + queue.items.length,
      0,
    );
    const stockOuts = [...this.inventories.values()].reduce(
      (n, { inventory }) =>
        n + inventory.skus.filter((sku) => inventory.count(sku) === 0).length,
      0,
    );
    const seen = this.items.size;
    const ready = [...this.stores.values()].reduce(
      (n, { members }) => n + members.size,
      0,
    );
    const roads = [...this.roads.values()].map(({ road }) => road);
    return {
      done: this.done,
      donePerMinute: this.doneRate.perMinute(now, window),
      waiting,
      blocked: [...this.states.values()].filter((state) => state === BLOCKED)
        .length,
      medianWaitMs:
        recent.length === 0 ? null : recent[Math.floor(recent.length / 2)],
      stockOuts,
      ready,
      readyShare: seen === 0 ? null : ready / seen,
      inTransit:
        roads.length === 0
          ? null
          : roads
              .flatMap((road) => road.shipments)
              .reduce((n, s) => n + s.count, 0),
      transferred: roads.reduce((n, road) => n + road.delivered.units, 0),
    };
  }

  /** What hovering a queued item says: who, how long it's been waiting, where, and if it's stuck */
  public describeQueued(
    item: ItemId,
    queue: number,
    now: SimMs,
  ): string | null {
    const index = this.queueOf(queue).queue.indexOf(item);
    if (index < 0) return null;
    const n = this.naming;
    const since = this.queuedSince.get(item) ?? now;
    const state = this.states.get(item);
    // e.g. "awaiting parts: engine ×2, wheel ×1"
    const short = [...(this.shortages.get(item)?.values() ?? [])]
      .map(({ sku, missing }) => `${n.name("skus", sku)} ×${missing}`)
      .join(", ");
    return [
      this.itemName(item),
      `waiting ${formatDuration(now - since)} · ${ordinal(index + 1)} in ${n.name("queues", queue)}`,
      ...(state === undefined
        ? []
        : [short === "" ? n.state(state) : `${n.state(state)}: ${short}`]),
    ].join("\n");
  }

  /** Redraw as of simulated `now` (what's happening) and wall time `wall` (animations) */
  public render(now: SimMs, wall: WallMs): void {
    // Live while hovered: the wait ticks up, and the tooltip goes when the item leaves its queue
    if (this.hovered !== null) {
      const { item, queue, at } = this.hovered;
      const text = this.describeQueued(item, queue, now);
      if (text === null) this.hovered = null;
      this.onHover?.(text, at);
    }
    const window = this.throughputWindowMs;
    for (const { view } of this.queues.values()) view.render(wall);
    for (const { members, view } of this.stores.values())
      view.render(members, wall);
    for (const { view, throughput } of this.stations.values())
      view.render(now, wall, () => throughput.perMinute(now, window));
    for (const { view, consumption } of this.inventories.values())
      view.render((sku) => consumption.get(sku)?.perMinute(now, window) ?? 0);
    for (const { view } of this.roads.values()) view.render(now);
  }

  /* ── read-only views of the state, mostly for tests ─────────────────── */

  /** Item ids in queue `id`, head first (in arrival order, for a store) */
  public queueItems(id: number): ItemId[] {
    const store = this.stores.get(id);
    if (store !== undefined) return [...store.members];
    return this.queueOf(id).queue.items.map((item) => item.id);
  }

  /** The item station `id` is working on, if any */
  public stationItem(id: number): ItemId | null {
    return this.stationOf(id).station.item?.id ?? null;
  }

  public stock(inventory: number, sku: SkuId): number {
    return this.inventoryOf(inventory).inventory.count(sku);
  }

  /** Shipments on road `id`, and how far along each is at simulated `now`, in [0, 1] */
  public roadShipments(id: number, now: SimMs): [number, number][] {
    const { road } = this.roadOf(id);
    return road.shipments.map((s) => [s.id, road.progress(s, now)]);
  }

  /** Items per minute finished by station `id`, over the current window */
  public throughput(id: number, now: SimMs): number {
    return this.stationOf(id).throughput.perMinute(
      now,
      this.throughputWindowMs,
    );
  }

  /** Units of `sku` consumed per minute from `inventory`, over the current window */
  public skuThroughput(inventory: number, sku: SkuId, now: SimMs): number {
    return (
      this.inventoryOf(inventory)
        .consumption.get(sku)
        ?.perMinute(now, this.throughputWindowMs) ?? 0
    );
  }

  /* ── helpers ─────────────────────────────────────────────────────────── */

  /** e.g. "Vehicle 42 · Foxhound": the item, and its type when it has one */
  private itemName(id: ItemId): string {
    const type = this.itemType.get(id);
    const name = this.naming.name("items", id);
    return type === undefined
      ? name
      : `${name} · ${this.naming.name("item_types", type)}`;
  }

  /**
   * Items that finished a job at a time `isPast` and didn't move on at that same instant have
   * left the world. Settled as soon as time moves past them, so an item that leaves and comes
   * back later (even within one big tick) still counts as done.
   */
  private settleExits(isPast: (t: SimMs) => boolean): void {
    for (const [item, t] of this.exiting) {
      if (!isPast(t)) continue;
      this.done++;
      this.doneRate.record(t);
      this.exiting.delete(item);
    }
  }

  /** Keep waits for as long as the longest window could ask for */
  private recordWait(t: SimMs, ms: Ms): void {
    this.waits.push({ t, ms });
    const oldest = t - MAX_THROUGHPUT_WINDOW_MS;
    if (this.waits[0].t <= oldest)
      this.waits = this.waits.filter((w) => w.t > oldest);
  }

  /** Where the projection puts the world's origin so the whole scene starts in view */
  private frame(): ScreenPos {
    return framing(this._projection, this.ground, BOX, FRAME_MARGIN);
  }

  private placeRoot(): void {
    const offset = this.frame();
    placeAt(this.root, ScreenPos(offset.x + this.pan.x, offset.y + this.pan.y));
    this.root.scale.set(this._zoom);
  }

  private itemOf(id: ItemId): Item {
    let item = this.items.get(id);
    if (item === undefined) {
      // Skinned by type when it has one, by id otherwise
      const type = this.itemType.get(id);
      const skin =
        type === undefined ? plain(itemColor(id)) : this.typeSkin(type);
      item = { id, skin, size: 1 };
      this.items.set(id, item);
    }
    return item;
  }

  /**
   * Where `item` was if it left somewhere at exactly simulated `t` (so this is a move), and
   * whether it was drawn there
   */
  private cameFrom(
    item: ItemId,
    t: SimMs,
  ): { pos: WorldPos; hidden: boolean } | undefined {
    const seen = this.lastSeen.get(item);
    this.lastSeen.delete(item);
    return seen !== undefined && seen.t === t ? seen : undefined;
  }

  /**
   * World coords of the box at `index` in `q`, as drawn at wall time `now`; for an elided item,
   * the nearest end of the belt (so it leaves from there, not from a point far off the belt)
   */
  private slotPos(q: QueueEntry, index: number, now: WallMs): WorldPos {
    const item = q.queue.items[index];
    // Relative to where the belt's scrolled to
    const off = q.view.offset(now);
    const offset = q.layout.itemOffset(
      q.layout.clampToBelt(q.queue.slot(index, now), item.size, off) - off,
      q.queue.entering(index, now),
    );
    const local = q.layout.boxOrigin(offset, item.size);
    return WorldPos(q.origin.x + local.x, q.origin.y + local.y);
  }

  /** An item type's sprites, else its shade of teal (by its place in the catalogue) */
  private typeSkin(type: number): Skin {
    return skinOf(
      this.skins.itemTypes.get(type),
      itemTypeColor(this.typeIndex.get(type) ?? 0, this.typeIndex.size),
    );
  }

  private stationRunning(job: number, seq: number): number {
    const station = this.jobs.get(job);
    if (station === undefined)
      throw new Error(`seq ${seq}: job ${job} isn't running`);
    return station;
  }

  private queueOf(id: number): QueueEntry {
    const entry = this.queues.get(id);
    if (entry === undefined) throw new Error(`trace: unknown queue ${id}`);
    return entry;
  }

  private stationOf(id: number): StationEntry {
    const entry = this.stations.get(id);
    if (entry === undefined) throw new Error(`trace: unknown station ${id}`);
    return entry;
  }

  private roadOf(id: number): RoadEntry {
    const entry = this.roads.get(id);
    if (entry === undefined) throw new Error(`trace: unknown road ${id}`);
    return entry;
  }

  /** Which end of `spec` `inventory` is */
  private endOf(spec: RoadSpec, inventory: number, seq: number): End {
    if (inventory === spec.a) return "a";
    if (inventory === spec.b) return "b";
    throw new Error(
      `seq ${seq}: inventory ${inventory} isn't an end of road ${spec.id}`,
    );
  }

  private inventoryOf(id: number): InventoryEntry {
    const entry = this.inventories.get(id);
    if (entry === undefined) throw new Error(`trace: unknown inventory ${id}`);
    return entry;
  }
}
