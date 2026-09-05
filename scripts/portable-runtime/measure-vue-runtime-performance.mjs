import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { chromium } from "playwright";

import {
  createRuntimePerformanceResult,
  writeStagedArtifacts,
} from "./runtime-performance/model.mjs";
import {
  buildVueComparatorFixture,
  validateVueComparatorInstall,
  vueComparatorExpectedResolvedVersions,
  vueComparatorInstallSpecifiers,
} from "./runtime-performance/vue-comparator-fixtures.mjs";
import {
  VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
  vuePerformanceProviderRows,
} from "./runtime-performance/vue-plan.mjs";
import {
  buildVuePerformanceEvidence,
  buildVuePerformanceRowRecord,
  checkVuePerformanceEvidence,
  createVuePerformanceEligibility,
  createVuePerformanceAudit,
  createVuePerformanceDiagnosticRun,
  createVuePerformanceRun,
  assertVuePerformanceEligibilityForRun,
  publishVuePerformanceEvidence,
  publishVuePerformanceRow,
  serializeVuePerformanceEvidence,
  validateVuePerformanceEligibility,
  VUE_PERFORMANCE_MOUNT_SAMPLING_CONTROL,
} from "./runtime-performance/vue-run-evidence.mjs";
import {
  renderVuePerformanceEvidenceMarkdown,
  renderVuePerformanceRunMarkdown,
} from "./runtime-performance/vue-report.mjs";
import {
  buildStarwindVueFixture,
  buildStarwindVuePerformanceAliases,
} from "./runtime-performance/vue-starwind-fixture.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const VUE_PERFORMANCE_REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "../..");
export const VUE_PERFORMANCE_VIEWPORT = Object.freeze({
  deviceScaleFactor: 1,
  height: 900,
  width: 1280,
});
export const VUE_PERFORMANCE_OPERATION_TIMEOUT_MS = 15_000;
export const VUE_PERFORMANCE_GC_POLICY = "collect-before-each-sample-if-available";
export const VUE_PERFORMANCE_MOUNT_GROUP_COUNT = 1;
export const VUE_PERFORMANCE_MOUNT_ITERATIONS_PER_GROUP =
  VUE_PERFORMANCE_MOUNT_SAMPLING_CONTROL.iterations;
export const VUE_PERFORMANCE_EVIDENCE_PATHS = Object.freeze({
  audit: path.join(VUE_PERFORMANCE_REPO_ROOT, VUE_PERFORMANCE_REKA_AUDIT_SOURCE),
  json: path.join(
    VUE_PERFORMANCE_REPO_ROOT,
    ".scratch/vue-runtime-performance-comparison/evidence/vue-runtime-performance-baseline.json",
  ),
  markdown: path.join(
    VUE_PERFORMANCE_REPO_ROOT,
    ".scratch/vue-runtime-performance-comparison/evidence/vue-runtime-performance-baseline.md",
  ),
  eligibility: path.join(
    VUE_PERFORMANCE_REPO_ROOT,
    ".scratch/vue-runtime-performance-comparison/evidence/vue-runtime-performance-eligibility.json",
  ),
  rows: path.join(
    VUE_PERFORMANCE_REPO_ROOT,
    ".scratch/vue-runtime-performance-comparison/evidence/rows",
  ),
  rejected: path.join(
    VUE_PERFORMANCE_REPO_ROOT,
    ".scratch/vue-runtime-performance-comparison/evidence/rejected-candidates",
  ),
});

if (isMainModule()) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export async function main(argv = [], dependencies = {}) {
  const config = buildVuePerformanceRunConfig(argv);
  if (config.mode === "list") {
    (dependencies.log ?? console.log)(formatVuePerformanceList());
    return;
  }
  if (config.mode === "check") {
    return (dependencies.checkEvidence ?? checkAcceptedVuePerformanceEvidence)();
  }
  return (dependencies.run ?? runVuePerformance)(config, dependencies);
}

export function buildVuePerformanceRunConfig(argv = []) {
  const parsed = {
    baseline: false,
    check: false,
    list: false,
    providers: [],
    scenarios: [],
    smoke: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (
      argument === "--baseline" ||
      argument === "--check" ||
      argument === "--list" ||
      argument === "--smoke"
    ) {
      parsed[argument.slice(2)] = true;
      continue;
    }
    const [flag, inline] = argument.includes("=") ? argument.split("=", 2) : [argument, null];
    if (flag !== "--scenario" && flag !== "--provider") {
      throw new Error(`Unknown Vue performance option: ${argument}`);
    }
    const value = inline ?? argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
    if (inline == null) index += 1;
    parsed[flag === "--scenario" ? "scenarios" : "providers"].push(value);
  }
  const special = [parsed.baseline, parsed.check, parsed.list].filter(Boolean).length;
  if (special > 1) throw new Error("Vue baseline, check, and list modes are mutually exclusive");
  const focused = parsed.providers.length > 0 || parsed.scenarios.length > 0;
  if ((parsed.check || parsed.list) && focused)
    throw new Error("Vue check and list modes cannot use row filters");
  if (
    parsed.baseline &&
    focused &&
    !(parsed.providers.length === 1 && parsed.scenarios.length === 1)
  )
    throw new Error("Focused Vue baseline capture requires one scenario and one provider");
  if (parsed.smoke && (parsed.baseline || parsed.check || parsed.list)) {
    throw new Error("Vue smoke mode can only run diagnostic rows");
  }
  const rows = selectVuePerformanceRows(parsed);
  if (parsed.baseline && focused && rows.length !== 1)
    throw new Error("Focused Vue baseline capture must select exactly one row");
  return Object.freeze({
    focused,
    mode: parsed.check ? "check" : parsed.list ? "list" : parsed.baseline ? "baseline" : "run",
    providers: Object.freeze([...new Set(parsed.providers)]),
    rows,
    scenarios: Object.freeze([...new Set(parsed.scenarios)]),
    smoke: parsed.smoke,
  });
}

export function selectVuePerformanceRows({ providers = [], scenarios = [] } = {}) {
  const knownProviders = new Set(vuePerformanceProviderRows.map(({ provider }) => provider));
  const knownScenarios = new Set(vuePerformanceProviderRows.map(({ scenario }) => scenario));
  for (const provider of providers)
    if (!knownProviders.has(provider))
      throw new Error(`Unknown Vue performance provider: ${provider}`);
  for (const scenario of scenarios)
    if (!knownScenarios.has(scenario))
      throw new Error(`Unknown Vue performance scenario: ${scenario}`);
  const providerSet = new Set(providers);
  const scenarioSet = new Set(scenarios);
  const rows = vuePerformanceProviderRows.filter(
    (row) =>
      (providerSet.size === 0 || providerSet.has(row.provider)) &&
      (scenarioSet.size === 0 || scenarioSet.has(row.scenario)),
  );
  if (rows.length === 0) throw new Error("Vue performance filters selected no rows");
  return Object.freeze(rows);
}

