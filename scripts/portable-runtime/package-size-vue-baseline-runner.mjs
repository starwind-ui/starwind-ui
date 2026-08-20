import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildPackageSizeBaselineCeilingCandidates,
  createPackageSizeRunDirectory,
  createPackageSizeRunRecord,
  evaluatePackageSizeRunStability,
  publishAcceptedPackageSizeArtifacts,
  serializePackageSizeEvidence,
} from "./package-size-run-evidence.mjs";
import {
  STARWIND_VUE_MEASUREMENT_LABELS,
  ZAG_VUE_COMPARATOR_VERSION,
  starwindVueRuntimeComponents,
  validateZagVueResolvedVersions,
} from "./package-size-vue-plan.mjs";

export const VUE_BASELINE_SCHEMA = "starwind.package-size.vue-baseline";
export const VUE_BASELINE_SCHEMA_VERSION = 1;
export const VUE_BASELINE_RUN_COUNT = 3;

const evidenceFileNames = Object.freeze({
  json: "vue-package-size-baseline.json",
  markdown: "vue-package-size-baseline.md",
});
const headlineRowIds = Object.freeze({
  adapterOnly: "vue.adapter-only",
  combined: "vue.combined",
  packedTarball: "vue.packed-tarball",
});
const matchedRowIds = Object.freeze({
  starwind: "vue.matched.starwind",
  zag: "vue.matched.zag",
});
const themeRowId = "vue.theme";
const coldImportRowId = (component) => `vue.cold.${component}`;

export const VUE_BASELINE_REQUIRED_ROW_IDS = Object.freeze(
  [
    ...Object.values(headlineRowIds),
    ...starwindVueRuntimeComponents.map(coldImportRowId),
    themeRowId,
    ...Object.values(matchedRowIds),
  ].sort((left, right) => left.localeCompare(right, "en")),
);

export function getVueBaselineEvidencePaths({ evidenceDirectory }) {
  const resolvedDirectory = path.resolve(evidenceDirectory);
  return Object.freeze({
    json: path.join(resolvedDirectory, evidenceFileNames.json),
    markdown: path.join(resolvedDirectory, evidenceFileNames.markdown),
  });
}

export function mapVueMeasurementToRunRecord(results, { diagnosticPath }) {
  requireObject(results, "measurement results");
  const provenance = results.vueProvenance;
  requireObject(provenance, "measurement results.vueProvenance");
  if (provenance.comparator?.version !== ZAG_VUE_COMPARATOR_VERSION) {
    throw new Error(
      `Vue baseline requires Zag Vue ${ZAG_VUE_COMPARATOR_VERSION}; received ${provenance.comparator?.version}`,
    );
  }
  validateZagVueResolvedVersions(provenance.comparator.packages);

  const rows = [
    rowFromLabel(
      results.vueBundleResults,
      STARWIND_VUE_MEASUREMENT_LABELS.adapterOnly,
      headlineRowIds.adapterOnly,
    ),
    rowFromLabel(
      results.vueBundleResults,
      STARWIND_VUE_MEASUREMENT_LABELS.combined,
      headlineRowIds.combined,
    ),
    rowFromValue(results.vuePackagePayload?.packageGzipBytes, headlineRowIds.packedTarball),
    ...starwindVueRuntimeComponents.map((component) =>
      rowFromComponent(results.vueColdImportResults, component, coldImportRowId(component)),
    ),
    rowFromComponent(results.vueColdImportResults, "theme", themeRowId),
    rowFromProvider(results.vueMatchedSupportResults, "starwind-vue", matchedRowIds.starwind),
    rowFromProvider(results.vueMatchedSupportResults, "zag-vue", matchedRowIds.zag),
  ];

  return createPackageSizeRunRecord({
    ...provenance,
    diagnosticPath,
    rows,
  });
}

export function buildVueBaselineEvidence(runs, { requireBaselinePlatform = true } = {}) {
  for (const run of runs ?? []) validateExactVueComparatorProvenance(run);
  const stability = evaluatePackageSizeRunStability({
    requireBaselinePlatform,
    requiredRowIds: VUE_BASELINE_REQUIRED_ROW_IDS,
    runs,
  });
  if (!stability.stable) {
    throw new Error(`Unstable package-size rows: ${stability.unstableRows.join(", ")}`);
  }

  const sentinels = selectVueColdImportSentinels(stability);
  const candidateRowIds = [
    headlineRowIds.adapterOnly,
    headlineRowIds.combined,
    headlineRowIds.packedTarball,
    ...sentinels.map(({ id }) => id),
  ];

  return {
    schema: VUE_BASELINE_SCHEMA,
    schemaVersion: VUE_BASELINE_SCHEMA_VERSION,
    runs,
    stability,
    sentinels,
    candidates: buildPackageSizeBaselineCeilingCandidates(stability, candidateRowIds),
  };
}

