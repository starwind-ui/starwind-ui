import { readdir, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  compileVueSfc,
  createVueEntryPoints,
  vueEntryPoints,
} from "../../../../packages/vue/tsup.config.js";
import {
  formatVueInventoryDiagnostics,
  validateVueInventorySnapshot,
} from "../../../../packages/vue/scripts/validate-inventory.mjs";
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

describe("internal Vue package foundation", () => {
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
    const targetReadme = (
      await readFile("scripts/portable-runtime/renderers/framework-adapters/vue/README.md", "utf8")
    ).replace(/\s+/g, " ");
    expect(targetReadme).toContain(
      "The current Primitive surface contains Accordion, Alert Dialog, Avatar, Button, Carousel, Checkbox, Checkbox Group, Collapsible, Color Picker, Combobox, Context Menu, Dialog, Drawer, Dropzone, Field, Fieldset, Form, Input, Input OTP, Menu, Navigation Menu, Popover, Preview Card, Progress, Radio, Radio Group, Scroll Area, Select, Sidebar, Slider, Switch, Tabs, Toast, Toggle, Toggle Group, Tooltip, and the manual Theme facade.",
    );
    expect(targetReadme).toContain(
      "The complete private Styled surface contains 54 portable roots exactly once: Accordion, Alert Dialog, Avatar, Button, Carousel, Checkbox, Checkbox Group, Collapsible, Combobox, Color Picker, Context Menu, Dialog, Dropzone, Dropdown, Field, Sheet, Form, Hover Card, Input, Input OTP, Navigation Menu, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Sidebar, Slider, Switch, Tabs, Theme Toggle, Toast, Toggle, Toggle Group, Tooltip, Alert, Aspect Ratio, Badge, Breadcrumb, Button Group, Card, Input Group, Item, Kbd, Label, Native Select, Pagination, Prose, Skeleton, Spinner, Table, Textarea, and Video. Image is the sole excluded Styled contract because it is Astro-only.",
    );
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

  it("pins the exact generated source file inventory for the private cohort", async () => {
    expect(
      (await readdir("packages/vue/src", { recursive: true, withFileTypes: true }))
        .filter((entry) => entry.isFile())
        .map((entry) => `${entry.parentPath.replaceAll("\\", "/")}/${entry.name}`)
        .map((file) => file.replace(/^packages\/vue\/src\//, ""))
        .sort(),
    ).toEqual(vueGeneratedSourceFiles);
  });

  it("pins an internal package with exact ESM and declaration exports", async () => {
    const packageJson = JSON.parse(await readFile("packages/vue/package.json", "utf8"));
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
    expect(packageJson.private).toBe(true);
    expect(packageJson.type).toBe("module");
    expect(packageJson.exports).toEqual(vuePackageExports);
    for (const contract of Object.values(packageJson.exports) as Array<{
      import: string;
      types: string;
    }>) {
      expect(contract.import).toMatch(/^\.\/dist\/.+\.js$/);
      expect(contract.types).toMatch(/^\.\/dist\/.+\.d\.ts$/);
    }
    expect(packageJson.dependencies).toEqual({ "@starwind-ui/runtime": "workspace:*" });
    expect(packageJson.peerDependencies).toEqual({ vue: ">=3.5" });
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

  it("does not expose Vue through current public support or release generation", async () => {
    expect(vueFrameworkAdapterTarget.publicSupport).toEqual({
      cliRegistry: false,
      demoIntegration: false,
      packageExports: false,
      publicDocsClaim: false,
      status: "non-shipping-tracer",
    });

    const rootPackage = JSON.parse(await readFile("package.json", "utf8"));
    expect(rootPackage.scripts["runtime:generate:all"]).not.toContain("vue");
    expect(rootPackage.scripts["release:prepare"]).not.toContain("vue");
    expect(rootPackage.scripts["release:artifacts"]).not.toContain("vue");

    const changesetConfig = JSON.parse(await readFile(".changeset/config.json", "utf8"));
    expect(changesetConfig.ignore).toEqual(
      expect.arrayContaining(["vue-demo", "@starwind-ui/vue"]),
    );

    const vueDemoPackage = JSON.parse(await readFile("apps/vue-demo/package.json", "utf8"));
    expect(vueDemoPackage.private).toBe(true);
    const cliPackage = JSON.parse(await readFile("packages/cli/package.json", "utf8"));
    expect(JSON.stringify(cliPackage)).not.toContain("@starwind-ui/vue");

    const publicRegistryFiles = (
      await readdir("packages/cli/src/registry", { recursive: true, withFileTypes: true })
    ).filter((entry) => entry.isFile());
    for (const entry of publicRegistryFiles) {
      const registryFile = `${entry.parentPath.replaceAll("\\", "/")}/${entry.name}`;
      expect(registryFile).not.toMatch(/(?:^|\/)vue(?:\/|$)/);
      expect(await readFile(registryFile, "utf8")).not.toContain("@starwind-ui/vue");
    }
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