export function formatVuePerformanceList() {
  return `${vuePerformanceProviderRows.map((row) => `${row.id}\t${row.type}\tCPU ${row.cpuThrottle}x`).join("\n")}\n`;
}

export async function runVuePerformance(config, dependencies = {}) {
  const progress = dependencies.progress ?? dependencies.log ?? console.log;
  const runOnce =
    dependencies.runOnce ?? ((runConfig) => runVuePerformanceOnce(runConfig, { progress }));
  const preserveRejected = dependencies.publishRejected ?? publishRejectedVuePerformanceCandidate;
  if (config.mode === "baseline") {
    const assertCleanWorktree =
      dependencies.assertCleanWorktree ?? assertVuePerformanceBaselineWorktree;
    const readAudit =
      dependencies.readAudit ??
      (() =>
        createVuePerformanceAudit({
          contents: readFileSync(VUE_PERFORMANCE_EVIDENCE_PATHS.audit),
          source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
        }));
    const readEligibility =
      dependencies.readEligibility ??
      (() => JSON.parse(readFileSync(VUE_PERFORMANCE_EVIDENCE_PATHS.eligibility, "utf8")));
    const readRecords = dependencies.readRecords ?? readAcceptedVuePerformanceRows;
    const publishRow =
      dependencies.publishRow ??
      ((record) =>
        publishVuePerformanceRow({
          record,
          rowPath: path.join(VUE_PERFORMANCE_EVIDENCE_PATHS.rows, `${safeRowId(record.id)}.json`),
        }));
    let activeRow = null;
    try {
      assertCleanWorktree();
      const audit = readAudit();
      const eligibility = validateVuePerformanceEligibility(readEligibility());
      if (
        serializeVuePerformanceEvidence(eligibility.audit) !==
        serializeVuePerformanceEvidence(audit)
      )
        throw new Error("Vue performance eligibility audit linkage differs");
      const existing = readRecords();
      const partial = buildVuePerformanceEvidence(
        { audit, records: existing },
        { requireComplete: false },
      );
      if (
        partial.collection &&
        (partial.collection.revision !== eligibility.revision ||
          serializeVuePerformanceEvidence(partial.collection.environment) !==
            serializeVuePerformanceEvidence(eligibility.environment) ||
          serializeVuePerformanceEvidence(partial.collection.machine) !==
            serializeVuePerformanceEvidence(eligibility.machine))
      )
        throw new Error("Vue performance accepted rows differ from smoke eligibility");
      const present = new Set(existing.map(({ id }) => id));
      const rows = config.focused ? config.rows : config.rows.filter(({ id }) => !present.has(id));
      for (const [index, row] of rows.entries()) {
        activeRow = row;
        assertCleanWorktree();
        const rowConfig = {
          ...config,
          focused: true,
          providers: [row.provider],
          rows: [row],
          scenarios: [row.scenario],
        };
        const run = await runOnce({ ...rowConfig, runIndex: 1 });
        assertCleanWorktree();
        assertVuePerformanceEligibilityForRun(eligibility, run);
        const record = buildVuePerformanceRowRecord({ audit, run });
        const nextRecords = [...existing, record].filter(
          (candidate, candidateIndex, candidates) =>
            candidates.findLastIndex(({ id }) => id === candidate.id) === candidateIndex,
        );
        buildVuePerformanceEvidence(
          {
            audit,
            records: nextRecords,
          },
          { requireComplete: false },
        );
        assertCleanWorktree();
        if (nextRecords.length === vuePerformanceProviderRows.length) {
          const evidence = buildVuePerformanceEvidence({ audit, records: nextRecords });
          (dependencies.publishEvidence ?? publishVuePerformanceEvidence)({
            evidence,
            jsonPath: VUE_PERFORMANCE_EVIDENCE_PATHS.json,
            markdown: renderVuePerformanceEvidenceMarkdown(evidence),
            markdownPath: VUE_PERFORMANCE_EVIDENCE_PATHS.markdown,
            rowPath: path.join(VUE_PERFORMANCE_EVIDENCE_PATHS.rows, `${safeRowId(record.id)}.json`),
            rowRecord: record,
          });
        } else {
          publishRow(record);
        }
        const prior = existing.findIndex(({ id }) => id === record.id);
        if (prior === -1) existing.push(record);
        else existing[prior] = record;
        progress(`[vue:perf] capture ${index + 1}/${rows.length} ${row.id} complete`);
      }
      return existing;
    } catch (error) {
      preserveRejected({ config, error, rows: activeRow ? [activeRow.id] : [] });
      throw error;
    }
  }
  let run;
  try {
    if (config.smoke && !config.focused)
      (dependencies.assertCleanWorktree ?? assertVuePerformanceBaselineWorktree)();
    run = await runOnce({ ...config, runIndex: 1 });
    progress("[vue:perf] run 1/1 complete");
  } catch (error) {
    preserveRejected({ config, error, runs: [] });
    throw error;
  }
  if (config.smoke && !config.focused) {
    const assertCleanWorktree =
      dependencies.assertCleanWorktree ?? assertVuePerformanceBaselineWorktree;
    assertCleanWorktree();
    const audit = (
      dependencies.readAudit ??
      (() =>
        createVuePerformanceAudit({
          contents: readFileSync(VUE_PERFORMANCE_EVIDENCE_PATHS.audit),
          source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
        }))
    )();
    const eligibility = createVuePerformanceEligibility({
      audit,
      environment: run.environment,
      machine: run.machine,
      refreshedAt: run.completedAt,
    });
    assertCleanWorktree();
    (
      dependencies.publishEligibility ??
      ((value) =>
        writeStagedArtifacts([
          {
            content: serializeVuePerformanceEvidence(value),
            path: VUE_PERFORMANCE_EVIDENCE_PATHS.eligibility,
          },
        ]))
    )(eligibility);
  }
  const stamp = run.completedAt.replaceAll(":", "-");
  const outputRoot = path.join(
    VUE_PERFORMANCE_REPO_ROOT,
    ".scratch/vue-runtime-performance-comparison/evidence/runs",
  );
  const base = `${stamp}-${run.environment.commit.slice(0, 12)}`;
  const diagnosticRun = createVuePerformanceDiagnosticRun(run);
  return (dependencies.writeRunArtifacts ?? writeStagedArtifacts)([
    {
      content: serializeVuePerformanceEvidence(diagnosticRun),
      path: path.join(outputRoot, `${base}.json`),
    },
    {
      content: renderVuePerformanceRunMarkdown({
        environment: run.environment,
        flags: run.flags,
        focused: config.focused,
        rows: run.rows,
      }),
      path: path.join(outputRoot, `${base}.md`),
    },
  ]);
}

