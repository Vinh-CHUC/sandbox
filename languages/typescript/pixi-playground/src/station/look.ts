import type { Layout } from "../queue/layout";
import {
  lerp,
  mixColor,
  smoothstep,
  type Color,
  type Extent,
  type Fraction,
  type ItemId,
  type Ms,
  type Pos,
  type Size,
} from "../shared/common";
import type { Busy, Station, StationConfig, StationState } from "./station";

/** Everything visual that is the same for every station */
export type LookConfig = {
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

export const DEFAULT_LOOK: LookConfig = {
  heartbeatMs: 600,
  alphaMin: 0.3,
  alphaMax: 1,
  fromColor: 0xff3b30, // red
  toColor: 0x34c759, // green
  margin: 10,
  padColor: 0x22303c,
};

export type PadLook = {
  /** top-left of the plate */
  readonly pos: Pos;
  readonly extent: Extent;
  readonly color: Color;
};

export type HeldLook = {
  readonly id: ItemId;
  /** the item's box dimensions */
  readonly extent: Extent;
  /** top-left of the item's box: tweened from the queue head to (0, 0) */
  readonly pos: Pos;
  readonly alpha: Fraction;
  readonly tint: Color;
};

/**
 * Plain data the view applies verbatim, in the station's local coords (origin = where the
 * station's item sits once arrived). `held` is null while the station is free.
 */
export type Appearance = {
  readonly pad: PadLook;
  readonly held: HeldLook | null;
};

/**
 * Turns a station's model state into an `Appearance`. Like `Layout`, it knows nothing about
 * where a station sits on screen: the view passes its own origin in.
 */
export class StationLook {
  constructor(
    private readonly stationCfg: StationConfig,
    private readonly layout: Layout,
    private readonly cfg: LookConfig,
  ) {}

  /** The appearance of `station` at `now`, for a view placed at `origin` */
  public at(station: Station, now: Ms, origin: Pos): Appearance {
    return this.of(station.state(now, this.stationCfg), origin);
  }

  /** `origin` is only needed to bring the dispatch `source` (stage coords) into local coords */
  public of(state: StationState, origin: Pos): Appearance {
    return state.kind === "free"
      ? { pad: this.pad(1), held: null }
      : { pad: this.pad(state.item.size), held: this.held(state, origin) };
  }

  /** The plate is always there, sized to the held item (or a base box when free) */
  private pad(size: Size): PadLook {
    const { margin } = this.cfg;
    const { w, h } = this.layout.boxExtent(size);
    return {
      pos: { x: -margin, y: -margin },
      extent: { w: w + 2 * margin, h: h + 2 * margin },
      color: this.cfg.padColor,
    };
  }

  private held(busy: Busy, origin: Pos): HeldLook {
    const { cfg } = this;
    // Fly in from the queue head (stage coords) to the local origin
    const t = smoothstep(busy.arrival);
    return {
      id: busy.item.id,
      extent: this.layout.boxExtent(busy.item.size),
      pos: {
        x: lerp(busy.source.x - origin.x, 0, t),
        y: lerp(busy.source.y - origin.y, 0, t),
      },
      alpha: lerp(
        cfg.alphaMin,
        cfg.alphaMax,
        heartbeatT(busy.processedMs, cfg),
      ),
      tint: mixColor(cfg.fromColor, cfg.toColor, busy.progress),
    };
  }
}

/* ── helpers ───────────────────────────────────────────────────────────── */

/** 0 → 1 → 0 once per heartbeat (a triangle wave) */
const heartbeatT = (elapsed: Ms, cfg: LookConfig): Fraction => {
  const phase = (elapsed % cfg.heartbeatMs) / cfg.heartbeatMs; // [0, 1)
  return 1 - Math.abs(phase * 2 - 1);
};
