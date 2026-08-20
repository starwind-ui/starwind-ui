import { randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { serializePackageSizeEvidence } from "./package-size-run-evidence.mjs";
import {
  buildVueBaselineEvidence,
  VUE_BASELINE_REQUIRED_ROW_IDS,
} from "./package-size-vue-baseline-runner.mjs";
import { vuePackageSizeBaseline } from "./vue-package-size-baseline.mjs";

export const PACKAGE_SIZE_OPTIMIZATION_SCHEMA = "starwind.package-size.optimization-evidence";
export const PACKAGE_SIZE_OPTIMIZATION_SCHEMA_VERSION = 1;

const FEATURE_EVIDENCE_DIRECTORY = ".scratch/vue-adapter-optimization-and-portal-parity/evidence";
const MEASUREMENT_SCRIPT = "scripts/portable-runtime/measure-package-sizes.mjs";
const evaluationModes = new Set(["advisory", "threshold"]);

export function buildPackageSizeOptimizationEvidence({
  afterRuns,
  beforeRuns,
  behaviorGates,
  candidateCommit,
  candidateId,
  evaluationMode,
  label,
  predecessorCommit,
  retentionRowIds,
}) {
  requireSafeCandidateId(candidateId);
  requireNonemptyString(label, "label");
  requireCommit(predecessorCommit, "predecessorCommit");
  requireCommit(candidateCommit, "candidateCommit");
  if (predecessorCommit === candidateCommit) {
    throw new Error("Candidate commit must differ from its predecessor commit");
  }
  if (!evaluationModes.has(evaluationMode)) {
    throw new Error(`Unsupported optimization evaluation mode: ${evaluationMode}`);
  }

  const normalizedRetentionRows = normalizeRetentionRows(retentionRowIds);
  const normalizedBehaviorGates = normalizeBehaviorGates(behaviorGates);
  const before = buildStableRunSet(beforeRuns, predecessorCommit, "predecessor");
  const after = buildStableRunSet(afterRuns, candidateCommit, "candidate");
  assertDisjointRunDirectories(before.runs, after.runs);
  assertMatchingToolProvenance(before.runs[0], after.runs[0]);

  const beforeRows = new Map(before.stability.rows.map((row) => [row.id, row]));
  const afterRows = new Map(after.stability.rows.map((row) => [row.id, row]));
  const budgetByRow = new Map(
    Object.entries(vuePackageSizeBaseline.budgets).map(([id, budget]) => [id, budget]),
  );
  const retentionRows = new Set(normalizedRetentionRows);
  const comparisons = VUE_BASELINE_REQUIRED_ROW_IDS.map((id) => {
    const beforeRow = beforeRows.get(id);
    const afterRow = afterRows.get(id);
    const improvementBytes = beforeRow.maximumBytes - afterRow.maximumBytes;
    const improvementPercent = roundPercentage(
      beforeRow.maximumBytes === 0 ? 0 : (improvementBytes / beforeRow.maximumBytes) * 100,
    );
    const requiredImprovementBytes = Math.max(1024, Math.ceil(beforeRow.maximumBytes * 0.01));
    const retentionThresholdMet = improvementBytes >= requiredImprovementBytes;
    const adoptedBudget = budgetByRow.get(id);

    return {
      id,
      beforeValues: [...beforeRow.values],
      beforeMaximumBytes: beforeRow.maximumBytes,
      afterValues: [...afterRow.values],
      afterMaximumBytes: afterRow.maximumBytes,
      improvementBytes,
      improvementPercent,
      requiredImprovementBytes,
      retentionRow: retentionRows.has(id),
      retentionThresholdMet,
      thresholdDisposition: retentionThresholdMet ? "retained" : "rejected",
      budget: adoptedBudget
        ? {
            ceilingBytes: adoptedBudget.ceilingBytes,
            passed: afterRow.maximumBytes <= adoptedBudget.ceilingBytes,
          }
        : null,
    };
  });

  const budgetResults = [...budgetByRow]
    .map(([id, budget]) => {
      const maximumBytes = afterRows.get(id).maximumBytes;
      return {
        id,
        maximumBytes,
        ceilingBytes: budget.ceilingBytes,
        passed: maximumBytes <= budget.ceilingBytes,
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id, "en"));
  const budgetsPass = budgetResults.every(({ passed }) => passed);
  const behaviorGatesPass = normalizedBehaviorGates.every(({ passed }) => passed);
  const retentionRowsPass = comparisons
    .filter(({ retentionRow }) => retentionRow)
    .every(({ retentionThresholdMet }) => retentionThresholdMet);
  const decision = decideCandidate({
    behaviorGatesPass,
    budgetsPass,
    evaluationMode,
    retentionRowsPass,
  });

  return {
    schema: PACKAGE_SIZE_OPTIMIZATION_SCHEMA,
    schemaVersion: PACKAGE_SIZE_OPTIMIZATION_SCHEMA_VERSION,
    candidate: {
      id: candidateId,
      label,
      evaluationMode,
      predecessorCommit,
      candidateCommit,
      retentionRowIds: normalizedRetentionRows,
      behaviorGates: normalizedBehaviorGates,
    },
    before,
    after,
    comparisons,
    budgetResults,
    decision,
  };
}

export function validatePackageSizeOptimizationEvidence(evidence) {
  requirePlainObject(evidence, "optimization evidence");
  requireExactKeys(evidence, [
    "after",
    "before",
    "budgetResults",
    "candidate",
    "comparisons",
    "decision",
    "schema",
    "schemaVersion",
  ]);
  if (evidence.schema !== PACKAGE_SIZE_OPTIMIZATION_SCHEMA) {
    throw new Error(`Unsupported package-size optimization schema: ${evidence.schema}`);
  }
  if (evidence.schemaVersion !== PACKAGE_SIZE_OPTIMIZATION_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported package-size optimization schema version: ${evidence.schemaVersion}`,
    );
  }
  requirePlainObject(evidence.candidate, "optimization evidence.candidate");
  requireExactKeys(evidence.candidate, [
    "behaviorGates",
    "candidateCommit",
    "evaluationMode",
    "id",
    "label",
    "predecessorCommit",
    "retentionRowIds",
  ]);

  const rebuilt = buildPackageSizeOptimizationEvidence({
    afterRuns: evidence.after?.runs,
    beforeRuns: evidence.before?.runs,
    behaviorGates: evidence.candidate.behaviorGates,
    candidateCommit: evidence.candidate.candidateCommit,
    candidateId: evidence.candidate.id,
    evaluationMode: evidence.candidate.evaluationMode,
    label: evidence.candidate.label,
    predecessorCommit: evidence.candidate.predecessorCommit,
    retentionRowIds: evidence.candidate.retentionRowIds,
  });
  if (
    serializePackageSizeOptimizationEvidence(evidence) !==
    serializePackageSizeOptimizationEvidence(rebuilt)
  ) {
    throw new Error("Package-size optimization evidence does not match its raw runs");
  }
  return rebuilt;
}

export function serializePackageSizeOptimizationEvidence(evidence) {
  return serializePackageSizeEvidence(evidence);
}

export function renderPackageSizeOptimizationMarkdown(evidence) {
  const rebuilt = validatePackageSizeOptimizationEvidence(evidence);
  const { candidate, decision } = rebuilt;
  const environment = rebuilt.before.stability.environment;
  const lines = [
    `# ${candidate.label}`,
    "",
    `Candidate id: \`${candidate.id}\``,
    "",
    `Predecessor: \`${candidate.predecessorCommit}\``,
    "",
    `Candidate: \`${candidate.candidateCommit}\``,
    "",
    `Environment: ${environment.osName} ${environment.osRelease}; ${environment.platform} ${environment.architecture}; Node ${environment.nodeVersion}; pnpm ${environment.pnpmVersion}; esbuild ${environment.esbuildVersion}; zlib ${environment.zlibVersion}.`,
    "",
    `Evaluation mode: \`${candidate.evaluationMode}\``,
    "",
    `Disposition: **${decision.disposition}**. ${decision.reason}`,
    "",
    "## Stable comparison",
    "",
    "| Row id | Before max | After max | Improvement | Improvement % | Required | Threshold | Budget |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |",
    ...rebuilt.comparisons.map(
      (row) =>
        `| \`${row.id}\` | ${row.beforeMaximumBytes} | ${row.afterMaximumBytes} | ${row.improvementBytes} | ${row.improvementPercent}% | ${row.requiredImprovementBytes} | ${row.thresholdDisposition} | ${renderBudgetResult(row.budget)} |`,
    ),
    "",
    "## Behavior gates",
    "",
    "| Gate | Result |",
    "| --- | --- |",
    ...candidate.behaviorGates.map(
      (gate) => `| \`${gate.id}\` | ${gate.passed ? "Pass" : "Fail"} |`,
    ),
    "",
    "## Existing budgets",
    "",
    "| Row id | Candidate max | Ceiling | Result |",
    "| --- | ---: | ---: | --- |",
    ...rebuilt.budgetResults.map(
      (result) =>
        `| \`${result.id}\` | ${result.maximumBytes} | ${result.ceilingBytes} | ${result.passed ? "Pass" : "Fail"} |`,
    ),
    "",
  ];
  return lines.join("\n");
}

export function getPackageSizeOptimizationEvidencePaths({ candidateId, repoRoot = process.cwd() }) {
  requireSafeCandidateId(candidateId);
  const resolvedRepoRoot = path.resolve(repoRoot);
  const evidenceDirectory = path.join(resolvedRepoRoot, FEATURE_EVIDENCE_DIRECTORY);
  assertPathAncestryHasNoSymlinks(evidenceDirectory);
  const canonicalEvidenceDirectory = canonicalizePotentialPath(evidenceDirectory);
  const json = canonicalizePotentialPath(
    path.join(canonicalEvidenceDirectory, `${candidateId}.json`),
  );
  const markdown = canonicalizePotentialPath(
    path.join(canonicalEvidenceDirectory, `${candidateId}.md`),
  );
  assertStrictDescendant(canonicalEvidenceDirectory, json, "candidate JSON");
  assertStrictDescendant(canonicalEvidenceDirectory, markdown, "candidate Markdown");
  return Object.freeze({
    json,
    markdown,
  });
}

export function publishPackageSizeOptimizationEvidence({
  candidateId,
  evidence,
  publicationOptions = {},
  repoRoot = process.cwd(),
}) {
  let paths;
  let phase = "path-validation";
  let transaction = [];

  try {
    paths = getPackageSizeOptimizationEvidencePaths({ candidateId, repoRoot });
    phase = "validation";
    const validated = validatePackageSizeOptimizationEvidence(evidence);
    if (candidateId !== validated.candidate.id) {
      throw new Error("Publication candidate id must match the evidence candidate id");
    }
    const json = serializePackageSizeOptimizationEvidence(validated);
    const markdown = renderPackageSizeOptimizationMarkdown(validated);
    prevalidateCandidateArtifacts({ evidence: validated, json, markdown });
    transaction = createCandidateArtifactTransaction([
      { contents: json, destination: paths.json },
      { contents: markdown, destination: paths.markdown },
    ]);
    phase = "staging";
    stageCandidateArtifacts(transaction, publicationOptions.stageArtifact);
    phase = "staged-validation";
    validateStagedCandidateArtifacts(transaction);
    phase = "before-replace";
    publicationOptions.beforeReplace?.({
      staged: transaction.map(({ destination, stagingPath }) => ({ destination, stagingPath })),
    });
    phase = "staged-validation";
    validateStagedCandidateArtifacts(transaction);
    phase = "replacement";
    replaceCandidateArtifacts(transaction, publicationOptions.replaceArtifact);
    const retainedBackups = cleanupSuccessfulCandidatePublication(transaction);
    return {
      evidence: validated,
      paths,
      publication: {
        published: transaction.map(({ destination }) => destination),
        retainedBackups,
      },
    };
  } catch (error) {
    const rollback = rollbackCandidatePublication(transaction, publicationOptions.rollbackArtifact);
    attachCandidatePublicationDiagnostics(error, {
      candidateId,
      destinations: inspectCandidateDestinations(transaction),
      phase,
      rollback,
      staged: transaction.map(({ destination, stagingPath }) => ({
        destination,
        retained: existsSync(stagingPath),
        stagingPath,
      })),
    });
    throw error;
  }
}

export function runPackageSizeOptimizationEvidenceCommand({
  descriptorPath,
  repoRoot = process.cwd(),
  readFile = readFileSync,
  validateRepoRoot = assertStarwindRepositoryRoot,
}) {
  requireNonemptyString(descriptorPath, "descriptorPath");
  if (typeof validateRepoRoot !== "function") {
    throw new Error("validateRepoRoot must be a function");
  }
  const validatedRepoRoot = validateRepoRoot(repoRoot);
  requireNonemptyString(validatedRepoRoot, "validated repo root");
  const descriptor = JSON.parse(readFile(path.resolve(descriptorPath), "utf8"));
  requirePlainObject(descriptor, "optimization descriptor");
  requireExactKeys(descriptor, [
    "afterRuns",
    "beforeRuns",
    "behaviorGates",
    "candidateCommit",
    "candidateId",
    "evaluationMode",
    "label",
    "predecessorCommit",
    "retentionRowIds",
  ]);
  const evidence = buildPackageSizeOptimizationEvidence(descriptor);
  return publishPackageSizeOptimizationEvidence({
    candidateId: evidence.candidate.id,
    evidence,
    repoRoot: validatedRepoRoot,
  });
}

function buildStableRunSet(runs, expectedCommit, label) {
  for (const [index, run] of (runs ?? []).entries()) {
    if (run?.commit !== expectedCommit) {
      throw new Error(
        `Optimization ${label} run ${index + 1} does not match the ${label} commit ${expectedCommit}`,
      );
    }
  }
  const baseline = buildVueBaselineEvidence(runs);
  const diagnosticPaths = baseline.runs.map((run, index) => {
    if (typeof run.diagnosticPath !== "string" || !path.isAbsolute(run.diagnosticPath)) {
      throw new Error(
        `Optimization ${label} run ${index + 1} requires an absolute diagnostic path`,
      );
    }
    return path.resolve(run.diagnosticPath);
  });
  const duplicate = diagnosticPaths.find(
    (diagnosticPath, index) => diagnosticPaths.indexOf(diagnosticPath) !== index,
  );
  if (duplicate) {
    throw new Error(`Optimization ${label} runs reuse diagnostic path: ${duplicate}`);
  }
  return { runs: baseline.runs, stability: baseline.stability };
}

function assertDisjointRunDirectories(beforeRuns, afterRuns) {
  const beforePaths = new Set(beforeRuns.map((run) => path.resolve(run.diagnosticPath)));
  const collision = afterRuns
    .map((run) => path.resolve(run.diagnosticPath))
    .find((diagnosticPath) => beforePaths.has(diagnosticPath));
  if (collision) {
    throw new Error(`Optimization before and after runs reuse diagnostic path: ${collision}`);
  }
}

function assertMatchingToolProvenance(before, after) {
  const fields = ["environment", "comparator", "flags", "packageVersions"];
  for (const field of fields) {
    if (
      serializePackageSizeEvidence(before[field]) !== serializePackageSizeEvidence(after[field])
    ) {
      throw new Error(
        "Optimization run sets must use the same environment and tool provenance " +
          `(mismatch: ${field})`,
      );
    }
  }
  let beforeCommand;
  let afterCommand;
  try {
    beforeCommand = normalizeMeasurementCommand(before.command);
    afterCommand = normalizeMeasurementCommand(after.command);
  } catch (error) {
    throw new Error(
      `Optimization run sets use materially different measurement commands: ${error.message}`,
    );
  }
  if (serializePackageSizeEvidence(beforeCommand) !== serializePackageSizeEvidence(afterCommand)) {
    throw new Error("Optimization run sets use materially different measurement commands");
  }
}

function normalizeMeasurementCommand(command) {
  const measurementScript = path.normalize(command.arguments[0]);
  const expectedSuffix = `${path.sep}${MEASUREMENT_SCRIPT.split("/").join(path.sep)}`;
  if (!path.isAbsolute(measurementScript) || !measurementScript.endsWith(expectedSuffix)) {
    throw new Error(
      `Optimization run measurement command must use ${MEASUREMENT_SCRIPT} from its worktree root`,
    );
  }
  const worktreeRoot = measurementScript.slice(0, -expectedSuffix.length);
  if (path.join(worktreeRoot, MEASUREMENT_SCRIPT) !== measurementScript) {
    throw new Error("Optimization run measurement command has an invalid worktree root");
  }
  return {
    executable: command.executable,
    arguments: [`<worktree>/${MEASUREMENT_SCRIPT}`, ...command.arguments.slice(1)],
  };
}

function assertPathAncestryHasNoSymlinks(targetPath) {
  const resolved = path.resolve(targetPath);
  const { root } = path.parse(resolved);
  let current = root;
  for (const part of resolved.slice(root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      throw new Error(`Candidate publication path ancestry contains a symlink: ${current}`);
    }
  }
}

function canonicalizePotentialPath(targetPath) {
  const missingParts = [];
  let existingPath = path.resolve(targetPath);
  while (!existsSync(existingPath)) {
    const parent = path.dirname(existingPath);
    if (parent === existingPath) {
      throw new Error(`Candidate publication path has no existing ancestor: ${targetPath}`);
    }
    missingParts.unshift(path.basename(existingPath));
    existingPath = parent;
  }
  return path.join(realpathSync(existingPath), ...missingParts);
}

function assertStrictDescendant(directory, destination, label) {
  const relative = path.relative(directory, destination);
  if (
    relative.length === 0 ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Candidate ${label} must be a strict descendant of the feature directory`);
  }
}

function assertStarwindRepositoryRoot(repoRoot) {
  const resolved = path.resolve(repoRoot);
  assertPathAncestryHasNoSymlinks(resolved);
  const canonical = realpathSync(resolved);
  let packageManifest;
  try {
    packageManifest = JSON.parse(readFileSync(path.join(canonical, "package.json"), "utf8"));
  } catch {
    throw new Error(`Expected a Starwind repository root: ${resolved}`);
  }
  if (
    packageManifest.name !== "root" ||
    packageManifest.repository?.url !== "git+https://github.com/starwind-ui/starwind-ui.git" ||
    packageManifest.scripts?.["runtime:size:baseline:vue"] !==
      `node ${MEASUREMENT_SCRIPT} --baseline-vue` ||
    !existsSync(path.join(canonical, MEASUREMENT_SCRIPT))
  ) {
    throw new Error(`Expected a Starwind repository root: ${resolved}`);
  }
  return canonical;
}

function prevalidateCandidateArtifacts({ evidence, json, markdown }) {
  const parsed = JSON.parse(json);
  validatePackageSizeOptimizationEvidence(parsed);
  if (serializePackageSizeOptimizationEvidence(parsed) !== json) {
    throw new Error("Optimization JSON is not deterministic");
  }
  if (markdown !== renderPackageSizeOptimizationMarkdown(evidence)) {
    throw new Error("Optimization Markdown is not deterministic");
  }
}

function createCandidateArtifactTransaction(artifacts) {
  return artifacts.map(({ contents, destination }) => {
    const hadDestination = existsSync(destination);
    return {
      backupPath: path.join(
        path.dirname(destination),
        `.${path.basename(destination)}.backup-${randomUUID()}`,
      ),
      backupCreated: false,
      contents,
      destination,
      hadDestination,
      originalContents: hadDestination ? readFileSync(destination) : undefined,
      destinationReplaced: false,
      stagingPath: path.join(
        path.dirname(destination),
        `.${path.basename(destination)}.stage-${randomUUID()}`,
      ),
    };
  });
}

function stageCandidateArtifacts(transaction, stageArtifact = writeCandidateStage) {
  if (typeof stageArtifact !== "function") throw new Error("stageArtifact must be a function");
  for (const artifact of transaction) {
    mkdirSync(path.dirname(artifact.destination), { recursive: true });
    stageArtifact({
      contents: artifact.contents,
      destination: artifact.destination,
      stagingPath: artifact.stagingPath,
    });
    if (!existsSync(artifact.stagingPath)) {
      throw new Error(`Candidate staging did not create ${artifact.stagingPath}`);
    }
  }
}

function writeCandidateStage({ contents, stagingPath }) {
  const handle = openSync(stagingPath, "wx", 0o600);
  try {
    writeFileSync(handle, contents);
  } finally {
    closeSync(handle);
  }
}

function validateStagedCandidateArtifacts(transaction) {
  for (const artifact of transaction) {
    if (readFileSync(artifact.stagingPath, "utf8") !== artifact.contents) {
      throw new Error(`Staged candidate artifact differs: ${artifact.stagingPath}`);
    }
  }
}

function replaceCandidateArtifacts(transaction, replaceArtifact = renameSync) {
  if (typeof replaceArtifact !== "function") throw new Error("replaceArtifact must be a function");
  for (const artifact of transaction) {
    if (artifact.hadDestination) {
      renameSync(artifact.destination, artifact.backupPath);
      artifact.backupCreated = true;
    }
  }
  for (const artifact of transaction) {
    replaceArtifact(artifact.stagingPath, artifact.destination);
    artifact.destinationReplaced = true;
  }
}

function cleanupSuccessfulCandidatePublication(transaction) {
  const retainedBackups = [];
  for (const artifact of transaction) {
    if (!existsSync(artifact.backupPath)) continue;
    try {
      unlinkSync(artifact.backupPath);
    } catch {
      retainedBackups.push(artifact.backupPath);
    }
  }
  return retainedBackups;
}

function rollbackCandidatePublication(transaction, rollbackArtifact = renameSync) {
  const errors = [];
  let recoveredWithFallback = false;
  if (typeof rollbackArtifact !== "function") {
    errors.push("rollbackArtifact must be a function");
    rollbackArtifact = renameSync;
  }

  for (const artifact of [...transaction].reverse()) {
    if (artifact.destinationReplaced && existsSync(artifact.destination)) {
      const moved = rollbackMove(
        artifact.destination,
        artifact.stagingPath,
        rollbackArtifact,
        errors,
      );
      recoveredWithFallback ||= moved.recoveredWithFallback;
    }
    if (artifact.backupCreated && existsSync(artifact.backupPath)) {
      const restored = rollbackMove(
        artifact.backupPath,
        artifact.destination,
        rollbackArtifact,
        errors,
      );
      recoveredWithFallback ||= restored.recoveredWithFallback;
    }
  }

  for (const artifact of transaction) {
    if (existsSync(artifact.stagingPath)) {
      try {
        unlinkSync(artifact.stagingPath);
      } catch (error) {
        errors.push(`Cannot remove staged artifact ${artifact.stagingPath}: ${error.message}`);
      }
    }
  }

  for (const artifact of transaction) {
    try {
      if (artifact.hadDestination) {
        if (
          !existsSync(artifact.destination) ||
          !readFileSync(artifact.destination).equals(artifact.originalContents)
        ) {
          throw new Error(`Candidate rollback did not restore ${artifact.destination}`);
        }
      } else if (existsSync(artifact.destination)) {
        throw new Error(`Candidate rollback left new destination ${artifact.destination}`);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  const retainedBackups = transaction
    .filter(({ backupPath }) => existsSync(backupPath))
    .map(({ backupPath }) => backupPath);
  const retainedStaged = transaction
    .filter(({ stagingPath }) => existsSync(stagingPath))
    .map(({ stagingPath }) => stagingPath);
  const restorationErrors = errors.filter((message) =>
    /did not restore|left new destination|fallback failed|Cannot remove staged/.test(message),
  );
  return {
    complete: restorationErrors.length === 0,
    errors,
    recoveredWithFallback,
    retainedBackups,
    retainedStaged,
  };
}

function rollbackMove(source, destination, rollbackArtifact, errors) {
  try {
    rollbackArtifact(source, destination);
    return { recoveredWithFallback: false };
  } catch (error) {
    errors.push(`Rollback operation failed for ${source}: ${error.message}`);
    try {
      renameSync(source, destination);
      return { recoveredWithFallback: true };
    } catch (fallbackError) {
      errors.push(`Rollback fallback failed for ${source}: ${fallbackError.message}`);
      return { recoveredWithFallback: false };
    }
  }
}

function inspectCandidateDestinations(transaction) {
  return transaction.map((artifact) => {
    const existsAfter = existsSync(artifact.destination);
    let restored = existsAfter === artifact.hadDestination && !artifact.hadDestination;
    let observationError;
    if (artifact.hadDestination && existsAfter) {
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
  });
}

function attachCandidatePublicationDiagnostics(error, diagnostics) {
  if (!error || (typeof error !== "object" && typeof error !== "function")) return;
  error.packageSizeOptimizationPublication = diagnostics;
}

function decideCandidate({ behaviorGatesPass, budgetsPass, evaluationMode, retentionRowsPass }) {
  if (!budgetsPass) {
    return {
      behaviorGatesPass,
      budgetsPass,
      disposition: "rejected",
      reason: "One or more existing absolute budgets fail.",
      retentionRowsPass,
    };
  }
  if (!behaviorGatesPass) {
    return {
      behaviorGatesPass,
      budgetsPass,
      disposition: "rejected",
      reason: "One or more behavior gates fail.",
      retentionRowsPass,
    };
  }
  if (evaluationMode === "advisory") {
    return {
      behaviorGatesPass,
      budgetsPass,
      disposition: "recorded-advisory",
      reason: "The size effect is advisory for this contract-correctness change.",
      retentionRowsPass,
    };
  }
  if (!retentionRowsPass) {
    return {
      behaviorGatesPass,
      budgetsPass,
      disposition: "rejected",
      reason: "One or more retention rows miss the required size retention threshold.",
      retentionRowsPass,
    };
  }
  return {
    behaviorGatesPass,
    budgetsPass,
    disposition: "retained",
    reason: "Every retention row meets the size threshold and all gates pass.",
    retentionRowsPass,
  };
}

function normalizeRetentionRows(rowIds) {
  if (!Array.isArray(rowIds) || rowIds.length === 0) {
    throw new Error("retentionRowIds must be a nonempty array");
  }
  const allowed = new Set(VUE_BASELINE_REQUIRED_ROW_IDS);
  const normalized = [...rowIds].sort((left, right) => left.localeCompare(right, "en"));
  for (const [index, id] of normalized.entries()) {
    requireNonemptyString(id, `retentionRowIds[${index}]`);
    if (!allowed.has(id)) throw new Error(`Unknown retention row: ${id}`);
    if (index > 0 && id === normalized[index - 1]) {
      throw new Error(`Duplicate retention row: ${id}`);
    }
  }
  return normalized;
}

function normalizeBehaviorGates(gates) {
  if (!Array.isArray(gates) || gates.length === 0) {
    throw new Error("behaviorGates must be a nonempty array");
  }
  const normalized = gates.map((gate, index) => {
    requirePlainObject(gate, `behaviorGates[${index}]`);
    requireExactKeys(gate, ["id", "passed"]);
    requireNonemptyString(gate.id, `behaviorGates[${index}].id`);
    if (typeof gate.passed !== "boolean") {
      throw new Error(`behaviorGates[${index}].passed must be a boolean`);
    }
    return { id: gate.id, passed: gate.passed };
  });
  normalized.sort((left, right) => left.id.localeCompare(right.id, "en"));
  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index].id === normalized[index - 1].id) {
      throw new Error(`Duplicate behavior gate: ${normalized[index].id}`);
    }
  }
  return normalized;
}

function renderBudgetResult(budget) {
  if (!budget) return "Not budgeted";
  return budget.passed ? "Pass" : "Fail";
}

function roundPercentage(value) {
  return Number(value.toFixed(6));
}

function requireCommit(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/.test(value)) {
    throw new Error(`${label} must be a full lowercase 40-character Git SHA`);
  }
}

function requireSafeCandidateId(value) {
  requireNonemptyString(value, "candidateId");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error("candidateId must use lowercase kebab-case");
  }
}

function requireNonemptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a nonempty string`);
  }
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

function requireExactKeys(value, keys) {
  const expected = [...keys].sort();
  const actual = Object.keys(value).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected fields ${expected.join(", ")}; received ${actual.join(", ")}`);
  }
}

function parseCommandLineArguments(arguments_) {
  if (arguments_.length !== 1 && arguments_.length !== 3) {
    throw new Error(
      "Usage: node scripts/portable-runtime/package-size-optimization-evidence.mjs <descriptor.json> [--repo-root <path>]",
    );
  }
  const descriptorPath = arguments_[0];
  if (arguments_.length === 1) return { descriptorPath, repoRoot: process.cwd() };
  if (arguments_[1] !== "--repo-root") {
    throw new Error("The only supported option is --repo-root <path>");
  }
  return { descriptorPath, repoRoot: path.resolve(arguments_[2]) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = runPackageSizeOptimizationEvidenceCommand(
    parseCommandLineArguments(process.argv.slice(2)),
  );
  process.stdout.write(
    `Published private optimization evidence: ${result.paths.json} and ${result.paths.markdown}\n`,
  );
}
