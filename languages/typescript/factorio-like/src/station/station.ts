import {
  clamp01,
  type Fraction,
  type Item,
  type Ms,
  type PartUse,
  type SimMs,
  type WallMs,
  type WorldPos,
} from "../shared/common";

/** Model-side config; the visual settings live in `look.ts` */
export type StationConfig = {
  /** how long an item (and its parts) take to fly in once its job starts, in wall ms */
  readonly flightMs: Ms;
};

export const DEFAULT_CONFIG: StationConfig = {
  flightMs: 900,
};

type Occupancy = {
  readonly item: Item;
  /** where the item came from (e.g. its queue slot): the fly-in's origin, in world coords */
  readonly source: WorldPos;
  /** parts the job took: they fly in alongside the item */
  readonly parts: PartUse[];
  /** when the job started, in the simulation: drives progress */
  readonly startedAt: SimMs;
  /** when it started on screen: drives the fly-in and heartbeat, the same at any speed */
  readonly shownAt: WallMs;
  /** how long the job is expected to take (simulated), null if unknown */
  readonly expectedMs: Ms | null;
};

export type Free = { readonly kind: "free" };
export type Busy = {
  readonly kind: "busy";
  readonly item: Item;
  readonly source: WorldPos;
  readonly parts: readonly PartUse[];
  /** 0 → 1 while the item flies in (wall time); 1 once it has arrived */
  readonly arrival: Fraction;
  /** 0 → 1 over the expected duration (simulated); null when that isn't known */
  readonly progress: Fraction | null;
  /** simulated time since the job started */
  readonly elapsedMs: Ms;
  /** wall time since the job showed up on screen, e.g. for a heartbeat */
  readonly shownMs: Ms;
};
/** What a station is doing at a given time; `look.ts` turns it into visuals */
export type StationState = Free | Busy;

/**
 * One processing station: free, or running one job on one item. It makes no decisions: a trace
 * says when a job starts and ends. Holds no clock: its state is a pure function of the simulated
 * time `now` (what's happening) and the wall time `wall` (how it's animated).
 */
export class Station {
  private occupancy: Occupancy | null = null;

  public get item(): Item | null {
    return this.occupancy?.item ?? null;
  }

  /** A job starts: `item` flies in from `source`. Throws if the station is busy. */
  public start(
    item: Item,
    source: WorldPos,
    now: SimMs,
    wall: WallMs,
    expectedMs: Ms | null,
  ): void {
    if (this.occupancy !== null)
      throw new Error(
        `start: station is busy with item ${this.occupancy.item.id}`,
      );
    this.occupancy = {
      item,
      source,
      parts: [],
      startedAt: now,
      shownAt: wall,
      expectedMs,
    };
  }

  /** The running job took `part`: it flies in with the item */
  public addParts(part: PartUse): void {
    if (this.occupancy === null) throw new Error("addParts: station is free");
    this.occupancy.parts.push(part);
  }

  /** The job is over: hands its item back. Throws if the station is free. */
  public end(): Item {
    if (this.occupancy === null) throw new Error("end: station is free");
    const { item } = this.occupancy;
    this.occupancy = null;
    return item;
  }

  public state(now: SimMs, wall: WallMs, cfg: StationConfig): StationState {
    const o = this.occupancy;
    if (o === null) return { kind: "free" };
    // Clamp at 0: a frame can sample a time just before a job that starts in the same frame
    const elapsedMs = Math.max(0, now - o.startedAt);
    const shownMs = Math.max(0, wall - o.shownAt);
    return {
      kind: "busy",
      item: o.item,
      source: o.source,
      parts: o.parts,
      arrival: clamp01(shownMs / cfg.flightMs),
      progress:
        o.expectedMs === null || o.expectedMs <= 0
          ? null
          : clamp01(elapsedMs / o.expectedMs),
      elapsedMs,
      shownMs,
    };
  }
}
