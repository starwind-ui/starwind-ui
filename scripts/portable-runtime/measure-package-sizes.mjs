import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import { evaluatePackageSizeBudgets } from "./package-size-budget-checks.mjs";
import {
  buildRawGzipDiagnostics,
  formatRawGzipDiagnosticsMarkdown,
} from "./package-size-raw-gzip-diagnostics.mjs";
import { summarizeInitialBundleOutput } from "./package-size-bundle-output.mjs";
import {
  buildSourceContributionContext,
  buildSourceContributionAnalyses,
  formatSourceContributionMarkdown,
} from "./source-contribution-report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const TMP_ROOT = path.join(
  process.env.STARWIND_MEASUREMENT_TMP_ROOT ?? os.tmpdir(),
  "starwind-package-size-comparison",
);
const NODE_MODULES_ROOT = path.join(TMP_ROOT, "node_modules");
const REPORT_PATH = path.join(REPO_ROOT, "docs/portable-runtime/package-size-comparison.md");
const DIAGNOSTIC_REPORT_PATH = path.join(
  REPO_ROOT,
  "docs/portable-runtime/diagnostics/package-size-diagnostics.md",
);
const CHECK_ONLY = process.argv.includes("--check");

const requireFromRepo = createRequire(path.join(REPO_ROOT, "package.json"));
const esbuildPath = resolveEsbuildPath();
const esbuild = await import(pathToFileURL(esbuildPath).href);

const zagFrameworkAdapters = ["@zag-js/react", "@zag-js/vue", "@zag-js/solid", "@zag-js/svelte"];
const zagComponentPackages = [
  "@zag-js/accordion",
  "@zag-js/angle-slider",
  "@zag-js/avatar",
  "@zag-js/carousel",
  "@zag-js/cascade-select",
  "@zag-js/checkbox",
  "@zag-js/clipboard",
  "@zag-js/collapsible",
  "@zag-js/color-picker",
  "@zag-js/combobox",
  "@zag-js/date-input",
  "@zag-js/date-picker",
  "@zag-js/dialog",
  "@zag-js/drawer",
  "@zag-js/editable",
  "@zag-js/file-upload",
  "@zag-js/floating-panel",
  "@zag-js/hover-card",
  "@zag-js/image-cropper",
  "@zag-js/listbox",
  "@zag-js/marquee",
  "@zag-js/menu",
  "@zag-js/navigation-menu",
  "@zag-js/number-input",
  "@zag-js/pagination",
  "@zag-js/password-input",
  "@zag-js/pin-input",
  "@zag-js/popover",
  "@zag-js/presence",
  "@zag-js/progress",
  "@zag-js/qr-code",
  "@zag-js/radio-group",
  "@zag-js/rating-group",
  "@zag-js/scroll-area",
  "@zag-js/select",
  "@zag-js/signature-pad",
  "@zag-js/slider",
  "@zag-js/splitter",
  "@zag-js/steps",
  "@zag-js/switch",
  "@zag-js/tabs",
  "@zag-js/tags-input",
  "@zag-js/timer",
  "@zag-js/toast",
  "@zag-js/toggle",
  "@zag-js/toggle-group",
  "@zag-js/tooltip",
  "@zag-js/tour",
  "@zag-js/tree-view",
];
const zagInfrastructurePackages = ["@zag-js/core"];
const zagSampleMachines = [
  "@zag-js/accordion",
  "@zag-js/dialog",
  "@zag-js/menu",
  "@zag-js/select",
  "@zag-js/combobox",
];
const baseUiComponentSamples = ["accordion", "dialog", "menu", "select", "combobox"];
const starwindSupportMappings = [
  { starwind: "accordion", zag: ["@zag-js/accordion"], base: "accordion" },
  {
    starwind: "alert-dialog",
    zag: ["@zag-js/dialog"],
    base: "alert-dialog",
    note: "Zag reuses its dialog machine for alert-dialog behavior.",
  },
  { starwind: "avatar", zag: ["@zag-js/avatar"], base: "avatar" },
  {
    starwind: "button",
    base: "button",
    note: "Base UI has a button primitive; Zag has no button machine.",
  },
  { starwind: "carousel", zag: ["@zag-js/carousel"], note: "No Base UI carousel export." },
  { starwind: "checkbox", zag: ["@zag-js/checkbox"], base: "checkbox" },
  {
    starwind: "checkbox-group",
    zag: ["@zag-js/checkbox"],
    base: "checkbox-group",
    note: "Starwind and Base UI expose a group wrapper; Zag uses the checkbox machine.",
  },
  { starwind: "collapsible", zag: ["@zag-js/collapsible"], base: "collapsible" },
  { starwind: "combobox", zag: ["@zag-js/combobox"], base: "combobox" },
  {
    starwind: "context-menu",
    zag: ["@zag-js/menu"],
    base: "context-menu",
    note: "Zag models context-menu through the menu package.",
  },
  { starwind: "dialog", zag: ["@zag-js/dialog"], base: "dialog" },
  { starwind: "drawer", zag: ["@zag-js/drawer"], base: "drawer" },
  {
    starwind: "dropzone",
    zag: ["@zag-js/file-upload"],
    note: "Maps to Zag file-upload; no Base UI file upload/dropzone export.",
  },
  {
    starwind: "field",
    base: "field",
    note: "Base UI has field primitives; Zag has no field machine.",
  },
  {
    starwind: "input",
    base: "input",
    note: "Base UI has input primitives; Zag has no input machine.",
  },
  {
    starwind: "input-otp",
    zag: ["@zag-js/pin-input"],
    base: "otp-field",
    note: "Equivalent naming differs: Zag pin-input, Base UI otp-field.",
  },
  { starwind: "menu", zag: ["@zag-js/menu"], base: "menu" },
  { starwind: "popover", zag: ["@zag-js/popover"], base: "popover" },
  {
    starwind: "preview-card",
    zag: ["@zag-js/hover-card"],
    base: "preview-card",
    note: "Equivalent naming differs: Zag hover-card.",
  },
  { starwind: "progress", zag: ["@zag-js/progress"], base: "progress" },
  {
    starwind: "radio",
    zag: ["@zag-js/radio-group"],
    base: "radio",
    note: "Zag's radio support is represented through radio-group.",
  },
  { starwind: "radio-group", zag: ["@zag-js/radio-group"], base: "radio-group" },
  { starwind: "scroll-area", zag: ["@zag-js/scroll-area"], base: "scroll-area" },
  { starwind: "select", zag: ["@zag-js/select"], base: "select" },
  { starwind: "slider", zag: ["@zag-js/slider"], base: "slider" },
  { starwind: "switch", zag: ["@zag-js/switch"], base: "switch" },
  { starwind: "tabs", zag: ["@zag-js/tabs"], base: "tabs" },
  { starwind: "toast", zag: ["@zag-js/toast"], base: "toast" },
  { starwind: "toggle", zag: ["@zag-js/toggle"], base: "toggle" },
  { starwind: "toggle-group", zag: ["@zag-js/toggle-group"], base: "toggle-group" },
  { starwind: "tooltip", zag: ["@zag-js/tooltip"], base: "tooltip" },
];
const starwindComponentsWithZagMatches = starwindSupportMappings.filter((row) => row.zag);
const starwindComponentsWithBaseMatches = starwindSupportMappings.filter((row) => row.base);
const starwindComponentsWithBothMatches = starwindSupportMappings.filter(
  (row) => row.zag && row.base,
);

