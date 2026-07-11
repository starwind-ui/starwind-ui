import { execFileSync } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const MEASUREMENT_TMP_ROOT = process.env.STARWIND_MEASUREMENT_TMP_ROOT ?? os.tmpdir();
const SHARED_SIZE_TMP_ROOT = path.join(MEASUREMENT_TMP_ROOT, "starwind-package-size-comparison");
const PERF_TMP_ROOT = path.join(MEASUREMENT_TMP_ROOT, "starwind-runtime-performance-comparison");
const REPORT_PATH = path.join(REPO_ROOT, "docs/portable-runtime/runtime-performance-comparison.md");
const FOCUSED_REPORT_DIR = path.join(
  REPO_ROOT,
  ".scratch/runtime-performance-candidate-benchmarks/perf-runs",
);
const REACT_DEMO_PACKAGE = path.join(REPO_ROOT, "apps/react-demo/package.json");

const externalPackages = [
  "@zag-js/accordion",
  "@zag-js/combobox",
  "@base-ui/react",
  "@zag-js/dialog",
  "@zag-js/hover-card",
  "@zag-js/menu",
  "@zag-js/navigation-menu",
  "@zag-js/popover",
  "@zag-js/radio-group",
  "@zag-js/react",
  "@zag-js/select",
  "@zag-js/tabs",
  "@zag-js/tooltip",
  "react",
  "react-dom",
];

const scenarioRows = [
  {
    key: "dialog-open",
    category: "baseline-open",
    label: "Dialog open",
    cpuThrottle: 20,
    sampleCount: 5,
    type: "open",
    details: "10k outside nodes, Enter-to-visible",
  },
  {
    key: "select-open",
    category: "baseline-open",
    label: "Select open",
    cpuThrottle: 6,
    sampleCount: 5,
    type: "open",
    details: "1000 items, Enter-to-visible",
  },
  {
    key: "select-item-highlight",
    category: "baseline-hover",
    label: "Select item highlight",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "hover",
    details: "Open select, scripted pointermove sweep across 1000 items",
  },
  {
    key: "menu-open",
    category: "baseline-open",
    label: "Menu open",
    cpuThrottle: 6,
    sampleCount: 5,
    type: "open",
    details: "1000 items, Enter-to-visible",
  },
  {
    key: "tooltip-trigger-mount",
    category: "baseline-mount",
    label: "Tooltip trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 tooltip triggers, render + layout",
  },
  {
    key: "dialog-trigger-mount",
    category: "closed-overlay-candidate",
    label: "Dialog trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 closed dialog triggers with content, render + layout",
  },
  {
    key: "popover-trigger-mount",
    category: "closed-overlay-candidate",
    label: "Popover trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 closed popover triggers with content, render + layout",
  },
  {
    key: "preview-card-trigger-mount",
    category: "closed-overlay-candidate",
    label: "Preview card trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 closed preview card triggers with content, render + layout",
  },
  {
    key: "select-trigger-mount",
    category: "baseline-mount",
    label: "Select trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 select triggers, 10 items each, render + layout",
  },
  {
    key: "menu-item-highlight",
    category: "baseline-hover",
    label: "Menu item highlight",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "hover",
    details: "Open menu, scripted pointermove sweep across 1000 items",
  },
  {
    key: "combobox-open",
    category: "combobox-candidate",
    label: "Combobox open",
    cpuThrottle: 6,
    sampleCount: 5,
    type: "open",
    openTarget: "[data-benchmark-input]",
    openKey: "ArrowDown",
    details: "1000 items, ArrowDown-to-visible",
  },
  {
    key: "combobox-trigger-mount",
    category: "combobox-candidate",
    label: "Combobox trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 combobox triggers, 10 items each, render + layout",
  },
  {
    key: "combobox-item-highlight",
    category: "combobox-candidate",
    label: "Combobox item highlight",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "hover",
    details: "Open combobox, scripted pointermove sweep across 1000 items",
  },
  {
    key: "combobox-filter-input",
    category: "combobox-candidate",
    label: "Combobox filter input",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "filter",
    details: "Open combobox, type filter query, input-to-layout",
  },
  {
    key: "menu-submenu-open",
    category: "nested-menu-candidate",
    label: "Menu submenu open",
    cpuThrottle: 6,
    sampleCount: 5,
    type: "submenu-open",
    details: "Parent menu plus 1000-item submenu, activation-to-visible",
  },
  {
    key: "menu-submenu-item-highlight",
    category: "nested-menu-candidate",
    label: "Menu submenu item highlight",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "submenu-hover",
    details: "Open submenu, scripted pointermove sweep across 1000 submenu items",
  },
  {
    key: "navigation-menu-content-switch",
    category: "navigation-menu-candidate",
    label: "Navigation menu content switch",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "navigation-switch",
    details: "Large navigation content switch, click-to-visible",
  },
  {
    key: "tabs-high-count-mount",
    category: "non-floating-collection-candidate",
    label: "Tabs high-count mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 tabs and 1000 keep-mounted panels, render + layout",
  },
  {
    key: "tabs-activation-click",
    category: "non-floating-collection-candidate",
    label: "Tabs activation click",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "tabs-activation",
    details: "1000 tabs and panels, last tab click-to-panel",
  },
  {
    key: "accordion-high-count-mount",
    category: "non-floating-collection-candidate",
    label: "Accordion high-count mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 closed accordion items with mounted panels, render + layout",
  },
  {
    key: "accordion-toggle-click",
    category: "non-floating-collection-candidate",
    label: "Accordion toggle click",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "accordion-toggle",
    details: "1000 closed accordion items, last trigger click-to-panel",
  },
  {
    key: "radio-group-high-count-mount",
    category: "non-floating-collection-candidate",
    label: "Radio Group high-count mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 radio items in one group, render + layout",
  },
  {
    key: "radio-group-change-sweep",
    category: "non-floating-collection-candidate",
    label: "Radio Group change sweep",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "radio-sweep",
    details: "Scripted click sweep across 1000 radio items",
  },
];

const libraryRows = [
  { key: "starwind", label: "Starwind" },
  { key: "base-ui", label: "Base UI" },
  { key: "zag", label: "Zag React" },
];

if (isMainModule()) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function main(argv = []) {
  const runConfig = buildRuntimePerformanceRunConfig(argv);

  if (runConfig.mode === "list") {
    console.log(formatRuntimePerformanceList());
    return;
  }

  assertStarwindDist();

  const dependencyRoot = prepareDependencyRoot();
  const appDir = path.join(dependencyRoot, "runtime-performance-app");
  const distDir = path.join(PERF_TMP_ROOT, "dist");

  writeFixtureApp({ appDir });
  await buildFixtureApp({ appDir, dependencyRoot, distDir });

  const server = await startStaticServer(distDir);
  const runStartedAt = new Date();

  try {
    const results = await runBrowserMeasurements({
      baseUrl: server.url,
      libraries: runConfig.libraries,
      scenarios: runConfig.scenarios,
    });
    writeReport({
      dependencyRoot,
      filters: runConfig.filters,
      focusedRun: runConfig.focusedRun,
      generatedAt: runStartedAt,
      libraries: runConfig.libraries,
      reportPath: runConfig.reportPath,
      results,
      scenarios: runConfig.scenarios,
    });
    console.log(`Wrote ${runConfig.reportPath}`);
  } finally {
    await server.close();
  }
}

function isMainModule() {
  const entryPath = process.argv[1];

  return entryPath != null && path.resolve(entryPath) === fileURLToPath(import.meta.url);
}

function buildRuntimePerformanceRunConfig(argv = [], { generatedAt = new Date() } = {}) {
  const parsedArgs = parseRuntimePerformanceArgs(argv);

  if (parsedArgs.list) {
    return {
      mode: "list",
    };
  }

  const scenarios = selectScenarioRows({
    categories: parsedArgs.categories,
    scenarios: parsedArgs.scenarios,
  });
  const libraries = selectLibraryRows(parsedArgs.libraries);
  const focusedRun =
    parsedArgs.categories.length > 0 ||
    parsedArgs.libraries.length > 0 ||
    parsedArgs.scenarios.length > 0;

  return {
    mode: "run",
    filters: {
      categories: parsedArgs.categories,
      libraries: parsedArgs.libraries,
      scenarios: parsedArgs.scenarios,
    },
    focusedRun,
    libraries,
    reportPath: focusedRun ? buildFocusedReportPath(generatedAt) : REPORT_PATH,
    scenarios,
  };
}

function parseRuntimePerformanceArgs(argv = []) {
  const parsedArgs = {
    categories: [],
    libraries: [],
    list: false,
    scenarios: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") continue;
    if (arg === "--list") {
      parsedArgs.list = true;
      continue;
    }

    const [flag, inlineValue] = arg.includes("=") ? arg.split("=", 2) : [arg, null];

    if (flag === "--scenario" || flag === "--category" || flag === "--library") {
      const value = inlineValue ?? argv[index + 1];

      if (!value || value.startsWith("--")) {
        throw new Error(`${flag} requires a value.`);
      }

      if (inlineValue == null) {
        index += 1;
      }

      if (flag === "--scenario") parsedArgs.scenarios.push(value);
      if (flag === "--category") parsedArgs.categories.push(value);
      if (flag === "--library") parsedArgs.libraries.push(value);
      continue;
    }

    throw new Error(`Unknown runtime performance option: ${arg}`);
  }

  return {
    categories: uniqueValues(parsedArgs.categories),
    libraries: uniqueValues(parsedArgs.libraries),
    list: parsedArgs.list,
    scenarios: uniqueValues(parsedArgs.scenarios),
  };
}

function selectScenarioRows({ categories = [], scenarios = [] } = {}) {
  assertValidKeys({
    kind: "scenario",
    requestedKeys: scenarios,
    validKeys: scenarioRows.map((row) => row.key),
  });
  assertValidKeys({
    kind: "category",
    requestedKeys: categories,
    validKeys: getCategoryKeys(),
  });

  const scenarioSet = new Set(scenarios);
  const categorySet = new Set(categories);
  const selectedRows = scenarioRows.filter((scenario) => {
    const matchesScenario = scenarioSet.size === 0 || scenarioSet.has(scenario.key);
    const matchesCategory = categorySet.size === 0 || categorySet.has(scenario.category);

    return matchesScenario && matchesCategory;
  });

  if (selectedRows.length === 0) {
    throw new Error(
      [
        "No runtime performance scenarios matched the supplied filters.",
        `Scenario filters: ${formatFilterValues(scenarios)}`,
        `Category filters: ${formatFilterValues(categories)}`,
      ].join("\n"),
    );
  }

  return selectedRows;
}

function selectLibraryRows(libraries = []) {
  assertValidKeys({
    kind: "library",
    requestedKeys: libraries,
    validKeys: libraryRows.map((row) => row.key),
  });

  if (libraries.length === 0) return libraryRows;

  const librarySet = new Set(libraries);
  return libraryRows.filter((library) => librarySet.has(library.key));
}

function formatRuntimePerformanceList() {
  return [
    "Runtime performance filter keys",
    "",
    "Scenarios:",
    ...scenarioRows.map(
      (scenario) =>
        `- ${scenario.key} (${scenario.category ?? "uncategorized"}) - ${scenario.label}`,
    ),
    "",
    "Categories:",
    ...getCategoryKeys().map((category) => `- ${category}`),
    "",
    "Libraries:",
    ...libraryRows.map((library) => `- ${library.key} - ${library.label}`),
  ].join("\n");
}

function formatRuntimePerformanceCommand({ filters, focusedRun }) {
  if (!focusedRun) return "pnpm runtime:perf";

  const args = [
    ...filters.scenarios.flatMap((scenario) => ["--scenario", scenario]),
    ...filters.categories.flatMap((category) => ["--category", category]),
    ...filters.libraries.flatMap((library) => ["--library", library]),
  ];

  return `pnpm runtime:perf -- ${args.map(quotePowerShellArgument).join(" ")}`;
}

function quotePowerShellArgument(value) {
  if (/^[a-z0-9-]+$/i.test(value)) return value;

  return `'${value.replaceAll("'", "''")}'`;
}

function buildFocusedReportPath(generatedAt) {
  const timestamp = generatedAt.toISOString().replaceAll(":", "-").replaceAll(".", "-");

  return path.join(FOCUSED_REPORT_DIR, `${timestamp}-focused-runtime-performance-comparison.md`);
}

function assertValidKeys({ kind, requestedKeys, validKeys }) {
  const validKeySet = new Set(validKeys);
  const unknownKeys = requestedKeys.filter((key) => !validKeySet.has(key));

  if (unknownKeys.length === 0) return;

  throw new Error(
    [
      `Unknown runtime performance ${kind} filter: ${unknownKeys.join(", ")}`,
      `Valid ${kind} keys: ${validKeys.join(", ")}`,
    ].join("\n"),
  );
}

