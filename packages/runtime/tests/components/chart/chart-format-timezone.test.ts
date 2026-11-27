import { afterAll, describe, expect, it } from "vitest";

import {
  type ChartFormat,
  formatChartValue,
  prerenderChart,
  resolveTickFormatter,
} from "../../../src/components/chart";

// A zone west of UTC, set before any date work, so a local-time formatter would show March 31.
const zone = process.env.TZ;
process.env.TZ = "America/Los_Angeles";

describe("chart date format outside UTC", () => {
  afterAll(() => {
    if (zone === undefined) delete process.env.TZ;
    else process.env.TZ = zone;
  });

  it("formats date-only strings on their day, as the server does", () => {
    expect(new Date("2024-04-01").getTimezoneOffset()).not.toBe(0);
    expect(formatChartValue("2024-04-01", { date: { month: "short", day: "numeric" } })).toBe(
      "Apr 1",
    );
    expect(resolveTickFormatter({ date: { month: "short", day: "numeric" } })!("2024-04-01")).toBe(
      "Apr 1",
    );
    // A date and time with no offset reads as UTC too.
    expect(
      formatChartValue("2026-11-25T00:30:00", { date: { month: "short", day: "numeric" } }),
    ).toBe("Nov 25");
    // A space between the date and the time reads as UTC too.
    expect(
      formatChartValue("2026-11-25 20:00:00", { date: { month: "short", day: "numeric" } }),
    ).toBe("Nov 25");
    // A named zone still wins.
    expect(
      formatChartValue("2024-04-01", {
        date: { month: "short", day: "numeric", timeZone: "America/Los_Angeles" },
      }),
    ).toBe("Mar 31");
  });

  it("draws Date categories with the same tick text as their ISO strings", () => {
    const days = ["2024-04-01T00:00:00.000Z", "2024-04-02T00:00:00.000Z"];
    const config = { desktop: { label: "Desktop", color: "red" } };
    const ticks = (data: unknown[], tickFormatter?: ChartFormat) => {
      const markup = prerenderChart(
        undefined,
        {
          data,
          config,
          spec: {
            parts: [
              { kind: "xAxis", dataKey: "day", ...(tickFormatter ? { tickFormatter } : {}) },
              { kind: "bar", dataKey: "desktop" },
            ],
          },
        },
        { id: "chart-dates" },
      ).markup;
      return [...markup.matchAll(/>([^<>]+)<\/text>/g)].map((match) => match[1]);
    };
    const withDates = days.map((day, index) => ({ day: new Date(day), desktop: index + 1 }));
    const withStrings = days.map((day, index) => ({ day, desktop: index + 1 }));
    for (const format of [undefined, { maxLength: 10 }])
      expect(ticks(withDates, format)).toEqual(ticks(withStrings, format));
  });
});
