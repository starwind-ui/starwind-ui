import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  createRuntimePerformanceEnvironment,
  createRuntimePerformanceResult,
  validateRuntimePerformanceEnvironment,
  validateRuntimePerformanceResult,
  writeStagedArtifacts,
} from "./model.mjs";
import {
  buildRuntimePerformanceCandidateCeiling,
  evaluateRuntimePerformanceStability,
} from "./statistics.mjs";
import { zagVueExpectedResolvedVersions } from "../package-size-vue-plan.mjs";
import {
  VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
  rekaUiExpectedResolvedVersions,
  vuePerformanceProviderRows,
} from "./vue-plan.mjs";

export const VUE_PERFORMANCE_EVIDENCE_SCHEMA = "starwind.runtime-performance.vue-row";
export const VUE_PERFORMANCE_EVIDENCE_SCHEMA_VERSION = 2;
export const VUE_PERFORMANCE_COLLECTION_SCHEMA = "starwind.runtime-performance.vue-collection";
export const VUE_PERFORMANCE_ELIGIBILITY_SCHEMA = "starwind.runtime-performance.vue-eligibility";
export const VUE_PERFORMANCE_REQUIRED_ROW_IDS = Object.freeze(
  vuePerformanceProviderRows.map(({ id }) => id),
);
export const VUE_PERFORMANCE_BASELINE_COMMAND = Object.freeze({
  executable: "pnpm runtime:perf:vue",
  arguments: Object.freeze(["--baseline"]),
});
export const VUE_PERFORMANCE_MOUNT_SAMPLING_CONTROL = Object.freeze({
  browserLifecycle: "one context, page, CDP session, and navigation per mount row",
  iterations: 5,
  warmupCount: 0,
});
export const VUE_PERFORMANCE_BASELINE_CONTROLS = deepFreeze({
  garbageCollectionPolicy: "collect-before-each-sample-if-available",
  mountSampling: VUE_PERFORMANCE_MOUNT_SAMPLING_CONTROL,
  rows: vuePerformanceProviderRows.map(
    ({ cpuThrottle, id, warmupCount, withinRunSampleCount }) => ({
      cpuThrottle,
      id,
      warmupCount,
      withinRunSampleCount,
    }),
  ),
});
export const VUE_PERFORMANCE_BASELINE_FLAGS = Object.freeze({
  controls: VUE_PERFORMANCE_BASELINE_CONTROLS,
  focused: false,
  mode: "baseline",
  providers: Object.freeze([]),
  scenarios: Object.freeze([]),
  smoke: false,
});
export const VUE_PERFORMANCE_BASELINE_VIEWPORT = Object.freeze({
  deviceScaleFactor: 1,
  height: 900,
  width: 1280,
});
export const VUE_PERFORMANCE_BASELINE_PLATFORM = Object.freeze({
  architecture: "x64",
  nodeMajor: 24,
  platform: "linux",
});

const TOOLCHAIN_PACKAGES = Object.freeze(["@vitejs/plugin-vue", "playwright", "vite"]);
const UNSTABLE_CEILING_REASON =
  "Within-row stability limits were exceeded, so no candidate ceiling was calculated.";

export function createVuePerformanceRun({
  command,
  complete = true,
  completedAt,
  environment,
  errors = [],
  flags,
  machine,
  rows,
  runIndex = 1,
  startedAt,
}) {
  const run = {
    command: normalizeCommand(command),
    complete,
    completedAt: isoDate(completedAt, "completedAt"),
    environment: createRuntimePerformanceEnvironment(environment),
    errors: normalizeErrors(errors, "run errors"),
    flags: normalizeFlags(flags),
    machine: normalizeMachine(machine),
    rows: normalizeRunRows(rows),
    runIndex: positiveInteger(runIndex, "runIndex"),
    startedAt: isoDate(startedAt, "startedAt"),
  };
  validateVuePerformanceRun(run);
  return deepFreeze(run);
}

