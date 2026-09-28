const METHOD = "package-dist-static-gzip-v1";
const bundleIds = new Map([
  ["@starwind-ui/runtime", "runtime.catalog"],
  ["@starwind-ui/runtime/color-picker", "runtime.color-picker"],
  ["@starwind-ui/react (adapter only)", "react.adapter"],
  ["@starwind-ui/react + runtime", "react.catalog"],
  ["@starwind-ui/vue (adapter only)", "vue.adapter"],
  ["@starwind-ui/vue + runtime", "vue.catalog"],
  ["@starwind-ui/vue complete catalog", "vue.complete-catalog"],
]);

export function collectPackageSizeMeasurements(results) {
  const measurements = [];
  const add = (row, id, kind, gzipBytes = row.gzipBytes) => {
    measurements.push({ id, label: row.label, kind, gzipBytes });
  };
  for (const row of [...(results.bundleResults ?? []), ...(results.vueBundleResults ?? [])]) {
    const id = bundleIds.get(row.label);
    if (id) add(row, id, id === "runtime.color-picker" ? "component" : "aggregate");
  }
  for (const row of results.supportResults ?? []) {
    if (row.provider !== "starwind") continue;
    if (row.comparisonSet) add(row, `react.matched.${row.comparisonSet}`, "aggregate");
    else if (row.component) add(row, `react.${row.component}`, "component");
  }
  for (const row of results.vueColdImportResults ?? []) {
    if (row.provider === "starwind-vue") add(row, `vue.${row.component}`, "component");
  }
  for (const row of results.vueMatchedSupportResults ?? []) {
    if (row.provider === "starwind-vue") {
      add(row, `vue.matched.${row.comparisonSet}`, "aggregate");
    }
  }
  if (results.vuePackagePayload) {
    add(
      results.vuePackagePayload,
      "vue.packed",
      "payload",
      results.vuePackagePayload.packageGzipBytes,
    );
  }
  return measurements.sort((a, b) => a.id.localeCompare(b.id, "en"));
}

export function createPackageSizeSnapshot(results, provenance) {
  return validatePackageSizeSnapshot({
    schemaVersion: 1,
    method: METHOD,
    provenance: { ...provenance },
    measurements: collectPackageSizeMeasurements(results),
  });
}

export function validatePackageSizeSnapshot(snapshot) {
  validateMetadata(snapshot);
  validateMeasurements(snapshot.measurements);
  return snapshot;
}

function validateMetadata(snapshot) {
  if (snapshot?.schemaVersion !== 1 || snapshot.method !== METHOD) {
    throw new Error("Unsupported package size snapshot schema or method");
  }
  const provenance = snapshot.provenance;
  const timestamp = provenance?.capturedAt;
  if (
    typeof timestamp !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(timestamp) ||
    !Number.isFinite(Date.parse(timestamp)) ||
    new Date(timestamp).toISOString().slice(0, 19) !== timestamp.slice(0, 19) ||
    typeof provenance.sourceCommit !== "string" ||
    !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(provenance.sourceCommit) ||
    typeof provenance.workingTreeDirty !== "boolean" ||
    typeof provenance.esbuildVersion !== "string" ||
    !/^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(provenance.esbuildVersion) ||
    typeof provenance.lockfileSha256 !== "string" ||
    !/^[a-f0-9]{64}$/i.test(provenance.lockfileSha256)
  ) {
    throw new Error("Invalid package size snapshot provenance");
  }
}

function validateMeasurements(measurements) {
  if (!Array.isArray(measurements) || measurements.length === 0) {
    throw new Error("Package size snapshot requires measurements");
  }
  const ids = new Set();
  for (const row of measurements) {
    if (!validMeasurement(row)) {
      throw new Error(`Invalid package size measurement: ${row?.id ?? "unknown"}`);
    }
    if (ids.has(row.id)) throw new Error(`Duplicate package size measurement: ${row.id}`);
    ids.add(row.id);
  }
}

function validMeasurement(row) {
  return (
    typeof row?.id === "string" &&
    /^(runtime|react|vue)\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(row.id) &&
    typeof row.label === "string" &&
    row.label.trim() !== "" &&
    ["aggregate", "component", "payload"].includes(row.kind) &&
    Number.isSafeInteger(row.gzipBytes) &&
    row.gzipBytes >= 0
  );
}

