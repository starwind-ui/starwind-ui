import { describe, expect, it } from "vitest";

import {
  buildRuntimePerformanceCandidateCeiling,
  coefficientOfVariation,
  eligibleP95,
  evaluateRuntimePerformanceStability,
  maximum,
  median,
  medianAbsoluteDeviation,
  minimum,
  spread,
  summarizeRuntimePerformanceSamples,
} from "../runtime-performance/statistics.mjs";

describe("runtime performance statistics", () => {
  it("calculates median without mutating raw values", () => {
    const odd = [9, 1, 5];
    const even = [8, 2, 6, 4];
    expect(median(odd)).toBe(5);
    expect(median(even)).toBe(5);
    expect(odd).toEqual([9, 1, 5]);
    expect(even).toEqual([8, 2, 6, 4]);
  });

  it("emits nearest-rank p95 only at twenty samples", () => {
    expect(eligibleP95(Array.from({ length: 19 }, (_, index) => index + 1))).toBeNull();
    expect(eligibleP95(Array.from({ length: 20 }, (_, index) => index + 1))).toBe(19);
    expect(eligibleP95(Array.from({ length: 21 }, (_, index) => index + 1))).toBe(20);
  });

  it("retains raw sample order in within-run summaries", () => {
    expect(summarizeRuntimePerformanceSamples([3, 1, 2])).toEqual({
      medianMs: 2,
      p95Ms: null,
      samples: [3, 1, 2],
    });
  });

  it("calculates cross-run range, MAD, and population CV", () => {
    const values = [15, 10, 11, 10, 14];
    expect(minimum(values)).toBe(10);
    expect(maximum(values)).toBe(15);
    expect(spread(values)).toBe(5);
    expect(medianAbsoluteDeviation(values)).toBe(1);
    expect(coefficientOfVariation(values)).toBeCloseTo(Math.sqrt(4.4) / 12, 12);
  });

  it("reports CV as unavailable for a zero mean", () => {
    expect(coefficientOfVariation([0, 0, 0, 0, 0])).toBeNull();
    expect(evaluateRuntimePerformanceStability([0, 0, 0, 0, 0])).toMatchObject({
      coefficientOfVariation: null,
      stable: true,
    });
  });

  it("accepts the spread boundary and rejects values beyond either stability limit", () => {
    expect(evaluateRuntimePerformanceStability([10, 10, 10, 10, 15])).toMatchObject({
      medianMs: 10,
      spreadLimitMs: 5,
      spreadMs: 5,
      stable: true,
    });
    expect(evaluateRuntimePerformanceStability([10, 10, 10, 10, 15.1]).stable).toBe(false);
    expect(evaluateRuntimePerformanceStability([0, 0, 0, 0, 5])).toMatchObject({
      coefficientOfVariation: 2,
      stable: false,
    });
    expect(() => evaluateRuntimePerformanceStability([1, 1, 1, 1])).toThrow(/exactly five/);
  });

  it("derives the non-blocking ceiling from the maximum and largest headroom", () => {
    expect(buildRuntimePerformanceCandidateCeiling([10, 10, 10, 10, 15])).toEqual({
      ceilingMs: 20,
      headroomMs: 5,
      madMs: 0,
      maximumMs: 15,
    });
    expect(() => buildRuntimePerformanceCandidateCeiling([0, 0, 0, 0, 5])).toThrow(
      /unstable evidence/,
    );
    expect(() =>
      buildRuntimePerformanceCandidateCeiling({ stable: true, maximumMs: 15, madMs: 0 }),
    ).toThrow(/five raw run medians/);
  });

  it("rejects missing and invalid timing samples", () => {
    expect(() => median([])).toThrow(/nonempty array/);
    expect(() => median([1, Number.NaN])).toThrow(/finite nonnegative/);
    expect(() => spread([1, -1])).toThrow(/finite nonnegative/);
  });
});