export function validateVuePerformanceRun(run, { baseline = false } = {}) {
  requireObject(run, "Vue performance run");
  requireExactKeys(run, [
    "command",
    "complete",
    "completedAt",
    "environment",
    "errors",
    "flags",
    "machine",
    "rows",
    "runIndex",
    "startedAt",
  ]);
  normalizeCommand(run.command);
  if (run.complete !== true) throw new Error("Vue performance run is incomplete");
  if (isoDate(run.completedAt, "completedAt") < isoDate(run.startedAt, "startedAt"))
    throw new Error("Vue performance run completion precedes its start");
  validateRuntimePerformanceEnvironment(run.environment);
  normalizeMachine(run.machine);
  normalizeFlags(run.flags);
  if (normalizeErrors(run.errors, "run errors").length)
    throw new Error("Vue performance run contains browser or lifecycle errors");
  const rows = normalizeRunRows(run.rows, { enforcePlan: baseline });
  if (baseline) {
    if (rows.length !== 1) throw new Error("Vue row capture requires exactly one row");
    assertBaselineCommand(run.command, rows[0].id);
    assertBaselineFlags(run.flags, rows[0].id);
    assertBaselineEnvironment(run.environment);
    assertVuePerformanceBaselinePlatform(run.environment);
  }
  return run;
}

export function createVuePerformanceDiagnosticRun(run) {
  validateVuePerformanceRun(run);
  return deepFreeze({
    ...run,
    rows: run.rows.map((row) => ({ ...row, result: withoutP95(row.result) })),
  });
}

export function buildVuePerformanceRowRecord({ audit, run }, options = {}) {
  validateVuePerformanceRun(run, { baseline: options.requireBaselinePlatform !== false });
  if (options.requireBaselinePlatform === false) {
    const rows = normalizeRunRows(run.rows, { enforcePlan: true });
    if (rows.length !== 1) throw new Error("Vue row capture requires exactly one row");
    assertBaselineFlags(run.flags, rows[0].id);
    assertBaselineEnvironment(run.environment);
  }
  const row = run.rows[0];
  const stability = evaluateRuntimePerformanceStability(row.result.samples);
  return deepFreeze({
    audit: normalizeAudit(audit, { canonical: true }),
    candidate: row.id.endsWith(":starwind-vue")
      ? stability.stable
        ? {
            blocking: false,
            id: row.id,
            reason: null,
            status: "ceiling-available",
            ...buildRuntimePerformanceCandidateCeiling(row.result.samples),
          }
        : {
            blocking: false,
            id: row.id,
            reason: UNSTABLE_CEILING_REASON,
            status: "unstable-no-ceiling",
          }
      : null,
    command: run.command,
    completedAt: run.completedAt,
    environment: run.environment,
    flags: run.flags,
    id: row.id,
    lifecycle: row.lifecycle,
    machine: run.machine,
    result: withoutP95(row.result),
    schema: VUE_PERFORMANCE_EVIDENCE_SCHEMA,
    schemaVersion: VUE_PERFORMANCE_EVIDENCE_SCHEMA_VERSION,
    stability,
    startedAt: run.startedAt,
  });
}

export function validateVuePerformanceRowRecord(record, options = {}) {
  requireObject(record, "Vue performance row record");
  requireExactKeys(record, [
    "audit",
    "candidate",
    "command",
    "completedAt",
    "environment",
    "flags",
    "id",
    "lifecycle",
    "machine",
    "result",
    "schema",
    "schemaVersion",
    "stability",
    "startedAt",
  ]);
  if (record.schema !== VUE_PERFORMANCE_EVIDENCE_SCHEMA || record.schemaVersion !== 2)
    throw new Error("Unsupported Vue performance row schema");
  const rebuilt = buildVuePerformanceRowRecord(
    {
      audit: record.audit,
      run: createVuePerformanceRun({
        command: record.command,
        completedAt: record.completedAt,
        environment: record.environment,
        flags: record.flags,
        machine: record.machine,
        rows: [
          {
            errors: [],
            id: record.id,
            lifecycle: record.lifecycle,
            result: withP95(record.result),
          },
        ],
        startedAt: record.startedAt,
      }),
    },
    options,
  );
  if (serializeVuePerformanceEvidence(record) !== serializeVuePerformanceEvidence(rebuilt))
    throw new Error(`Vue performance row record does not match raw samples: ${record.id}`);
  return rebuilt;
}

