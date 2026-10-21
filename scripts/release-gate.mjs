#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPublicReleaseArtifacts } from "./pack-public-release-artifacts.mjs";
import { releaseOutputFingerprint, releaseSourceFingerprint } from "./release-inputs.mjs";
import { runReleaseCommand } from "./release-preflight.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const RELEASE_PACKS = "node_modules/.cache/starwind-release/packs";
export const RELEASE_GATE_LOGS = "node_modules/.cache/starwind-release/logs";
const RECORD = "node_modules/.cache/starwind-release/gate.json";

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

export async function assertReleaseGate({ root = ROOT } = {}) {
  const record = JSON.parse(await readFile(path.join(root, RECORD), "utf8"));
  assert(
    record.complete &&
      reusableGateRecord(record, {
        source: releaseSourceFingerprint(root),
        outputs: releaseOutputFingerprint(root, path.join(root, RELEASE_PACKS)),
        stages: releaseGateStages(),
      }),
    "Release gate evidence is missing or stale; run pnpm release:gate.",
  );
  await loadPublicReleaseArtifacts({
    outputDirectory: path.join(root, RELEASE_PACKS),
    repoRoot: root,
    requireVue: true,
    requireSvelte: true,
  });
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
} = {}) {
  const started = Date.now();
  // Registry advisories can change without a source edit, so audit on every invocation.
  await run(["audit:prod"], root);
  await run(["exec", "node", "scripts/release-preflight.mjs", "--metadata"], root);
  const stages = releaseGateStages();
  const source = releaseSourceFingerprint(root);
  const packs = path.join(root, RELEASE_PACKS);
  const recordFile = path.join(root, RECORD);
  let record;
  try {
    record = JSON.parse(await readFile(recordFile, "utf8"));
  } catch {
    /* A missing record requires every stage. */
  }
  if (
    fresh ||
    !reusableGateRecord(record, { source, outputs: releaseOutputFingerprint(root, packs), stages })
  )
    record = { schemaVersion: 1, source, stages, completed: [], complete: false };
  record.complete = false;
  await mkdir(path.join(root, RELEASE_GATE_LOGS), { recursive: true });
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
        releaseSourceFingerprint(root),
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
  const drifted = !serial && releaseSourceFingerprint(root) !== source;
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
  if (failures.length)
    throw new Error(
      `Release gate found ${failures.length} failed stage(s):\n${failures.join("\n")}`,
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
  console.log(
    `[release-gate] complete in ${((Date.now() - started) / 1000).toFixed(1)}s; evidence: ${recordFile}`,
  );
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  const runOptions = new Set(["--fresh", "--serial"]);
  const operation =
    args.length === 1 && args[0] === "--check"
      ? assertReleaseGate()
      : args.every((arg) => runOptions.has(arg)) && new Set(args).size === args.length
        ? runReleaseGate({ fresh: args.includes("--fresh"), serial: args.includes("--serial") })
        : Promise.reject(new Error("Expected no arguments, --fresh, --serial, or --check."));
  operation.catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
