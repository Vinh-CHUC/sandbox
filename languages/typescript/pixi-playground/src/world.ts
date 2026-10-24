import { Container } from "pixi.js";
import { transfer, type Conveyor, type Node } from "./flow";
import { Inventory } from "./inventory/inventory";
import { layoutStacks } from "./inventory/stacks";
import { InventoryView } from "./inventory/view";
import { Layout, type Direction } from "./queue/layout";
import { Queue } from "./queue/model/queue";
import { QueueView } from "./queue/view";
import type {
  Extent,
  Item,
  Ms,
  PartId,
  PartRequest,
  PartType,
  WorldPos,
} from "./shared/common";
import { placeAt } from "./shared/draw";
import { GridView } from "./shared/grid";
import { cameraOffset, FLAT, type Projection } from "./shared/projection";
import { DEFAULT_LOOK, StationLook } from "./station/look";
import { DEFAULT_CONFIG, Station, StationBoard } from "./station/station";
import { StationView } from "./station/view";

const BOX = 36;
const GAP = 8;
const QUEUE_LENGTH = 5;
/** Every this often (simulated), one more part goes back on a stack, cycling through the parts */
const RESTOCK_INTERVAL_MS = 200;

export type ConveyorId = string & { readonly __brand: "ConveyorId" };
export const ConveyorId = (id: string) => id as ConveyorId;
export type BoardId = string & { readonly __brand: "BoardId" };
export const BoardId = (id: string) => id as BoardId;

/** A queue whose head sits at `origin` (world coords), flowing in `direction` */
export type ConveyorSpec = {
  readonly id: ConveyorId;
  readonly origin: WorldPos;
  readonly direction: Direction;
  /** visible belt length in slots; items beyond it are elided (default `DEFAULT_BELT_LENGTH`) */
  readonly length?: number;
};
/** A pool of stations, one per position (item top-left, in world coords) */
export type BoardSpec = {
  readonly id: BoardId;
  readonly positions: readonly WorldPos[];
};
export type QueueRef = { readonly kind: "queue"; readonly id: ConveyorId };
export type StationsRef = { readonly kind: "stations"; readonly id: BoardId };
export type NodeRef = QueueRef | StationsRef;
/**
 * Items flow along edges: a conveyor's popped head goes anywhere, a station's finished item goes
 * into a conveyor (stations → stations is not representable: there is nowhere to wait).
 */
export type Edge =
  | { readonly from: QueueRef; readonly to: NodeRef }
  | { readonly from: StationsRef; readonly to: QueueRef };

/** One stack per part type, in a row along x from `origin`; each starts (and refills to) `capacity` */
export type InventorySpec = {
  readonly origin: WorldPos;
  readonly parts: readonly PartType[];
  readonly capacity: number;
};

/** The whole world as plain data: what exists, where it sits, and how items flow */
export type WorldSpec = {
  readonly conveyors: readonly ConveyorSpec[];
  readonly boards: readonly BoardSpec[];
  /** supplies every station: each dispatched item takes its parts from here */
  readonly inventory: InventorySpec;
  readonly edges: readonly Edge[];
};

/** The world's sources of randomness, injected so the world itself stays deterministic */
export type WorldRandom = {
  readonly newItem: () => Item;
  /** what the next dispatched item needs, out of the inventory's `parts` */
  readonly pickParts: (parts: readonly PartId[]) => PartRequest;
};

/** Where each conveyor's popped head goes, and which conveyor each board's finished items go to */
export type Downstream = {
  readonly ofConveyor: Map<Conveyor, Node>;
  readonly ofBoard: Map<StationBoard, Conveyor>;
};

/**
 * Resolve id-based `edges` into object references.
 * Throws on an unknown id, or a source with more than one downstream edge.
 */
