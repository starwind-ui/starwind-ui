import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { summarizeInitialBundleOutput } from "./package-size-bundle-output.mjs";
import {
  PRODUCT_COMPARISON_FIXTURE_REVISION,
  buildMeasurementEntries,
  buildProductComparisonPlan,
  buildSnapshotPath,
  getProviderDefinition,
  parseProductSizeCommand,
  validateComparatorSnapshot,
  validateMeasurementEnvironment,
} from "./product-package-size-comparison.mjs";
import {
  formatProductAttributionReport,
  formatProductSizeReport,
} from "./product-package-size-report.mjs";
import { buildProductOverlapAttribution } from "./product-package-size-attribution.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const requireFromRunner = createRequire(import.meta.url);
const esbuild = requireFromRunner(resolveEsbuildPath());
const prettier = requireFromRunner("prettier");
const EVIDENCE_DIRECTORY = path.join(
  REPO_ROOT,
  ".scratch/portable-runtime-package-size-comparison/evidence",
);
const STARWIND_EVIDENCE_PATH = path.join(EVIDENCE_DIRECTORY, "starwind.json");
const SITE_EVIDENCE_PATH = path.join(EVIDENCE_DIRECTORY, "site.json");
const REPORT_PATH = path.join(
  REPO_ROOT,
  "docs/portable-runtime/product-package-size-comparison.md",
);
const ATTRIBUTION_REPORT_PATH = path.join(
  REPO_ROOT,
  "docs/portable-runtime/diagnostics/product-package-size-attribution.md",
);
const COMPARATOR_VERSIONS = Object.freeze({
  "ark-react": "5.39.1",
  "ark-vue": "5.39.1",
  "base-react": "1.8.0",
  "reka-vue": "2.10.4",
});

const peerExternals = [
  "@types/react",
  "react",
  "react-dom",
  "react-dom/*",
  "react/*",
  "vue",
  "vue/*",
];

export async function runProductPackageSizeCommand(
  arguments_ = process.argv.slice(2),
  dependencies = {},
) {
  const command = parseProductSizeCommand(arguments_);
  if (command.command === "refresh-comparator") {
    return refreshComparator(command.comparatorId, dependencies);
  }
  if (command.command === "starwind") return refreshStarwind(dependencies);
  if (command.command === "site") return refreshSite(dependencies);
  return writeProductReport();
}

export async function refreshComparator(comparatorId, dependencies = {}) {
  const installRoot = mkdtempSync(path.join(os.tmpdir(), `starwind-size-${comparatorId}-`));
  try {
    const provider = getProviderDefinition(comparatorId);
    const version = COMPARATOR_VERSIONS[comparatorId];
    const npmInstall = dependencies.npmInstall ?? installComparator;
    npmInstall(installRoot, `${provider.packageName}@${version}`);
    const packageManifest = readInstalledManifest(installRoot, provider.packageName);
    const exportNames =
      comparatorId === "reka-vue" ? await readModuleExports(installRoot, "reka-ui") : [];
    const measurements = await measureProvider(comparatorId, {
      exportNames,
      resolveDir: installRoot,
      build: dependencies.build,
    });
    const snapshot = validateComparatorSnapshot({
      schema: "starwind.product-package-size-comparator",
      schemaVersion: 2,
      capturedAt: new Date().toISOString(),
      catalog: measurements.catalog,
      comparatorId,
      components: measurements.components,
      environment: { esbuild: esbuild.version, node: process.versions.node },
      fixtureRevision: PRODUCT_COMPARISON_FIXTURE_REVISION,
      measurementEntries: buildMeasurementEntries(comparatorId, exportNames),
      overlaps: measurements.overlaps,
      package: {
        integrity: packageManifest._integrity ?? null,
        name: packageManifest.name,
        version: packageManifest.version,
      },
    });
    const outputPath = buildSnapshotPath(comparatorId);
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeJson(outputPath, snapshot);
    return snapshot;
  } finally {
    if (!dependencies.keepTemp) rmSync(installRoot, { force: true, recursive: true });
  }
}

