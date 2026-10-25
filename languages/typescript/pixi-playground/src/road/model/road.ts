import type { Fraction, Ms, SimMs, SkuId } from "../../shared/common";

/** A road's two ends: "a" and "b", as in the trace's `roads` table */
export type End = "a" | "b";

/** One stack of stock on its way: it takes one cell of the road */
export type Shipment = {
  readonly id: number;
  readonly sku: SkuId;
  readonly count: number;
  /** the end it set off from: it heads for the other */
  readonly from: End;
  readonly departed: SimMs;
  /** grid cells per simulated minute */
  readonly speed: number;
};

const MIN: Ms = 60_000;

/**
 * The shipments on a two-way road `length` cells long. Passive, like `Inventory`: a trace puts
 * them on (the source inventory's stock drops alongside) and takes them off.
 */
export class Road {
  private readonly onRoad = new Map<number, Shipment>();
  private _delivered = { shipments: 0, units: 0 };

  constructor(public readonly length: number) {}

  /** On the road now, in the order they set off */
  public get shipments(): readonly Shipment[] {
    return [...this.onRoad.values()];
  }

  /** Shipments that made it to the other end so far, and how many units they carried */
  public get delivered(): {
    readonly shipments: number;
    readonly units: number;
  } {
    return this._delivered;
  }

  public enter(s: Shipment): void {
    if (this.onRoad.has(s.id))
      throw new RangeError(`enter: shipment ${s.id} is already on the road`);
    this.onRoad.set(s.id, s);
  }

  /** Off at the other end; throws for a shipment that isn't on the road */
  public leave(id: number): Shipment {
    const s = this.onRoad.get(id);
    if (s === undefined)
      throw new RangeError(`leave: shipment ${id} isn't on the road`);
    this.onRoad.delete(id);
    this._delivered = {
      shipments: this._delivered.shipments + 1,
      units: this._delivered.units + s.count,
    };
    return s;
  }

  /**
   * How far along `s` is at simulated `now`, from its own end: constant speed, held at 1 (the far
   * end) should it get there before the trace takes it off
   *
   *   road.progress({ departed: 0, speed: 1, … }, 15 min)  # 0.5, on a 30-cell road
   */
  public progress(s: Shipment, now: SimMs): Fraction {
    const cells = ((now - s.departed) / MIN) * s.speed;
    return Math.min(1, Math.max(0, cells / this.length));
  }

  /** Simulated time until `s` gets to the far end, at its speed */
  public remaining(s: Shipment, now: SimMs): Ms {
    return Math.max(0, (this.length / s.speed) * MIN - (now - s.departed));
  }
}
