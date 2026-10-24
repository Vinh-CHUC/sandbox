import { describe, expect, it } from "vitest";
import { skuColor, VEHICLE_RAMP, vehicleColor } from "./palette";

describe("vehicleColor", () => {
  it("cycles through the teal steps by id", () => {
    expect([0, 1, 2, 3, 4].map(vehicleColor)).toEqual([
      ...VEHICLE_RAMP,
      VEHICLE_RAMP[0],
    ]);
  });
});

describe("skuColor", () => {
  it("spreads SKUs dark to light along the amber ramp", () => {
    expect(skuColor(0, 5)).toBe(0x7a4a0c);
    expect(skuColor(4, 5)).toBe(0xf3cc85);
    const lightness = (c: number) =>
      ((c >> 16) & 0xff) + ((c >> 8) & 0xff) + (c & 0xff);
    const steps = [0, 1, 2, 3, 4].map((i) => lightness(skuColor(i, 5)));
    expect(steps).toEqual([...steps].sort((a, b) => a - b)); // strictly lighter each step
  });

  it("a single SKU gets the darkest", () => {
    expect(skuColor(0, 1)).toBe(0x7a4a0c);
  });
});
