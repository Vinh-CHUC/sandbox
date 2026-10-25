import type { Hover } from "../shared/hover";
import { Container, Graphics, type FederatedPointerEvent } from "pixi.js";
import {
  WorldPos,
  type ItemId,
  type Pos,
  type SimMs,
  type WallMs,
} from "../shared/common";
import {
  depth,
  drawArc,
  drawBox,
  drawPlate,
  placeAt,
  RATE_REFRESH_MS,
  throttle,
} from "../shared/draw";
import { FLAT, project, type Projection } from "../shared/projection";
import { CHARCOAL } from "../shared/palette";
import type { ArcLook, HeldLook, PadLook, PartLook, StationLook } from "./look";
import type { Station } from "./station";
import { formatRate } from "./throughput";
import { FONT, sharpText } from "../shared/scale";

const buildItemBox = (look: HeldLook, p: Projection): Graphics =>
  drawBox(new Graphics(), p, look.extent, look.height, look.skin);

const drawPad = (pad: Graphics, look: PadLook, p: Projection): void => {
  drawPlate(pad.clear(), p, look.extent, look.color);
  placeAt(pad, project(p, look.pos));
};

const placeItem = (box: Graphics, look: HeldLook, p: Projection): void => {
  placeAt(box, project(p, look.pos));
  box.zIndex = depth(p, look.pos, look.extent);
  box.alpha = look.alpha;
};

/** The job's progress as an arc from 12 o'clock, a full circle at 100% (a sweeping segment if unknown) */
const drawProgress = (
  g: Graphics,
  look: ArcLook | null,
  p: Projection,
): void => {
  g.clear();
  if (look === null) return;
  const { center, radius, color, width, progress } = look;
  // No background track: the ring only closes into a full circle at 100%
  const [from, to] =
    progress.kind === "known"
      ? [0, progress.fraction]
      : [progress.phase, progress.phase + 0.25];
  drawArc(g, p, center, radius, from, to, { color, width });
};

// The container will be positioned by a layer upstream, see `setPosition`
export class StationView {
  public readonly station_container = new Container();
  private readonly pad = new Graphics();
  /** The progress ring around the item, see `ArcLook` */
  private readonly arc = new Graphics();
  /** The held item's box, if any: at most one, since a station holds one item */
  private box: { readonly id: ItemId; readonly graphic: Graphics } | null =
    null;
  /** One cube per part unit flying in with the held item */
  private partBoxes: Graphics[] = [];
  private origin = WorldPos(0, 0);
  private projection: Projection = FLAT;
  /** Where the pointer is (client coords) while it hovers the station; null otherwise */
  private pointer: Pos | null = null;
  /** Live throughput, e.g. "4.2 / min" (or "/ h", "/ day" for slower flows), just above the plate */
  /** The throughput label is refreshed at most once per RATE_REFRESH_MS of real time */
  private readonly refreshRate = throttle(RATE_REFRESH_MS);
  private readonly rate = sharpText({
    text: "",
    style: { fontSize: FONT.caption, fill: CHARCOAL },
  });

  constructor(
    private readonly station: Station,
    private readonly look: StationLook,
    private readonly onHover?: Hover,
    /** the station's own name, heading its tooltip */
    private readonly name = "",
  ) {
    this.station_container.sortableChildren = true;
    // The plate lies on the ground, under whatever the station holds
    // Below everything: the plate, then the progress ring; items and parts sort above by depth
    this.pad.zIndex = -2e9;
    this.arc.zIndex = -1e9;
    this.rate.anchor.set(0.5);
    this.rate.zIndex = Infinity;
    this.station_container.addChild(this.pad, this.arc, this.rate);

    // Hovering the pad or anything on it counts; the text itself is refreshed in `render`
    this.station_container.eventMode = "static";
    const track = (e: FederatedPointerEvent) => {
      this.pointer = { x: e.clientX, y: e.clientY };
    };
    this.station_container.on("pointerover", track);
    this.station_container.on("pointermove", track);
    this.station_container.on("pointerout", () => {
      if (this.pointer !== null) this.onHover?.(null, this.pointer);
      this.pointer = null;
    });
  }

  /** Place the station in the world; the pad and item box stay relative to this origin */
  public setPosition(target: WorldPos): void {
    this.origin = target;
    placeAt(this.station_container, project(this.projection, target));
  }

  /** Re-place the station, and drop the item box so `render` rebuilds it for `p` */
  public setProjection(p: Projection): void {
    this.projection = p;
    this.box?.graphic.destroy();
    this.box = null;
    this.syncParts([]);
    placeAt(this.rate, project(p, this.look.labelPos()));
    this.setPosition(this.origin);
  }

  /**
   * Redraw as of simulated `now` (what's happening) and wall time `wall` (animations). The
   * throughput label is refreshed at most once per RATE_REFRESH_MS of real time (so it stays
   * readable at any speed); `perMinute` is only called then.
   */
  public render(now: SimMs, wall: WallMs, perMinute: () => number): void {
    this.refreshRate(() => {
      const rate = formatRate(perMinute());
      if (this.rate.text !== rate) this.rate.text = rate;
    });
    const { pad, held, arc } = this.look.at(
      this.station,
      now,
      wall,
      this.origin,
    );
    // Plate is always drawn, sized to the held item (or a base box when free)
    drawPad(this.pad, pad, this.projection);
    drawProgress(this.arc, arc, this.projection);
    this.syncBox(held);
    // Live while hovered: progress ticks up, and the station goes "Idle" when its item leaves
    if (this.pointer !== null)
      this.onHover?.(
        [this.name, this.look.describe(this.station, now, wall)]
          .filter((line) => line !== "")
          .join("\n"),
        this.pointer,
      );
  }

  /** Keep the box in step with the held item: dropped when it leaves, built when one arrives */
  private syncBox(held: HeldLook | null): void {
    if (this.box !== null && this.box.id !== held?.id) {
      this.box.graphic.destroy();
      this.box = null;
      this.syncParts([]);
    }
    // Free station: plate only
    if (held === null) return;
    if (this.box === null) {
      const graphic = buildItemBox(held, this.projection);
      this.station_container.addChild(graphic);
      this.box = { id: held.id, graphic };
    }
    // Fly-in position, heartbeat alpha and progress tint
    placeItem(this.box.graphic, held, this.projection);
    this.syncParts(held.parts);
  }

  /** Keep one cube per flying part: rebuilt when the set changes (new item, or arrival) */
  private syncParts(parts: readonly PartLook[]): void {
    if (parts.length !== this.partBoxes.length) {
      for (const g of this.partBoxes) g.destroy();
      this.partBoxes = parts.map(({ extent, height, skin }) => {
        const g = drawBox(
          new Graphics(),
          this.projection,
          extent,
          height,
          skin,
        );
        this.station_container.addChild(g);
        return g;
      });
    }
    parts.forEach(({ pos, extent }, i) => {
      const g = this.partBoxes[i];
      placeAt(g, project(this.projection, pos));
      g.zIndex = depth(this.projection, pos, extent);
    });
  }
}
