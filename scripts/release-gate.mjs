#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPublicReleaseArtifacts } from "./pack-public-release-artifacts.mjs";
import {
  fingerprintFiles,
  releaseOutputFingerprint,
  releaseSourceFingerprint,
  releaseToolchain,
} from "./release-inputs.mjs";
import { runReleaseCommand } from "./release-preflight.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const RELEASE_PACKS = "node_modules/.cache/starwind-release/packs";
export const RELEASE_GATE_LOGS = "node_modules/.cache/starwind-release/logs";
const RECORD = "node_modules/.cache/starwind-release/gate.json";
const INSTALLED_LOCKFILE = "node_modules/.pnpm/lock.yaml";

// Stages without a lane prepare the build and packs in order. Each lane runs its stages in
// order, and lanes run at the same time once every preparation stage passes.
export function releaseGateStages() {
  return [
    ["static", ["check:public"]],
    ["styled metadata", ["styled:versions:check"]],
    ["primitive metadata", ["primitive:versions:check"]],
    ["test ownership", ["test:homes"]],
    ["generator types", ["runtime:generate:typecheck"]],
    ["docs metadata", ["runtime:docs:metadata:check"]],
    ["build", ["build:public"]],
    ["package size", ["--filter=starwind", "package:check"]],
    [
      "pack",
      ["exec", "node", "scripts/pack-public-release-artifacts.mjs", "--output", RELEASE_PACKS],
    ],
    ["repo and generator tests", ["test:run"], "tests"],
    ["runtime tests", ["runtime:test"], "tests"],
    ["react tests", ["react:test"], "tests"],
    // The Vue browser tests and the demo dev servers share Vite's default HMR port, so they
    // run in one lane.
    ["vue tests", ["--filter=@starwind-ui/vue", "test:all:built"], "demos"],
    ["vue generator tests", ["runtime:generate:vue:test"], "generators"],
    ["svelte tests", ["--filter=@starwind-ui/svelte", "test:run"], "tests"],
    ["svelte generator tests", ["runtime:generate:svelte:test"], "generators"],
    ["astro demo", ["demo:smoke"], "demos"],
    ["react demo", ["react-demo:smoke"], "demos"],
    ["vue demo", ["--filter=vue-demo", "smoke:built"], "demos"],
    ["svelte demo", ["svelte:demo:test"], "demos"],
    ["bundle sizes", ["runtime:size:check:prepared"], "demos"],
    [
      "Vue hosts",
      ["test:vue-cli-host-acceptance", "--packs", RELEASE_PACKS, "--concurrency", "2"],
      "hosts",
    ],
    ["Svelte hosts", ["test:svelte-cli-host-acceptance", `--packs=${RELEASE_PACKS}`], "hosts"],
    [
      "candidate hosts",
      ["release:candidate:acceptance", "--packs", RELEASE_PACKS, "--concurrency", "2"],
      "candidate",
    ],
  ];
}

export function reusableGateRecord(record, { source, outputs, stages }) {
  if (
    record?.schemaVersion !== 1 ||
    record.source !== source ||
    record.outputs !== outputs ||
    JSON.stringify(record.stages) !== JSON.stringify(stages) ||
    !Array.isArray(record.completed)
  )
    return false;
  const names = record.completed.map((entry) => entry.name);
  const preparation = stages.filter(([, , lane]) => !lane).map(([name]) => name);
  const preparedNames = names.filter((name) => preparation.includes(name));
  return (
    new Set(names).size === names.length &&
    names.every((name) => stages.some(([stage]) => stage === name)) &&
    preparedNames.every((name, index) => name === preparation[index]) &&
    (preparedNames.length === names.length || preparedNames.length === preparation.length) &&
    (!record.complete || names.length === stages.length)
  );
}

// Each check reads the toolchain again, so a change during a run still counts. Tests pass a stub
// toolchain to skip the pnpm subprocess.
function sourceFingerprint(root, toolchain) {
  return releaseSourceFingerprint(root, toolchain(root));
}

export async function assertReleaseGate({ root = ROOT, toolchain = releaseToolchain } = {}) {
  const record = JSON.parse(await readFile(path.join(root, RECORD), "utf8"));
  assert(
    record.complete &&
      reusableGateRecord(record, {
        source: sourceFingerprint(root, toolchain),
        outputs: releaseOutputFingerprint(root, path.join(root, RELEASE_PACKS)),
        stages: releaseGateStages(),
      }),
    "Release gate evidence is missing or stale; run pnpm release:gate.",
  );
  // Stage evidence ignores the audit so that an advisory cannot block every merge. Publication
  // still requires a passing audit from the last gate run.
  assert(
    record.audit?.passed === true,
    `The dependency audit did not pass in the last gate run; publication requires a passing audit.${record.audit?.log ? ` Log: ${record.audit.log}` : ""}`,
  );
  await loadPublicReleaseArtifacts({
    outputDirectory: path.join(root, RELEASE_PACKS),
    repoRoot: root,
    requireVue: true,
    requireSvelte: true,
  });
  return record;
}