export async function refreshStarwind(dependencies = {}) {
  ensureBuiltStarwindPackages();
  const react = await measureProvider("starwind-react", {
    build: dependencies.build,
    captureAttribution: true,
  });
  const vue = await measureProvider("starwind-vue", {
    build: dependencies.build,
    captureAttribution: true,
  });
  const evidence = {
    schema: "starwind.product-package-size-starwind",
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    environment: { esbuild: esbuild.version, node: process.versions.node },
    fixtureRevision: PRODUCT_COMPARISON_FIXTURE_REVISION,
    react: {
      ...react,
      package: readRepoManifest("packages/react/package.json"),
    },
    vue: {
      ...vue,
      package: readRepoManifest("packages/vue/package.json"),
    },
  };
  mkdirSync(EVIDENCE_DIRECTORY, { recursive: true });
  writeJson(STARWIND_EVIDENCE_PATH, evidence);
  return evidence;
}

export async function measureProvider(
  providerId,
  { build = esbuild.build, captureAttribution = false, exportNames = [], resolveDir } = {},
) {
  const plan = buildProductComparisonPlan();
  const provider = getProviderDefinition(providerId);
  const frameworkPlan = plan[provider.framework];
  const resolvedDirectory = resolveDir ?? REPO_ROOT;
  const plugins = providerId.startsWith("starwind-") ? localStarwindPlugins(providerId) : [];
  const components = {};

  for (const component of frameworkPlan.components) {
    const descriptors = component.entries[providerId];
    if (!descriptors) continue;
    components[component.component] = await measureEntry(
      buildEntry(descriptors, exportNames),
      `${providerId}-${component.component}`,
      { build, plugins, resolveDir: resolvedDirectory },
    );
  }

  const overlaps = {};
  let attribution;
  for (const overlap of frameworkPlan.overlaps.filter(({ providers }) =>
    providers.includes(providerId),
  )) {
    const descriptors = overlap.components.flatMap(
      (componentName) =>
        frameworkPlan.components.find(({ component }) => component === componentName).entries[
          providerId
        ],
    );
    const captureOverlapAttribution =
      captureAttribution && overlap.id === `${provider.framework}-exact-three-way`;
    const measurement = await measureEntry(
      buildEntry(descriptors, exportNames),
      `${providerId}-${overlap.id}`,
      {
        build,
        captureMetafile: captureOverlapAttribution,
        plugins,
        resolveDir: resolvedDirectory,
      },
    );
    const { metafile, ...size } = measurement;
    overlaps[overlap.id] = size;
    if (metafile) {
      attribution = buildProductOverlapAttribution({
        combinedGzipBytes: size.gzipBytes,
        componentRows: overlap.components.map((component) => components[component]),
        framework: provider.framework,
        metafile,
        repoRoot: REPO_ROOT,
        topLimit: 20,
      });
    }
  }

  const catalog = await measureEntry(
    buildEntry([provider.packageName], exportNames),
    `${providerId}-catalog`,
    { build, plugins, resolveDir: resolvedDirectory },
  );
  return { ...(attribution ? { attribution } : {}), catalog, components, overlaps };
}

export async function measureEntry(
  entry,
  label,
  {
    build = esbuild.build,
    captureMetafile = false,
    external = peerExternals,
    loader = "js",
    plugins = [],
    resolveDir = REPO_ROOT,
  } = {},
) {
  const outputDirectory = path.join(os.tmpdir(), "starwind-product-size-output", slug(label));
  const entryFilePath = path.join(outputDirectory, "entry.js");
  const result = await build({
    bundle: true,
    chunkNames: "chunks/[name]-[hash]",
    entryNames: "entry",
    external,
    format: "esm",
    logLevel: "silent",
    minify: true,
    outdir: outputDirectory,
    platform: "browser",
    plugins,
    splitting: true,
    stdin: {
      contents: entry,
      loader,
      resolveDir,
      sourcefile: `${slug(label)}.js`,
    },
    target: "es2020",
    treeShaking: true,
    write: false,
    metafile: captureMetafile,
  });
  const initial = summarizeInitialBundleOutput({
    entryFilePath,
    metafile: result.metafile,
    outputFiles: result.outputFiles,
  });
  return {
    brotliBytes: initial.brotliBytes,
    gzipBytes: initial.gzipBytes,
    minifiedBytes: initial.minifiedBytes,
    ...(initial.metafile ? { metafile: initial.metafile } : {}),
  };
}

