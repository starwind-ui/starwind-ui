import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

export const PACKAGE_SIZE_EVIDENCE_SCHEMA = "starwind.package-size.run-evidence";
export const PACKAGE_SIZE_EVIDENCE_SCHEMA_VERSION = 1;
export const PACKAGE_SIZE_BASELINE_PLATFORM = Object.freeze({
  architecture: "x64",
  nodeMajor: 24,
  platform: "linux",
});

const requiredEnvironmentKeys = [
  "architecture",
  "esbuildVersion",
  "kernelRelease",
  "nodeVersion",
  "npmVersion",
  "osName",
  "osRelease",
  "platform",
  "pnpmVersion",
  "zlibVersion",
];
const runRecordKeys = [
  "command",
  "commit",
  "comparator",
  "complete",
  "diagnosticPath",
  "environment",
  "flags",
  "packageVersions",
  "rows",
  "schema",
  "schemaVersion",
];
const semanticVersionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const nativeRuntimeVersionPattern =
  /^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*))+(?:-[0-9A-Za-z]+(?:-[0-9A-Za-z]+)*)?$/;

export function collectPackageSizeEnvironment({
  esbuildVersion,
  execute = executeVersionCommand,
} = {}) {
  return normalizeEnvironment({
    architecture: process.arch,
    esbuildVersion,
    kernelRelease: os.release(),
    nodeVersion: process.versions.node,
    npmVersion: execute("npm", ["--version"]),
    osName: os.type(),
    osRelease: os.version(),
    platform: process.platform,
    pnpmVersion: execute("pnpm", ["--version"]),
    zlibVersion: process.versions.zlib,
  });
}

export function createPackageSizeRunDirectory({ parentDirectory, prefix = "run-" }) {
  requireNonemptyString(parentDirectory, "parentDirectory");
  requireSafePathSegment(prefix, "prefix");
  const resolvedParent = path.resolve(parentDirectory);
  mkdirSync(resolvedParent, { recursive: true });
  const runDirectory = path.resolve(mkdtempSync(path.join(resolvedParent, prefix)));
  const relativeRunDirectory = path.relative(resolvedParent, runDirectory);
  if (
    relativeRunDirectory.length === 0 ||
    relativeRunDirectory === ".." ||
    relativeRunDirectory.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeRunDirectory)
  ) {
    throw new Error("runDirectory must be a strict descendant of parentDirectory");
  }
  const paths = {
    comparatorInstall: path.join(runDirectory, "comparator-install"),
    esbuildOutput: path.join(runDirectory, "esbuild-output"),
    npmCache: path.join(runDirectory, "npm-cache"),
    packOutput: path.join(runDirectory, "pack-output"),
    rawEvidence: path.join(runDirectory, "raw-evidence"),
    runDirectory,
  };

  for (const childPath of Object.values(paths)) {
    mkdirSync(childPath, { recursive: true });
  }

  return Object.freeze(paths);
}

export function createPackageSizeRunRecord({
  command,
  commit,
  comparator,
  complete = true,
  diagnosticPath,
  environment,
  flags = {},
  packageVersions = {},
  rows,
}) {
  const record = {
    schema: PACKAGE_SIZE_EVIDENCE_SCHEMA,
    schemaVersion: PACKAGE_SIZE_EVIDENCE_SCHEMA_VERSION,
    commit,
    environment: normalizeEnvironment(environment),
    command: normalizeCommand(command),
    flags: normalizeStringMap(flags, "flags"),
    comparator: normalizeComparator(comparator),
    packageVersions: normalizeVersionMap(packageVersions, "packageVersions"),
    complete,
    ...(diagnosticPath == null
      ? {}
      : { diagnosticPath: requireNonemptyString(diagnosticPath, "diagnosticPath") }),
    rows: normalizeRows(rows),
  };
  validatePackageSizeRunRecord(record, { allowIncomplete: true });
  return record;
}

