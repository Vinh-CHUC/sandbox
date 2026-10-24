import { Container, Graphics } from "pixi.js";
import type { Extent, ItemId, Pos } from "../shared/common";
import type { HeldLook, PadLook, StationLook } from "./look";
import type { Station } from "./station";

/** White so the station's progress colour can drive it via `tint` */
const buildItemBox = ({ w: width, h: height }: Extent): Graphics =>
  new Graphics().roundRect(0, 0, width, height, 6).fill(0xffffff);

const drawPad = (pad: Graphics, look: PadLook): void => {
  pad.clear().roundRect(0, 0, look.extent.w, look.extent.h, 8).fill(look.color);
  pad.x = look.pos.x;
  pad.y = look.pos.y;
};

const placeItem = (box: Graphics, look: HeldLook): void => {
  box.x = look.pos.x;
  box.y = look.pos.y;
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

  constructor(
    private readonly station: Station,
    private readonly look: StationLook,
  ) {
    this.station_container.addChild(this.pad);
  }

  /** Place the station on the stage; the pad and item box stay relative to this origin */
  public setPosition(target: Pos): void {
    this.station_container.position.set(target.x, target.y);
  }

  public render(now: number): void {
    const origin = this.station_container.position;
    const { pad, held } = this.look.at(this.station, now, origin);
    // Plate is always drawn, sized to the held item (or a base box when free)
    drawPad(this.pad, pad);
    this.syncBox(held);
  }

  /** Keep the box in step with the held item: dropped when it leaves, built when one arrives */
  private syncBox(held: HeldLook | null): void {
    if (this.box !== null && this.box.id !== held?.id) {
      this.box.graphic.destroy();
      this.box = null;
    }
    // Free station: plate only
    if (held === null) return;
    if (this.box === null) {
      const graphic = buildItemBox(held.extent);
      this.station_container.addChild(graphic);
      this.box = { id: held.id, graphic };
    }
    // Fly-in position, heartbeat alpha and progress tint
    placeItem(this.box.graphic, held);
  }
}
