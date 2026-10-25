import { describe, expect, it } from "vitest";
import { kpiTiles } from "./kpis";
import { naming } from "./trace/naming";
import type { Kpis } from "./world";

const kpis: Kpis = {
  done: 12,
  donePerMinute: 0.5,
  waiting: 40,
  blocked: 3,
  medianWaitMs: 720_000,
  stockOuts: 0,
  ready: 30,
  readyShare: 0.25,
  inTransit: null,
  transferred: 0,
};
const trace = { labels: new Map<string, string>() };

describe("kpiTiles", () => {
  it("words each KPI with the trace's kinds and states", () => {
    const tiles = kpiTiles(kpis, naming(trace));
    expect(tiles.map((t) => [t.id, t.value, t.caption])).toEqual([
      ["done", "12", "Items done"],
      ["rate", "30.0 / h", "done rate"],
      ["waiting", "40", "Items waiting"],
      ["blocked", "3", "blocked"],
      ["wait", "12 min", "median wait"],
      ["stock_outs", "0", "stock-outs"],
      ["ready", "30 (25%)", "Items ready"],
    ]);
  });

  it("labels.json renames kinds, states and captions", () => {
    const n = naming(trace, {
      kinds: { item: { one: "Widget", many: "Widgets" } },
      states: { "1": "short of parts" },
      captions: { ready: "available" },
    });
    const caption = (id: string) =>
      kpiTiles(kpis, n).find((t) => t.id === id)?.caption;
    expect([caption("done"), caption("blocked"), caption("ready")]).toEqual([
      "Widgets done",
      "short of parts",
      "available",
    ]);
  });

  it("flags trouble: blocked items, empty stacks", () => {
    const alerts = (k: Kpis) =>
      kpiTiles(k, naming(trace))
        .filter((t) => t.alert)
        .map((t) => t.id);
    expect(alerts(kpis)).toEqual(["blocked"]);
    expect(alerts({ ...kpis, blocked: 0, stockOuts: 2 })).toEqual([
      "stock_outs",
    ]);
  });

  it("adds the roads' tiles only when there are roads", () => {
    const ids = (k: Kpis) => kpiTiles(k, naming(trace)).map((t) => t.id);
    expect(ids(kpis)).not.toContain("in_transit");
    const tiles = kpiTiles(
      { ...kpis, inTransit: 12, transferred: 30 },
      naming(trace),
    ).slice(-2);
    expect(tiles.map((t) => [t.id, t.value, t.caption])).toEqual([
      ["in_transit", "12", "SKUs in transit"],
      ["transferred", "30", "SKUs transferred"],
    ]);
  });

  it("dashes what can't be known yet", () => {
    const tiles = kpiTiles(
      { ...kpis, medianWaitMs: null, readyShare: null },
      naming(trace),
    );
    expect(tiles.filter((t) => t.value === "–").map((t) => t.id)).toEqual([
      "wait",
    ]);
  });
});
