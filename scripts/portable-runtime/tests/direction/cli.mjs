#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import ts from "typescript";
import { createServer as createViteServer, build as viteBuild } from "vite";
import { compileVueSfc } from "../../../../packages/vue/tsup.config.js";
import {
  generateAstroPrimitiveWrappers,
  generateStarwindAstroWrappers,
} from "../../generate-astro-wrappers.js";
import {
  generateReactPrimitiveWrappers,
  generateStarwindReactWrappers,
} from "../../generate-react-wrappers.js";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { generateSveltePrimitiveWrappers } from "../../generate-svelte-wrappers.js";
import {
  generateStarwindVueWrappers,
  generateVuePrimitiveWrappers,
} from "../../generate-vue-wrappers.js";
import { refreshLedger } from "./cases/physical-token-audit/ledger.js";
import {
  DIRECTION_HOME,
  ROOT,
  selectCases,
  selfTest,
  TARGETS,
  validateInventory,
} from "./inventory.js";
import { defaultWorkers, ENGINES, runBrowser, taskKey } from "./runner/browser.mjs";
import { resolveFixtureRoutes } from "./runner/fixture-routes.mjs";
import { partitionCases, shardCount, verifyUnion } from "./runner/promotion.mjs";
import { addStageGates } from "./runner/semantic-gates.mjs";
import {
  compareStage,
  loadRemediationBaselines,
  plannedEngines,
  SOURCE_CI_SHARD,
  selectStageCases,
  validateRemediationBaselines,
} from "./runner/stage.mjs";

const demoRequire = createRequire(path.join(ROOT, "apps/demo/package.json"));
const tailwindcss = (await import(demoRequire.resolve("@tailwindcss/vite"))).default;

const command = process.argv[2];
const flag = (name) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
};
const caseId = flag("--case");
const fixtureRoot = flag("--fixture-root");
const mode = flag("--mode") ?? "final";
assert(["inventory", "stage", "final"].includes(mode), `Unknown mode ${mode}`);
const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();