const matchedSupportSets = [
  {
    key: "all-three-overlap",
    label: "All-three overlap",
    mappings: starwindComponentsWithBothMatches,
    note: "Only Starwind components with both a Zag and Base UI equivalent.",
  },
  {
    key: "starwind-zag-overlap",
    label: "Starwind/Zag overlap",
    mappings: starwindComponentsWithZagMatches,
    note: "Only Starwind components with a Zag equivalent.",
  },
  {
    key: "starwind-base-overlap",
    label: "Starwind/Base UI overlap",
    mappings: starwindComponentsWithBaseMatches,
    note: "Only Starwind components with a Base UI equivalent.",
  },
];

const starwindZagOverlapMappings = matchedSupportSets.find(
  (set) => set.key === "starwind-zag-overlap",
).mappings;

export const colorPickerRebaselineEvidence = {
  fixedPointCommit: "8a046cdaaed10184089b242f258c8a2318cf8b5e",
  headlineRows: [
    {
      label: "@starwind-ui/runtime",
      oldCeilingBytes: 114_688,
      postFeatureBaselineGzipBytes: 126_295,
      preFeatureGzipBytes: 113_040,
    },
    {
      label: "@starwind-ui/react (adapter only)",
      oldCeilingBytes: 31_744,
      postFeatureBaselineGzipBytes: 35_194,
      preFeatureGzipBytes: 31_118,
    },
    {
      label: "@starwind-ui/react + runtime",
      oldCeilingBytes: 148_480,
      postFeatureBaselineGzipBytes: 164_250,
      preFeatureGzipBytes: 145_790,
    },
  ],
  overlap: {
    categoryRows: [
      {
        label: "Runtime category",
        postFeatureBaselineMinifiedBytes: 326_682,
        preFeatureMinifiedBytes: 318_380,
      },
      {
        label: "React adapter category",
        postFeatureBaselineMinifiedBytes: 110_100,
        preFeatureMinifiedBytes: 110_100,
      },
      {
        label: "Third-party category",
        postFeatureBaselineMinifiedBytes: 34_207,
        preFeatureMinifiedBytes: 34_207,
      },
      {
        label: "Other category",
        postFeatureBaselineMinifiedBytes: 97,
        preFeatureMinifiedBytes: 97,
      },
    ],
    components: starwindZagOverlapMappings.map((mapping) => mapping.starwind),
    excludedComponent: "color-picker",
    label: "Starwind/Zag overlap",
    oldCeilingBytes: 117_760,
    ownerRows: [
      {
        label: "src/components/dialog/dialog.ts",
        postFeatureBaselineMinifiedBytes: 15_077,
        preFeatureMinifiedBytes: 11_129,
      },
      {
        label: "src/components/field/field-control-bridge.ts",
        postFeatureBaselineMinifiedBytes: 5_229,
        preFeatureMinifiedBytes: 1_449,
      },
      {
        label: "src/internal/events.ts",
        postFeatureBaselineMinifiedBytes: 700,
        preFeatureMinifiedBytes: 126,
      },
      {
        label: "Color Picker source contribution",
        postFeatureBaselineMinifiedBytes: 0,
        preFeatureMinifiedBytes: 0,
      },
    ],
    postFeatureBaselineGzipBytes: 118_786,
    preFeatureGzipBytes: 116_526,
  },
  standaloneComparator: {
    starwindGzipBytes: 12_474,
    zagGzipBytes: 29_519,
  },
};

const externalPackages = [
  "@base-ui/react",
  ...zagFrameworkAdapters,
  ...zagComponentPackages,
  ...zagInfrastructurePackages,
];

const peerExternals = [
  "@date-fns/tz",
  "@types/react",
  "astro",
  "date-fns",
  "react",
  "react-dom",
  "solid-js",
  "svelte",
  "vue",
];

const starwindRuntimeAlias = {
  name: "starwind-runtime-alias",
  setup(build) {
    const runtimeDist = path.join(REPO_ROOT, "packages/runtime/dist");

    build.onResolve({ filter: /^@starwind-ui\/runtime$/ }, () => ({
      path: path.join(runtimeDist, "index.js"),
    }));
    build.onResolve({ filter: /^@starwind-ui\/runtime\/(.+)$/ }, (args) => ({
      path: path.join(runtimeDist, `${args.path.slice("@starwind-ui/runtime/".length)}.js`),
    }));
  },
};

const starwindReactAlias = {
  name: "starwind-react-alias",
  setup(build) {
    const reactDist = path.join(REPO_ROOT, "packages/react/dist");

    build.onResolve({ filter: /^@starwind-ui\/react$/ }, () => ({
      path: path.join(reactDist, "index.js"),
    }));
    build.onResolve({ filter: /^@starwind-ui\/react\/(.+)$/ }, (args) => ({
      path: path.join(reactDist, args.path.slice("@starwind-ui/react/".length), "index.js"),
    }));
  },
};

