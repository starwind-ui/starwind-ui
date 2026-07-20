import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { compileScript, compileTemplate, parse } from "@vue/compiler-sfc";

import {
  collapsibleRuntimeAdapterContract,
  comboboxRuntimeAdapterContract,
  menuRuntimeAdapterContract,
  navigationMenuRuntimeAdapterContract,
  toggleRuntimeAdapterContract,
} from "./contracts/primitive/representatives.js";
import {
  buildGenericAdapterPlan,
  printFutureFrameworkTracerPlan,
} from "./renderers/generic-adapter-plan/index.js";
import {
  buildComboboxSpecializedAdapterSpec,
  buildMenuSpecializedAdapterSpec,
  buildNavigationMenuSpecializedAdapterSpec,
  printFutureSpecializedAdapterSpecFixture,
} from "./renderers/specialized-adapter-spec/index.js";
import {
  printFrameworkAdapterConformanceFixture,
  vueFrameworkAdapter,
} from "./renderers/framework-adapters/index.js";

export const VUE_CONTRACT_FIXTURE_PATHS = [
  "__future-fixtures/vue/conformance/ConformanceRoot.vue",
  "__future-fixtures/vue/conformance/normalizeConformanceValue.ts",
  "__future-fixtures/vue/toggle/ToggleRoot.vue",
  "__future-fixtures/vue/collapsible/CollapsibleRoot.vue",
  "__future-fixtures/vue/collapsible/CollapsibleTrigger.vue",
  "__future-fixtures/vue/collapsible/CollapsiblePanel.vue",
  "__future-fixtures/vue/combobox/ComboboxRoot.vue",
  "__future-fixtures/vue/combobox/ComboboxLabel.vue",
  "__future-fixtures/vue/combobox/ComboboxInputGroup.vue",
  "__future-fixtures/vue/combobox/ComboboxInput.vue",
  "__future-fixtures/vue/combobox/ComboboxTrigger.vue",
  "__future-fixtures/vue/combobox/ComboboxIcon.vue",
  "__future-fixtures/vue/combobox/ComboboxClear.vue",
  "__future-fixtures/vue/combobox/ComboboxValue.vue",
  "__future-fixtures/vue/combobox/ComboboxPortal.vue",
  "__future-fixtures/vue/combobox/ComboboxPositioner.vue",
  "__future-fixtures/vue/combobox/ComboboxPopup.vue",
  "__future-fixtures/vue/combobox/ComboboxEmpty.vue",
  "__future-fixtures/vue/combobox/ComboboxList.vue",
  "__future-fixtures/vue/combobox/ComboboxGroup.vue",
  "__future-fixtures/vue/combobox/ComboboxGroupLabel.vue",
  "__future-fixtures/vue/combobox/ComboboxItem.vue",
  "__future-fixtures/vue/combobox/ComboboxItemText.vue",
  "__future-fixtures/vue/combobox/ComboboxItemIndicator.vue",
  "__future-fixtures/vue/combobox/ComboboxSeparator.vue",
  "__future-fixtures/vue/combobox/index.ts",
  "__future-fixtures/vue/combobox/ComboboxContext.ts",
  "__future-fixtures/vue/menu/MenuRoot.vue",
  "__future-fixtures/vue/menu/MenuTrigger.vue",
  "__future-fixtures/vue/menu/MenuPortal.vue",
  "__future-fixtures/vue/menu/MenuPositioner.vue",
  "__future-fixtures/vue/menu/MenuPopup.vue",
  "__future-fixtures/vue/menu/MenuItem.vue",
  "__future-fixtures/vue/menu/MenuLinkItem.vue",
  "__future-fixtures/vue/menu/MenuCheckboxItem.vue",
  "__future-fixtures/vue/menu/MenuCheckboxItemIndicator.vue",
  "__future-fixtures/vue/menu/MenuRadioGroup.vue",
  "__future-fixtures/vue/menu/MenuRadioItem.vue",
  "__future-fixtures/vue/menu/MenuRadioItemIndicator.vue",
  "__future-fixtures/vue/menu/MenuGroup.vue",
  "__future-fixtures/vue/menu/MenuLabel.vue",
  "__future-fixtures/vue/menu/MenuSeparator.vue",
  "__future-fixtures/vue/menu/MenuShortcut.vue",
  "__future-fixtures/vue/menu/MenuSubmenuRoot.vue",
  "__future-fixtures/vue/menu/MenuSubmenuTrigger.vue",
  "__future-fixtures/vue/menu/index.ts",
  "__future-fixtures/vue/menu/MenuContext.ts",
  "__future-fixtures/vue/navigation-menu/NavigationMenuRoot.vue",
  "__future-fixtures/vue/navigation-menu/NavigationMenuList.vue",
  "__future-fixtures/vue/navigation-menu/NavigationMenuItem.vue",
  "__future-fixtures/vue/navigation-menu/NavigationMenuTrigger.vue",
  "__future-fixtures/vue/navigation-menu/NavigationMenuIcon.vue",
  "__future-fixtures/vue/navigation-menu/NavigationMenuContent.vue",
  "__future-fixtures/vue/navigation-menu/NavigationMenuLink.vue",
  "__future-fixtures/vue/navigation-menu/NavigationMenuPortal.vue",
  "__future-fixtures/vue/navigation-menu/NavigationMenuPositioner.vue",
  "__future-fixtures/vue/navigation-menu/NavigationMenuPopup.vue",
  "__future-fixtures/vue/navigation-menu/NavigationMenuViewport.vue",
  "__future-fixtures/vue/navigation-menu/NavigationMenuArrow.vue",
  "__future-fixtures/vue/navigation-menu/index.ts",
  "__future-fixtures/vue/navigation-menu/NavigationMenuContext.ts",
] as const;