if (command === "inventory") {
  if (process.argv.includes("--self-test")) await selfTest();
  const inventory = await validateInventory(mode, fixtureRoot);
  const totals = Object.fromEntries(
    TARGETS.map((target) => [
      target,
      inventory.rows.filter((row) => row.targets.includes(target)).length,
    ]),
  );
  const record = (row) => ({
    row,
    cases: inventory.cases.filter((item) => item.row === row).map((item) => item.id),
    status: inventory.cases.some((item) => item.row === row) ? "fixture-registered" : "staged",
    stageReason: inventory.cases.some((item) => item.row === row)
      ? undefined
      : "A later source ticket owns this fixture and behavior proof.",
  });
  const report = {
    sha,
    mode,
    totals,
    styledGroups: inventory.rows.length,
    namedExports: inventory.rows.reduce((n, row) => n + row.exports.length, 0),
    runtimeFamilies: inventory.runtime.length,
    theme: inventory.helpers.includes("theme"),
    legacyGroups: inventory.rows.filter((row) => row.legacy).length,
    rows: inventory.rows.map((row) => ({
      ...row,
      ...record(row.id),
      physicalExceptions: inventory.cases
        .filter((item) => item.row === row.id)
        .flatMap((item) => item.physicalExceptions ?? []),
    })),
    raw: inventory.runtime.map((id) => record(`runtime:${id}`)),
    themeCoverage: record("theme"),
    legacy: inventory.rows.filter((row) => row.legacy).map((row) => record(`legacy:${row.id}`)),
    archivedTracers: "excluded from current component counts",
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}
if (command === "ledger") {
  // Rewrite the reviewed physical-token ledger from a fresh scan after an intended token change.
  const parent = path.join(ROOT, "node_modules/.cache/starwind-direction");
  await mkdir(parent, { recursive: true });
  const root = await realpath(await mkdtemp(path.join(parent, "starwind-ledger-")));
  try {
    await generateCandidate(root);
    const files = await refreshLedger(
      path.join(DIRECTION_HOME, "inventory/physical-tokens.json"),
      ROOT,
      path.join(root, "candidate"),
    );
    console.log(
      `Direction ledger: ${files} source files written to inventory/physical-tokens.json`,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
  process.exit(0);
}
assert(["build", "browser", "stage"].includes(command), `Unknown direction command ${command}`);
const inventory = await validateInventory(command === "stage" ? "final" : mode, fixtureRoot);
const stageGates = addStageGates(inventory.cases, inventory.expectations);
const expectedFailures = [];
// The everyday run uses Chromium. `--engines all` adds Firefox and WebKit for the cases whose
// engine plan names them.
const engineFlag = flag("--engines");
const engines =
  engineFlag === "all"
    ? ENGINES
    : (engineFlag?.split(",") ?? (command === "stage" ? ENGINES : ["chromium"]));
for (const engine of engines) assert(ENGINES.includes(engine), `Unknown browser engine ${engine}`);
// `--max-workers` caps the default count. The release gate uses it beside its other lanes.
const maxWorkers = flag("--max-workers") ? Number(flag("--max-workers")) : Infinity;
assert(
  maxWorkers === Infinity || (Number.isInteger(maxWorkers) && maxWorkers > 0),
  "--max-workers needs a positive integer",
);
const workers = flag("--workers")
  ? Number(flag("--workers"))
  : Math.min(defaultWorkers(engines), maxWorkers);
assert(Number.isInteger(workers) && workers > 0, "--workers needs a positive integer");
// Astro resolves an absolute module path outside its root against that root when the two paths
// share no top-level folder, so fixture builds stay under the checkout's ignored cache.
const DEFAULT_ARTIFACTS = path.join(ROOT, "node_modules/.cache/starwind-direction");
function artifactDirectory() {
  const parent = flag("--artifact-dir") ? path.resolve(flag("--artifact-dir")) : DEFAULT_ARTIFACTS;
  const top = (file) => file.split(path.sep).filter(Boolean)[0];
  assert.equal(
    top(parent),
    top(ROOT),
    `--artifact-dir must share the top-level folder of ${ROOT} for the Astro fixture build`,
  );
  return parent;
}
const remediationBaselines =
  command === "stage"
    ? validateRemediationBaselines(await loadRemediationBaselines(), stageGates.cases)
    : {};
const shard = flag("--shard");
if (shard !== undefined)
  assert(!caseId && /^\d+$/.test(shard) && Number(shard) < shardCount, "Invalid shard");
const selected =
  shard !== undefined
    ? partitionCases(stageGates.cases)[Number(shard)]
    : command === "stage"
      ? selectStageCases(caseId, { ...inventory, cases: stageGates.cases }, remediationBaselines)
      : selectCases(caseId, stageGates.cases, inventory.cohorts);
const emptySourceShard = command === "stage" && caseId === SOURCE_CI_SHARD && selected.length === 0;
assert(
  selected.length || emptySourceShard,
  `No direction case matches ${caseId ?? "the current inventory"}`,
);
if (command === "stage" && flag("--compare-report")) {
  const sourcePath = path.resolve(flag("--compare-report"));
  const source = JSON.parse(await readFile(sourcePath, "utf8"));
  const compared = engineFlag ? engines : (source.engines ?? ENGINES);
  assert.deepEqual(
    source.caseIds,
    selected.map((item) => item.id),
    "Saved report case selection differs",
  );
  const comparison = compareStage(selected, source.results, expectedFailures, compared);
  const reportPath = path.join(path.dirname(sourcePath), `comparison-${sha.slice(0, 12)}.json`);
  await writeFile(
    reportPath,
    JSON.stringify(
      { sourceReport: sourcePath, candidateSha: source.sha, comparisonSha: sha, comparison },
      null,
      2,
    ),
  );
  console.log(`Direction stage comparison: ${comparison.status}; ${reportPath}`);
  if (comparison.status !== "passed") process.exitCode = 1;
  process.exit();
}
if (emptySourceShard) {
  const parent = artifactDirectory();
  await mkdir(parent, { recursive: true });
  const folder = await mkdtemp(path.join(parent, "starwind-direction-"));
  const reportPath = path.join(folder, "stage.json");
  const comparison = compareStage([], [], expectedFailures, engines);
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        sha,
        mode,
        caseIds: [],
        targets: [],
        engines,
        results: [],
        comparison,
        status: comparison.status,
        emptyShard: true,
      },
      null,
      2,
    ),
  );
  console.log(`Direction stage: 0/0 cases passed; ${reportPath}`);
  process.exit(comparison.status === "passed" ? 0 : 1);
}
const initialStatus = execFileSync("git", ["status", "--porcelain"], {
  cwd: ROOT,
  encoding: "utf8",
});
// Other release gate lanes can hold temporary untracked files, so the probe check reads tracked
// files only.
const trackedStatus = () =>
  execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
    cwd: ROOT,
    encoding: "utf8",
  });
