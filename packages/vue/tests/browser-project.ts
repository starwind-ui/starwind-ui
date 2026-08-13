import ts from "typescript";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "../../runtime/node_modules/vitest/dist/config.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { vueRuntimePrimitiveComponents } from "../../../scripts/portable-runtime/renderers/framework-adapters/vue/inventory.js";

import { compileVueSfc } from "../tsup.config.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export type VueBrowserProjectOwnership = {
  component: string;
  config: string;
  tests: readonly string[];
};

export const vueBrowserProjectOwnership = [
  {
    component: "accordion",
    config: "packages/vue/tests/accordion/vitest.config.ts",
    tests: ["packages/vue/tests/accordion/accordion.browser.test.ts"],
  },
  {
    component: "alert-dialog",
    config: "packages/vue/tests/alert-dialog/vitest.config.ts",
    tests: ["packages/vue/tests/alert-dialog/alert-dialog.browser.test.ts"],
  },
  {
    component: "avatar",
    config: "packages/vue/tests/avatar/vitest.config.ts",
    tests: ["packages/vue/tests/avatar/avatar.browser.test.ts"],
  },
  {
    component: "button",
    config: "packages/vue/tests/button/vitest.config.ts",
    tests: ["packages/vue/tests/button/button.browser.test.ts"],
  },
  {
    component: "carousel",
    config: "packages/vue/tests/carousel/vitest.config.ts",
    tests: ["packages/vue/tests/carousel/carousel.browser.test.ts"],
  },
  {
    component: "checkbox",
    config: "packages/vue/tests/checkbox/vitest.config.ts",
    tests: ["packages/vue/tests/checkbox/checkbox.browser.test.ts"],
  },
  {
    component: "checkbox-group",
    config: "packages/vue/tests/checkbox-group/vitest.config.ts",
    tests: ["packages/vue/tests/checkbox-group/checkbox-group.browser.test.ts"],
  },
  {
    component: "collapsible",
    config: "packages/vue/tests/collapsible/vitest.config.ts",
    tests: ["packages/vue/tests/collapsible/collapsible.browser.test.ts"],
  },
  {
    component: "color-picker",
    config: "packages/vue/tests/color-picker/vitest.config.ts",
    tests: ["packages/vue/tests/color-picker/color-picker.browser.test.ts"],
  },
  {
    component: "combobox",
    config: "packages/vue/tests/combobox/vitest.config.ts",
    tests: ["packages/vue/tests/combobox/combobox.browser.test.ts"],
  },
  {
    component: "context-menu",
    config: "packages/vue/tests/context-menu/vitest.config.ts",
    tests: ["packages/vue/tests/context-menu/context-menu.browser.test.ts"],
  },
  {
    component: "dialog",
    config: "packages/vue/tests/dialog/vitest.config.ts",
    tests: ["packages/vue/tests/dialog/dialog.browser.test.ts"],
  },
  {
    component: "drawer",
    config: "packages/vue/tests/drawer/vitest.config.ts",
    tests: ["packages/vue/tests/drawer/drawer.browser.test.ts"],
  },
  {
    component: "dropzone",
    config: "packages/vue/tests/dropzone/vitest.config.ts",
    tests: ["packages/vue/tests/dropzone/dropzone.browser.test.ts"],
  },
  {
    component: "fieldset",
    config: "packages/vue/tests/fieldset/vitest.config.ts",
    tests: ["packages/vue/tests/fieldset/fieldset.browser.test.ts"],
  },
  {
    component: "field",
    config: "packages/vue/tests/field/vitest.config.ts",
    tests: ["packages/vue/tests/field/field.browser.test.ts"],
  },
  {
    component: "form",
    config: "packages/vue/tests/form/vitest.config.ts",
    tests: ["packages/vue/tests/form/form.browser.test.ts"],
  },
  {
    component: "input",
    config: "packages/vue/tests/input/vitest.config.ts",
    tests: ["packages/vue/tests/input/input.browser.test.ts"],
  },
  {
    component: "menu",
    config: "packages/vue/tests/menu/vitest.config.ts",
    tests: ["packages/vue/tests/menu/menu.browser.test.ts"],
  },
  {
    component: "navigation-menu",
    config: "packages/vue/tests/navigation-menu/vitest.config.ts",
    tests: ["packages/vue/tests/navigation-menu/navigation-menu.browser.test.ts"],
  },
  {
    component: "popover",
    config: "packages/vue/tests/popover/vitest.config.ts",
    tests: ["packages/vue/tests/popover/popover.browser.test.ts"],
  },
  {
    component: "preview-card",
    config: "packages/vue/tests/preview-card/vitest.config.ts",
    tests: ["packages/vue/tests/preview-card/preview-card.browser.test.ts"],
  },
  {
    component: "progress",
    config: "packages/vue/tests/progress/vitest.config.ts",
    tests: [
      "packages/vue/tests/progress/progress.browser.test.ts",
      "packages/vue/tests/progress/progress.styled.browser.test.ts",
    ],
  },
  {
    component: "radio",
    config: "packages/vue/tests/radio/vitest.config.ts",
    tests: ["packages/vue/tests/radio/radio.browser.test.ts"],
  },
  {
    component: "radio-group",
    config: "packages/vue/tests/radio-group/vitest.config.ts",
    tests: ["packages/vue/tests/radio-group/radio-group.browser.test.ts"],
  },
  {
    component: "scroll-area",
    config: "packages/vue/tests/scroll-area/vitest.config.ts",
    tests: ["packages/vue/tests/scroll-area/scroll-area.browser.test.ts"],
  },
  {
    component: "select",
    config: "packages/vue/tests/select/vitest.config.ts",
    tests: ["packages/vue/tests/select/select.browser.test.ts"],
  },
  {
    component: "sidebar",
    config: "packages/vue/tests/sidebar/vitest.config.ts",
    tests: ["packages/vue/tests/sidebar/sidebar.browser.test.ts"],
  },
  {
    component: "input-otp",
    config: "packages/vue/tests/input-otp/vitest.config.ts",
    tests: ["packages/vue/tests/input-otp/input-otp.browser.test.ts"],
  },
  {
    component: "slider",
    config: "packages/vue/tests/slider/vitest.config.ts",
    tests: ["packages/vue/tests/slider/slider.browser.test.ts"],
  },
  {
    component: "switch",
    config: "packages/vue/tests/switch/vitest.config.ts",
    tests: ["packages/vue/tests/switch/switch.browser.test.ts"],
  },
  {
    component: "tabs",
    config: "packages/vue/tests/tabs/vitest.config.ts",
    tests: ["packages/vue/tests/tabs/tabs.browser.test.ts"],
  },
  {
    component: "toast",
    config: "packages/vue/tests/toast/vitest.config.ts",
    tests: ["packages/vue/tests/toast/toast.browser.test.ts"],
  },
  {
    component: "toggle",
    config: "packages/vue/tests/toggle/vitest.config.ts",
    tests: ["packages/vue/tests/toggle/toggle.browser.test.ts"],
  },
  {
    component: "toggle-group",
    config: "packages/vue/tests/toggle-group/vitest.config.ts",
    tests: ["packages/vue/tests/toggle-group/toggle-group.browser.test.ts"],
  },
  {
    component: "tooltip",
    config: "packages/vue/tests/tooltip/vitest.config.ts",
    tests: ["packages/vue/tests/tooltip/tooltip.browser.test.ts"],
  },
] as const satisfies readonly VueBrowserProjectOwnership[];

