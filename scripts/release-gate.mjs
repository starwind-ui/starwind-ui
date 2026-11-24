#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  loadPublicReleaseArtifacts,
  RELEASE_GATE_SOURCE_ENV,
} from "./pack-public-release-artifacts.mjs";
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
    // Lanes: the gate runs six lanes at the same time, and each lane holds about six minutes of
    // work. A seventh lane made timing tests fail under load more often, and the gate then reran
    // them alone. Stages that write to the same folder run in order in one lane. Where a comment says
    // so, a stage waits on stages in other lanes through `after`.
    //
    // tests lane: unit and source-level suites.
    ["repo and generator tests", ["test:run"], "tests"],
    // The Runtime browser tests rebuild packages/runtime/dist before they run. The rebuild moves
    // each new file into place with one rename, so stages in other lanes that import the built
    // Runtime never find a file missing.
    ["runtime tests", ["runtime:test"], "tests"],
    ["react tests", ["react:test"], "tests"],
    ["svelte tests", ["--filter=@starwind-ui/svelte", "test:run"], "tests"],
    // Installs the exact Svelte 5.29 and current compiler tools beside the built Svelte package.
    // It copies packages/runtime/dist, so it runs after "runtime tests" rebuilds that folder.
    [
      "Svelte compatibility",
      ["exec", "tsx", "scripts/portable-runtime/check-svelte-compatibility.ts"],
      "tests",
    ],
    // The Chart browser suites import the four frameworks from source and write only to the
    // system temporary folder. Their fixture servers turn off HMR and the WebSocket server, so
    // they can run beside any other lane. Four browser workers keep them from starving the
    // other lanes.
    ["chart parity", ["test:chart-parity", "--maxWorkers", "4"], "tests"],
    ["chart styled", ["test:chart-styled", "--maxWorkers", "4"], "tests"],
    // Measures the built package folders and writes only to the system temporary folder. It
    // reads packages/runtime/dist, so it runs after "runtime tests" rebuilds that folder.
    ["bundle sizes", ["runtime:size:check:prepared"], "tests"],
    // generators lane: the generator suites and the Vue compatibility check. The Vue generator
    // and Svelte Styled suites write to app folders that the gallery's dev servers use, so they
    // run first in this lane and the gallery waits for them.
    // The Vue generator tests write their temporary folders into apps/vue-demo/src/components,
    // which the gallery's Vue dev server watches, so "chart gallery" waits for them.
    ["vue generator tests", ["runtime:generate:vue:test"], "generators"],
    // Runs `svelte-kit sync` when it starts, which writes apps/svelte-demo/.svelte-kit. The
    // gallery's Svelte dev server writes that folder again minutes later. The Styled tests read
    // only its tsconfig.json, and the dev server writes the same content to that file.
    ["svelte styled tests", ["svelte:styled:test"], "generators"],
    // The Svelte generator suite writes its temporary folders under unique names and reads no app
    // build or cache folder.
    ["svelte generator tests", ["runtime:generate:svelte:test"], "generators"],
    // Installs the exact Vue peer floor and the Vue version the package builds with beside the
    // packed Runtime and Vue archives. It reads only the packs, so it needs no build. It runs in
    // this lane to keep the hosts lane short.
    [
      "Vue compatibility",
      [
        "exec",
        "tsx",
        "scripts/portable-runtime/check-vue-compatibility.ts",
        `--packs=${RELEASE_PACKS}`,
      ],
      "generators",
    ],
    // demos lane: these stages serve or build the demo apps. The order keeps stages that write to
    // the same app folder apart.
    // The Astro smoke checks serve apps/demo/dist with Astro preview on fixed ports.
    ["astro demo", ["demo:smoke"], "demos"],
    // The Vue and Svelte smoke checks serve their app builds and write nothing to the app folders.
    ["vue demo", ["--filter=vue-demo", "smoke:built"], "demos"],
    ["svelte demo", ["svelte:demo:test"], "demos"],
    // Starts a Vite dev server in apps/react-demo, which writes that app's Vite cache. The
    // repository tests write temporary folders into apps/react-demo, so this stage waits for them.
    ["react demo", ["react-demo:smoke"], "demos", { after: ["repo and generator tests"] }],
    // Builds its Astro fixtures with apps/demo as the Astro root, so it writes apps/demo/.astro.
    ["target conformance", ["test:conformance"], "demos"],
    // Starts the dev servers of all four demo apps at the same time. The Astro server writes
    // apps/demo/.astro, and the React server writes the apps/react-demo Vite cache, so it runs
    // after "target conformance" and "react demo". It waits for the stages that write into the
    // folders its dev servers watch, and for the Runtime rebuild that the Svelte app reads.
    [
      "chart gallery",
      ["test:chart-gallery", "--skip-build"],
      "demos",
      {
        after: [
          "repo and generator tests",
          "runtime tests",
          "vue generator tests",
          "svelte styled tests",
        ],
      },
    ],
    // hosts lane: install the packed archives into hosts in the system temporary folder.
    [
      "Vue hosts",
      ["test:vue-cli-host-acceptance", "--packs", RELEASE_PACKS, "--concurrency", "2"],
      "hosts",
    ],
    ["Svelte hosts", ["test:svelte-cli-host-acceptance", `--packs=${RELEASE_PACKS}`], "hosts"],
    // The Vue browser projects let Vitest pick a free port, and the Vue hydration check attaches
    // HMR to its own server. So these tests do not hold Vite's default HMR port (24678), and no
    // demo stage waits on them. They read packages/runtime/dist, so they wait for "runtime tests"
    // to rebuild that folder.
    [
      "vue tests",
      ["--filter=@starwind-ui/vue", "test:all:built"],
      "hosts",
      { after: ["runtime tests"] },
    ],
    // candidate lane: also installs the packed archives into hosts in the system temporary folder.
    [
      "candidate hosts",
      ["release:candidate:acceptance", "--packs", RELEASE_PACKS, "--concurrency", "2"],
      "candidate",
    ],
    // The hosts stay in the system temporary folder, because a host inside the checkout reads
    // the checkout's configuration files. It reads only the packs, so it shares this lane to
    // keep the direction lane short.
    ["direction installed hosts", ["direction:installed", "--packs", RELEASE_PACKS], "candidate"],
    // direction lane: the direction suite builds its fixtures in its run folder with its own
    // Astro root and Vite caches, so it does not write to apps/demo/.astro or the apps/demo caches
    // that the demo lane uses. The gate runs every planned engine. Five other lanes run at the same
    // time, so it caps the browser workers at 10. It is the longest single stage, so it has a lane
    // of its own.
    [
      "direction browsers",
      ["direction:test", "--engines", "all", "--max-workers", "10"],
      "direction",
    ],
  ];
}