function getCategoryKeys() {
  return uniqueValues(scenarioRows.map((row) => row.category ?? "uncategorized")).sort();
}

function uniqueValues(values) {
  return [...new Set(values)];
}

function formatFilterValues(values) {
  return values.length === 0 ? "none" : values.join(", ");
}

function assertStarwindDist() {
  const requiredFiles = [
    path.join(REPO_ROOT, "packages/runtime/dist/accordion.js"),
    path.join(REPO_ROOT, "packages/runtime/dist/dialog.js"),
    path.join(REPO_ROOT, "packages/runtime/dist/combobox.js"),
    path.join(REPO_ROOT, "packages/runtime/dist/select.js"),
    path.join(REPO_ROOT, "packages/runtime/dist/menu.js"),
    path.join(REPO_ROOT, "packages/runtime/dist/navigation-menu.js"),
    path.join(REPO_ROOT, "packages/runtime/dist/popover.js"),
    path.join(REPO_ROOT, "packages/runtime/dist/preview-card.js"),
    path.join(REPO_ROOT, "packages/runtime/dist/radio.js"),
    path.join(REPO_ROOT, "packages/runtime/dist/radio-group.js"),
    path.join(REPO_ROOT, "packages/runtime/dist/tabs.js"),
    path.join(REPO_ROOT, "packages/runtime/dist/tooltip.js"),
    path.join(REPO_ROOT, "packages/react/dist/accordion/index.js"),
    path.join(REPO_ROOT, "packages/react/dist/dialog/index.js"),
    path.join(REPO_ROOT, "packages/react/dist/combobox/index.js"),
    path.join(REPO_ROOT, "packages/react/dist/select/index.js"),
    path.join(REPO_ROOT, "packages/react/dist/menu/index.js"),
    path.join(REPO_ROOT, "packages/react/dist/navigation-menu/index.js"),
    path.join(REPO_ROOT, "packages/react/dist/popover/index.js"),
    path.join(REPO_ROOT, "packages/react/dist/preview-card/index.js"),
    path.join(REPO_ROOT, "packages/react/dist/radio/index.js"),
    path.join(REPO_ROOT, "packages/react/dist/radio-group/index.js"),
    path.join(REPO_ROOT, "packages/react/dist/tabs/index.js"),
    path.join(REPO_ROOT, "packages/react/dist/tooltip/index.js"),
  ];
  const missingFiles = requiredFiles.filter((file) => !existsSync(file));

  if (missingFiles.length === 0) return;

  throw new Error(
    [
      "Starwind dist output is required before running runtime performance comparison.",
      "Run `pnpm runtime:build && pnpm react:build`, then rerun `pnpm runtime:perf`.",
      "",
      ...missingFiles.map((file) => `Missing: ${path.relative(REPO_ROOT, file)}`),
    ].join("\n"),
  );
}

function prepareDependencyRoot() {
  if (hasMeasurementDependencies(SHARED_SIZE_TMP_ROOT)) {
    return SHARED_SIZE_TMP_ROOT;
  }

  if (hasMeasurementDependencies(PERF_TMP_ROOT)) {
    return PERF_TMP_ROOT;
  }

  mkdirSync(PERF_TMP_ROOT, { recursive: true });
  writeFileSync(
    path.join(PERF_TMP_ROOT, "package.json"),
    JSON.stringify({ private: true }, null, 2),
  );
  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", ...externalPackages], {
    cwd: PERF_TMP_ROOT,
    stdio: "inherit",
  });

  return PERF_TMP_ROOT;
}

function hasMeasurementDependencies(root) {
  return externalPackages.every((pkg) => existsSync(path.join(root, "node_modules", pkg)));
}

function runNpm(args, options) {
  if (process.platform === "win32") {
    return execFileSync(
      process.env.ComSpec ?? "cmd.exe",
      ["/d", "/s", "/c", ["npm", ...args].map(quoteWindowsCommandArgument).join(" ")],
      options,
    );
  }

  return execFileSync("npm", args, options);
}

function quoteWindowsCommandArgument(value) {
  if (/^[A-Za-z0-9._:/=@+-]+$/.test(value)) return value;
  if (/["&<>|^%!\r\n]/.test(value)) {
    throw new Error(`Cannot safely pass argument to npm: ${value}`);
  }
  return `"${value}"`;
}

async function buildFixtureApp({ appDir, dependencyRoot, distDir }) {
  rmSync(distDir, { recursive: true, force: true });

  const reactDemoRequire = createRequire(REACT_DEMO_PACKAGE);
  const vitePath = reactDemoRequire.resolve("vite");
  const { build } = await import(pathToFileURL(vitePath).href);

  await build({
    root: appDir,
    configFile: false,
    logLevel: "error",
    resolve: {
      alias: [
        {
          find: /^@starwind-ui\/react\/(.+)$/,
          replacement: slash(path.join(REPO_ROOT, "packages/react/dist/$1/index.js")),
        },
        {
          find: /^@starwind-ui\/runtime\/(.+)$/,
          replacement: slash(path.join(REPO_ROOT, "packages/runtime/dist/$1.js")),
        },
        {
          find: "react-dom/client",
          replacement: slash(path.join(dependencyRoot, "node_modules/react-dom/client.js")),
        },
        {
          find: "react-dom",
          replacement: slash(path.join(dependencyRoot, "node_modules/react-dom/index.js")),
        },
        {
          find: "react/jsx-runtime",
          replacement: slash(path.join(dependencyRoot, "node_modules/react/jsx-runtime.js")),
        },
        {
          find: "react",
          replacement: slash(path.join(dependencyRoot, "node_modules/react/index.js")),
        },
        {
          find: "@starwind-ui/react",
          replacement: slash(path.join(REPO_ROOT, "packages/react/dist/index.js")),
        },
        {
          find: "@starwind-ui/runtime",
          replacement: slash(path.join(REPO_ROOT, "packages/runtime/dist/index.js")),
        },
      ],
    },
    build: {
      emptyOutDir: true,
      minify: "esbuild",
      outDir: distDir,
      sourcemap: false,
      target: "es2020",
    },
  });
}

async function runBrowserMeasurements({
  baseUrl,
  libraries = libraryRows,
  scenarios = scenarioRows,
}) {
  const reactDemoRequire = createRequire(REACT_DEMO_PACKAGE);
  const { chromium } = reactDemoRequire("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      console.error(`[browser console] ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    console.error(`[browser pageerror] ${error.stack ?? error.message}`);
  });
  const cdp = await page.context().newCDPSession(page);

  try {
    await cdp.send("Performance.enable");

    const results = [];

    for (const scenario of scenarios) {
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: scenario.cpuThrottle });

      for (const library of libraries) {
        console.log(`Measuring ${library.label} - ${scenario.label}`);
        const url = `${baseUrl}/?scenario=${scenario.key}&library=${library.key}`;
        const result =
          scenario.type === "mount"
            ? await measureMountRow({ page, scenario, url })
            : scenario.type === "hover"
              ? await measureHoverRow({ page, scenario, url })
              : scenario.type === "filter"
                ? await measureFilterRow({ page, scenario, url })
                : scenario.type === "submenu-open"
                  ? await measureSubmenuOpenRow({ page, scenario, url })
                  : scenario.type === "submenu-hover"
                    ? await measureSubmenuHoverRow({ page, scenario, url })
                    : scenario.type === "navigation-switch"
                      ? await measureNavigationSwitchRow({ page, scenario, url })
                      : scenario.type === "tabs-activation"
                        ? await measureTabsActivationRow({ page, scenario, url })
                        : scenario.type === "accordion-toggle"
                          ? await measureAccordionToggleRow({ page, scenario, url })
                          : scenario.type === "radio-sweep"
                            ? await measureRadioSweepRow({ page, scenario, url })
                            : await measureOpenRow({ page, scenario, url });

        results.push({
          ...result,
          cpuThrottle: scenario.cpuThrottle,
          details: scenario.details,
          library: library.key,
          libraryLabel: library.label,
          scenario: scenario.key,
          scenarioCategory: scenario.category ?? "uncategorized",
          scenarioLabel: scenario.label,
          type: scenario.type,
        });
      }
    }

    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    return results;
  } finally {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 }).catch(() => {});
    await browser.close();
  }
}

async function measureOpenRow({ page, scenario, url }) {
  const samples = [];
  const eventDurations = [];

  for (let index = 0; index < scenario.sampleCount; index += 1) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__runtimePerf?.ready === true);
    await page.evaluate(({ target }) => window.__runtimePerf.prepareOpenSample({ target }), {
      target: scenario.openTarget,
    });
    await page.keyboard.press(scenario.openKey ?? "Enter");
    const sample = await page.evaluate(() => window.__runtimePerf.finishOpenSample());
    samples.push(sample.visibleMs);
    if (sample.eventDurationMs != null) {
      eventDurations.push(sample.eventDurationMs);
    }
  }

  return {
    samples,
    metric: "event-to-visible",
    eventDurationSamples: eventDurations,
    averageMs: average(samples),
  };
}

async function measureFilterRow({ page, scenario, url }) {
  const samples = [];

  for (let index = 0; index < scenario.sampleCount; index += 1) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__runtimePerf?.ready === true);
    await page.evaluate(() =>
      window.__runtimePerf.prepareOpenSample({ target: "[data-benchmark-input]" }),
    );
    await page.keyboard.press("ArrowDown");
    await page.evaluate(() => window.__runtimePerf.finishOpenSample());
    const sample = await page.evaluate(() => window.__runtimePerf.runFilterSample());
    samples.push(sample.durationMs);
  }

  return {
    samples,
    averageMs: average(samples),
    metric: "input-to-layout",
  };
}

async function measureMountRow({ page, scenario, url }) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__runtimePerf?.ready === true);
  const result = await page.evaluate(
    ({ groupCount, iterationsPerGroup }) =>
      window.__runtimePerf.runMountSamples({ groupCount, iterationsPerGroup }),
    { groupCount: scenario.groupCount, iterationsPerGroup: scenario.iterationsPerGroup },
  );

  return {
    ...result,
    averageMs: average(result.groupAverages),
    metric: "render-layout",
  };
}

async function measureHoverRow({ page, scenario, url }) {
  const samples = [];
  const dispatchDurationSamples = [];
  const forcedLayoutDurationSamples = [];

  for (let index = 0; index < scenario.sampleCount; index += 1) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__runtimePerf?.ready === true);
    const sample = await page.evaluate(() => window.__runtimePerf.runHoverSample());
    samples.push(sample.durationMs);
    dispatchDurationSamples.push(sample.dispatchDurationMs);
    forcedLayoutDurationSamples.push(sample.forcedLayoutDurationMs);
  }

  return {
    samples,
    dispatchDurationSamples,
    forcedLayoutDurationSamples,
    averageMs: average(samples),
    metric: "pointermove-sweep",
  };
}

async function measureSubmenuOpenRow({ page, scenario, url }) {
  const samples = [];
  const eventDurations = [];

  for (let index = 0; index < scenario.sampleCount; index += 1) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__runtimePerf?.ready === true);
    const sample = await page.evaluate(() => window.__runtimePerf.runSubmenuOpenSample());
    samples.push(sample.visibleMs);
    if (sample.eventDurationMs != null) {
      eventDurations.push(sample.eventDurationMs);
    }
  }

  return {
    samples,
    metric: "activation-to-visible",
    eventDurationSamples: eventDurations,
    averageMs: average(samples),
  };
}

async function measureSubmenuHoverRow({ page, scenario, url }) {
  const samples = [];
  const dispatchDurationSamples = [];
  const forcedLayoutDurationSamples = [];

  for (let index = 0; index < scenario.sampleCount; index += 1) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__runtimePerf?.ready === true);
    const sample = await page.evaluate(() => window.__runtimePerf.runSubmenuHoverSample());
    samples.push(sample.durationMs);
    dispatchDurationSamples.push(sample.dispatchDurationMs);
    forcedLayoutDurationSamples.push(sample.forcedLayoutDurationMs);
  }

  return {
    samples,
    dispatchDurationSamples,
    forcedLayoutDurationSamples,
    averageMs: average(samples),
    metric: "pointermove-sweep",
  };
}

async function measureNavigationSwitchRow({ page, scenario, url }) {
  const samples = [];

  for (let index = 0; index < scenario.sampleCount; index += 1) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__runtimePerf?.ready === true);
    const sample = await page.evaluate(() => window.__runtimePerf.runNavigationSwitchSample());
    samples.push(sample.durationMs);
  }

  return {
    samples,
    averageMs: average(samples),
    metric: "content-switch-visible",
  };
}