export function validatePackageSizeRunRecord(
  record,
  { allowIncomplete = false, requireBaselinePlatform = false, requiredRowIds } = {},
) {
  requirePlainObject(record, "run evidence");
  requireExactKeys(record, runRecordKeys, "run evidence", { optional: ["diagnosticPath"] });
  if (record.schema !== PACKAGE_SIZE_EVIDENCE_SCHEMA) {
    throw new Error(`Unsupported package-size evidence schema: ${record.schema}`);
  }
  if (record.schemaVersion !== PACKAGE_SIZE_EVIDENCE_SCHEMA_VERSION) {
    throw new Error(`Unsupported package-size evidence schema version: ${record.schemaVersion}`);
  }
  requireNonemptyString(record.commit, "commit");
  if (!/^[a-f0-9]{40}$/.test(record.commit)) {
    throw new Error("commit must be a full lowercase 40-character Git SHA");
  }
  normalizeEnvironment(record.environment);
  normalizeCommand(record.command);
  normalizeStringMap(record.flags, "flags");
  normalizeComparator(record.comparator);
  normalizeVersionMap(record.packageVersions, "packageVersions");
  if (record.diagnosticPath != null) requireNonemptyString(record.diagnosticPath, "diagnosticPath");
  if (typeof record.complete !== "boolean") throw new Error("complete must be a boolean");
  if (record.complete !== true && !allowIncomplete)
    throw new Error("Package-size run is incomplete");
  const rows = normalizeRows(record.rows);

  if (requiredRowIds) {
    const expected = normalizeRequiredRowIds(requiredRowIds);
    const actual = rows.map((row) => row.id);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `Required package-size rows differ: expected ${expected.join(", ")}; received ${actual.join(", ")}`,
      );
    }
  }

  if (requireBaselinePlatform) assertPackageSizeBaselinePlatform(record.environment);
  return record;
}

export function assertPackageSizeBaselinePlatform(environment) {
  const normalized = normalizeEnvironment(environment);
  const nodeMajor = Number.parseInt(normalized.nodeVersion.split(".")[0], 10);
  if (
    normalized.platform !== PACKAGE_SIZE_BASELINE_PLATFORM.platform ||
    normalized.architecture !== PACKAGE_SIZE_BASELINE_PLATFORM.architecture ||
    nodeMajor !== PACKAGE_SIZE_BASELINE_PLATFORM.nodeMajor
  ) {
    throw new Error(
      "Baseline publication requires Linux x86_64 and Node 24 " +
        `(received ${normalized.platform} ${normalized.architecture}, Node ${normalized.nodeVersion})`,
    );
  }
}

export function evaluatePackageSizeRunStability({
  requireBaselinePlatform = true,
  requiredRowIds,
  runs,
}) {
  if (!Array.isArray(runs) || runs.length !== 3) {
    throw new Error(`Package-size stability requires exactly three runs; received ${runs?.length}`);
  }
  const required = normalizeRequiredRowIds(requiredRowIds);
  for (const run of runs) {
    validatePackageSizeRunRecord(run, { requireBaselinePlatform, requiredRowIds: required });
  }

  const identity = runIdentity(runs[0]);
  for (let index = 1; index < runs.length; index += 1) {
    if (runIdentity(runs[index]) !== identity) {
      throw new Error(`Package-size run ${index + 1} has mixed provenance`);
    }
  }

  const rowResults = required.map((id) => {
    const values = runs.map((run) => run.rows.find((row) => row.id === id).gzipBytes);
    const maximumBytes = Math.max(...values);
    const minimumBytes = Math.min(...values);
    const rangeBytes = maximumBytes - minimumBytes;
    const toleranceBytes = Math.max(Math.floor(maximumBytes * 0.01), 1024);
    return {
      id,
      values,
      minimumBytes,
      maximumBytes,
      rangeBytes,
      toleranceBytes,
      stable: rangeBytes <= toleranceBytes,
    };
  });
  const unstableRows = rowResults.filter((row) => !row.stable).map((row) => row.id);

  return {
    schema: PACKAGE_SIZE_EVIDENCE_SCHEMA,
    schemaVersion: PACKAGE_SIZE_EVIDENCE_SCHEMA_VERSION,
    commit: runs[0].commit,
    environment: runs[0].environment,
    requiredRowIds: required,
    runCount: runs.length,
    stable: unstableRows.length === 0,
    unstableRows,
    rows: rowResults,
  };
}

export function buildPackageSizeBaselineCeilingCandidates(stability, rowIds) {
  requirePlainObject(stability, "stability");
  if (stability.stable !== true) {
    throw new Error("Cannot derive package-size ceilings from unstable evidence");
  }
  const selected = normalizeRequiredRowIds(rowIds);
  return selected.map((id) => {
    const row = stability.rows?.find((candidate) => candidate.id === id);
    if (!row?.stable || !isNonnegativeInteger(row.maximumBytes)) {
      throw new Error(`Missing stable package-size row for ceiling: ${id}`);
    }
    const headroomBytes = Math.max(Math.ceil(row.maximumBytes * 0.05), 1024);
    return {
      id,
      maximumBytes: row.maximumBytes,
      headroomBytes,
      ceilingBytes: row.maximumBytes + headroomBytes,
      values: [...row.values],
    };
  });
}

