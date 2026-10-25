import { Container, Graphics, type Text } from "pixi.js";
import {
  lerp,
  smoothstep,
  WorldPos,
  type Item,
  type ItemId,
  type Ms,
  type WallMs,
} from "../shared/common";
import { depth, drawBox, drawPlate, placeAt } from "../shared/draw";
import { CHARCOAL, WHITE } from "../shared/palette";
import { FLAT, project, type Projection } from "../shared/projection";
import { FONT, LABEL_GAP, sharpText, units } from "../shared/scale";
import { HoverTracker, type Hover } from "../shared/hover";
import type { Skin } from "../shared/skin";

/**
 *   storeTooltip("Ready for service", "Foxhound", 12)   # "Ready for service\nFoxhound: 12"
 *   storeTooltip("Ready for service", "", 12)           # "Ready for service\n12"
 */
export const storeTooltip = (
  store: string,
  stack: string,
  count: number,
): string => `${store}\n${stack === "" ? count : `${stack}: ${count}`}`;

/** An item flying into the store, from where it left (world coords) at wall time `at` */
type Flight = {
  readonly item: Item;
  readonly source: WorldPos;
  readonly at: WallMs;
};

/**
 * A store, where items sit ready: drawn like an inventory, a plate with one stack per kind of
 * item (e.g. per item type, in its skin), each with how many it holds, and the store's name and total above.
 * Arriving items fly in to the stack of their shade and fade into it. Absolute world coords: the
 * container stays at the world's origin.
 */
export class StoreView {
  public readonly store_container = new Container();
  private readonly plate = new Graphics();
  private readonly title: Text;
  private readonly stacks: Graphics[] = [];
  private readonly counts: Text[];
  private readonly flights = new Map<
    ItemId,
    { flight: Flight; graphic: Graphics }
  >();
  private projection: Projection = FLAT;
  private readonly hover: HoverTracker<number>;
  /** How many items each stack holds, as of the last `render` */
  private stackCounts: number[];

  constructor(
    /** the first stack's top-left; the others follow along x */
    private readonly pos: WorldPos,
    private readonly boxSize: number,
    private readonly stride: number,
    private readonly margin: number,
    private readonly name: string,
    /** how long a fly-in takes, in wall ms */
    private readonly flightMs: Ms,
    /** one skin per stack, e.g. per item type */
    private readonly stackSkins: readonly Skin[],
    /** which stack an item goes on */
    private readonly stackOf: (item: ItemId) => number,
    /** what each stack holds, e.g. its item type's name; "" if nothing to say */
    private readonly stackNames: readonly string[] = [],
    onHover?: Hover,
  ) {
    this.hover = new HoverTracker(onHover);
    this.stackCounts = stackSkins.map(() => 0);
    this.store_container.sortableChildren = true;
    this.plate.zIndex = -Infinity;
    this.title = sharpText({
      text: name,
      style: { fontSize: FONT.title, fontWeight: "bold", fill: CHARCOAL },
    });
    this.title.anchor.set(0, 1);
    this.title.zIndex = Infinity;
    this.counts = stackSkins.map(() => {
      const label = sharpText({
        text: "0",
        style: {
          fontSize: units(0.39),
          fontWeight: "bold",
          fill: WHITE,
          stroke: { color: CHARCOAL, width: Math.max(2, units(0.083)) },
        },
      });
      label.anchor.set(0.5);
      label.zIndex = Infinity;
      return label;
    });
    this.store_container.addChild(this.plate, this.title, ...this.counts);
    this.setProjection(FLAT);
  }

  /** Where an item of `shade` sits once in (its stack's top-left), e.g. to leave from */
  public stackPos(shade: number): WorldPos {
    return WorldPos(this.pos.x + shade * this.stride, this.pos.y);
  }

  /** `item` comes in: flying from `source` if it's moving from somewhere, else just counted */
  public arrive(item: Item, wall: WallMs, source?: WorldPos): void {
    if (source === undefined) return;
    this.flights.get(item.id)?.graphic.destroy();
    const graphic = drawBox(
      new Graphics(),
      this.projection,
      { w: this.boxSize, h: this.boxSize },
      this.boxSize,
      item.skin,
    );
    this.store_container.addChild(graphic);
    this.flights.set(item.id, { flight: { item, source, at: wall }, graphic });
  }

  public setProjection(p: Projection): void {
    this.projection = p;
    for (const { graphic } of this.flights.values()) graphic.destroy();
    this.flights.clear();
    for (const g of this.stacks) g.destroy();
    this.stacks.length = 0;

    const m = this.margin;
    const w =
      this.stackSkins.length * this.stride - (this.stride - this.boxSize);
    drawPlate(
      this.plate.clear(),
      p,
      { w: w + 2 * m, h: this.boxSize + 2 * m },
      CHARCOAL,
    );
    placeAt(this.plate, project(p, WorldPos(this.pos.x - m, this.pos.y - m)));
    placeAt(
      this.title,
      project(p, WorldPos(this.pos.x - m, this.pos.y - m - LABEL_GAP)),
    );

    const extent = { w: this.boxSize, h: this.boxSize };
    this.stackSkins.forEach((skin, shade) => {
      const pos = this.stackPos(shade);
      const stack = drawBox(new Graphics(), p, extent, this.boxSize, skin);
      placeAt(stack, project(p, pos));
      stack.zIndex = depth(p, pos, extent);
      this.stacks.push(stack);
      this.hover.attach(stack, shade);
      this.store_container.addChild(stack);
      const centre = WorldPos(
        pos.x + this.boxSize / 2,
        pos.y + this.boxSize / 2,
      );
      placeAt(this.counts[shade], project(p, centre, this.boxSize));
    });
  }

  /** Redraw: `members` are the items in the store now; flights run on wall time */
  public render(members: Iterable<ItemId>, wall: WallMs): void {
    const counts = this.stackSkins.map(() => 0);
    let total = 0;
    for (const id of members) {
      counts[this.stackOf(id)]++;
      total++;
    }
    counts.forEach((count, shade) => {
      const text = String(count);
      if (this.counts[shade].text !== text) this.counts[shade].text = text;
    });
    this.stackCounts = counts;
    this.hover.refresh((shade) =>
      storeTooltip(
        this.name,
        this.stackNames[shade] ?? "",
        this.stackCounts[shade],
      ),
    );
    const title = `${this.name} · ${total}`;
    if (this.title.text !== title) this.title.text = title;

    for (const [id, { flight, graphic }] of this.flights) {
      const t = (wall - flight.at) / this.flightMs;
      if (t >= 1) {
        graphic.destroy();
        this.flights.delete(id);
        continue;
      }
      const eased = smoothstep(Math.max(0, t));
      const target = this.stackPos(this.stackOf(id));
      const pos = WorldPos(
        lerp(flight.source.x, target.x, eased),
        lerp(flight.source.y, target.y, eased),
      );
      placeAt(graphic, project(this.projection, pos));
      graphic.zIndex =
        depth(this.projection, pos, { w: this.boxSize, h: this.boxSize }) + 1;
      // Fades into its stack over the last fifth of the flight
      graphic.alpha = t < 0.8 ? 1 : (1 - t) / 0.2;
    }
  }
}
