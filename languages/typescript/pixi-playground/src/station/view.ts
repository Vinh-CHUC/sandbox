import { Container, Graphics } from "pixi.js";
import { WorldPos, type Extent, type ItemId } from "../shared/common";
import { depth, drawBox, drawPlate, placeAt } from "../shared/draw";
import { FLAT, project, type Projection } from "../shared/projection";
import type { HeldLook, PadLook, PartLook, StationLook } from "./look";
import type { Station } from "./station";

/** White so the station's progress colour can drive it via `tint` */
const buildItemBox = (
  extent: Extent,
  height: number,
  p: Projection,
): Graphics => drawBox(new Graphics(), p, extent, height, 0xffffff);

const drawPad = (pad: Graphics, look: PadLook, p: Projection): void => {
  drawPlate(pad.clear(), p, look.extent, look.color);
  placeAt(pad, project(p, look.pos));
};

const placeItem = (box: Graphics, look: HeldLook, p: Projection): void => {
  placeAt(box, project(p, look.pos));
  box.zIndex = depth(look.pos, look.extent);
  box.alpha = look.alpha;
  box.tint = look.tint;
};

// The container will be positioned by a layer upstream, see `setPosition`
export class StationView {
  public readonly station_container = new Container();
  private readonly pad = new Graphics();
  /** The held item's box, if any: at most one, since a station holds one item */
  private box: { readonly id: ItemId; readonly graphic: Graphics } | null =
    null;
  /** One cube per part unit flying in with the held item */
  private partBoxes: Graphics[] = [];
  private origin = WorldPos(0, 0);
  private projection: Projection = FLAT;

  constructor(
    private readonly station: Station,
    private readonly look: StationLook,
  ) {
    this.station_container.sortableChildren = true;
    // The plate lies on the ground, under whatever the station holds
    this.pad.zIndex = -Infinity;
    this.station_container.addChild(this.pad);
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
    this.setPosition(this.origin);
  }

  public render(now: number): void {
    const { pad, held } = this.look.at(this.station, now, this.origin);
    // Plate is always drawn, sized to the held item (or a base box when free)
    drawPad(this.pad, pad, this.projection);
    this.syncBox(held);
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
      const graphic = buildItemBox(held.extent, held.height, this.projection);
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
      this.partBoxes = parts.map(({ extent, height, color }) => {
        const g = drawBox(
          new Graphics(),
          this.projection,
          extent,
          height,
          color,
        );
        this.station_container.addChild(g);
        return g;
      });
    }
    parts.forEach(({ pos, extent }, i) => {
      const g = this.partBoxes[i];
      placeAt(g, project(this.projection, pos));
      g.zIndex = depth(pos, extent);
    });
  }
}