const initialTrackedStatus = trackedStatus();
const artifactParent = artifactDirectory();
await mkdir(artifactParent, { recursive: true });
const temporaryRoot = await realpath(
  await mkdtemp(path.join(artifactParent, "starwind-direction-")),
);
const sourceBuild = flag("--reuse-build");
const buildStarted = performance.now();
const fixtures = path.join(temporaryRoot, "fixtures");
const output = path.join(temporaryRoot, "dist");
const buildCases = resolveFixtureRoutes(stageGates.cases, selected);
if (sourceBuild) {
  assert.equal(command, "browser");
  assert.equal(initialStatus, "", "Reused build requires a clean checkout");
  const receipt = JSON.parse(await readFile(path.join(sourceBuild, "build.json"), "utf8"));
  assert.equal(receipt.sha, sha);
  assert.equal(receipt.clean, true);
  assert.equal(receipt.mode, mode);
  assert.equal(receipt.status, "built");
  assert.deepEqual(receipt.caseIds.slice().sort(), stageGates.cases.map((item) => item.id).sort());
  for (const item of buildCases) assert(receipt.builtCaseIds.includes(item.id));
  await symlink(await realpath(path.join(sourceBuild, "dist")), output, "dir");
} else {
  await mkdir(fixtures, { recursive: true });
  await mkdir(path.join(temporaryRoot, "node_modules/@tailwindcss"), { recursive: true });
  for (const name of ["svelte", "vue"])
    await symlink(
      path.join(ROOT, `node_modules/${name}`),
      path.join(temporaryRoot, `node_modules/${name}`),
      "dir",
    );
  for (const name of ["react", "react-dom"])
    await symlink(
      path.join(ROOT, `packages/react/node_modules/${name}`),
      path.join(temporaryRoot, `node_modules/${name}`),
      "dir",
    );
  for (const name of ["tailwindcss", "tw-animate-css", "tailwind-variants"])
    await symlink(
      path.join(ROOT, `apps/demo/node_modules/${name}`),
      path.join(temporaryRoot, `node_modules/${name}`),
      "dir",
    );
  for (const name of ["prettier", "prettier-plugin-astro", "prettier-plugin-tailwindcss"])
    await symlink(
      path.join(ROOT, `node_modules/${name}`),
      path.join(temporaryRoot, `node_modules/${name}`),
      "dir",
    );
  await symlink(
    path.join(ROOT, "apps/demo/node_modules/@tailwindcss/forms"),
    path.join(temporaryRoot, "node_modules/@tailwindcss/forms"),
    "dir",
  );
  await linkInstalledConsumerDependencies(temporaryRoot);
  await generateCandidate(temporaryRoot);

  await writeFixtures(temporaryRoot, buildCases);
  await verifyConsumerImports(temporaryRoot, buildCases);
  if (
    buildCases.some((item) => TARGETS.some((target) => target !== "astro" && item.fixtures[target]))
  )
    await buildFrameworkPages(temporaryRoot, buildCases);
  if (buildCases.some((item) => item.fixtures.astro)) await buildAstroPages(temporaryRoot);
}
assert.equal(trackedStatus(), initialTrackedStatus, "Fixture probe changed tracked source status");
const targetPages = selected.flatMap((item) => TARGETS.filter((target) => item.fixtures[target]));
const buildReport = {
  sha,
  clean: initialStatus === "",
  sourceBuild: sourceBuild && path.resolve(sourceBuild),
  mode,
  caseIds: selected.map((item) => item.id),
  targets: [...new Set(targetPages)],
  builtCaseIds: buildCases.map((item) => item.id),
  candidate: temporaryRoot,
  generated: path.join(sourceBuild ?? temporaryRoot, "candidate"),
  output,
  status: "built",
};
await writeFile(path.join(temporaryRoot, "build.json"), JSON.stringify(buildReport, null, 2));
const buildSeconds = (performance.now() - buildStarted) / 1000;
console.log(
  `Direction build: ${targetPages.length} target pages in ${buildSeconds.toFixed(1)}s; ${path.join(temporaryRoot, "build.json")}`,
);
if (command === "build") process.exit(0);
const partialPath = path.join(temporaryRoot, "stage.partial.json");
// Earlier durations order the queue so that the longest results start first.
const durationsPath = path.join(DEFAULT_ARTIFACTS, "durations.json");
// Concurrent runs share this file, so a missing or unreadable file only loses the ordering hint.
const durations = await readFile(durationsPath, "utf8")
  .then((text) => JSON.parse(text))
  .catch(() => ({}));
