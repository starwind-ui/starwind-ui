import { describe, expect, it } from "vitest";

import {
  aggregateBaselineProvenance,
  evaluatePackageSizeBudgets,
} from "../package-size-budget-checks.mjs";
import { vuePackageSizeBaseline } from "../vue-package-size-baseline.mjs";

describe("package size budget checks", () => {
  it("records the stable release candidate used for the aggregate rebaseline", () => {
    expect(aggregateBaselineProvenance).toEqual({
      date: "2026-08-15",
      publicCommit: "6d497055479ca56bad8463f3fc38bedc231d0174",
      release: {
        astro: "1.1.0",
        cli: "3.1.0",
        react: "1.1.0",
        runtime: "1.1.0",
      },
    });
    expect(Object.isFrozen(aggregateBaselineProvenance)).toBe(true);
    expect(Object.isFrozen(aggregateBaselineProvenance.release)).toBe(true);
  });

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
          baselineGzipBytes: 139_964,
          label: "@starwind-ui/runtime",
          maxGzipBytes: 153_960,
        }),
        expect.objectContaining({
          baselineGzipBytes: 36_486,
          label: "@starwind-ui/react (adapter only)",
          maxGzipBytes: 40_134,
        }),
        expect.objectContaining({
          baselineGzipBytes: 179_332,
          label: "@starwind-ui/react + runtime",
          maxGzipBytes: 194_692,
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
        baselineGzipBytes: 129_328,
        maxStarwindGzipBytes: 142_260,
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
        { label: "@starwind-ui/runtime", gzipBytes: 153_960 },
        { label: "@starwind-ui/react (adapter only)", gzipBytes: 40_134 },
        { label: "@starwind-ui/react + runtime", gzipBytes: 194_692 },
        { label: "@starwind-ui/runtime/color-picker", gzipBytes: 13 * 1024 },
      ],
      supportResults: passingSupportResults(),
    });
    const oneByteAbove = evaluatePackageSizeBudgets({
      bundleResults: [
        { label: "@starwind-ui/runtime", gzipBytes: 153_961 },
        { label: "@starwind-ui/react (adapter only)", gzipBytes: 40_135 },
        { label: "@starwind-ui/react + runtime", gzipBytes: 194_693 },
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
        supportRow("all-three-overlap", "starwind", 128_911),
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
      supportRow("starwind-zag-overlap", "starwind", 142_260),
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
          ? { ...row, gzipBytes: 142_261 }
          : row,
      ),
    });

    expect(
      atCeiling.matchedSupportChecks.find(
        (check) => check.label === "Starwind/Zag overlap vs Zag React",
      ),
    ).toEqual(expect.objectContaining({ maxStarwindGzipBytes: 142_260, status: "Pass" }));
    expect(oneByteAbove.failures.join("\n")).toContain(
      "Starwind/Zag overlap set-wide Starwind matched-support regression guard exceeded",
    );
    expect(
      oneByteAbove.matchedSupportChecks.find(
        (check) => check.label === "Starwind/Zag overlap vs Zag React",
      ),
    ).toEqual(expect.objectContaining({ maxStarwindGzipBytes: 142_260, status: "Fail" }));
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

  it("passes every adopted Vue absolute budget at equality and fails one byte above", () => {
    const atCeiling = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      includePrivateVue: true,
      supportResults: passingSupportResults(),
      ...privateVueBudgetResults(),
    });
    const oneByteAbove = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      includePrivateVue: true,
      supportResults: passingSupportResults(),
      ...privateVueBudgetResults({ offset: 1 }),
    });

    expect(atCeiling.vueAbsoluteChecks).toHaveLength(8);
    expect(atCeiling.vueAbsoluteChecks.every(({ status }) => status === "Pass")).toBe(true);
    expect(oneByteAbove.vueAbsoluteChecks.every(({ status }) => status === "Fail")).toBe(true);
    for (const id of Object.keys(vuePackageSizeBaseline.budgets)) {
      expect(oneByteAbove.failures.join("\n")).toContain(`${id} budget exceeded`);
    }
  });

  it("fails every missing adopted Vue measurement", () => {
    const result = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      includePrivateVue: true,
      supportResults: passingSupportResults(),
      vueBundleResults: [],
      vueColdImportResults: [],
      vueMatchedSupportResults: [],
    });

    expect(result.vueAbsoluteChecks).toHaveLength(8);
    expect(result.vueAbsoluteChecks.every(({ status }) => status === "Fail")).toBe(true);
    expect(result.failures).toHaveLength(8);
    expect(result.failures).toContain(
      "vue.packed-tarball budget could not be evaluated: missing min+gzip measurement.",
    );
  });

  it.each([
    [128_291, "Above comparator"],
    [180_110, "Equal comparator"],
    [180_111, "Below comparator"],
    [null, "Unavailable"],
  ])("keeps the Vue comparator snapshot advisory at %s", (comparatorBytes, status) => {
    const input = privateVueBudgetResults();
    input.vueMatchedSupportResults = [
      { gzipBytes: 180_110, provider: "starwind-vue" },
      ...(comparatorBytes == null ? [] : [{ gzipBytes: comparatorBytes, provider: "zag-vue" }]),
    ];
    const result = evaluatePackageSizeBudgets({
      bundleResults: passingBundleResults(),
      includePrivateVue: true,
      supportResults: passingSupportResults(),
      ...input,
    });

    expect(result.failures).toEqual([]);
    expect(result.vueMatchedSupportCheck).toEqual(
      expect.objectContaining({ comparisonStatus: status, failure: null, status: "Pass" }),
    );
  });
});

function privateVueBudgetResults({ offset = 0 } = {}) {
  const ceiling = (id) => vuePackageSizeBaseline.budgets[id].ceilingBytes + offset;
  return {
    vueBundleResults: [
      { gzipBytes: ceiling("vue.adapter-only"), label: "@starwind-ui/vue (adapter only)" },
      { gzipBytes: ceiling("vue.combined"), label: "@starwind-ui/vue + runtime" },
    ],
    vueColdImportResults: vuePackageSizeBaseline.sentinels.map((component) => ({
      component,
      gzipBytes: ceiling(`vue.cold.${component}`),
    })),
    vueMatchedSupportResults: [
      { gzipBytes: 180_110, provider: "starwind-vue" },
      { gzipBytes: 128_292, provider: "zag-vue" },
    ],
    vuePackagePayload: { packageGzipBytes: ceiling("vue.packed-tarball") },
  };
}

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
