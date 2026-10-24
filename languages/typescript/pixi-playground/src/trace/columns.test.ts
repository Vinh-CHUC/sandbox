import { describe, expect, it } from "vitest";
import { toTrace, type Tables } from "./columns";

/** One site: queue 1 → station 10, inventory 5 stocking SKU 100; int64 columns as bigint */
const tables = (): Record<string, Tables[string]> => ({
  sites: { site_id: [1] },
  queues: { queue_id: [1], site_id: [1] },
  stations: { station_id: [10], site_id: [1] },
  inventories: { inventory_id: [5], site_id: [1] },
  skus: { sku_id: [100n] },
  inventory_skus: { inventory_id: [5], sku_id: [100n] },
  edges: { from_kind: [0], from_id: [1], to_kind: [1], to_id: [10] },
  queue_enter: {
    seq: [1n],
    sim_time_us: [0n],
    item_id: [7],
    queue_id: [1],
    index: [0],
  },
  station_start: {
    seq: [2n],
    sim_time_us: [5_000_000n],
    job_id: [1],
    item_id: [7],
    station_id: [10],
    expected_duration_us: [-1n],
  },
  stock: {
    seq: [0n],
    sim_time_us: [0n],
    inventory_id: [5],
    sku_id: [100n],
    count: [3],
  },
  meta: {
    format_version: [1],
    start_unix_us: [1_000_000n],
    end_sim_time_us: [60_000_000n],
  },
  labels: { table: ["skus"], id: [100n], label: ["bolt"] },
});

describe("toTrace", () => {
  it("reads the topology", () => {
    const { topology } = toTrace(tables());
    expect(topology.queues).toEqual([{ id: 1, site: 1 }]);
    expect(topology.inventorySkus.get(5)).toEqual([100]);
    expect(topology.edges).toEqual([
      { from: { kind: "queue", id: 1 }, to: { kind: "station", id: 10 } },
    ]);
  });

  it("merges every event table in seq order, times in ms", () => {
    const { events } = toTrace(tables());
    expect(events.map((e) => [e.seq, e.kind, e.t])).toEqual([
      [0, "stock", 0],
      [1, "queue_enter", 0],
      [2, "station_start", 5000],
    ]);
  });

  it("maps the unknown-duration sentinel to null", () => {
    const start = toTrace(tables()).events.find(
      (e) => e.kind === "station_start",
    );
    expect(start).toMatchObject({ expectedMs: null });
  });

  it("missing event tables are empty; labels and meta are read", () => {
    const trace = toTrace(tables());
    expect(trace.events.some((e) => e.kind === "queue_move")).toBe(false);
    expect(trace.labels.get("skus:100")).toBe("bolt");
    expect([trace.startUnixMs, trace.endMs]).toEqual([1000, 60_000]);
  });

  it("fails loudly on a missing static table or a non-integer id", () => {
    expect(() => toTrace({ ...tables(), edges: undefined })).toThrow(
      "missing table edges",
    );
    expect(() =>
      toTrace({ ...tables(), queues: { queue_id: [1.5], site_id: [1] } }),
    ).toThrow("queues.queue_id[0]");
  });
});