let partialWrite = Promise.resolve();
const browserStarted = performance.now();
const results = await runBrowser(temporaryRoot, selected, stageGates.expectations, {
  engines,
  workers,
  estimate: (task) => durations[taskKey(task.engine, task.item.id, task.target)] ?? 1000,
  shouldRun: (item, _target, engine) => plannedEngines(item).includes(engine),
  onResult: async (result, current) => {
    if (current.length % 25 === 0 || result.status !== "passed") {
      const snapshot = JSON.stringify(
        { sha, mode, caseIds: selected.map((item) => item.id), results: current },
        null,
        2,
      );
      partialWrite = partialWrite.then(() => writeFile(partialPath, snapshot));
      await partialWrite;
    }
    if (result.status !== "passed" || process.argv.includes("--verbose"))
      console.log(
        `Direction ${result.engine}/${result.caseId}/${result.target}: ${result.status}${result.errors?.length ? ` (${result.errors[0].split("\n")[0]})` : ""}; ${current.length} results`,
      );
  },
});
const browserSeconds = (performance.now() - browserStarted) / 1000;
for (const result of results)
  if (result.durationMs !== undefined)
    durations[taskKey(result.engine, result.caseId, result.target)] = result.durationMs;
await mkdir(DEFAULT_ARTIFACTS, { recursive: true });
const durationsDraft = `${durationsPath}.${process.pid}.tmp`;
await writeFile(durationsDraft, JSON.stringify(durations));
await rename(durationsDraft, durationsPath);
const comparison = compareStage(selected, results, expectedFailures, engines);
const report = {
  ...buildReport,
  engines,
  workers,
  buildSeconds,
  browserSeconds,
  status: comparison.status,
  comparison,
  results,
};
const reportPath = path.join(temporaryRoot, command === "stage" ? "stage.json" : "browser.json");
await writeFile(reportPath, JSON.stringify(report, null, 2));
let unionError;
if (report.status === "passed" && command !== "stage")
  try {
    verifyUnion(selected, [report], sha, engines);
  } catch (error) {
    unionError = error;
  }
// A passing `browser` run in the default parent removes its folder, so run folders do not pile
// up. Failures, `stage` reports, `build` output and `--artifact-dir` runs keep their folder.
const removeFolder =
  command === "browser" &&
  report.status === "passed" &&
  !unionError &&
  !flag("--artifact-dir") &&
  !process.argv.includes("--keep-artifacts");