export function createVuePerformanceEligibility({ audit, environment, machine, refreshedAt }) {
  assertBaselineEnvironment(environment);
  assertVuePerformanceBaselinePlatform(environment);
  return deepFreeze({
    audit: normalizeAudit(audit, { canonical: true }),
    environment: createRuntimePerformanceEnvironment(environment),
    machine: normalizeMachine(machine),
    refreshedAt: isoDate(refreshedAt, "refreshedAt"),
    revision: environment.commit,
    schema: VUE_PERFORMANCE_ELIGIBILITY_SCHEMA,
    schemaVersion: 1,
  });
}

export function validateVuePerformanceEligibility(eligibility) {
  requireObject(eligibility, "Vue performance eligibility");
  requireExactKeys(eligibility, [
    "audit",
    "environment",
    "machine",
    "refreshedAt",
    "revision",
    "schema",
    "schemaVersion",
  ]);
  if (eligibility.schema !== VUE_PERFORMANCE_ELIGIBILITY_SCHEMA || eligibility.schemaVersion !== 1)
    throw new Error("Unsupported Vue performance eligibility schema");
  const rebuilt = createVuePerformanceEligibility(eligibility);
  if (eligibility.revision !== rebuilt.environment.commit)
    throw new Error("Vue performance eligibility revision differs");
  return rebuilt;
}

export function assertVuePerformanceEligibilityForRun(eligibility, run) {
  const current = validateVuePerformanceEligibility(eligibility);
  validateVuePerformanceRun(run, { baseline: true });
  if (current.revision !== run.environment.commit)
    throw new Error("Vue performance capture revision differs from smoke eligibility");
  if (environmentIdentity(current.environment) !== environmentIdentity(run.environment))
    throw new Error("Vue performance capture environment differs from smoke eligibility");
  if (
    serializeVuePerformanceEvidence(current.machine) !==
    serializeVuePerformanceEvidence(run.machine)
  )
    throw new Error("Vue performance capture machine differs from smoke eligibility");
  return run;
}

export function buildVuePerformanceEvidence({ audit, records }, options = {}) {
  const normalizedAudit = normalizeAudit(audit, { canonical: true });
  if (!Array.isArray(records)) throw new Error("Vue performance records must be an array");
  const rows = records.map((record) => validateVuePerformanceRowRecord(record, options));
  const duplicate = findDuplicate(rows.map(({ id }) => id));
  if (duplicate) throw new Error(`Duplicate Vue performance row: ${duplicate}`);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ordered = VUE_PERFORMANCE_REQUIRED_ROW_IDS.flatMap((id) =>
    byId.has(id) ? [byId.get(id)] : [],
  );
  if (ordered.length !== rows.length)
    throw new Error("Vue performance collection has invented rows");
  if (
    options.requireComplete !== false &&
    ordered.length !== VUE_PERFORMANCE_REQUIRED_ROW_IDS.length
  ) {
    const missing = VUE_PERFORMANCE_REQUIRED_ROW_IDS.filter((id) => !byId.has(id));
    throw new Error(`Vue performance collection is missing rows: ${missing.join(", ")}`);
  }
  for (const row of ordered) {
    if (
      serializeVuePerformanceEvidence(row.audit) !==
      serializeVuePerformanceEvidence(normalizedAudit)
    )
      throw new Error(`Vue performance audit differs: ${row.id}`);
  }
  if (ordered.length) assertCollectionIdentity(ordered);
  return deepFreeze({
    audit: normalizedAudit,
    collection: ordered.length
      ? {
          environment: ordered[0].environment,
          machine: ordered[0].machine,
          revision: ordered[0].environment.commit,
        }
      : null,
    requiredRowIds: VUE_PERFORMANCE_REQUIRED_ROW_IDS,
    rows: ordered,
    schema: VUE_PERFORMANCE_COLLECTION_SCHEMA,
    schemaVersion: 2,
  });
}

export function validateVuePerformanceEvidence(evidence, options = {}) {
  requireObject(evidence, "Vue performance evidence");
  requireExactKeys(evidence, [
    "audit",
    "collection",
    "requiredRowIds",
    "rows",
    "schema",
    "schemaVersion",
  ]);
  if (evidence.schema !== VUE_PERFORMANCE_COLLECTION_SCHEMA || evidence.schemaVersion !== 2)
    throw new Error("Unsupported Vue performance collection schema");
  expectExactIds(evidence.requiredRowIds, VUE_PERFORMANCE_REQUIRED_ROW_IDS, "requiredRowIds");
  const rebuilt = buildVuePerformanceEvidence(
    { audit: evidence.audit, records: evidence.rows },
    options,
  );
  if (serializeVuePerformanceEvidence(evidence) !== serializeVuePerformanceEvidence(rebuilt))
    throw new Error("Vue performance collection manifest differs from row records");
  return rebuilt;
}

