import { describe, expect, it } from "vitest";
import { stackTooltip } from "./view";

describe("stackTooltip", () => {
  it("the inventory, the SKU, its stock and how fast it's used", () => {
    expect(stackTooltip("Assembly stock", "bolt", 3, "1.5 / h")).toBe(
      "Assembly stock\nbolt\n3 in stock · 1.5 / h used",
    );
  });

  it("drops an unnamed inventory's line", () => {
    expect(stackTooltip("", "bolt", 0, "0")).toBe("bolt\n0 in stock · 0 used");
  });
});
