import type { SkuId } from "../shared/common";

/** Stock levels of the SKUs an inventory carries. Passive: a trace sets them. */
export class Inventory {
  private readonly stock: Map<SkuId, number>;

  constructor(skus: readonly SkuId[]) {
    this.stock = new Map(skus.map((sku) => [sku, 0]));
  }

  /** The SKUs carried, in stack order */
  public get skus(): readonly SkuId[] {
    return [...this.stock.keys()];
  }

  public count(sku: SkuId): number {
    return this.stock.get(sku) ?? 0;
  }

  /** New level for `sku`; throws for a SKU this inventory doesn't carry */
  public set(sku: SkuId, count: number): void {
    if (!this.stock.has(sku))
      throw new RangeError(`set: inventory doesn't carry sku ${sku}`);
    this.stock.set(sku, count);
  }
}