printSummary(
  report,
  removeFolder ? "run folder removed (pass --keep-artifacts to keep it)" : reportPath,
);
if (unionError) throw unionError;
if (report.status !== "passed") process.exitCode = 1;
// `rm` removes a `--reuse-build` link and leaves the linked build in place.
if (removeFolder) await rm(temporaryRoot, { recursive: true, force: true });

function printSummary(report, file) {
  const slices = shard !== undefined ? [selected] : partitionCases(stageGates.cases);
  const ids = new Set(selected.map((item) => item.id));
  const lines = [];
  for (const [index, slice] of slices.entries()) {
    const sliceIds = new Set(slice.filter((item) => ids.has(item.id)).map((item) => item.id));
    if (!sliceIds.size) continue;
    const sliceResults = report.results.filter((result) => sliceIds.has(result.caseId));
    const checks = report.comparison.checks.filter((check) => sliceIds.has(check.caseId));
    const label = shard !== undefined ? `shard ${shard}` : `shard ${index}`;
    lines.push(
      `  ${label}: ${sliceIds.size} cases, ${sliceResults.filter((r) => r.status === "passed").length}/${sliceResults.length} results, ${checks.filter((c) => c.actual === "passed").length}/${checks.length} assertions passed`,
    );
  }
  const slow = report.results
    .filter((result) => result.durationMs > 2000)
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, 10)
    .map((r) => `  ${(r.durationMs / 1000).toFixed(1)}s ${r.engine}/${r.caseId}/${r.target}`);
  const passed = report.results.filter((item) => item.status === "passed").length;
  console.log(
    [
      `Direction ${command} (${report.engines.join(", ")}; ${report.workers} workers): build ${report.buildSeconds.toFixed(1)}s, browsers ${report.browserSeconds.toFixed(1)}s`,
      ...(caseId ? [] : lines),
      ...(slow.length ? ["Slowest results over 2s:", ...slow] : []),
      ...report.comparison.issues
        .slice(0, 20)
        .map(
          (issue) =>
            `  issue ${issue.type}: ${(issue.result ?? issue.key ?? "").replaceAll("\u001f", "/")} ${issue.assertionId ?? ""}`,
        ),
      `Direction ${command}: ${passed}/${report.results.length} results passed, ${report.comparison.checks.length} assertions, ${report.comparison.status}; ${file}`,
    ].join("\n"),
  );
}

async function generateCandidate(root) {
  const candidate = path.join(root, "candidate");
  const options = { repoRoot: candidate };
  await mkdir(candidate, { recursive: true });
  await copyFile(
    path.join(ROOT, "prettier.config.mjs"),
    path.join(candidate, "prettier.config.mjs"),
  );
  await generateAstroPrimitiveWrappers({ ...options, outputDir: "packages/astro/src" });
  await generateStarwindAstroWrappers({
    ...options,
    outputDir: "styled/astro",
    primitiveOutputDir: "packages/astro/src",
  });
  await generateReactPrimitiveWrappers({ ...options, outputDir: "packages/react/src" });
  await generateStarwindReactWrappers({
    ...options,
    outputDir: "styled/react",
    primitiveOutputDir: "packages/react/src",
  });
  await generateVuePrimitiveWrappers({ ...options, outputDir: "packages/vue/src" });
  await generateStarwindVueWrappers({
    ...options,
    outputDir: "styled/vue",
    primitiveOutputDir: "packages/vue/src",
  });
  await generateSveltePrimitiveWrappers({
    repoRoot: candidate,
    outputRoot: path.join(candidate, "packages/svelte/src"),
  });
  await generateSvelteStyled({
    repoRoot: candidate,
    outputRoot: path.join(candidate, "styled/svelte"),
  });
  const candidateReal = await realpath(candidate);
  for (const target of TARGETS) {
    const actual = await realpath(path.join(candidate, `styled/${target}/button/index.ts`));
    assert(
      actual.startsWith(candidateReal + path.sep),
      `${target} import escaped the candidate tree`,
    );
  }
}

