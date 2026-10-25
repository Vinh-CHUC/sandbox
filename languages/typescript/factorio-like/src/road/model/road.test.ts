import { describe, expect, it } from "vitest";
import { SimMs, SkuId } from "../../shared/common";
import { Road, type Shipment } from "./road";

const MIN = 60_000;
const shipment = (over: Partial<Shipment> = {}): Shipment => ({
  id: 1,
  sku: SkuId(100),
  count: 6,
  from: "a",
  departed: SimMs(10 * MIN),
  speed: 1,
  ...over,
});

describe("Road", () => {
  it("progress: constant speed, from its own end, held at the far end", () => {
    const road = new Road(30);
    const s = shipment();
    const at = (min: number) => road.progress(s, SimMs(min * MIN));
    expect([at(10), at(25), at(40), at(55)]).toEqual([0, 0.5, 1, 1]);
    expect(road.progress(shipment({ speed: 2 }), SimMs(25 * MIN))).toBe(1);
    expect(road.remaining(s, SimMs(25 * MIN))).toBe(15 * MIN);
  });

  it("takes shipments on and off, counting what's been delivered", () => {
    const road = new Road(30);
    road.enter(shipment());
    road.enter(shipment({ id: 2, count: 4, from: "b" }));
    expect(road.shipments.map((s) => s.id)).toEqual([1, 2]);
    expect(road.leave(1).count).toBe(6);
    expect(road.shipments.map((s) => s.id)).toEqual([2]);
    expect(road.delivered).toEqual({ shipments: 1, units: 6 });
  });

  it("throws on a shipment entering twice, or leaving without being on", () => {
    const road = new Road(30);
    road.enter(shipment());
    expect(() => road.enter(shipment())).toThrow("already on the road");
    expect(() => road.leave(2)).toThrow("isn't on the road");
  });
});
