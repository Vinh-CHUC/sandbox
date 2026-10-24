import {
  clamp01,
  smoothstep,
  type Color,
  type Fraction,
  type Item,
  type Ms,
} from "../queue/model/utils";
import type { Pos } from "../queue/layout";

/** Everything that is the same for every station; per-item timings live on the `Item`. */
export type StationConfig = {
  /** how long an item takes to fly from the queue to its station */
  readonly dispatchMs: Ms;
  /** one full alpha beat */
  readonly heartbeatMs: Ms;
  /** alpha dips to this at the trough of a beat (1 = no dip) */
  readonly alphaMin: Fraction;
  readonly alphaMax: Fraction;
  /** progress 0 → 1 is painted as a blend of these */
  readonly fromColor: Color;
  readonly toColor: Color;
  /** solid plate drawn behind the item, extending this many px beyond it */
  readonly margin: number;
  readonly padColor: Color;
};

export const DEFAULT_CONFIG: StationConfig = {
  dispatchMs: 900,
  heartbeatMs: 600,
  alphaMin: 0.3,
  alphaMax: 1,
  fromColor: 0xff3b30, // red
  toColor: 0x34c759, // green
  margin: 10,
  padColor: 0x22303c,
};

type Occupancy = {
  readonly item: Item;
  /** where the item came from (queue head at pop time): the dispatch tween's origin */
  readonly source: Pos;
  readonly dispatchedAt: Ms;
};

/**
 * One processing station: either free, or holding the single item it is dispatching/processing.
 * Holds no clock — every visual value is a pure function of `now`, so there is nothing to tick.
 */
export class Station {
  private occupancy: Occupancy | null = null;

  constructor(readonly target: Pos) {}

  get isFree(): boolean {
    return this.occupancy === null;
  }

  get item(): Item | null {
    return this.occupancy?.item ?? null;
  }

  /** send `item` flying in from `source`; ignored when already busy */
  dispatch(item: Item, source: Pos, now: Ms): void {
    if (this.occupancy !== null) return;
    this.occupancy = { item, source, dispatchedAt: now };
  }

  /** free the station once its item is done; the item "disappears" for now */
  reap(now: Ms, cfg: StationConfig): boolean {
    if (this.occupancy !== null && this.isDone(now, cfg)) {
      this.occupancy = null;
      return true;
    }
    return false;
  }

  /** 0 → 1 while the item flies in; 1 once it has arrived */
  dispatchT(now: Ms, cfg: StationConfig): Fraction {
    const o = this.occupancy;
    return o === null ? 1 : clamp01((now - o.dispatchedAt) / cfg.dispatchMs);
  }

  /** 0 → 1 over the item's own processing time, once dispatched */
  progress(now: Ms, cfg: StationConfig): Fraction {
    const o = this.occupancy;
    if (o === null) return 0;
    const since = o.dispatchedAt + cfg.dispatchMs;
    return clamp01(Math.max(0, now - since) / o.item.processMs);
  }

  /** heartbeat alpha in [alphaMin, alphaMax], tied to the item's processing start */
  alpha(now: Ms, cfg: StationConfig): Fraction {
    const o = this.occupancy;
    if (o === null) return 0;
    // Clamp at 0: while still dispatching the beat would otherwise get a negative phase
    const elapsed = Math.max(0, now - (o.dispatchedAt + cfg.dispatchMs));
    return lerp(cfg.alphaMin, cfg.alphaMax, heartbeatT(elapsed, cfg));
  }

  /** item tint, blended fromColor → toColor by `progress` */
  color(now: Ms, cfg: StationConfig): Color {
    return mixColor(cfg.fromColor, cfg.toColor, this.progress(now, cfg));
  }

  /** the item's box position: tweened from `source` to `target` during dispatch */
  position(now: Ms, cfg: StationConfig): Pos {
    const o = this.occupancy;
    if (o === null) return this.target;
    const t = smoothstep(this.dispatchT(now, cfg));
    return {
      x: lerp(o.source.x, this.target.x, t),
      y: lerp(o.source.y, this.target.y, t),
    };
  }

  /** whether the held item has finished processing */
  isDone(now: Ms, cfg: StationConfig): boolean {
    return this.progress(now, cfg) >= 1;
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

  /** reap every station whose item has finished */
  reap(now: Ms, cfg: StationConfig): void {
    for (const s of this.stations) s.reap(now, cfg);
  }
}

/* ── helpers ───────────────────────────────────────────────────────────── */

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** 0 → 1 → 0 once per heartbeat (a triangle wave) */
const heartbeatT = (now: Ms, cfg: StationConfig): Fraction => {
  const phase = (now % cfg.heartbeatMs) / cfg.heartbeatMs; // [0, 1)
  return 1 - Math.abs(phase * 2 - 1);
};

const mixChannel = (a: number, b: number, t: Fraction): number =>
  Math.round(lerp(a, b, t));

/** straight RGB blend (a "nicer" red→green would detour through HSV/yellow) */
export const mixColor = (a: Color, b: Color, t: Fraction): Color =>
  (mixChannel((a >> 16) & 0xff, (b >> 16) & 0xff, t) << 16) |
  (mixChannel((a >> 8) & 0xff, (b >> 8) & 0xff, t) << 8) |
  mixChannel(a & 0xff, b & 0xff, t);
