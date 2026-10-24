import type { PartId, PartRequest } from "../shared/common";

/** Stacks of parts, each holding at most `capacity` */
export class Inventory {
  private readonly stock: Map<PartId, number>;

  constructor(
    parts: readonly PartId[],
    private readonly capacity: number,
  ) {
    this.stock = new Map(parts.map((part) => [part, capacity]));
  }

  public get parts(): readonly PartId[] {
    return [...this.stock.keys()];
  }

  public count(part: PartId): number {
    return this.stock.get(part) ?? 0;
  }

  public canSupply(request: PartRequest): boolean {
    return request.every(({ part, count }) => this.count(part) >= count);
  }

  /** Remove everything in `request` at once; throws (taking nothing) if any stack is short */
  public take(request: PartRequest): void {
    if (!this.canSupply(request))
      throw new RangeError(
        `take: not enough stock for ${JSON.stringify(request)}`,
      );
    for (const { part, count } of request)
      this.stock.set(part, this.count(part) - count);
  }

  /** One more `part`, up to `capacity`; unknown parts are ignored */
  public restock(part: PartId): void {
    if (!this.stock.has(part)) return;
    this.stock.set(part, Math.min(this.count(part) + 1, this.capacity));
  }
}