const bundleRows = [
  {
    group: "Starwind",
    label: "@starwind-ui/runtime",
    entry: 'import * as runtime from "@starwind-ui/runtime"; console.log(runtime);',
    plugins: [starwindRuntimeAlias],
  },
  {
    group: "Standalone Color Picker",
    label: "@starwind-ui/runtime/color-picker",
    entry:
      'import * as colorPicker from "@starwind-ui/runtime/color-picker"; console.log(colorPicker);',
    plugins: [starwindRuntimeAlias],
    note: "Standalone Runtime Color Picker subpath, compared directly with the Zag Color Picker machine.",
  },
  {
    group: "Starwind",
    label: "@starwind-ui/react (adapter only)",
    entry: 'import * as react from "@starwind-ui/react"; console.log(react);',
    external: ["@starwind-ui/runtime", "@starwind-ui/runtime/*"],
    plugins: [starwindReactAlias],
    note: "Runtime externalized to isolate React adapter overhead.",
  },
  {
    group: "Starwind",
    label: "@starwind-ui/react + runtime",
    entry: 'import * as react from "@starwind-ui/react"; console.log(react);',
    plugins: [starwindReactAlias, starwindRuntimeAlias],
    note: "Consumer-style bundle with runtime dependency included and React peers excluded.",
  },
  {
    group: "Base UI",
    label: "@base-ui/react",
    entry: 'import * as base from "@base-ui/react"; console.log(base);',
    note: "Root public exports, used as the all-Base-UI comparison row.",
  },
  {
    group: "Aggregate",
    label: "Zag React adapter + all documented component machines",
    entry: namespaceImports(["@zag-js/react", ...zagComponentPackages], "pkg"),
    versionPackage: "@zag-js/react",
    note: "React adapter plus every package from Zag's documented component list, bundled together to avoid double-counting shared code.",
  },
  ...zagFrameworkAdapters
    .filter((adapter) => adapter !== "@zag-js/react")
    .map((adapter) => ({
      group: "Aggregate",
      label: `${adapter} adapter + all documented component machines`,
      entry: namespaceImports([adapter, ...zagComponentPackages], "pkg"),
      versionPackage: adapter,
      note: "Framework adapter plus every package from Zag's documented component list, bundled together to avoid double-counting shared code.",
    })),
  ...baseUiComponentSamples.map((component) => ({
    group: "Base UI component sample",
    label: `@base-ui/react/${component}`,
    entry: `import * as component from "@base-ui/react/${component}"; console.log(component);`,
    versionPackage: "@base-ui/react",
  })),
  ...zagFrameworkAdapters.map((pkg) => ({
    group: "Zag framework adapter",
    label: pkg,
    entry: `import * as adapter from "${pkg}"; console.log(adapter);`,
  })),
  ...zagInfrastructurePackages.map((pkg) => ({
    group: "Zag infrastructure",
    label: pkg,
    entry: `import * as infrastructure from "${pkg}"; console.log(infrastructure);`,
  })),
  ...zagComponentPackages.map((pkg) => ({
    group: "Zag machine",
    label: pkg,
    entry: `import * as machine from "${pkg}"; console.log(machine);`,
  })),
  ...zagSampleMachines.flatMap((machine) =>
    zagFrameworkAdapters.map((adapter) => ({
      group: "Zag adapter + machine sample",
      label: `${adapter} + ${machine.replace("@zag-js/", "")}`,
      entry: `import * as adapter from "${adapter}"; import * as machine from "${machine}"; console.log(adapter, machine);`,
      versionPackage: adapter,
    })),
  ),
];

const supportRows = [
  ...matchedSupportSets.flatMap((set) => [
    {
      group: "Matched support aggregate",
      label: `${set.label} - Starwind`,
      entry: starwindReactComponentsEntry(set.mappings),
      provider: "starwind",
      comparisonSet: set.key,
      componentCount: set.mappings.length,
      sourceContribution:
        set.key === "all-three-overlap" ? { label: `${set.label} - Starwind` } : undefined,
      versionPackage: "@starwind-ui/react",
      plugins: [starwindReactAlias, starwindRuntimeAlias],
    },
    ...(set.mappings.every((mapping) => mapping.zag)
      ? [
          {
            group: "Matched support aggregate",
            label: `${set.label} - Zag React`,
            entry: zagReactMachinesEntry(set.mappings),
            provider: "zag",
            comparisonSet: set.key,
            componentCount: set.mappings.length,
            versionPackage: "@zag-js/react",
          },
        ]
      : []),
    ...(set.mappings.every((mapping) => mapping.base)
      ? [
          {
            group: "Matched support aggregate",
            label: `${set.label} - Base UI`,
            entry: baseUiComponentsEntry(set.mappings),
            provider: "base",
            comparisonSet: set.key,
            componentCount: set.mappings.length,
            versionPackage: "@base-ui/react",
          },
        ]
      : []),
  ]),
  ...starwindSupportMappings.flatMap((mapping) => [
    {
      group: "Starwind matched component",
      label: `Starwind ${mapping.starwind}`,
      entry: starwindReactComponentsEntry([mapping]),
      provider: "starwind",
      component: mapping.starwind,
      sourceContribution:
        mapping.starwind === "field" ? { label: "Field cold import - Starwind" } : undefined,
      versionPackage: "@starwind-ui/react",
      plugins: [starwindReactAlias, starwindRuntimeAlias],
    },
    ...(mapping.zag
      ? [
          {
            group: "Zag matched component",
            label: `Zag match for ${mapping.starwind}`,
            entry: zagReactMachinesEntry([mapping]),
            provider: "zag",
            component: mapping.starwind,
            versionPackage: "@zag-js/react",
          },
        ]
      : []),
    ...(mapping.base
      ? [
          {
            group: "Base UI matched component",
            label: `Base UI match for ${mapping.starwind}`,
            entry: baseUiComponentsEntry([mapping]),
            provider: "base",
            component: mapping.starwind,
            versionPackage: "@base-ui/react",
          },
        ]
      : []),
  ]),
];

export const committedComparatorBaselines = Object.freeze({
  // `pnpm runtime:size` is the explicit refresh path. Check mode keeps these comparator
  // snapshots stable so release verification measures only current Starwind artifacts.
  bundleResults: Object.freeze([
    Object.freeze({
      gzipBytes: colorPickerRebaselineEvidence.standaloneComparator.zagGzipBytes,
      label: "@zag-js/color-picker",
      minifiedBytes: null,
    }),
  ]),
  supportResults: Object.freeze([
    Object.freeze({
      comparisonSet: "all-three-overlap",
      gzipBytes: 99_840,
      provider: "zag",
    }),
    Object.freeze({
      comparisonSet: "all-three-overlap",
      gzipBytes: 143_155,
      provider: "base",
    }),
    Object.freeze({
      comparisonSet: "starwind-zag-overlap",
      gzipBytes: 112_333,
      provider: "zag",
    }),
    Object.freeze({
      comparisonSet: "starwind-base-overlap",
      gzipBytes: 146_842,
      provider: "base",
    }),
  ]),
});

export function getPackageSizeMeasurementPlan({ checkOnly = false } = {}) {
  if (!checkOnly) {
    return {
      bundleBaselines: [],
      bundleRows,
      installComparators: true,
      supportBaselines: [],
      supportRows,
    };
  }

  return {
    bundleBaselines: committedComparatorBaselines.bundleResults,
    bundleRows: bundleRows.filter(
      ({ group }) => group === "Starwind" || group === "Standalone Color Picker",
    ),
    installComparators: false,
    supportBaselines: committedComparatorBaselines.supportResults,
    supportRows: supportRows.filter(({ provider }) => provider === "starwind"),
  };
}

