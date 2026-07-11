import { describe, expect, it } from "vitest";

import { evaluatePackageSizeBudgets } from "../package-size-budget-checks.mjs";

describe("package size budget checks", () => {
  it("passes current-shaped headline and matched-support measurements", () => {
    const result = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      supportResults: passingSupportResults(),
    });

    expect(result.failures).toEqual([]);
    expect(result.advisories).toEqual([]);
    expect(result.headlineChecks.every((check) => check.status === "Pass")).toBe(true);
    expect(result.headlineChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "@starwind-ui/runtime", maxGzipBytes: 112 * 1024 }),
        expect.objectContaining({
          label: "@starwind-ui/react (adapter only)",
          maxGzipBytes: 31 * 1024,
        }),
      ]),
    );
    expect(result.fieldColdImportChecks).toEqual([
      expect.objectContaining({
        gzipBytes: 20 * 1024,
        label: "Field cold import",
        maxGzipBytes: 22 * 1024,
        status: "Pass",
      }),
    ]);
    expect(result.matchedSupportChecks.every((check) => check.status === "Pass")).toBe(true);
  });

  it("reports missing budgeted headline and comparator measurements clearly", () => {
    const result = evaluatePackageSizeBudgets({
      bundleResults: [
        { label: "@starwind-ui/runtime", gzipBytes: null },
        { label: "@starwind-ui/react (adapter only)", gzipBytes: 26 * 1024 },
        { label: "@starwind-ui/react + runtime", gzipBytes: 133 * 1024 },
      ],
      supportResults: [
        supportRow("all-three-overlap", "starwind", 94 * 1024),
        supportRow("all-three-overlap", "zag", null),
        supportRow("all-three-overlap", "base", 139 * 1024),
        supportRow("starwind-zag-overlap", "starwind", 106 * 1024),
        supportRow("starwind-zag-overlap", "zag", 109 * 1024),
        supportRow("starwind-base-overlap", "starwind", 102 * 1024),
        supportRow("starwind-base-overlap", "base", 143 * 1024),
        fieldSupportRow(20 * 1024),
      ],
    });

    expect(result.failures.join("\n")).toContain(
      "@starwind-ui/runtime headline package budget could not be evaluated: missing min+gzip measurement.",
    );
    expect(result.advisories.join("\n")).toContain(
      "All-three overlap comparison against Zag React could not be evaluated: missing Zag React min+gzip measurement.",
    );
  });

  it("reports matched-support comparisons as advisories without failing the absolute gate", () => {
    const result = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      supportResults: [
        supportRow("all-three-overlap", "starwind", 94 * 1024),
        supportRow("all-three-overlap", "zag", 97 * 1024),
        supportRow("all-three-overlap", "base", 139 * 1024),
        supportRow("starwind-zag-overlap", "starwind", 110 * 1024),
        supportRow("starwind-zag-overlap", "zag", 109 * 1024),
        supportRow("starwind-base-overlap", "starwind", 102 * 1024),
        supportRow("starwind-base-overlap", "base", 143 * 1024),
        fieldSupportRow(20 * 1024),
      ],
    });

    expect(result.failures).toEqual([]);
    expect(result.advisories).toContain(
      "Starwind/Zag overlap comparison against Zag React advisory: Starwind 110.0 KiB is not below Zag React 109.0 KiB.",
    );
    expect(
      result.matchedSupportChecks.find(
        (check) => check.label === "Starwind/Zag overlap vs Zag React",
      ),
    ).toEqual(
      expect.objectContaining({
        comparisonStatus: "Above comparator",
        status: "Pass",
      }),
    );
  });

  it("fails measurements above the rebased headline ceilings", () => {
    const result = evaluatePackageSizeBudgets({
      bundleResults: [
        { label: "@starwind-ui/runtime", gzipBytes: 112.1 * 1024 },
        { label: "@starwind-ui/react (adapter only)", gzipBytes: 31.1 * 1024 },
        { label: "@starwind-ui/react + runtime", gzipBytes: 133 * 1024 },
      ],
      supportResults: passingSupportResults(),
    });

    expect(result.failures).toEqual(
      expect.arrayContaining([
        "@starwind-ui/runtime exceeded headline package budget: 112.1 KiB > 112.0 KiB.",
        "@starwind-ui/react (adapter only) exceeded headline package budget: 31.1 KiB > 31.0 KiB.",
      ]),
    );
  });

  it("reports set-wide matched-support budget failures with affected rows", () => {
    const result = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      supportResults: [
        supportRow("all-three-overlap", "starwind", 106 * 1024),
        supportRow("all-three-overlap", "zag", 120 * 1024),
        supportRow("all-three-overlap", "base", 140 * 1024),
        supportRow("starwind-zag-overlap", "starwind", 106 * 1024),
        supportRow("starwind-zag-overlap", "zag", 109 * 1024),
        supportRow("starwind-base-overlap", "starwind", 102 * 1024),
        supportRow("starwind-base-overlap", "base", 143 * 1024),
        fieldSupportRow(20 * 1024),
      ],
    });

    expect(result.failures.join("\n")).toContain(
      "All-three overlap set-wide Starwind matched-support budget exceeded: Starwind 106.0 KiB > budget 105.0 KiB. Affected budget rows: All-three overlap vs Zag React, All-three overlap vs Base UI.",
    );
    expect(
      result.matchedSupportChecks
        .filter((check) => check.label.startsWith("All-three overlap"))
        .every((check) => check.status === "Fail"),
    ).toBe(true);
  });

  it("reports Field cold import budget failures with measured values", () => {
    const result = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      supportResults: [...passingSupportResults({ fieldGzipBytes: 44.6 * 1024 })],
    });

    expect(result.fieldColdImportChecks).toEqual([
      expect.objectContaining({
        gzipBytes: 44.6 * 1024,
        label: "Field cold import",
        status: "Fail",
      }),
    ]);
    expect(result.failures).toContain(
      "Field cold import budget exceeded: Field cold import 44.6 KiB > budget 22.0 KiB.",
    );
  });

  it("reports missing Field cold import measurements clearly", () => {
    const result = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      supportResults: passingSupportResults({ includeField: false }),
    });

    expect(result.fieldColdImportChecks).toEqual([
      expect.objectContaining({
        gzipBytes: null,
        label: "Field cold import",
        status: "Fail",
      }),
    ]);
    expect(result.failures).toContain(
      "Field cold import budget could not be evaluated: missing Field cold import min+gzip measurement.",
    );
  });
});

