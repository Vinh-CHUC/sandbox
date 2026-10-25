import type { Ms, SimMs } from "../shared/common";

/**
 * Quantities (items finished, parts consumed, …) over a sliding window, per minute. Records older
 * than `retainMs` are dropped, so any window up to that long can be asked for. The window can't
 * reach back before the first observation (a `record` or `perMinute` call), so the first minute
 * doesn't read too low.
 *
 *   t = new Throughput(300_000)
 *   t.perMinute(0, 60_000)       # 0     first observation: nothing yet
 *   t.record(10_000); t.record(20_000, 3)
 *   t.perMinute(30_000, 60_000)  # 8.0   4 in the 30 s seen so far
 */
export class Throughput {
  private readonly records: { readonly at: SimMs; readonly count: number }[] =
    [];
  private start: SimMs | null = null;

  constructor(private readonly retainMs: Ms) {}

  /** `count` more at `at` */
  public record(at: SimMs, count = 1): void {
    this.start ??= at;
    this.records.push({ at, count });
    while (this.records.length > 0 && this.records[0].at <= at - this.retainMs)
      this.records.shift();
  }

  /** Items per minute over the last `windowMs` (capped at `retainMs`), as of `now` */
  public perMinute(now: SimMs, windowMs: Ms): number {
    this.start ??= now;
    const span = Math.min(windowMs, this.retainMs, now - this.start);
    if (span <= 0) return 0;
    const from = now - span;
    // While warming up the window starts at the first observation, which itself counts
    const warmingUp = from === this.start;
    const count = this.records
      .filter(({ at }) => (warmingUp ? at >= from : at > from) && at <= now)
      .reduce((total, r) => total + r.count, 0);
    return (count / span) * 60_000;
  }
}

/** Rate units, finest first, with how many minutes each spans */
const RATE_UNITS = [
  ["min", 1],
  ["h", 60],
  ["day", 24 * 60],
] as const;

/**
 * A rate for a label, in the finest unit where it's at least 1, so slow flows don't read as 0.
 *
 *   formatRate(4.2)    # "4.2 / min"
 *   formatRate(0.025)  # "1.5 / h"
 *   formatRate(0.001)  # "1.4 / day"
 *   formatRate(0)      # "0"
 */
export const formatRate = (perMinute: number): string => {
  if (perMinute <= 0) return "0";
  const [unit, minutes] =
    RATE_UNITS.find(([, m]) => perMinute * m >= 1) ??
    RATE_UNITS[RATE_UNITS.length - 1];
  return `${(perMinute * minutes).toFixed(1)} / ${unit}`;
};