async function main() {
  const plan = getPackageSizeMeasurementPlan({ checkOnly: CHECK_ONLY });
  if (plan.installComparators) prepareTempInstall();

  const bundleResults = [...plan.bundleBaselines];
  for (const row of plan.bundleRows) {
    bundleResults.push(await measureBundle(row));
  }

  const supportResults = [...plan.supportBaselines];
  for (const row of plan.supportRows) {
    supportResults.push(await measureBundle(row));
  }

  const sourceContributionAnalyses = buildSourceContributionAnalyses({
    repoRoot: REPO_ROOT,
    results: addSourceContributionContexts(supportResults),
    tmpRoot: TMP_ROOT,
  });

  const sourcePayloadResults = [
    await measurePublishedSourcePayload({
      group: "Starwind source payload",
      label: "@starwind-ui/astro",
      packageDir: path.join(REPO_ROOT, "packages/astro"),
      note: "Source-published Astro package; measured published .astro/.ts source payload, not compiled Astro output.",
    }),
    await measurePublishedSourcePayload({
      group: "Starwind source payload",
      label: "@starwind-ui/runtime",
      packageDir: path.join(REPO_ROOT, "packages/runtime"),
    }),
    await measurePublishedSourcePayload({
      group: "Starwind source payload",
      label: "@starwind-ui/react",
      packageDir: path.join(REPO_ROOT, "packages/react"),
    }),
  ];

  const packageBudgetResults = evaluatePackageSizeBudgets({ bundleResults, supportResults });
  const colorPickerCheck = evaluateColorPickerSizeComparison(bundleResults);
  packageBudgetResults.colorPickerCheck = colorPickerCheck;
  if (colorPickerCheck.advisory) {
    packageBudgetResults.advisories.push(colorPickerCheck.advisory);
  }

  const reportsWritten = writePackageSizeReports(
    {
      bundleResults,
      packageBudgetResults,
      sourceContributionAnalyses,
      sourcePayloadResults,
      supportResults,
    },
    { checkOnly: CHECK_ONLY },
  );
  if (!reportsWritten) {
    console.log("Package size budgets evaluated without rewriting the comparison report.");
  } else {
    console.log(`Wrote ${REPORT_PATH}`);
    console.log(`Wrote ${DIAGNOSTIC_REPORT_PATH}`);
  }

  if (packageBudgetResults.advisories.length > 0) {
    console.warn(
      `\nPackage size comparison advisories:\n\n${packageBudgetResults.advisories.join("\n\n")}`,
    );
  }

  if (packageBudgetResults.failures.length > 0) {
    console.error(
      `\nPackage size budget check failed:\n\n${packageBudgetResults.failures.join("\n\n")}`,
    );
    process.exitCode = 1;
  }
}

export function evaluateColorPickerSizeComparison(bundleResults) {
  const starwind = bundleResults.find((row) => row.label === "@starwind-ui/runtime/color-picker");
  const zag = bundleResults.find((row) => row.label === "@zag-js/color-picker");
  const starwindGzipBytes = starwind?.gzipBytes ?? null;
  const zagGzipBytes = zag?.gzipBytes ?? null;
  let advisory = null;
  let status = "Below comparator";

  if (starwindGzipBytes == null) {
    advisory =
      "Standalone Color Picker comparison could not be evaluated: missing @starwind-ui/runtime/color-picker min+gzip measurement.";
    status = "Unavailable";
  } else if (zagGzipBytes == null) {
    advisory =
      "Standalone Color Picker comparison could not be evaluated: missing @zag-js/color-picker min+gzip measurement.";
    status = "Unavailable";
  } else if (starwindGzipBytes > zagGzipBytes) {
    advisory = `Standalone Color Picker comparison advisory: @starwind-ui/runtime/color-picker ${formatExactBytes(
      starwindGzipBytes,
    )} is above @zag-js/color-picker ${formatExactBytes(zagGzipBytes)}.`;
    status = "Above comparator";
  } else if (starwindGzipBytes === zagGzipBytes) {
    status = "Equal comparator";
  }

  return {
    advisory,
    differenceGzipBytes:
      starwindGzipBytes == null || zagGzipBytes == null ? null : zagGzipBytes - starwindGzipBytes,
    failure: null,
    starwindGzipBytes,
    starwindMinifiedBytes: starwind?.minifiedBytes ?? null,
    status,
    zagGzipBytes,
    zagMinifiedBytes: zag?.minifiedBytes ?? null,
  };
}

export function formatColorPickerSizeComparisonMarkdown(comparison) {
  return [
    "### Standalone Color Picker Comparison",
    "",
    "The Runtime Color Picker subpath is measured independently from Starwind's aggregate support sets. Its absolute cold-import budget is enforced above; the Zag comparison is informational.",
    "",
    "| Check | Starwind minified | Starwind min+gzip | Zag minified | Zag min+gzip | Gzip difference | Comparison |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    [
      "Runtime Color Picker vs Zag Color Picker",
      formatExactBytes(comparison.starwindMinifiedBytes),
      formatExactBytes(comparison.starwindGzipBytes),
      formatExactBytes(comparison.zagMinifiedBytes),
      formatExactBytes(comparison.zagGzipBytes),
      formatExactBytes(comparison.differenceGzipBytes),
      comparison.status,
    ]
      .join(" | ")
      .replace(/^/, "| ")
      .replace(/$/, " |"),
  ];
}

export function buildColorPickerRebaselineSummary(evidence = colorPickerRebaselineEvidence) {
  const toBudgetRow = (row) => {
    const oldHeadroomBytes = row.oldCeilingBytes - row.preFeatureGzipBytes;

    return {
      ...row,
      deltaBytes: row.postFeatureBaselineGzipBytes - row.preFeatureGzipBytes,
      newCeilingBytes: row.postFeatureBaselineGzipBytes + oldHeadroomBytes,
      newHeadroomBytes: oldHeadroomBytes,
      oldHeadroomBytes,
    };
  };
  const toContributionRow = (row) => ({
    ...row,
    deltaBytes: row.postFeatureBaselineMinifiedBytes - row.preFeatureMinifiedBytes,
  });
  const headlineRows = evidence.headlineRows.map(toBudgetRow);
  const overlapBudgetRow = toBudgetRow(evidence.overlap);
  const categoryRows = evidence.overlap.categoryRows.map(toContributionRow);
  const ownerRows = evidence.overlap.ownerRows.map(toContributionRow);

  return {
    ...evidence,
    categoryRows,
    headlineRows,
    membershipCount: evidence.overlap.components.length,
    overlapBudgetRow,
    overlapOldCeilingOverageBytes:
      evidence.overlap.postFeatureBaselineGzipBytes - evidence.overlap.oldCeilingBytes,
    ownerDeltaSumBytes: ownerRows.reduce((sum, row) => sum + row.deltaBytes, 0),
    ownerRows,
    runtimeCategoryDeltaBytes: categoryRows.find((row) => row.label === "Runtime category")
      .deltaBytes,
  };
}