function validateExactVueComparatorProvenance(run) {
  if (run?.comparator?.version !== ZAG_VUE_COMPARATOR_VERSION) {
    throw new Error(
      `Vue baseline requires Zag Vue ${ZAG_VUE_COMPARATOR_VERSION}; received ${run?.comparator?.version}`,
    );
  }
  validateZagVueResolvedVersions(run.comparator.packages);
  for (const packageName of Object.keys(run.comparator.packages)) {
    if (run.packageVersions?.[packageName] !== ZAG_VUE_COMPARATOR_VERSION) {
      throw new Error(
        `Vue baseline package provenance differs for ${packageName}: expected ${ZAG_VUE_COMPARATOR_VERSION}, received ${run.packageVersions?.[packageName]}`,
      );
    }
  }
}

export function validateVueBaselineEvidence(evidence, { requireBaselinePlatform = true } = {}) {
  requireObject(evidence, "Vue baseline evidence");
  requireExactKeys(evidence, [
    "candidates",
    "runs",
    "schema",
    "schemaVersion",
    "sentinels",
    "stability",
  ]);
  if (evidence.schema !== VUE_BASELINE_SCHEMA) {
    throw new Error(`Unsupported Vue baseline evidence schema: ${evidence.schema}`);
  }
  if (evidence.schemaVersion !== VUE_BASELINE_SCHEMA_VERSION) {
    throw new Error(`Unsupported Vue baseline evidence schema version: ${evidence.schemaVersion}`);
  }

  const rebuilt = buildVueBaselineEvidence(evidence.runs, { requireBaselinePlatform });
  for (const key of ["stability", "sentinels", "candidates"]) {
    if (
      serializePackageSizeEvidence(evidence[key]) !== serializePackageSizeEvidence(rebuilt[key])
    ) {
      throw new Error(`Vue baseline evidence ${key} does not match the raw runs`);
    }
  }
  return rebuilt;
}

export async function runVueBaselineCapture({
  evidenceDirectory,
  measurementRoot,
  measureRun,
  createRunDirectory = createPackageSizeRunDirectory,
  publicationOptions = {},
  publishArtifacts = publishAcceptedPackageSizeArtifacts,
}) {
  if (typeof measureRun !== "function") throw new Error("measureRun must be a function");
  const runs = [];
  const runDirectories = new Set();

  for (let index = 0; index < VUE_BASELINE_RUN_COUNT; index += 1) {
    const runPaths = createRunDirectory({
      parentDirectory: measurementRoot,
      prefix: "vue-baseline-",
    });
    if (runDirectories.has(runPaths.runDirectory)) {
      throw new Error(`Vue baseline run directory was reused: ${runPaths.runDirectory}`);
    }
    runDirectories.add(runPaths.runDirectory);
    try {
      const results = await measureRun({ index, runPaths });
      runs.push(mapVueMeasurementToRunRecord(results, { diagnosticPath: runPaths.runDirectory }));
    } catch (error) {
      if (error && typeof error === "object") {
        error.packageSizeBaseline = { runDirectory: runPaths.runDirectory, runIndex: index + 1 };
      }
      throw error;
    }
  }

  const evidence = buildVueBaselineEvidence(runs);
  const json = serializePackageSizeEvidence(evidence);
  const markdown = renderVueBaselineEvidenceMarkdown(evidence);
  const paths = getVueBaselineEvidencePaths({ evidenceDirectory });
  const publication = publishArtifacts({
    artifacts: [
      {
        contents: json,
        destination: paths.json,
        validate: (contents) => validateSerializedVueBaselineEvidence(contents),
      },
      {
        contents: markdown,
        destination: paths.markdown,
        validate: (contents) => {
          if (contents !== renderVueBaselineEvidenceMarkdown(evidence)) {
            throw new Error("Vue baseline Markdown is not deterministic");
          }
        },
      },
    ],
    evidence: runs,
    requiredRowIds: VUE_BASELINE_REQUIRED_ROW_IDS,
    ...publicationOptions,
  });

  return { evidence, paths, publication };
}

export function checkVueBaselineEvidence({ evidenceDirectory, readFile = readFileSync }) {
  const paths = getVueBaselineEvidencePaths({ evidenceDirectory });
  const json = readFile(paths.json, "utf8");
  const evidence = validateSerializedVueBaselineEvidence(json);
  const expectedMarkdown = renderVueBaselineEvidenceMarkdown(evidence);
  const acceptedMarkdown = readFile(paths.markdown, "utf8");
  if (acceptedMarkdown !== expectedMarkdown) {
    throw new Error("Committed Vue baseline Markdown does not match the accepted JSON evidence");
  }
  return { evidence, paths };
}

