import { describe, expect, it } from "vitest";
import {
  collectPackageSizeMeasurements,
  createPackageSizeSnapshot,
  evaluatePackageSizeChanges,
  formatPackageSizeChanges,
  validatePackageSizeSnapshot,
} from "../package-size-change-baseline.mjs";

const provenance = {
  capturedAt: "2026-09-28T15:00:00.000Z",
  sourceCommit: "a".repeat(40),
  workingTreeDirty: true,
  esbuildVersion: "0.28.1",
  lockfileSha256: "b".repeat(64),
};
const measurement = (gzipBytes = 10_000, kind = "component", id = "react.checkbox") => ({
  id,
  label: id,
  kind,
  gzipBytes,
});
const snapshot = (...measurements) => ({
  schemaVersion: 1,
  method: "package-dist-static-gzip-v1",
  provenance: { ...provenance },
  measurements: measurements.length ? measurements : [measurement()],
});
const compare = (before, after, kind = "component") =>
  evaluatePackageSizeChanges(
    snapshot(measurement(after, kind)),
    snapshot(measurement(before, kind)),
  )[0];

describe("package size change baseline", () => {
  it("collects only Starwind rows with stable sorted identities", () => {
    const row = (label, extra = {}) => ({ label, gzipBytes: 100, ...extra });
    const results = {
      bundleResults: [
        row("@starwind-ui/runtime"),
        row("@starwind-ui/runtime/color-picker"),
        row("@starwind-ui/react (adapter only)"),
        row("@starwind-ui/react + runtime"),
        row("@base-ui/react"),
      ],
      supportResults: [
        row("Checkbox", { provider: "starwind", component: "checkbox" }),
        row("Fieldset", { provider: "starwind", component: "fieldset" }),
        row("Overlap", { provider: "starwind", comparisonSet: "all-three-overlap" }),
        row("Zag", { provider: "zag", component: "checkbox" }),
      ],
      vueBundleResults: [
        row("@starwind-ui/vue (adapter only)"),
        row("@starwind-ui/vue + runtime"),
        row("@starwind-ui/vue complete catalog"),
      ],
      vueColdImportResults: [row("Vue Select", { provider: "starwind-vue", component: "select" })],
      vueMatchedSupportResults: [
        row("Vue overlap", { provider: "starwind-vue", comparisonSet: "starwind-zag-vue-overlap" }),
        row("Zag Vue", { provider: "zag-vue", comparisonSet: "starwind-zag-vue-overlap" }),
      ],
      vuePackagePayload: row("Vue package", { packageGzipBytes: 123 }),
    };
    const rows = collectPackageSizeMeasurements(results);
    expect(rows.map((entry) => entry.id)).toEqual([
      "react.adapter",
      "react.catalog",
      "react.checkbox",
      "react.fieldset",
      "react.matched.all-three-overlap",
      "runtime.catalog",
      "runtime.color-picker",
      "vue.adapter",
      "vue.catalog",
      "vue.complete-catalog",
      "vue.matched.starwind-zag-vue-overlap",
      "vue.packed",
      "vue.select",
    ]);
    expect(rows.find((entry) => entry.id === "vue.packed")).toMatchObject({
      kind: "payload",
      gzipBytes: 123,
    });
    expect(rows.find((entry) => entry.id === "runtime.color-picker").kind).toBe("component");
    expect(rows.find((entry) => entry.id === "vue.catalog").label).toBe(
      "@starwind-ui/vue + runtime",
    );
    expect(createPackageSizeSnapshot(results, provenance)).toEqual({
      schemaVersion: 1,
      method: "package-dist-static-gzip-v1",
      provenance,
      measurements: rows,
    });
  });

  it("accepts the same snapshot and reports decreases", () => {
    expect(compare(10_000, 10_000)).toMatchObject({
      status: "Pass",
      growthBytes: 0,
      growthPercent: 0,
      failure: null,
      advisory: null,
    });
    expect(compare(10_000, 9_000)).toMatchObject({
      status: "Pass",
      growthBytes: -1000,
      growthPercent: -10,
    });
  });

  it("keeps exact aggregate percentage and absolute boundaries inclusive", () => {
    expect(compare(10_005, 11_005, "aggregate")).toMatchObject({
      status: "Pass",
      maxGzipBytes: 11_005,
    });
    expect(compare(10_005, 11_006, "aggregate").status).toBe("Fail");
    expect(compare(200_000, 215_360, "aggregate").status).toBe("Pass");
    expect(compare(200_000, 215_361, "aggregate").status).toBe("Fail");
  });

  it.each(["component", "payload"])("uses review and hard growth floors for %s", (kind) => {
    expect(compare(100, 1124, kind).status).toBe("Pass");
    expect(compare(100, 1125, kind)).toMatchObject({
      status: "Warn",
      warningGzipBytes: 1124,
      maxGzipBytes: 2148,
    });
    expect(compare(100, 2148, kind).status).toBe("Warn");
    expect(compare(100, 2149, kind).status).toBe("Fail");
    expect(compare(100_001, 105_002, kind).status).toBe("Pass");
    expect(compare(100_001, 105_003, kind).status).toBe("Warn");
    expect(compare(100_001, 110_002, kind).status).toBe("Warn");
    expect(compare(100_001, 110_003, kind).status).toBe("Fail");
  });

  it("reports zero-baseline growth without infinite percentages", () => {
    const check = compare(0, 25);
    expect(check).toMatchObject({ growthBytes: 25, growthPercent: null, status: "Pass" });
    expect(formatPackageSizeChanges([check])).toContain("+25 B (new bytes)");
  });

  it("keeps added and missing rows visible and filters Vue explicitly", () => {
    const baseline = snapshot(measurement(100), measurement(200, "component", "vue.select"));
    const current = snapshot(measurement(300, "component", "react.select"));
    const checks = evaluatePackageSizeChanges(current, baseline);
    expect(checks.map((row) => [row.id, row.status])).toEqual([
      ["react.checkbox", "Fail"],
      ["react.select", "New"],
      ["vue.select", "Fail"],
    ]);
    expect(checks[0]).toMatchObject({ baselineGzipBytes: 100, gzipBytes: null, growthBytes: null });
    expect(checks[1]).toMatchObject({
      baselineGzipBytes: null,
      maxGzipBytes: null,
      failure: null,
      advisory: expect.stringContaining("new measurement"),
    });
    expect(
      evaluatePackageSizeChanges(current, baseline, { includePrivateVue: false }),
    ).toHaveLength(2);
    expect(
      evaluatePackageSizeChanges({ ...current, measurements: [] }, baseline).every(
        (row) => row.status === "Fail",
      ),
    ).toBe(true);
  });

  it("fails malformed current bytes and duplicates while preserving diagnostic rows", () => {
    for (const gzipBytes of [-1, 1.5, NaN, Infinity, null, "100"]) {
      expect(compare(100, gzipBytes)).toMatchObject({
        status: "Fail",
        gzipBytes: null,
        failure: expect.stringContaining("invalid"),
      });
    }
    expect(
      evaluatePackageSizeChanges(snapshot(measurement(), measurement()), snapshot())[0].status,
    ).toBe("Fail");
    expect(evaluatePackageSizeChanges(snapshot(null), snapshot()).map((row) => row.status)).toEqual(
      ["Fail", "Fail"],
    );
    expect(
      evaluatePackageSizeChanges(snapshot(measurement(10_000, "payload")), snapshot())[0].failure,
    ).toContain("kind changed");
  });

  it("does not treat toolchain or lock changes as a source regression", () => {
    const current = snapshot();
    current.provenance.esbuildVersion = "0.29.0";
    current.provenance.lockfileSha256 = "c".repeat(64);
    expect(evaluatePackageSizeChanges(current, snapshot())[0].status).toBe("Pass");
  });

  it("rejects unsupported, empty, duplicate and malformed saved measurements", () => {
    for (const invalid of [
      { ...snapshot(), schemaVersion: 2 },
      { ...snapshot(), method: "different-method" },
      { ...snapshot(), measurements: [] },
      snapshot(measurement(), measurement()),
      snapshot(measurement(-1)),
      snapshot(measurement(0.5)),
      snapshot(measurement(Number.MAX_SAFE_INTEGER + 1)),
      snapshot(measurement(100, "unknown")),
      snapshot({ ...measurement(), id: "" }),
      snapshot({ ...measurement(), label: "" }),
    ])
      expect(() => validatePackageSizeSnapshot(invalid)).toThrow();
    expect(() => evaluatePackageSizeChanges(snapshot(), snapshot(measurement(-1)))).toThrow();
  });

  it.each([
    ["capturedAt", "not-a-date"],
    ["capturedAt", "2026-02-30T12:00:00Z"],
    ["sourceCommit", "short"],
    ["workingTreeDirty", "true"],
    ["esbuildVersion", "latest"],
    ["lockfileSha256", "not-a-hash"],
  ])("validates required provenance field %s", (field, value) => {
    const invalid = snapshot();
    invalid.provenance[field] = value;
    expect(() => validatePackageSizeSnapshot(invalid)).toThrow(/provenance/);
    delete invalid.provenance[field];
    expect(() => validatePackageSizeSnapshot(invalid)).toThrow(/provenance/);
  });

  it("formats exact bytes and signed percentages while omitting unchanged rows on request", () => {
    const baseline = snapshot(measurement(), measurement(3000, "component", "react.select"));
    const current = snapshot(measurement(), {
      ...measurement(4000, "component", "react.select"),
      label: "Select | popup",
    });
    const checks = evaluatePackageSizeChanges(current, baseline);
    expect(formatPackageSizeChanges(checks)).toContain("react.checkbox");
    const report = formatPackageSizeChanges(checks, { changedOnly: true });
    expect(report).not.toContain("react.checkbox");
    expect(report).toContain("Select \\| popup | 3,000 B | 4,000 B | +1,000 B (+33.33%) | Pass");
    const removed = evaluatePackageSizeChanges({ ...current, measurements: [] }, baseline);
    expect(formatPackageSizeChanges(removed)).toContain("Missing measurement | Fail");
  });
});
