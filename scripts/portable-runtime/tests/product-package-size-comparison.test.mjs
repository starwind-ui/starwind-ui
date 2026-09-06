import { describe, expect, it } from "vitest";

import {
  PRODUCT_COMPARATOR_IDS,
  buildMeasurementEntries,
  buildProductComparisonPlan,
  buildSnapshotPath,
  parseProductSizeCommand,
  validateComparatorSnapshot,
} from "../product-package-size-comparison.mjs";
import { buildProductOverlapAttribution } from "../product-package-size-attribution.mjs";
import {
  formatProductAttributionReport,
  formatProductSizeReport,
  subtractFrameworkShell,
} from "../product-package-size-report.mjs";
import { measureEntry } from "../product-package-size-runner.mjs";

describe("product package-size comparison plan", () => {
  it("uses complete component subpaths for React and Vue comparisons", () => {
    const plan = buildProductComparisonPlan();

    expect(plan.react.providers.map(({ id }) => id)).toEqual([
      "starwind-react",
      "ark-react",
      "base-react",
    ]);
    expect(plan.vue.providers.map(({ id }) => id)).toEqual(["starwind-vue", "ark-vue", "reka-vue"]);
    expect(plan.react.components.find(({ component }) => component === "select")).toMatchObject({
      entries: {
        "ark-react": ["@ark-ui/react/select"],
        "base-react": ["@base-ui/react/select"],
        "starwind-react": ["@starwind-ui/react/select"],
      },
    });
    expect(plan.react.overlaps.find(({ id }) => id === "react-exact-three-way")).toMatchObject({
      providers: ["starwind-react", "ark-react", "base-react"],
    });
    expect(plan.site.scenarios.map(({ id }) => id)).toEqual([
      "empty",
      "select",
      "form",
      "overlays",
      "full-overlap",
    ]);
  });

  it("keeps competitor refreshes independent from Starwind and report commands", () => {
    expect(PRODUCT_COMPARATOR_IDS).toEqual(["ark-react", "base-react", "ark-vue", "reka-vue"]);
    expect(parseProductSizeCommand(["starwind"])).toEqual({ command: "starwind" });
    expect(parseProductSizeCommand(["report"])).toEqual({ command: "report" });
    expect(parseProductSizeCommand(["site"])).toEqual({ command: "site" });
    expect(parseProductSizeCommand(["refresh-comparator", "--ark-react"])).toEqual({
      command: "refresh-comparator",
      comparatorId: "ark-react",
    });
    expect(() => parseProductSizeCommand(["refresh-comparator", "all"])).toThrow(
      /Unknown comparator/,
    );
    expect(buildSnapshotPath("ark-react")).toMatch(
      /product-package-size-snapshots\/ark-react\.json$/,
    );
  });

  it("records exact package surfaces and selected root exports", () => {
    expect(buildMeasurementEntries("ark-react").components.select).toEqual([
      { exports: ["*"], specifier: "@ark-ui/react/select" },
    ]);
    expect(
      buildMeasurementEntries("reka-vue", [
        "AccordionRoot",
        "AlertDialogRoot",
        "AvatarRoot",
        "CheckboxRoot",
        "CollapsibleRoot",
        "ComboboxRoot",
        "ContextMenuRoot",
        "DialogRoot",
        "DropdownMenuRoot",
        "HoverCardRoot",
        "NavigationMenuRoot",
        "PinInputRoot",
        "PopoverRoot",
        "ProgressRoot",
        "RadioGroupRoot",
        "ScrollAreaRoot",
        "SelectItem",
        "SelectRoot",
        "SliderRoot",
        "SwitchRoot",
        "TabsRoot",
        "ToastRoot",
        "ToggleGroupItem",
        "ToggleItem",
        "TooltipRoot",
      ]).components.select,
    ).toEqual([{ exports: ["SelectItem", "SelectRoot"], specifier: "reka-ui" }]);
  });

  it("validates versioned comparator snapshots against the active measurement toolchain", () => {
    const snapshot = {
      schema: "starwind.product-package-size-comparator",
      schemaVersion: 2,
      comparatorId: "ark-react",
      package: { name: "@ark-ui/react", version: "5.37.2", integrity: "sha512-test" },
      capturedAt: "2026-08-18T00:00:00.000Z",
      environment: { node: "24.19.0", esbuild: "0.27.7" },
      fixtureRevision: 2,
      measurementEntries: {
        catalog: [{ exports: ["*"], specifier: "@ark-ui/react" }],
        components: {
          select: [{ exports: ["*"], specifier: "@ark-ui/react/select" }],
        },
        overlaps: { "react-exact-three-way": ["select"] },
      },
      components: {
        select: { minifiedBytes: 100, gzipBytes: 70, brotliBytes: 60 },
      },
      overlaps: {
        "react-exact-three-way": { minifiedBytes: 100, gzipBytes: 70, brotliBytes: 60 },
      },
      catalog: { minifiedBytes: 100, gzipBytes: 70, brotliBytes: 60 },
    };

    expect(() =>
      validateComparatorSnapshot(snapshot, {
        expectedEnvironment: { node: "24.20.1", esbuild: "0.27.7" },
      }),
    ).not.toThrow();
    expect(() =>
      validateComparatorSnapshot(snapshot, {
        expectedEnvironment: { node: "25.0.0", esbuild: "0.27.7" },
      }),
    ).toThrow(/Node major/);
    expect(() =>
      validateComparatorSnapshot(snapshot, {
        expectedEnvironment: { node: "24.19.0", esbuild: "0.28.0" },
      }),
    ).toThrow(/esbuild/);
  });
});

