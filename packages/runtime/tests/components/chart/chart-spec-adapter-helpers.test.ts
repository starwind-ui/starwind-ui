import { afterEach, describe, expect, it, vi } from "vitest";

import { isSameChartSpec, warnEmptyChart } from "../../../src/components/chart/spec";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("chart spec adapter helpers", () => {
  it("compares specs by part order, props and format objects", () => {
    const format = (value: string) => value.slice(0, 3);
    const spec = {
      parts: [
        { kind: "xAxis" as const, dataKey: "month", tickFormatter: { maxLength: 3 } },
        { kind: "bar" as const, dataKey: "desktop", radius: 4 },
      ],
    };
    expect(isSameChartSpec(spec, structuredClone(spec))).toBe(true);
    expect(isSameChartSpec(undefined, undefined)).toBe(true);
    expect(isSameChartSpec(spec, undefined)).toBe(false);
    expect(isSameChartSpec(spec, { parts: [...spec.parts].reverse() })).toBe(false);
    expect(
      isSameChartSpec(spec, {
        parts: [spec.parts[0]!, { kind: "bar", dataKey: "desktop", radius: 0 }],
      }),
    ).toBe(false);
    // Functions compare by identity.
    const withFunction = {
      parts: [{ kind: "xAxis" as const, dataKey: "month", tickFormatter: format }],
    };
    expect(isSameChartSpec(withFunction, { parts: [{ ...withFunction.parts[0]! }] })).toBe(true);
    expect(
      isSameChartSpec(withFunction, {
        parts: [{ ...withFunction.parts[0]!, tickFormatter: (value: string) => value }],
      }),
    ).toBe(false);
  });

  it("warns once per chart id in development", () => {
    vi.stubEnv("DEV", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnEmptyChart("empty-helper");
    warnEmptyChart("empty-helper");
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]![0]).toContain('"empty-helper" renders nothing');
  });
});
