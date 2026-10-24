import { Graphics } from "pixi.js";
import { WorldPos, type Extent } from "./common";
import { CHARCOAL } from "./palette";
import { project, type Projection } from "./projection";

/** Faint lines every `step` world px over `extent`, redrawn for each projection */
export class GridView {
  public readonly graphic = new Graphics();

  constructor(
    private readonly extent: Extent,
    private readonly step: number,
  ) {}

  public setProjection(p: Projection): void {
    const g = this.graphic.clear();
    const line = (from: WorldPos, to: WorldPos) => {
      const a = project(p, from);
      const b = project(p, to);
      g.moveTo(a.x, a.y).lineTo(b.x, b.y);
    };
    const { w, h } = this.extent;
    for (let x = 0; x <= w; x += this.step)
      line(WorldPos(x, 0), WorldPos(x, h));
    for (let y = 0; y <= h; y += this.step)
      line(WorldPos(0, y), WorldPos(w, y));
    g.stroke({ width: 1, color: CHARCOAL, alpha: 0.12 });
  }
}
