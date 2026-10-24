import { asyncBufferFromFile } from "hyparquet";
import { describe, expect, it } from "vitest";
import { loadTrace } from "./load";

// A small trace written by `data/` (python -m flowtrace.generate --hours 1 --sites 1 --seed 3)
const fixture = new URL("./fixture", import.meta.url).pathname;

describe("loadTrace", () => {
  it("reads a trace written by data/, end to end", async () => {
    const trace = await loadTrace((table) =>
      asyncBufferFromFile(`${fixture}/${table}.parquet`),
    );
    expect(trace.topology.sites).toEqual([1]);
    expect(trace.topology.stations).toHaveLength(5);
    expect(trace.events.length).toBeGreaterThan(0);
    // One total order across every table
    const seqs = trace.events.map((e) => e.seq);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
    expect(trace.labels.get("sites:1")).toBe("Site A");
    expect(trace.endMs).toBe(60 * 60_000);
  });
});