// Keep this explicit: adding a supported Primitive without browser coverage must be a reviewed choice.
export const vueBrowserCoverageAllowlist = [] as const satisfies readonly string[];

export type VueBrowserInventoryDiagnostics = {
  components: {
    duplicateOwnership: string[];
    missingCoverage: string[];
    staleAllowlist: string[];
    staleOwnership: string[];
  };
  tests: {
    duplicateOwnership: string[];
    missingOwnership: string[];
    staleOwnership: string[];
  };
};

export function validateVueBrowserInventory({
  allowlist = vueBrowserCoverageAllowlist,
  browserFiles,
  ownership = vueBrowserProjectOwnership,
  supportedComponents = vueRuntimePrimitiveComponents,
}: {
  allowlist?: readonly string[];
  browserFiles: readonly string[];
  ownership?: readonly VueBrowserProjectOwnership[];
  supportedComponents?: readonly string[];
}): VueBrowserInventoryDiagnostics {
  const supported = new Set(supportedComponents);
  const allowed = new Set(allowlist);
  const discovered = new Set(browserFiles);
  const componentCounts = countValues(ownership.map(({ component }) => component));
  const testCounts = countValues(ownership.flatMap(({ tests }) => tests));

  return {
    components: {
      duplicateOwnership: duplicates(componentCounts),
      missingCoverage: supportedComponents
        .filter((component) => !componentCounts.has(component) && !allowed.has(component))
        .sort(),
      staleAllowlist: allowlist
        .filter((component) => !supported.has(component) || componentCounts.has(component))
        .sort(),
      staleOwnership: ownership
        .map(({ component }) => component)
        .filter((component) => !supported.has(component))
        .sort(),
    },
    tests: {
      duplicateOwnership: duplicates(testCounts),
      missingOwnership: browserFiles.filter((file) => !testCounts.has(file)).sort(),
      staleOwnership: [...testCounts.keys()].filter((file) => !discovered.has(file)).sort(),
    },
  };
}

