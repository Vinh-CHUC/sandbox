import { Container, Graphics, type Text } from "pixi.js";
import { WorldPos, type Color, type SkuId } from "../shared/common";
import {
  depth,
  drawBox,
  drawPlate,
  placeAt,
  RATE_REFRESH_MS,
  throttle,
} from "../shared/draw";
import { CHARCOAL, CORAL, WHITE } from "../shared/palette";
import { FLAT, project, type Projection } from "../shared/projection";
import type { Inventory } from "./inventory";
import type { Stack } from "./stacks";
import { formatRate } from "../station/throughput";
import { sharpText, units } from "../shared/scale";

/**
 * A floor plate with one box per SKU stack, each labelled with how many units it holds, and with
 * how fast that SKU is being consumed underneath. Stacks are in absolute world coords, so the
 * container itself stays at the world's origin.
 */
export class InventoryView {
  public readonly inventory_container = new Container();
  private readonly plate = new Graphics();
  private readonly boxes = new Map<SkuId, Graphics>();
  private readonly labels = new Map<SkuId, Text>();
  /** How fast each SKU is being consumed (see `formatRate`), under its stack */
  private readonly rates = new Map<SkuId, Text>();
  private readonly refreshRates = throttle(RATE_REFRESH_MS);

  constructor(
    private readonly inventory: Inventory,
    private readonly stacks: ReadonlyMap<SkuId, Stack>,
    private readonly boxSize: number,
    private readonly margin: number,
    private readonly plateColor: Color,
  ) {
    this.inventory_container.sortableChildren = true;
    this.plate.zIndex = -Infinity;
    this.inventory_container.addChild(this.plate);
    for (const sku of stacks.keys()) {
      const label = sharpText({
        text: "",
        // White with a dark outline: readable on every step of the amber ramp
        style: {
          fontSize: units(0.39),
          fontWeight: "bold",
          fill: WHITE,
          stroke: { color: CHARCOAL, width: Math.max(2, units(0.083)) },
        },
      });
      label.anchor.set(0.5);
      // Labels sit on top of every box
      label.zIndex = Infinity;
      this.labels.set(sku, label);
      this.inventory_container.addChild(label);

      const rate = sharpText({
        text: "",
        style: { fontSize: units(0.31), fill: CHARCOAL },
      });
      rate.anchor.set(0.5);
      rate.zIndex = Infinity;
      this.rates.set(sku, rate);
      this.inventory_container.addChild(rate);
    }
    this.setProjection(FLAT);
  }

  /** Redraw the plate and boxes for `p`, and move the labels onto the boxes' tops */
  public setProjection(p: Projection): void {
    this.drawPlate(p);
    for (const g of this.boxes.values()) g.destroy();
    this.boxes.clear();
    const extent = { w: this.boxSize, h: this.boxSize };
    for (const [sku, { pos, color }] of this.stacks) {
      const box = drawBox(new Graphics(), p, extent, this.boxSize, color);
      placeAt(box, project(p, pos));
      box.zIndex = depth(pos, extent);
      this.boxes.set(sku, box);
      this.inventory_container.addChild(box);

      const centre = WorldPos(
        pos.x + this.boxSize / 2,
        pos.y + this.boxSize / 2,
      );
      placeAt(this.labels.get(sku)!, project(p, centre, this.boxSize));
      // Under the stack, past the plate's near edge
      const under = WorldPos(
        centre.x,
        pos.y + this.boxSize + this.margin + units(0.28),
      );
      placeAt(this.rates.get(sku)!, project(p, under));
    }
  }

  /** Refresh the counts every frame, and the consumption rates at most once per RATE_REFRESH_MS */
  public render(perMinute: (sku: SkuId) => number): void {
    for (const [sku, label] of this.labels) {
      const count = this.inventory.count(sku);
      const text = String(count);
      // Only touch the text when it changes: setting it re-renders the label
      if (label.text !== text) label.text = text;
      // An empty stack is trouble: the one place coral is used
      const fill = count === 0 ? CORAL : WHITE;
      if (label.style.fill !== fill) label.style.fill = fill;
    }
    this.refreshRates(() => {
      for (const [sku, label] of this.rates) {
        const text = formatRate(perMinute(sku));
        if (label.text !== text) label.text = text;
      }
    });
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