async function linkInstalledConsumerDependencies(root) {
  const homes = [
    "apps/demo",
    "apps/react-demo",
    "apps/vue-demo",
    "apps/svelte-demo",
    "packages/astro",
    "packages/react",
    "packages/vue",
    "packages/svelte",
  ];
  for (const home of homes) {
    const manifest = JSON.parse(await readFile(path.join(ROOT, home, "package.json"), "utf8"));
    for (const name of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })) {
      if (name.startsWith("@starwind-ui/")) continue;
      const destination = path.join(root, "node_modules", name);
      if (
        await lstat(destination).then(
          () => true,
          () => false,
        )
      )
        continue;
      const source = path.join(ROOT, home, "node_modules", name);
      if (
        !(await realpath(source).then(
          () => true,
          () => false,
        ))
      )
        continue;
      await mkdir(path.dirname(destination), { recursive: true });
      await symlink(source, destination, "dir");
    }
  }
}

async function writeFixtures(root, cases) {
  const fixtureRoot = path.join(root, "fixtures");
  const legacySource = cases.some((item) => item.row.startsWith("legacy:"))
    ? `@source "${path.join(ROOT, "apps/demo/src/components/starwind").replaceAll("\\", "/")}";\n`
    : "";
  const sheet =
    (await readFile(path.join(ROOT, "apps/demo/src/styles/starwind.css"), "utf8")) +
    `\n@source "${path.join(root, "candidate").replaceAll("\\", "/")}";\n@source "${fixtureRoot.replaceAll("\\", "/")}";\n${legacySource}`;
  await writeFile(path.join(root, "candidate.css"), sheet);
  await mkdir(path.join(fixtureRoot, "astro/pages"), { recursive: true });
  for (const item of cases) {
    for (const target of TARGETS) {
      const fixture = item.fixtures[target];
      if (!fixture) continue;
      if (target === "astro") {
        await writeFile(path.join(fixtureRoot, `astro/pages/${item.id}.astro`), fixture.source);
        continue;
      }
      const entry = path.join(fixtureRoot, `${item.id}-${target}`);
      await mkdir(entry, { recursive: true });
      const componentFile = {
        react: fixture.ssr ? "Page.tsx" : "entry.tsx",
        vue: "Page.vue",
        svelte: "Page.svelte",
      }[target];
      await writeFile(path.join(entry, componentFile), fixture.source);
      if (fixture.ssr) {
        const hydrate = {
          react:
            'import {createElement} from "react"; import {hydrateRoot} from "react-dom/client"; hydrateRoot(app, createElement(Page));',
          vue: 'import {createSSRApp} from "vue"; createSSRApp(Page).mount(app);',
          svelte: 'import {hydrate} from "svelte"; hydrate(Page, {target:app});',
        };
        await writeFile(
          path.join(entry, "entry.ts"),
          `import Page from "./${componentFile}"; const app = document.getElementById("app"); ${hydrate[target]}`,
        );
      } else if (target !== "react") {
        const source =
          target === "vue"
            ? `import { createApp } from "vue"; import Page from "./Page.vue"; createApp(Page).mount("#app");`
            : `import { mount } from "svelte"; import Page from "./Page.svelte"; mount(Page, { target: document.getElementById("app") });`;
        await writeFile(path.join(entry, "entry.ts"), source);
      }
      const main = target === "react" && !fixture.ssr ? "entry.tsx" : "entry.ts";
      await writeFile(
        path.join(fixtureRoot, `${item.id}-${target}.html`),
        `<!doctype html><html><head><meta charset="utf-8"><title>${item.id} ${target}</title></head><body><div id="app"></div><script type="module" src="./${item.id}-${target}/${main}"></script></body></html>`,
      );
    }
  }
}