export function readAcceptedVuePerformanceRows({
  readDirectory = readdirSync,
  readFile = readFileSync,
  rowsPath = VUE_PERFORMANCE_EVIDENCE_PATHS.rows,
} = {}) {
  if (!existsSync(rowsPath)) return [];
  return readDirectory(rowsPath)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFile(path.join(rowsPath, file), "utf8")));
}

export function assertVuePerformanceBaselineWorktree({ execute = execFileSync } = {}) {
  const status = execute("git", ["status", "--porcelain", "--untracked-files=all"], {
    cwd: VUE_PERFORMANCE_REPO_ROOT,
    encoding: "utf8",
  });
  const allowedPrefixes = [
    ".scratch/vue-runtime-performance-comparison/evidence/rejected-candidates/",
    ".scratch/vue-runtime-performance-comparison/evidence/runs/",
    ".scratch/vue-runtime-performance-comparison/evidence/rows/",
  ];
  const allowedFiles = new Set([
    ".scratch/vue-runtime-performance-comparison/evidence/vue-runtime-performance-eligibility.json",
    ".scratch/vue-runtime-performance-comparison/evidence/vue-runtime-performance-baseline.json",
    ".scratch/vue-runtime-performance-comparison/evidence/vue-runtime-performance-baseline.md",
  ]);
  const unexpected = status
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).replace(/^"|"$/g, ""))
    .filter(
      (file) =>
        !allowedFiles.has(file) && !allowedPrefixes.some((prefix) => file.startsWith(prefix)),
    );
  if (unexpected.length)
    throw new Error(`Vue baseline capture requires a clean worktree: ${unexpected.join(", ")}`);
}

export function publishRejectedVuePerformanceCandidate({
  config,
  error,
  execute = execFileSync,
  now = new Date(),
  rows = [],
  writeArtifacts = writeStagedArtifacts,
}) {
  const commit = execute("git", ["rev-parse", "HEAD"], {
    cwd: VUE_PERFORMANCE_REPO_ROOT,
    encoding: "utf8",
  }).trim();
  const rejectedAt = now.toISOString();
  const record = {
    command: "pnpm runtime:perf:vue:baseline",
    failedRows: rows,
    diagnostic: error instanceof Error ? error.message : String(error),
    expectedRowIds: vuePerformanceProviderRows.map(({ id }) => id),
    flags: createVuePerformanceFlags(config),
    rejectedAt,
    revision: commit,
    schema: "starwind.runtime-performance.vue-rejected-candidate",
    schemaVersion: 1,
  };
  const base = `${rejectedAt.replaceAll(":", "-")}-${commit.slice(0, 12)}`;
  return writeArtifacts([
    {
      content: serializeVuePerformanceEvidence(record),
      path: path.join(VUE_PERFORMANCE_EVIDENCE_PATHS.rejected, `${base}.json`),
    },
    {
      content: `# Rejected Vue performance candidate\n\n- Revision: \`${commit}\`\n- Rejected: ${rejectedAt}\n- Diagnostic: ${record.diagnostic}\n- Failed rows: ${rows.length ? rows.join(", ") : "unavailable"}\n`,
      path: path.join(VUE_PERFORMANCE_EVIDENCE_PATHS.rejected, `${base}.md`),
    },
  ]);
}

export function checkAcceptedVuePerformanceEvidence() {
  return checkVuePerformanceEvidence({
    auditPath: VUE_PERFORMANCE_EVIDENCE_PATHS.audit,
    eligibilityPath: VUE_PERFORMANCE_EVIDENCE_PATHS.eligibility,
    jsonPath: VUE_PERFORMANCE_EVIDENCE_PATHS.json,
    markdownPath: VUE_PERFORMANCE_EVIDENCE_PATHS.markdown,
    renderMarkdown: renderVuePerformanceEvidenceMarkdown,
    rowsPath: VUE_PERFORMANCE_EVIDENCE_PATHS.rows,
  });
}

