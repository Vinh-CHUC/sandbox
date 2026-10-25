import { describe, expect, it } from "vitest";
import { Layout } from "../queue/layout";
import { SimMs, SkuId, WallMs, WorldPos, type Item } from "../shared/common";
import { StationLook, tooltip, type LookConfig, type Names } from "./look";
import { Station, type Busy, type StationConfig } from "./station";
import { plain } from "../shared/skin";

const cfg: LookConfig = {
  heartbeatMs: 400,
  alphaMin: 0.3,
  alphaMax: 1,
  margin: 8,
  padColor: 0x123456,
  partSize: 10,
  arcColor: 0x333333,
  arcWidth: 2,
  spinMs: 1000,
};

const stationCfg: StationConfig = { flightMs: 100 };
const layout = new Layout(20, 5, "ltr");
const look = new StationLook(stationCfg, layout, cfg);
const at = (x: number, y: number) => WorldPos(x, y);
const origin = at(100, 0); // where the station sits on the stage

const item = (size = 1): Item => ({ id: 7, skin: plain(0), size });
const busy = (over: Partial<Busy> = {}): Busy => ({
  kind: "busy",
  item: item(),
  source: at(0, 0),
  parts: [],
  arrival: 1,
  progress: 0,
  elapsedMs: 0,
  shownMs: 0,
  ...over,
});
const held = (over: Partial<Busy> = {}) => look.of(busy(over), origin).held!;

describe("StationLook.of", () => {
  it("free: base-sized plate around the local origin, nothing held", () => {
    expect(look.of({ kind: "free" }, origin)).toEqual({
      pad: { pos: at(-8, -8), extent: { w: 36, h: 36 }, color: 0x123456 },
      held: null,
      arc: null,
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

  it("alpha beats between alphaMin and alphaMax with wall time on screen", () => {
    expect(held({ shownMs: 0 }).alpha).toBeCloseTo(0.3); // trough
    expect(held({ shownMs: 200 }).alpha).toBeCloseTo(1); // peak
    expect(held({ shownMs: 400 }).alpha).toBeCloseTo(0.3); // trough again
    // Simulated time doesn't move it: same beat whatever the playback speed
    expect(held({ shownMs: 200, elapsedMs: 3_600_000 }).alpha).toBeCloseTo(1);
  });

  it("the item keeps its own colour, whatever the progress", () => {
    const red = { id: 7, skin: plain(0xff0000), size: 1 };
    expect(held({ item: red, progress: 0 }).skin).toEqual(plain(0xff0000));
    expect(held({ item: red, progress: 1 }).skin).toEqual(plain(0xff0000));
  });

  it("carries the item's id and box extent for the view", () => {
    expect(held({ item: item(3) })).toMatchObject({
      id: 7,
      extent: { w: 70, h: 20 }, // boxWidth(3) = 70
    });
  });
});

describe("StationLook arc", () => {
  const arc = (over: Partial<Busy>) => look.of(busy(over), origin).arc!;

  it("rings the first box, just clear of its corners", () => {
    // boxSize 20: centre (10, 10), corners √2 × 10 ≈ 14.1 away, plus the line width
    expect(arc({})).toMatchObject({
      center: at(10, 10),
      color: 0x333333,
      width: 2,
    });
    expect(arc({}).radius).toBeCloseTo(10 * Math.SQRT2 + 2);
  });

  it("fills with a known progress", () => {
    expect(arc({ progress: 0.25 }).progress).toEqual({
      kind: "known",
      fraction: 0.25,
    });
  });

  it("sweeps once per spinMs of wall time when the length is unknown", () => {
    expect(arc({ progress: null, shownMs: 250 }).progress).toEqual({
      kind: "unknown",
      phase: 0.25,
    });
    expect(arc({ progress: null, shownMs: 1250 }).progress).toMatchObject({
      phase: 0.25,
    });
  });
});

describe("StationLook parts", () => {
  const P = SkuId(100);
  // origin (100, 0); inventory 5's P stack sits at (200, 0); boxSize 20, partSize 10 → inset 5
  const withStacks = new StationLook(
    stationCfg,
    layout,
    cfg,
    (inventory, sku) =>
      inventory === 5 && sku === P
        ? { pos: at(200, 0), skin: plain(0xabcdef) }
        : undefined,
  );
  const parts = (arrival: number) =>
    withStacks.of(
      busy({ arrival, parts: [{ inventory: 5, sku: P, count: 2 }] }),
      origin,
    ).held!.parts;

  it("one cube per unit, starting on the stack, side by side", () => {
    expect(parts(0).map((p) => p.pos)).toEqual([at(105, 5), at(117, 5)]);
    expect(parts(0)[0]).toMatchObject({
      extent: { w: 10, h: 10 },
      height: 10,
      skin: plain(0xabcdef),
    });
  });

  it("flies with the item, then disappears on arrival", () => {
    expect(parts(0.5)[0].pos.x).toBeCloseTo(55); // smoothstep(0.5) = 0.5: halfway to 5
    expect(parts(1)).toEqual([]);
  });

  it("parts without a known stack are skipped", () => {
    const unknown = look.of(
      busy({ arrival: 0, parts: [{ inventory: 5, sku: P, count: 1 }] }),
      origin,
    );
    expect(unknown.held!.parts).toEqual([]);
  });
});

describe("tooltip", () => {
  const W = SkuId(1);
  const E = SkuId(2);
  const names: Names = {
    item: (id) => `Widget ${id}`,
    sku: (id) => (id === W ? "bolt" : "nut"),
  };

  it("free stations are idle", () => {
    expect(tooltip({ kind: "free" }, names)).toBe("Idle");
  });

  it("says when the item is still on its way", () => {
    expect(tooltip(busy({ arrival: 0.4 }), names)).toBe(
      "Widget 7 · arriving\nno parts",
    );
  });

  it("lists the parts used, with progress once processing", () => {
    const parts = [
      { inventory: 5, sku: W, count: 3 },
      { inventory: 5, sku: E, count: 1 },
    ];
    expect(tooltip(busy({ arrival: 1, progress: 0.634, parts }), names)).toBe(
      "Widget 7 · processing 63%\nbolt ×3, nut ×1",
    );
  });

  it("without an expected duration, says how long it's been at it", () => {
    expect(
      tooltip(busy({ progress: null, elapsedMs: 25 * 60_000 }), names),
    ).toBe("Widget 7 · processing for 25 min\nno parts");
  });

  it("falls back to ids without names", () => {
    expect(tooltip(busy({ arrival: 0.4 }))).toBe(
      "Item #7 · arriving\nno parts",
    );
  });
});

describe("StationLook.at", () => {
  it("reads the station's state at simulated `now` and wall time `wall`", () => {
    const station = new Station();
    expect(look.at(station, SimMs(0), WallMs(50), origin).held).toBeNull();
    station.start(item(), at(0, 0), SimMs(0), WallMs(0), null);
    // halfway through the 100 ms fly-in, however much simulated time passed
    const held = look.at(station, SimMs(60_000), WallMs(50), origin).held;
    expect(held?.pos.x).toBeCloseTo(-50);
  });
});
