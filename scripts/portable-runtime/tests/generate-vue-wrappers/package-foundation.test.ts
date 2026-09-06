import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  formatVueInventoryDiagnostics,
  validateVueInventorySnapshot,
} from "../../../../packages/vue/scripts/validate-inventory.mjs";

import {
  compileVueSfc,
  createVueEntryPoints,
  vueEntryPoints,
} from "../../../../packages/vue/tsup.config.js";
import { vueFrameworkAdapterTarget } from "../../renderers/framework-adapters/vue/index.js";
import {
  assertVueInventorySnapshot,
  vueAdapterInventory,
  vueBuildEntryPoints,
  vueGeneratedSourceFiles,
  vuePackageExports,
  vuePackageSubpaths,
  vuePrimitiveComponents,
  vueStyledComponents,
} from "../../renderers/framework-adapters/vue/inventory.js";
import { hasPrivateSvelte } from "../workspace-support.js";

describe("Vue package foundation", () => {
  it("derives every executable Vue projection from one typed inventory", async () => {
    expect(vueAdapterInventory.runtimePrimitives.map(({ component }) => component)).toEqual([
      "accordion",
      "alert-dialog",
      "avatar",
      "button",
      "carousel",
      "checkbox",
      "checkbox-group",
      "collapsible",
      "color-picker",
      "combobox",
      "context-menu",
      "dialog",
      "drawer",
      "dropzone",
      "field",
      "fieldset",
      "form",
      "input",
      "input-otp",
      "menu",
      "navigation-menu",
      "popover",
      "preview-card",
      "progress",
      "radio",
      "radio-group",
      "scroll-area",
      "select",
      "sidebar",
      "slider",
      "switch",
      "tabs",
      "toast",
      "toggle",
      "toggle-group",
      "tooltip",
    ]);
    expect(vueAdapterInventory.manualFacades.map(({ component }) => component)).toEqual(["theme"]);
    expect(vuePrimitiveComponents).toEqual([
      "accordion",
      "alert-dialog",
      "avatar",
      "button",
      "carousel",
      "checkbox",
      "checkbox-group",
      "collapsible",
      "color-picker",
      "combobox",
      "context-menu",
      "dialog",
      "drawer",
      "dropzone",
      "field",
      "fieldset",
      "form",
      "input",
      "input-otp",
      "menu",
      "navigation-menu",
      "popover",
      "preview-card",
      "progress",
      "radio",
      "radio-group",
      "scroll-area",
      "select",
      "sidebar",
      "slider",
      "switch",
      "tabs",
      "toast",
      "toggle",
      "toggle-group",
      "tooltip",
      "theme",
    ]);
    expect(vueStyledComponents).toEqual([
      "accordion",
      "alert-dialog",
      "avatar",
      "button",
      "carousel",
      "checkbox",
      "checkbox-group",
      "collapsible",
      "combobox",
      "color-picker",
      "context-menu",
      "dialog",
      "dropzone",
      "dropdown",
      "field",
      "sheet",
      "form",
      "hover-card",
      "input",
      "input-otp",
      "navigation-menu",
      "popover",
      "progress",
      "radio-group",
      "scroll-area",
      "select",
      "separator",
      "sidebar",
      "slider",
      "switch",
      "tabs",
      "theme-toggle",
      "toast",
      "toggle",
      "toggle-group",
      "tooltip",
      "alert",
      "aspect-ratio",
      "badge",
      "breadcrumb",
      "button-group",
      "card",
      "input-group",
      "item",
      "kbd",
      "label",
      "native-select",
      "pagination",
      "prose",
      "skeleton",
      "spinner",
      "table",
      "textarea",
      "video",
    ]);
    expect(vuePackageSubpaths.map(({ subpath }) => subpath)).toEqual([
      ".",
      "./accordion",
      "./alert-dialog",
      "./avatar",
      "./button",
      "./carousel",
      "./checkbox",
      "./checkbox-group",
      "./collapsible",
      "./color-picker",
      "./combobox",
      "./context-menu",
      "./dialog",
      "./drawer",
      "./dropzone",
      "./field",
      "./fieldset",
      "./form",
      "./input",
      "./input-otp",
      "./menu",
      "./navigation-menu",
      "./popover",
      "./preview-card",
      "./progress",
      "./radio",
      "./radio-group",
      "./scroll-area",
      "./select",
      "./sidebar",
      "./slider",
      "./switch",
      "./tabs",
      "./toast",
      "./toggle",
      "./toggle-group",
      "./tooltip",
      "./theme",
    ]);
    expect(vuePackageExports).toEqual(
      Object.fromEntries(
        vuePackageSubpaths.map(({ exportTarget, subpath }) => [subpath, exportTarget]),
      ),
    );
    expect(vueGeneratedSourceFiles).toContain("alert-dialog/AlertDialogRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("accordion/AccordionRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("tabs/TabsRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("select/SelectRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("sidebar/SidebarProvider.vue");
    expect(vueGeneratedSourceFiles).toContain("slider/SliderRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("checkbox-group/CheckboxGroupRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("collapsible/CollapsibleRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("color-picker/ColorPickerRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("combobox/ComboboxRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("context-menu/ContextMenuRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("dialog/DialogRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("drawer/DrawerRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("fieldset/FieldsetRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("form/FormRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("input/InputRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("menu/MenuRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("navigation-menu/NavigationMenuRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("popover/PopoverRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("toggle/ToggleRoot.vue");
    expect(vueGeneratedSourceFiles).toContain("toggle-group/ToggleGroupRoot.vue");
  });

  it("reports actionable subpath, condition-key, path, and source inventory drift", () => {
    const packageExports = structuredClone(vuePackageExports);
    delete packageExports["./button"];
    packageExports["./extra"] = {
      import: "./dist/extra.js",
      types: "./dist/extra.d.ts",
    };
    packageExports["./select"] = {
      import: "./dist/select/wrong.js",
      types: "./dist/select/index.d.ts",
    };
    Reflect.deleteProperty(packageExports["./checkbox"]!, "types");
    (packageExports["./progress"] as Record<string, string>).default = "./dist/progress/index.js";

    const driftedSnapshot = {
      packageExports,
      sourceFiles: vueGeneratedSourceFiles
        .filter((file) => file !== "button/ButtonRoot.vue")
        .concat("extra/Unexpected.vue"),
    };
    const diagnostics = validateVueInventorySnapshot(driftedSnapshot);

    expect(diagnostics).toEqual({
      packageExports: {
        conditionKeysMissing: ["./checkbox: types"],
        conditionKeysUnexpected: ["./progress: default"],
        extra: ["./extra"],
        mismatched: [
          './select import: expected "./dist/select/index.js", received "./dist/select/wrong.js"',
        ],
        missing: ["./button"],
      },
      sourceFiles: {
        extra: ["extra/Unexpected.vue"],
        missing: ["button/ButtonRoot.vue"],
      },
    });
    expect(formatVueInventoryDiagnostics(diagnostics)).toContain(
      "Vue adapter inventory drift detected",
    );
    expect(formatVueInventoryDiagnostics(diagnostics)).toContain(
      "package exports missing: ./button",
    );
    expect(formatVueInventoryDiagnostics(diagnostics)).toContain(
      "package export condition keys missing: ./checkbox: types",
    );
    expect(formatVueInventoryDiagnostics(diagnostics)).toContain(
      "package export condition keys unexpected: ./progress: default",
    );
    expect(formatVueInventoryDiagnostics(diagnostics)).toContain(
      "generated source files extra: extra/Unexpected.vue",
    );
    expect(() => assertVueInventorySnapshot(driftedSnapshot)).toThrow(
      "package export condition keys unexpected: ./progress: default",
    );
  });

  it("pins the exact generated source file inventory for the public-beta cohort", async () => {
    expect(
      (await readdir("packages/vue/src", { recursive: true, withFileTypes: true }))
        .filter((entry) => entry.isFile())
        .map((entry) => `${entry.parentPath.replaceAll("\\", "/")}/${entry.name}`)
        .map((file) => file.replace(/^packages\/vue\/src\//, ""))
        .sort(),
    ).toEqual(vueGeneratedSourceFiles);
  });

  it("pins a public-beta package with exact ESM and declaration exports", async () => {
    const [packageJson, runtimePackageJson] = await Promise.all([
      readFile("packages/vue/package.json", "utf8").then(JSON.parse),
      readFile("packages/runtime/package.json", "utf8").then(JSON.parse),
    ]);
    const packageMetadataSources =
      vueFrameworkAdapterTarget.cliRegistry.packageMetadataSources ?? [];

    expect(packageMetadataSources).toEqual([
      "packages/vue/package.json",
      "packages/runtime/package.json",
      "apps/vue-demo/package.json",
    ]);
    expect(new Set(packageMetadataSources).size).toBe(packageMetadataSources.length);
    await expect(
      Promise.all(packageMetadataSources.map((source) => readFile(source, "utf8"))),
    ).resolves.toHaveLength(3);

    expect(packageJson.name).toBe("@starwind-ui/vue");
    expect(packageJson.private).toBeUndefined();
    expect(packageJson.description).toContain("Public-beta Vue 3.5");
    expect(packageJson.type).toBe("module");
    expect(packageJson.exports).toEqual(vuePackageExports);
    for (const contract of Object.values(packageJson.exports) as Array<{
      import: string;
      types: string;
    }>) {
      expect(contract.import).toMatch(/^\.\/dist\/.+\.js$/);
      expect(contract.types).toMatch(/^\.\/dist\/.+\.d\.ts$/);
    }
    expect(packageJson.dependencies).toEqual({
      "@starwind-ui/runtime": runtimePackageJson.version,
    });
    expect(packageJson.peerDependencies).toEqual({ vue: ">=3.5" });

    const readme = await readFile("packages/vue/README.md", "utf8");
    expect(readme).toContain("public beta");
    expect(readme).toContain("Vue 3.5 or newer");
    expect(readme).toContain("@starwind-ui/vue@beta");
    expect(readme).not.toMatch(/\bstable support\b/i);
  });

  it("uses exact multi-entry precompiled output with Vue and Runtime externalized", async () => {
    expect(createVueEntryPoints()).toEqual(vueBuildEntryPoints);
    expect(vueEntryPoints).toEqual(vueBuildEntryPoints);

    const config = await readFile("packages/vue/tsup.config.ts", "utf8");
    expect(config).toContain('from "vue/compiler-sfc"');
    expect(config).toContain(
      'external: ["@starwind-ui/runtime", /^@starwind-ui\\/runtime\\//, "vue"]',
    );
    expect(config).toContain("dts: false");
    expect(config).not.toContain("vue/dist/vue.esm-bundler");
  });

  it("compiles production render ownership inline with compact runtime props", () => {
    const output = compileVueSfc(representativeCompilerFixture, "/fixture/Representative.vue");

    expect(output).toContain("const __sfc__ = /*@__PURE__*/_defineComponent({");
    expect(output).toContain("return (_ctx: any,_cache: any) => {");
    expect(output).not.toContain("function render(");
    expect(output).not.toContain("__sfc__.render = render");
    expect(output).toContain('label: { default: "Save" }');
    expect(output).toContain("count: { default: 1 }");
    expect(output).toContain("active: { type: Boolean }");
    expect(output).not.toContain("type: String");
    expect(output).not.toContain("type: Number");
    expect(output).toMatch(/from ["']vue["']/);
    expect(output).not.toMatch(/vue\/compiler-sfc|vue\.esm-bundler|\bcompile\s*\(/);
  });

  it("exposes Vue as public beta through public generation and release verification", async () => {
    const vuePackageJson = JSON.parse(await readFile("packages/vue/package.json", "utf8"));
    expect(vueFrameworkAdapterTarget.publicSupport).toEqual({
      cliRegistry: true,
      demoIntegration: true,
      packageExports: true,
      publicDocsClaim: true,
      status: "public-beta",
    });

    const rootPackage = JSON.parse(await readFile("package.json", "utf8"));
    expect(rootPackage.scripts["runtime:generate:all"]).toContain("pnpm runtime:generate:vue");
    expect(rootPackage.scripts["build:public"]).toContain("--filter=@starwind-ui/vue");
    expect(rootPackage.scripts["typecheck:public"]).toContain("--filter=@starwind-ui/vue");
    expect(rootPackage.scripts["test:all"]).toContain("pnpm vue:test");
    expect(rootPackage.scripts["release:prepare"]).toContain("pnpm runtime:generate:all");
    expect(rootPackage.scripts["release:prepare"]).toContain("pnpm runtime:registry:generate");
    expect(rootPackage.scripts["release:gate"]).toContain("pnpm vue-demo:smoke");
    expect(rootPackage.scripts["release:gate"]).toContain("pnpm runtime:size:check:prepared");
    expect(
      rootPackage.scripts["release:gate"].includes("pnpm runtime:perf:vue:evidence:check"),
    ).toBe(hasPrivateSvelte);
    expect(rootPackage.scripts["release:gate"]).toContain("pnpm release:candidate:acceptance");

    const changesetConfig = JSON.parse(await readFile(".changeset/config.json", "utf8"));
    expect(changesetConfig.fixed).toEqual([
      ["@starwind-ui/runtime", "@starwind-ui/astro", "@starwind-ui/react"],
    ]);
    expect(changesetConfig.ignore).toContain("vue-demo");
    expect(changesetConfig.ignore.includes("@starwind-ui/svelte")).toBe(hasPrivateSvelte);
    expect(changesetConfig.ignore).not.toContain("@starwind-ui/vue");

    const vueDemoPackage = JSON.parse(await readFile("apps/vue-demo/package.json", "utf8"));
    expect(vueDemoPackage.private).toBe(true);
    if (hasPrivateSvelte) {
      const sveltePackage = JSON.parse(await readFile("packages/svelte/package.json", "utf8"));
      expect(sveltePackage.private).toBe(true);
    }
    expect(rootPackage.scripts["runtime:generate:all"]).not.toContain("svelte");
    expect(rootPackage.scripts["build:public"]).not.toContain("svelte");
    expect(rootPackage.scripts["typecheck:public"]).not.toContain("svelte");

    const bundledRegistry = JSON.parse(
      await readFile("packages/cli/src/registry/bundled-registry.json", "utf8"),
    );
    expect(bundledRegistry.setup.vue).toEqual({
      adapterPackage: { name: "@starwind-ui/vue", range: vuePackageJson.version },
      packageRequirements: [{ name: "vue", range: ">=3.5" }],
    });
    const vueRegistryComponents = bundledRegistry.components.filter(
      (component: { targets: Record<string, unknown> }) => component.targets.vue,
    );
    expect(vueRegistryComponents.map(({ name }: { name: string }) => name).sort()).toEqual(
      [...vueStyledComponents].sort(),
    );
    for (const component of vueRegistryComponents) {
      expect(component.targets.vue.packageRequirements).toEqual(
        expect.arrayContaining([{ name: "@starwind-ui/vue", range: vuePackageJson.version }]),
      );
      expect(component.targets.svelte).toBeUndefined();
    }

    const primitiveRegistry = JSON.parse(
      await readFile("packages/cli/src/registry/primitive-vendoring-artifacts.json", "utf8"),
    );
    const vueRegistryPrimitives = primitiveRegistry.primitives.filter(
      (primitive: { framework: string }) => primitive.framework === "vue",
    );
    expect(
      vueRegistryPrimitives.map(({ component }: { component: string }) => component).sort(),
    ).toEqual(vueAdapterInventory.runtimePrimitives.map(({ component }) => component).sort());
    expect(
      primitiveRegistry.primitives.some(
        (primitive: { framework: string }) => primitive.framework === "svelte",
      ),
    ).toBe(false);
  });
});

const representativeCompilerFixture = `<script setup lang="ts">
import { ref, useAttrs } from "vue";

interface Props {
  label?: string;
  count?: number;
  active?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: "Save",
  count: 1,
});
const attrs = useAttrs();
const element = ref<HTMLButtonElement>();
defineExpose({ element });
</script>

<template>
  <button ref="element" v-bind="attrs" :data-count="props.count" :data-active="props.active">
    <slot>{{ props.label }}</slot>
    <slot name="suffix" />
  </button>
</template>
`;