export function publishVuePerformanceRow({
  record,
  rowPath,
  writeArtifacts = writeStagedArtifacts,
}) {
  const validated = validateVuePerformanceRowRecord(record);
  return writeArtifacts([
    { content: serializeVuePerformanceEvidence(validated), path: path.resolve(rowPath) },
  ]);
}

export function publishVuePerformanceEvidence({
  evidence,
  jsonPath,
  markdown,
  markdownPath,
  rowPath,
  rowRecord,
  writeArtifacts = writeStagedArtifacts,
}) {
  const validated = validateVuePerformanceEvidence(evidence);
  if (typeof markdown !== "string" || markdown.length === 0)
    throw new Error("Vue performance Markdown must be nonempty");
  const artifacts = [
    { content: serializeVuePerformanceEvidence(validated), path: path.resolve(jsonPath) },
    { content: markdown, path: path.resolve(markdownPath) },
  ];
  if ((rowPath == null) !== (rowRecord == null))
    throw new Error("Vue performance aggregate row publication requires record and path");
  if (rowRecord)
    artifacts.push({
      content: serializeVuePerformanceEvidence(validateVuePerformanceRowRecord(rowRecord)),
      path: path.resolve(rowPath),
    });
  return writeArtifacts(artifacts);
}

export function checkVuePerformanceEvidence({
  auditPath,
  eligibilityPath,
  jsonPath,
  markdownPath,
  readDirectory = readdirSync,
  readFile = readFileSync,
  renderMarkdown,
  rowsPath,
}) {
  const audit = createVuePerformanceAudit({
    contents: readFile(auditPath),
    source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
  });
  const eligibility = validateVuePerformanceEligibility(
    JSON.parse(readFile(eligibilityPath, "utf8")),
  );
  if (serializeVuePerformanceEvidence(audit) !== serializeVuePerformanceEvidence(eligibility.audit))
    throw new Error("Vue performance eligibility audit linkage differs");
  const records = readDirectory(rowsPath)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFile(path.join(rowsPath, file), "utf8")));
  const evidence = buildVuePerformanceEvidence({ audit, records });
  if (evidence.collection.revision !== eligibility.revision)
    throw new Error("Vue performance collection revision differs from eligibility");
  if (
    environmentIdentity(evidence.collection.environment) !==
    environmentIdentity(eligibility.environment)
  )
    throw new Error("Vue performance collection environment differs from eligibility");
  if (
    serializeVuePerformanceEvidence(evidence.collection.machine) !==
    serializeVuePerformanceEvidence(eligibility.machine)
  )
    throw new Error("Vue performance collection machine differs from eligibility");
  const accepted = validateVuePerformanceEvidence(JSON.parse(readFile(jsonPath, "utf8")));
  if (serializeVuePerformanceEvidence(accepted) !== serializeVuePerformanceEvidence(evidence))
    throw new Error("Vue performance manifest does not match atomic row files");
  if (readFile(markdownPath, "utf8") !== renderMarkdown(evidence))
    throw new Error("Vue performance Markdown does not match accepted JSON evidence");
  return evidence;
}

export function assertVuePerformanceBaselinePlatform(environment) {
  const nodeMajor = Number.parseInt(environment.nodeVersion.split(".")[0], 10);
  if (environment.platform !== "linux" || environment.architecture !== "x64" || nodeMajor !== 24)
    throw new Error("Vue performance baseline requires Linux x86_64 and Node 24");
}

export function createVuePerformanceAudit({ contents, source }) {
  const text = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  return Object.freeze({
    sha256: createHash("sha256").update(text).digest("hex"),
    source: nonempty(source, "audit source"),
  });
}

export function serializeVuePerformanceEvidence(value) {
  return `${JSON.stringify(sortJson(value), null, 2)}\n`;
}