export function buildEntry(descriptors, exportNames = []) {
  const normalized = [
    ...new Map(descriptors.map((descriptor) => [JSON.stringify(descriptor), descriptor])).values(),
  ];
  const imports = [];
  const references = [];
  normalized.forEach((descriptor, index) => {
    if (typeof descriptor === "string") {
      imports.push(`import * as surface${index} from ${JSON.stringify(descriptor)};`);
      references.push(`surface${index}`);
      return;
    }
    const names = exportNames.filter((name) => matchesExportPrefix(name, descriptor.exportPrefix));
    if (names.length === 0) {
      throw new Error(`No ${descriptor.package} exports matched ${descriptor.exportPrefix}.`);
    }
    imports.push(`import { ${names.join(", ")} } from ${JSON.stringify(descriptor.package)};`);
    references.push(...names);
  });
  return `${imports.join("\n")}\nconsole.log(${references.join(", ")});`;
}

export async function writeProductReport() {
  const starwind = readJson(STARWIND_EVIDENCE_PATH);
  const site = readJson(SITE_EVIDENCE_PATH);
  validateMeasurementEnvironment(site.environment, starwind.environment, "Site evidence");
  const comparatorSnapshots = Object.fromEntries(
    ["ark-react", "base-react", "ark-vue", "reka-vue"].map((id) => [
      id,
      validateComparatorSnapshot(readJson(buildSnapshotPath(id)), {
        expectedEnvironment: starwind.environment,
      }),
    ]),
  );
  const report = formatProductSizeReport({
    generatedAt: new Date().toISOString(),
    react: mergeFrameworkEvidence(
      "react",
      { "starwind-react": starwind.react },
      comparatorSnapshots,
    ),
    site,
    vue: mergeFrameworkEvidence("vue", { "starwind-vue": starwind.vue }, comparatorSnapshots),
  });
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const formattedReport = await prettier.format(report, {
    parser: "markdown",
    printWidth: 100,
    proseWrap: "preserve",
  });
  writeFileSync(REPORT_PATH, formattedReport);
  const attributionReport = formatProductAttributionReport({
    generatedAt: new Date().toISOString(),
    react: starwind.react.attribution,
    vue: starwind.vue.attribution,
  });
  writeFileSync(
    ATTRIBUTION_REPORT_PATH,
    await prettier.format(attributionReport, {
      parser: "markdown",
      printWidth: 100,
      proseWrap: "preserve",
    }),
  );
  return formattedReport;
}

export async function refreshSite(dependencies = {}) {
  ensureBuiltStarwindPackages();
  const plan = buildProductComparisonPlan();
  const astro = {};
  const react = {};
  for (const scenario of plan.site.scenarios) {
    astro[scenario.id] =
      scenario.id === "empty"
        ? { brotliBytes: 0, gzipBytes: 0, minifiedBytes: 0 }
        : await measureEntry(buildAstroRuntimeSiteEntry(scenario), `site-astro-${scenario.id}`, {
            build: dependencies.build,
            external: [],
            plugins: localStarwindPlugins("starwind-react").slice(0, 1),
          });
    react[scenario.id] = await measureEntry(
      buildReactSiteEntry(scenario),
      `site-react-${scenario.id}`,
      {
        build: dependencies.build,
        external: [],
        loader: "jsx",
        plugins: localStarwindPlugins("starwind-react"),
        resolveDir: path.join(REPO_ROOT, "apps/react-demo"),
      },
    );
  }
  const evidence = {
    schema: "starwind.product-package-size-site",
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    environment: { esbuild: esbuild.version, node: process.versions.node },
    fixtureRevision: PRODUCT_COMPARISON_FIXTURE_REVISION,
    astro,
    react,
  };
  writeJson(SITE_EVIDENCE_PATH, evidence);
  return evidence;
}

function mergeFrameworkEvidence(framework, starwind, snapshots) {
  const plan = buildProductComparisonPlan()[framework];
  const evidenceByProvider = { ...snapshots, ...starwind };
  return {
    catalog: Object.fromEntries(
      plan.providers
        .map(({ id }) => [id, evidenceByProvider[id]?.catalog])
        .filter(([, value]) => value),
    ),
    components: Object.fromEntries(
      plan.components.map(({ component }) => [
        component,
        Object.fromEntries(
          plan.providers
            .map(({ id }) => [id, evidenceByProvider[id]?.components?.[component]])
            .filter(([, value]) => value),
        ),
      ]),
    ),
    overlaps: Object.fromEntries(
      plan.overlaps.map(({ id, providers }) => [
        id,
        Object.fromEntries(
          providers
            .map((providerId) => [providerId, evidenceByProvider[providerId]?.overlaps?.[id]])
            .filter(([, value]) => value),
        ),
      ]),
    ),
    overlapMetadata: Object.fromEntries(
      plan.overlaps.map(({ components, id }) => [id, { componentCount: components.length }]),
    ),
    overlapComponentNames: Object.fromEntries(
      plan.overlaps.map(({ components, id }) => [id, components]),
    ),
    providers: plan.providers.map((provider) => ({
      ...provider,
      version: evidenceByProvider[provider.id]?.package?.version ?? "local",
    })),
  };
}

