import { describe, expect, it } from "vitest";

import {
  acceptedPackageSizeBaseline,
  evaluatePackageSizeBudgets,
  getPackageSizeBudgetCeilings,
} from "../package-size-budget-checks.mjs";
import { createPackageSizeSnapshot } from "../package-size-change-baseline.mjs";

function acceptedResults() {
  const results = {
    bundleResults: [],
    supportResults: [],
    vueBundleResults: [],
    vueColdImportResults: [],
    vueMatchedSupportResults: [],
  };
  for (const row of acceptedPackageSizeBaseline.measurements) {
    const { id, label, gzipBytes } = row;
    if (
      ["runtime.catalog", "runtime.color-picker", "react.adapter", "react.catalog"].includes(id)
    ) {
      results.bundleResults.push({ label, gzipBytes });
    } else if (id.startsWith("react.matched.")) {
      results.supportResults.push({
        label,
        gzipBytes,
        comparisonSet: id.slice("react.matched.".length),
        provider: "starwind",
      });
    } else if (id.startsWith("react.")) {
      results.supportResults.push({
        label,
        gzipBytes,
        component: id.slice(6),
        provider: "starwind",
      });
    } else if (["vue.adapter", "vue.catalog", "vue.complete-catalog"].includes(id)) {
      results.vueBundleResults.push({ label, gzipBytes });
    } else if (id === "vue.packed") {
      results.vuePackagePayload = { label, packageGzipBytes: gzipBytes };
    } else if (id.startsWith("vue.matched.")) {
      results.vueMatchedSupportResults.push({
        label,
        gzipBytes,
        comparisonSet: id.slice("vue.matched.".length),
        provider: "starwind-vue",
      });
    } else if (id.startsWith("vue.")) {
      results.vueColdImportResults.push({
        label,
        gzipBytes,
        component: id.slice(4),
        provider: "starwind-vue",
      });
    }
  }
  return results;
}

const evaluate = (results, options = {}) =>
  evaluatePackageSizeBudgets({
    ...results,
    includePrivateVue: true,
    ...options,
  });

describe("package size checks", () => {
  it("accepts the reviewed sizes, including every component import", () => {
    const result = evaluate(acceptedResults());
    expect(result.failures).toEqual([]);
    expect(result.changeChecks).toHaveLength(acceptedPackageSizeBaseline.measurements.length);
    expect(
      result.changeChecks.every((check) => check.growthBytes === 0 && check.status === "Pass"),
    ).toBe(true);
    expect(result.changeChecks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "react.checkbox",
        "react.color-picker",
        "react.form",
        "vue.select",
        "vue.packed",
      ]),
    );
  });

  it("catches growth in an individual component even when the full catalog remains unchanged", () => {
    const results = acceptedResults();
    results.supportResults.find((row) => row.component === "checkbox").gzipBytes += 2049;
    const result = evaluate(results);
    expect(result.headlineChecks.every((check) => check.status === "Pass")).toBe(true);
    expect(result.changeChecks.find((check) => check.id === "react.checkbox")).toMatchObject({
      growthBytes: 2049,
      status: "Fail",
    });
    expect(result.failures).toHaveLength(1);
  });

  it("uses an explicitly reviewed base instead of retaining earlier accumulated growth", () => {
    const results = acceptedResults();
    results.supportResults.find((row) => row.component === "checkbox").gzipBytes += 2049;
    const baseline = createPackageSizeSnapshot(results, acceptedPackageSizeBaseline.provenance);
    expect(evaluate(results, { baseline }).failures).toEqual([]);
    results.supportResults.find((row) => row.component === "checkbox").gzipBytes += 50;
    expect(
      evaluate(results, { baseline }).changeChecks.find((check) => check.id === "react.checkbox"),
    ).toMatchObject({
      growthBytes: 50,
      status: "Pass",
    });
  });

  it("keeps Field and Runtime Color Picker absolute ceilings after a baseline update", () => {
    const results = acceptedResults();
    results.supportResults.find((row) => row.component === "field").gzipBytes = 22 * 1024 + 1;
    results.bundleResults.find(
      (row) => row.label === "@starwind-ui/runtime/color-picker",
    ).gzipBytes = 24 * 1024 + 1;
    const baseline = createPackageSizeSnapshot(results, acceptedPackageSizeBaseline.provenance);
    const result = evaluate(results, { baseline });
    expect(result.failures).toHaveLength(2);
    expect(result.fieldColdImportChecks[0].status).toBe("Fail");
    expect(result.standaloneComponentChecks[0].status).toBe("Fail");
  });

  it("keeps comparator rankings informational and preserves size failure status", () => {
    const results = acceptedResults();
    results.supportResults.push({
      provider: "zag",
      comparisonSet: "all-three-overlap",
      gzipBytes: 1,
    });
    const result = evaluate(results);
    expect(result.failures).toEqual([]);
    expect(result.matchedSupportChecks[0]).toMatchObject({
      comparisonStatus: "Above comparator",
      status: "Pass",
    });
    results.supportResults.find(
      (row) => row.comparisonSet === "all-three-overlap" && row.provider === "starwind",
    ).gzipBytes += 16000;
    expect(evaluate(results).matchedSupportChecks[0].status).toBe("Fail");
  });

  it("omits Vue only when the caller explicitly leaves it out", () => {
    const results = acceptedResults();
    delete results.vueBundleResults;
    delete results.vueColdImportResults;
    delete results.vueMatchedSupportResults;
    delete results.vuePackagePayload;
    expect(evaluate(results, { includePrivateVue: false }).failures).toEqual([]);
    expect(evaluate(results).failures.length).toBeGreaterThan(0);
  });

  it("reports the active catalog ceilings for architecture diagnostics", () => {
    const result = evaluate(acceptedResults());
    const ceilings = getPackageSizeBudgetCeilings();
    for (const check of result.headlineChecks) {
      expect(ceilings.headline[check.label]).toBe(check.maxGzipBytes);
      expect(check.maxGzipBytes).toBeGreaterThan(check.gzipBytes);
    }
  });
});
