import type { SimMs } from "../shared/common";
import type { TraceEvent } from "./trace";

/**
 * A cursor over a trace's events: each `advance(now)` hands over the events up to `now` that
 * haven't been handed over yet, in `seq` order. Forward only, O(new events) per call.
 *
 *   replay.advance(1000, apply)  # applies every event with t ≤ 1000
 *   replay.advance(1500, apply)  # then only those with 1000 < t ≤ 1500
 */
export class Replay {
  private next = 0;

  constructor(private readonly events: readonly TraceEvent[]) {}

  public advance(now: SimMs, apply: (event: TraceEvent) => void): void {
    const { events } = this;
    while (this.next < events.length && events[this.next].t <= now)
      apply(events[this.next++]);
  }

  /** Every event has been applied */
  public get done(): boolean {
    return this.next >= this.events.length;
  }
}