function passingBundleResults() {
  return [
    { label: "@starwind-ui/runtime", gzipBytes: 111 * 1024 },
    { label: "@starwind-ui/react (adapter only)", gzipBytes: 30.5 * 1024 },
    { label: "@starwind-ui/react + runtime", gzipBytes: 133 * 1024 },
  ];
}

function passingSupportResults({ fieldGzipBytes = 20 * 1024, includeField = true } = {}) {
  const rows = [
    supportRow("all-three-overlap", "starwind", 94 * 1024),
    supportRow("all-three-overlap", "zag", 97 * 1024),
    supportRow("all-three-overlap", "base", 139 * 1024),
    supportRow("starwind-zag-overlap", "starwind", 106 * 1024),
    supportRow("starwind-zag-overlap", "zag", 109 * 1024),
    supportRow("starwind-base-overlap", "starwind", 102 * 1024),
    supportRow("starwind-base-overlap", "base", 143 * 1024),
  ];

  if (includeField) {
    rows.push(fieldSupportRow(fieldGzipBytes));
  }

  return rows;
}

function supportRow(comparisonSet, provider, gzipBytes) {
  return { comparisonSet, gzipBytes, provider };
}

function fieldSupportRow(gzipBytes) {
  return { component: "field", gzipBytes, provider: "starwind" };
}
