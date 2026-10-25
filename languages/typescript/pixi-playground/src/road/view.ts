import { Container, Graphics, type Text } from "pixi.js";
import { WorldPos, type Ms, type SimMs, type SkuId } from "../shared/common";
import { depth, drawBox, placeAt } from "../shared/draw";
import { formatDuration } from "../shared/format";
import { HoverTracker, type Hover } from "../shared/hover";
import { CHARCOAL, ROAD, WHITE } from "../shared/palette";
import { FLAT, project, type Projection } from "../shared/projection";
import { sharpText, units } from "../shared/scale";
import type { Skin } from "../shared/skin";
import { along, cumulative, sideways, type Path } from "./layout";
import type { End, Road, Shipment } from "./model/road";

/** What's under the pointer: the road itself, or one of its shipments */
type Part =
  | { readonly kind: "road" }
  | { readonly kind: "shipment"; readonly id: number };

/**
 *   shipmentTooltip("Transmission", 6, "Stores, Site A", "Stores, Site B", 720_000)
 *   # "Transmission ×6\nStores, Site A → Stores, Site B\n12 min to go"
 */
export const shipmentTooltip = (
  sku: string,
  count: number,
  from: string,
  to: string,
  remaining: Ms,
): string =>
  [
    `${sku} ×${count}`,
    `${from} → ${to}`,
    `${formatDuration(remaining)} to go`,
  ].join("\n");

/**
 * The road, what's on it and what it's carried; `drawn` is its length as laid out, in cells,
 * shown when it isn't the trace's (the sim's trips then don't match what's on screen)
 *
 *   roadTooltip("Road 1", 30, 34, [6, 4], { shipments: 5, units: 30 })
 *   # "Road 1 · 30 cells (drawn: 34)\n2 shipments on the way (10 units)\n5 delivered (30 units)"
 */
export const roadTooltip = (
  name: string,
  length: number,
  drawn: number,
  onRoad: readonly number[],
  delivered: { readonly shipments: number; readonly units: number },
): string => {
  const units = onRoad.reduce((n, count) => n + count, 0);
  return [
    `${name} · ${length} cells${Math.round(drawn) === length ? "" : ` (drawn: ${Math.round(drawn)})`}`,
    `${onRoad.length} shipments on the way (${units} units)`,
    `${delivered.shipments} delivered (${delivered.units} units)`,
  ].join("\n");
};

/**
 * A two-way road along `path` (its centreline, from end a to end b), two cells wide: one lane
 * each way, traffic keeping right. Each shipment is a box in its lane, labelled with its count,
 * moving at its own constant speed (see `Road.progress`): positions follow simulated time, so
 * pausing stops the traffic. Absolute world coords, like `InventoryView`.
 */
export class RoadView {
  public readonly road_container = new Container();
  private readonly tarmac = new Graphics();
  private readonly lanes: Record<End, Path>;
  private readonly drawnCells: number;
  private readonly boxes = new Map<
    number,
    { readonly box: Graphics; readonly label: Text }
  >();
  private readonly hover: HoverTracker<Part>;
  private projection: Projection = FLAT;

  constructor(
    private readonly road: Road,
    private readonly path: Path,
    /** a grid cell: a lane's width, and the length of a dash */
    private readonly cell: number,
    private readonly boxSize: number,
    private readonly skinOf: (sku: SkuId) => Skin,
    private readonly names: {
      readonly road: string;
      readonly sku: (sku: SkuId) => string;
      /** each end's name, e.g. its inventory and site */
      readonly ends: Readonly<Record<End, string>>;
    },
    onHover?: Hover,
  ) {
    this.hover = new HoverTracker(onHover);
    this.lanes = {
      a: sideways(path, cell / 2),
      b: sideways([...path].reverse(), cell / 2),
    };
    const lengths = cumulative(path);
    this.drawnCells = lengths[lengths.length - 1] / cell;
    this.road_container.sortableChildren = true;
    this.tarmac.zIndex = -Infinity;
    this.hover.attach(this.tarmac, { kind: "road" });
    this.road_container.addChild(this.tarmac);
    this.setProjection(FLAT);
  }

  /** Redraw the road for `p`; the boxes are redrawn on the next `render` */
  public setProjection(p: Projection): void {
    this.projection = p;
    this.drawTarmac(p);
    for (const { box, label } of this.boxes.values()) {
      box.destroy();
      label.destroy();
    }
    this.boxes.clear();
  }

