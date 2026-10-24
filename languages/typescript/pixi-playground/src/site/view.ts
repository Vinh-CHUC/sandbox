import { Container, Graphics, type Text } from "pixi.js";
import { WorldPos, type Extent } from "../shared/common";
import { drawFence, placeAt } from "../shared/draw";
import { CHARCOAL, SITE_FLOOR } from "../shared/palette";
import { FLAT, project, type Projection } from "../shared/projection";
import { sharpText, units } from "../shared/scale";

/** A site's fence and name, around everything the layout placed in it (absolute world coords) */
export class SiteView {
  public readonly site_container = new Container();
  private readonly fence = new Graphics();
  private readonly label: Text;

  constructor(
    private readonly pos: WorldPos,
    private readonly extent: Extent,
    name: string,
  ) {
    this.label = sharpText({
      text: name,
      style: { fontSize: units(0.39), fontWeight: "bold", fill: CHARCOAL },
    });
    this.site_container.addChild(this.fence, this.label);
    this.setProjection(FLAT);
  }

  public setProjection(p: Projection): void {
    drawFence(this.fence.clear(), p, this.extent, {
      floor: SITE_FLOOR,
      outline: CHARCOAL,
    });
    placeAt(this.fence, project(p, this.pos));
    // The name sits inside the fence's top-left corner
    placeAt(
      this.label,
      project(p, WorldPos(this.pos.x + units(0.33), this.pos.y + units(0.22))),
    );
  }
}
