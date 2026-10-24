import {
  clamp01,
  type Fraction,
  type Item,
  type Ms,
  type Pos,
} from "../shared/common";

/** Model-side config; the visual settings live in `look.ts` */
export type StationConfig = {
  /** how long an item takes to fly from the queue to its station */
  readonly dispatchMs: Ms;
};

export const DEFAULT_CONFIG: StationConfig = {
  dispatchMs: 900,
};

type Occupancy = {
  readonly item: Item;
  /** where the item came from (queue head at pop time): the dispatch tween's origin */
  readonly source: Pos;
  readonly dispatchedAt: Ms;
};

export type Free = { readonly kind: "free" };
export type Busy = {
  readonly kind: "busy";
  readonly item: Item;
  readonly source: Pos;
  /** 0 → 1 while the item flies in; 1 once it has arrived */
  readonly arrival: Fraction;
  /** 0 → 1 over the item's own processing time, once dispatched */
  readonly progress: Fraction;
  /** time spent processing so far; 0 while still flying in */
  readonly processedMs: Ms;
};
/** What a station is doing at a given time; `look.ts` turns it into visuals */
export type StationState = Free | Busy;

/**
 * One processing station: either free, or holding the single item it is dispatching/processing.
 * Holds no clock — its state is a pure function of `now`, so there is nothing to tick.
 */
export class Station {
  private occupancy: Occupancy | null = null;

  public get isFree(): boolean {
    return this.occupancy === null;
  }

  public get item(): Item | null {
    return this.occupancy?.item ?? null;
  }

  /** send `item` flying in from `source`; ignored when already busy */
  public dispatch(item: Item, source: Pos, now: Ms): void {
    if (this.occupancy !== null) return;
    this.occupancy = { item, source, dispatchedAt: now };
  }

  public state(now: Ms, cfg: StationConfig): StationState {
    const o = this.occupancy;
    if (o === null) return { kind: "free" };
    // Clamp at 0: processing only starts once the item has arrived
    const processedMs = Math.max(0, now - (o.dispatchedAt + cfg.dispatchMs));
    return {
      kind: "busy",
      item: o.item,
      source: o.source,
      arrival: clamp01((now - o.dispatchedAt) / cfg.dispatchMs),
      progress: clamp01(processedMs / o.item.processMs),
      processedMs,
    };
  }

  /** free the station once its item is done, handing that item back; null while busy or free */
  public reap(now: Ms, cfg: StationConfig): Item | null {
    const state = this.state(now, cfg);
    if (state.kind !== "busy" || state.progress < 1) return null;
    this.occupancy = null;
    return state.item;
  }
}

/** Chooses one of the free stations (or `undefined` when there are none). */
export type PickStation = (free: readonly Station[]) => Station | undefined;

/** Placeholder policy: a free station at random. A sim will answer this later. */
export const randomPick: PickStation = (free) =>
  free.length === 0 ? undefined : free[Math.floor(Math.random() * free.length)];

/**
 * A set of stations. Owns the "which station gets the next item" decision behind a `PickStation`,
 * so it can move out of the UI into a simulator later without touching the view.
 */
export class StationBoard {
  constructor(
    readonly stations: readonly Station[],
    private readonly pick: PickStation = randomPick,
  ) {}

  get hasFree(): boolean {
    return this.stations.some((s) => s.isFree);
  }

  /** dispatch `item` into a free station; false when none is free */
  dispatch(item: Item, source: Pos, now: Ms): boolean {
    const station = this.pick(this.stations.filter((s) => s.isFree));
    if (station === undefined) return false;
    station.dispatch(item, source, now);
    return true;
  }

  /** reap every station whose item has finished: each item with the index of its station */
  reap(now: Ms, cfg: StationConfig): { item: Item; index: number }[] {
    return this.stations.flatMap((s, index) => {
      const item = s.reap(now, cfg);
      return item === null ? [] : [{ item, index }];
    });
  }
}