export const VUE_CONTRACT_COMPILE_HARNESS_PATHS = [
  "__future-fixtures/vue/conformance/ConformanceConsumer.vue",
  "__future-fixtures/vue/conformance/runtime.ts",
] as const;

const VUE_CONTRACT_COMPILE_HARNESS_FILES = [
  {
    path: VUE_CONTRACT_COMPILE_HARNESS_PATHS[0],
    contents: `<script setup lang="ts">
import ConformanceRoot from "./ConformanceRoot.vue";
import { normalizeConformanceValue } from "./normalizeConformanceValue";

const props = defineProps<{ value?: string }>();
const normalizedValue = normalizeConformanceValue(props.value);

function onValueChange(
  value: string,
  detail: { readonly isCanceled: boolean; cancel(): void; value: string },
): void {
  if (detail.value !== value) detail.cancel();
}

function onModelUpdate(value: string): void {
  normalizeConformanceValue(value);
}
</script>

<template>
  <ConformanceRoot
    :model-value="normalizedValue"
    :disabled="false"
    tone="strong"
    @value-change="onValueChange"
    @update:model-value="onModelUpdate"
  >
    <template #default>Semantic control</template>
    <template #overlay>Overlay content</template>
  </ConformanceRoot>
</template>
`,
  },
  {
    path: VUE_CONTRACT_COMPILE_HARNESS_PATHS[1],
    contents: `export type ConformanceOptions = Readonly<{
  value: string;
  onValueChange?: (event: Event) => void;
}>;

export type ConformanceInstance = Readonly<{
  destroy(): void;
  setValue(value: string, options: Readonly<{ emit: false }>): void;
}>;

export function createConformance(
  element: Element,
  options: ConformanceOptions,
): ConformanceInstance {
  void element;
  void options;
  return {
    destroy() {},
    setValue() {},
  };
}
`,
  },
] as const satisfies readonly VueContractFixtureFile[];

type VueContractFixtureFile = Readonly<{ contents: string; path: string }>;

export function createVueContractFixtureFiles(): VueContractFixtureFile[] {
  const files = createVueContractFixtureFilesUnchecked();

  const paths = files.map((file) => file.path);
  if (new Set(paths).size !== paths.length) {
    throw new Error("Vue contract fixture paths must be unique.");
  }
  if (JSON.stringify(paths) !== JSON.stringify(VUE_CONTRACT_FIXTURE_PATHS)) {
    throw new Error(
      `Vue contract fixture set drifted. Expected ${VUE_CONTRACT_FIXTURE_PATHS.join(", ")}; received ${paths.join(", ")}.`,
    );
  }

  return files;
}