export function hasVueBrowserInventoryDiagnostics(
  diagnostics: VueBrowserInventoryDiagnostics,
): boolean {
  return (
    Object.values(diagnostics.components).some((values) => values.length > 0) ||
    Object.values(diagnostics.tests).some((values) => values.length > 0)
  );
}

export function formatVueBrowserInventoryDiagnostics(
  diagnostics: VueBrowserInventoryDiagnostics,
): string {
  const lines = ["Vue browser test ownership drift detected:"];
  const entries: Array<[string, readonly string[]]> = [
    ["supported components missing coverage", diagnostics.components.missingCoverage],
    ["components owned more than once", diagnostics.components.duplicateOwnership],
    ["unsupported components with ownership", diagnostics.components.staleOwnership],
    ["stale no-browser allowlist entries", diagnostics.components.staleAllowlist],
    ["discovered browser tests missing ownership", diagnostics.tests.missingOwnership],
    ["browser tests owned more than once", diagnostics.tests.duplicateOwnership],
    ["owned browser tests missing on disk", diagnostics.tests.staleOwnership],
  ];
  for (const [label, values] of entries) {
    if (values.length > 0) lines.push(`- ${label}: ${values.join(", ")}`);
  }
  return lines.join("\n");
}

export function assertVueBrowserInventory(
  snapshot: Parameters<typeof validateVueBrowserInventory>[0],
): void {
  const diagnostics = validateVueBrowserInventory(snapshot);
  if (hasVueBrowserInventoryDiagnostics(diagnostics)) {
    throw new Error(formatVueBrowserInventoryDiagnostics(diagnostics));
  }
}

export function createVueBrowserProjectConfig(component: string) {
  if (!vueRuntimePrimitiveComponents.includes(component as never)) {
    throw new Error(`Unsupported Vue browser project component: ${component}`);
  }

  const resolve = {
    alias: [
      {
        find: /^vitest$/,
        replacement: path.join(repoRoot, "packages/runtime/node_modules/vitest/dist/index.js"),
      },
      {
        find: /^vitest\/internal\/browser$/,
        replacement: path.join(repoRoot, "packages/runtime/node_modules/vitest/dist/browser.js"),
      },
      ...vueRuntimePrimitiveComponents.flatMap((primitive) => [
        {
          find: `@starwind-ui/runtime/${primitive}`,
          replacement: path.join(repoRoot, `packages/runtime/src/components/${primitive}/index.ts`),
        },
        {
          find: `@starwind-ui/vue/${primitive}`,
          replacement: path.join(repoRoot, `packages/vue/src/${primitive}/index.ts`),
        },
      ]),
    ],
  };
  const vueSfcPlugin = {
    enforce: "pre" as const,
    name: `starwind-vue-${component}-test-sfc`,
    async transform(source: string, id: string) {
      if (!id.split("?")[0]?.endsWith(".vue")) return;
      return ts.transpileModule(compileVueSfc(source, id), {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          sourceMap: true,
          target: ts.ScriptTarget.ES2022,
        },
        fileName: id,
      }).outputText;
    },
  };

  return defineConfig({
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
    },
    plugins: [vueSfcPlugin],
    optimizeDeps: { include: ["vue", "vue/server-renderer"] },
    resolve,
    root: repoRoot,
    test: {
      projects: [
        {
          plugins: [vueSfcPlugin],
          resolve,
          test: {
            environment: "node",
            include: [`packages/vue/tests/${component}/**/*.ssr.test.ts`],
            name: "ssr",
          },
        },
        {
          cacheDir: path.join(repoRoot, "node_modules/.vite/vue-browser", component),
          optimizeDeps: { include: ["vue", "vue/server-renderer"] },
          plugins: [vueSfcPlugin],
          resolve,
          test: {
            browser: {
              enabled: true,
              headless: true,
              instances: [{ browser: "chromium" }],
              provider: playwright({ launchOptions: { channel: "chromium" } }),
            },
            include: [`packages/vue/tests/${component}/**/*.browser.test.ts`],
            name: "browser",
          },
        },
      ],
    },
  });
}

function countValues(values: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function duplicates(counts: ReadonlyMap<string, number>): string[] {
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort();
}
