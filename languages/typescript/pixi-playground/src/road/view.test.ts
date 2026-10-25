import { describe, expect, it } from "vitest";
import { roadTooltip, shipmentTooltip } from "./view";

describe("tooltips", () => {
  it("a shipment: what, from where to where, how long to go", () => {
    expect(
      shipmentTooltip(
        "Transmission",
        6,
        "Stores, Site A",
        "Stores, Site B",
        720_000,
      ),
    ).toBe("Transmission ×6\nStores, Site A → Stores, Site B\n12 min to go");
  });

  it("a road: its length (and the drawn one when they differ), what's on it, what it carried", () => {
    const delivered = { shipments: 5, units: 30 };
    expect(roadTooltip("Road 1", 30, 34, [6, 4], delivered)).toBe(
      "Road 1 · 30 cells (drawn: 34)\n2 shipments on the way (10 units)\n5 delivered (30 units)",
    );
    expect(roadTooltip("Road 1", 30, 30.2, [], delivered).split("\n")[0]).toBe(
      "Road 1 · 30 cells",
    );
  });
});