export function validateSerializedVueBaselineEvidence(contents) {
  const text = Buffer.isBuffer(contents) ? contents.toString("utf8") : contents;
  const evidence = JSON.parse(text);
  validateVueBaselineEvidence(evidence);
  if (text !== serializePackageSizeEvidence(evidence)) {
    throw new Error("Committed Vue baseline JSON is not in deterministic serialized form");
  }
  return evidence;
}

export function renderVueBaselineEvidenceMarkdown(evidence) {
  const rebuilt = validateVueBaselineEvidence(evidence);
  const firstRun = rebuilt.runs[0];
  const command = [firstRun.command.executable, ...firstRun.command.arguments]
    .map((part) => JSON.stringify(part))
    .join(" ");
  const lines = [
    "# Vue Package Size Baseline Evidence",
    "",
    `Commit: \`${firstRun.commit}\``,
    "",
    `Environment: ${firstRun.environment.osName} ${firstRun.environment.osRelease}; ${firstRun.environment.platform} ${firstRun.environment.architecture}; Node ${firstRun.environment.nodeVersion}; npm ${firstRun.environment.npmVersion}; pnpm ${firstRun.environment.pnpmVersion}; esbuild ${firstRun.environment.esbuildVersion}; zlib ${firstRun.environment.zlibVersion}.`,
    "",
    `Command: \`${command}\``,
    "",
    `Comparator: Zag Vue ${firstRun.comparator.version} with ${Object.keys(firstRun.comparator.packages).length} exact packages.`,
    "",
    "## Stability",
    "",
    "| Row id | Run 1 | Run 2 | Run 3 | Minimum | Maximum | Range | Tolerance |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rebuilt.stability.rows.map(
      (row) =>
        `| \`${row.id}\` | ${row.values[0]} | ${row.values[1]} | ${row.values[2]} | ${row.minimumBytes} | ${row.maximumBytes} | ${row.rangeBytes} | ${row.toleranceBytes} |`,
    ),
    "",
    "## Cold-import sentinels",
    "",
    "| Rank | Component | Row id | Stable maximum |",
    "| ---: | --- | --- | ---: |",
    ...rebuilt.sentinels.map(
      (sentinel) =>
        `| ${sentinel.rank} | ${sentinel.component} | \`${sentinel.id}\` | ${sentinel.maximumBytes} |`,
    ),
    "",
    "Theme is measured as `vue.theme` and is excluded from sentinel selection.",
    "",
    "## Ceiling candidates",
    "",
    "| Row id | Raw values | Stable maximum | Headroom | Candidate ceiling |",
    "| --- | --- | ---: | ---: | ---: |",
    ...rebuilt.candidates.map(
      (candidate) =>
        `| \`${candidate.id}\` | ${candidate.values.join(", ")} | ${candidate.maximumBytes} | ${candidate.headroomBytes} | ${candidate.ceilingBytes} |`,
    ),
    "",
  ];
  return lines.join("\n");
}

function selectVueColdImportSentinels(stability) {
  return stability.rows
    .filter(({ id }) => id.startsWith("vue.cold."))
    .map((row) => ({
      component: row.id.slice("vue.cold.".length),
      id: row.id,
      maximumBytes: row.maximumBytes,
    }))
    .sort(
      (left, right) =>
        right.maximumBytes - left.maximumBytes || left.id.localeCompare(right.id, "en"),
    )
    .slice(0, 5)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function rowFromLabel(rows, label, id) {
  return rowFromMatch(rows, ({ label: candidate }) => candidate === label, id);
}

function rowFromComponent(rows, component, id) {
  return rowFromMatch(rows, ({ component: candidate }) => candidate === component, id);
}

function rowFromProvider(rows, provider, id) {
  return rowFromMatch(rows, ({ provider: candidate }) => candidate === provider, id);
}

function rowFromMatch(rows, predicate, id) {
  if (!Array.isArray(rows)) throw new Error(`Missing required Vue measurement row: ${id}`);
  const matches = rows.filter(predicate);
  if (matches.length !== 1)
    throw new Error(`Missing or duplicate required Vue measurement row: ${id}`);
  return rowFromValue(matches[0].gzipBytes, id);
}

function rowFromValue(gzipBytes, id) {
  if (!Number.isInteger(gzipBytes) || gzipBytes < 0) {
    throw new Error(`Required Vue measurement row has invalid gzip bytes: ${id}`);
  }
  return { gzipBytes, id };
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function requireExactKeys(value, keys) {
  const expected = [...keys].sort();
  const actual = Object.keys(value).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Vue baseline evidence fields differ: expected ${expected.join(", ")}`);
  }
}