async function verifyConsumerImports(root, cases) {
  const candidate = await realpath(path.join(root, "candidate"));
  for (const item of cases)
    for (const target of TARGETS) {
      const source = item.fixtures[target]?.source;
      if (!source) continue;
      for (const match of source.matchAll(
        /@direction\/styled-(astro|react|vue|svelte)\/([a-z-]+)/g,
      )) {
        assert.equal(match[1], target, `${item.id}/${target} imports a different framework`);
        const resolved = await realpath(
          path.join(candidate, `styled/${target}/${match[2]}/index.ts`),
        );
        assert(
          resolved.startsWith(candidate + path.sep),
          `${item.id}/${target} import escaped candidate output`,
        );
      }
      for (const match of source.matchAll(/@direction\/legacy-astro\/([a-z-]+)/g)) {
        assert.equal(target, "astro", `${item.id} imports a legacy Astro component in ${target}`);
        assert.equal(item.row, `legacy:${match[1]}`, `${item.id} legacy import differs from row`);
        await realpath(path.join(ROOT, "apps/demo/src/components/starwind", match[1], "index.ts"));
      }
    }
}

function aliases(root, server = false) {
  const candidate = path.join(root, "candidate");
  return [
    { find: "@direction/sheet", replacement: path.join(root, "candidate.css") },
    ...TARGETS.map((target) => ({
      find: new RegExp(`^@direction/styled-${target}/(.+)$`),
      replacement: path.join(candidate, `styled/${target}/$1`),
    })),
    {
      find: /^@direction\/legacy-astro\/(.+)$/,
      replacement: path.join(ROOT, "apps/demo/src/components/starwind/$1"),
    },
    { find: /^@\/(.+)$/, replacement: path.join(ROOT, "apps/demo/src/$1") },
    ...TARGETS.map((target) => ({
      find: new RegExp(`^@starwind-ui/${target}/(.+)$`),
      replacement: path.join(candidate, `packages/${target}/src/$1/index.ts`),
    })),
    {
      find: /^@starwind-ui\/runtime\/init-starwind$/,
      replacement: path.join(ROOT, "packages/runtime/src/init-starwind.ts"),
    },
    {
      find: /^@starwind-ui\/runtime\/theme$/,
      replacement: path.join(ROOT, "packages/runtime/src/theme/theme.ts"),
    },
    {
      find: /^@starwind-ui\/runtime\/(.+)$/,
      replacement: path.join(ROOT, "packages/runtime/src/components/$1/index.ts"),
    },
    {
      find: /^@starwind-ui\/runtime$/,
      replacement: path.join(ROOT, "packages/runtime/src/index.ts"),
    },
    ...(server
      ? []
      : [
          {
            find: /^react(\/.*)?$/,
            replacement: path.join(ROOT, "packages/react/node_modules/react$1"),
          },
          {
            find: /^react-dom(\/.*)?$/,
            replacement: path.join(ROOT, "packages/react/node_modules/react-dom$1"),
          },
        ]),
  ];
}