function createVueContractFixtureFilesUnchecked(): VueContractFixtureFile[] {
  return [
    ...printFrameworkAdapterConformanceFixture(vueFrameworkAdapter)
      .filter((file) =>
        ["conformance/ConformanceRoot.vue", "conformance/normalizeConformanceValue.ts"].includes(
          file.path,
        ),
      )
      .map((file) => ({
        ...file,
        path: `__future-fixtures/vue/${file.path}`,
      })),
    ...printFutureFrameworkTracerPlan("vue", buildGenericAdapterPlan(toggleRuntimeAdapterContract)),
    ...printFutureFrameworkTracerPlan(
      "vue",
      buildGenericAdapterPlan(collapsibleRuntimeAdapterContract),
    ),
    ...printFutureSpecializedAdapterSpecFixture(
      "vue",
      buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract),
    ),
    ...printFutureSpecializedAdapterSpecFixture(
      "vue",
      buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract),
    ),
    ...printFutureSpecializedAdapterSpecFixture(
      "vue",
      buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract),
    ),
  ];
}

type VueContractGateOptions = Readonly<{
  compile?: (fixtureRoot: string, tsconfigPath: string, repoRoot: string) => void;
  fixtureParent?: string;
  repoRoot?: string;
}>;

export async function runVueContractGate(options: VueContractGateOptions = {}): Promise<void> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const fixtureParent = options.fixtureParent ?? path.join(repoRoot, ".scratch");
  await mkdir(fixtureParent, { recursive: true });
  const fixtureRoot = await mkdtemp(path.join(fixtureParent, "vue-contract-"));

  try {
    const files = createVueContractFixtureFiles();

    for (const file of files) {
      const outputPath = path.join(fixtureRoot, file.path);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, file.contents, "utf8");
    }
    for (const file of VUE_CONTRACT_COMPILE_HARNESS_FILES) {
      const outputPath = path.join(fixtureRoot, file.path);
      await writeFile(outputPath, file.contents, "utf8");
    }

    compileSyntheticConformanceFixture(files);
    const tsconfigPath = path.join(fixtureRoot, "tsconfig.json");
    await writeFile(
      tsconfigPath,
      `${JSON.stringify(
        {
          compilerOptions: {
            baseUrl: repoRoot.replaceAll("\\", "/"),
            lib: ["DOM", "DOM.Iterable", "ES2022"],
            module: "ESNext",
            moduleResolution: "Bundler",
            noEmit: true,
            paths: {
              "@starwind-ui/runtime/conformance": ["__future-fixtures/vue/conformance/runtime.ts"],
              "@starwind-ui/runtime/*": ["packages/runtime/src/components/*/index.ts"],
            },
            strict: true,
            target: "ES2022",
          },
          include: [
            "__future-fixtures/vue/collapsible/**/*.vue",
            "__future-fixtures/vue/combobox/**/*.{ts,vue}",
            "__future-fixtures/vue/conformance/**/*.{ts,vue}",
            "__future-fixtures/vue/menu/**/*.{ts,vue}",
            "__future-fixtures/vue/navigation-menu/**/*.{ts,vue}",
            "__future-fixtures/vue/toggle/**/*.vue",
          ],
          vueCompilerOptions: {
            dataAttributes: ["data-*"],
            strictTemplates: true,
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    (options.compile ?? compileVueContractFixtures)(fixtureRoot, tsconfigPath, repoRoot);
  } finally {
    await rm(fixtureRoot, { force: true, recursive: true });
  }
}

function compileSyntheticConformanceFixture(files: readonly VueContractFixtureFile[]): void {
  const component = files.find((file) => file.path.endsWith("/conformance/ConformanceRoot.vue"));
  if (!component) throw new Error("Vue contract gate requires synthetic ConformanceRoot.vue.");

  const parsed = parse(component.contents, { filename: "ConformanceRoot.vue" });
  if (parsed.errors.length > 0) {
    throw new Error(`Vue synthetic SFC parse failed: ${parsed.errors.map(String).join("\n")}`);
  }
  compileScript(parsed.descriptor, { id: "vue-contract-conformance" });
  const template = compileTemplate({
    filename: "ConformanceRoot.vue",
    id: "vue-contract-conformance",
    source: parsed.descriptor.template?.content ?? "",
  });
  if (template.errors.length > 0) {
    throw new Error(
      `Vue synthetic template compile failed: ${template.errors.map(String).join("\n")}`,
    );
  }
}

function compileVueContractFixtures(
  _fixtureRoot: string,
  tsconfigPath: string,
  repoRoot: string,
): void {
  const vueTsc = path.join(repoRoot, "node_modules", "vue-tsc", "bin", "vue-tsc.js");
  const result = spawnSync(process.execPath, [vueTsc, "--noEmit", "-p", tsconfigPath], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Vue tracer SFC typecheck failed with exit code ${String(result.status)}.`);
  }
}

const entryPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined;
if (entryPath === import.meta.url) await runVueContractGate();