export function formatColorPickerRebaselineMarkdown(evidence = colorPickerRebaselineEvidence) {
  const summary = buildColorPickerRebaselineSummary(evidence);
  const budgetRows = [...summary.headlineRows, summary.overlapBudgetRow];
  const contributionRows = [...summary.categoryRows, ...summary.ownerRows];

  return [
    "### Color Picker Rebaseline Evidence",
    "",
    `The pre-feature fixed point is commit \`${summary.fixedPointCommit}\`, the parent of the first Color Picker implementation commit. It was exported with \`git archive\`, installed from the locked local pnpm store, rebuilt with \`pnpm runtime:build\` and \`pnpm react:build\`, and measured with the same esbuild, static-import, minification, and gzip settings described above. The post-feature values and ceilings below are the historical Color Picker release rebaseline snapshot, not live measurements or active release gates. The aggregate regression guards in the following sections are the current policy.`,
    "",
    "| Gate | Pre-feature gzip | Post-feature rebaseline gzip | Delta | Old ceiling | Old headroom | New ceiling | New headroom |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...budgetRows.map(
      (row) =>
        `| ${row.label.startsWith("@") ? `\`${row.label}\`` : row.label} | ${formatEvidenceBytes(row.preFeatureGzipBytes)} | ${formatEvidenceBytes(row.postFeatureBaselineGzipBytes)} | ${formatEvidenceDelta(row.deltaBytes)} | ${formatEvidenceBytes(row.oldCeilingBytes)} | ${formatEvidenceBytes(row.oldHeadroomBytes)} | ${formatEvidenceBytes(row.newCeilingBytes)} | ${formatEvidenceBytes(row.newHeadroomBytes)} |`,
    ),
    "",
    `The overlap is ${formatEvidenceBytes(summary.overlapOldCeilingOverageBytes)} above its old ceiling, but its comparison membership remains ${summary.membershipCount} and excludes Color Picker. Metafile \`bytesInOutput\` attributes the full ${formatEvidenceDelta(summary.runtimeCategoryDeltaBytes)} minified-byte increase to approved shared Runtime behavior; the React adapter, third-party, and other categories are unchanged.`,
    "",
    "| Overlap contribution | Pre-feature minified | Post-feature rebaseline minified | Delta |",
    "| --- | ---: | ---: | ---: |",
    ...contributionRows.map(
      (row) =>
        `| ${row.label.includes("/") ? `\`${row.label}\`` : row.label} | ${formatEvidenceBytes(row.preFeatureMinifiedBytes)} | ${formatEvidenceBytes(row.postFeatureBaselineMinifiedBytes)} | ${formatEvidenceDelta(row.deltaBytes)} |`,
    ),
    "",
    `The three shared source-owner deltas sum to the Runtime category delta exactly. The standalone Color Picker comparator remains isolated and unchanged at Starwind ${formatEvidenceBytes(summary.standaloneComparator.starwindGzipBytes)} gzip versus Zag ${formatEvidenceBytes(summary.standaloneComparator.zagGzipBytes)} gzip.`,
  ];
}

function formatEvidenceBytes(bytes) {
  return `${bytes.toLocaleString("en-US")} B`;
}

function formatEvidenceDelta(bytes) {
  if (bytes === 0) return "0 B";
  return `${bytes > 0 ? "+" : ""}${bytes.toLocaleString("en-US")} B`;
}

function prepareTempInstall() {
  rmSync(TMP_ROOT, { recursive: true, force: true });
  mkdirSync(TMP_ROOT, { recursive: true });
  writeFileSync(path.join(TMP_ROOT, "package.json"), JSON.stringify({ private: true }, null, 2));
  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", ...externalPackages], {
    cwd: TMP_ROOT,
    stdio: "inherit",
  });
}

async function measureBundle(row) {
  const external = [
    ...peerExternals,
    ...peerExternals.map((pkg) => `${pkg}/*`),
    ...(row.external ?? []),
  ];
  const outputDir = path.join(TMP_ROOT, "esbuild-output", slug(row.label));
  const entryFilePath = path.join(outputDir, "entry.js");

  try {
    const result = await esbuild.build({
      stdin: {
        contents: row.entry,
        loader: "js",
        resolveDir: TMP_ROOT,
        sourcefile: `${slug(row.label)}.js`,
      },
      bundle: true,
      chunkNames: "chunks/[name]-[hash]",
      metafile: Boolean(row.sourceContribution),
      minify: true,
      outdir: outputDir,
      splitting: true,
      treeShaking: true,
      format: "esm",
      platform: "browser",
      target: "es2020",
      absWorkingDir: TMP_ROOT,
      conditions: ["svelte"],
      external,
      plugins: row.plugins ?? [],
      logLevel: "silent",
      write: false,
      entryNames: "entry",
    });
    const summary = summarizeInitialBundleOutput({
      entryFilePath,
      metafile: row.sourceContribution ? result.metafile : undefined,
      outputFiles: result.outputFiles,
    });

    return {
      ...row,
      minifiedBytes: summary.minifiedBytes,
      metafile: summary.metafile,
      gzipBytes: summary.gzipBytes,
      version: getPackageVersion(row.versionPackage ?? row.label),
    };
  } catch (error) {
    return {
      ...row,
      version: getPackageVersion(row.versionPackage ?? row.label),
      minifiedBytes: null,
      gzipBytes: null,
      note: `Could not bundle: ${error.errors?.[0]?.text ?? error.message}`,
    };
  }
}

async function measurePublishedSourcePayload(row) {
  const packJson = runNpm(["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: row.packageDir,
    encoding: "utf8",
  });
  const [packInfo] = JSON.parse(packJson);
  const payloadParts = [];

  for (const file of packInfo.files) {
    const filePath = path.join(row.packageDir, file.path);
    if (!isSourcePayloadFile(file.path) || !existsSync(filePath)) continue;

    const source = readFileSync(filePath, "utf8");
    if (/\.(js|mjs|cjs|ts|tsx)$/.test(file.path) && !file.path.endsWith(".d.ts")) {
      const transformed = await esbuild.transform(source, {
        loader: file.path.endsWith(".tsx") ? "tsx" : file.path.endsWith(".ts") ? "ts" : "js",
        minify: true,
        target: "es2020",
        format: "esm",
      });
      payloadParts.push(transformed.code);
    } else if (file.path.endsWith(".astro")) {
      payloadParts.push(minifyAstroSource(source));
    }
  }

  const code = Buffer.from(payloadParts.join("\n"));
  return {
    ...row,
    version: packInfo.version,
    minifiedBytes: code.byteLength,
    gzipBytes: gzipSync(code, { level: 9 }).byteLength,
    packageGzipBytes: packInfo.size,
    packageUnpackedBytes: packInfo.unpackedSize,
  };
}

function isSourcePayloadFile(filePath) {
  if (filePath.endsWith(".d.ts")) return false;
  return /\.(astro|js|mjs|cjs|ts|tsx)$/.test(filePath);
}

function minifyAstroSource(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

function getPackageVersion(label) {
  const packageName = getPackageName(label.split(" ")[0]);
  if (!packageName.startsWith("@") || packageName.startsWith("@starwind-ui/")) return "local";

  const packageJsonPath = path.join(NODE_MODULES_ROOT, packageName, "package.json");
  if (!existsSync(packageJsonPath)) return "";

  return JSON.parse(readFileSync(packageJsonPath, "utf8")).version;
}

function getPackageName(specifier) {
  if (!specifier.startsWith("@")) return specifier.split("/")[0];

  const [scope, name] = specifier.split("/");
  return `${scope}/${name}`;
}

function resolveEsbuildPath() {
  try {
    return requireFromRepo.resolve("esbuild");
  } catch {
    const pnpmRoot = path.join(REPO_ROOT, "node_modules/.pnpm");
    const esbuildEntry = readdirSync(pnpmRoot)
      .filter((entry) => entry.startsWith("esbuild@"))
      .sort()
      .at(-1);

    if (!esbuildEntry) {
      throw new Error("Could not resolve esbuild from root dependencies or node_modules/.pnpm.");
    }

    return path.join(pnpmRoot, esbuildEntry, "node_modules/esbuild/lib/main.js");
  }
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

function starwindReactComponentsEntry(mappings) {
  return namespaceImports(
    mappings.map((mapping) => `@starwind-ui/react/${mapping.starwind}`),
    "component",
  );
}

function zagReactMachinesEntry(mappings) {
  return namespaceImports(
    ["@zag-js/react", ...uniqueFlatMap(mappings, (mapping) => mapping.zag)],
    "pkg",
  );
}

function baseUiComponentsEntry(mappings) {
  return namespaceImports(
    mappings.map((mapping) => `@base-ui/react/${mapping.base}`),
    "component",
  );
}

function uniqueFlatMap(items, callback) {
  return [...new Set(items.flatMap((item) => callback(item) ?? []))];
}

function namespaceImports(specifiers, prefix) {
  return `${specifiers
    .map((specifier, index) => `import * as ${prefix}${index} from "${specifier}";`)
    .join("\n")}
console.log(${specifiers.map((_, index) => `${prefix}${index}`).join(", ")});`;
}

export function formatDiagnosticPackageSizeReport({
  bundleResults,
  generatedDate,
  packageBudgetResults,
  sourceContributionAnalyses,
  sourcePayloadResults,
  supportResults,
}) {
  const headlineLabels = [
    "@base-ui/react",
    "Zag React adapter + all documented component machines",
    "@starwind-ui/react + runtime",
    "@starwind-ui/runtime",
    "@starwind-ui/react (adapter only)",
    "@zag-js/react",
  ];
  const headlineNotes = new Map([
    ["@base-ui/react", "All Base UI React public root exports."],
    [
      "Zag React adapter + all documented component machines",
      "React adapter plus every package from Zag's documented component list, bundled once.",
    ],
    [
      "@starwind-ui/react + runtime",
      "All Starwind React public root exports with the runtime bundled.",
    ],
    ["@starwind-ui/runtime", "Runtime package alone, without the React adapter."],
    ["@starwind-ui/react (adapter only)", "React adapter overhead with runtime externalized."],
    ["@zag-js/react", "Zag React framework adapter only, without any machines."],
  ]);
  const headlineResults = bundleResults
    .filter((row) => headlineLabels.includes(row.label))
    .sort((a, b) => (b.gzipBytes ?? 0) - (a.gzipBytes ?? 0));
  const supportAggregateRows = matchedSupportSets.map((set) => ({
    ...set,
    starwind: findSupportResult(supportResults, set.key, "starwind"),
    zag: findSupportResult(supportResults, set.key, "zag"),
    base: findSupportResult(supportResults, set.key, "base"),
  }));
  const supportDeduplicationRows = matchedSupportSets.flatMap((set) =>
    getSupportDeduplicationRows(set, supportResults),
  );
  const rawGzipDiagnostics = buildRawGzipDiagnostics({ supportResults });
  const supportComponentRows = starwindSupportMappings.map((mapping) => ({
    ...mapping,
    starwindResult: findSupportComponentResult(supportResults, mapping.starwind, "starwind"),
    zagResult: findSupportComponentResult(supportResults, mapping.starwind, "zag"),
    baseResult: findSupportComponentResult(supportResults, mapping.starwind, "base"),
  }));
  const lines = [
    "# Package Size Comparison",
    "",
    `Generated: ${generatedDate}`,
    "",
    "## Method",
    "",
    "- Bundle rows are built with esbuild, minified, and gzipped with Node zlib level 9.",
    "- Bundle rows use the generated entry chunk and static import graph; dynamic import chunks are excluded from current min+gzip rows because they remain lazy-loaded.",
    "- Package dependencies are bundled; framework peers such as React, Vue, Solid, Svelte, Astro, date-fns, and type packages are externalized.",
    "- Starwind local rows use the current workspace build output in `packages/*/dist`.",
    "- Zag and Base UI rows use current npm packages installed into a temporary measurement project under the operating system's temporary directory.",
    "- The Zag all-components aggregate follows the current component list in the Zag docs sidebar; duplicate examples such as nested/context menu, circular progress, segmented control, and range slider share their underlying package.",
    "- Source-contribution rows use esbuild metafile `bytesInOutput` from selected Starwind measurement rows. They are minified byte-attribution diagnostics before gzip, not public package-size comparison rows.",
    "- `@starwind-ui/astro` is source-published Astro/TS, so it appears in the source-payload table instead of the JS bundle-entry table.",
    "",
    "Regenerate with:",
    "",
    "```bash",
    "pnpm runtime:size",
    "```",
    "",
    "## Budget Checks",
    "",
    "`pnpm runtime:size` treats aggregate package and support-set sizes as regression guards: they fail only after more than 10% or 15 KiB of gzip growth from the committed baseline, whichever comes first. Targeted cold imports retain strict absolute budgets. Competitor comparisons are informational.",
    "",
    ...formatColorPickerRebaselineMarkdown(),
    "",
    "### Headline Aggregate Regression Guards",
    "",
    "| Row | Current min+gzip | Baseline | Regression guard | Status |",
    "| --- | ---: | ---: | ---: | --- |",
    ...packageBudgetResults.headlineChecks.map((check) =>
      [
        `\`${check.label}\``,
        formatBytes(check.gzipBytes),
        formatBytes(check.baselineGzipBytes),
        formatBytes(check.maxGzipBytes),
        check.status,
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    "### Targeted Cold-Import Budgets",
    "",
    "| Row | Current min+gzip | Budget | Status |",
    "| --- | ---: | ---: | --- |",
    ...[
      ...packageBudgetResults.standaloneComponentChecks,
      ...packageBudgetResults.fieldColdImportChecks,
    ].map((check) =>
      [check.label, formatBytes(check.gzipBytes), formatBytes(check.maxGzipBytes), check.status]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    "### Matched-Support Aggregate Regression Guards",
    "",
    "| Check | Starwind min+gzip | Comparator | Comparator min+gzip | Baseline | Regression guard | Gate | Comparison |",
    "| --- | ---: | --- | ---: | ---: | ---: | --- | --- |",
    ...packageBudgetResults.matchedSupportChecks.map((check) =>
      [
        check.label,
        formatBytes(check.starwindGzipBytes),
        check.comparatorLabel,
        formatBytes(check.comparatorGzipBytes),
        formatBytes(check.baselineGzipBytes),
        formatBytes(check.maxStarwindGzipBytes),
        check.status,
        check.comparisonStatus,
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    ...formatColorPickerSizeComparisonMarkdown(packageBudgetResults.colorPickerCheck),
    "",
    "## At A Glance",
    "",
    "Use this table for the headline ordering. `Minified + gzip` is the closest column to the advertised browser download size.",
    "",
    "| Rank | Scenario | Minified + gzip | Minified | Meaning |",
    "| ---: | --- | ---: | ---: | --- |",
    ...headlineResults.map((row, index) =>
      [
        index + 1,
        `\`${row.label}\``,
        formatBytes(row.gzipBytes),
        formatBytes(row.minifiedBytes),
        headlineNotes.get(row.label) ?? "",
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    "## Starwind-Matched Support",
    "",
    "These rows compare only the Starwind React components that have a comparable primitive in the other package. This is the better table for apples-to-apples sizing.",
    "",
    "| Comparison set | Starwind components | Starwind min+gzip | Zag React min+gzip | Base UI min+gzip | Notes |",
    "| --- | ---: | ---: | ---: | ---: | --- |",
    ...supportAggregateRows.map((row) =>
      [
        row.label,
        row.mappings.length,
        formatSupportBytes(row.starwind),
        formatSupportBytes(row.zag),
        formatSupportBytes(row.base),
        row.note,
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    ...formatRawGzipDiagnosticsMarkdown(rawGzipDiagnostics),
    "",
    "## Isolated vs Combined Support Costs",
    "",
    "This table explains why isolated component rows can look very different from matched-support aggregate rows. `Isolated per-component sum` adds each one-component measurement together, so shared runtime, adapter, and infrastructure code is counted repeatedly. `One combined bundle` imports the same support set once and lets esbuild dedupe shared code, which is closer to a real app using many primitives.",
    "",
    "| Comparison set | Library | Components | Isolated per-component sum | One combined bundle | Shared-code savings | Combined avg/component |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ...supportDeduplicationRows.map((row) =>
      [
        row.comparisonSetLabel,
        row.providerLabel,
        row.componentCount,
        formatBytes(row.isolatedGzipBytes),
        formatBytes(row.combinedGzipBytes),
        formatSavings(row.sharedSavingsGzipBytes, row.isolatedGzipBytes),
        formatBytes(row.combinedAverageGzipBytes),
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    "## Starwind Source Contribution Analysis",
    "",
    "This architecture-only section identifies which Starwind source categories contribute most to selected measured bundles. Use it to guide Runtime module-deepening work; use the matched-support tables above for public package comparisons.",
    "",
    ...formatSourceContributionMarkdown(sourceContributionAnalyses, { formatBytes }),
    "",
    "## Starwind Component Matches",
    "",
    "| Starwind component | Zag equivalent | Base UI equivalent | Starwind min+gzip | Zag min+gzip | Base UI min+gzip | Notes |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
    ...supportComponentRows.map((row) =>
      [
        `\`${row.starwind}\``,
        formatZagEquivalent(row),
        formatBaseEquivalent(row),
        formatSupportBytes(row.starwindResult),
        formatSupportBytes(row.zagResult),
        formatSupportBytes(row.baseResult),
        [row.note, row.starwindResult?.note, row.zagResult?.note, row.baseResult?.note]
          .filter(Boolean)
          .join(" "),
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    "## Bundle Entry Sizes",
    "",
    "| Group | Package / scenario | Version | Minified | Minified + gzip | Notes |",
    "| --- | --- | ---: | ---: | ---: | --- |",
    ...bundleResults.map((row) =>
      [
        row.group,
        `\`${row.label}\``,
        row.version,
        formatBytes(row.minifiedBytes),
        formatBytes(row.gzipBytes),
        row.note ?? "",
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    "## Starwind Published Source Payloads",
    "",
    "These rows measure the published package's own runtime-bearing source files after minification. They are useful for `@starwind-ui/astro`, whose package ships `.astro` source files rather than a JS bundle entry.",
    "",
    "| Package | Version | Minified source payload | Minified + gzip | npm tarball gzip | npm unpacked | Notes |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ...sourcePayloadResults.map((row) =>
      [
        `\`${row.label}\``,
        row.version,
        formatBytes(row.minifiedBytes),
        formatBytes(row.gzipBytes),
        formatBytes(row.packageGzipBytes),
        formatBytes(row.packageUnpackedBytes),
        row.note ?? "",
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    "## Reading The Numbers",
    "",
    "- Use `@starwind-ui/react (adapter only)` when you want to isolate framework-wrapper overhead.",
    "- Use `@starwind-ui/react + runtime` when you want the likely consumer cost of importing the React adapter package root.",
    "- Use `Starwind-Matched Support` when you want a fair support-surface comparison rather than a whole-catalog comparison.",
    "- Use `Isolated vs Combined Support Costs` when you need to explain why one-component import rows should not be added together as an app-size estimate.",
    "- Use `Starwind Source Contribution Analysis` when you need internal architecture diagnostics for Starwind Runtime and adapter work. Do not use it as a competitor source-attribution claim.",
    "- Zag's framework adapters are separate from component machines, so adapter-only rows are not complete component costs.",
    "- The Zag adapter + machine samples show the shape of a real single-component import for each framework adapter.",
    "- Base UI is React-only and ships one large tree-shakeable package; component sample rows are better comparisons to Zag's per-machine rows than the Base UI root row.",
  ];

  return `${lines.join("\n")}\n`;
}

const publicPackageSizeSections = [
  "Method",
  "At A Glance",
  "Starwind-Matched Support",
  "Isolated vs Combined Support Costs",
  "Starwind Component Matches",
  "Starwind Published Source Payloads",
  "Reading The Numbers",
];

export function formatPublicPackageSizeReport(input) {
  return formatPublicPackageSizeReportFromDiagnostic(formatDiagnosticPackageSizeReport(input));
}

export function formatPackageSizeReports(input) {
  const diagnosticReport = formatDiagnosticPackageSizeReport(input);
  return {
    diagnosticReport,
    publicReport: formatPublicPackageSizeReportFromDiagnostic(diagnosticReport),
  };
}

function formatPublicPackageSizeReportFromDiagnostic(diagnosticReport) {
  const sections = splitMarkdownSections(diagnosticReport);
  const publicSections = publicPackageSizeSections.map((heading) => {
    const section = sections.get(heading);
    if (!section) throw new Error(`Missing package-size report section: ${heading}`);

    if (heading === "Method") {
      return section.filter(
        (line) => !line.startsWith("- Source-contribution rows use esbuild metafile"),
      );
    }
    if (heading === "Reading The Numbers") {
      return section.filter(
        (line) => !line.startsWith("- Use `Starwind Source Contribution Analysis`"),
      );
    }
    return section;
  });
  const [title, generated] = diagnosticReport.split("\n\n", 2);

  return `${[title, generated, ...publicSections.map((section) => section.join("\n"))].join("\n\n").trim()}\n`;
}

function splitMarkdownSections(report) {
  const sections = new Map();
  let heading = null;

  for (const line of report.trimEnd().split("\n")) {
    const match = line.match(/^## (.+)$/);
    if (match) {
      heading = match[1];
      sections.set(heading, [line]);
    } else if (heading) {
      sections.get(heading).push(line);
    }
  }

  return sections;
}

export function writePackageSizeReports(
  input,
  { checkOnly = false, diagnosticPath = DIAGNOSTIC_REPORT_PATH, publicPath = REPORT_PATH } = {},
) {
  if (checkOnly) return false;

  const reports = formatPackageSizeReports({
    ...input,
    generatedDate: input.generatedDate ?? new Date().toISOString().slice(0, 10),
  });
  mkdirSync(path.dirname(diagnosticPath), { recursive: true });
  writeFileSync(publicPath, reports.publicReport);
  writeFileSync(diagnosticPath, reports.diagnosticReport);
  return true;
}

function formatBytes(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function formatExactBytes(bytes) {
  if (bytes == null) return "N/A";
  return `${Math.round(bytes).toLocaleString("en-US")} B (${formatBytes(bytes)})`;
}

function findSupportResult(results, comparisonSet, provider) {
  return results.find((row) => row.comparisonSet === comparisonSet && row.provider === provider);
}

function findSupportComponentResult(results, component, provider) {
  return results.find((row) => row.component === component && row.provider === provider);
}

function getSupportDeduplicationRows(set, supportResults) {
  return ["starwind", "zag", "base"]
    .map((provider) => {
      const combined = findSupportResult(supportResults, set.key, provider);
      if (!combined) return null;

      const componentResults = set.mappings.map((mapping) =>
        findSupportComponentResult(supportResults, mapping.starwind, provider),
      );
      const isolatedGzipBytes = sumMeasuredGzipBytes(componentResults);
      const combinedGzipBytes = combined.gzipBytes ?? null;
      const sharedSavingsGzipBytes =
        isolatedGzipBytes == null || combinedGzipBytes == null
          ? null
          : isolatedGzipBytes - combinedGzipBytes;
      const combinedAverageGzipBytes =
        combinedGzipBytes == null ? null : combinedGzipBytes / set.mappings.length;

      return {
        combinedAverageGzipBytes,
        combinedGzipBytes,
        comparisonSetLabel: set.label,
        componentCount: set.mappings.length,
        isolatedGzipBytes,
        providerLabel: formatProviderLabel(provider),
        sharedSavingsGzipBytes,
      };
    })
    .filter(Boolean);
}

function addSourceContributionContexts(results) {
  return results.map((row) => {
    if (!row.sourceContribution) return row;

    return {
      ...row,
      sourceContribution: {
        ...row.sourceContribution,
        context: getSourceContributionContext(row, results),
      },
    };
  });
}

function getSourceContributionContext(row, results) {
  if (row.comparisonSet) {
    const set = matchedSupportSets.find((set) => set.key === row.comparisonSet);
    return buildSourceContributionContext({
      combinedGzipBytes: row.gzipBytes ?? null,
      componentRows:
        set?.mappings.map((mapping) =>
          findSupportComponentResult(results, mapping.starwind, row.provider),
        ) ?? [],
      componentCount: set?.mappings.length ?? row.componentCount ?? null,
      interpretation:
        "Use both columns: lower combined size is good, but higher savings can also come from higher isolated imports.",
    });
  }

  if (row.component) {
    const gzipBytes = row.gzipBytes ?? null;

    return {
      combinedGzipBytes: gzipBytes,
      componentCount: 1,
      interpretation:
        row.component === "field"
          ? "Cold import baseline for Field; lowering this can be a win even if aggregate savings percentage falls."
          : "Single-component cold import baseline.",
      isolatedGzipBytes: gzipBytes,
      sharedSavingsGzipBytes: 0,
    };
  }

  return null;
}

function sumMeasuredGzipBytes(results) {
  if (results.some((result) => !result || result.gzipBytes == null)) {
    return null;
  }

  return results.reduce((total, result) => total + result.gzipBytes, 0);
}

function formatSupportBytes(result) {
  if (!result) return "N/A";
  return formatBytes(result.gzipBytes) || "N/A";
}

function formatProviderLabel(provider) {
  if (provider === "starwind") return "Starwind";
  if (provider === "zag") return "Zag React";
  return "Base UI";
}

function formatSavings(savingsBytes, isolatedBytes) {
  if (savingsBytes == null || isolatedBytes == null) return "";
  const percent = isolatedBytes === 0 ? 0 : (savingsBytes / isolatedBytes) * 100;

  return `${formatBytes(savingsBytes)} (${percent.toFixed(1)}%)`;
}

function formatZagEquivalent(row) {
  if (!row.zag) return "N/A";
  return row.zag.map((pkg) => `\`${pkg}\``).join(", ");
}

function formatBaseEquivalent(row) {
  if (!row.base) return "N/A";
  return `\`@base-ui/react/${row.base}\``;
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isMainModule() {
  const entryPath = process.argv[1];
  return entryPath != null && path.resolve(entryPath) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  await main();
}