async function buildFrameworkPages(root, cases) {
  const fixtureRoot = path.join(root, "fixtures");
  const inputs = cases.flatMap((item) =>
    ["react", "vue", "svelte"]
      .filter((target) => item.fixtures[target])
      .map((target) => path.join(fixtureRoot, `${item.id}-${target}.html`)),
  );
  const config = () => ({
    configFile: false,
    root: fixtureRoot,
    logLevel: "warn",
    mode: "development",
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
    },
    esbuild: {
      jsx: "automatic",
      tsconfigRaw: JSON.stringify({ compilerOptions: { target: "ES2022", jsx: "automatic" } }),
    },
    plugins: [
      tailwindcss(),
      svelte({ configFile: false, compilerOptions: { dev: false } }),
      {
        name: "direction-vue",
        enforce: "pre",
        transform(source, id) {
          if (!id.endsWith(".vue")) return;
          return ts.transpileModule(compileVueSfc(source, id), {
            compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
            fileName: id,
          }).outputText;
        },
      },
    ],
    resolve: { alias: aliases(root), dedupe: ["vue", "svelte"] },
    // A run-owned cache lets several direction runs build at the same time in one checkout.
    cacheDir: path.join(root, ".vite/app"),
  });
  const serverCases = cases.flatMap((item) =>
    ["react", "vue", "svelte"]
      .filter((target) => item.fixtures[target]?.ssr)
      .map((target) => ({ target, id: item.id })),
  );
  if (serverCases.length) {
    const require = createRequire(path.join(root, "package.json"));
    const server = await createViteServer({
      ...config(),
      resolve: { alias: aliases(root, true), dedupe: ["vue", "svelte", "react", "react-dom"] },
      optimizeDeps: { noDiscovery: true, include: [] },
      appType: "custom",
      server: { middlewareMode: true, watch: null, hmr: false },
    });
    try {
      for (const { target, id } of serverCases) {
        const entry = `/${id}-${target}/Page.${target === "react" ? "tsx" : target}`;
        const { default: Page } = await server.ssrLoadModule(entry);
        let markup;
        if (target === "react") {
          const { createElement } = require("react");
          const { renderToString } = require("react-dom/server");
          markup = renderToString(createElement(Page));
        } else if (target === "vue") {
          const { createSSRApp } = require("vue");
          const { renderToString } = require("vue/server-renderer");
          markup = await renderToString(createSSRApp(Page));
        } else {
          const { render } = await server.ssrLoadModule("svelte/server");
          markup = render(Page).body;
        }
        assert(markup.trim(), `Empty ${target} SSR fixture ${id}`);
        const file = path.join(fixtureRoot, `${id}-${target}.html`);
        const html = await readFile(file, "utf8");
        await writeFile(
          file,
          html.replace('<div id="app"></div>', () => `<div id="app">${markup}</div>`),
        );
      }
    } finally {
      await server.close();
    }
  }
  await viteBuild({
    ...config(),
    build: {
      outDir: path.join(root, "dist/app"),
      emptyOutDir: true,
      minify: false,
      target: "es2022",
      reportCompressedSize: false,
      rollupOptions: {
        input: inputs,
        onwarn(warning, warn) {
          if (!["MODULE_LEVEL_DIRECTIVE", "SOURCEMAP_ERROR"].includes(warning.code)) warn(warning);
        },
      },
    },
  });
}

async function buildAstroPages(root) {
  const demo = path.join(ROOT, "apps/demo");
  // Astro writes `.astro/` content modules and types under its root and imports them back. A
  // run-owned root keeps this build out of `apps/demo/.astro`, which the demo build also uses.
  // It links the demo dependencies and extends the demo tsconfig, so resolution stays the same.
  const astroRoot = path.join(root, "astro-root");
  await mkdir(astroRoot, { recursive: true });
  await symlink(path.join(demo, "node_modules"), path.join(astroRoot, "node_modules"), "dir");
  await symlink(path.join(demo, "package.json"), path.join(astroRoot, "package.json"));
  await writeFile(
    path.join(astroRoot, "tsconfig.json"),
    JSON.stringify({ extends: path.join(demo, "tsconfig.json") }),
  );
  const require = createRequire(path.join(astroRoot, "package.json"));
  const { build } = await import(require.resolve("astro"));
  const previous = process.cwd();
  try {
    process.chdir(astroRoot);
    await build({
      configFile: false,
      root: astroRoot,
      srcDir: path.join(root, "fixtures/astro"),
      publicDir: path.join(demo, "public"),
      outDir: path.join(root, "dist/astro"),
      base: "/astro",
      logLevel: "error",
      devToolbar: { enabled: false },
      cacheDir: path.join(root, ".astro-cache"),
      vite: {
        plugins: [tailwindcss()],
        resolve: { alias: aliases(root) },
        cacheDir: path.join(root, ".vite/astro"),
      },
    });
  } finally {
    process.chdir(previous);
  }
}