export const resolveEdges = (
  edges: readonly Edge[],
  conveyors: ReadonlyMap<ConveyorId, Conveyor>,
  boards: ReadonlyMap<BoardId, StationBoard>,
  inventory: Inventory,
): Downstream => {
  const lookup = <K, V>(m: ReadonlyMap<K, V>, id: K): V => {
    const v = m.get(id);
    if (v === undefined) throw new Error(`unknown id: ${String(id)}`);
    return v;
  };
  const toNode = (ref: NodeRef): Node => {
    switch (ref.kind) {
      case "queue":
        return { kind: "queue", conveyor: lookup(conveyors, ref.id) };
      case "stations":
        return {
          kind: "stations",
          board: lookup(boards, ref.id),
          inventory,
        };
    }
  };
  const once = <K, V>(m: Map<K, V>, key: K, value: V, id: string) => {
    if (m.has(key)) throw new Error(`${id} has two downstream edges`);
    m.set(key, value);
  };

  const ofConveyor = new Map<Conveyor, Node>();
  const ofBoard = new Map<StationBoard, Conveyor>();
  for (const edge of edges) {
    switch (edge.from.kind) {
      case "queue":
        once(
          ofConveyor,
          lookup(conveyors, edge.from.id),
          toNode(edge.to),
          edge.from.id,
        );
        break;
      case "stations": {
        // `Edge` already rules this out, but TS doesn't narrow `to` from `from.kind`
        const { to } = edge;
        if (to.kind !== "queue")
          throw new Error(`${edge.from.id} can only feed a conveyor`);
        once(
          ofBoard,
          lookup(boards, edge.from.id),
          lookup(conveyors, to.id),
          edge.from.id,
        );
        break;
      }
    }
  }
  return { ofConveyor, ofBoard };
};

/** The ground the grid covers: everything in `spec`, plus a few cells of slack, from (0, 0) */
const gridExtent = (spec: WorldSpec, step: number): Extent => {
  const all = [
    ...spec.conveyors.map(({ origin }) => origin),
    ...spec.boards.flatMap(({ positions }) => positions),
    spec.inventory.origin,
  ];
  const slack = 4 * step;
  return {
    w: Math.max(0, ...all.map((p) => p.x)) + slack,
    h: Math.max(0, ...all.map((p) => p.y)) + slack,
  };
};

/** Builds the models and their views from a `WorldSpec`, and drives them over time */
export class World {
  /** Everything drawn: the grid, then every view, for `app.stage.addChild` */
  public readonly root = new Container();
  private readonly grid: GridView;
  private _projection: Projection = FLAT;
  private readonly conveyors = new Map<ConveyorId, Conveyor>();
  private readonly boards: {
    readonly board: StationBoard;
    readonly positions: readonly WorldPos[];
  }[] = [];
  private readonly queueViews: QueueView[] = [];
  private readonly stationViews: StationView[] = [];
  private readonly inventory: Inventory;
  private readonly inventoryView: InventoryView;
  private readonly downstream: Downstream;
  /** Conveyors with nothing upstream: the only ones that get new items */
  private readonly roots: Conveyor[] = [];
  /** Last restock (simulated time), and which part is next; null until the first tick */
  private restockAt: Ms | null = null;
  private restockNext = 0;

