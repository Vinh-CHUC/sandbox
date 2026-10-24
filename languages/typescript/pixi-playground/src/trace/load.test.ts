import { asyncBufferFromFile } from "hyparquet";
import { describe, expect, it } from "vitest";
import { loadTrace } from "./load";

// A small trace written by `data/` (python -m flowtrace.generate --hours 1 --sites 1 --seed 2)
const fixture = new URL("./fixture", import.meta.url).pathname;

describe("loadTrace", () => {
  it("reads a trace written by data/, end to end", async () => {
    // Like `openUrl`: a table that isn't there is absent (only optional ones may be)
    const trace = await loadTrace((table) =>
      asyncBufferFromFile(`${fixture}/${table}.parquet`).catch(() => null),
    );
    expect(trace.topology.sites).toEqual([1]);
    expect(trace.topology.stations).toHaveLength(5);
    expect(trace.events.length).toBeGreaterThan(0);
    // One total order across every table
    const seqs = trace.events.map((e) => e.seq);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
    expect(trace.labels.size).toBe(0); // names live in labels.json, not in the trace
    expect(trace.events.some((e) => e.kind === "item_status")).toBe(true);
    expect(trace.topology.itemTypes).toEqual([1, 2, 3, 4]);
    expect(trace.topology.itemType.size).toBeGreaterThan(0);
    expect(trace.endMs).toBe(60 * 60_000);
  });
});