describe("product package-size report", () => {
  it("subtracts each framework's own empty route", () => {
    expect(
      subtractFrameworkShell(
        { minifiedBytes: 1_500, gzipBytes: 700, brotliBytes: 600 },
        { minifiedBytes: 1_000, gzipBytes: 500, brotliBytes: 450 },
      ),
    ).toEqual({ minifiedBytes: 500, gzipBytes: 200, brotliBytes: 150 });
  });

  it("renders individual, overlap, and built-site tables", () => {
    const report = formatProductSizeReport({
      generatedAt: "2026-08-18T00:00:00.000Z",
      react: comparisonFixture("react"),
      vue: comparisonFixture("vue"),
      site: {
        astro: {
          empty: size(10, 8, 7),
          select: size(30, 20, 18),
        },
        react: {
          empty: size(50, 40, 35),
          select: size(90, 65, 58),
        },
      },
    });

    expect(report).toContain("## React individual components");
    expect(report).toContain("## React overlap bundles");
    expect(report).toContain("## Vue individual components");
    expect(report).toContain("## Astro versus React site delivery");
    expect(report).toContain(
      "| Component | starwind-react 1.0.0 | ark-react 1.0.0 | base-react 1.0.0 |",
    );
    expect(report).toContain(
      "| Overlap | Components | starwind-vue 1.0.0 | ark-vue 1.0.0 | reka-vue 1.0.0 |",
    );
    expect(report).toContain(
      "| Scenario | Starwind target | Total initial gzip / Brotli | Component-added JS gzip / Brotli |",
    );
    expect(report).not.toContain("## ELI5 guide");
    expect(report.toLowerCase()).not.toContain("backpack");
    expect(report.toLowerCase()).not.toContain("toolbox");
    expect(report.toLowerCase()).toContain("component-added js");
    expect(report).toContain("Brotli");
    expect(report).not.toContain("Lazy JS");
    expect(report).not.toContain("emitted lazy");
  });

  it("formats internal exact-overlap source attribution separately from the product report", () => {
    const report = formatProductAttributionReport({
      generatedAt: "2026-08-18T00:00:00.000Z",
      react: attributionFixture("React adapter"),
      vue: attributionFixture("Vue adapter"),
    });

    expect(report).toContain("# Starwind product-overlap source attribution");
    expect(report).toContain("## React exact-overlap attribution");
    expect(report).toContain("## Vue exact-overlap attribution");
    expect(report).toContain("Runtime");
    expect(report).toContain("Minified bytes in output");
  });

  it("counts strict pairwise wins and includes losses and ties in per-component medians", () => {
    const react = comparisonFixture("react");
    react.components = {
      accordion: {
        "starwind-react": size(100, 100, 100),
        "ark-react": size(200, 200, 200),
        "base-react": size(100, 100, 100),
      },
      dialog: {
        "starwind-react": size(200, 200, 200),
        "ark-react": size(100, 100, 100),
        "base-react": size(100, 100, 100),
      },
      tabs: {
        "starwind-react": size(50, 50, 50),
        "ark-react": size(200, 200, 200),
        "base-react": size(100, 100, 100),
      },
      carousel: {
        "starwind-react": size(80, 80, 80),
        "ark-react": size(100, 100, 100),
      },
      input: { "starwind-react": size(10, 10, 10) },
    };
    const report = formatProductSizeReport({
      generatedAt: "2026-09-06T00:00:00.000Z",
      react,
      vue: comparisonFixture("vue"),
      site: {},
    });

    expect(report).toContain("| Starwind UI React vs Ark UI React | **3 of 4** | **35.0%** |");
    expect(report).toContain("| Starwind UI React vs Base UI React | **1 of 3** | **0.0%** |");
    expect(report).toContain("| Starwind UI Vue vs Ark UI Vue | **0 of 1** | **0.0%** |");
    expect(report).toContain("The median includes every shared measured category");
    expect(report).toContain("The smaller count excludes ties");
  });

  it("leads with a supported majority claim and keeps combined results beside their tables", () => {
    const react = comparisonFixture("react");
    const vue = comparisonFixture("vue");
    react.components.select["starwind-react"] = size(4, 4, 4);
    vue.components.select["starwind-vue"] = size(4, 4, 4);
    const input = { generatedAt: "2026-09-06T00:00:00.000Z", react, vue, site: {} };
    const report = formatProductSizeReport(input);
    const claim = "Starwind UI has the smallest imports in the majority of comparisons.";
    const summary = report.slice(0, report.indexOf("## React individual components"));

    expect(summary).toContain(claim);
    expect(summary).toContain("| Comparison | Starwind smaller | Median reduction per component |");
    expect(summary).not.toContain("combined bundle");
    expect(report.indexOf("In the 1-component combined bundle")).toBeGreaterThan(
      report.indexOf("## React overlap bundles"),
    );
    expect(report).not.toContain("three-way category-match individual rows");

    vue.components.select["starwind-vue"] = size(8, 8, 8);
    expect(formatProductSizeReport(input)).not.toContain(claim);

    vue.components = {};
    const unavailable = formatProductSizeReport(input);
    expect(unavailable).not.toContain(claim);
    expect(unavailable).toContain("| Starwind UI Vue vs Ark UI Vue | N/A | N/A |");
  });
});