async function measureTabsActivationRow({ page, scenario, url }) {
  const samples = [];

  for (let index = 0; index < scenario.sampleCount; index += 1) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__runtimePerf?.ready === true);
    const sample = await page.evaluate(() => window.__runtimePerf.runTabsActivationSample());
    samples.push(sample.durationMs);
  }

  return {
    samples,
    averageMs: average(samples),
    metric: "tab-click-to-panel",
  };
}

async function measureAccordionToggleRow({ page, scenario, url }) {
  const samples = [];

  for (let index = 0; index < scenario.sampleCount; index += 1) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__runtimePerf?.ready === true);
    const sample = await page.evaluate(() => window.__runtimePerf.runAccordionToggleSample());
    samples.push(sample.durationMs);
  }

  return {
    samples,
    averageMs: average(samples),
    metric: "toggle-click-to-panel",
  };
}

async function measureRadioSweepRow({ page, scenario, url }) {
  const samples = [];

  for (let index = 0; index < scenario.sampleCount; index += 1) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__runtimePerf?.ready === true);
    const sample = await page.evaluate(() => window.__runtimePerf.runRadioSweepSample());
    samples.push(sample.durationMs);
  }

  return {
    samples,
    averageMs: average(samples),
    metric: "radio-click-sweep",
  };
}

function writeReport({
  dependencyRoot,
  filters = { categories: [], libraries: [], scenarios: [] },
  focusedRun = false,
  generatedAt,
  libraries = libraryRows,
  reportPath = REPORT_PATH,
  results,
  scenarios = scenarioRows,
}) {
  const lines = formatRuntimePerformanceReport({
    dependencyRoot,
    filters,
    focusedRun,
    generatedAt,
    libraries,
    results,
    scenarios,
  });

  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${lines.join("\n")}\n`);
}

function formatRuntimePerformanceReport({
  dependencyRoot,
  filters = { categories: [], libraries: [], scenarios: [] },
  focusedRun = false,
  generatedAt,
  libraries = libraryRows,
  results,
  scenarios = scenarioRows,
  versions = getVersions(dependencyRoot),
}) {
  return [
    focusedRun ? "# Focused Runtime Performance Comparison" : "# Runtime Performance Comparison",
    "",
    `Generated: ${generatedAt.toISOString().slice(0, 10)}`,
    "",
    ...(focusedRun
      ? [
          "## Focused Run",
          "",
          "- This is a focused/local report for development validation only. It is not a full public-claim-quality comparison.",
          `- Scenario filters: ${formatFilterValues(filters.scenarios)}`,
          `- Category filters: ${formatFilterValues(filters.categories)}`,
          `- Library filters: ${formatFilterValues(filters.libraries)}`,
          "",
        ]
      : []),
    "## Method",
    "",
    "- A temporary React/Vite app is generated, built in production mode, served as static files, and driven with Playwright Chromium.",
    "- Starwind rows use local `packages/runtime/dist` and `packages/react/dist`, matching the package-size comparison's local-dist approach.",
    "- Base UI and Zag rows use npm packages from a temporary measurement project under the operating system's temporary directory.",
    "- CPU throttling is applied with Chrome DevTools Protocol `Emulation.setCPUThrottlingRate`.",
    "- Open rows collect 5 samples. The browser focuses the configured trigger, marks the start immediately before pressing the configured key, waits for benchmark content to become visible, advances animation frames, forces layout, and reports event-to-visible duration. Most rows use Enter; Combobox uses ArrowDown from the input.",
    "- Mount rows run 5 groups of 20 scripted React renders. Each iteration unmounts, `flushSync` renders the fixture, and forces layout by reading geometry.",
    "- Highlight rows open the popup first, then measure a scripted pointermove sweep across 1000 mounted items. Raw samples separate pointer-event dispatch from the forced-layout read while preserving the existing total sweep metric. This is an interaction-handler comparison, not a literal hand-moved cursor trace.",
    "- Filter rows open the combobox first, then measure a scripted input value change plus layout.",
    "- Submenu open rows open the parent menu as setup, then measure submenu trigger activation-to-visible timing for a 1000-item submenu.",
    "- Navigation switch rows open the first content panel as setup, then measure the second trigger's click-to-visible timing for large content.",
    "- Collection click rows measure a scripted click activation/toggle plus visible panel layout for high-count non-floating controls.",
    "- Radio sweep rows measure a scripted click sweep across 1000 radio items, forcing layout after each change.",
    "- All fixtures use primitive APIs, minimal CSS, no React StrictMode, and no styled Starwind wrapper code.",
    "- Starwind's `Portal` parts are runtime-owned DOM markers; Base UI and Zag use React portals. That difference is part of the implementation being measured.",
    "",
    "## Candidate Evaluation Thresholds",
    "",
    "- For 1x CPU mount and hover rows, Starwind is a confirmed candidate when it is at least 2x slower than the best available comparator and at least 50 ms slower in the same run.",
    "- For throttled open rows, Starwind is a confirmed candidate when it is at least 1.75x slower than the best available comparator and at least 100 ms slower in the same run.",
    "- Rows with failed comparators, visibly different fixture semantics, or unstable samples should be treated as inconclusive rather than confirmed.",
    "",
    "Regenerate with:",
    "",
    "```bash",
    formatRuntimePerformanceCommand({ filters, focusedRun }),
    "```",
    ...(focusedRun
      ? ["", "Run the full official report with:", "", "```bash", "pnpm runtime:perf", "```"]
      : []),
    "",
    "## Package Versions",
    "",
    "| Library | Version | Source |",
    "| --- | ---: | --- |",
    `| Starwind | local | \`packages/*/dist\` |`,
    `| Base UI | ${versions.baseUi} | \`@base-ui/react\` |`,
    `| Zag React | ${versions.zagReact} | \`@zag-js/react\` and component packages |`,
    `| React | ${versions.react} | \`react\` |`,
    "",
    "## Results",
    "",
    `| Category | Scenario | Details | CPU | Metric | ${libraries.map((library) => library.label).join(" | ")} |`,
    `| --- | --- | --- | ---: | --- | ${libraries.map(() => "---:").join(" | ")} |`,
    ...scenarios.map((scenario) => {
      const rows = libraries.map((library) =>
        results.find(
          (result) => result.scenario === scenario.key && result.library === library.key,
        ),
      );
      const metric = rows.find(Boolean)?.metric ?? "";
      return [
        scenario.category ?? "uncategorized",
        scenario.label,
        scenario.details,
        `${scenario.cpuThrottle}x`,
        metric,
        ...rows.map((row) => formatMs(row?.averageMs)),
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |");
    }),
    "",
    "## Raw Samples",
    "",
    "<!-- prettier-ignore-start -->",
    "",
    "| Category | Scenario | Library | Samples | Group averages | Event duration samples | Dispatch samples | Forced-layout samples |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ...results.map((row) =>
      [
        row.scenarioCategory,
        row.scenarioLabel,
        row.libraryLabel,
        formatSampleList(row.samples),
        formatSampleList(row.groupAverages),
        formatSampleList(row.eventDurationSamples),
        formatSampleList(row.dispatchDurationSamples),
        formatSampleList(row.forcedLayoutDurationSamples),
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    "<!-- prettier-ignore-end -->",
    "",
    "## Reading The Numbers",
    "",
    "- Treat this as a local comparator and regression tracker, not a universal benchmark claim.",
    "- Prefer relative comparisons within the same run; CPU, browser, power mode, and background work can move absolute timings.",
    "- The open-row metric is an automated event-to-visible marker measurement. For a stricter public benchmark, the next iteration should parse DevTools trace events and identify the exact visible paint after the input event.",
    "- The mount rows intentionally include render and forced layout, but not network or initial bundle parse.",
    "- The highlight row intentionally dispatches pointer events over mounted items. A separate manual UX trace could measure real cursor movement and scroll behavior.",
  ];
}

function getVersions(dependencyRoot) {
  return {
    baseUi: readPackageVersion(
      path.join(dependencyRoot, "node_modules/@base-ui/react/package.json"),
    ),
    react: readPackageVersion(path.join(dependencyRoot, "node_modules/react/package.json")),
    zagReact: readPackageVersion(
      path.join(dependencyRoot, "node_modules/@zag-js/react/package.json"),
    ),
  };
}

function readPackageVersion(packageJsonPath) {
  if (!existsSync(packageJsonPath)) return "";
  return JSON.parse(readFileSync(packageJsonPath, "utf8")).version;
}

function writeFixtureApp({ appDir }) {
  rmSync(appDir, { recursive: true, force: true });
  mkdirSync(path.join(appDir, "src"), { recursive: true });
  writeFileSync(path.join(appDir, "index.html"), fixtureHtml());
  writeFileSync(path.join(appDir, "src/main.jsx"), fixtureSource());
  writeFileSync(path.join(appDir, "src/styles.css"), fixtureStyles());
}

function fixtureHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Runtime performance comparison</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
}