function gitOutput(root, args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" }).trim();
  } catch {
    return undefined;
  }
}

function gitSucceeds(root, args) {
  return gitOutput(root, args) !== undefined;
}

// The installed dependency tree can drift while the lockfile stays the same.
function installedFingerprint(root) {
  return fingerprintFiles(root, [INSTALLED_LOCKFILE]);
}

// Head, lockfile, and toolchain explain a stale record; the source fingerprint decides it.
function gateRecordContext(root, toolchain) {
  return {
    head: gitOutput(root, ["rev-parse", "HEAD"]),
    lockfile: fingerprintFiles(root, ["pnpm-lock.yaml"]),
    toolchain: toolchain(root),
    installed: installedFingerprint(root),
  };
}

function short(value) {
  return typeof value === "string" ? value.slice(0, 12) : String(value);
}

function staleSourceDetails(root, record, toolchain) {
  if (!record.head || !record.lockfile || !record.toolchain)
    return ["The record has no head, lockfile, or toolchain details. Run the gate again."];
  const current = gateRecordContext(root, toolchain);
  const details = [];
  for (const key of Object.keys({ ...record.toolchain, ...current.toolchain }))
    if (record.toolchain[key] !== current.toolchain[key])
      details.push(
        `Toolchain ${key} changed: record ${record.toolchain[key]}, now ${current.toolchain[key]}.`,
      );
  if (record.lockfile !== current.lockfile) details.push("pnpm-lock.yaml changed.");
  if (record.head !== current.head) {
    details.push(
      `The record was written at ${short(record.head)}; HEAD is ${short(current.head)}.`,
    );
    const changed = gitOutput(root, ["diff", "--name-only", record.head, "HEAD"]);
    if (changed) {
      const files = changed.split("\n");
      const listed = files.slice(0, 20).join(", ");
      details.push(
        `Files changed after the record (${files.length}): ${listed}${files.length > 20 ? ", ..." : ""}.`,
      );
    }
  }
  if (gitOutput(root, ["status", "--porcelain", "--untracked-files=all"]))
    details.push("The checkout has uncommitted or untracked files.");
  if (!details.length) details.push("Source files changed after the record.");
  return details;
}

// Merge points use this check. It proves that every gate stage passed for the exact source,
// lockfile, toolchain, and installed dependencies in this checkout. It ignores built outputs, so a
// later build does not hide the evidence. It reports the recorded audit but does not require it.
// Publication uses --check, which also requires a passing audit and matching outputs and packs.
export async function verifyGateEvidence({
  root = ROOT,
  expectHead,
  expectBase,
  toolchain = releaseToolchain,
} = {}) {
  const problems = [];
  const recordFile = path.join(root, RECORD);
  let record;
  try {
    record = JSON.parse(await readFile(recordFile, "utf8"));
  } catch {
    problems.push(`No release gate record at ${recordFile}.`);
  }
  if (expectHead) {
    const expected = gitOutput(root, ["rev-parse", "--verify", `${expectHead}^{commit}`]);
    const head = gitOutput(root, ["rev-parse", "HEAD"]);
    if (!expected) problems.push(`Cannot resolve the expected head ${expectHead}.`);
    else if (head !== expected)
      problems.push(`The checkout is at ${short(head)}, not the expected ${short(expected)}.`);
    if (gitOutput(root, ["status", "--porcelain", "--untracked-files=all"]))
      problems.push("The checkout has uncommitted or untracked files.");
  }
  // A squash merge lands the head tree only when the base branch is an ancestor of the head.
  if (expectBase) {
    const base = gitOutput(root, ["rev-parse", "--verify", `${expectBase}^{commit}`]);
    if (!base) problems.push(`Cannot resolve the expected base ${expectBase}.`);
    else if (!gitSucceeds(root, ["merge-base", "--is-ancestor", base, "HEAD"]))
      problems.push(
        `HEAD does not contain ${expectBase} (${short(base)}). Refresh the branch from it, apply the sync again, and run the gate again.`,
      );
  }
  if (record) {
    const stages = releaseGateStages();
    if (record.schemaVersion !== 1) problems.push("The record has an unknown schema version.");
    if (JSON.stringify(record.stages) !== JSON.stringify(stages))
      problems.push("The gate stages changed after the record was written.");
    if (record.source !== sourceFingerprint(root, toolchain))
      problems.push(
        "The record is for a different source tree.",
        ...staleSourceDetails(root, record, toolchain),
      );
    if (!record.installed)
      problems.push("The record has no installed dependency fingerprint. Run the gate again.");
    else if (record.installed !== installedFingerprint(root))
      problems.push(
        `Installed dependencies changed after the record (${INSTALLED_LOCKFILE}). Run the gate again.`,
      );
    const passed = new Set((record.completed ?? []).map(({ name }) => name));
    const missing = stages.map(([name]) => name).filter((name) => !passed.has(name));
    if (missing.length)
      problems.push(
        `The record is incomplete. Stages that failed or did not run: ${missing.join(", ")}.`,
      );
    else if (!record.complete)
      problems.push("The record is incomplete. The final release artifact check did not pass.");
  }
  return {
    ok: problems.length === 0,
    problems: [...new Set(problems)],
    audit: auditSummary(record),
    record,
  };
}

