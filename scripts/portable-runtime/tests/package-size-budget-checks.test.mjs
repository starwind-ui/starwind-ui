import { describe, expect, it } from "vitest";

import { evaluatePackageSizeBudgets } from "../package-size-budget-checks.mjs";

describe("package size budget checks", () => {
  it("allows normal aggregate feature growth while reporting the real Zag advisory", () => {
    const result = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      supportResults: passingSupportResults(),
    });

    expect(result.failures).toEqual([]);
    expect(result.advisories).toContain(
      "Starwind/Zag overlap comparison against Zag React advisory: Starwind 121,678 B (118.8 KiB) is not below Zag React 112,282 B (109.7 KiB).",
    );
    expect(result.headlineChecks.every((check) => check.status === "Pass")).toBe(true);
    expect(result.headlineChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          baselineGzipBytes: 126_295,
          label: "@starwind-ui/runtime",
          maxGzipBytes: 138_924,
        }),
        expect.objectContaining({
          baselineGzipBytes: 35_194,
          label: "@starwind-ui/react (adapter only)",
          maxGzipBytes: 38_713,
        }),
        expect.objectContaining({
          baselineGzipBytes: 164_250,
          label: "@starwind-ui/react + runtime",
          maxGzipBytes: 179_610,
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
    expect(result.standaloneComponentChecks).toEqual([
      expect.objectContaining({
        gzipBytes: 13_300,
        label: "Color Picker cold import",
        maxGzipBytes: 24 * 1024,
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
        baselineGzipBytes: 118_786,
        maxStarwindGzipBytes: 130_664,
        comparatorGzipBytes: 112_282,
        comparisonStatus: "Above comparator",
        starwindGzipBytes: 121_678,
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
        { label: "@starwind-ui/runtime/color-picker", gzipBytes: 13 * 1024 },
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

  it("passes each aggregate headline guard exactly and fails one byte above it", () => {
    const atCeiling = evaluatePackageSizeBudgets({
      bundleResults: [
        { label: "@starwind-ui/runtime", gzipBytes: 138_924 },
        { label: "@starwind-ui/react (adapter only)", gzipBytes: 38_713 },
        { label: "@starwind-ui/react + runtime", gzipBytes: 179_610 },
        { label: "@starwind-ui/runtime/color-picker", gzipBytes: 13 * 1024 },
      ],
      supportResults: passingSupportResults(),
    });
    const oneByteAbove = evaluatePackageSizeBudgets({
      bundleResults: [
        { label: "@starwind-ui/runtime", gzipBytes: 138_925 },
        { label: "@starwind-ui/react (adapter only)", gzipBytes: 38_714 },
        { label: "@starwind-ui/react + runtime", gzipBytes: 179_611 },
        { label: "@starwind-ui/runtime/color-picker", gzipBytes: 13 * 1024 },
      ],
      supportResults: passingSupportResults(),
    });

    expect(atCeiling.headlineChecks.every((check) => check.status === "Pass")).toBe(true);
    expect(oneByteAbove.failures.join("\n")).toContain(
      "@starwind-ui/runtime exceeded aggregate regression guard",
    );
    expect(oneByteAbove.failures.join("\n")).toContain(
      "@starwind-ui/react (adapter only) exceeded aggregate regression guard",
    );
    expect(oneByteAbove.failures.join("\n")).toContain(
      "@starwind-ui/react + runtime exceeded aggregate regression guard",
    );
  });

  it("reports set-wide matched-support regression failures with affected rows", () => {
    const result = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      supportResults: [
        supportRow("all-three-overlap", "starwind", 117_955),
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
      "All-three overlap set-wide Starwind matched-support regression guard exceeded",
    );
    expect(result.failures.join("\n")).toContain(
      "Affected rows: All-three overlap vs Zag React, All-three overlap vs Base UI.",
    );
    expect(
      result.matchedSupportChecks
        .filter((check) => check.label.startsWith("All-three overlap"))
        .every((check) => check.status === "Fail"),
    ).toBe(true);
  });

  it("passes the Starwind/Zag aggregate guard exactly and fails one byte above it", () => {
    const supportResults = [
      supportRow("all-three-overlap", "starwind", 94 * 1024),
      supportRow("all-three-overlap", "zag", 97 * 1024),
      supportRow("all-three-overlap", "base", 139 * 1024),
      supportRow("starwind-zag-overlap", "starwind", 130_664),
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
          ? { ...row, gzipBytes: 130_665 }
          : row,
      ),
    });

    expect(
      atCeiling.matchedSupportChecks.find(
        (check) => check.label === "Starwind/Zag overlap vs Zag React",
      ),
    ).toEqual(expect.objectContaining({ maxStarwindGzipBytes: 130_664, status: "Pass" }));
    expect(oneByteAbove.failures.join("\n")).toContain(
      "Starwind/Zag overlap set-wide Starwind matched-support regression guard exceeded",
    );
    expect(
      oneByteAbove.matchedSupportChecks.find(
        (check) => check.label === "Starwind/Zag overlap vs Zag React",
      ),
    ).toEqual(expect.objectContaining({ maxStarwindGzipBytes: 130_664, status: "Fail" }));
  });

  it("keeps targeted Color Picker cold-import growth as a strict absolute gate", () => {
    const atCeiling = evaluatePackageSizeBudgets({
      bundleResults: [
        ...passingBundleResults().filter(
          ({ label }) => label !== "@starwind-ui/runtime/color-picker",
        ),
        { label: "@starwind-ui/runtime/color-picker", gzipBytes: 24 * 1024 },
      ],
      supportResults: passingSupportResults(),
    });
    const oneByteAbove = evaluatePackageSizeBudgets({
      bundleResults: [
        ...passingBundleResults().filter(
          ({ label }) => label !== "@starwind-ui/runtime/color-picker",
        ),
        { label: "@starwind-ui/runtime/color-picker", gzipBytes: 24 * 1024 + 1 },
      ],
      supportResults: passingSupportResults(),
    });

    expect(atCeiling.standaloneComponentChecks).toEqual([
      expect.objectContaining({ status: "Pass" }),
    ]);
    expect(oneByteAbove.failures).toContain(
      "Color Picker cold import budget exceeded: 24,577 B (24.0 KiB) > budget 24,576 B (24.0 KiB).",
    );
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
    { label: "@starwind-ui/runtime", gzipBytes: 132_532 },
    { label: "@starwind-ui/runtime/color-picker", gzipBytes: 13_300 },
    { label: "@starwind-ui/react (adapter only)", gzipBytes: 35_400 },
    { label: "@starwind-ui/react + runtime", gzipBytes: 170_778 },
  ];
}

function passingSupportResults({ fieldGzipBytes = 20 * 1024, includeField = true } = {}) {
  const rows = [
    supportRow("all-three-overlap", "starwind", 109_537),
    supportRow("all-three-overlap", "zag", 97 * 1024),
    supportRow("all-three-overlap", "base", 139 * 1024),
    supportRow("starwind-zag-overlap", "starwind", 121_678),
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