export function serializePackageSizeEvidence(value) {
  return `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;
}

export function publishAcceptedPackageSizeArtifacts({
  artifacts,
  beforeReplace,
  evidence,
  replaceArtifact = renameSync,
  requiredRowIds,
  rollbackArtifact = renameSync,
}) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    throw new Error("Accepted package-size publication requires at least one artifact");
  }
  const stability = evaluatePackageSizeRunStability({
    requireBaselinePlatform: true,
    requiredRowIds,
    runs: evidence,
  });
  if (!stability.stable) {
    throw new Error(`Unstable package-size rows: ${stability.unstableRows.join(", ")}`);
  }

  const normalizedArtifacts = artifacts.map(normalizeArtifact);
  const duplicateDestination = findDuplicate(
    normalizedArtifacts.map(({ destination }) => destination),
  );
  if (duplicateDestination) {
    throw new Error(`Duplicate accepted artifact destination: ${duplicateDestination}`);
  }

  const staged = normalizedArtifacts.map((artifact) => {
    mkdirSync(path.dirname(artifact.destination), { recursive: true });
    const stagingPath = path.join(
      path.dirname(artifact.destination),
      `.${path.basename(artifact.destination)}.stage-${randomUUID()}`,
    );
    const handle = openSync(stagingPath, "wx", 0o600);
    try {
      writeFileSync(handle, artifact.contents);
    } finally {
      closeSync(handle);
    }
    artifact.validate?.(artifact.contents);
    return { destination: artifact.destination, stagingPath };
  });

  beforeReplace?.({ staged, stability });
  if (typeof replaceArtifact !== "function") {
    throw new Error("replaceArtifact must be a function");
  }
  if (typeof rollbackArtifact !== "function") {
    throw new Error("rollbackArtifact must be a function");
  }

  const transaction = staged.map((artifact) => {
    const hadDestination = existsSync(artifact.destination);
    return {
      ...artifact,
      backupPath: path.join(
        path.dirname(artifact.destination),
        `.${path.basename(artifact.destination)}.backup-${randomUUID()}`,
      ),
      hadDestination,
      originalContents: hadDestination ? readFileSync(artifact.destination) : undefined,
    };
  });

  try {
    for (const artifact of transaction) {
      if (artifact.hadDestination) renameSync(artifact.destination, artifact.backupPath);
    }
    for (const artifact of transaction) {
      replaceArtifact(artifact.stagingPath, artifact.destination);
    }
  } catch (error) {
    const rollbackErrors = rollbackArtifactTransaction(transaction, rollbackArtifact);
    const diagnostics = createPublicationDiagnostics({
      evidence,
      rollbackErrors,
      stability,
      transaction,
    });
    attachPublicationDiagnostics(error, diagnostics);
    if (rollbackErrors.length > 0) {
      const aggregateError = new AggregateError(
        [error, ...rollbackErrors],
        "Accepted package-size publication failed and rollback could not restore every artifact",
      );
      attachPublicationDiagnostics(aggregateError, diagnostics);
      throw aggregateError;
    }
    throw error;
  }

  const retainedBackups = [];
  for (const artifact of transaction) {
    if (!artifact.hadDestination) continue;
    try {
      unlinkSync(artifact.backupPath);
    } catch {
      retainedBackups.push(artifact.backupPath);
    }
  }
  return {
    published: staged.map(({ destination }) => destination),
    retainedBackups,
    stability,
  };
}

function executeVersionCommand(command, args) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

function normalizeEnvironment(environment) {
  requirePlainObject(environment, "environment");
  requireExactKeys(environment, requiredEnvironmentKeys, "environment");
  const normalized = {};
  for (const key of requiredEnvironmentKeys) {
    if (key === "zlibVersion") {
      requireNativeRuntimeVersion(environment[key], `environment.${key}`);
    } else {
      requireNonemptyString(environment[key], `environment.${key}`);
    }
    normalized[key] = environment[key];
  }
  for (const key of ["esbuildVersion", "nodeVersion", "npmVersion", "pnpmVersion"]) {
    requireSemanticVersion(normalized[key], `environment.${key}`);
  }
  return normalized;
}

function normalizeCommand(command) {
  requirePlainObject(command, "command");
  requireExactKeys(command, ["arguments", "executable"], "command");
  requireNonemptyString(command.executable, "command.executable");
  if (
    !Array.isArray(command.arguments) ||
    command.arguments.some((value) => typeof value !== "string")
  ) {
    throw new Error("command.arguments must be an array of strings");
  }
  return { executable: command.executable, arguments: [...command.arguments] };
}

function normalizeComparator(comparator) {
  requirePlainObject(comparator, "comparator");
  requireExactKeys(comparator, ["name", "packages", "version"], "comparator", {
    optional: ["packages"],
  });
  requireNonemptyString(comparator.name, "comparator.name");
  requireSemanticVersion(comparator.version, "comparator.version");
  return {
    name: comparator.name,
    version: comparator.version,
    packages: normalizeVersionMap(comparator.packages ?? {}, "comparator.packages"),
  };
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) throw new Error("rows must be an array");
  const normalized = rows.map((row, index) => {
    requirePlainObject(row, `rows[${index}]`);
    requireExactKeys(row, ["gzipBytes", "id"], `rows[${index}]`);
    requireNonemptyString(row.id, `rows[${index}].id`);
    if (!isNonnegativeInteger(row.gzipBytes)) {
      throw new Error(`rows[${index}].gzipBytes must be a finite nonnegative integer`);
    }
    return { id: row.id, gzipBytes: row.gzipBytes };
  });
  normalized.sort((left, right) => left.id.localeCompare(right.id, "en"));
  const duplicate = findDuplicate(normalized.map((row) => row.id));
  if (duplicate) throw new Error(`Duplicate package-size row: ${duplicate}`);
  return normalized;
}

function normalizeRequiredRowIds(rowIds) {
  if (!Array.isArray(rowIds) || rowIds.length === 0) {
    throw new Error("requiredRowIds must be a nonempty array");
  }
  const normalized = [...rowIds];
  for (const [index, id] of normalized.entries()) {
    requireNonemptyString(id, `requiredRowIds[${index}]`);
  }
  normalized.sort((left, right) => left.localeCompare(right, "en"));
  const duplicate = findDuplicate(normalized);
  if (duplicate) throw new Error(`Duplicate required package-size row: ${duplicate}`);
  return normalized;
}

function normalizeStringMap(value, label) {
  requirePlainObject(value, label);
  const normalized = {};
  for (const key of Object.keys(value).sort((left, right) => left.localeCompare(right, "en"))) {
    requireNonemptyString(key, `${label} key`);
    const item = value[key];
    if (
      !["boolean", "number", "string"].includes(typeof item) ||
      (typeof item === "number" && !Number.isFinite(item))
    ) {
      throw new Error(`${label}.${key} must be a finite scalar`);
    }
    if (typeof item === "string" && item.length === 0) {
      throw new Error(`${label}.${key} must be a nonempty string`);
    }
    normalized[key] = item;
  }
  return normalized;
}

function normalizeVersionMap(value, label) {
  const normalized = normalizeStringMap(value, label);
  for (const [key, version] of Object.entries(normalized)) {
    requireSemanticVersion(version, `${label}.${key}`);
  }
  return normalized;
}

function rollbackArtifactTransaction(transaction, rollbackArtifact) {
  const errors = [];

  for (const artifact of [...transaction].reverse()) {
    try {
      if (!existsSync(artifact.stagingPath) && existsSync(artifact.destination)) {
        rollbackArtifact(artifact.destination, artifact.stagingPath);
      }
    } catch (error) {
      errors.push(error);
    }
  }

  for (const artifact of [...transaction].reverse()) {
    try {
      if (artifact.hadDestination && existsSync(artifact.backupPath)) {
        rollbackArtifact(artifact.backupPath, artifact.destination);
      }
    } catch (error) {
      errors.push(error);
    }
  }

  for (const artifact of transaction) {
    try {
      if (existsSync(artifact.destination) !== artifact.hadDestination) {
        throw new Error(`Rollback changed destination existence: ${artifact.destination}`);
      }
      if (
        artifact.hadDestination &&
        !readFileSync(artifact.destination).equals(artifact.originalContents)
      ) {
        throw new Error(`Rollback changed accepted artifact bytes: ${artifact.destination}`);
      }
    } catch (error) {
      errors.push(error);
    }
  }

  return errors;
}

function createPublicationDiagnostics({ evidence, rollbackErrors, stability, transaction }) {
  return {
    destinations: transaction.map(inspectDestinationAfterRollback),
    diagnosticPaths: evidence
      .map((run) => run.diagnosticPath)
      .filter((diagnosticPath) => diagnosticPath != null),
    rollback: {
      complete: rollbackErrors.length === 0,
      errors: rollbackErrors.map((error) => error.message),
      retainedBackups: transaction
        .filter((artifact) => existsSync(artifact.backupPath))
        .map((artifact) => artifact.backupPath),
    },
    staged: transaction.map(({ destination, stagingPath }) => ({
      destination,
      retained: existsSync(stagingPath),
      stagingPath,
    })),
    stability,
  };
}

function inspectDestinationAfterRollback(artifact) {
  const existsAfter = existsSync(artifact.destination);
  let observationError;
  let restored = existsAfter === artifact.hadDestination && !artifact.hadDestination;
  if (existsAfter && artifact.hadDestination) {
    try {
      restored = readFileSync(artifact.destination).equals(artifact.originalContents);
    } catch (error) {
      observationError = error.message;
      restored = false;
    }
  }
  return {
    destination: artifact.destination,
    existedBefore: artifact.hadDestination,
    existsAfter,
    ...(observationError == null ? {} : { observationError }),
    restored,
  };
}

function attachPublicationDiagnostics(error, diagnostics) {
  if (!error || (typeof error !== "object" && typeof error !== "function")) return;
  error.packageSizePublication = diagnostics;
}

function runIdentity(run) {
  return serializePackageSizeEvidence({
    command: run.command,
    commit: run.commit,
    comparator: run.comparator,
    environment: run.environment,
    flags: run.flags,
    packageVersions: run.packageVersions,
    rowIds: normalizeRows(run.rows).map((row) => row.id),
  });
}

function normalizeArtifact(artifact) {
  requirePlainObject(artifact, "artifact");
  requireNonemptyString(artifact.destination, "artifact.destination");
  if (!path.isAbsolute(artifact.destination)) {
    throw new Error(`Artifact destination must be absolute: ${artifact.destination}`);
  }
  const contents = Buffer.isBuffer(artifact.contents)
    ? artifact.contents
    : typeof artifact.contents === "string"
      ? artifact.contents
      : serializePackageSizeEvidence(artifact.contents);
  if (artifact.validate != null && typeof artifact.validate !== "function") {
    throw new Error("artifact.validate must be a function");
  }
  return { contents, destination: path.resolve(artifact.destination), validate: artifact.validate };
}

function sortJsonValue(value) {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right, "en"))
        .map((key) => [key, sortJsonValue(value[key])]),
    );
  }
  return value;
}

function findDuplicate(values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return undefined;
}

function requirePlainObject(value, label) {
  const prototype = value && typeof value === "object" ? Object.getPrototypeOf(value) : undefined;
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (prototype !== Object.prototype && prototype !== null)
  ) {
    throw new Error(`${label} must be an object`);
  }
}

function requireExactKeys(value, allowedKeys, label, { optional = [] } = {}) {
  const allowed = new Set(allowedKeys);
  const optionalKeys = new Set(optional);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new Error(`${label} has unknown field: ${unknown[0]}`);
  const missing = allowedKeys.filter((key) => !optionalKeys.has(key) && !(key in value));
  if (missing.length > 0) throw new Error(`${label} is missing field: ${missing[0]}`);
}

function requireSemanticVersion(value, label) {
  requireNonemptyString(value, label);
  if (!semanticVersionPattern.test(value)) {
    throw new Error(`${label} must be a valid semantic version`);
  }
  return value;
}

function requireNativeRuntimeVersion(value, label) {
  if (typeof value !== "string" || !nativeRuntimeVersionPattern.test(value)) {
    throw new Error(`${label} must be a valid native runtime version`);
  }
  return value;
}

function requireSafePathSegment(value, label) {
  requireNonemptyString(value, label);
  if (
    path.isAbsolute(value) ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    value.includes("\\") ||
    !/^[A-Za-z0-9._-]+$/.test(value)
  ) {
    throw new Error(`${label} must be one safe path segment`);
  }
  return value;
}

function requireNonemptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a nonempty string`);
  }
  return value;
}

function isNonnegativeInteger(value) {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}
