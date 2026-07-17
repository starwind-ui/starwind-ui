import { describe, expect, it } from "vitest";

import { evaluatePackageSizeBudgets } from "../package-size-budget-checks.mjs";

describe("package size budget checks", () => {
  it("passes current-shaped absolute gates while reporting the real Zag advisory", () => {
    const result = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      supportResults: passingSupportResults(),
    });

    expect(result.failures).toEqual([]);
    expect(result.advisories).toContain(
      "Starwind/Zag overlap comparison against Zag React advisory: Starwind 118,786 B (116.0 KiB) is not below Zag React 112,282 B (109.7 KiB).",
    );
    expect(result.headlineChecks.every((check) => check.status === "Pass")).toBe(true);
    expect(result.headlineChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "@starwind-ui/runtime", maxGzipBytes: 127_943 }),
        expect.objectContaining({
          label: "@starwind-ui/react (adapter only)",
          maxGzipBytes: 35_820,
        }),
        expect.objectContaining({
          label: "@starwind-ui/react + runtime",
          maxGzipBytes: 166_940,
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
    expect(
      result.matchedSupportChecks.find(
        (check) => check.label === "Starwind/Zag overlap vs Zag React",
      ),
    ).toEqual(
      expect.objectContaining({
        maxStarwindGzipBytes: 120_020,
        comparatorGzipBytes: 112_282,
        comparisonStatus: "Above comparator",
        starwindGzipBytes: 118_786,
        status: "Pass",
      }),
    );
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
      "Starwind/Zag overlap comparison against Zag React advisory: Starwind 112,640 B (110.0 KiB) is not below Zag React 111,616 B (109.0 KiB).",
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

  it("passes each headline ceiling exactly and fails one byte above it", () => {
    const atCeiling = evaluatePackageSizeBudgets({
      bundleResults: [
        { label: "@starwind-ui/runtime", gzipBytes: 127_943 },
        { label: "@starwind-ui/react (adapter only)", gzipBytes: 35_820 },
        { label: "@starwind-ui/react + runtime", gzipBytes: 166_940 },
      ],
      supportResults: passingSupportResults(),
    });
    const oneByteAbove = evaluatePackageSizeBudgets({
      bundleResults: [
        { label: "@starwind-ui/runtime", gzipBytes: 127_944 },
        { label: "@starwind-ui/react (adapter only)", gzipBytes: 35_821 },
        { label: "@starwind-ui/react + runtime", gzipBytes: 166_941 },
      ],
      supportResults: passingSupportResults(),
    });

    expect(atCeiling.headlineChecks.every((check) => check.status === "Pass")).toBe(true);
    expect(oneByteAbove.failures).toEqual(
      expect.arrayContaining([
        "@starwind-ui/runtime exceeded headline package budget: 127,944 B (124.9 KiB) > 127,943 B (124.9 KiB).",
        "@starwind-ui/react (adapter only) exceeded headline package budget: 35,821 B (35.0 KiB) > 35,820 B (35.0 KiB).",
        "@starwind-ui/react + runtime exceeded headline package budget: 166,941 B (163.0 KiB) > 166,940 B (163.0 KiB).",
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
      "All-three overlap set-wide Starwind matched-support budget exceeded: Starwind 108,544 B (106.0 KiB) > budget 107,520 B (105.0 KiB). Affected budget rows: All-three overlap vs Zag React, All-three overlap vs Base UI.",
    );
    expect(
      result.matchedSupportChecks
        .filter((check) => check.label.startsWith("All-three overlap"))
        .every((check) => check.status === "Fail"),
    ).toBe(true);
  });

  it("passes the Starwind/Zag overlap ceiling exactly and fails one byte above it", () => {
    const supportResults = [
      supportRow("all-three-overlap", "starwind", 94 * 1024),
      supportRow("all-three-overlap", "zag", 97 * 1024),
      supportRow("all-three-overlap", "base", 139 * 1024),
      supportRow("starwind-zag-overlap", "starwind", 120_020),
      supportRow("starwind-zag-overlap", "zag", 112_282),
      supportRow("starwind-base-overlap", "starwind", 102 * 1024),
      supportRow("starwind-base-overlap", "base", 143 * 1024),
      fieldSupportRow(20 * 1024),
    ];
    const atCeiling = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      supportResults,
    });
    const oneByteAbove = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      supportResults: supportResults.map((row) =>
        row.comparisonSet === "starwind-zag-overlap" && row.provider === "starwind"
          ? { ...row, gzipBytes: 120_021 }
          : row,
      ),
    });

    expect(
      atCeiling.matchedSupportChecks.find(
        (check) => check.label === "Starwind/Zag overlap vs Zag React",
      ),
    ).toEqual(expect.objectContaining({ maxStarwindGzipBytes: 120_020, status: "Pass" }));
    expect(oneByteAbove.failures).toContain(
      "Starwind/Zag overlap set-wide Starwind matched-support budget exceeded: Starwind 120,021 B (117.2 KiB) > budget 120,020 B (117.2 KiB). Affected budget rows: Starwind/Zag overlap vs Zag React.",
    );
    expect(
      oneByteAbove.matchedSupportChecks.find(
        (check) => check.label === "Starwind/Zag overlap vs Zag React",
      ),
    ).toEqual(expect.objectContaining({ maxStarwindGzipBytes: 120_020, status: "Fail" }));
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
      "Field cold import budget exceeded: Field cold import 45,670 B (44.6 KiB) > budget 22,528 B (22.0 KiB).",
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
    { label: "@starwind-ui/runtime", gzipBytes: 126_295 },
    { label: "@starwind-ui/react (adapter only)", gzipBytes: 35_194 },
    { label: "@starwind-ui/react + runtime", gzipBytes: 164_250 },
  ];
}

function passingSupportResults({ fieldGzipBytes = 20 * 1024, includeField = true } = {}) {
  const rows = [
    supportRow("all-three-overlap", "starwind", 94 * 1024),
    supportRow("all-three-overlap", "zag", 97 * 1024),
    supportRow("all-three-overlap", "base", 139 * 1024),
    supportRow("starwind-zag-overlap", "starwind", 118_786),
    supportRow("starwind-zag-overlap", "zag", 112_282),
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