function fixtureSource() {
  return String.raw`import * as React from "react";
import { useId, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";

import StarwindAccordion from "@starwind-ui/react/accordion";
import StarwindCombobox from "@starwind-ui/react/combobox";
import StarwindDialog from "@starwind-ui/react/dialog";
import StarwindMenu from "@starwind-ui/react/menu";
import StarwindNavigationMenu from "@starwind-ui/react/navigation-menu";
import StarwindPopover from "@starwind-ui/react/popover";
import StarwindPreviewCard from "@starwind-ui/react/preview-card";
import StarwindRadio from "@starwind-ui/react/radio";
import StarwindRadioGroup from "@starwind-ui/react/radio-group";
import StarwindSelect from "@starwind-ui/react/select";
import StarwindTabs from "@starwind-ui/react/tabs";
import StarwindTooltip from "@starwind-ui/react/tooltip";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { NavigationMenu as BaseNavigationMenu } from "@base-ui/react/navigation-menu";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";

import * as zagAccordion from "@zag-js/accordion";
import * as zagCombobox from "@zag-js/combobox";
import * as zagDialog from "@zag-js/dialog";
import * as zagHoverCard from "@zag-js/hover-card";
import * as zagMenu from "@zag-js/menu";
import * as zagNavigationMenu from "@zag-js/navigation-menu";
import * as zagPopover from "@zag-js/popover";
import * as zagRadioGroup from "@zag-js/radio-group";
import { normalizeProps, Portal as ZagPortal, useMachine } from "@zag-js/react";
import * as zagSelect from "@zag-js/select";
import * as zagTabs from "@zag-js/tabs";
import * as zagTooltip from "@zag-js/tooltip";

import "./styles.css";

const OPEN_ITEM_COUNT = 1000;
const OUTSIDE_NODE_COUNT = 10000;
const MOUNT_INSTANCE_COUNT = 1000;
const MOUNT_COMBOBOX_ITEM_COUNT = 10;
const MOUNT_SELECT_ITEM_COUNT = 10;
const HOVER_ITEM_COUNT = 1000;
const COLLECTION_ITEM_COUNT = 1000;
const FILTER_QUERY = "999";

const largeItems = createRows(OPEN_ITEM_COUNT, "Item");
const hoverItems = createRows(HOVER_ITEM_COUNT, "Menu item");
const collectionItems = createRows(COLLECTION_ITEM_COUNT, "Collection item");
const mountRows = createRows(MOUNT_INSTANCE_COUNT, "Control");
const navigationPrimaryItems = createRows(500, "Product link");
const navigationSecondaryItems = createRows(500, "Resource link");
const smallComboboxItems = createRows(MOUNT_COMBOBOX_ITEM_COUNT, "Choice");
const smallSelectItems = createRows(MOUNT_SELECT_ITEM_COUNT, "Option");

const params = new URLSearchParams(window.location.search);
const scenario = params.get("scenario") ?? "dialog-open";
const library = params.get("library") ?? "starwind";
const appRoot = createRoot(document.querySelector("#app"));
const measureRoot = document.createElement("div");
measureRoot.id = "measure-root";
document.body.append(measureRoot);
const measureReactRoot = createRoot(measureRoot);

const eventTimingEntries = [];
let openStart = 0;

if (typeof PerformanceObserver !== "undefined") {
  try {
    const observer = new PerformanceObserver((list) => {
      eventTimingEntries.push(...list.getEntries());
    });
    observer.observe({ type: "event", durationThreshold: 0 });
  } catch {
    // Chromium-only API. The harness falls back to mark-to-visible timing.
  }
}

function App() {
  if (scenario === "dialog-open") {
    return <OpenFixture kind="dialog" library={library} />;
  }

  if (scenario === "select-open" || scenario === "select-item-highlight") {
    return <OpenFixture kind="select" library={library} />;
  }

  if (
    scenario === "combobox-open" ||
    scenario === "combobox-item-highlight" ||
    scenario === "combobox-filter-input"
  ) {
    return <OpenFixture kind="combobox" library={library} />;
  }

  if (scenario === "menu-open" || scenario === "menu-item-highlight") {
    return <OpenFixture kind="menu" library={library} />;
  }

  if (scenario === "menu-submenu-open" || scenario === "menu-submenu-item-highlight") {
    return <OpenFixture kind="menu-submenu" library={library} />;
  }

  if (scenario === "navigation-menu-content-switch") {
    return <OpenFixture kind="navigation-menu" library={library} />;
  }

  if (scenario === "tabs-activation-click") {
    return <OpenFixture kind="tabs" library={library} />;
  }

  if (scenario === "accordion-toggle-click") {
    return <OpenFixture kind="accordion" library={library} />;
  }

  if (scenario === "radio-group-change-sweep") {
    return <OpenFixture kind="radio-group" library={library} />;
  }

  return <div className="bench-shell">Mount scenario ready</div>;
}

flushSync(() => {
  appRoot.render(<App />);
});

window.__runtimePerf = {
  ready: true,
  prepareOpenSample,
  finishOpenSample,
  runFilterSample,
  runAccordionToggleSample,
  runHoverSample,
  runMountSamples,
  runNavigationSwitchSample,
  runRadioSweepSample,
  runSubmenuOpenSample,
  runSubmenuHoverSample,
  runTabsActivationSample,
};

function OpenFixture({ kind, library }) {
  if (kind === "dialog") {
    return (
      <BenchShell outsideNodes={OUTSIDE_NODE_COUNT}>
        {library === "starwind" && <StarwindDialogOpen />}
        {library === "base-ui" && <BaseDialogOpen />}
        {library === "zag" && <ZagDialogOpen />}
      </BenchShell>
    );
  }

  if (kind === "select") {
    return (
      <BenchShell>
        {library === "starwind" && <StarwindSelectOpen items={largeItems} />}
        {library === "base-ui" && <BaseSelectOpen items={largeItems} />}
        {library === "zag" && <ZagSelectOpen items={largeItems} />}
      </BenchShell>
    );
  }

  if (kind === "combobox") {
    return (
      <BenchShell>
        {library === "starwind" && <StarwindComboboxOpen items={largeItems} />}
        {library === "base-ui" && <BaseComboboxOpen items={largeItems} />}
        {library === "zag" && <ZagComboboxOpen items={largeItems} />}
      </BenchShell>
    );
  }

  if (kind === "menu-submenu") {
    return (
      <BenchShell>
        {library === "starwind" && <StarwindMenuSubmenu items={largeItems} />}
        {library === "base-ui" && <BaseMenuSubmenu items={largeItems} />}
        {library === "zag" && <ZagMenuSubmenu items={largeItems} />}
      </BenchShell>
    );
  }

  if (kind === "navigation-menu") {
    return (
      <BenchShell>
        {library === "starwind" && <StarwindNavigationMenuSwitch />}
        {library === "base-ui" && <BaseNavigationMenuSwitch />}
        {library === "zag" && <ZagNavigationMenuSwitch />}
      </BenchShell>
    );
  }

  if (kind === "tabs") {
    return (
      <BenchShell>
        {library === "starwind" && <StarwindTabsHighCount items={collectionItems} />}
        {library === "base-ui" && <BaseTabsHighCount items={collectionItems} />}
        {library === "zag" && <ZagTabsHighCount items={collectionItems} />}
      </BenchShell>
    );
  }

  if (kind === "accordion") {
    return (
      <BenchShell>
        {library === "starwind" && <StarwindAccordionHighCount items={collectionItems} />}
        {library === "base-ui" && <BaseAccordionHighCount items={collectionItems} />}
        {library === "zag" && <ZagAccordionHighCount items={collectionItems} />}
      </BenchShell>
    );
  }

  if (kind === "radio-group") {
    return (
      <BenchShell>
        {library === "starwind" && <StarwindRadioGroupHighCount items={collectionItems} />}
        {library === "base-ui" && <BaseRadioGroupHighCount items={collectionItems} />}
        {library === "zag" && <ZagRadioGroupHighCount items={collectionItems} />}
      </BenchShell>
    );
  }

  return (
    <BenchShell>
      {library === "starwind" && <StarwindMenuOpen items={largeItems} />}
      {library === "base-ui" && <BaseMenuOpen items={largeItems} />}
      {library === "zag" && <ZagMenuOpen items={largeItems} />}
    </BenchShell>
  );
}

function BenchShell({ children, outsideNodes = 0 }) {
  return (
    <main className="bench-shell">
      {outsideNodes > 0 && <OutsideNodes count={outsideNodes} />}
      {children}
    </main>
  );
}

function OutsideNodes({ count }) {
  return (
    <div aria-hidden="true" className="outside-grid">
      {Array.from({ length: count }, (_, index) => (
        <span className="outside-node" key={index} />
      ))}
    </div>
  );
}

function StarwindComboboxOpen({ items }) {
  return (
    <StarwindCombobox.Root filterMode="contains">
      <StarwindCombobox.InputGroup>
        <StarwindCombobox.Input className="bench-trigger" data-benchmark-input="true" />
        <StarwindCombobox.Trigger className="bench-trigger" data-benchmark-trigger="true">
          <StarwindCombobox.Icon>v</StarwindCombobox.Icon>
        </StarwindCombobox.Trigger>
      </StarwindCombobox.InputGroup>
      <StarwindCombobox.Portal>
        <StarwindCombobox.Positioner sideOffset={8}>
          <StarwindCombobox.Popup className="bench-popup bench-list-popup" data-benchmark-popup="true">
            <PaintMarker name="combobox-open" />
            <StarwindCombobox.List>
              {items.map((item) => (
                <StarwindCombobox.Item
                  className="bench-item"
                  data-benchmark-item="true"
                  key={item.id}
                  value={item.value}
                >
                  <StarwindCombobox.ItemText>{item.label}</StarwindCombobox.ItemText>
                </StarwindCombobox.Item>
              ))}
            </StarwindCombobox.List>
          </StarwindCombobox.Popup>
        </StarwindCombobox.Positioner>
      </StarwindCombobox.Portal>
    </StarwindCombobox.Root>
  );
}

function BaseComboboxOpen({ items }) {
  return (
    <BaseCombobox.Root
      items={items}
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => item.value}
    >
      <BaseCombobox.InputGroup>
        <BaseCombobox.Input className="bench-trigger" data-benchmark-input="true" />
        <BaseCombobox.Trigger className="bench-trigger" data-benchmark-trigger="true">
          v
        </BaseCombobox.Trigger>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner sideOffset={8}>
          <BaseCombobox.Popup className="bench-popup bench-list-popup" data-benchmark-popup="true">
            <PaintMarker name="combobox-open" />
            <BaseCombobox.List>
              {(item, index) => (
                <BaseCombobox.Item
                  className="bench-item"
                  data-benchmark-item="true"
                  index={index}
                  key={item.id}
                  value={item}
                >
                  {item.label}
                </BaseCombobox.Item>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

function ZagComboboxOpen({ items }) {
  return <ZagComboboxFixture idPrefix="combobox-open" items={items} />;
}

function ZagComboboxFixture({ items, idPrefix }) {
  const [options, setOptions] = React.useState(items);
  const collection = useMemo(
    () =>
      zagCombobox.collection({
        items: options,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
      }),
    [options],
  );
  const service = useMachine(zagCombobox.machine, {
    collection,
    id: idPrefix + "-" + useId(),
    onInputValueChange({ inputValue }) {
      const normalizedInputValue = inputValue.toLowerCase();
      setOptions(items.filter((item) => item.label.toLowerCase().includes(normalizedInputValue)));
    },
    onOpenChange() {
      setOptions(items);
    },
    openOnKeyPress: true,
  });
  const api = zagCombobox.connect(service, normalizeProps);

  return (
    <div {...api.getRootProps()}>
      <div {...api.getControlProps()}>
        <input {...api.getInputProps()} className="bench-trigger" data-benchmark-input="true" />
        <button
          {...api.getTriggerProps({ focusable: true })}
          className="bench-trigger"
          data-benchmark-trigger="true"
        >
          v
        </button>
      </div>
      {api.open && (
        <ZagPortal>
          <div {...api.getPositionerProps()}>
            <ul {...api.getContentProps()} className="bench-popup bench-list-popup" data-benchmark-popup="true">
              <PaintMarker name="combobox-open" />
              {options.map((item) => (
                <li
                  {...api.getItemProps({ item })}
                  className="bench-item"
                  data-benchmark-item="true"
                  key={item.id}
                >
                  <span {...api.getItemTextProps({ item })}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </ZagPortal>
      )}
    </div>
  );
}

function StarwindDialogOpen() {
  return (
    <StarwindDialog.Root>
      <StarwindDialog.Trigger className="bench-trigger" data-benchmark-trigger="true">
        Open dialog
      </StarwindDialog.Trigger>
      <StarwindDialog.Backdrop className="bench-backdrop" />
      <StarwindDialog.Popup className="bench-popup" data-benchmark-popup="true">
        <StarwindDialog.Title>Benchmark dialog</StarwindDialog.Title>
        <StarwindDialog.Description>Dialog content</StarwindDialog.Description>
        <PaintMarker name="dialog-open" />
        <button type="button">Focusable field</button>
        <StarwindDialog.Close className="bench-trigger">Close</StarwindDialog.Close>
      </StarwindDialog.Popup>
    </StarwindDialog.Root>
  );
}

function BaseDialogOpen() {
  return (
    <BaseDialog.Root>
      <BaseDialog.Trigger className="bench-trigger" data-benchmark-trigger="true">
        Open dialog
      </BaseDialog.Trigger>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="bench-backdrop" />
        <BaseDialog.Popup className="bench-popup" data-benchmark-popup="true">
          <BaseDialog.Title>Benchmark dialog</BaseDialog.Title>
          <BaseDialog.Description>Dialog content</BaseDialog.Description>
          <PaintMarker name="dialog-open" />
          <button type="button">Focusable field</button>
          <BaseDialog.Close className="bench-trigger">Close</BaseDialog.Close>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

function ZagDialogOpen() {
  const service = useMachine(zagDialog.machine, { id: useId() });
  const api = zagDialog.connect(service, normalizeProps);

  return (
    <div>
      <button {...api.getTriggerProps()} className="bench-trigger" data-benchmark-trigger="true">
        Open dialog
      </button>
      {api.open && (
        <ZagPortal>
          <div {...api.getBackdropProps()} className="bench-backdrop" />
          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()} className="bench-popup" data-benchmark-popup="true">
              <h2 {...api.getTitleProps()}>Benchmark dialog</h2>
              <p {...api.getDescriptionProps()}>Dialog content</p>
              <PaintMarker name="dialog-open" />
              <button type="button">Focusable field</button>
              <button {...api.getCloseTriggerProps()} className="bench-trigger">
                Close
              </button>
            </div>
          </div>
        </ZagPortal>
      )}
    </div>
  );
}

function StarwindSelectOpen({ items }) {
  return (
    <StarwindSelect.Root defaultValue={items[0].value}>
      <StarwindSelect.Trigger className="bench-trigger" data-benchmark-trigger="true">
        <StarwindSelect.Value placeholder="Choose item" />
        <StarwindSelect.Icon>v</StarwindSelect.Icon>
      </StarwindSelect.Trigger>
      <StarwindSelect.Portal>
        <StarwindSelect.Positioner alignItemWithTrigger={false} sideOffset={8}>
          <StarwindSelect.Popup className="bench-popup bench-list-popup" data-benchmark-popup="true">
            <PaintMarker name="select-open" />
            <StarwindSelect.List>
              {items.map((item) => (
                <StarwindSelect.Item
                  className="bench-item"
                  data-benchmark-item="true"
                  key={item.id}
                  value={item.value}
                >
                  <StarwindSelect.ItemIndicator>*</StarwindSelect.ItemIndicator>
                  <StarwindSelect.ItemText>{item.label}</StarwindSelect.ItemText>
                </StarwindSelect.Item>
              ))}
            </StarwindSelect.List>
          </StarwindSelect.Popup>
        </StarwindSelect.Positioner>
      </StarwindSelect.Portal>
    </StarwindSelect.Root>
  );
}

function BaseSelectOpen({ items }) {
  return (
    <BaseSelect.Root items={items} defaultValue={items[0].value}>
      <BaseSelect.Trigger className="bench-trigger" data-benchmark-trigger="true">
        <BaseSelect.Value placeholder="Choose item" />
        <BaseSelect.Icon>v</BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={8}>
          <BaseSelect.Popup className="bench-popup bench-list-popup" data-benchmark-popup="true">
            <PaintMarker name="select-open" />
            <BaseSelect.List>
              {items.map((item) => (
                <BaseSelect.Item
                  className="bench-item"
                  data-benchmark-item="true"
                  key={item.id}
                  value={item.value}
                >
                  <BaseSelect.ItemIndicator>*</BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText>{item.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

function ZagSelectOpen({ items }) {
  const collection = useMemo(() => zagSelect.collection({ items }), [items]);
  const service = useMachine(zagSelect.machine, {
    collection,
    id: useId(),
    value: [items[0].value],
  });
  const api = zagSelect.connect(service, normalizeProps);

  return (
    <div {...api.getRootProps()}>
      <div {...api.getControlProps()}>
        <button {...api.getTriggerProps()} className="bench-trigger" data-benchmark-trigger="true">
          <span>{api.valueAsString || "Choose item"}</span>
          <span {...api.getIndicatorProps()}>v</span>
        </button>
      </div>
      <select {...api.getHiddenSelectProps()}>
        {items.map((item) => (
          <option key={item.id} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {api.open && (
        <ZagPortal>
          <div {...api.getPositionerProps()}>
            <ul {...api.getContentProps()} className="bench-popup bench-list-popup" data-benchmark-popup="true">
              <PaintMarker name="select-open" />
              {items.map((item) => (
                <li
                  {...api.getItemProps({ item })}
                  className="bench-item"
                  data-benchmark-item="true"
                  key={item.id}
                >
                  <span {...api.getItemTextProps({ item })}>{item.label}</span>
                  <span {...api.getItemIndicatorProps({ item })}>*</span>
                </li>
              ))}
            </ul>
          </div>
        </ZagPortal>
      )}
    </div>
  );
}

function StarwindMenuOpen({ items }) {
  return (
    <StarwindMenu.Root>
      <StarwindMenu.Trigger className="bench-trigger" data-benchmark-trigger="true">
        Open menu
      </StarwindMenu.Trigger>
      <StarwindMenu.Portal>
        <StarwindMenu.Positioner sideOffset={8}>
          <StarwindMenu.Popup className="bench-popup bench-list-popup" data-benchmark-popup="true">
            <PaintMarker name="menu-open" />
            {items.map((item) => (
              <StarwindMenu.Item className="bench-item" data-benchmark-item="true" key={item.id}>
                {item.label}
              </StarwindMenu.Item>
            ))}
          </StarwindMenu.Popup>
        </StarwindMenu.Positioner>
      </StarwindMenu.Portal>
    </StarwindMenu.Root>
  );
}

function BaseMenuOpen({ items }) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger className="bench-trigger" data-benchmark-trigger="true">
        Open menu
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={8} positionMethod="fixed">
          <BaseMenu.Popup className="bench-popup bench-list-popup" data-benchmark-popup="true">
            <PaintMarker name="menu-open" />
            {items.map((item) => (
              <BaseMenu.Item className="bench-item" data-benchmark-item="true" key={item.id}>
                {item.label}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

function ZagMenuOpen({ items }) {
  const service = useMachine(zagMenu.machine, { id: useId() });
  const api = zagMenu.connect(service, normalizeProps);

  return (
    <div>
      <button {...api.getTriggerProps()} className="bench-trigger" data-benchmark-trigger="true">
        Open menu
      </button>
      {api.open && (
        <ZagPortal>
          <div {...api.getPositionerProps()}>
            <ul {...api.getContentProps()} className="bench-popup bench-list-popup" data-benchmark-popup="true">
              <PaintMarker name="menu-open" />
              {items.map((item) => (
                <li
                  {...api.getItemProps({ value: item.value })}
                  className="bench-item"
                  data-benchmark-item="true"
                  key={item.id}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </ZagPortal>
      )}
    </div>
  );
}

function StarwindMenuSubmenu({ items }) {
  return (
    <StarwindMenu.Root>
      <StarwindMenu.Trigger className="bench-trigger" data-benchmark-trigger="true">
        Open menu
      </StarwindMenu.Trigger>
      <StarwindMenu.Portal>
        <StarwindMenu.Positioner sideOffset={8}>
          <StarwindMenu.Popup className="bench-popup" data-benchmark-root-popup="true">
            <PaintMarker name="menu-open" />
            <StarwindMenu.SubmenuRoot closeDelay={0}>
              <StarwindMenu.SubmenuTrigger className="bench-item" data-benchmark-submenu-trigger="true">
                More items
              </StarwindMenu.SubmenuTrigger>
              <StarwindMenu.Portal>
                <StarwindMenu.Positioner side="right" align="start" sideOffset={8}>
                  <StarwindMenu.Popup className="bench-popup bench-list-popup" data-benchmark-popup="true">
                    <PaintMarker name="menu-submenu-open" />
                    {items.map((item) => (
                      <StarwindMenu.Item className="bench-item" data-benchmark-item="true" key={item.id}>
                        {item.label}
                      </StarwindMenu.Item>
                    ))}
                  </StarwindMenu.Popup>
                </StarwindMenu.Positioner>
              </StarwindMenu.Portal>
            </StarwindMenu.SubmenuRoot>
          </StarwindMenu.Popup>
        </StarwindMenu.Positioner>
      </StarwindMenu.Portal>
    </StarwindMenu.Root>
  );
}

function BaseMenuSubmenu({ items }) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger className="bench-trigger" data-benchmark-trigger="true">
        Open menu
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={8} positionMethod="fixed">
          <BaseMenu.Popup className="bench-popup" data-benchmark-root-popup="true">
            <PaintMarker name="menu-open" />
            <BaseMenu.SubmenuRoot>
              <BaseMenu.SubmenuTrigger
                className="bench-item"
                data-benchmark-submenu-trigger="true"
                delay={0}
                closeDelay={0}
                openOnHover={false}
              >
                More items
              </BaseMenu.SubmenuTrigger>
              <BaseMenu.Portal>
                <BaseMenu.Positioner side="right" align="start" sideOffset={8} positionMethod="fixed">
                  <BaseMenu.Popup className="bench-popup bench-list-popup" data-benchmark-popup="true">
                    <PaintMarker name="menu-submenu-open" />
                    {items.map((item) => (
                      <BaseMenu.Item className="bench-item" data-benchmark-item="true" key={item.id}>
                        {item.label}
                      </BaseMenu.Item>
                    ))}
                  </BaseMenu.Popup>
                </BaseMenu.Positioner>
              </BaseMenu.Portal>
            </BaseMenu.SubmenuRoot>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

function ZagMenuSubmenu({ items }) {
  const id = useId();
  const parentService = useMachine(zagMenu.machine, {
    id: "menu-parent-" + id,
    positioning: { placement: "bottom-start", gutter: 8 },
  });
  const childService = useMachine(zagMenu.machine, {
    id: "menu-child-" + id,
    positioning: { placement: "right-start", gutter: 8 },
  });
  const parentApi = zagMenu.connect(parentService, normalizeProps);
  const childApi = zagMenu.connect(childService, normalizeProps);

  React.useLayoutEffect(() => {
    parentApi.setChild(childService);
    childApi.setParent(parentService);
  }, []);

  const submenuTriggerProps = parentApi.getTriggerItemProps(childApi);

  return (
    <div>
      <button {...parentApi.getTriggerProps()} className="bench-trigger" data-benchmark-trigger="true">
        Open menu
      </button>
      <ZagPortal>
        <div {...parentApi.getPositionerProps()}>
          <ul {...parentApi.getContentProps()} className="bench-popup" data-benchmark-root-popup="true">
            <PaintMarker name="menu-open" />
            <li
              {...submenuTriggerProps}
              className="bench-item"
              data-benchmark-submenu-trigger="true"
              tabIndex={0}
            >
              More items
              <span {...childApi.getIndicatorProps()}>›</span>
            </li>
          </ul>
        </div>
      </ZagPortal>
      <ZagPortal>
        <div {...childApi.getPositionerProps()}>
          <ul {...childApi.getContentProps()} className="bench-popup bench-list-popup" data-benchmark-popup="true">
            <PaintMarker name="menu-submenu-open" />
            {items.map((item) => (
              <li
                {...childApi.getItemProps({ value: item.value })}
                className="bench-item"
                data-benchmark-item="true"
                key={item.id}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </ZagPortal>
    </div>
  );
}

function StarwindNavigationMenuSwitch() {
  return (
    <StarwindNavigationMenu.Root openDelay={0} closeDelay={0} aria-label="Benchmark navigation">
      <StarwindNavigationMenu.List className="bench-nav-list">
        <StarwindNavigationMenu.Item value="products">
          <StarwindNavigationMenu.Trigger className="bench-trigger" data-benchmark-nav-trigger="primary">
            Products
          </StarwindNavigationMenu.Trigger>
          <StarwindNavigationMenu.Content className="bench-nav-content">
            <PaintMarker name="navigation-menu-primary" />
            <NavigationContentLinks value="products" items={navigationPrimaryItems} />
          </StarwindNavigationMenu.Content>
        </StarwindNavigationMenu.Item>
        <StarwindNavigationMenu.Item value="resources">
          <StarwindNavigationMenu.Trigger className="bench-trigger" data-benchmark-nav-trigger="secondary">
            Resources
          </StarwindNavigationMenu.Trigger>
          <StarwindNavigationMenu.Content className="bench-nav-content">
            <PaintMarker name="navigation-menu-secondary" />
            <NavigationContentLinks value="resources" items={navigationSecondaryItems} />
          </StarwindNavigationMenu.Content>
        </StarwindNavigationMenu.Item>
      </StarwindNavigationMenu.List>
      <StarwindNavigationMenu.Portal>
        <StarwindNavigationMenu.Positioner>
          <StarwindNavigationMenu.Popup className="bench-popup bench-nav-popup">
            <StarwindNavigationMenu.Viewport />
          </StarwindNavigationMenu.Popup>
        </StarwindNavigationMenu.Positioner>
      </StarwindNavigationMenu.Portal>
    </StarwindNavigationMenu.Root>
  );
}

function BaseNavigationMenuSwitch() {
  return (
    <BaseNavigationMenu.Root delay={0} closeDelay={0} aria-label="Benchmark navigation">
      <BaseNavigationMenu.List className="bench-nav-list">
        <BaseNavigationMenu.Item value="products">
          <BaseNavigationMenu.Trigger className="bench-trigger" data-benchmark-nav-trigger="primary">
            Products
          </BaseNavigationMenu.Trigger>
          <BaseNavigationMenu.Content className="bench-nav-content">
            <PaintMarker name="navigation-menu-primary" />
            <NavigationContentLinks value="products" items={navigationPrimaryItems} />
          </BaseNavigationMenu.Content>
        </BaseNavigationMenu.Item>
        <BaseNavigationMenu.Item value="resources">
          <BaseNavigationMenu.Trigger className="bench-trigger" data-benchmark-nav-trigger="secondary">
            Resources
          </BaseNavigationMenu.Trigger>
          <BaseNavigationMenu.Content className="bench-nav-content">
            <PaintMarker name="navigation-menu-secondary" />
            <NavigationContentLinks value="resources" items={navigationSecondaryItems} />
          </BaseNavigationMenu.Content>
        </BaseNavigationMenu.Item>
      </BaseNavigationMenu.List>
      <BaseNavigationMenu.Portal>
        <BaseNavigationMenu.Positioner>
          <BaseNavigationMenu.Popup className="bench-popup bench-nav-popup">
            <BaseNavigationMenu.Viewport />
          </BaseNavigationMenu.Popup>
        </BaseNavigationMenu.Positioner>
      </BaseNavigationMenu.Portal>
    </BaseNavigationMenu.Root>
  );
}

function ZagNavigationMenuSwitch() {
  const service = useMachine(zagNavigationMenu.machine, {
    id: "navigation-menu-" + useId(),
    closeDelay: 0,
    openDelay: 0,
  });
  const api = zagNavigationMenu.connect(service, normalizeProps);

  return (
    <nav {...api.getRootProps()} aria-label="Benchmark navigation">
      <div {...api.getListProps()} className="bench-nav-list">
        <div {...api.getItemProps({ value: "products" })}>
          <button
            {...api.getTriggerProps({ value: "products" })}
            className="bench-trigger"
            data-benchmark-nav-trigger="primary"
          >
            Products
          </button>
          <span {...api.getTriggerProxyProps({ value: "products" })} />
          <span {...api.getViewportProxyProps({ value: "products" })} />
        </div>
        <div {...api.getItemProps({ value: "resources" })}>
          <button
            {...api.getTriggerProps({ value: "resources" })}
            className="bench-trigger"
            data-benchmark-nav-trigger="secondary"
          >
            Resources
          </button>
          <span {...api.getTriggerProxyProps({ value: "resources" })} />
          <span {...api.getViewportProxyProps({ value: "resources" })} />
        </div>
      </div>
      <div {...api.getViewportPositionerProps()}>
        <div {...api.getViewportProps()} className="bench-popup bench-nav-popup">
          <div {...api.getContentProps({ value: "products" })} className="bench-nav-content">
            <PaintMarker name="navigation-menu-primary" />
            <NavigationContentLinks value="products" items={navigationPrimaryItems} />
          </div>
          <div {...api.getContentProps({ value: "resources" })} className="bench-nav-content">
            <PaintMarker name="navigation-menu-secondary" />
            <NavigationContentLinks value="resources" items={navigationSecondaryItems} />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavigationContentLinks({ value, items }) {
  return (
    <ul className="bench-nav-grid">
      {items.map((item) => (
        <li className="bench-nav-link" key={item.id}>
          <a href={"#" + value + "-" + item.id}>{item.label}</a>
        </li>
      ))}
    </ul>
  );
}

function StarwindTabsHighCount({ items }) {
  return (
    <StarwindTabs.Root defaultValue={items[0].value}>
      <StarwindTabs.List className="bench-collection-list">
        {items.map((item, index) => (
          <StarwindTabs.Tab
            className="bench-item"
            data-benchmark-tab-trigger={index === items.length - 1 ? "target" : "true"}
            key={item.id}
            value={item.value}
          >
            {item.label}
          </StarwindTabs.Tab>
        ))}
      </StarwindTabs.List>
      {items.map((item, index) => (
        <StarwindTabs.Panel
          className="bench-collection-panel"
          data-benchmark-panel={index === items.length - 1 ? "target" : "true"}
          keepMounted
          key={item.id}
          value={item.value}
        >
          {index === items.length - 1 && <PaintMarker name="tabs-target-panel" />}
          Panel {item.id}
        </StarwindTabs.Panel>
      ))}
    </StarwindTabs.Root>
  );
}

function BaseTabsHighCount({ items }) {
  return (
    <BaseTabs.Root defaultValue={items[0].value}>
      <BaseTabs.List className="bench-collection-list">
        {items.map((item, index) => (
          <BaseTabs.Tab
            className="bench-item"
            data-benchmark-tab-trigger={index === items.length - 1 ? "target" : "true"}
            key={item.id}
            value={item.value}
          >
            {item.label}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {items.map((item, index) => (
        <BaseTabs.Panel
          className="bench-collection-panel"
          data-benchmark-panel={index === items.length - 1 ? "target" : "true"}
          keepMounted
          key={item.id}
          value={item.value}
        >
          {index === items.length - 1 && <PaintMarker name="tabs-target-panel" />}
          Panel {item.id}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}

function ZagTabsHighCount({ items }) {
  const service = useMachine(zagTabs.machine, {
    activationMode: "manual",
    defaultValue: items[0].value,
    id: "tabs-" + useId(),
  });
  const api = zagTabs.connect(service, normalizeProps);

  return (
    <div {...api.getRootProps()}>
      <div {...api.getListProps()} className="bench-collection-list">
        {items.map((item, index) => (
          <button
            {...api.getTriggerProps({ value: item.value })}
            className="bench-item"
            data-benchmark-tab-trigger={index === items.length - 1 ? "target" : "true"}
            key={item.id}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div
          {...api.getContentProps({ value: item.value })}
          className="bench-collection-panel"
          data-benchmark-panel={index === items.length - 1 ? "target" : "true"}
          key={item.id}
        >
          {index === items.length - 1 && <PaintMarker name="tabs-target-panel" />}
          Panel {item.id}
        </div>
      ))}
    </div>
  );
}

function StarwindAccordionHighCount({ items }) {
  return (
    <StarwindAccordion.Root collapsible type="single">
      {items.map((item, index) => (
        <StarwindAccordion.Item className="bench-collection-item" key={item.id} value={item.value}>
          <StarwindAccordion.Header>
            <StarwindAccordion.Trigger
              className="bench-item"
              data-benchmark-accordion-trigger={index === items.length - 1 ? "target" : "true"}
            >
              {item.label}
            </StarwindAccordion.Trigger>
          </StarwindAccordion.Header>
          <StarwindAccordion.Panel
            className="bench-collection-panel"
            data-benchmark-panel={index === items.length - 1 ? "target" : "true"}
          >
            {index === items.length - 1 && <PaintMarker name="accordion-target-panel" />}
            Panel {item.id}
          </StarwindAccordion.Panel>
        </StarwindAccordion.Item>
      ))}
    </StarwindAccordion.Root>
  );
}

function BaseAccordionHighCount({ items }) {
  return (
    <BaseAccordion.Root defaultValue={[]} keepMounted multiple={false}>
      {items.map((item, index) => (
        <BaseAccordion.Item className="bench-collection-item" key={item.id} value={item.value}>
          <BaseAccordion.Header>
            <BaseAccordion.Trigger
              className="bench-item"
              data-benchmark-accordion-trigger={index === items.length - 1 ? "target" : "true"}
            >
              {item.label}
            </BaseAccordion.Trigger>
          </BaseAccordion.Header>
          <BaseAccordion.Panel
            className="bench-collection-panel"
            data-benchmark-panel={index === items.length - 1 ? "target" : "true"}
          >
            {index === items.length - 1 && <PaintMarker name="accordion-target-panel" />}
            Panel {item.id}
          </BaseAccordion.Panel>
        </BaseAccordion.Item>
      ))}
    </BaseAccordion.Root>
  );
}

function ZagAccordionHighCount({ items }) {
  const service = useMachine(zagAccordion.machine, {
    collapsible: true,
    defaultValue: [],
    id: "accordion-" + useId(),
  });
  const api = zagAccordion.connect(service, normalizeProps);

  return (
    <div {...api.getRootProps()}>
      {items.map((item, index) => (
        <div {...api.getItemProps({ value: item.value })} className="bench-collection-item" key={item.id}>
          <h3>
            <button
              {...api.getItemTriggerProps({ value: item.value })}
              className="bench-item"
              data-benchmark-accordion-trigger={index === items.length - 1 ? "target" : "true"}
            >
              {item.label}
            </button>
          </h3>
          <div
            {...api.getItemContentProps({ value: item.value })}
            className="bench-collection-panel"
            data-benchmark-panel={index === items.length - 1 ? "target" : "true"}
          >
            {index === items.length - 1 && <PaintMarker name="accordion-target-panel" />}
            Panel {item.id}
          </div>
        </div>
      ))}
    </div>
  );
}

function StarwindRadioGroupHighCount({ items }) {
  return (
    <StarwindRadioGroup.Root defaultValue={items[0].value} name="starwind-radio-benchmark">
      <div className="bench-collection-list">
        {items.map((item) => (
          <StarwindRadio.Root
            className="bench-radio-item"
            data-benchmark-radio-item="true"
            key={item.id}
            value={item.value}
          >
            {item.label}
          </StarwindRadio.Root>
        ))}
      </div>
    </StarwindRadioGroup.Root>
  );
}

function BaseRadioGroupHighCount({ items }) {
  return (
    <BaseRadioGroup defaultValue={items[0].value} name="base-radio-benchmark">
      <div className="bench-collection-list">
        {items.map((item) => (
          <BaseRadio.Root
            className="bench-radio-item"
            data-benchmark-radio-item="true"
            key={item.id}
            value={item.value}
          >
            {item.label}
          </BaseRadio.Root>
        ))}
      </div>
    </BaseRadioGroup>
  );
}

function ZagRadioGroupHighCount({ items }) {
  const service = useMachine(zagRadioGroup.machine, {
    defaultValue: items[0].value,
    id: "radio-group-" + useId(),
    name: "zag-radio-benchmark",
  });
  const api = zagRadioGroup.connect(service, normalizeProps);

  return (
    <div {...api.getRootProps()}>
      <div className="bench-collection-list">
        {items.map((item) => (
          <label
            {...api.getItemProps({ value: item.value })}
            className="bench-radio-item"
            data-benchmark-radio-item="true"
            key={item.id}
          >
            <span {...api.getItemControlProps({ value: item.value })} />
            <span {...api.getItemTextProps({ value: item.value })}>{item.label}</span>
            <input {...api.getItemHiddenInputProps({ value: item.value })} />
          </label>
        ))}
      </div>
    </div>
  );
}

function StarwindTooltipMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <StarwindTooltip.Root key={row.id} openDelay={0} closeDelay={0}>
          <StarwindTooltip.Trigger className="bench-trigger">Tooltip {row.id}</StarwindTooltip.Trigger>
          <StarwindTooltip.Portal>
            <StarwindTooltip.Positioner>
              <StarwindTooltip.Popup className="bench-popup">Tooltip {row.id}</StarwindTooltip.Popup>
            </StarwindTooltip.Positioner>
          </StarwindTooltip.Portal>
        </StarwindTooltip.Root>
      )}
    </MountList>
  );
}

function BaseTooltipMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <BaseTooltip.Root key={row.id}>
          <BaseTooltip.Trigger delay={0} className="bench-trigger">
            Tooltip {row.id}
          </BaseTooltip.Trigger>
          <BaseTooltip.Portal>
            <BaseTooltip.Positioner sideOffset={8}>
              <BaseTooltip.Popup className="bench-popup">Tooltip {row.id}</BaseTooltip.Popup>
            </BaseTooltip.Positioner>
          </BaseTooltip.Portal>
        </BaseTooltip.Root>
      )}
    </MountList>
  );
}

function ZagTooltipMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => <ZagTooltipMountItem key={row.id} row={row} />}
    </MountList>
  );
}

function ZagTooltipMountItem({ row }) {
  const service = useMachine(zagTooltip.machine, { id: "tooltip-" + row.id, openDelay: 0, closeDelay: 0 });
  const api = zagTooltip.connect(service, normalizeProps);

  return (
    <>
      <button {...api.getTriggerProps()} className="bench-trigger">
        Tooltip {row.id}
      </button>
      <ZagPortal>
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()} className="bench-popup">
            Tooltip {row.id}
          </div>
        </div>
      </ZagPortal>
    </>
  );
}

function StarwindDialogMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <StarwindDialog.Root key={row.id}>
          <StarwindDialog.Trigger className="bench-trigger">Dialog {row.id}</StarwindDialog.Trigger>
          <StarwindDialog.Backdrop className="bench-backdrop" />
          <StarwindDialog.Popup className="bench-popup">
            <StarwindDialog.Title>Dialog {row.id}</StarwindDialog.Title>
            <StarwindDialog.Description>Closed dialog content {row.id}</StarwindDialog.Description>
            <StarwindDialog.Close className="bench-trigger">Close</StarwindDialog.Close>
          </StarwindDialog.Popup>
        </StarwindDialog.Root>
      )}
    </MountList>
  );
}

function BaseDialogMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <BaseDialog.Root key={row.id}>
          <BaseDialog.Trigger className="bench-trigger">Dialog {row.id}</BaseDialog.Trigger>
          <BaseDialog.Portal keepMounted>
            <BaseDialog.Backdrop className="bench-backdrop" />
            <BaseDialog.Popup className="bench-popup">
              <BaseDialog.Title>Dialog {row.id}</BaseDialog.Title>
              <BaseDialog.Description>Closed dialog content {row.id}</BaseDialog.Description>
              <BaseDialog.Close className="bench-trigger">Close</BaseDialog.Close>
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        </BaseDialog.Root>
      )}
    </MountList>
  );
}

function ZagDialogMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => <ZagDialogMountItem key={row.id} row={row} />}
    </MountList>
  );
}

function ZagDialogMountItem({ row }) {
  const service = useMachine(zagDialog.machine, { id: "dialog-" + row.id });
  const api = zagDialog.connect(service, normalizeProps);

  return (
    <>
      <button {...api.getTriggerProps()} className="bench-trigger">
        Dialog {row.id}
      </button>
      <ZagPortal>
        <div {...api.getBackdropProps()} className="bench-backdrop" />
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()} className="bench-popup">
            <h2 {...api.getTitleProps()}>Dialog {row.id}</h2>
            <p {...api.getDescriptionProps()}>Closed dialog content {row.id}</p>
            <button {...api.getCloseTriggerProps()} className="bench-trigger">
              Close
            </button>
          </div>
        </div>
      </ZagPortal>
    </>
  );
}

function StarwindPopoverMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <StarwindPopover.Root key={row.id}>
          <StarwindPopover.Trigger className="bench-trigger">Popover {row.id}</StarwindPopover.Trigger>
          <StarwindPopover.Portal>
            <StarwindPopover.Positioner>
              <StarwindPopover.Popup className="bench-popup">
                <StarwindPopover.Title>Popover {row.id}</StarwindPopover.Title>
                <StarwindPopover.Description>Closed popover content {row.id}</StarwindPopover.Description>
                <StarwindPopover.Close className="bench-trigger">Close</StarwindPopover.Close>
              </StarwindPopover.Popup>
            </StarwindPopover.Positioner>
          </StarwindPopover.Portal>
        </StarwindPopover.Root>
      )}
    </MountList>
  );
}

function BasePopoverMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <BasePopover.Root key={row.id}>
          <BasePopover.Trigger className="bench-trigger">Popover {row.id}</BasePopover.Trigger>
          <BasePopover.Portal keepMounted>
            <BasePopover.Positioner sideOffset={8}>
              <BasePopover.Popup className="bench-popup">
                <BasePopover.Title>Popover {row.id}</BasePopover.Title>
                <BasePopover.Description>Closed popover content {row.id}</BasePopover.Description>
                <BasePopover.Close className="bench-trigger">Close</BasePopover.Close>
              </BasePopover.Popup>
            </BasePopover.Positioner>
          </BasePopover.Portal>
        </BasePopover.Root>
      )}
    </MountList>
  );
}

function ZagPopoverMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => <ZagPopoverMountItem key={row.id} row={row} />}
    </MountList>
  );
}

function ZagPopoverMountItem({ row }) {
  const service = useMachine(zagPopover.machine, { id: "popover-" + row.id });
  const api = zagPopover.connect(service, normalizeProps);

  return (
    <>
      <button {...api.getTriggerProps()} className="bench-trigger">
        Popover {row.id}
      </button>
      <ZagPortal>
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()} className="bench-popup">
            <h2 {...api.getTitleProps()}>Popover {row.id}</h2>
            <p {...api.getDescriptionProps()}>Closed popover content {row.id}</p>
            <button {...api.getCloseTriggerProps()} className="bench-trigger">
              Close
            </button>
          </div>
        </div>
      </ZagPortal>
    </>
  );
}

function StarwindPreviewCardMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <StarwindPreviewCard.Root key={row.id} openDelay={0} closeDelay={0}>
          <StarwindPreviewCard.Trigger className="bench-trigger">
            Preview {row.id}
          </StarwindPreviewCard.Trigger>
          <StarwindPreviewCard.Portal>
            <StarwindPreviewCard.Positioner>
              <StarwindPreviewCard.Popup className="bench-popup">
                Preview card content {row.id}
              </StarwindPreviewCard.Popup>
            </StarwindPreviewCard.Positioner>
          </StarwindPreviewCard.Portal>
        </StarwindPreviewCard.Root>
      )}
    </MountList>
  );
}

function BasePreviewCardMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <BasePreviewCard.Root key={row.id}>
          <BasePreviewCard.Trigger delay={0} className="bench-trigger">
            Preview {row.id}
          </BasePreviewCard.Trigger>
          <BasePreviewCard.Portal keepMounted>
            <BasePreviewCard.Positioner sideOffset={8}>
              <BasePreviewCard.Popup className="bench-popup">
                Preview card content {row.id}
              </BasePreviewCard.Popup>
            </BasePreviewCard.Positioner>
          </BasePreviewCard.Portal>
        </BasePreviewCard.Root>
      )}
    </MountList>
  );
}

function ZagHoverCardMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => <ZagHoverCardMountItem key={row.id} row={row} />}
    </MountList>
  );
}

function ZagHoverCardMountItem({ row }) {
  const service = useMachine(zagHoverCard.machine, {
    id: "hover-card-" + row.id,
    closeDelay: 0,
    openDelay: 0,
  });
  const api = zagHoverCard.connect(service, normalizeProps);

  return (
    <>
      <span {...api.getTriggerProps()} className="bench-trigger">
        Preview {row.id}
      </span>
      <ZagPortal>
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()} className="bench-popup">
            Preview card content {row.id}
          </div>
        </div>
      </ZagPortal>
    </>
  );
}

function StarwindComboboxMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <StarwindCombobox.Root key={row.id}>
          <StarwindCombobox.InputGroup>
            <StarwindCombobox.Input className="bench-trigger" />
            <StarwindCombobox.Trigger className="bench-trigger">
              <StarwindCombobox.Icon>v</StarwindCombobox.Icon>
            </StarwindCombobox.Trigger>
          </StarwindCombobox.InputGroup>
          <StarwindCombobox.Portal>
            <StarwindCombobox.Positioner sideOffset={8}>
              <StarwindCombobox.Popup className="bench-popup">
                <StarwindCombobox.List>
                  {smallComboboxItems.map((item) => (
                    <StarwindCombobox.Item className="bench-item" key={item.id} value={item.value}>
                      <StarwindCombobox.ItemText>{item.label}</StarwindCombobox.ItemText>
                    </StarwindCombobox.Item>
                  ))}
                </StarwindCombobox.List>
              </StarwindCombobox.Popup>
            </StarwindCombobox.Positioner>
          </StarwindCombobox.Portal>
        </StarwindCombobox.Root>
      )}
    </MountList>
  );
}

function BaseComboboxMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <BaseCombobox.Root
          items={smallComboboxItems}
          itemToStringLabel={(item) => item.label}
          itemToStringValue={(item) => item.value}
          key={row.id}
        >
          <BaseCombobox.InputGroup>
            <BaseCombobox.Input className="bench-trigger" />
            <BaseCombobox.Trigger className="bench-trigger">v</BaseCombobox.Trigger>
          </BaseCombobox.InputGroup>
          <BaseCombobox.Portal>
            <BaseCombobox.Positioner sideOffset={8}>
              <BaseCombobox.Popup className="bench-popup">
                <BaseCombobox.List>
                  {(item, index) => (
                    <BaseCombobox.Item
                      className="bench-item"
                      index={index}
                      key={item.id}
                      value={item}
                    >
                      {item.label}
                    </BaseCombobox.Item>
                  )}
                </BaseCombobox.List>
              </BaseCombobox.Popup>
            </BaseCombobox.Positioner>
          </BaseCombobox.Portal>
        </BaseCombobox.Root>
      )}
    </MountList>
  );
}

function ZagComboboxMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <ZagComboboxFixture
          idPrefix={"combobox-" + row.id}
          items={smallComboboxItems}
          key={row.id}
        />
      )}
    </MountList>
  );
}

function StarwindSelectMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <StarwindSelect.Root key={row.id} defaultValue={smallSelectItems[0].value}>
          <StarwindSelect.Trigger className="bench-trigger">
            <StarwindSelect.Value placeholder={"Select " + row.id} />
            <StarwindSelect.Icon>v</StarwindSelect.Icon>
          </StarwindSelect.Trigger>
          <StarwindSelect.Portal>
            <StarwindSelect.Positioner alignItemWithTrigger={false}>
              <StarwindSelect.Popup className="bench-popup">
                <StarwindSelect.List>
                  {smallSelectItems.map((item) => (
                    <StarwindSelect.Item className="bench-item" key={item.id} value={item.value}>
                      <StarwindSelect.ItemText>{item.label}</StarwindSelect.ItemText>
                    </StarwindSelect.Item>
                  ))}
                </StarwindSelect.List>
              </StarwindSelect.Popup>
            </StarwindSelect.Positioner>
          </StarwindSelect.Portal>
        </StarwindSelect.Root>
      )}
    </MountList>
  );
}

function BaseSelectMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => (
        <BaseSelect.Root key={row.id} items={smallSelectItems} defaultValue={smallSelectItems[0].value}>
          <BaseSelect.Trigger className="bench-trigger">
            <BaseSelect.Value placeholder={"Select " + row.id} />
            <BaseSelect.Icon>v</BaseSelect.Icon>
          </BaseSelect.Trigger>
          <BaseSelect.Portal>
            <BaseSelect.Positioner sideOffset={8}>
              <BaseSelect.Popup className="bench-popup">
                <BaseSelect.List>
                  {smallSelectItems.map((item) => (
                    <BaseSelect.Item className="bench-item" key={item.id} value={item.value}>
                      <BaseSelect.ItemText>{item.label}</BaseSelect.ItemText>
                    </BaseSelect.Item>
                  ))}
                </BaseSelect.List>
              </BaseSelect.Popup>
            </BaseSelect.Positioner>
          </BaseSelect.Portal>
        </BaseSelect.Root>
      )}
    </MountList>
  );
}

function ZagSelectMountList() {
  return (
    <MountList rows={mountRows}>
      {(row) => <ZagSelectMountItem key={row.id} row={row} />}
    </MountList>
  );
}

function ZagSelectMountItem({ row }) {
  const collection = useMemo(() => zagSelect.collection({ items: smallSelectItems }), []);
  const service = useMachine(zagSelect.machine, {
    collection,
    id: "select-" + row.id,
    value: [smallSelectItems[0].value],
  });
  const api = zagSelect.connect(service, normalizeProps);

  return (
    <div {...api.getRootProps()}>
      <div {...api.getControlProps()}>
        <button {...api.getTriggerProps()} className="bench-trigger">
          <span>{api.valueAsString || "Select " + row.id}</span>
          <span {...api.getIndicatorProps()}>v</span>
        </button>
      </div>
      <select {...api.getHiddenSelectProps()}>
        {smallSelectItems.map((item) => (
          <option key={item.id} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {api.open && (
        <ZagPortal>
          <div {...api.getPositionerProps()}>
            <ul {...api.getContentProps()} className="bench-popup">
              {smallSelectItems.map((item) => (
                <li {...api.getItemProps({ item })} className="bench-item" key={item.id}>
                  <span {...api.getItemTextProps({ item })}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </ZagPortal>
      )}
    </div>
  );
}

function MountList({ rows, children }) {
  return <div className="mount-list">{rows.map((row) => children(row))}</div>;
}

function PaintMarker({ name }) {
  return (
    <span className="paint-marker" data-benchmark-marker={name} elementtiming={name}>
      visible
    </span>
  );
}

function createRows(count, labelPrefix) {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    return {
      id,
      label: labelPrefix + " " + id,
      value: labelPrefix.toLowerCase().replace(/\s+/g, "-") + "-" + id,
    };
  });
}

function prepareOpenSample({ target = "[data-benchmark-trigger]" } = {}) {
  eventTimingEntries.length = 0;
  const trigger = document.querySelector(target);
  if (!trigger) {
    throw new Error("Missing benchmark trigger: " + target);
  }

  trigger.focus();
  openStart = performance.now();
}

async function finishOpenSample({ markerName } = {}) {
  const marker = await waitForVisibleMarker(markerName);
  await nextFrame();
  forceLayout(marker);
  await nextFrame();

  const visibleMs = performance.now() - openStart;
  const eventDurationMs = readLatestInputEventDuration();

  return {
    eventDurationMs,
    visibleMs,
  };
}

async function openParentMenuForSetup() {
  const rootTrigger = document.querySelector("[data-benchmark-trigger]");
  if (!rootTrigger) {
    throw new Error("Missing benchmark root trigger");
  }

  activateElement(rootTrigger);
  await waitForVisibleMarker("menu-open");
  await nextFrame();
}

async function runSubmenuOpenSample() {
  await openParentMenuForSetup();
  const submenuTrigger = document.querySelector("[data-benchmark-submenu-trigger]");
  if (!submenuTrigger) {
    throw new Error("Missing benchmark submenu trigger");
  }

  eventTimingEntries.length = 0;
  openStart = performance.now();
  activateElement(submenuTrigger);
  const marker = await waitForVisibleMarker("menu-submenu-open");
  await nextFrame();
  forceLayout(marker);
  await nextFrame();

  return {
    eventDurationMs: readLatestInputEventDuration(),
    visibleMs: performance.now() - openStart,
  };
}

async function runMountSamples({ groupCount, iterationsPerGroup }) {
  const groupAverages = [];
  const samples = [];

  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    const groupSamples = [];

    for (let iteration = 0; iteration < iterationsPerGroup; iteration += 1) {
      flushSync(() => {
        measureReactRoot.render(null);
      });

      forceLayout(measureRoot);

      const start = performance.now();
      flushSync(() => {
        measureReactRoot.render(renderMountFixture());
      });
      forceLayout(measureRoot);
      const duration = performance.now() - start;

      groupSamples.push(duration);
      samples.push(duration);
    }

    groupAverages.push(average(groupSamples));
  }

  flushSync(() => {
    measureReactRoot.render(null);
  });

  return {
    groupAverages,
    samples,
  };
}

async function runHoverSample() {
  prepareOpenSample();
  document.querySelector("[data-benchmark-trigger]").click();
  await waitForVisibleMarker();
  await nextFrame();

  const items = Array.from(document.querySelectorAll("[data-benchmark-item]"));
  if (items.length === 0) {
    throw new Error("Missing benchmark items");
  }

  const start = performance.now();
  let dispatchDurationMs = 0;
  let forcedLayoutDurationMs = 0;

  for (const item of items) {
    const dispatchStart = performance.now();
    item.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 8,
        clientY: 8,
        pointerType: "mouse",
      }),
    );
    dispatchDurationMs += performance.now() - dispatchStart;

    const forcedLayoutStart = performance.now();
    forceLayout(item);
    forcedLayoutDurationMs += performance.now() - forcedLayoutStart;
  }

  await nextFrame();
  return {
    dispatchDurationMs,
    durationMs: performance.now() - start,
    forcedLayoutDurationMs,
  };
}

async function runSubmenuHoverSample() {
  await openParentMenuForSetup();
  await openSubmenuForSetup();
  await nextFrame();

  const items = Array.from(document.querySelectorAll("[data-benchmark-item]"));
  if (items.length === 0) {
    throw new Error("Missing benchmark submenu items");
  }

  const start = performance.now();
  let dispatchDurationMs = 0;
  let forcedLayoutDurationMs = 0;

  for (const item of items) {
    const dispatchStart = performance.now();
    item.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 8,
        clientY: 8,
        pointerType: "mouse",
      }),
    );
    dispatchDurationMs += performance.now() - dispatchStart;

    const forcedLayoutStart = performance.now();
    forceLayout(item);
    forcedLayoutDurationMs += performance.now() - forcedLayoutStart;
  }

  await nextFrame();
  return {
    dispatchDurationMs,
    durationMs: performance.now() - start,
    forcedLayoutDurationMs,
  };
}

async function runNavigationSwitchSample() {
  const primaryTrigger = document.querySelector('[data-benchmark-nav-trigger="primary"]');
  const secondaryTrigger = document.querySelector('[data-benchmark-nav-trigger="secondary"]');
  if (!primaryTrigger || !secondaryTrigger) {
    throw new Error("Missing benchmark navigation triggers");
  }

  activateElement(primaryTrigger);
  await waitForVisibleMarker("navigation-menu-primary");
  await nextFrame();

  const start = performance.now();
  activateElement(secondaryTrigger);
  const marker = await waitForVisibleMarker("navigation-menu-secondary");
  await nextFrame();
  forceLayout(marker);
  await nextFrame();

  return { durationMs: performance.now() - start };
}

async function runTabsActivationSample() {
  const targetTrigger = document.querySelector('[data-benchmark-tab-trigger="target"]');
  if (!targetTrigger) {
    throw new Error("Missing benchmark tab target trigger");
  }

  targetTrigger.focus();
  await nextFrame();

  const start = performance.now();
  activateElement(targetTrigger);
  const marker = await waitForVisibleMarker("tabs-target-panel");
  await nextFrame();
  forceLayout(marker);
  await nextFrame();

  return { durationMs: performance.now() - start };
}

async function runAccordionToggleSample() {
  const targetTrigger = document.querySelector('[data-benchmark-accordion-trigger="target"]');
  if (!targetTrigger) {
    throw new Error("Missing benchmark accordion target trigger");
  }

  targetTrigger.focus();
  await nextFrame();

  const start = performance.now();
  activateElement(targetTrigger);
  const marker = await waitForVisibleMarker("accordion-target-panel");
  await nextFrame();
  forceLayout(marker);
  await nextFrame();

  return { durationMs: performance.now() - start };
}

async function runRadioSweepSample() {
  const items = Array.from(document.querySelectorAll("[data-benchmark-radio-item]"));
  if (items.length === 0) {
    throw new Error("Missing benchmark radio items");
  }

  const root = items[0].closest("[role='radiogroup']") ?? document.body;
  const start = performance.now();

  for (const item of items) {
    activateElement(item);
    forceLayout(root);
    assertRadioItemChecked(item);
  }

  await nextFrame();
  return { durationMs: performance.now() - start };
}

function assertRadioItemChecked(item) {
  const input = item.querySelector("input[type='radio']");
  if (input?.checked) return;
  if (item.getAttribute("aria-checked") === "true") return;
  if (item.getAttribute("data-state") === "checked") return;
  if (item.hasAttribute("data-checked")) return;

  throw new Error("Benchmark radio item did not become checked");
}

async function openSubmenuForSetup() {
  const submenuTrigger = document.querySelector("[data-benchmark-submenu-trigger]");
  if (!submenuTrigger) {
    throw new Error("Missing benchmark submenu trigger");
  }

  activateElement(submenuTrigger);
  for (let index = 0; index < 5; index += 1) {
    const marker = findVisibleMarker("menu-submenu-open");
    if (marker) return marker;
    await nextFrame();
  }

  submenuTrigger.focus();
  submenuTrigger.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowRight",
    }),
  );
  return waitForVisibleMarker("menu-submenu-open");
}

async function runFilterSample() {
  const input = document.querySelector("[data-benchmark-input]");
  if (!input) {
    throw new Error("Missing benchmark input");
  }

  const start = performance.now();
  input.value = FILTER_QUERY;
  input.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      data: FILTER_QUERY,
      inputType: "insertText",
    }),
  );
  await nextFrame();

  const popup = document.querySelector("[data-benchmark-popup]");
  if (!popup) {
    throw new Error("Missing benchmark popup");
  }
  forceLayout(popup);
  await nextFrame();

  return { durationMs: performance.now() - start };
}

function renderMountFixture() {
  if (scenario === "tooltip-trigger-mount") {
    if (library === "starwind") return <StarwindTooltipMountList />;
    if (library === "base-ui") return <BaseTooltipMountList />;
    return <ZagTooltipMountList />;
  }

  if (scenario === "dialog-trigger-mount") {
    if (library === "starwind") return <StarwindDialogMountList />;
    if (library === "base-ui") return <BaseDialogMountList />;
    return <ZagDialogMountList />;
  }

  if (scenario === "popover-trigger-mount") {
    if (library === "starwind") return <StarwindPopoverMountList />;
    if (library === "base-ui") return <BasePopoverMountList />;
    return <ZagPopoverMountList />;
  }

  if (scenario === "preview-card-trigger-mount") {
    if (library === "starwind") return <StarwindPreviewCardMountList />;
    if (library === "base-ui") return <BasePreviewCardMountList />;
    return <ZagHoverCardMountList />;
  }

  if (scenario === "select-trigger-mount") {
    if (library === "starwind") return <StarwindSelectMountList />;
    if (library === "base-ui") return <BaseSelectMountList />;
    return <ZagSelectMountList />;
  }

  if (scenario === "combobox-trigger-mount") {
    if (library === "starwind") return <StarwindComboboxMountList />;
    if (library === "base-ui") return <BaseComboboxMountList />;
    return <ZagComboboxMountList />;
  }

  if (scenario === "tabs-high-count-mount") {
    if (library === "starwind") return <StarwindTabsHighCount items={collectionItems} />;
    if (library === "base-ui") return <BaseTabsHighCount items={collectionItems} />;
    return <ZagTabsHighCount items={collectionItems} />;
  }

  if (scenario === "accordion-high-count-mount") {
    if (library === "starwind") return <StarwindAccordionHighCount items={collectionItems} />;
    if (library === "base-ui") return <BaseAccordionHighCount items={collectionItems} />;
    return <ZagAccordionHighCount items={collectionItems} />;
  }

  if (scenario === "radio-group-high-count-mount") {
    if (library === "starwind") return <StarwindRadioGroupHighCount items={collectionItems} />;
    if (library === "base-ui") return <BaseRadioGroupHighCount items={collectionItems} />;
    return <ZagRadioGroupHighCount items={collectionItems} />;
  }

  throw new Error("Unsupported mount scenario: " + scenario);
}

function readLatestInputEventDuration() {
  const entry = [...eventTimingEntries]
    .reverse()
    .find((item) => item.name === "keydown" || item.name === "click");

  return entry?.duration ?? null;
}

async function waitForVisibleMarker(markerName) {
  const deadline = performance.now() + 10000;

  while (performance.now() < deadline) {
    const marker = findVisibleMarker(markerName);

    if (marker) {
      return marker;
    }

    await nextFrame();
  }

  throw new Error(
    markerName
      ? "Benchmark marker did not become visible: " + markerName
      : "Benchmark marker did not become visible",
  );
}

function findVisibleMarker(markerName) {
  const selector = markerName
    ? '[data-benchmark-marker="' + markerName + '"]'
    : "[data-benchmark-marker]";
  return Array.from(document.querySelectorAll(selector)).find((marker) => isVisible(marker));
}

function activateElement(element) {
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      clientX: 8,
      clientY: 8,
      pointerType: "mouse",
    }),
  );
  element.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: 8,
      clientY: 8,
    }),
  );
  element.click();
}

function isVisible(element) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function forceLayout(element) {
  element.getBoundingClientRect();
  document.body.offsetHeight;
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}
`;
}

