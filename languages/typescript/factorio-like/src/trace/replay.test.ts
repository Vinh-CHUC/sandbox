import { describe, expect, it } from "vitest";
import { SimMs } from "../shared/common";
import { Replay } from "./replay";
import type { TraceEvent } from "./trace";

const end = (seq: number, t: number): TraceEvent => ({
  kind: "station_end",
  seq,
  t: SimMs(t),
  job: seq,
});

describe("Replay", () => {
  it("hands over each event once, up to `now`, in order", () => {
    const replay = new Replay([
      end(0, 0),
      end(1, 100),
      end(2, 100),
      end(3, 250),
    ]);
    const seen: number[] = [];
    const apply = (e: TraceEvent) => seen.push(e.seq);
    replay.advance(SimMs(99), apply);
    expect(seen).toEqual([0]);
    replay.advance(SimMs(100), apply);
    expect(seen).toEqual([0, 1, 2]); // t ≤ now, both at 100
    replay.advance(SimMs(100), apply);
    expect(seen).toEqual([0, 1, 2]); // nothing twice
    expect(replay.done).toBe(false);
    replay.advance(SimMs(1000), apply);
    expect(seen).toEqual([0, 1, 2, 3]);
    expect(replay.done).toBe(true);
  });
});
