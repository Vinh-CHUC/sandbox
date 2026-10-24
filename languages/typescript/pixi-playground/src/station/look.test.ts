import { describe, expect, it } from "vitest";
import { Layout } from "../queue/layout";
import { WorldPos, type Item } from "../shared/common";
import { StationLook, type LookConfig } from "./look";
import { Station, type Busy, type StationConfig } from "./station";

const cfg: LookConfig = {
  heartbeatMs: 400,
  alphaMin: 0.3,
  alphaMax: 1,
  fromColor: 0xff0000,
  toColor: 0x00ff00,
  margin: 8,
  padColor: 0x123456,
};

const stationCfg: StationConfig = { dispatchMs: 100 };
const layout = new Layout(20, 5, "ltr");
const look = new StationLook(stationCfg, layout, cfg);
const at = (x: number, y: number) => WorldPos(x, y);
const origin = at(100, 0); // where the station sits on the stage

const item = (size = 1): Item => ({ id: 7, color: 0, size, processMs: 1000 });
const busy = (over: Partial<Busy> = {}): Busy => ({
  kind: "busy",
  item: item(),
  source: at(0, 0),
  arrival: 1,
  progress: 0,
  processedMs: 0,
  ...over,
});
const held = (over: Partial<Busy> = {}) => look.of(busy(over), origin).held!;

describe("StationLook.of", () => {
  it("free: base-sized plate around the local origin, nothing held", () => {
    expect(look.of({ kind: "free" }, origin)).toEqual({
      pad: { pos: at(-8, -8), extent: { w: 36, h: 36 }, color: 0x123456 },
      held: null,
    });
  });

  it("plate grows with the held item, `margin` on every side", () => {
    const { pad } = look.of(busy({ item: item(2) }), origin);
    expect(pad.extent).toEqual({ w: 45 + 16, h: 20 + 16 }); // boxWidth(2) = 45
  });

  it("position tweens from source (in local coords) to the local origin", () => {
    // source (0, 0) on the stage is (-100, 0) relative to the station
    expect(held({ arrival: 0 }).pos).toEqual(at(-100, 0)); // no jump
    expect(held({ arrival: 0.5 }).pos.x).toBeCloseTo(-50); // smoothstep(0.5) = 0.5
    expect(held({ arrival: 1 }).pos).toEqual(at(0, 0)); // arrived
  });

  it("alpha beats between alphaMin and alphaMax with processing time", () => {
    expect(held({ processedMs: 0 }).alpha).toBeCloseTo(0.3); // trough
    expect(held({ processedMs: 200 }).alpha).toBeCloseTo(1); // peak
    expect(held({ processedMs: 400 }).alpha).toBeCloseTo(0.3); // trough again
  });

  it("tint blends fromColor → toColor by progress", () => {
    expect(held({ progress: 0 }).tint).toBe(0xff0000);
    expect(held({ progress: 0.5 }).tint).toBe(0x808000); // muddy midpoint
    expect(held({ progress: 1 }).tint).toBe(0x00ff00);
  });

  it("carries the item's id and box extent for the view", () => {
    expect(held({ item: item(3) })).toMatchObject({
      id: 7,
      extent: { w: 70, h: 20 }, // boxWidth(3) = 70
    });
  });
});

describe("StationLook.at", () => {
  it("reads the station's state at `now`", () => {
    const station = new Station();
    expect(look.at(station, 50, origin).held).toBeNull();
    station.dispatch(item(), at(0, 0), 0);
    expect(look.at(station, 50, origin).held?.pos.x).toBeCloseTo(-50); // halfway in
  });
});