describe("product package-size bundle measurement", () => {
  it("excludes dynamic-only output without reporting an aggregate lazy total", async () => {
    const result = await measureEntry('import("./dynamic.js");', "dynamic-output", {
      build: async () => ({
        outputFiles: [
          outputFile(
            "/tmp/starwind-product-size-output/dynamic-output/entry.js",
            'import("./dynamic.js");',
          ),
          outputFile(
            "/tmp/starwind-product-size-output/dynamic-output/dynamic.js",
            "export const value=1;",
          ),
        ],
      }),
    });

    expect(result).not.toHaveProperty("lazy");
    expect(result.minifiedBytes).toBe(Buffer.byteLength('import("./dynamic.js");'));
  });

  it("keeps every source marker attached to a built input", () => {
    const attribution = buildProductOverlapAttribution({
      combinedGzipBytes: 500,
      componentRows: [{ gzipBytes: 400 }, { gzipBytes: 300 }],
      framework: "react",
      metafile: {
        outputs: {
          "out.js": {
            inputs: {
              "/repo/packages/runtime/dist/chunk.js": { bytesInOutput: 900 },
            },
          },
        },
      },
      readFile: () =>
        "// src/internal/dialog-top-layer-host.ts\nconst host = 1;\n// src/components/dialog/dialog.ts\nconst dialog = 2;",
      repoRoot: "/repo",
    });

    expect(attribution.topLocalInputs[0]).toMatchObject({
      bytes: 900,
      sourceModules: ["src/internal/dialog-top-layer-host.ts", "src/components/dialog/dialog.ts"],
    });
  });
});

function size(minifiedBytes, gzipBytes, brotliBytes) {
  return { minifiedBytes, gzipBytes, brotliBytes };
}

function comparisonFixture(framework) {
  const providerPrefix =
    framework === "react"
      ? ["starwind-react", "ark-react", "base-react"]
      : ["starwind-vue", "ark-vue", "reka-vue"];
  return {
    catalog: Object.fromEntries(providerPrefix.map((provider) => [provider, size(10, 8, 7)])),
    providers: providerPrefix.map((provider) => ({
      id: provider,
      label: provider,
      version: "1.0.0",
    })),
    components: {
      select: Object.fromEntries(providerPrefix.map((provider) => [provider, size(10, 8, 7)])),
    },
    overlaps: {
      [`${framework}-exact-three-way`]: Object.fromEntries(
        providerPrefix.map((provider) => [provider, size(10, 8, 7)]),
      ),
    },
    overlapMetadata: { [`${framework}-exact-three-way`]: { componentCount: 1 } },
    overlapComponentNames: { [`${framework}-exact-three-way`]: ["select"] },
  };
}

function attributionFixture(adapterCategory) {
  return {
    categories: [
      { bytes: 700, label: "Runtime" },
      { bytes: 300, label: adapterCategory },
    ],
    combinedGzipBytes: 500,
    componentCount: 2,
    isolatedGzipBytes: 800,
    sharedSavingsGzipBytes: 300,
    topLocalInputs: [
      {
        bytes: 700,
        category: "Runtime",
        path: "packages/runtime/dist/select.js",
        sourceModules: ["src/components/select/select.ts"],
      },
    ],
    totalBytes: 1_000,
  };
}

function outputFile(path, text) {
  return { contents: Buffer.from(text), path, text };
}