  /** Move every shipment to where it is at simulated `now`: boxes come and go with them */
  public render(now: SimMs): void {
    const p = this.projection;
    const shipments = this.road.shipments;
    const live = new Set(shipments.map((s) => s.id));
    for (const [id, { box, label }] of this.boxes)
      if (!live.has(id)) {
        box.destroy();
        label.destroy();
        this.boxes.delete(id);
      }
    const extent = { w: this.boxSize, h: this.boxSize };
    for (const s of shipments) {
      const { box, label } = this.boxes.get(s.id) ?? this.addBox(s);
      const centre = along(this.lanes[s.from], this.road.progress(s, now));
      const pos = WorldPos(
        centre.x - this.boxSize / 2,
        centre.y - this.boxSize / 2,
      );
      placeAt(box, project(p, pos));
      box.zIndex = depth(p, pos, extent);
      placeAt(label, project(p, centre, this.boxSize));
      label.zIndex = Infinity;
    }
    this.hover.refresh((part) => this.describe(part, now));
  }

  private describe(part: Part, now: SimMs): string {
    const { road, names } = this;
    switch (part.kind) {
      case "road":
        return roadTooltip(
          names.road,
          road.length,
          this.drawnCells,
          road.shipments.map((s) => s.count),
          road.delivered,
        );
      case "shipment": {
        const s = road.shipments.find(({ id }) => id === part.id);
        if (s === undefined) return names.road; // just arrived
        const to: End = s.from === "a" ? "b" : "a";
        return shipmentTooltip(
          names.sku(s.sku),
          s.count,
          names.ends[s.from],
          names.ends[to],
          road.remaining(s, now),
        );
      }
    }
  }

  private addBox(s: Shipment): { box: Graphics; label: Text } {
    const extent = { w: this.boxSize, h: this.boxSize };
    const box = drawBox(
      new Graphics(),
      this.projection,
      extent,
      this.boxSize,
      this.skinOf(s.sku),
    );
    const label = sharpText({
      text: String(s.count),
      // As on an inventory's stacks
      style: {
        fontSize: units(0.39),
        fontWeight: "bold",
        fill: WHITE,
        stroke: { color: CHARCOAL, width: Math.max(2, units(0.083)) },
      },
    });
    label.anchor.set(0.5);
    this.hover.attach(box, { kind: "shipment", id: s.id });
    this.road_container.addChild(box, label);
    const entry = { box, label };
    this.boxes.set(s.id, entry);
    return entry;
  }

  /**
   * Two cells wide along the path, each segment stretched into its neighbours' so the corners fill
   * in (but not past the ends, onto the inventories); dashed down the middle, segment by segment
   */
  private drawTarmac(p: Projection): void {
    const g = this.tarmac.clear();
    const { cell, path } = this;
    const at = (q: WorldPos) => project(p, q);
    const last = path.length - 2;
    const dashes: [WorldPos, WorldPos][] = [];
    for (let i = 0; i <= last; i++) {
      const [a, b] = [path[i], path[i + 1]];
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const u = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
      const n = { x: -u.y * cell, y: u.x * cell };
      const back = i === 0 ? 0 : cell;
      const on = i === last ? 0 : cell;
      const [from, to] = [
        { x: a.x - u.x * back, y: a.y - u.y * back },
        { x: b.x + u.x * on, y: b.y + u.y * on },
      ];
      const corners = [
        WorldPos(from.x + n.x, from.y + n.y),
        WorldPos(to.x + n.x, to.y + n.y),
        WorldPos(to.x - n.x, to.y - n.y),
        WorldPos(from.x - n.x, from.y - n.y),
      ].map(at);
      g.poly(corners.flatMap(({ x, y }) => [x, y])).fill(ROAD);
      // A dash every cell, half a cell long
      const point = (d: number) => WorldPos(a.x + u.x * d, a.y + u.y * d);
      for (let d = cell / 4; d + cell / 2 <= len; d += cell)
        dashes.push([point(d), point(d + cell / 2)]);
    }
    for (const [from, to] of dashes.map(([a, b]) => [at(a), at(b)]))
      g.moveTo(from.x, from.y).lineTo(to.x, to.y);
    g.stroke({ width: units(0.06), color: WHITE, alpha: 0.6 });
    placeAt(this.tarmac, project(p, WorldPos(0, 0)));
  }
}
