import { describe, expect, it } from "vitest";
import { storeTooltip } from "./view";

describe("storeTooltip", () => {
  it("names the stack when it can", () => {
    expect(storeTooltip("Dispatch", "Model A", 12)).toBe(
      "Dispatch\nModel A: 12",
    );
    expect(storeTooltip("Dispatch", "", 12)).toBe("Dispatch\n12");
  });
});
