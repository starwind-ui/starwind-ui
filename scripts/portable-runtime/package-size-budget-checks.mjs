import { readFileSync } from "node:fs";

import {
  collectPackageSizeMeasurements,
  evaluatePackageSizeChanges,
  validatePackageSizeSnapshot,
} from "./package-size-change-baseline.mjs";

export const acceptedPackageSizeBaseline = JSON.parse(
  readFileSync(new URL("./evidence/package-size-accepted.json", import.meta.url), "utf8"),
);
validatePackageSizeSnapshot(acceptedPackageSizeBaseline);

const headlineIds = ["runtime.catalog", "react.adapter", "react.catalog"];
const matchedSets = [
  { id: "all-three-overlap", label: "All-three overlap", providers: ["zag", "base"] },
  { id: "starwind-zag-overlap", label: "Starwind/Zag overlap", providers: ["zag"] },
  { id: "starwind-base-overlap", label: "Starwind/Base UI overlap", providers: ["base"] },
];

export function getPackageSizeBudgetCeilings() {
  const checks = evaluatePackageSizeChanges(
    acceptedPackageSizeBaseline,
    acceptedPackageSizeBaseline,
  );
  const byId = new Map(checks.map((check) => [check.id, check]));
  return {
    headline: Object.fromEntries(
      headlineIds.map((id) => [byId.get(id).label, byId.get(id).maxGzipBytes]),
    ),
    matchedSupport: Object.fromEntries(
      matchedSets.map(({ id }) => [id, byId.get(`react.matched.${id}`).maxGzipBytes]),
    ),
  };
}

export function evaluatePackageSizeBudgets({
  baseline = acceptedPackageSizeBaseline,
  includePrivateVue = false,
  ...results
}) {
  const snapshot = {
    schemaVersion: 1,
    method: baseline.method,
    provenance: baseline.provenance,
    measurements: collectPackageSizeMeasurements(results),
  };
  const changeChecks = evaluatePackageSizeChanges(snapshot, baseline, { includePrivateVue });
  const byId = new Map(changeChecks.map((check) => [check.id, check]));
  const failures = changeChecks.flatMap((check) => (check.failure ? [check.failure] : []));
  const advisories = changeChecks.flatMap((check) => (check.advisory ? [check.advisory] : []));

  const standaloneComponentChecks = [
    absoluteCheck(
      "Color Picker cold import",
      byId.get("runtime.color-picker")?.gzipBytes,
      24 * 1024,
    ),
  ];
  const fieldColdImportChecks = [
    absoluteCheck("Field cold import", byId.get("react.field")?.gzipBytes, 22 * 1024),
  ];
  for (const check of [...standaloneComponentChecks, ...fieldColdImportChecks]) {
    if (check.failure) failures.push(check.failure);
  }

  const matchedSupportChecks = matchedSets.flatMap(({ id, label, providers }) => {
    const change = byId.get(`react.matched.${id}`);
    return providers.map((provider) => {
      const comparison = compareProvider(
        `${label} vs ${provider === "zag" ? "Zag React" : "Base UI"}`,
        change?.gzipBytes,
        results.supportResults?.find((row) => row.comparisonSet === id && row.provider === provider)
          ?.gzipBytes,
      );
      if (comparison.advisory) advisories.push(comparison.advisory);
      return {
        ...change,
        ...comparison,
        comparatorLabel: provider === "zag" ? "Zag React" : "Base UI",
        maxStarwindGzipBytes: change?.maxGzipBytes,
      };
    });
  });
  const vueMatchedSupportCheck = includePrivateVue
    ? compareProvider(
        "Vue matched support vs Zag Vue",
        results.vueMatchedSupportResults?.find((row) => row.provider === "starwind-vue")?.gzipBytes,
        results.vueMatchedSupportResults?.find((row) => row.provider === "zag-vue")?.gzipBytes,
      )
    : null;
  if (vueMatchedSupportCheck?.advisory) advisories.push(vueMatchedSupportCheck.advisory);

  return {
    baselineProvenance: baseline.provenance,
    changeChecks,
    advisories: [...new Set(advisories)],
    failures: [...new Set(failures)],
    headlineChecks: headlineIds.map((id) => byId.get(id)).filter(Boolean),
    matchedSupportChecks,
    standaloneComponentChecks,
    fieldColdImportChecks,
    vueAbsoluteChecks: changeChecks.filter((check) => check.id.startsWith("vue.")),
    vueMatchedSupportCheck,
  };
}

function absoluteCheck(label, gzipBytes, maxGzipBytes) {
  const valid = Number.isSafeInteger(gzipBytes) && gzipBytes >= 0;
  const failure = !valid
    ? `${label}: missing or invalid gzip measurement.`
    : gzipBytes > maxGzipBytes
      ? `${label}: ${formatBytes(gzipBytes)} exceeds the absolute ceiling of ${formatBytes(maxGzipBytes)}.`
      : null;
  return { label, gzipBytes, maxGzipBytes, failure, status: failure ? "Fail" : "Pass" };
}

function compareProvider(label, starwindGzipBytes, comparatorGzipBytes) {
  const available =
    Number.isSafeInteger(starwindGzipBytes) && Number.isSafeInteger(comparatorGzipBytes);
  const comparisonStatus = !available
    ? "Unavailable"
    : starwindGzipBytes > comparatorGzipBytes
      ? "Above comparator"
      : starwindGzipBytes === comparatorGzipBytes
        ? "Equal comparator"
        : "Below comparator";
  const advisory = !available
    ? `${label}: comparator measurement unavailable.`
    : starwindGzipBytes >= comparatorGzipBytes
      ? `${label}: Starwind ${formatBytes(starwindGzipBytes)}; comparator ${formatBytes(comparatorGzipBytes)}. Comparison is informational.`
      : null;
  return { label, starwindGzipBytes, comparatorGzipBytes, comparisonStatus, advisory };
}

function formatBytes(bytes) {
  return `${bytes.toLocaleString("en-US")} B`;
}