function installComparator(installRoot, packageSpecifier) {
  writeJson(path.join(installRoot, "package.json"), { private: true });
  execFileSync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", packageSpecifier],
    { cwd: installRoot, stdio: "inherit" },
  );
}

export function buildAstroRuntimeSiteEntry(scenario) {
  if (scenario.id === "empty") return 'console.log("empty Astro page");';
  if (scenario.id === "select") {
    return controllerEntry(["select"]);
  }
  if (scenario.id === "form") {
    return controllerEntry(["select", "combobox", "checkbox", "field"]);
  }
  if (scenario.id === "overlays") {
    return controllerEntry(["dialog", "menu", "popover", "tooltip"]);
  }
  return controllerEntry(scenario.components);
}

export function buildReactSiteEntry(scenario) {
  const shell = (imports, body) => `
import React from "react";
import { createRoot } from "react-dom/client";
${imports}
const mount = document.createElement("div");
document.body.append(mount);
createRoot(mount).render(${body});`;
  if (scenario.id === "empty") return shell("", "<main>Empty page</main>");
  if (scenario.id === "select") {
    return shell(
      `import { SelectItem, SelectItemText, SelectPopup, SelectPortal, SelectPositioner, SelectRoot, SelectTrigger, SelectValue } from "@starwind-ui/react/select";`,
      `<SelectRoot><SelectTrigger><SelectValue /></SelectTrigger><SelectPortal><SelectPositioner><SelectPopup><SelectItem value="one"><SelectItemText>One</SelectItemText></SelectItem></SelectPopup></SelectPositioner></SelectPortal></SelectRoot>`,
    );
  }
  if (scenario.id === "form") {
    return shell(
      `import { SelectItem, SelectItemText, SelectPopup, SelectPortal, SelectPositioner, SelectRoot, SelectTrigger, SelectValue } from "@starwind-ui/react/select";
import { ComboboxInput, ComboboxItem, ComboboxItemText, ComboboxPopup, ComboboxPortal, ComboboxPositioner, ComboboxRoot } from "@starwind-ui/react/combobox";
import { CheckboxIndicator, CheckboxRoot } from "@starwind-ui/react/checkbox";
import { FieldControl, FieldLabel, FieldRoot } from "@starwind-ui/react/field";`,
      `<main><FieldRoot><FieldLabel>Name</FieldLabel><FieldControl /></FieldRoot><CheckboxRoot><CheckboxIndicator>✓</CheckboxIndicator></CheckboxRoot><SelectRoot><SelectTrigger><SelectValue /></SelectTrigger><SelectPortal><SelectPositioner><SelectPopup><SelectItem value="one"><SelectItemText>One</SelectItemText></SelectItem></SelectPopup></SelectPositioner></SelectPortal></SelectRoot><ComboboxRoot><ComboboxInput /><ComboboxPortal><ComboboxPositioner><ComboboxPopup><ComboboxItem value="one"><ComboboxItemText>One</ComboboxItemText></ComboboxItem></ComboboxPopup></ComboboxPositioner></ComboboxPortal></ComboboxRoot></main>`,
    );
  }
  if (scenario.id === "overlays") {
    return shell(
      `import { DialogPopup, DialogRoot, DialogTrigger } from "@starwind-ui/react/dialog";
import { MenuItem, MenuPopup, MenuPortal, MenuPositioner, MenuRoot, MenuTrigger } from "@starwind-ui/react/menu";
import { PopoverPopup, PopoverPortal, PopoverPositioner, PopoverRoot, PopoverTrigger } from "@starwind-ui/react/popover";
import { TooltipPopup, TooltipPortal, TooltipPositioner, TooltipRoot, TooltipTrigger } from "@starwind-ui/react/tooltip";`,
      `<main><DialogRoot><DialogTrigger>Dialog</DialogTrigger><DialogPopup>Dialog content</DialogPopup></DialogRoot><MenuRoot><MenuTrigger>Menu</MenuTrigger><MenuPortal><MenuPositioner><MenuPopup><MenuItem>Item</MenuItem></MenuPopup></MenuPositioner></MenuPortal></MenuRoot><PopoverRoot><PopoverTrigger>Popover</PopoverTrigger><PopoverPortal><PopoverPositioner><PopoverPopup>Popover content</PopoverPopup></PopoverPositioner></PopoverPortal></PopoverRoot><TooltipRoot><TooltipTrigger>Tooltip</TooltipTrigger><TooltipPortal><TooltipPositioner><TooltipPopup>Tooltip content</TooltipPopup></TooltipPositioner></TooltipPortal></TooltipRoot></main>`,
    );
  }
  const catalogImports = scenario.components
    .map(
      (component, index) => `import * as surface${index} from "@starwind-ui/react/${component}";`,
    )
    .join("\n");
  const references = scenario.components.map((_, index) => `surface${index}`).join(",");
  return shell(
    catalogImports,
    `<main data-surfaces={Object.keys({${references}}).length}>Full overlap</main>`,
  );
}