export function evaluatePackageSizeChanges(snapshot, baseline, { includePrivateVue = true } = {}) {
  validateMetadata(snapshot);
  validatePackageSizeSnapshot(baseline);
  if (!Array.isArray(snapshot.measurements)) throw new Error("Invalid current measurements");
  const current = new Map();
  const invalid = new Set();
  for (const [index, row] of snapshot.measurements.entries()) {
    const id = typeof row?.id === "string" ? row.id : `invalid-row-${index}`;
    if (!validMeasurement(row) || current.has(id)) invalid.add(id);
    current.set(id, { ...row, id, label: row?.label ?? id });
  }
  const previous = new Map(baseline.measurements.map((row) => [row.id, row]));
  const ids = [...new Set([...current.keys(), ...previous.keys()])]
    .filter((id) => includePrivateVue || !id.startsWith("vue."))
    .sort((a, b) => a.localeCompare(b, "en"));

  return ids.map((id) => {
    const row = current.get(id);
    const before = previous.get(id);
    const baselineGzipBytes = before?.gzipBytes ?? null;
    const valid = row && !invalid.has(id);
    const growthBytes = valid && before ? row.gzipBytes - before.gzipBytes : null;
    const growthPercent =
      before?.gzipBytes > 0 && valid ? (growthBytes / before.gzipBytes) * 100 : null;
    const aggregate = before?.kind === "aggregate";
    const maxGzipBytes = before
      ? before.gzipBytes +
        (aggregate
          ? Math.min(Math.floor(before.gzipBytes / 10), 15 * 1024)
          : Math.max(Math.ceil(before.gzipBytes / 10), 2 * 1024))
      : null;
    const warningGzipBytes = before
      ? aggregate
        ? maxGzipBytes
        : before.gzipBytes + Math.max(Math.ceil(before.gzipBytes / 20), 1024)
      : null;
    let status = "Pass";
    let failure = null;
    let advisory = null;
    if (!row) {
      status = "Fail";
      failure = `${id}: baseline measurement is missing from the current capture`;
    } else if (!valid) {
      status = "Fail";
      failure = `${id}: invalid or duplicate current measurement`;
    } else if (!before) {
      status = "New";
      advisory = `${id}: new measurement (${bytes(row.gzipBytes)}); review before accepting a baseline`;
    } else if (row.kind !== before.kind) {
      status = "Fail";
      failure = `${id}: measurement kind changed from ${before.kind} to ${row.kind}`;
    } else if (row.gzipBytes > maxGzipBytes) {
      status = "Fail";
      failure = `${id}: ${bytes(row.gzipBytes)} exceeds ${bytes(maxGzipBytes)}; change ${change(growthBytes, growthPercent)}`;
    } else if (row.gzipBytes > warningGzipBytes) {
      status = "Warn";
      advisory = `${id}: ${bytes(row.gzipBytes)} exceeds review threshold ${bytes(warningGzipBytes)}; change ${change(growthBytes, growthPercent)}`;
    }
    return {
      ...(row ?? before),
      gzipBytes: valid ? row.gzipBytes : null,
      baselineGzipBytes,
      growthBytes,
      growthPercent,
      maxGzipBytes,
      warningGzipBytes,
      status,
      failure,
      advisory,
    };
  });
}

export function formatPackageSizeChanges(checks, { changedOnly = false } = {}) {
  const rows = checks.filter(
    (row) => !changedOnly || row.growthBytes !== 0 || row.status !== "Pass",
  );
  if (rows.length === 0) return `${checks.length} measurements unchanged.`;
  return [
    "| Measurement | Before | After | Change | Status |",
    "| --- | ---: | ---: | ---: | --- |",
    ...rows.map((row) => {
      const label = String(row.label)
        .replaceAll("|", "\\|")
        .replace(/[\r\n]+/g, " ");
      const delta =
        row.status === "New"
          ? `${bytes(row.gzipBytes)} new`
          : row.gzipBytes === null
            ? row.failure?.includes("invalid")
              ? "Invalid measurement"
              : "Missing measurement"
            : change(row.growthBytes, row.growthPercent);
      return `| ${label} | ${bytes(row.baselineGzipBytes)} | ${bytes(row.gzipBytes)} | ${delta} | ${row.status} |`;
    }),
  ].join("\n");
}

function bytes(value) {
  return value === null ? "N/A" : `${value.toLocaleString("en-US")} B`;
}

function change(value, percent) {
  return `${value > 0 ? "+" : ""}${bytes(value)} (${percent === null ? "new bytes" : `${percent > 0 ? "+" : ""}${percent.toFixed(2)}%`})`;
}