function auditSummary(record) {
  if (!record?.audit) return "Dependency audit: not recorded.";
  return record.audit.passed
    ? "Dependency audit: passed."
    : `Dependency audit: failed. Compare its advisories with the base branch. Log: ${record.audit.log}`;
}

export async function assertGateEvidence(options) {
  const { ok, problems, audit, record } = await verifyGateEvidence(options);
  if (!ok)
    throw new Error(
      [
        "Release gate evidence does not match this checkout:",
        ...problems.map((problem) => `- ${problem}`),
        audit,
        "Run node scripts/release-gate.mjs in this checkout. Check again after it passes.",
      ].join("\n"),
    );
  console.log(
    `[release-gate] Evidence matches: ${record.completed.length} stages passed for this source.`,
  );
  console.log(`[release-gate] ${audit}`);
  return record;
}

function logFileFor(root, name) {
  return path.join(root, RELEASE_GATE_LOGS, `${name.replaceAll(/[^a-z0-9]+/gi, "-")}.log`);
}

async function printLogTail(logFile, lines = 40) {
  try {
    const tail = (await readFile(logFile, "utf8")).trimEnd().split("\n").slice(-lines);
    console.error(`[release-gate] last ${tail.length} lines of ${logFile}:\n${tail.join("\n")}`);
  } catch {
    /* The stage failed before it wrote a log. */
  }
}

