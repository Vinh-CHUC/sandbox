import type { Ms } from "./common";

/** Playback speeds, slowest first; `1` is real time */
export const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

/**
 * Simulated time, fed with real frame durations. Everything downstream is a pure function of
 * `now`, so pausing or rescaling this one clock freezes or speeds up the whole world at once.
 *
 *   clock.advance(16)  # 16    at 1×
 *   clock.faster(); clock.advance(16)  # 48    at 2×: 16 + 32
 *   clock.togglePause(); clock.advance(16)  # 48    paused: no change
 */
export class SimClock {
  private _now: Ms = 0;
  private speedIndex: number = SPEEDS.indexOf(1);
  private _paused = false;

  public get now(): Ms {
    return this._now;
  }

  public get speed(): number {
    return SPEEDS[this.speedIndex];
  }

  public get paused(): boolean {
    return this._paused;
  }

  /** Move simulated time on by `realDtMs` of real time, scaled by the speed; returns the new `now` */
  public advance(realDtMs: Ms): Ms {
    if (!this._paused) this._now += realDtMs * this.speed;
    return this._now;
  }

  public togglePause(): void {
    this._paused = !this._paused;
  }

  /** Next speed up, staying at the fastest */
  public faster(): void {
    this.speedIndex = Math.min(this.speedIndex + 1, SPEEDS.length - 1);
  }

  /** Next speed down, staying at the slowest */
  public slower(): void {
    this.speedIndex = Math.max(this.speedIndex - 1, 0);
  }
}