function controllerEntry(components) {
  const imports = components
    .map(
      (component, index) =>
        `import { ${runtimeFactory(component)} as controller${index} } from "@starwind-ui/runtime/${component}";`,
    )
    .join("\n");
  return `${imports}\nconsole.log(${components.map((_, index) => `controller${index}`).join(",")});`;
}

function runtimeFactory(component) {
  if (component === "toast") return "createToastManager";
  return `create${component
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("")}`;
}

function localStarwindPlugins(providerId) {
  const framework = providerId === "starwind-react" ? "react" : "vue";
  return [
    aliasPackage("@starwind-ui/runtime", path.join(REPO_ROOT, "packages/runtime/dist"), false),
    aliasPackage(
      `@starwind-ui/${framework}`,
      path.join(REPO_ROOT, `packages/${framework}/dist`),
      true,
    ),
  ];
}

function aliasPackage(packageName, distributionRoot, directorySubpaths) {
  return {
    name: `alias-${packageName}`,
    setup(build) {
      build.onResolve({ filter: new RegExp(`^${escapeRegex(packageName)}$`) }, () => ({
        path: path.join(distributionRoot, "index.js"),
      }));
      build.onResolve(
        { filter: new RegExp(`^${escapeRegex(packageName)}/(.+)$`) },
        (arguments_) => {
          const subpath = arguments_.path.slice(packageName.length + 1);
          return {
            path: directorySubpaths
              ? path.join(distributionRoot, subpath, "index.js")
              : path.join(distributionRoot, `${subpath}.js`),
          };
        },
      );
    },
  };
}

async function readModuleExports(installRoot, packageName) {
  const requireFromInstall = createRequire(path.join(installRoot, "package.json"));
  const entryPath = requireFromInstall.resolve(packageName);
  return Object.keys(await import(`${pathToFileURL(entryPath).href}?size=${Date.now()}`)).sort();
}

function readInstalledManifest(installRoot, packageName) {
  const packageRoot = path.join(installRoot, "node_modules", ...packageName.split("/"));
  const manifest = readJson(path.join(packageRoot, "package.json"));
  const lock = readJson(path.join(installRoot, "package-lock.json"));
  const lockPackage = lock.packages?.[`node_modules/${packageName}`];
  return { ...manifest, _integrity: lockPackage?.integrity ?? null };
}

function readRepoManifest(relativePath) {
  const manifest = readJson(path.join(REPO_ROOT, relativePath));
  return { name: manifest.name, version: manifest.version };
}

function ensureBuiltStarwindPackages() {
  for (const filePath of [
    "packages/runtime/dist/index.js",
    "packages/react/dist/index.js",
    "packages/vue/dist/index.js",
  ]) {
    if (!existsSync(path.join(REPO_ROOT, filePath))) {
      throw new Error(`Missing built package output: ${filePath}`);
    }
  }
}

function matchesExportPrefix(name, prefix) {
  if (!name.startsWith(prefix)) return false;
  if (prefix === "Toggle" && name.startsWith("ToggleGroup")) return false;
  return true;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveEsbuildPath() {
  try {
    return requireFromRunner.resolve("esbuild");
  } catch {
    const pnpmRoot = path.join(REPO_ROOT, "node_modules/.pnpm");
    const directory = readdirSync(pnpmRoot).find((entry) => entry.startsWith("esbuild@"));
    if (!directory) throw new Error("Could not resolve esbuild from the workspace.");
    return path.join(pnpmRoot, directory, "node_modules/esbuild/lib/main.js");
  }
}

function slug(value) {
  return value
    .replaceAll(/[^a-zA-Z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "")
    .toLowerCase();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runProductPackageSizeCommand().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