export async function runReleaseGate({
  root = ROOT,
  fresh = false,
  serial = false,
  run = runReleaseCommand,
  toolchain = releaseToolchain,
} = {}) {
  const started = Date.now();
  await mkdir(path.join(root, RELEASE_GATE_LOGS), { recursive: true });
  // Registry advisories can change without a source edit, so audit on every invocation. A failed
  // audit does not stop the stages. The record keeps the result, and the gate fails at the end.
  const auditLog = logFileFor(root, "dependency audit");
  let audit = { passed: true, log: auditLog };
  try {
    await run(["audit:prod"], root, { logFile: auditLog });
  } catch (error) {
    await printLogTail(auditLog);
    audit = { passed: false, log: auditLog, message: error.message };
    console.error(`[release-gate] dependency audit failed; the stages still run. Log: ${auditLog}`);
  }
  await run(["exec", "node", "scripts/release-preflight.mjs", "--metadata"], root);
  const stages = releaseGateStages();
  const source = sourceFingerprint(root, toolchain);
  const packs = path.join(root, RELEASE_PACKS);
  const recordFile = path.join(root, RECORD);
  let record;
  try {
    record = JSON.parse(await readFile(recordFile, "utf8"));
  } catch {
    /* A missing record requires every stage. */
  }
  const context = gateRecordContext(root, toolchain);
  if (
    fresh ||
    record?.installed !== context.installed ||
    !reusableGateRecord(record, { source, outputs: releaseOutputFingerprint(root, packs), stages })
  )
    record = { schemaVersion: 1, source, stages, completed: [], complete: false };
  Object.assign(record, context, { audit });
  record.complete = false;
  // Lanes finish stages at the same time, so record writes run one after another.
  let saving = Promise.resolve();
  const save = () =>
    (saving = saving.then(() => writeFile(recordFile, `${JSON.stringify(record, null, 2)}\n`)));
  await save();

  const runStage = async ([name, args, lane], { concurrent = false } = {}) => {
    if (record.completed.some((entry) => entry.name === name)) {
      console.log(`[release-gate] reuse ${name}`);
      return;
    }
    const start = Date.now();
    const logFile = lane && !serial ? logFileFor(root, name) : undefined;
    console.log(`[release-gate] start ${name}${logFile ? ` (log: ${logFile})` : ""}`);
    try {
      await run(args, root, logFile ? { logFile } : undefined);
    } catch (error) {
      if (logFile) await printLogTail(logFile);
      throw error;
    }
    // Generator tests write temporary folders into the tree, so a concurrent stage would see
    // another lane's files. Concurrent lanes check source drift once after every lane finishes.
    if (!concurrent)
      assert.equal(
        sourceFingerprint(root, toolchain),
        source,
        `Source changed during ${name}; rerun the gate after reviewing generated drift.`,
      );
    const seconds = (Date.now() - start) / 1000;
    record.completed.push({ name, seconds });
    record.outputs = releaseOutputFingerprint(root, packs);
    await save();
    console.log(`[release-gate] passed ${name} (${seconds.toFixed(1)}s)`);
  };

  for (const stage of stages.filter(([, , lane]) => !lane)) await runStage(stage);
  const laned = stages.filter(([, , lane]) => lane);
  const lanes = serial ? [laned] : Object.values(Object.groupBy(laned, ([, , lane]) => lane));
  // Lane stages do not depend on each other, so one failure does not stop the others.
  const failed = [];
  await Promise.all(
    lanes.map(async (lane) => {
      for (const stage of lane) {
        try {
          await runStage(stage, { concurrent: !serial });
        } catch (error) {
          failed.push({ stage, message: error.message });
        }
      }
    }),
  );
  await saving;
  const failures = [];
  const drifted = !serial && sourceFingerprint(root, toolchain) !== source;
  if (drifted)
    failures.push(
      "lanes: Source changed while the lanes ran; rerun with --serial to find the stage.",
    );
  // Concurrent lanes can push a test past its timeout, so a failed lane stage runs once more
  // alone. A real failure fails again and costs only that stage's time.
  for (const { stage, message } of failed) {
    if (serial || drifted) {
      failures.push(`${stage[0]}: ${message}`);
      continue;
    }
    console.log(`[release-gate] retry ${stage[0]} alone after it failed in a lane`);
    try {
      await runStage(stage);
      console.warn(`[release-gate] ${stage[0]} passed alone; the lane failure was likely load`);
    } catch (error) {
      failures.push(`${stage[0]}: ${error.message}`);
    }
  }
  const auditFailure = audit.passed ? "" : `\ndependency audit: ${audit.message}`;
  if (failures.length)
    throw new Error(
      `Release gate found ${failures.length} failed stage(s):\n${failures.join("\n")}${auditFailure}`,
    );
  await loadPublicReleaseArtifacts({
    outputDirectory: packs,
    repoRoot: root,
    requireVue: true,
    requireSvelte: true,
  });
  record.complete = true;
  record.outputs = releaseOutputFingerprint(root, packs);
  await save();
  await saving;
  if (!audit.passed)
    throw new Error(
      `Release gate stages passed, but the dependency audit failed. Publication requires a passing audit.${auditFailure}`,
    );
  console.log(
    `[release-gate] complete in ${((Date.now() - started) / 1000).toFixed(1)}s; evidence: ${recordFile}`,
  );
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  const runOptions = new Set(["--fresh", "--serial"]);
  const verifyOptions = { "--expect-head": "expectHead", "--expect-base": "expectBase" };
  let verify;
  if (args[0] === "--verify-evidence" && args.length % 2 === 1) {
    verify = {};
    for (let index = 1; index < args.length; index += 2) {
      const key = verifyOptions[args[index]];
      if (!key || verify[key] || !args[index + 1] || args[index + 1].startsWith("--")) {
        verify = undefined;
        break;
      }
      verify[key] = args[index + 1];
    }
  }
  const operation =
    args.length === 1 && args[0] === "--check"
      ? assertReleaseGate()
      : verify
        ? assertGateEvidence(verify)
        : args.every((arg) => runOptions.has(arg)) && new Set(args).size === args.length
          ? runReleaseGate({ fresh: args.includes("--fresh"), serial: args.includes("--serial") })
          : Promise.reject(
              new Error(
                "Expected no arguments, --fresh, --serial, --check, or --verify-evidence [--expect-head <rev>] [--expect-base <rev>].",
              ),
            );
  operation.catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
