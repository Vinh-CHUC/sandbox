import type { Stack } from "../inventory/stacks";
import type { Layout } from "../queue/layout";
import {
  lerp,
  smoothstep,
  WorldPos,
  type Color,
  type Extent,
  type Fraction,
  type ItemId,
  type Ms,
  type SimMs,
  type SkuId,
  type Size,
  type WallMs,
} from "../shared/common";
import { CHARCOAL } from "../shared/palette";
import type { Busy, Station, StationConfig, StationState } from "./station";
import { units } from "../shared/scale";

/** Everything visual that is the same for every station */
export type LookConfig = {
  /** one full alpha beat, in wall ms: a subtle pulse while busy */
  readonly heartbeatMs: Ms;
  /** alpha dips to this at the trough of a beat (1 = no dip) */
  readonly alphaMin: Fraction;
  readonly alphaMax: Fraction;
  /** solid plate drawn behind the item, extending this many px beyond it */
  readonly margin: number;
  readonly padColor: Color;
  /** side of the little cube each part unit flies in as */
  readonly partSize: number;
  /** the progress arc around a busy station's item */
  readonly arcColor: Color;
  readonly arcWidth: number;
  /** one turn of the sweeping arc shown while a job's length is unknown, in wall ms */
  readonly spinMs: Ms;
};

export const DEFAULT_LOOK: LookConfig = {
  heartbeatMs: 1200,
  alphaMin: 0.8,
  alphaMax: 1,
  margin: units(0.33),
  // A shade darker than the site floor, so the charcoal arc reads on it
  padColor: 0xd2ccc0,
  partSize: units(0.39),
  arcColor: CHARCOAL,
  arcWidth: Math.max(2, units(0.083)),
  spinMs: 1500,
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
  /** the item's own colour: what a station is doing shows in its arc instead */
  readonly color: Color;
  /** parts flying in alongside the item, one per unit; empty once it has arrived */
  readonly parts: readonly PartLook[];
};

/** How far along a job is: a share of its expected length, or unknown (a sweeping segment) */
export type ProgressLook =
  | { readonly kind: "known"; readonly fraction: Fraction }
  /** where the sweeping segment starts, 0 → 1 per turn */
  | { readonly kind: "unknown"; readonly phase: Fraction };

/** A ring around the station's (first) box, showing the job's progress */
export type ArcLook = {
  readonly center: WorldPos;
  readonly radius: number;
  readonly color: Color;
  readonly width: number;
  readonly progress: ProgressLook;
};

/**
 * Plain data the view applies verbatim, in the station's local coords (origin = where the
 * station's item sits once arrived). `held` and `arc` are null while the station is free.
 */
export type Appearance = {
  readonly pad: PadLook;
  readonly held: HeldLook | null;
  readonly arc: ArcLook | null;
};

/** Where a SKU's stack is in an inventory, if it's drawn */
export type StackOf = (inventory: number, sku: SkuId) => Stack | undefined;

/** Display names, e.g. from a trace's labels */
export type Names = {
  readonly item: (id: ItemId) => string;
  readonly sku: (id: SkuId) => string;
};

export const DEFAULT_NAMES: Names = {
  item: (id) => `Item #${id}`,
  sku: (id) => `SKU ${id}`,
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
    /** where each SKU's stack sits, for the parts' fly-in */
    private readonly stackOf: StackOf = () => undefined,
    private readonly names: Names = DEFAULT_NAMES,
  ) {}

  /** What a tooltip says about `station` at simulated `now`, see `tooltip` */
  public describe(station: Station, now: SimMs, wall: WallMs): string {
    return tooltip(station.state(now, wall, this.stationCfg), this.names);
  }

  /** Where a station's rate label is centred: just above its plate, over its first box */
  public labelPos(): WorldPos {
    return WorldPos(this.layout.boxSize / 2, -this.cfg.margin - units(0.28));
  }

  /** The appearance of `station` at simulated `now` and wall time `wall`, placed at `origin` */
  public at(
    station: Station,
    now: SimMs,
    wall: WallMs,
    origin: WorldPos,
  ): Appearance {
    return this.of(station.state(now, wall, this.stationCfg), origin);
  }

  /** `origin` is only needed to bring the dispatch `source` (world coords) into local coords */
  public of(state: StationState, origin: WorldPos): Appearance {
    return state.kind === "free"
      ? { pad: this.pad(1), held: null, arc: null }
      : {
          pad: this.pad(state.item.size),
          held: this.held(state, origin),
          arc: this.arc(state),
        };
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
      alpha: lerp(cfg.alphaMin, cfg.alphaMax, heartbeatT(busy.shownMs, cfg)),
      color: busy.item.color,
      parts: this.parts(busy, origin, t),
    };
  }

  /** Around the first box, just clear of its corners, inside the plate */
  private arc(busy: Busy): ArcLook {
    const { cfg } = this;
    const half = this.layout.boxSize / 2;
    return {
      center: WorldPos(half, half),
      radius: half * Math.SQRT2 + cfg.arcWidth,
      color: cfg.arcColor,
      width: cfg.arcWidth,
      progress:
        busy.progress === null
          ? { kind: "unknown", phase: (busy.shownMs % cfg.spinMs) / cfg.spinMs }
          : { kind: "known", fraction: busy.progress },
    };
  }

  /** One cube per unit, flying from its stack to the station along with the item; gone on arrival */
  private parts(busy: Busy, origin: WorldPos, t: Fraction): PartLook[] {
    if (busy.arrival >= 1) return [];
    const size = this.cfg.partSize;
    // Centred on the item's first box; units of the same part sit side by side
    const inset = (this.layout.boxSize - size) / 2;
    return busy.parts.flatMap(({ inventory, sku, count }) => {
      const stack = this.stackOf(inventory, sku);
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

/**
 * A station's state in words: what it holds, how far along it is, and the parts it used.
 *
 *   tooltip(free, names)  # "Idle"
 *   tooltip(busy, names)  # "Vehicle 42 · processing 63%\nwheel ×3, engine ×1"
 *   tooltip(busy, names)  # "Vehicle 42 · processing for 25 min\n…"   (duration unknown)
 */
export const tooltip = (
  state: StationState,
  names: Names = DEFAULT_NAMES,
): string => {
  if (state.kind === "free") return "Idle";
  const status =
    state.arrival < 1
      ? "arriving"
      : state.progress === null
        ? `processing for ${Math.round(state.elapsedMs / 60_000)} min`
        : `processing ${Math.round(state.progress * 100)}%`;
  const parts =
    state.parts.length === 0
      ? "no parts"
      : state.parts
          .map(({ sku, count }) => `${names.sku(sku)} ×${count}`)
          .join(", ");
  return `${names.item(state.item.id)} · ${status}\n${parts}`;
};

/* ── helpers ───────────────────────────────────────────────────────────── */

/** 0 → 1 → 0 once per heartbeat (a triangle wave) */
const heartbeatT = (elapsed: Ms, cfg: LookConfig): Fraction => {
  const phase = (elapsed % cfg.heartbeatMs) / cfg.heartbeatMs; // [0, 1)
  return 1 - Math.abs(phase * 2 - 1);
};
