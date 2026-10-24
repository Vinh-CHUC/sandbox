import type { Stack } from "../inventory/stacks";
import type { Layout } from "../queue/layout";
import {
  lerp,
  mixColor,
  smoothstep,
  WorldPos,
  type Color,
  type Extent,
  type Fraction,
  type ItemId,
  type Ms,
  type PartId,
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
  /** side of the little cube each part unit flies in as */
  readonly partSize: number;
};

export const DEFAULT_LOOK: LookConfig = {
  heartbeatMs: 600,
  alphaMin: 0.3,
  alphaMax: 1,
  fromColor: 0xff3b30, // red
  toColor: 0x34c759, // green
  margin: 10,
  padColor: 0x22303c,
  partSize: 14,
};

export type PadLook = {
  /** top-left of the plate */
  readonly pos: WorldPos;
  readonly extent: Extent;
  readonly color: Color;
};

/** One part unit in flight, a small cube in its part's colour */
export type PartLook = {
  /** top-left of the cube, in the station's local coords */
  readonly pos: WorldPos;
  readonly extent: Extent;
  readonly height: number;
  readonly color: Color;
};

export type HeldLook = {
  readonly id: ItemId;
  /** the item's box footprint */
  readonly extent: Extent;
  /** how tall the box stands (iso only) */
  readonly height: number;
  /** top-left of the item's box: tweened from the queue head to (0, 0) */
  readonly pos: WorldPos;
  readonly alpha: Fraction;
  readonly tint: Color;
  /** parts flying in alongside the item, one per unit; empty once it has arrived */
  readonly parts: readonly PartLook[];
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
    /** where each part's stack sits, for the parts' fly-in */
    private readonly stacks: ReadonlyMap<PartId, Stack> = new Map(),
  ) {}

  /** The appearance of `station` at `now`, for a view placed at `origin` */
  public at(station: Station, now: Ms, origin: WorldPos): Appearance {
    return this.of(station.state(now, this.stationCfg), origin);
  }

  /** `origin` is only needed to bring the dispatch `source` (world coords) into local coords */
  public of(state: StationState, origin: WorldPos): Appearance {
    return state.kind === "free"
      ? { pad: this.pad(1), held: null }
      : { pad: this.pad(state.item.size), held: this.held(state, origin) };
  }

  /** The plate is always there, sized to the held item (or a base box when free) */
  private pad(size: Size): PadLook {
    const { margin } = this.cfg;
    const { w, h } = this.layout.boxExtent(size);
    return {
      pos: WorldPos(-margin, -margin),
      extent: { w: w + 2 * margin, h: h + 2 * margin },
      color: this.cfg.padColor,
    };
  }

  private held(busy: Busy, origin: WorldPos): HeldLook {
    const { cfg } = this;
    // Fly in from the queue head (world coords) to the local origin
    const t = smoothstep(busy.arrival);
    return {
      id: busy.item.id,
      extent: this.layout.boxExtent(busy.item.size),
      height: this.layout.boxSize,
      pos: WorldPos(
        lerp(busy.source.x - origin.x, 0, t),
        lerp(busy.source.y - origin.y, 0, t),
      ),
      alpha: lerp(
        cfg.alphaMin,
        cfg.alphaMax,
        heartbeatT(busy.processedMs, cfg),
      ),
      tint: mixColor(cfg.fromColor, cfg.toColor, busy.progress),
      parts: this.parts(busy, origin, t),
    };
  }

  /** One cube per unit, flying from its stack to the station along with the item; gone on arrival */
  private parts(busy: Busy, origin: WorldPos, t: Fraction): PartLook[] {
    if (busy.arrival >= 1) return [];
    const size = this.cfg.partSize;
    // Centred on the item's first box; units of the same part sit side by side
    const inset = (this.layout.boxSize - size) / 2;
    return busy.parts.flatMap(({ part, count }) => {
      const stack = this.stacks.get(part);
      if (stack === undefined) return [];
      return Array.from({ length: count }, (_, k) => {
        const dx = inset + k * (size + 2);
        return {
          pos: WorldPos(
            lerp(stack.pos.x - origin.x + dx, dx, t),
            lerp(stack.pos.y - origin.y + inset, inset, t),
          ),
          extent: { w: size, h: size },
          height: size,
          color: stack.color,
        };
      });
    });
  }
}

/* ── helpers ───────────────────────────────────────────────────────────── */

/** 0 → 1 → 0 once per heartbeat (a triangle wave) */
const heartbeatT = (elapsed: Ms, cfg: LookConfig): Fraction => {
  const phase = (elapsed % cfg.heartbeatMs) / cfg.heartbeatMs; // [0, 1)
  return 1 - Math.abs(phase * 2 - 1);
};