function normalizeRunRows(rows, { enforcePlan = false } = {}) {
  if (!Array.isArray(rows) || rows.length === 0)
    throw new Error("Vue performance run rows must be nonempty");
  const normalized = rows.map((row) => {
    requireObject(row, "Vue performance row");
    requireExactKeys(row, ["errors", "id", "lifecycle", "result"]);
    if (normalizeErrors(row.errors, `${row.id} errors`).length)
      throw new Error(`Vue performance row failed: ${row.id}`);
    requireObject(row.lifecycle, `${row.id} lifecycle`);
    requireExactKeys(row.lifecycle, ["endpointVisible", "overlayEmpty", "passed", "rootEmpty"]);
    if (Object.values(row.lifecycle).some((value) => value !== true))
      throw new Error(`Vue performance lifecycle failed: ${row.id}`);
    validateRuntimePerformanceResult(row.result);
    const planRow = vuePerformanceProviderRows.find(({ id }) => id === row.id);
    if (!planRow) throw new Error(`Unknown Vue performance row: ${row.id}`);
    if (`${row.result.scenario}:${row.result.provider}` !== row.id)
      throw new Error(`Vue performance result identity differs: ${row.id}`);
    if (enforcePlan && (row.result.metric !== planRow.metric || row.result.samples.length !== 5))
      throw new Error(`Vue performance sample or metric differs from the frozen plan: ${row.id}`);
    const result = createRuntimePerformanceResult(row.result);
    return {
      errors: [],
      id: row.id,
      lifecycle: { ...row.lifecycle },
      result,
    };
  });
  const duplicate = findDuplicate(normalized.map(({ id }) => id));
  if (duplicate) throw new Error(`Duplicate Vue performance row: ${duplicate}`);
  return normalized;
}

function withP95(result) {
  return createRuntimePerformanceResult({
    metric: result.metric,
    provider: result.provider,
    samples: result.samples,
    scenario: result.scenario,
  });
}

function withoutP95(result) {
  return {
    medianMs: result.medianMs,
    metric: result.metric,
    provider: result.provider,
    samples: [...result.samples],
    scenario: result.scenario,
  };
}

function assertCollectionIdentity(rows) {
  const first = rows[0];
  for (const row of rows.slice(1)) {
    if (row.environment.commit !== first.environment.commit)
      throw new Error("Vue performance collection has mixed revisions");
    if (environmentIdentity(row.environment) !== environmentIdentity(first.environment))
      throw new Error("Vue performance collection has mixed environments");
    if (
      serializeVuePerformanceEvidence(row.machine) !==
      serializeVuePerformanceEvidence(first.machine)
    )
      throw new Error("Vue performance collection has mixed machines");
  }
}

function environmentIdentity(environment) {
  return serializeVuePerformanceEvidence(environment);
}

function normalizeAudit(audit, { canonical = false } = {}) {
  requireObject(audit, "audit");
  requireExactKeys(audit, ["sha256", "source"]);
  nonempty(audit.source, "audit source");
  if (canonical && audit.source !== VUE_PERFORMANCE_REKA_AUDIT_SOURCE)
    throw new Error("Vue performance audit source differs from the reviewed audit");
  if (!/^[a-f0-9]{64}$/.test(audit.sha256)) throw new Error("audit sha256 must be lowercase hex");
  return { ...audit };
}

function normalizeMachine(machine) {
  requireObject(machine, "machine");
  requireExactKeys(machine, ["cpuModel", "logicalCoreCount"]);
  return {
    cpuModel: nonempty(machine.cpuModel, "machine.cpuModel"),
    logicalCoreCount: positiveInteger(machine.logicalCoreCount, "machine.logicalCoreCount"),
  };
}

function assertBaselineCommand(command, rowId) {
  const normalized = normalizeCommand(command);
  if (
    normalized.executable !== VUE_PERFORMANCE_BASELINE_COMMAND.executable ||
    !normalized.arguments.includes("--baseline")
  )
    throw new Error("Vue performance baseline command policy differs");
  const row = vuePerformanceProviderRows.find(({ id }) => id === rowId);
  const text = normalized.arguments.join(" ");
  if (text.includes("--scenario") && !text.includes(row.scenario))
    throw new Error("Vue performance baseline command selection differs");
  if (text.includes("--provider") && !text.includes(row.provider))
    throw new Error("Vue performance baseline command selection differs");
}