function fixtureStyles() {
  return `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: #111827;
  background: #f8fafc;
  font-family: Arial, sans-serif;
}

button {
  font: inherit;
}

.bench-shell {
  min-height: 100vh;
  padding: 24px;
}

.outside-grid {
  display: grid;
  grid-template-columns: repeat(100, 1px);
  gap: 1px;
  margin-bottom: 16px;
}

.outside-node {
  display: block;
  width: 1px;
  height: 1px;
}

.bench-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  min-width: 120px;
  border: 1px solid #111827;
  border-radius: 4px;
  padding: 6px 10px;
  color: #111827;
  background: #ffffff;
}

.bench-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.12);
}

.bench-popup {
  position: fixed;
  top: 80px;
  left: 24px;
  z-index: 10;
  min-width: 260px;
  max-width: 360px;
  border: 1px solid #111827;
  border-radius: 4px;
  padding: 8px;
  color: #111827;
  background: #ffffff;
}

dialog.bench-popup {
  margin: 0;
}

.bench-list-popup {
  width: 320px;
  max-width: 320px;
  max-height: none;
  overflow: visible;
}

.bench-nav-list {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bench-nav-popup {
  width: 720px;
  max-width: 720px;
}

.bench-nav-content {
  width: 700px;
}

.bench-nav-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bench-nav-link {
  min-height: 24px;
  padding: 2px 6px;
  border: 1px solid #e5e7eb;
}

.bench-collection-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  max-width: 960px;
}

.bench-collection-item {
  max-width: 960px;
}

.bench-collection-item h3 {
  margin: 0;
}

.bench-collection-panel {
  min-height: 24px;
  max-width: 960px;
  padding: 2px 8px;
}

.bench-item {
  display: flex;
  align-items: center;
  min-height: 24px;
  padding: 2px 8px;
}

.bench-radio-item {
  display: flex;
  align-items: center;
  min-height: 24px;
  padding: 2px 8px;
}

.bench-item[data-highlighted],
.bench-item:hover {
  background: #e5e7eb;
}

.paint-marker {
  display: block;
  width: 48px;
  height: 20px;
  margin: 4px 0;
  overflow: hidden;
}

.mount-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
}
`;
}

async function startStaticServer(root) {
  const server = createServer((request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://localhost");
      const pathname = decodeURIComponent(requestUrl.pathname);
      const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
      let filePath = path.resolve(root, relativePath);

      if (!filePath.startsWith(path.resolve(root))) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      if (!existsSync(filePath)) {
        filePath = path.join(root, "index.html");
      }

      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      response.writeHead(200, { "Content-Type": getContentType(filePath) });
      createReadStream(filePath).pipe(response);
    } catch (error) {
      response.writeHead(500);
      response.end(String(error));
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function getContentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function average(values) {
  if (!values?.length) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatMs(value) {
  if (value == null) return "";
  return `${value.toFixed(1)} ms`;
}

function formatSampleList(values) {
  if (!values?.length) return "";
  return values.map((value) => value.toFixed(1)).join(", ");
}

function slash(value) {
  return value.replaceAll("\\", "/");
}

export {
  FOCUSED_REPORT_DIR,
  REPORT_PATH,
  buildRuntimePerformanceRunConfig,
  formatRuntimePerformanceList,
  formatRuntimePerformanceReport,
  libraryRows,
  parseRuntimePerformanceArgs,
  scenarioRows,
  selectLibraryRows,
  selectScenarioRows,
};
