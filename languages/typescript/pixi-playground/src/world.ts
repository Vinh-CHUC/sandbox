import { Container } from "pixi.js";
import { Inventory } from "./inventory/inventory";
import { layoutStacks, type Stack } from "./inventory/stacks";
import { InventoryView } from "./inventory/view";
import { Layout } from "./queue/layout";
import { Queue } from "./queue/model/queue";
import { QueueView } from "./queue/view";
import {
  ScreenPos,
  WorldPos,
  type Item,
  type ItemId,
  type Ms,
  type SimMs,
  type SkuId,
  type WallMs,
} from "./shared/common";
import { placeAt } from "./shared/draw";
import { MAX_ZOOM } from "./shared/scale";
import { CHARCOAL, skuColor, vehicleColor } from "./shared/palette";
import { GridView } from "./shared/grid";
import { cameraOffset, FLAT, type Projection } from "./shared/projection";
import { SiteView } from "./site/view";
import { DEFAULT_LOOK, StationLook, type Names } from "./station/look";
import { Station } from "./station/station";
import { Throughput } from "./station/throughput";
import { StationView, type Hover } from "./station/view";
import { DEFAULT_LAYOUT, placeTopology } from "./trace/layout";
import { Replay } from "./trace/replay";
import { labelOf, type Trace, type TraceEvent } from "./trace/trace";

const { box: BOX, gap: GAP, beltLength: BELT_LENGTH } = DEFAULT_LAYOUT;
/** The furthest the camera zooms out */
export const MIN_ZOOM = 0.25;
/** The longest throughput window that can be asked for: older completions are forgotten */
export const MAX_THROUGHPUT_WINDOW_MS = 4 * 60 * 60_000;
/** How long animations last on screen (wall time), whatever the playback speed */
export const DEFAULT_ANIMATION_MS = 800;

