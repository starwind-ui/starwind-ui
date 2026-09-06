#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPublicReleaseArtifacts } from "./pack-public-release-artifacts.mjs";
import { releaseOutputFingerprint, releaseSourceFingerprint } from "./release-inputs.mjs";
import { runReleaseCommand } from "./release-preflight.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const RELEASE_PACKS = "node_modules/.cache/starwind-release/packs";
const RECORD = "node_modules/.cache/starwind-release/gate.json";

export function releaseGateStages({ privateEvidence = false } = {}) {
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
      [
        "exec",
        "node",
        "scripts/pack-public-release-artifacts.mjs",
        "--vue-beta",
        "--output",
        RELEASE_PACKS,
      ],
    ],
    ["repo and generator tests", ["test:run"]],
    ["runtime tests", ["runtime:test"]],
    ["react tests", ["react:test"]],
    ["vue tests", ["--filter=@starwind-ui/vue", "test:all:built"]],
    ["vue generator tests", ["runtime:generate:vue:test"]],
    ["astro demo", ["demo:smoke"]],
    ["react demo", ["react-demo:smoke"]],
    ["vue demo", ["--filter=vue-demo", "smoke:built"]],
    ["bundle sizes", ["runtime:size:check:prepared"]],
    ...(privateEvidence ? [["private Vue evidence", ["runtime:perf:vue:evidence:check"]]] : []),
    ["Vue hosts", ["test:vue-cli-host-acceptance", "--packs", RELEASE_PACKS, "--concurrency", "2"]],
    [
      "candidate hosts",
      ["release:candidate:acceptance", "--packs", RELEASE_PACKS, "--concurrency", "2"],
    ],
  ];
}

export function reusableGateRecord(record, { source, outputs, stages }) {
  return (
    record?.schemaVersion === 1 &&
    record.source === source &&
    record.outputs === outputs &&
    JSON.stringify(record.stages) === JSON.stringify(stages) &&
    Array.isArray(record.completed) &&
    record.completed.length <= stages.length &&
    record.completed.every((entry, index) => entry.name === stages[index][0]) &&
    (!record.complete || record.completed.length === stages.length)
  );
}

export async function assertReleaseGate({ root = ROOT } = {}) {
  const record = JSON.parse(await readFile(path.join(root, RECORD), "utf8"));
  assert(
    record.complete &&
      reusableGateRecord(record, {
        source: releaseSourceFingerprint(root),
        outputs: releaseOutputFingerprint(root, path.join(root, RELEASE_PACKS)),
        stages: releaseGateStages({
          privateEvidence: existsSync(path.join(root, "packages/svelte/package.json")),
        }),
      }),
    "Release gate evidence is missing or stale; run pnpm release:gate.",
  );
  await loadPublicReleaseArtifacts({
    outputDirectory: path.join(root, RELEASE_PACKS),
    repoRoot: root,
    requireVue: true,
  });
  return record;
}

export async function runReleaseGate({ root = ROOT, fresh = false, run = runReleaseCommand } = {}) {
  const started = Date.now();
  // Registry advisories can change without a source edit, so audit on every invocation.
  await run(["audit:prod"], root);
  await run(["exec", "node", "scripts/release-preflight.mjs", "--metadata"], root);
  const stages = releaseGateStages({
    privateEvidence: existsSync(path.join(root, "packages/svelte/package.json")),
  });
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
  await mkdir(path.dirname(recordFile), { recursive: true });
  await writeFile(recordFile, `${JSON.stringify(record, null, 2)}\n`);
  for (const [name, args] of stages) {
    if (record.completed.some((entry) => entry.name === name)) {
      console.log(`[release-gate] reuse ${name}`);
      continue;
    }
    const start = Date.now();
    console.log(`[release-gate] start ${name}`);
    await run(args, root);
    assert.equal(
      releaseSourceFingerprint(root),
      source,
      `Source changed during ${name}; rerun the gate after reviewing generated drift.`,
    );
    record.completed.push({ name, seconds: (Date.now() - start) / 1000 });
    record.outputs = releaseOutputFingerprint(root, packs);
    await writeFile(recordFile, `${JSON.stringify(record, null, 2)}\n`);
    console.log(`[release-gate] passed ${name} (${record.completed.at(-1).seconds.toFixed(1)}s)`);
  }
  await loadPublicReleaseArtifacts({ outputDirectory: packs, repoRoot: root, requireVue: true });
  record.complete = true;
  record.outputs = releaseOutputFingerprint(root, packs);
  await writeFile(recordFile, `${JSON.stringify(record, null, 2)}\n`);
  console.log(
    `[release-gate] complete in ${((Date.now() - started) / 1000).toFixed(1)}s; evidence: ${recordFile}`,
  );
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  const operation =
    args.length === 1 && args[0] === "--check"
      ? assertReleaseGate()
      : args.length === 0 || (args.length === 1 && args[0] === "--fresh")
        ? runReleaseGate({ fresh: args.includes("--fresh") })
        : Promise.reject(new Error("Expected no arguments, --fresh, or --check."));
  operation.catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
