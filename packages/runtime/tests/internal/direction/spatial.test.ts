import { describe, expect, it } from "vitest";

import { spatialDelta, spatialRatio } from "../../../src/internal/direction";

describe("spatial direction helpers", () => {
  it("mirrors horizontal displacement and ratio in RTL", () => {
    expect(spatialDelta(12, "rtl", "horizontal")).toBe(-12);
    expect(spatialDelta(-12, "rtl", "horizontal")).toBe(12);
    expect(spatialRatio(0.2, "rtl", "horizontal")).toBeCloseTo(0.8);
    expect(spatialRatio(spatialRatio(0.2, "rtl", "horizontal"), "rtl", "horizontal")).toBeCloseTo(
      0.2,
    );
  });

  it("keeps LTR and vertical positions physical", () => {
    expect(spatialDelta(12, "ltr", "horizontal")).toBe(12);
    expect(spatialDelta(12, "rtl", "vertical")).toBe(12);
    expect(spatialRatio(0.2, "ltr", "horizontal")).toBe(0.2);
    expect(spatialRatio(0.2, "rtl", "vertical")).toBe(0.2);
  });
});