  constructor(
    spec: WorldSpec,
    private readonly random: WorldRandom,
  ) {
    const { newItem } = random;
    const fedIds = new Set(
      spec.edges.flatMap(({ to }) => (to.kind === "queue" ? [to.id] : [])),
    );
    for (const { id, origin, direction, length } of spec.conveyors) {
      const layout = new Layout(BOX, GAP, direction, length);
      const queue = new Queue();
      const conveyor = { queue, layout, origin };
      // Fed conveyors start empty: their items come from upstream
      if (!fedIds.has(id)) {
        for (let i = 0; i < QUEUE_LENGTH; i++) queue.push(newItem());
        this.roots.push(conveyor);
      }
      const view = new QueueView(queue, layout);
      view.setPosition(origin);
      this.conveyors.set(id, conveyor);
      this.queueViews.push(view);
    }

    const stacks = layoutStacks(
      spec.inventory.origin,
      spec.inventory.parts,
      BOX + GAP,
    );
    this.inventory = new Inventory(
      spec.inventory.parts.map(({ id }) => id),
      spec.inventory.capacity,
    );
    this.inventoryView = new InventoryView(
      this.inventory,
      stacks,
      BOX,
      DEFAULT_LOOK.margin,
      DEFAULT_LOOK.padColor,
    );

    const look = new StationLook(
      DEFAULT_CONFIG,
      new Layout(BOX, GAP, "ltr"),
      DEFAULT_LOOK,
      stacks,
    );
    const boardsById = new Map<BoardId, StationBoard>();
    for (const { id, positions } of spec.boards) {
      // Stations know nothing of where they sit: each one's view is placed instead
      const stations = positions.map((target) => {
        const station = new Station();
        const view = new StationView(station, look);
        view.setPosition(target);
        this.stationViews.push(view);
        return station;
      });
      const board = new StationBoard(stations);
      boardsById.set(id, board);
      this.boards.push({ board, positions });
    }

    this.downstream = resolveEdges(
      spec.edges,
      this.conveyors,
      boardsById,
      this.inventory,
    );

    this.grid = new GridView(gridExtent(spec, BOX + GAP), BOX + GAP);
    this.root.addChild(
      this.grid.graphic,
      this.inventoryView.inventory_container,
      ...this.queueViews.map((v) => v.queue_container),
      ...this.stationViews.map((v) => v.station_container),
    );
    this.setProjection(FLAT);
  }

  public get projection(): Projection {
    return this._projection;
  }

  /** Redraw the whole world under `p`: models and their world coords are untouched */
  public setProjection(p: Projection): void {
    this._projection = p;
    placeAt(this.root, cameraOffset(p));
    this.grid.setProjection(p);
    this.inventoryView.setProjection(p);
    for (const view of this.queueViews) view.setProjection(p);
    for (const view of this.stationViews) view.setProjection(p);
  }

  /** How many of `part` the inventory holds */
  public stock(part: PartId): number {
    return this.inventory.count(part);
  }

  /** The items currently on conveyor `id`, head first */
  public items(id: ConveyorId): readonly Item[] {
    return this.conveyors.get(id)?.queue.items ?? [];
  }

  /**
   * Top up every root by one item, keeping it at most QUEUE_LENGTH long; then, for a random
   * conveyor feeding another conveyor, pop its head into it (feeding stations happens in `tick`,
   * as soon as one is free).
   */
  public randomEdit(now: Ms): void {
    for (const root of this.roots)
      if (root.queue.items.length < QUEUE_LENGTH)
        root.queue.push(this.random.newItem());

    const all = [...this.conveyors.values()];
    const c = all[Math.floor(Math.random() * all.length)];
    const next = this.downstream.ofConveyor.get(c);
    if (next?.kind === "queue") transfer(c, next, now);
  }

  /** Restock, move finished items out of stations, feed free stations, then redraw everything */
  public tick(now: Ms): void {
    this.restock(now);
    for (const { board, positions } of this.boards) {
      const next = this.downstream.ofBoard.get(board);
      for (const { item, index } of board.reap(now, DEFAULT_CONFIG))
        // Without a downstream conveyor the item just disappears
        next?.queue.arrive(item, positions[index], now);
    }
    for (const c of this.conveyors.values()) {
      const next = this.downstream.ofConveyor.get(c);
      // Pop as long as a station is free and the inventory has what the next item needs
      if (next?.kind === "stations")
        while (
          transfer(c, next, now, this.random.pickParts(this.inventory.parts))
        );
    }
    for (const view of this.queueViews) view.render(now);
    for (const view of this.stationViews) view.render(now);
    this.inventoryView.render();
  }

  /** One part per RESTOCK_INTERVAL_MS, round-robin; catches up after long frames (e.g. at 4×) */
  private restock(now: Ms): void {
    this.restockAt ??= now;
    const parts = this.inventory.parts;
    while (parts.length > 0 && now - this.restockAt >= RESTOCK_INTERVAL_MS) {
      this.inventory.restock(parts[this.restockNext++ % parts.length]);
      this.restockAt += RESTOCK_INTERVAL_MS;
    }
  }
}