export type WorldOptions = {
  /** how long fly-ins, drop-ins and queue shifts take, in wall ms */
  readonly animationMs?: Ms;
  /** called while a station is hovered, see `Hover`; omitted in tests */
  readonly onHover?: Hover;
};

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
  private _projection: Projection = FLAT;
  /** How far the view has been dragged, in screen px: on top of the projection's own offset */
  private pan = ScreenPos(0, 0);
  /** Camera zoom: scales the whole drawing at once (1 = world px are screen px) */
  private _zoom = 1;
  /** One fence per site, under everything else */
  private readonly siteViews: SiteView[] = [];
  private readonly queues = new Map<number, QueueEntry>();
  private readonly stations = new Map<number, StationEntry>();
  private readonly inventories = new Map<number, InventoryEntry>();
  /** job → the station running it */
  private readonly jobs = new Map<number, number>();
  /** One `Item` per id seen, so views can key boxes on it */
  private readonly items = new Map<ItemId, Item>();
  /** Where each item last was (world coords) and when it left: the origin of a same-time move */
  private readonly lastSeen = new Map<ItemId, { pos: WorldPos; t: SimMs }>();
  private readonly replay: Replay;
  /** Sliding window for the stations' and stacks' per-minute labels */
  private throughputWindowMs: Ms = 60 * 60_000;

  constructor(trace: Trace, options: WorldOptions = {}) {
    const animationMs = options.animationMs ?? DEFAULT_ANIMATION_MS;
    const top = trace.topology;
    const placement = placeTopology(top);
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
    const stacks = new Map<number, Map<SkuId, Stack>>();
    for (const { id } of top.inventories) {
      const skus = top.inventorySkus.get(id) ?? [];
      const ownStacks = layoutStacks(
        at(placement.inventories, "inventory", id),
        skus.map((sku) => ({ id: sku, color: skuColors.get(sku) ?? CHARCOAL })),
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
        ),
        consumption: new Map(
          skus.map((sku) => [sku, new Throughput(MAX_THROUGHPUT_WINDOW_MS)]),
        ),
      });
    }

    const names: Names = {
      item: (id) => labelOf(trace, "items", id, `Item ${id}`),
      sku: (id) => labelOf(trace, "skus", id, `SKU ${id}`),
    };
    const look = new StationLook(
      { flightMs: animationMs },
      new Layout(BOX, GAP, "ltr"),
      DEFAULT_LOOK,
      (inventory, sku) => stacks.get(inventory)?.get(sku),
      names,
    );

    for (const { id } of top.queues) {
      const layout = new Layout(BOX, GAP, "ltr", BELT_LENGTH);
      const queue = new Queue(animationMs);
      const origin = at(placement.queues, "queue", id);
      const view = new QueueView(queue, layout);
      view.setPosition(origin);
      this.queues.set(id, { queue, layout, origin, view });
    }
    for (const { id } of top.stations) {
      const station = new Station();
      const pos = at(placement.stations, "station", id);
      const view = new StationView(station, look, options.onHover);
      view.setPosition(pos);
      this.stations.set(id, {
        station,
        pos,
        view,
        throughput: new Throughput(MAX_THROUGHPUT_WINDOW_MS),
      });
    }

    for (const [id, { pos, extent }] of placement.sites)
      this.siteViews.push(
        new SiteView(pos, extent, labelOf(trace, "sites", id, `Site ${id}`)),
      );

    this.replay = new Replay(trace.events);
    this.grid = new GridView(placement.extent, stride);
    this.root.addChild(
      // Site floors first, so the grid shows on top of them
      ...this.siteViews.map((v) => v.site_container),
      this.grid.graphic,
      ...[...this.inventories.values()].map((i) => i.view.inventory_container),
      ...[...this.queues.values()].map((q) => q.view.queue_container),
      ...[...this.stations.values()].map((s) => s.view.station_container),
    );
    this.setProjection(FLAT);
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
    for (const { view } of this.queues.values()) view.setProjection(p);
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
    const offset = cameraOffset(this._projection);
    this.pan = ScreenPos(
      at.x - (at.x - root.x) * k - offset.x,
      at.y - (at.y - root.y) * k - offset.y,
    );
    this._zoom = zoom;
    this.placeRoot();
  }

  /** Back to the projection's own framing, at zoom 1 */
  public resetView(): void {
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
    this.render(now, wall);
  }

  /**
   * Apply one event, its animations starting at wall time `wall`. Throws on ids or states the
   * trace can't have (see data/'s validator).
   */
  public apply(e: TraceEvent, wall: WallMs): void {
    switch (e.kind) {
      case "queue_enter":
        this.queueOf(e.queue).queue.enter(
          e.index,
          this.itemOf(e.item),
          wall,
          this.cameFrom(e.item, e.t),
        );
        return;
      case "queue_leave": {
        const q = this.queueOf(e.queue);
        const index = q.queue.indexOf(e.item);
        if (index < 0)
          throw new Error(
            `seq ${e.seq}: item ${e.item} isn't in queue ${e.queue}`,
          );
        this.lastSeen.set(e.item, {
          pos: this.slotPos(q, index, wall),
          t: e.t,
        });
        q.queue.removeAt(index, wall);
        return;
      }
      case "queue_move":
        this.queueOf(e.queue).queue.move(e.item, e.index, wall);
        return;
      case "station_start": {
        const s = this.stationOf(e.station);
        // Coming from nowhere at this instant: it just appears at the station
        const source = this.cameFrom(e.item, e.t) ?? s.pos;
        s.station.start(this.itemOf(e.item), source, e.t, wall, e.expectedMs);
        this.jobs.set(e.job, e.station);
        return;
      }
      case "station_end": {
        const s = this.stationOf(this.stationRunning(e.job, e.seq));
        const item = s.station.end();
        this.jobs.delete(e.job);
        s.throughput.record(e.t);
        this.lastSeen.set(item.id, { pos: s.pos, t: e.t });
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
    }
  }

  /** Redraw as of simulated `now` (what's happening) and wall time `wall` (animations) */
  public render(now: SimMs, wall: WallMs): void {
    const window = this.throughputWindowMs;
    for (const { view } of this.queues.values()) view.render(wall);
    for (const { view, throughput } of this.stations.values())
      view.render(now, wall, () => throughput.perMinute(now, window));
    for (const { view, consumption } of this.inventories.values())
      view.render((sku) => consumption.get(sku)?.perMinute(now, window) ?? 0);
  }

  /* ── read-only views of the state, mostly for tests ─────────────────── */

  /** Item ids in queue `id`, head first */
  public queueItems(id: number): ItemId[] {
    return this.queueOf(id).queue.items.map((item) => item.id);
  }

  /** The item station `id` is working on, if any */
  public stationItem(id: number): ItemId | null {
    return this.stationOf(id).station.item?.id ?? null;
  }

  public stock(inventory: number, sku: SkuId): number {
    return this.inventoryOf(inventory).inventory.count(sku);
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

  private placeRoot(): void {
    const offset = cameraOffset(this._projection);
    placeAt(this.root, ScreenPos(offset.x + this.pan.x, offset.y + this.pan.y));
    this.root.scale.set(this._zoom);
  }

  private itemOf(id: ItemId): Item {
    let item = this.items.get(id);
    if (item === undefined) {
      item = { id, color: vehicleColor(id), size: 1 };
      this.items.set(id, item);
    }
    return item;
  }

  /** Where `item` was if it left somewhere at exactly simulated `t` (so this is a move) */
  private cameFrom(item: ItemId, t: SimMs): WorldPos | undefined {
    const seen = this.lastSeen.get(item);
    this.lastSeen.delete(item);
    return seen !== undefined && seen.t === t ? seen.pos : undefined;
  }

  /**
   * World coords of the box at `index` in `q`, as drawn at wall time `now`; for an elided item,
   * the belt's tail end (so it leaves from there, not from a point far past the belt)
   */
  private slotPos(q: QueueEntry, index: number, now: WallMs): WorldPos {
    const item = q.queue.items[index];
    const offset = q.layout.itemOffset(
      q.layout.clampToBelt(q.queue.slot(index, now), item.size),
      q.queue.entering(index, now),
    );
    const local = q.layout.boxOrigin(offset, item.size);
    return WorldPos(q.origin.x + local.x, q.origin.y + local.y);
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

  private inventoryOf(id: number): InventoryEntry {
    const entry = this.inventories.get(id);
    if (entry === undefined) throw new Error(`trace: unknown inventory ${id}`);
    return entry;
  }
}