/** Names of the stages in other lanes that must finish before this stage starts. */
export function stageAfter([, , , options]) {
  return options?.after ?? [];
}

/**
 * Rejects a stage list where a stage waits on an unknown stage, or where waits and lane order
 * form a loop, because the gate would then never finish.
 */
export function assertStageOrder(stages) {
  const next = new Map(stages.map(([name]) => [name, []]));
  for (const stage of stages) {
    for (const name of stageAfter(stage)) {
      if (!next.has(name)) throw new Error(`${stage[0]} waits on an unknown stage: ${name}`);
      next.get(name).push(stage[0]);
    }
  }
  const lanes = Object.groupBy(
    stages.filter(([, , lane]) => lane),
    ([, , lane]) => lane,
  );
  for (const lane of Object.values(lanes)) {
    for (let index = 1; index < lane.length; index += 1) {
      next.get(lane[index - 1][0]).push(lane[index][0]);
    }
  }
  const state = new Map();
  const visit = (name) => {
    if (state.get(name) === "done") return;
    if (state.get(name) === "open")
      throw new Error(`Release gate stages wait in a loop at ${name}`);
    state.set(name, "open");
    for (const later of next.get(name)) visit(later);
    state.set(name, "done");
  };
  for (const name of next.keys()) visit(name);
}

/**
 * Runs each lane's stages in order, with the lanes at the same time. A stage with `after` waits
 * until those stages pass or fail. Stages in `finished` count as done, so a resumed run does not
 * wait on them. Returns the stages that failed.
 */
export async function runLanes(lanes, runStage, { finished = new Set(), wait = true } = {}) {
  const ends = new Map();
  const end = (name) => {
    if (!ends.has(name)) {
      let resolve;
      const promise = new Promise((done) => (resolve = done));
      ends.set(name, { promise, resolve });
    }
    return ends.get(name);
  };
  for (const name of finished) end(name).resolve();
  const failed = [];
  await Promise.all(
    lanes.map(async (lane) => {
      for (const stage of lane) {
        if (wait) await Promise.all(stageAfter(stage).map((name) => end(name).promise));
        try {
          await runStage(stage);
        } catch (error) {
          failed.push({ stage, message: error.message });
        } finally {
          end(stage[0]).resolve();
        }
      }
    }),
  );
  return failed;
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
  assertStageOrder(stages);
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
    // Concurrent stages read the source fingerprint from the gate, because other lanes write
    // test folders into the tree. The drift check after the lanes covers the tree.
    const env = concurrent ? { ...process.env, [RELEASE_GATE_SOURCE_ENV]: source } : undefined;
    try {
      await run(args, root, logFile || env ? { logFile, env } : undefined);
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
  // One failure does not stop the other lanes. A stage that waits on a failed stage still runs.
  const failed = await runLanes(lanes, (stage) => runStage(stage, { concurrent: !serial }), {
    finished: new Set(record.completed.map((entry) => entry.name)),
    wait: !serial,
  });
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