function assertBaselineFlags(flags, rowId) {
  const normalized = normalizeFlags(flags);
  const row = vuePerformanceProviderRows.find(({ id }) => id === rowId);
  const controls = {
    garbageCollectionPolicy: VUE_PERFORMANCE_BASELINE_CONTROLS.garbageCollectionPolicy,
    mountSampling: VUE_PERFORMANCE_MOUNT_SAMPLING_CONTROL,
    rows: [{ cpuThrottle: row.cpuThrottle, id: row.id, warmupCount: 0, withinRunSampleCount: 5 }],
  };
  if (
    normalized.mode !== "baseline" ||
    normalized.focused !== true ||
    normalized.smoke !== false ||
    serializeVuePerformanceEvidence(normalized.providers) !==
      serializeVuePerformanceEvidence([row.provider]) ||
    serializeVuePerformanceEvidence(normalized.scenarios) !==
      serializeVuePerformanceEvidence([row.scenario]) ||
    serializeVuePerformanceEvidence(normalized.controls) !==
      serializeVuePerformanceEvidence(controls)
  )
    throw new Error("Vue performance baseline flags differ");
}

function assertBaselineEnvironment(environment) {
  if (JSON.stringify(environment.viewport) !== JSON.stringify(VUE_PERFORMANCE_BASELINE_VIEWPORT))
    throw new Error("Vue performance baseline viewport differs");
  if (environment.browserName !== "chromium")
    throw new Error("Vue performance baseline browser must be Chromium");
  if (environment.framework !== `Vue ${environment.packageVersions.vue}`)
    throw new Error("Vue performance framework identity differs from the resolved Vue package");
  for (const [name, version] of Object.entries({
    ...zagVueExpectedResolvedVersions,
    ...rekaUiExpectedResolvedVersions,
  }))
    if (environment.packageVersions[name] !== version)
      throw new Error(`Vue performance comparator version differs: ${name}`);
  for (const name of ["@starwind-ui/runtime", "@starwind-ui/vue", "vue"])
    nonempty(environment.packageVersions[name], `package version ${name}`);
  for (const name of TOOLCHAIN_PACKAGES) {
    const version = nonempty(environment.packageVersions[name], `package version ${name}`);
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version))
      throw new Error(`Vue performance package version ${name} must be exact`);
  }
}

function normalizeCommand(command) {
  requireObject(command, "command");
  requireExactKeys(command, ["arguments", "executable"]);
  if (!Array.isArray(command.arguments)) throw new Error("command.arguments must be an array");
  return {
    executable: nonempty(command.executable, "command executable"),
    arguments: command.arguments.map((value) => nonempty(value, "command argument")),
  };
}
function normalizeFlags(flags) {
  requireObject(flags, "flags");
  return Object.fromEntries(
    Object.entries(flags)
      .sort(([a], [b]) => a.localeCompare(b, "en"))
      .map(([key, value]) => [nonempty(key, "flag key"), value]),
  );
}
function normalizeErrors(errors, label) {
  if (!Array.isArray(errors)) throw new Error(`${label} must be an array`);
  return errors.map((error) => nonempty(error, label));
}
function expectExactIds(actual, expected, label) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(`${label} differ from the frozen plan`);
}
function isoDate(value, label) {
  const text = value instanceof Date ? value.toISOString() : value;
  if (typeof text !== "string" || new Date(text).toISOString() !== text)
    throw new Error(`${label} must be an ISO timestamp`);
  return text;
}
function positiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0)
    throw new Error(`${label} must be a positive integer`);
  return value;
}
function nonempty(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be nonempty`);
  return value;
}
function requireObject(value, label) {
  if (value == null || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label} must be an object`);
}
function requireExactKeys(value, keys) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(`Fields differ: expected ${expected.join(", ")}`);
}
function findDuplicate(values) {
  const seen = new Set();
  return values.find((value) => (seen.has(value) ? true : !seen.add(value)));
}
function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort((a, b) => a.localeCompare(b, "en"))
        .map((key) => [key, sortJson(value[key])]),
    );
  return value;
}
function deepFreeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(deepFreeze));
  if (value && typeof value === "object")
    return Object.freeze(
      Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepFreeze(item)])),
    );
  return value;
}