export async function runVuePerformanceOnce(config, dependencies = {}) {
  assertBuiltVuePerformancePackages();
  const startedAt = new Date().toISOString();
  const temporaryRoot = (dependencies.makeTemporaryRoot ?? mkdtempSync)(
    path.join(
      process.env.STARWIND_MEASUREMENT_TMP_ROOT ?? os.tmpdir(),
      "starwind-vue-performance-",
    ),
  );
  const comparatorRoot = path.join(temporaryRoot, "comparators");
  const appRoot = path.join(temporaryRoot, "app");
  const distRoot = path.join(temporaryRoot, "dist");
  try {
    const install = await (dependencies.installComparators ?? installVueComparators)({
      comparatorRoot,
    });
    const app = writeVuePerformanceApp({ appRoot, comparatorRoot, rows: config.rows });
    await (dependencies.buildApp ?? buildVuePerformanceApp)({
      appRoot,
      distRoot,
      viteConfig: app.viteConfig,
    });
    const server = await (dependencies.startServer ?? startStaticServer)(distRoot);
    let browserResult;
    try {
      browserResult = await (dependencies.runBrowser ?? runVuePerformanceBrowser)({
        baseUrl: server.url,
        progress: dependencies.progress ?? console.log,
        rows: config.rows,
        smoke: config.smoke,
      });
    } finally {
      await server.close();
    }
    assertVuePerformanceBrowserResult(browserResult, config.rows);
    const environment = collectVuePerformanceEnvironment({
      browser: browserResult.browser,
      garbageCollectionAvailable: browserResult.garbageCollectionAvailable,
      packageVersions: install.resolved,
    });
    return createVuePerformanceRun({
      command: { arguments: process.argv.slice(2), executable: "pnpm runtime:perf:vue" },
      completedAt: new Date().toISOString(),
      environment,
      errors: browserResult.errors,
      flags: createVuePerformanceFlags(config),
      machine: collectVuePerformanceMachine(),
      rows: browserResult.rows,
      runIndex: config.runIndex,
      startedAt,
    });
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

export function createVuePerformanceFlags(config) {
  const mountSampling = config.smoke
    ? {
        ...VUE_PERFORMANCE_MOUNT_SAMPLING_CONTROL,
        iterations: 1,
        warmupCount: 0,
      }
    : VUE_PERFORMANCE_MOUNT_SAMPLING_CONTROL;
  return {
    controls: {
      garbageCollectionPolicy: VUE_PERFORMANCE_GC_POLICY,
      mountSampling,
      rows: config.rows.map(({ cpuThrottle, id, warmupCount, withinRunSampleCount }) => ({
        cpuThrottle,
        id,
        warmupCount,
        withinRunSampleCount,
      })),
    },
    focused: config.focused,
    mode: config.mode,
    providers: config.providers,
    scenarios: config.scenarios,
    smoke: config.smoke,
  };
}

export function collectVuePerformanceMachine({ cpus = os.cpus } = {}) {
  const processors = cpus();
  if (!Array.isArray(processors) || processors.length === 0)
    throw new Error("Cannot determine Vue performance CPU identity");
  const models = [...new Set(processors.map(({ model }) => model.trim()))];
  if (models.length !== 1 || models[0].length === 0)
    throw new Error("Vue performance CPU model differs across logical cores");
  return Object.freeze({ cpuModel: models[0], logicalCoreCount: processors.length });
}

export function installVueComparators({ comparatorRoot, execute = execFileSync }) {
  mkdirSync(comparatorRoot, { recursive: true });
  const specs = Object.values(vueComparatorInstallSpecifiers).flat();
  const dependencies = Object.fromEntries(
    specs.map((specifier) => {
      const separator = specifier.lastIndexOf("@");
      return [specifier.slice(0, separator), specifier.slice(separator + 1)];
    }),
  );
  writeFileSync(
    path.join(comparatorRoot, "package.json"),
    `${JSON.stringify({ dependencies, name: "starwind-vue-performance-comparators", packageManager: "pnpm@11.8.0", private: true, type: "module" }, null, 2)}\n`,
  );
  const commands = buildVueComparatorInstallCommands();
  try {
    execute(commands.offline.executable, commands.offline.arguments, {
      cwd: comparatorRoot,
      stdio: "inherit",
    });
  } catch {
    execute(commands.network.executable, commands.network.arguments, {
      cwd: comparatorRoot,
      stdio: "inherit",
    });
  }
  const requested = vueComparatorInstallSpecifiers;
  const resolved = Object.fromEntries(
    Object.entries(vueComparatorExpectedResolvedVersions).map(([provider, packages]) => [
      provider,
      Object.fromEntries(
        Object.keys(packages).map((name) => [
          name,
          JSON.parse(
            readFileSync(path.join(comparatorRoot, "node_modules", name, "package.json"), "utf8"),
          ).version,
        ]),
      ),
    ]),
  );
  validateVueComparatorInstall({ requested, resolved });
  return Object.freeze({
    requested,
    resolved: Object.freeze(Object.assign({}, resolved["zag-vue"], resolved["reka-ui"])),
  });
}

export function buildVueComparatorInstallCommands({ platform = process.platform } = {}) {
  const common = ["install", "--ignore-scripts", "--frozen-lockfile=false"];
  if (platform === "win32") {
    const windows = (arguments_) => ({
      arguments: [
        "/d",
        "/s",
        "/c",
        ["pnpm", ...arguments_].map(quoteWindowsCommandArgument).join(" "),
      ],
      executable: process.env.ComSpec ?? "cmd.exe",
    });
    return Object.freeze({ network: windows(common), offline: windows([...common, "--offline"]) });
  }
  return Object.freeze({
    network: Object.freeze({ arguments: common, executable: "pnpm" }),
    offline: Object.freeze({ arguments: [...common, "--offline"], executable: "pnpm" }),
  });
}

export function writeVuePerformanceApp({ appRoot, comparatorRoot, rows }) {
  mkdirSync(appRoot, { recursive: true });
  const sharedStyles = [
    "html,body{margin:0;font:14px sans-serif}",
    "#app{min-height:1px}",
    "[hidden]{display:none!important}",
    ".bench-popup{background:white;border:1px solid #777}",
    ".bench-item{display:block}",
  ].join("");
  writeFileSync(path.join(appRoot, "styles.css"), sharedStyles);
  mkdirSync(path.join(appRoot, "fixtures"), { recursive: true });
  writeFileSync(path.join(appRoot, "fixtures", "styles.css"), sharedStyles);
  for (const row of rows) {
    const rowRoot = path.join(appRoot, safeRowId(row.id));
    mkdirSync(rowRoot, { recursive: true });
    writeFileSync(
      path.join(rowRoot, "index.html"),
      '<!doctype html><html><body><div id="app"></div><div id="runtime-perf-overlays"></div><script type="module" src="/entries/' +
        safeRowId(row.id) +
        '.mjs"></script></body></html>',
    );
    const entryPath = path.join(appRoot, "entries", `${safeRowId(row.id)}.mjs`);
    mkdirSync(path.dirname(entryPath), { recursive: true });
    if (row.provider === "starwind-vue") {
      writeFileSync(
        entryPath,
        `import "../styles.css";\n${buildStarwindVueFixture(row.scenario).source}`,
      );
    } else {
      const fixturePath = path.join(appRoot, "fixtures", `${safeRowId(row.id)}.mjs`);
      mkdirSync(path.dirname(fixturePath), { recursive: true });
      writeFileSync(fixturePath, buildVueComparatorFixture(row.id).source);
      writeFileSync(entryPath, buildComparatorBrowserEntry({ fixturePath, row }));
    }
  }
  const requireFromVue = createRequire(
    path.join(VUE_PERFORMANCE_REPO_ROOT, "packages/vue/package.json"),
  );
  const requireFromVueDemo = createRequire(
    path.join(VUE_PERFORMANCE_REPO_ROOT, "apps/vue-demo/package.json"),
  );
  const vuePluginEntry = requireFromVueDemo.resolve("@vitejs/plugin-vue");
  const vueEntry = requireFromVue.resolve("vue");
  const aliases = buildStarwindVuePerformanceAliases({
    repoRoot: VUE_PERFORMANCE_REPO_ROOT,
    vueEntry,
  });
  const requireFromComparator = createRequire(path.join(comparatorRoot, "package.json"));
  const comparatorPackageNames = Object.values(vueComparatorExpectedResolvedVersions).flatMap(
    Object.keys,
  );
  const comparatorPackages = comparatorPackageNames.map((name) => ({
    find: new RegExp(`^${escapeRegExp(name)}$`),
    replacement: requireFromComparator.resolve(name),
  }));
  const viteConfig = {
    resolve: { alias: [...aliases.alias, ...comparatorPackages], dedupe: aliases.dedupe },
  };
  writeFileSync(
    path.join(appRoot, "vite.config.mjs"),
    `import { defineConfig } from ${JSON.stringify(pathToFileURL(requireFromVue.resolve("vite")).href)};\nimport vue from ${JSON.stringify(pathToFileURL(vuePluginEntry).href)};\nexport default defineConfig({ ...${serializeViteConfig(viteConfig, rows)}, plugins: [vue()] });\n`,
  );
  return Object.freeze({ viteConfig, vueEntry });
}

export async function buildVuePerformanceApp({ appRoot, distRoot }) {
  const requireFromVue = createRequire(path.join(VUE_PERFORMANCE_REPO_ROOT, "package.json"));
  const { build } = await import(pathToFileURL(requireFromVue.resolve("vite")).href);
  await build({
    build: { outDir: distRoot },
    configFile: path.join(appRoot, "vite.config.mjs"),
    logLevel: "warn",
    root: appRoot,
  });
}

export async function startStaticServer(root) {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    const file = path.resolve(root, `.${relative}`);
    if (!file.startsWith(`${path.resolve(root)}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      response.writeHead(200, {
        "content-type": file.endsWith(".html") ? "text/html" : "text/javascript",
      });
      response.end(readFileSync(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return Object.freeze({
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
    url: `http://127.0.0.1:${address.port}`,
  });
}

export function buildComparatorBrowserEntry({ fixturePath, row }) {
  assertComparatorActivationAction(row);
  const importPath = pathToFileURL(fixturePath).href;
  return [
    'import { nextTick } from "vue";',
    `import { assertEndpoint, fixtureContract, mountFixture } from ${JSON.stringify(importPath)};`,
    `const row = ${JSON.stringify({ activationAction: row.activationAction, domPhases: row.domPhases, id: row.id, scenario: row.scenario, sweepAction: row.sweepAction ?? null, type: row.type })};`,
    `(${comparatorFixtureBrowserRuntime.toString()})({ assertEndpoint, fixtureContract, mountFixture, nextTick, row });`,
  ].join("\n");
}

function assertComparatorActivationAction(row) {
  const canonical = vuePerformanceProviderRows.find(({ id }) => id === row?.id);
  if (!canonical) throw new Error(`Unknown Vue performance row: ${String(row?.id)}`);
  if (JSON.stringify(row.activationAction) !== JSON.stringify(canonical.activationAction)) {
    throw new Error(`${row.id} activationAction differs from the frozen plan`);
  }
}

function comparatorFixtureBrowserRuntime({
  assertEndpoint,
  fixtureContract,
  mountFixture,
  nextTick,
  row,
}) {
  const root = document.querySelector("#app");
  const portalTarget = document.querySelector("#runtime-perf-overlays");
  let fixture = null;
  const targets = () => [root, portalTarget];
  const queryAll = (selector) =>
    targets().flatMap((target) => [...target.querySelectorAll(selector)]);
  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  async function settle() {
    await nextTick();
    await frame();
    await nextTick();
  }
  const visible = (element) => !element.hidden && element.getClientRects().length > 0;
  const selectorByFact = {
    checkedItems: '[data-benchmark-radio-item][data-state="checked"]',
    contentLinks: "[data-benchmark-navigation-link]",
    contents: "[data-benchmark-content]",
    itemNodes:
      "[data-benchmark-item], [data-benchmark-submenu-trigger], [data-benchmark-tab-trigger], [data-benchmark-accordion-trigger], [data-benchmark-radio-item], [data-benchmark-navigation-link]",
    lists: "[data-benchmark-list]",
    overlays: "[data-benchmark-overlay]",
    panels: "[data-benchmark-panel]",
    popups: "[data-benchmark-popup]",
    positioners: "[data-benchmark-positioner]",
    primaryContentLinks: '[data-benchmark-navigation-link="primary"]',
    secondaryContentLinks: '[data-benchmark-navigation-link="secondary"]',
    submenuItemNodes: "[data-benchmark-submenu-item]",
    targetCheckedItems: '[data-benchmark-radio-item="target"][data-state="checked"]',
    viewports: "[data-benchmark-viewport]",
  };
  function countFact(fact) {
    const stateMatch = /^(hidden|visible)(.+)$/.exec(fact);
    if (stateMatch) {
      const base = stateMatch[2][0].toLowerCase() + stateMatch[2].slice(1);
      let selector = selectorByFact[base];
      if (base === "primaryContents") selector = '[data-benchmark-navigation-content="primary"]';
      if (base === "secondaryContents")
        selector = '[data-benchmark-navigation-content="secondary"]';
      if (base === "submenuContents") selector = '[data-benchmark-content="submenu"]';
      if (base === "targetPanels") selector = '[data-benchmark-panel="target"]';
      if (!selector) throw new Error("Unknown Vue DOM phase fact: " + fact);
      return queryAll(selector).filter((element) =>
        stateMatch[1] === "visible" ? visible(element) : !visible(element),
      ).length;
    }
    const selector = selectorByFact[fact];
    if (!selector) throw new Error("Unknown Vue DOM phase fact: " + fact);
    return queryAll(selector).length;
  }
  function assertPhase(name) {
    const phase = row.domPhases[name];
    for (const [fact, expected] of Object.entries(phase)) {
      const actual = countFact(fact);
      if (actual !== expected)
        throw new Error(`${row.id} ${name} ${fact}: expected ${expected}; received ${actual}`);
    }
  }
  function dispatch(element, type, init = {}) {
    const EventType = type.startsWith("key")
      ? KeyboardEvent
      : type.startsWith("pointer")
        ? PointerEvent
        : MouseEvent;
    element.dispatchEvent(
      new EventType(type, { bubbles: true, cancelable: true, composed: true, ...init }),
    );
  }
  function dispatchActivationEvent(element, event) {
    element.dispatchEvent(
      new MouseEvent(event.type, {
        bubbles: true,
        button: event.button,
        cancelable: true,
        composed: true,
      }),
    );
  }
  function forceLayout(element) {
    element.getBoundingClientRect();
  }
  function assertCurrentHighlight(item) {
    if (!(item instanceof HTMLElement) || !item.hasAttribute("data-highlighted")) {
      throw new Error("The current highlight item is not data-highlighted");
    }
  }
  function assertCurrentRadioChecked(item) {
    const checked =
      item instanceof HTMLElement &&
      (item.hasAttribute("data-checked") || item.getAttribute("data-state") === "checked");
    if (!checked) throw new Error("The current radio item is not data-checked");
  }
  function assertSweepContract() {
    if (JSON.stringify(fixtureContract.sweepAction) !== JSON.stringify(row.sweepAction)) {
      throw new Error(`${row.id} fixture sweepAction differs from the frozen plan`);
    }
    if (row.sweepAction?.sharedVueNextTickCount !== 1) {
      throw new Error(`${row.id} sweepAction must use exactly one shared Vue nextTick`);
    }
    if (row.sweepAction?.forcedLayout !== "after the current-item assertion") {
      throw new Error(`${row.id} sweepAction must force layout after its current-item assertion`);
    }
  }
  function assertActivationContract() {
    if (JSON.stringify(fixtureContract.activationAction) !== JSON.stringify(row.activationAction)) {
      throw new Error(`${row.id} fixture activationAction differs from the frozen plan`);
    }
    if (row.scenario !== "tabs-activation-click") {
      throw new Error(`${row.id} must not run the Tabs activation action`);
    }
    if (row.activationAction?.dispatch !== "synchronous") {
      throw new Error(`${row.id} activationAction must dispatch synchronously`);
    }
    if (
      JSON.stringify(row.activationAction?.events) !==
      JSON.stringify([
        { button: 0, type: "mousedown" },
        { button: 0, type: "mouseup" },
        { button: 0, type: "click" },
      ])
    ) {
      throw new Error(`${row.id} activationAction must dispatch mousedown, mouseup, and click`);
    }
  }
  async function activate(selector, kind) {
    const element = queryAll(selector)[0];
    if (!element) throw new Error(`Missing action target: ${selector}`);
    element.focus();
    if (kind === "click") dispatch(element, "click");
    else if (kind === "pointer")
      dispatch(element, "pointermove", { pointerId: 1, pointerType: "mouse" });
    else dispatch(element, "keydown", { key: kind, code: kind });
    await settle();
  }
  async function openPrimary() {
    const selector = fixtureContract.inputSelector || fixtureContract.triggerSelector;
    await activate(
      selector,
      row.scenario === "dialog-open"
        ? "click"
        : row.scenario.startsWith("combobox-")
          ? "ArrowDown"
          : "Enter",
    );
  }
  async function setup() {
    if (row.type === "mount") {
      if (root.childNodes.length || portalTarget.childNodes.length)
        throw new Error("Mount setup requires empty containers");
      return;
    }
    fixture = mountFixture({ root, portalTarget });
    await settle();
    assertPhase("rootInitialized");
    if (row.scenario.includes("item-highlight")) {
      if (row.scenario.startsWith("menu-submenu-")) {
        await activate("[data-benchmark-trigger]", "click");
        const parentPopup = queryAll("[data-benchmark-popup]:not([hidden])").find(
          (element) =>
            element.getAttribute("data-benchmark-popup") !== "submenu" && visible(element),
        );
        if (!parentPopup) throw new Error("The parent menu endpoint did not open during setup");
        await activate(fixtureContract.triggerSelector, "click");
        const submenuPopup = queryAll('[data-benchmark-popup="submenu"]:not([hidden])')[0];
        if (!submenuPopup || !visible(submenuPopup))
          throw new Error("The submenu endpoint did not open during setup");
      } else {
        await openPrimary();
      }
    } else if (row.scenario === "menu-submenu-open") {
      await activate("[data-benchmark-trigger]", "Enter");
    } else if (row.scenario === "tabs-activation-click") {
      const target = queryAll(fixtureContract.triggerSelector)[0];
      if (!(target instanceof HTMLElement)) throw new Error("Missing Tabs activation target");
      target.focus();
      if (document.activeElement !== target) {
        throw new Error("The final Tabs trigger is not focused before measurement");
      }
    }
    assertPhase("setupComplete");
    let acceptedBeforeAction = false;
    try {
      assertEndpoint({ root, portalTarget });
      acceptedBeforeAction = true;
    } catch {}
    if (acceptedBeforeAction) throw new Error("Visible endpoint passed before measured action");
  }
  async function measure() {
    const started = performance.now();
    if (row.type === "mount") {
      fixture = mountFixture({ root, portalTarget });
      await settle();
      assertPhase("rootInitialized");
    } else if (row.scenario.includes("item-highlight")) {
      assertSweepContract();
      for (const item of queryAll(fixtureContract.itemSelector)) {
        dispatch(item, "pointermove", { pointerId: 1, pointerType: "mouse" });
        await nextTick();
        assertCurrentHighlight(item);
        forceLayout(item);
      }
      await settle();
    } else if (row.scenario === "radio-group-change-sweep") {
      assertSweepContract();
      for (const item of queryAll(fixtureContract.itemSelector)) {
        item.click();
        await nextTick();
        assertCurrentRadioChecked(item);
        forceLayout(item);
      }
      await settle();
    } else if (row.scenario === "menu-submenu-open") {
      await activate(fixtureContract.triggerSelector, "click");
    } else if (row.scenario === "tabs-activation-click") {
      assertActivationContract();
      const target = queryAll(fixtureContract.triggerSelector)[0];
      if (!(target instanceof HTMLElement)) throw new Error("Missing Tabs activation target");
      if (document.activeElement !== target) {
        throw new Error("The final Tabs trigger lost focus before measurement");
      }
      for (const event of row.activationAction.events) {
        dispatchActivationEvent(target, event);
      }
      await settle();
      const panel = queryAll('[data-benchmark-panel="target"]')[0];
      if (!(panel instanceof HTMLElement)) throw new Error("Missing Tabs activation panel");
      forceLayout(panel);
      assertEndpoint({ root, portalTarget });
      assertPhase("measuredEndpoint");
      return performance.now() - started;
    } else if (
      row.scenario === "navigation-menu-content-switch" ||
      row.scenario.includes("toggle-click")
    ) {
      await activate(fixtureContract.triggerSelector, "click");
    } else {
      await openPrimary();
    }
    const endpoint = assertEndpoint({ root, portalTarget });
    endpoint.getBoundingClientRect();
    for (const element of queryAll(fixtureContract.itemSelector || fixtureContract.triggerSelector))
      element.getBoundingClientRect();
    assertPhase("measuredEndpoint");
    return performance.now() - started;
  }
  async function teardown() {
    if (!fixture) throw new Error("Vue comparator fixture was not mounted");
    await fixture.teardown();
  }
  window.__runtimePerf = Object.freeze({
    assertVisibleEndpoint: () => assertEndpoint({ root, portalTarget }),
    measure,
    ready: Promise.resolve(),
    scenario: row,
    setup,
    teardown,
    unmount: teardown,
  });
}

export async function runVuePerformanceBrowser({
  baseUrl,
  browserType = chromium,
  operationTimeoutMs = VUE_PERFORMANCE_OPERATION_TIMEOUT_MS,
  progress = () => {},
  rows,
  smoke = false,
}) {
  const deadline = (label, operation) =>
    withVuePerformanceDeadline(label, operation, operationTimeoutMs);
  const browserRevision = /chromium-(\d+)/.exec(browserType.executablePath())?.[1];
  if (!browserRevision) throw new Error("Cannot determine the Playwright Chromium revision");
  const browser = await deadline("browser launch", () => browserType.launch({ headless: true }));
  const output = { errors: [], garbageCollectionAvailable: null, rows: [] };
  try {
    for (const [rowIndex, row] of rows.entries()) {
      const samples = [];
      const rowErrors = [];
      const recordGarbageCollectionAvailability = (available) => {
        if (output.garbageCollectionAvailable == null)
          output.garbageCollectionAvailable = available;
        else if (output.garbageCollectionAvailable !== available)
          rowErrors.push("Browser garbage collection availability changed within the run");
      };
      const collectGarbage = async (session) => {
        let available = true;
        try {
          await deadline("CDP garbage collection", () =>
            session.send("HeapProfiler.collectGarbage"),
          );
        } catch (error) {
          available = false;
          if (error instanceof Error && error.message.includes("timed out")) throw error;
        }
        recordGarbageCollectionAvailability(available);
      };
      const assertCleanup = async (page) => {
        const cleanup = await deadline("cleanup assertion", () =>
          page.evaluate(() => ({
            overlayEmpty: document.querySelector("#runtime-perf-overlays").childNodes.length === 0,
            rootEmpty: document.querySelector("#app").childNodes.length === 0,
          })),
        );
        if (!cleanup.rootEmpty || !cleanup.overlayEmpty)
          throw new Error("Vue fixture teardown left DOM nodes");
      };
      const createRowPage = async () => {
        const context = await deadline("browser context creation", () =>
          browser.newContext({
            deviceScaleFactor: VUE_PERFORMANCE_VIEWPORT.deviceScaleFactor,
            viewport: {
              height: VUE_PERFORMANCE_VIEWPORT.height,
              width: VUE_PERFORMANCE_VIEWPORT.width,
            },
          }),
        );
        try {
          const page = await deadline("browser page creation", () => context.newPage());
          page.on("console", (message) => {
            if (message.type() === "error") rowErrors.push(`console: ${message.text()}`);
          });
          page.on("pageerror", (error) => rowErrors.push(`page: ${error.message}`));
          const session = await deadline("CDP session creation", () => context.newCDPSession(page));
          await deadline("CDP CPU throttle setup", () =>
            session.send("Emulation.setCPUThrottlingRate", { rate: row.cpuThrottle }),
          );
          await deadline("navigation", () =>
            page.goto(`${baseUrl}/${safeRowId(row.id)}/`, { waitUntil: "networkidle" }),
          );
          await deadline("ready", () => page.evaluate(() => window.__runtimePerf.ready));
          return { context, page, session };
        } catch (error) {
          try {
            await deadline("browser context close", () => context.close());
          } catch (closeError) {
            rowErrors.push(closeError instanceof Error ? closeError.message : String(closeError));
          }
          throw error;
        }
      };
      const closeContext = async (context) => {
        try {
          await deadline("browser context close", () => context.close());
        } catch (error) {
          rowErrors.push(error instanceof Error ? error.message : String(error));
        }
      };
      const runMountIteration = async ({ page, recordSample, session }) => {
        let cleanupComplete = false;
        let teardownComplete = false;
        try {
          await collectGarbage(session);
          await deadline("setup", () => page.evaluate(() => window.__runtimePerf.setup()));
          const sample = await deadline("measure", () =>
            page.evaluate(async () => {
              const started = performance.now();
              await window.__runtimePerf.measure();
              return performance.now() - started;
            }),
          );
          await deadline("assert", () =>
            page.evaluate(() => window.__runtimePerf.assertVisibleEndpoint()),
          );
          await deadline("teardown", () => page.evaluate(() => window.__runtimePerf.teardown()));
          teardownComplete = true;
          await assertCleanup(page);
          cleanupComplete = true;
          if (recordSample) samples.push(sample);
        } catch (error) {
          rowErrors.push(error instanceof Error ? error.message : String(error));
        } finally {
          if (!teardownComplete) {
            try {
              await deadline("failure teardown", () =>
                page.evaluate(() => window.__runtimePerf?.teardown?.()),
              );
            } catch (error) {
              rowErrors.push(error instanceof Error ? error.message : String(error));
            }
          }
          if (!cleanupComplete) {
            try {
              await assertCleanup(page);
            } catch (error) {
              rowErrors.push(error instanceof Error ? error.message : String(error));
            }
          }
        }
      };

      if (row.type === "mount") {
        const sampleCount = smoke ? 1 : VUE_PERFORMANCE_MOUNT_ITERATIONS_PER_GROUP;
        let rowPage;
        try {
          rowPage = await createRowPage();
          for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
            await runMountIteration({
              page: rowPage.page,
              recordSample: true,
              session: rowPage.session,
            });
          }
        } catch (error) {
          rowErrors.push(error instanceof Error ? error.message : String(error));
        } finally {
          if (rowPage) await closeContext(rowPage.context);
        }
      } else {
        const sampleCount = smoke ? 1 : row.withinRunSampleCount;
        for (let index = 0; index < sampleCount; index += 1) {
          let context;
          let page;
          let teardownComplete = false;
          try {
            context = await deadline("browser context creation", () =>
              browser.newContext({
                deviceScaleFactor: VUE_PERFORMANCE_VIEWPORT.deviceScaleFactor,
                viewport: {
                  height: VUE_PERFORMANCE_VIEWPORT.height,
                  width: VUE_PERFORMANCE_VIEWPORT.width,
                },
              }),
            );
            page = await deadline("browser page creation", () => context.newPage());
            page.on("console", (message) => {
              if (message.type() === "error") rowErrors.push(`console: ${message.text()}`);
            });
            page.on("pageerror", (error) => rowErrors.push(`page: ${error.message}`));
            const session = await deadline("CDP session creation", () =>
              context.newCDPSession(page),
            );
            await deadline("CDP CPU throttle setup", () =>
              session.send("Emulation.setCPUThrottlingRate", { rate: row.cpuThrottle }),
            );
            await collectGarbage(session);
            await deadline("navigation", () =>
              page.goto(`${baseUrl}/${safeRowId(row.id)}/`, { waitUntil: "networkidle" }),
            );
            await deadline("ready", () => page.evaluate(() => window.__runtimePerf.ready));
            await deadline("setup", () => page.evaluate(() => window.__runtimePerf.setup()));
            const sample = await deadline("measure", () =>
              page.evaluate(async () => {
                const started = performance.now();
                await window.__runtimePerf.measure();
                return performance.now() - started;
              }),
            );
            await deadline("assert", () =>
              page.evaluate(() => window.__runtimePerf.assertVisibleEndpoint()),
            );
            await deadline("teardown", () => page.evaluate(() => window.__runtimePerf.teardown()));
            teardownComplete = true;
            await assertCleanup(page);
            samples.push(sample);
          } catch (error) {
            rowErrors.push(error instanceof Error ? error.message : String(error));
          } finally {
            if (page && !teardownComplete) {
              try {
                await deadline("failure teardown", () =>
                  page.evaluate(() => window.__runtimePerf?.teardown?.()),
                );
              } catch (error) {
                rowErrors.push(error instanceof Error ? error.message : String(error));
              }
            }
            if (context) {
              try {
                await deadline("browser context close", () => context.close());
              } catch (error) {
                rowErrors.push(error instanceof Error ? error.message : String(error));
              }
            }
          }
        }
      }
      output.rows.push({
        errors: rowErrors,
        id: row.id,
        lifecycle: {
          endpointVisible: rowErrors.length === 0,
          overlayEmpty: rowErrors.length === 0,
          passed: rowErrors.length === 0,
          rootEmpty: rowErrors.length === 0,
        },
        result: createRuntimePerformanceResult({
          metric: row.metric,
          provider: row.provider,
          samples: samples.length ? samples : [Number.EPSILON],
          scenario: row.scenario,
        }),
      });
      output.errors.push(...rowErrors.map((message) => `${row.id}: ${message}`));
      progress(
        `[vue:perf] row ${rowIndex + 1}/${rows.length} ${row.id} ${rowErrors.length ? "failed" : "complete"}`,
      );
    }
    output.browser = {
      name: "chromium",
      revision: browserRevision,
      version: browser.version(),
    };
  } finally {
    try {
      await deadline("browser shutdown", () => browser.close());
    } catch (error) {
      output.errors.push(`browser: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return output;
}

export async function withVuePerformanceDeadline(
  label,
  operation,
  timeoutMs = VUE_PERFORMANCE_OPERATION_TIMEOUT_MS,
) {
  let timeout;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`Vue performance ${label} timed out after ${timeoutMs} ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

export function assertVuePerformanceBrowserResult(result, expectedRows) {
  if (!result || !Array.isArray(result.rows) || !Array.isArray(result.errors)) {
    throw new Error("Vue browser result is incomplete");
  }
  if (result.errors.length) throw new Error(`Vue browser run failed: ${result.errors.join("; ")}`);
  const expectedIds = expectedRows.map(({ id }) => id);
  const actualIds = result.rows.map(({ id }) => id);
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds))
    throw new Error("Vue browser rows differ from the frozen plan");
  for (const row of result.rows) {
    if (row.errors.length || Object.values(row.lifecycle).some((value) => value !== true)) {
      throw new Error(`Vue browser lifecycle failed: ${row.id}`);
    }
  }
  return result;
}

export function collectVuePerformanceEnvironment({
  browser,
  execute = execFileSync,
  garbageCollectionAvailable,
  packageVersions,
}) {
  const requireFromRoot = createRequire(path.join(VUE_PERFORMANCE_REPO_ROOT, "package.json"));
  const requireFromVueDemo = createRequire(
    path.join(VUE_PERFORMANCE_REPO_ROOT, "apps/vue-demo/package.json"),
  );
  const packageJson = JSON.parse(
    readFileSync(path.join(VUE_PERFORMANCE_REPO_ROOT, "packages/vue/package.json"), "utf8"),
  );
  const vueVersion = JSON.parse(
    readFileSync(
      createRequire(path.join(VUE_PERFORMANCE_REPO_ROOT, "packages/vue/package.json")).resolve(
        "vue/package.json",
      ),
      "utf8",
    ),
  ).version;
  const toolchainVersions = {
    "@vitejs/plugin-vue": JSON.parse(
      readFileSync(requireFromVueDemo.resolve("@vitejs/plugin-vue/package.json"), "utf8"),
    ).version,
    playwright: JSON.parse(readFileSync(requireFromRoot.resolve("playwright/package.json"), "utf8"))
      .version,
    vite: JSON.parse(readFileSync(requireFromRoot.resolve("vite/package.json"), "utf8")).version,
  };
  return {
    architecture: process.arch,
    browserName: browser.name,
    browserRevision: String(browser.revision),
    browserVersion: browser.version,
    commit: execute("git", ["rev-parse", "HEAD"], {
      cwd: VUE_PERFORMANCE_REPO_ROOT,
      encoding: "utf8",
    }).trim(),
    framework: `Vue ${vueVersion}`,
    garbageCollectionAvailable,
    nodeVersion: process.versions.node,
    packageVersions: {
      "@starwind-ui/runtime": JSON.parse(
        readFileSync(path.join(VUE_PERFORMANCE_REPO_ROOT, "packages/runtime/package.json"), "utf8"),
      ).version,
      "@starwind-ui/vue": packageJson.version,
      ...packageVersions,
      ...toolchainVersions,
      vue: vueVersion,
    },
    platform: process.platform,
    viewport: VUE_PERFORMANCE_VIEWPORT,
  };
}

function assertBuiltVuePerformancePackages() {
  for (const file of ["packages/runtime/dist/dialog.js", "packages/vue/dist/dialog/index.js"]) {
    try {
      readFileSync(path.join(VUE_PERFORMANCE_REPO_ROOT, file));
    } catch {
      throw new Error(`Build Vue performance packages before running: ${file}`);
    }
  }
}

function serializeViteConfig(config, rows) {
  const aliases = config.resolve.alias
    .map(
      ({ find, replacement }) =>
        `{ find: ${find.toString()}, replacement: ${JSON.stringify(replacement)} }`,
    )
    .join(",\n");
  const inputs = rows
    .map(
      (row) =>
        `${JSON.stringify(safeRowId(row.id))}: new URL(${JSON.stringify(`./${safeRowId(row.id)}/index.html`)}, import.meta.url).pathname`,
    )
    .join(",\n");
  return `{ resolve: { alias: [${aliases}], dedupe: ${JSON.stringify(config.resolve.dedupe)} }, build: { rollupOptions: { input: {${inputs}} } } }`;
}

function safeRowId(id) {
  return id.replaceAll(/[^a-z0-9-]+/gi, "-");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function quoteWindowsCommandArgument(value) {
  if (/^[A-Za-z0-9._:/=@+-]+$/.test(value)) return value;
  if (/["&<>|^%!\r\n]/.test(value)) {
    throw new Error(`Cannot safely pass argument to pnpm: ${value}`);
  }
  return `"${value}"`;
}

function isMainModule() {
  return process.argv[1] != null && path.resolve(process.argv[1]) === SCRIPT_PATH;
}
