import { Container, Graphics, Text } from "pixi.js";
import { WorldPos, type Color, type PartId } from "../shared/common";
import { depth, drawBox, drawPlate, placeAt } from "../shared/draw";
import { FLAT, project, type Projection } from "../shared/projection";
import type { Inventory } from "./inventory";
import type { Stack } from "./stacks";

/**
 * A floor plate with one box per part stack, each labelled with how many parts it holds. Stacks
 * are in absolute world coords, so the container itself stays at the world's origin.
 */
export class InventoryView {
  public readonly inventory_container = new Container();
  private readonly plate = new Graphics();
  private readonly boxes = new Map<PartId, Graphics>();
  private readonly labels = new Map<PartId, Text>();

  constructor(
    private readonly inventory: Inventory,
    private readonly stacks: ReadonlyMap<PartId, Stack>,
    private readonly boxSize: number,
    private readonly margin: number,
    private readonly plateColor: Color,
  ) {
    this.inventory_container.sortableChildren = true;
    this.plate.zIndex = -Infinity;
    this.inventory_container.addChild(this.plate);
    for (const part of stacks.keys()) {
      const label = new Text({
        text: "",
        style: { fontSize: 14, fontWeight: "bold", fill: 0xffffff },
      });
      label.anchor.set(0.5);
      // Labels sit on top of every box
      label.zIndex = Infinity;
      this.labels.set(part, label);
      this.inventory_container.addChild(label);
    }
    this.setProjection(FLAT);
  }

  /** Redraw the plate and boxes for `p`, and move the labels onto the boxes' tops */
  public setProjection(p: Projection): void {
    this.drawPlate(p);
    for (const g of this.boxes.values()) g.destroy();
    this.boxes.clear();
    const extent = { w: this.boxSize, h: this.boxSize };
    for (const [part, { pos, color }] of this.stacks) {
      const box = drawBox(new Graphics(), p, extent, this.boxSize, color);
      placeAt(box, project(p, pos));
      box.zIndex = depth(pos, extent);
      this.boxes.set(part, box);
      this.inventory_container.addChild(box);

      const centre = WorldPos(
        pos.x + this.boxSize / 2,
        pos.y + this.boxSize / 2,
      );
      placeAt(this.labels.get(part)!, project(p, centre, this.boxSize));
    }
  }

  public render(): void {
    for (const [part, label] of this.labels) {
      const text = String(this.inventory.count(part));
      // Only touch the text when it changes: setting it re-renders the label
      if (label.text !== text) label.text = text;
    }
  }

  /** One plate under all stacks, `margin` beyond them on every side */
  private drawPlate(p: Projection): void {
    const all = [...this.stacks.values()].map(({ pos }) => pos);
    if (all.length === 0) return void this.plate.clear();
    const minX = Math.min(...all.map(({ x }) => x)) - this.margin;
    const minY = Math.min(...all.map(({ y }) => y)) - this.margin;
    const maxX =
      Math.max(...all.map(({ x }) => x)) + this.boxSize + this.margin;
    const maxY =
      Math.max(...all.map(({ y }) => y)) + this.boxSize + this.margin;
    const extent = { w: maxX - minX, h: maxY - minY };
    drawPlate(this.plate.clear(), p, extent, this.plateColor);
    placeAt(this.plate, project(p, WorldPos(minX, minY)));
  }
}
