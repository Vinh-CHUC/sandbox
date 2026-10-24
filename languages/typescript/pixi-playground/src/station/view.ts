import { Container, Graphics } from "pixi.js";
import { type Layout } from "../queue/layout";
import type { Item } from "../queue/model/utils";
import type { Station, StationConfig } from "./station";

export type StationView = {
  readonly root: Container;
  readonly render: (stations: readonly Station[], now: number) => void;
};

/** White so the station's progress colour can drive it via `tint` */
const buildItemBox = (item: Item, layout: Layout): Graphics => {
  const { w, h } = layout.boxExtent(item.size);
  return new Graphics().roundRect(0, 0, w, h, 6).fill(0xffffff);
};

export const createStationView = (
  layout: Layout,
  cfg: StationConfig,
): StationView => {
  const root = new Container();
  const pads = new Map<number, Graphics>(); // one per station, keyed by index
  const items = new Map<number, Graphics>(); // keyed by the item it holds

  const render = (stations: readonly Station[], now: number) => {
    const alive = new Set<number>();
    for (const s of stations) if (s.item !== null) alive.add(s.item.id);
    for (const [id, g] of items) {
      if (alive.has(id)) continue;
      g.destroy();
      items.delete(id);
    }

    stations.forEach((s, i) => {
      const item = s.item;

      // A solid plate, `margin` bigger than the item on every side (base box when free)
      let pad = pads.get(i);
      if (pad === undefined) {
        pad = new Graphics();
        pads.set(i, pad);
        root.addChild(pad);
      }
      const { w, h } = layout.boxExtent(item?.size ?? 1);
      pad
        .clear()
        .roundRect(0, 0, w + 2 * cfg.margin, h + 2 * cfg.margin, 8)
        .fill(cfg.padColor);
      pad.x = s.target.x - cfg.margin;
      pad.y = s.target.y - cfg.margin;

      if (item === null) return;

      let g = items.get(item.id);
      if (g === undefined) {
        g = buildItemBox(item, layout);
        items.set(item.id, g);
        root.addChild(g);
      }
      const pos = s.position(now, cfg);
      g.x = pos.x;
      g.y = pos.y;
      g.alpha = s.alpha(now, cfg);
      g.tint = s.color(now, cfg);
    });
  };

  return { root, render };
};
