import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  getPrimitiveFrameworkAdapterTargetNames,
  primitiveFrameworkAdapterTargets,
} from "../renderers/framework-adapters/index.js";
import {
  type PrimitiveGeneratorSource,
  primitiveGeneratorRegistry,
} from "../renderers/primitive-generator-registry.js";
import { PRIMITIVE_COMPONENTS, PRIMITIVE_HELPER_EXPORTS } from "../renderers/primitive-index.js";
import { getPrimitiveInventoryEntry } from "../renderers/primitive-inventory.js";

const SCRIPT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const RUNTIME_INTERNAL_CONTRACT_IMPORT = ["packages/runtime", "src/internal/contracts"].join("/");
const PRIMITIVE_AGGREGATOR_LINE_BUDGET =
  PRIMITIVE_COMPONENTS.length * 3 + PRIMITIVE_HELPER_EXPORTS.length + 5;
const PRIMITIVE_GENERATOR_SOURCE_BY_COMPONENT = {
  accordion: "specialized-adapter-spec",
  "alert-dialog": "adapter-family-plan",
  avatar: "adapter-family-plan",
  button: "adapter-family-plan",
  carousel: "specialized-adapter-spec",
  checkbox: "adapter-family-plan",
  "checkbox-group": "adapter-family-plan",
  collapsible: "adapter-family-plan",
  combobox: "specialized-adapter-spec",
  "color-picker": "specialized-adapter-spec",
  "context-menu": "specialized-adapter-spec",
  dialog: "adapter-family-plan",
  drawer: "adapter-family-plan",
  dropzone: "specialized-adapter-spec",
  field: "specialized-adapter-spec",
  fieldset: "adapter-family-plan",
  form: "adapter-family-plan",
  input: "adapter-family-plan",
  "input-otp": "specialized-adapter-spec",
  menu: "specialized-adapter-spec",
  "navigation-menu": "specialized-adapter-spec",
  popover: "adapter-family-plan",
  "preview-card": "specialized-adapter-spec",
  progress: "adapter-family-plan",
  radio: "adapter-family-plan",
  "radio-group": "adapter-family-plan",
  "scroll-area": "adapter-family-plan",
  select: "specialized-adapter-spec",
  sidebar: "specialized-adapter-spec",
  slider: "specialized-adapter-spec",
  switch: "adapter-family-plan",
  tabs: "specialized-adapter-spec",
  toast: "specialized-adapter-spec",
  toggle: "adapter-family-plan",
  "toggle-group": "adapter-family-plan",
  tooltip: "specialized-adapter-spec",
  theme: "manual",
} satisfies Record<
  (typeof PRIMITIVE_COMPONENTS)[number] | (typeof PRIMITIVE_HELPER_EXPORTS)[number],
  PrimitiveGeneratorSource
>;

const MIGRATED_SPECIALIZED_OUTPUT_MODEL_COMPONENTS = [
  "accordion",
  "carousel",
  "combobox",
  "color-picker",
  "context-menu",
  "dropzone",
  "field",
  "input-otp",
  "menu",
  "navigation-menu",
  "preview-card",
  "select",
  "sidebar",
  "slider",
  "tabs",
  "toast",
  "tooltip",
] as const;

const ROUTE_FREE_SPECIALIZED_COMPONENTS = MIGRATED_SPECIALIZED_OUTPUT_MODEL_COMPONENTS;

const ROUTE_FREE_ADAPTER_FAMILY_COMPONENTS = [
  "alert-dialog",
  "avatar",
  "button",
  "checkbox",
  "checkbox-group",
  "collapsible",
  "dialog",
  "drawer",
  "fieldset",
  "form",
  "input",
  "popover",
  "progress",
  "radio",
  "radio-group",
  "scroll-area",
  "switch",
  "toggle",
  "toggle-group",
] as const;
const ROUTE_FREE_ADAPTER_OUTPUT_COMPONENTS = PRIMITIVE_COMPONENTS;
const ROUTE_FREE_ADAPTER_FAMILY_COMPONENT_SET = new Set<string>(
  ROUTE_FREE_ADAPTER_FAMILY_COMPONENTS,
);
const ROUTE_FREE_SPECIALIZED_COMPONENT_SET = new Set<string>(ROUTE_FREE_SPECIALIZED_COMPONENTS);
const ROUTE_BACKED_PRIMITIVE_COMPONENTS: readonly string[] = [];
const FRAMEWORK_ADAPTER_TARGET_NAMES = ["astro", "react", "solid", "svelte", "vue"] as const;
const FRAMEWORK_ADAPTER_TARGET_NAME_PATTERN = FRAMEWORK_ADAPTER_TARGET_NAMES.join("|");
const FRAMEWORK_ADAPTER_TARGET_HOME_PATTERN = new RegExp(
  `^renderers\\/framework-adapters\\/(?:${FRAMEWORK_ADAPTER_TARGET_NAME_PATTERN})\\/`,
);
const FRAMEWORK_SPECIFIC_CONTAINMENT_EXCEPTIONS: readonly FrameworkSpecificContainmentException[] =
  [];
const FRAMEWORK_SPECIFIC_CONTAINMENT_PATTERNS = [
  {
    label: "target-home import",
    pattern: new RegExp(
      `(?:\\.\\/framework-adapters\\/(?:${FRAMEWORK_ADAPTER_TARGET_NAME_PATTERN})|framework-adapters\\/(?:${FRAMEWORK_ADAPTER_TARGET_NAME_PATTERN})\\/|\\.\\.\\/renderers\\/framework-adapters\\/(?:${FRAMEWORK_ADAPTER_TARGET_NAME_PATTERN}))`,
    ),
  },
  {
    label: "target-prefixed printer/helper",
    pattern: /\b(?:print|render|write)(?:Astro|React)[A-Z]\w*/g,
  },
  {
    label: "target-named registry contract",
    pattern:
      /\b(?:Astro|React|Solid|Svelte|Vue)PrimitiveGenerator\b|\b(?:astro|react|solid|svelte|vue)\s*:/g,
  },
  {
    label: "framework syntax marker",
    pattern:
      /Astro\.props|from "astro\/types"|from "react"|React\.(?:forwardRef|use[A-Z]|createContext|Ref|ReactNode)|useIsomorphicLayoutEffect|astroHeader/g,
  },
] as const;
const SHIPPING_SPECIALIZED_ADAPTER_PROJECTION_PATTERNS = [
  {
    label: "shipping target-scoped output file",
    pattern: new RegExp(`\\btarget:\\s*["'](?:${FRAMEWORK_ADAPTER_TARGET_NAME_PATTERN})["']`, "g"),
  },
  {
    label: "shipping target-specific output extension",
    pattern: /\.tsx["'`]/g,
  },
  {
    label: "shipping target-home import",
    pattern:
      /(?:\.\/framework-adapters\/(?:astro|react)|framework-adapters\/(?:astro|react)\/|\.\.\/renderers\/framework-adapters\/(?:astro|react))/g,
  },
  {
    label: "shipping target-prefixed printer/helper",
    pattern: /\b(?:print|render|write)(?:Astro|React)[A-Z]\w*/g,
  },
  {
    label: "shipping framework syntax marker",
    pattern:
      /Astro\.props|from "astro\/types"|from "react"|React\.(?:forwardRef|use[A-Z]|createContext|Ref|ReactNode)|useIsomorphicLayoutEffect|astroHeader/g,
  },
] as const;
const FUTURE_FRAMEWORK_TRACER_SHARED_PATTERNS = [
  {
    label: "future target-prefixed printer/helper",
    pattern: /\b(?:print|render|write)(?:Solid|Svelte|Vue)[A-Z]\w*/g,
  },
  {
    label: "future target fixture path",
    pattern: /__future-fixtures\/(?:solid|svelte|vue)\/[\w-]+\/[\w./-]+/g,
  },
  {
    label: "future framework syntax marker",
    pattern:
      /from "vue"|from "solid-js(?:\/web)?"|<script setup|<template>|<Teleport|defineProps|defineEmits|onBeforeUnmount|createSignal|onMount|onCleanup|<Dynamic/g,
  },
] as const;
const FUTURE_FRAMEWORK_TRACER_SHIPPING_SURFACE_PATTERNS = [
  {
    label: "future tracer registry import",
    pattern: /future-framework-tracer(?:\.js)?/g,
  },
  {
    label: "future fixture path",
    pattern: /__future-fixtures\/(?:solid|svelte|vue)\//g,
  },
  {
    label: "future package surface",
    pattern: /@starwind-ui\/(?:solid|svelte|vue)/g,
  },
] as const;

type FrameworkSpecificContainmentException = {
  path?: string;
  pathPrefix?: string;
  reason: string;
  review: string;
};

const PRIMITIVE_CONTRACT_COMPONENTS = [
  "accordion",
  "alert-dialog",
  "avatar",
  "button",
  "carousel",
  "checkbox",
  "checkbox-group",
  "combobox",
  "collapsible",
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
  "tooltip",
  "toggle",
  "toggle-group",
] as const;

const STYLED_COMPONENTS = [
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "button-group",
  "carousel",
  "card",
  "checkbox",
  "checkbox-group",
  "combobox",
  "collapsible",
  "color-picker",
  "context-menu",
  "dialog",
  "dropdown",
  "dropzone",
  "field",
  "form",
  "hover-card",
  "image",
  "input",
  "input-group",
  "input-otp",
  "item",
  "kbd",
  "label",
  "native-select",
  "navigation-menu",
  "pagination",
  "popover",
  "progress",
  "prose",
  "radio-group",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "slider",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "theme-toggle",
  "toast",
  "tooltip",
  "toggle",
  "toggle-group",
  "video",
] as const;

describe("portable runtime generator structure", () => {
  it("keeps the layered docs generator behind explicit acyclic pipeline modules", async () => {
    const compatibilityEntrypoint = await readPortableFile("generate-layered-docs-metadata.ts");
    const generatorRoot = path.join(SCRIPT_ROOT, "docs/layered-docs/generator");
    const generatorFiles = (await readFilesRecursively(generatorRoot)).filter((file) =>
      file.relativePath.endsWith(".ts"),
    );

    expect(lineCount(compatibilityEntrypoint)).toBeLessThanOrEqual(250);
    expect(generatorFiles.map((file) => file.relativePath)).toEqual(
      expect.arrayContaining([
        "authored-input.ts",
        "build-metadata.ts",
        "descriptions/primitive-reference.ts",
        "descriptions/setters.ts",
        "index.ts",
        "orchestrate.ts",
        "render-reference.ts",
        "serialize-metadata.ts",
        "validate-metadata.ts",
      ]),
    );

    for (const file of generatorFiles) {
      expect(lineCount(file.source), file.relativePath).toBeLessThanOrEqual(1_200);
    }

    const filesystemWriteOwners = generatorFiles
      .filter((file) => hasFilesystemWriteEffect(file.source))
      .map((file) => file.relativePath);
    expect(filesystemWriteOwners).toEqual(["orchestrate.ts"]);

    for (const relativePath of [
      "render-reference.ts",
      "serialize-metadata.ts",
      "validate-metadata.ts",
    ]) {
      const source = generatorFiles.find((file) => file.relativePath === relativePath)?.source;
      expect(source, relativePath).toBeDefined();
      expect(source, relativePath).not.toContain("/contracts/");
    }

    const authoredInput = generatorFiles.find(
      (file) => file.relativePath === "authored-input.ts",
    )?.source;
    const validation = generatorFiles.find(
      (file) => file.relativePath === "validate-metadata.ts",
    )?.source;
    expect(authoredInput).not.toContain('from "./paths.js"');
    expect(validation).not.toContain('from "./docs-files.js"');
    expect(validation).not.toContain('from "node:fs');

    expect(findRelativeImportCycles(generatorFiles)).toEqual([]);
  });

  it("keeps component target routes out of the primitive renderer helpers", async () => {
    const actualComponents = await readDirectoryNames("renderers/primitives");
    const files = await readFilesRecursively(path.join(SCRIPT_ROOT, "renderers/primitives"));
    const componentTargetRoutes = files
      .map((file) => file.relativePath)
      .filter((relativePath) => /^[^/]+\/(?:astro|react|vue|solid|svelte)\.ts$/.test(relativePath));

    expect(actualComponents).toEqual([...ROUTE_BACKED_PRIMITIVE_COMPONENTS].sort());
    expect(componentTargetRoutes).toEqual([]);
  });

  it("drives primitive wrapper generation through a shared registry", async () => {
    const astroWrapperScript = await readPortableFile("generate-astro-wrappers.ts");
    const reactWrapperScript = await readPortableFile("generate-react-wrappers.ts");
    const primitivePackageGenerator = await readPortableFile(
      "renderers/primitive-package-generator.ts",
    );
    const frameworkWrapperGenerator = await readPortableFile(
      "renderers/framework-wrapper-generator.ts",
    );
    const registry = await readPortableFile("renderers/primitive-generator-registry.ts");
    const manualGenerators = await readPortableFile("renderers/manual-primitive-generators.ts");
    const inventory = await readPortableFile("renderers/primitive-inventory.ts");

    await expectMissingFile("renderers/astro-primitives.ts");
    await expectMissingFile("renderers/react-primitives.ts");
    expect(astroWrapperScript).toContain('generateFrameworkPrimitiveWrappers("astro"');
    expect(reactWrapperScript).toContain('generateFrameworkPrimitiveWrappers("react"');
    expect(frameworkWrapperGenerator).toContain("generatePrimitiveWrappersForTarget");
    expect(astroWrapperScript).not.toContain("renderers/astro-primitives");
    expect(reactWrapperScript).not.toContain("renderers/react-primitives");
    expect(primitivePackageGenerator).toContain("getPrimitiveGeneratorEntries");
    expect(primitivePackageGenerator).not.toContain("framework-adapters/astro");
    expect(primitivePackageGenerator).not.toContain("framework-adapters/react");
    expect(primitivePackageGenerator).toContain("getPrimitiveGeneratorEntries");
    expect(registry).toContain("getRuntimeAdapterPrimitiveInventoryEntries");
    expect(manualGenerators).toContain("getManualHelperPrimitiveInventoryEntries");
    expect(
      primitiveFrameworkAdapterTargets.every(
        (entry) => typeof entry.primitive.generatePackage === "function",
      ),
    ).toBe(true);
    expect(
      lineCount(await readPortableFile("renderers/framework-adapters/astro/primitive-package.ts")),
    ).toBeLessThanOrEqual(PRIMITIVE_AGGREGATOR_LINE_BUDGET);
    expect(
      lineCount(await readPortableFile("renderers/framework-adapters/react/primitive-package.ts")),
    ).toBeLessThanOrEqual(PRIMITIVE_AGGREGATOR_LINE_BUDGET);

    const registryComponents = primitiveGeneratorRegistry.map((entry) => entry.component);
    expect(registryComponents).toEqual([...PRIMITIVE_COMPONENTS, ...PRIMITIVE_HELPER_EXPORTS]);
    expect(new Set(registryComponents).size).toBe(registryComponents.length);
    expect(
      Object.fromEntries(
        primitiveGeneratorRegistry.map((entry) => [entry.component, entry.source]),
      ),
    ).toEqual(PRIMITIVE_GENERATOR_SOURCE_BY_COMPONENT);
    expect(
      primitiveGeneratorRegistry
        .filter((entry) => entry.routeFree?.kind === "adapter-output-model")
        .map((entry) => entry.component),
    ).toEqual([...ROUTE_FREE_ADAPTER_OUTPUT_COMPONENTS]);
    expect(
      primitiveGeneratorRegistry
        .filter((entry) => entry.source === "adapter-family-plan")
        .map((entry) => entry.component),
    ).toEqual([...ROUTE_FREE_ADAPTER_FAMILY_COMPONENTS]);

    for (const component of [...PRIMITIVE_COMPONENTS, ...PRIMITIVE_HELPER_EXPORTS]) {
      expect(inventory).toContain(`component: "${component}"`);
      await expectMissingFile(`renderers/primitives/${component}/astro.ts`);
      await expectMissingFile(`renderers/primitives/${component}/react.ts`);
      await expectMissingFile(`renderers/primitives/${component}/vue.ts`);
      await expectMissingFile(`renderers/primitives/${component}/solid.ts`);
      await expectMissingFile(`renderers/primitives/${component}/svelte.ts`);
      expect(registry).not.toContain(`./primitives/${component}/astro.js`);
      expect(registry).not.toContain(`./primitives/${component}/react.js`);
    }

    expect(
      primitiveGeneratorRegistry.find((entry) => entry.component === "theme")?.routeFree,
    ).toEqual(
      expect.objectContaining({
        kind: "manual-route",
        reason: expect.stringContaining("theme"),
      }),
    );
    expect(
      primitiveGeneratorRegistry.every((entry) => typeof entry.generateTarget === "function"),
    ).toBe(true);
    const generatorTypes = await readPortableFile("renderers/primitive-generator-types.ts");
    expect(generatorTypes).not.toContain("AstroPrimitiveGenerator");
    expect(generatorTypes).not.toContain("ReactPrimitiveGenerator");
    expect(generatorTypes).not.toMatch(/\b(?:astro|react)\s*:/);
    const routeFreeGenerator = await readPortableFile(
      "renderers/primitive-route-free-generator.ts",
    );
    expect(routeFreeGenerator).not.toMatch(/\b(?:astro|react)\s*:/);
    expect(routeFreeGenerator).not.toContain("AstroPrimitiveGenerator");
    expect(routeFreeGenerator).not.toContain("ReactPrimitiveGenerator");
    expect(routeFreeGenerator).not.toContain("MANUAL_PRIMITIVE_GENERATOR_TARGETS");
    expect(routeFreeGenerator).not.toMatch(/\[\s*"astro"\s*,\s*"react"\s*\]/);

    const themeEntry = primitiveGeneratorRegistry.find((entry) => entry.component === "theme");
    expect(themeEntry?.routeFree?.targets).toEqual(getPrimitiveFrameworkAdapterTargetNames());
    expect(new Set(primitiveGeneratorRegistry.map((entry) => entry.source))).toEqual(
      new Set(["adapter-family-plan", "manual", "specialized-adapter-spec"]),
    );
  });

  it("routes styled wrapper orchestration through framework target capabilities", async () => {
    const astroWrapperScript = await readPortableFile("generate-astro-wrappers.ts");
    const reactWrapperScript = await readPortableFile("generate-react-wrappers.ts");
    const frameworkWrapperGenerator = await readPortableFile(
      "renderers/framework-wrapper-generator.ts",
    );

    for (const wrapperScript of [astroWrapperScript, reactWrapperScript]) {
      expect(wrapperScript).toContain("generateFrameworkPrimitiveWrappers");
      expect(wrapperScript).toContain("generateFrameworkStyledWrappers");
      expect(wrapperScript).not.toContain("renderers/framework-adapters/astro/styled");
      expect(wrapperScript).not.toContain("renderers/framework-adapters/react/styled");
    }

    expect(frameworkWrapperGenerator).toContain("getPrimitiveFrameworkAdapterTarget");
    expect(frameworkWrapperGenerator).toContain(".styled");
    expect(frameworkWrapperGenerator).toContain(".write(options)");
  });

  it("moves specialized primitive generation to route-free registry entries", async () => {
    const specializedComponents = primitiveGeneratorRegistry
      .filter((entry) => entry.source === "specialized-adapter-spec")
      .map((entry) => entry.component)
      .sort();
    const routeFreeSpecializedComponents = primitiveGeneratorRegistry
      .filter(
        (entry) =>
          entry.source === "specialized-adapter-spec" &&
          entry.routeFree?.kind === "adapter-output-model" &&
          entry.routeFree.strategy === "specialized-adapter-spec",
      )
      .map((entry) => entry.component)
      .sort();

    expect(routeFreeSpecializedComponents).toEqual(specializedComponents);
    expect(routeFreeSpecializedComponents).toEqual([...ROUTE_FREE_SPECIALIZED_COMPONENTS].sort());

    for (const component of ROUTE_FREE_SPECIALIZED_COMPONENTS) {
      await expectMissingFile(`renderers/primitives/${component}/astro.ts`);
      await expectMissingFile(`renderers/primitives/${component}/react.ts`);
    }
  });

  it("keeps route-free primitive generation target-extensible from one registry path", async () => {
    const routeFreeGenerator = await readPortableFile(
      "renderers/primitive-route-free-generator.ts",
    );
    const frameworkAdapterRegistry = await readPortableFile(
      "renderers/framework-adapters/target-registry.ts",
    );

    expect(getPrimitiveFrameworkAdapterTargetNames()).toEqual(["astro", "react"]);
    expect(frameworkAdapterRegistry).toContain("primitiveFrameworkAdapterTargets");
    expect(frameworkAdapterRegistry).toContain("astroFrameworkAdapterTarget");
    expect(frameworkAdapterRegistry).toContain("reactFrameworkAdapterTarget");
    expect(routeFreeGenerator).not.toContain("const ROUTE_FREE_PRIMITIVE_TARGETS");
    expect(routeFreeGenerator).not.toContain("routeFreeFrameworkAdapters");
    expect(routeFreeGenerator).not.toContain("writeAstroAdapterOutput");
    expect(routeFreeGenerator).not.toContain("writeReactAdapterOutput");
    expect(routeFreeGenerator).not.toContain('target === "astro"');
    expect(routeFreeGenerator).toContain("createSpecializedAdapterSpecPrimitiveGeneratorEntry");
    expect(routeFreeGenerator).toContain("getRouteFreePrimitiveTargets");
    expect(routeFreeGenerator).not.toMatch(/\.\/primitives\/[^/]+\/(?:astro|react)\.js/);
    for (const component of PRIMITIVE_COMPONENTS) {
      expect(routeFreeGenerator).not.toContain(`"${component}"`);
    }
  });

  it("keeps export and type-facade syntax in target-local export printers", async () => {
    for (const target of ["astro", "react"] as const) {
      const adapter = await readPortableFile(`renderers/framework-adapters/${target}/adapter.ts`);
      const exportPrinter = await readPortableFile(
        `renderers/framework-adapters/${target}/exports.ts`,
      );

      expect(exportPrinter).toContain("export const exportPrinter");
      expect(exportPrinter).toContain("createAdapterExportInventory");
      expect(exportPrinter).toContain("createRuntimeTypeExportFacts");
      expect(exportPrinter).not.toMatch(/export function print(?:Astro|React)/);
      expect(adapter).toContain("contents: exportPrinter.printIndexFileExports(file)");
      expect(adapter).toContain("contents: exportPrinter.printTypeFacadeFileExports(file)");
      expect(adapter).toContain("return exportPrinter.printNamespaceExport");
      expect(adapter).toContain("exportPrinter.printRuntimeTypeReExport");
      expect(adapter).not.toMatch(
        /print(?:Astro|React)(?:IndexFileExports|TypeFacadeFileExports|RuntimeTypeReExport|NamespaceExport)/,
      );
      expect(adapter).not.toContain("function printTypeFacadeExports");
      expect(adapter).not.toContain("function printNamespaceExport");
      expect(adapter).not.toMatch(/function print[A-Za-z]+RuntimeTypeExports?\(/);
    }
  });

  it("keeps prebuilt output files out of the production Adapter Output Model surface", async () => {
    const rendererFiles = await readFilesRecursively(path.join(SCRIPT_ROOT, "renderers"));
    const productionFiles = rendererFiles.filter(
      (file) =>
        !file.relativePath.endsWith(".test.ts") && !file.relativePath.includes("__tests__/"),
    );

    for (const file of productionFiles) {
      expect(file.source, file.relativePath).not.toContain("AdapterPrebuiltFile");
      expect(file.source, file.relativePath).not.toContain("printPrebuiltFile");
      expect(file.source, file.relativePath).not.toContain('kind: "prebuilt"');
      expect(file.source, file.relativePath).not.toContain('kind === "prebuilt"');
    }
  });

  it("keeps static adapter fallback files out of the production Adapter Output Model surface", async () => {
    const rendererFiles = await readFilesRecursively(path.join(SCRIPT_ROOT, "renderers"));
    const productionFiles = rendererFiles.filter(
      (file) =>
        !file.relativePath.endsWith(".test.ts") && !file.relativePath.includes("__tests__/"),
    );

    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printers.ts");
    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    await expectMissingFile("renderers/generic-adapter-plan/static-part-output.ts");
    await expectMissingFile("renderers/framework-adapters/astro/static-family-registry.ts");
    await expectMissingFile("renderers/framework-adapters/astro/static-family-printer-bodies.ts");
    await expectMissingFile("renderers/framework-adapters/astro/static.ts");
    await expectMissingFile("renderers/framework-adapters/react/static-family-registry.ts");
    await expectMissingFile("renderers/framework-adapters/react/static-family-printer-bodies.ts");
    await expectMissingFile("renderers/framework-adapters/react/static.ts");

    for (const file of productionFiles) {
      expect(file.source, file.relativePath).not.toContain("AdapterStaticAdapterPlanFile");
      expect(file.source, file.relativePath).not.toContain("printStaticAdapterPlanFile");
      expect(file.source, file.relativePath).not.toContain("printStaticAdapterPlan(");
      expect(file.source, file.relativePath).not.toContain("createStaticAdapterPlanFiles");
      expect(file.source, file.relativePath).not.toContain('kind: "static-adapter-plan"');
      expect(file.source, file.relativePath).not.toContain('kind === "static-adapter-plan"');
      expect(file.source, file.relativePath).not.toContain("staticPlan:");
    }
  });

  it("keeps primitive output writer implementations in framework target homes", async () => {
    const sharedWriter = await readPortableFile(
      "renderers/framework-adapters/primitive-output-writer.ts",
    );
    const astroWriter = await readPortableFile(
      "renderers/framework-adapters/astro/primitive-output-writer.ts",
    );
    const reactWriter = await readPortableFile(
      "renderers/framework-adapters/react/primitive-output-writer.ts",
    );
    const astroTarget = await readPortableFile("renderers/framework-adapters/astro/index.ts");
    const reactTarget = await readPortableFile("renderers/framework-adapters/react/index.ts");
    const routeFreeGenerator = await readPortableFile(
      "renderers/primitive-route-free-generator.ts",
    );

    await expectMissingFile("renderers/primitives/adapter-output-writer.ts");
    await expectMissingFile("renderers/primitives/specialized-output-writer.ts");
    await expectMissingFile("renderers/primitives/astro-shared.ts");
    await expectMissingFile("renderers/primitives/react-shared.ts");

    expect(sharedWriter).toContain("assertPrintedPathsMatchOutputModel");
    expect(sharedWriter).toContain("getPrimitiveOutputFileLocation");
    expect(sharedWriter).toContain("writePrimitiveOutputFiles");
    expect(sharedWriter).not.toMatch(
      /\b(Astro|React)\b|astroHeader|tsHeader|writeAstro|writeReact|\.astro|\.tsx|useIsomorphicLayoutEffect/,
    );
    expect(routeFreeGenerator).not.toContain("printAdapterOutput");
    expect(routeFreeGenerator).not.toContain("printedFiles");

    expect(astroWriter).toContain("writeAstroAdapterOutput");
    expect(astroWriter).toContain("writeAstroPrimitiveFile");
    expect(astroWriter).toContain("astroFrameworkAdapter");
    expect(astroWriter).toContain("writePrimitiveOutputFiles");
    expect(astroWriter).toContain('extension: "astro"');
    expect(astroWriter).toContain("astroHeader");

    expect(reactWriter).toContain("writeReactAdapterOutput");
    expect(reactWriter).toContain("writeReactPrimitiveFile");
    expect(reactWriter).toContain("reactFrameworkAdapter");
    expect(reactWriter).toContain("writePrimitiveOutputFiles");
    expect(reactWriter).toContain("renderUseIsomorphicLayoutEffectFile");
    expect(reactWriter).toContain("renderComposeRefsFile");
    expect(reactWriter).toContain('extension: "tsx"');
    expect(astroTarget).not.toContain("printedFiles");
    expect(reactTarget).not.toContain("printedFiles");

    expect(astroTarget).toContain('from "./primitive-output-writer.js"');
    expect(reactTarget).toContain('from "./primitive-output-writer.js"');
    expect(astroTarget).not.toContain("../../primitives/adapter-output-writer");
    expect(reactTarget).not.toContain("../../primitives/adapter-output-writer");

    const primitiveRendererFiles = await readFilesRecursively(
      path.join(SCRIPT_ROOT, "renderers/primitives"),
    );
    const writerLeaks = primitiveRendererFiles
      .filter((file) =>
        /write(?:Astro|React)(?:AdapterOutput|PrimitiveFile)|astroHeader|useIsomorphicLayoutEffect/.test(
          file.source,
        ),
      )
      .map((file) => file.relativePath);
    expect(writerLeaks).toEqual([]);
  });

  it("audits framework-specific implementation code outside target homes", async () => {
    const files = await readFilesRecursively(SCRIPT_ROOT);
    const offenders = files
      .filter((file) => file.relativePath.endsWith(".ts"))
      .filter((file) => isFrameworkSpecificContainmentAuditScope(file.relativePath))
      .map((file) => ({
        labels: getFrameworkSpecificContainmentLabels(file.source),
        path: file.relativePath,
      }))
      .filter((offender) => offender.labels.length > 0)
      .filter((offender) => !isFrameworkSpecificContainmentException(offender.path));

    for (const exception of FRAMEWORK_SPECIFIC_CONTAINMENT_EXCEPTIONS) {
      expect(exception.reason).toMatch(/\S/);
      expect(exception.review).toMatch(/\S/);
      expect(Boolean(exception.path) || Boolean(exception.pathPrefix)).toBe(true);
    }
    for (const target of FRAMEWORK_ADAPTER_TARGET_NAMES) {
      expect(
        getFrameworkSpecificContainmentLabels(
          `import { adapter } from "./framework-adapters/${target}/adapter.js";`,
        ),
      ).toContain("target-home import");
    }
    expect(
      getFrameworkSpecificContainmentLabels(
        "type VuePrimitiveGenerator = () => Promise<void>; const entry = { vue: generateVue };",
      ),
    ).toContain("target-named registry contract");

    expect(offenders).toEqual([]);
  });

  it("has no framework-specific containment exceptions after target cleanup", () => {
    expect(FRAMEWORK_SPECIFIC_CONTAINMENT_EXCEPTIONS).toEqual([]);
  });

  it("keeps controlled-state support metadata target-neutral in shared primitive models", async () => {
    const files = [
      ...(await readFilesRecursively(path.join(SCRIPT_ROOT, "contracts/primitive"))),
      ...(await readFilesRecursively(path.join(SCRIPT_ROOT, "renderers/specialized-adapter-spec"))),
    ];
    const offenders = files
      .filter((file) => file.relativePath.endsWith(".ts"))
      .filter((file) => /\bastroControlled\b/.test(file.source))
      .map((file) => file.relativePath.replaceAll("\\", "/"));

    expect(offenders).toEqual([]);
  });

  it("keeps target attribute and slot spellings out of shared Specialized Adapter Specs", async () => {
    const files = await readFilesRecursively(
      path.join(SCRIPT_ROOT, "renderers/specialized-adapter-spec"),
    );
    const targetSpecificSpellingPattern =
      /\b(?:astro|react|solid|svelte|vue)(?:Attribute|NamedSlot|Prop|Property|Slot)\b/;
    const offenders = files
      .filter((file) => file.relativePath.endsWith(".ts"))
      .filter((file) => targetSpecificSpellingPattern.test(file.source))
      .map((file) => file.relativePath.replaceAll("\\", "/"));

    expect(offenders).toEqual([]);
  });

  it("keeps React controlled resync projection out of shared Navigation Menu facts", async () => {
    const files = [
      ...(
        await readFilesRecursively(path.join(SCRIPT_ROOT, "renderers/specialized-adapter-spec"))
      ).map((file) => ({
        ...file,
        relativePath: path.join("renderers/specialized-adapter-spec", file.relativePath),
      })),
      ...(await readFilesRecursively(path.join(SCRIPT_ROOT, "renderers/framework-adapters")))
        .filter((file) => !file.relativePath.replaceAll("\\", "/").startsWith("react/"))
        .map((file) => ({
          ...file,
          relativePath: path.join("renderers/framework-adapters", file.relativePath),
        })),
    ];
    const reactResyncProjectionPattern = /\b(?:pendingDetailsRef|reactControlledResync|stateRef)\b/;
    const offenders = files
      .filter((file) => file.relativePath.endsWith(".ts"))
      .filter((file) => reactResyncProjectionPattern.test(file.source))
      .map((file) => file.relativePath.replaceAll("\\", "/"));

    expect(offenders).toEqual([]);
  });

  it("keeps Field composed-input target payload in framework target homes", async () => {
    const fieldSpec = await readPortableFile(
      "renderers/specialized-adapter-spec/field-specialized-adapter-spec.ts",
    );
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    expect(fieldSpec).not.toMatch(
      /inputPrimitiveImport|inputValueChangeDetailsType|inputValueType|onValueChangeProp|InputRoot/,
    );
    expect(reactAdapter).toContain("REACT_FIELD_CONTROL_INPUT_PRIMITIVE");
    expect(reactAdapter).toContain('importSource: "../input/InputRoot"');
    expect(reactAdapter).toContain('valueChangeProp: "onValueChange"');
  });

  it("keeps shipping Specialized Adapter Spec projection in target homes", async () => {
    const files = await readFilesRecursively(
      path.join(SCRIPT_ROOT, "renderers/specialized-adapter-spec"),
    );
    const sharedSpecFiles = files.filter((file) => file.relativePath.endsWith(".ts"));

    const offenders = sharedSpecFiles
      .map((file) => ({
        labels: getShippingSpecializedAdapterProjectionLabels(file.source),
        path: path
          .join("renderers/specialized-adapter-spec", file.relativePath)
          .replaceAll("\\", "/"),
      }))
      .filter((offender) => offender.labels.length > 0);

    expect(
      getShippingSpecializedAdapterProjectionLabels("export function printAstroExample() {}"),
    ).toContain("shipping target-prefixed printer/helper");
    expect(
      getShippingSpecializedAdapterProjectionLabels(
        'import { astroFrameworkAdapter } from "../framework-adapters/astro/adapter.js";',
      ),
    ).toContain("shipping target-home import");
    expect(getShippingSpecializedAdapterProjectionLabels('target: "react"')).toContain(
      "shipping target-scoped output file",
    );
    expect(
      getShippingSpecializedAdapterProjectionLabels("path: `${component}/Helper.tsx`"),
    ).toContain("shipping target-specific output extension");

    expect(offenders).toEqual([]);
  });

  it("keeps future framework tracer printers in future target homes", async () => {
    const sharedDirs = [
      path.join(SCRIPT_ROOT, "renderers/generic-adapter-plan"),
      path.join(SCRIPT_ROOT, "renderers/specialized-adapter-spec"),
    ];
    const sharedFiles = (
      await Promise.all(sharedDirs.map((dir) => readFilesRecursively(dir, SCRIPT_ROOT)))
    )
      .flat()
      .filter((file) => file.relativePath.endsWith(".ts"));
    const offenders = sharedFiles
      .map((file) => ({
        labels: getFutureFrameworkTracerSharedLabels(file.source),
        path: file.relativePath,
      }))
      .filter((offender) => offender.labels.length > 0);

    expect(
      getFutureFrameworkTracerSharedLabels("export function printVueExampleFixture() {}"),
    ).toContain("future target-prefixed printer/helper");
    expect(
      getFutureFrameworkTracerSharedLabels(
        'import { createSignal } from "solid-js"; const path = "__future-fixtures/solid/menu/Menu.tsx";',
      ),
    ).toEqual(["future target fixture path", "future framework syntax marker"]);

    expect(offenders).toEqual([]);
  });

  it("keeps future framework tracer registry out of shipping surfaces", async () => {
    const sourceRoots = [
      "apps/demo/src",
      "apps/react-demo/src",
      "packages/astro/src",
      "packages/cli/registry",
      "packages/cli/src",
      "packages/react/src",
      "packages/runtime/src",
    ];
    const generatorEntrypoints = [
      "generate-astro-wrappers.ts",
      "generate-cli-registry.ts",
      "generate-react-wrappers.ts",
      "renderers/primitive-generator-registry.ts",
      "renderers/primitive-route-free-generator.ts",
    ];
    const sourceFiles = (
      await Promise.all(
        sourceRoots.map((root) =>
          readFilesRecursively(path.join(process.cwd(), root), process.cwd()),
        ),
      )
    )
      .flat()
      .filter((file) => /\.(?:astro|json|tsx?|mjs)$/.test(file.relativePath))
      .filter(
        (file) =>
          !file.relativePath.includes("/__tests__/") && !file.relativePath.includes(".test."),
      );
    const generatorFiles = await Promise.all(
      generatorEntrypoints.map(async (relativePath) => ({
        relativePath: path.join("scripts/portable-runtime", relativePath).replaceAll("\\", "/"),
        source: await readPortableFile(relativePath),
      })),
    );
    const offenders = [...sourceFiles, ...generatorFiles]
      .map((file) => ({
        labels: getFutureFrameworkTracerShippingSurfaceLabels(file.source),
        path: file.relativePath,
      }))
      .filter((offender) => offender.labels.length > 0);

    expect(
      getFutureFrameworkTracerShippingSurfaceLabels(
        'import { getFutureFrameworkTracerTarget } from "./future-framework-tracer.js";',
      ),
    ).toContain("future tracer registry import");
    expect(
      getFutureFrameworkTracerShippingSurfaceLabels(
        'export const pkg = "@starwind-ui/vue"; const path = "__future-fixtures/vue/button/ButtonRoot.vue";',
      ),
    ).toEqual(["future fixture path", "future package surface"]);

    expect(offenders).toEqual([]);
  });

  it("keeps the Generic Adapter Plan barrel target-neutral", async () => {
    const genericAdapterPlanBarrel = await readPortableFile(
      "renderers/generic-adapter-plan/index.ts",
    );

    expect(genericAdapterPlanBarrel).not.toMatch(
      /\b(?:print|render|write)(?:Astro|React|Solid|Svelte|Vue)[A-Z]\w*/,
    );
    expect(genericAdapterPlanBarrel).not.toMatch(/\b(?:astro|react|solid|svelte|vue)\s*:/);
  });

  it("keeps legacy static adapter printer orchestration removed", async () => {
    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printers.ts");
  });

  it("keeps the Generic Adapter Output Model builder framework-neutral", async () => {
    const genericAdapterOutputModel = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const sharedGenericProjectionFiles = await Promise.all(
      ["renderers/generic-adapter-plan/generic-adapter-output-printer.ts"].map(readPortableFile),
    );

    expect(genericAdapterOutputModel).not.toMatch(
      /\b(?:astro|react|solid|svelte|vue)FrameworkAdapter\b/,
    );
    expect(genericAdapterOutputModel).not.toMatch(
      /\b(?:export\s+)?function\s+(?:print|render|write)(?:Astro|React|Solid|Svelte|Vue)[A-Z]\w*/,
    );
    expect(genericAdapterOutputModel).not.toMatch(/\bReact\.(?:Ref|ReactNode|HTMLAttributes)\b/);
    expect(genericAdapterOutputModel).not.toMatch(
      /target\s*={0,3}\s*["'](?:astro|react|solid|svelte|vue)["']/,
    );
    expect(genericAdapterOutputModel).not.toContain("../framework-adapters/index.js");
    expect(genericAdapterOutputModel).not.toContain("printStaticAdapterPlan(");
    expect(genericAdapterOutputModel).not.toContain('kind: "static-adapter-plan"');
    for (const sharedGenericProjectionFile of sharedGenericProjectionFiles) {
      expect(sharedGenericProjectionFile).not.toContain("../framework-adapters/index.js");
    }
  });

  it("centralizes manual primitive exceptions without component target routes", async () => {
    const registry = await readPortableFile("renderers/primitive-generator-registry.ts");
    const manualGenerators = await readPortableFile("renderers/manual-primitive-generators.ts");
    const inventory = await readPortableFile("renderers/primitive-inventory.ts");

    expect(registry).toContain("manualPrimitiveGeneratorEntries");
    expect(registry).not.toContain("./primitives/theme/astro.js");
    expect(registry).not.toContain("./primitives/theme/react.js");
    expect(manualGenerators).toContain("createManualPrimitiveGeneratorEntry");
    expect(manualGenerators).toContain("getManualHelperPrimitiveInventoryEntries");
    expect(inventory).toContain('component: "theme"');
    expect(inventory).toContain("theme primitive output is a manual helper facade");
    expect(manualGenerators).not.toMatch(/framework-adapters\/(?:astro|react)/);
    expect(manualGenerators).not.toMatch(/\bwrite(?:Astro|React)PrimitiveFile\b/);
    expect(manualGenerators).not.toMatch(/\b(?:generateAstro|generateReact)PrimitiveTheme\b/);
    expect(manualGenerators).not.toMatch(/\b(?:astro|react)\s*:/);
    expect(manualGenerators).not.toContain("ThemeInitScript.astro");
    expect(manualGenerators).not.toContain("Astro.props");
    expect(manualGenerators).not.toMatch(
      /\.\/primitives\/theme\/(?:astro|react|vue|solid|svelte)\.js/,
    );
    await expectMissingFile("renderers/primitives/theme/astro.ts");
    await expectMissingFile("renderers/primitives/theme/react.ts");
  });

  it("keeps runtime adapter contracts component-scoped with a stable thin aggregator", async () => {
    const aggregator = await readPortableFile("contracts/primitive/representatives.ts");

    expect(lineCount(aggregator)).toBeLessThan(120);
    expect(aggregator).toContain("runtimeAdapterContracts");
    expect(aggregator).toContain("representativeRuntimeAdapterContracts");

    const actualComponents = (await readDirectoryFileNames("contracts/primitive/components"))
      .filter((fileName) => fileName.endsWith(".ts") && fileName !== "index.ts")
      .map((fileName) => fileName.replace(/\.ts$/, ""))
      .sort();

    expect(actualComponents).toEqual([...PRIMITIVE_CONTRACT_COMPONENTS].sort());

    for (const component of PRIMITIVE_CONTRACT_COMPONENTS) {
      expect(aggregator).toContain(`./components/${component}.js`);
    }
  });

  it("keeps portable-runtime generation independent from runtime-internal contracts", async () => {
    const files = await readFilesRecursively(SCRIPT_ROOT);
    const offenders = files.filter(
      ({ relativePath, source }) =>
        relativePath.endsWith(".ts") &&
        !relativePath.endsWith("generator-structure.test.ts") &&
        source.includes(RUNTIME_INTERNAL_CONTRACT_IMPORT),
    );

    expect(offenders.map((offender) => offender.relativePath)).toEqual([]);
  });

  it("uses the draft runtime adapter contract for refactored primitives", async () => {
    for (const component of [
      "button",
      "toggle",
      "form",
      "field",
      "fieldset",
      "input",
      "switch",
      "checkbox",
      "radio",
      "slider",
      "collapsible",
      "toggle-group",
      "radio-group",
      "checkbox-group",
      "tabs",
      "accordion",
      "avatar",
      "progress",
      "scroll-area",
      "input-otp",
      "select",
      "navigation-menu",
      "popover",
      "sidebar",
      "combobox",
      "toast",
    ]) {
      const contractName = `${toCamelCase(component)}RuntimeAdapterContract`;
      const legacyContractName = `${toCamelCase(component)}Contract`;
      if (ROUTE_FREE_ADAPTER_FAMILY_COMPONENT_SET.has(component)) {
        await expectGenericRouteFreeComponent(component, contractName, legacyContractName);
        continue;
      }
      if (ROUTE_FREE_SPECIALIZED_COMPONENT_SET.has(component)) {
        await expectSpecializedRouteFreeComponent(component, contractName, legacyContractName);
        continue;
      }

      throw new Error(`Expected ${component} to use the route-free primitive generator.`);
    }
  });

  it("routes Button primitive generation through the generic-adapter-plan seam", async () => {
    await expectGenericRouteFreeComponent(
      "button",
      "buttonRuntimeAdapterContract",
      "buttonContract",
    );
  });

  it("routes Progress primitive generation through the generic-adapter-plan seam", async () => {
    await expectGenericRouteFreeComponent(
      "progress",
      "progressRuntimeAdapterContract",
      "progressContract",
    );
  });

  it("routes Fieldset primitive generation through the generic-adapter-plan seam", async () => {
    await expectGenericRouteFreeComponent(
      "fieldset",
      "fieldsetRuntimeAdapterContract",
      "fieldsetContract",
    );
  });

  it("uses Fieldset contract parts, disabled prop, and native-disabled facts in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "fieldset",
      "fieldsetRuntimeAdapterContract",
      "fieldsetContract",
    );
    const nativeDisabledFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/native-disabled.ts",
    );
    const astroNativeDisabledPrinter = await readPortableFile(
      "renderers/framework-adapters/astro/native-disabled.ts",
    );
    const reactNativeDisabledPrinter = await readPortableFile(
      "renderers/framework-adapters/react/native-disabled.ts",
    );

    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    await expectMissingFile("renderers/generic-adapter-plan/static-part-output.ts");
    await expectMissingFile("renderers/framework-adapters/astro/static-family-registry.ts");
    await expectMissingFile("renderers/framework-adapters/react/static-family-registry.ts");
    expect(nativeDisabledFamily).toContain("nativeDisabledAdapterFamilyPlan");
    expect(nativeDisabledFamily).toContain("matches: isNativeDisabledOutputModelPlan");
    expect(nativeDisabledFamily).toContain("buildOutputModel: buildNativeDisabledOutputModel");
    expect(nativeDisabledFamily).toContain(
      'const disabledSetter = getSetterForProp(plan, "disabled")',
    );
    expect(nativeDisabledFamily).toContain(
      'disabled: getAdapterFamilyProp(getPlanProp(plan, "disabled"))',
    );
    expect(astroNativeDisabledPrinter).toContain("printAstroNativeDisabledComponent");
    expect(reactNativeDisabledPrinter).toContain("printReactNativeDisabledComponent");
  });

  it("routes Input primitive generation through the generic-adapter-plan seam", async () => {
    await expectGenericRouteFreeComponent("input", "inputRuntimeAdapterContract", "inputContract");
  });

  it("routes Avatar primitive generation through the generic-adapter-plan seam", async () => {
    await expectGenericRouteFreeComponent(
      "avatar",
      "avatarRuntimeAdapterContract",
      "avatarContract",
    );
  });

  it("routes Select primitive generation through the Specialized Adapter Spec seam", async () => {
    await expectSpecializedRouteFreeComponent(
      "select",
      "selectRuntimeAdapterContract",
      "selectContract",
    );
    const selectSpecRenderer = await readPortableFile(
      "renderers/specialized-adapter-spec/select-specialized-adapter-spec.ts",
    );

    expect(selectSpecRenderer).toContain("buildSelectAdapterOutputModel");
    expect(selectSpecRenderer).toContain("option-collection-overlay");
    expect(selectSpecRenderer).toContain("createPrimitiveAttributeMap");
    expect(selectSpecRenderer).not.toContain("writeGeneratedAstroFile");
    expect(selectSpecRenderer).not.toContain("writeGeneratedReactFile");
    expect(selectSpecRenderer).not.toContain("${astroHeader}");
    expect(selectSpecRenderer).not.toContain("${tsHeader}");
    expect(selectSpecRenderer).not.toContain("data-side={side}");
    expect(selectSpecRenderer).not.toContain("data-align={align}");
    expect(selectSpecRenderer).not.toContain("data-side-offset={sideOffset}");
    expect(selectSpecRenderer).not.toContain("data-align-offset={alignOffset}");
    expect(selectSpecRenderer).not.toContain("data-avoid-collisions={avoidCollisions");
    expect(selectSpecRenderer).not.toContain("data-value={value}");

    const sharedFrameworkAdapterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/astro/adapter.ts"),
      readPortableFile("renderers/framework-adapters/react/adapter.ts"),
    ]);
    const targetFamilyPrinterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/astro/option-collection-overlay.ts"),
      readPortableFile("renderers/framework-adapters/react/option-collection-overlay.ts"),
    ]);
    const selectExportedPartNames = [
      "SelectRoot",
      "SelectLabel",
      "SelectTrigger",
      "SelectIcon",
      "SelectValue",
      "SelectPortal",
      "SelectPositioner",
      "SelectPopup",
      "SelectList",
      "SelectGroup",
      "SelectGroupLabel",
      "SelectItem",
      "SelectItemText",
      "SelectItemIndicator",
      "SelectSeparator",
      "SelectScrollUpArrow",
      "SelectScrollDownArrow",
    ];

    for (const adapter of [...sharedFrameworkAdapterSources, ...targetFamilyPrinterSources]) {
      expect(adapter).not.toContain("createSelect");
      expect(adapter).not.toContain("setupSelects");
    }

    // Target-family printers may interpolate concrete export names from facts; shared dispatchers stay generic.
    for (const adapter of sharedFrameworkAdapterSources) {
      for (const partName of selectExportedPartNames) {
        expect(adapter).not.toContain(partName);
      }
      expect(adapter).not.toMatch(/\bconst select\s*=/);
      expect(adapter).not.toMatch(/\bselect\./);
    }
  });

  it("routes Combobox primitive generation through the Specialized Adapter Spec seam", async () => {
    await expectSpecializedRouteFreeComponent(
      "combobox",
      "comboboxRuntimeAdapterContract",
      "comboboxContract",
    );
    const comboboxSpecRenderer = await readPortableFile(
      "renderers/specialized-adapter-spec/combobox-specialized-adapter-spec.ts",
    );

    expect(comboboxSpecRenderer).toContain("buildComboboxAdapterOutputModel");
    expect(comboboxSpecRenderer).toContain("editable-collection-overlay");
    expect(comboboxSpecRenderer).not.toContain("writeGeneratedFile");
    expect(comboboxSpecRenderer).not.toContain("${astroHeader}");
    expect(comboboxSpecRenderer).not.toContain("${tsHeader}");

    const sharedFrameworkAdapterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/types.ts"),
      readPortableFile("renderers/framework-adapters/astro/adapter.ts"),
      readPortableFile("renderers/framework-adapters/react/adapter.ts"),
    ]);
    const targetFamilyPrinterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/astro/editable-collection-overlay.ts"),
      readPortableFile("renderers/framework-adapters/react/editable-collection-overlay.ts"),
    ]);
    const comboboxExportedPartNames = [
      "ComboboxRoot",
      "ComboboxLabel",
      "ComboboxInputGroup",
      "ComboboxInput",
      "ComboboxTrigger",
      "ComboboxIcon",
      "ComboboxClear",
      "ComboboxValue",
      "ComboboxPortal",
      "ComboboxPositioner",
      "ComboboxPopup",
      "ComboboxEmpty",
      "ComboboxList",
      "ComboboxGroup",
      "ComboboxGroupLabel",
      "ComboboxItem",
      "ComboboxItemText",
      "ComboboxItemIndicator",
      "ComboboxSeparator",
    ];

    for (const adapter of [...sharedFrameworkAdapterSources, ...targetFamilyPrinterSources]) {
      expect(adapter).not.toContain("createCombobox");
      expect(adapter).not.toContain("data-sw-combobox");
    }

    // Target-family printers may interpolate concrete export names from facts; shared dispatchers stay generic.
    for (const adapter of sharedFrameworkAdapterSources) {
      for (const partName of comboboxExportedPartNames) {
        expect(adapter).not.toContain(partName);
      }
      expect(adapter).not.toMatch(/\bconst combobox\s*=/);
      expect(adapter).not.toMatch(/\bcombobox\./);
    }
  });

  it("uses Toggle contract state, event, prop, and setter facts in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "toggle",
      "toggleRuntimeAdapterContract",
      "toggleContract",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const singleBooleanFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/single-boolean-control.ts",
    );

    expect(outputModelBuilder).toContain("singleBooleanControlAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function isSingleBooleanControlOutputModelPlan(");
    expect(singleBooleanFamily).toContain("singleBooleanControlAdapterFamilyPlan");
    expect(singleBooleanFamily).not.toContain("singleBooleanControlStaticAdapterFamilyPlan");
    expect(singleBooleanFamily).toContain("function isSingleBooleanControlOutputModelPlan(");
    expect(singleBooleanFamily).toContain('getStateModel(plan, "pressed")');
    expect(singleBooleanFamily).toContain('getRuntimeOptionProps(plan, ["disabled"])');
    expect(singleBooleanFamily).toContain('getRuntimeOptionProps(plan, ["nativeButton"])');
    expect(singleBooleanFamily).toContain('getRuntimeOptionProps(plan, ["syncGroup"])');
    expect(singleBooleanFamily).toContain('getRuntimeOptionProps(plan, ["value"])');
    expect(singleBooleanFamily).toContain('getEvent(plan, "pressedChange")');
    expect(singleBooleanFamily).toContain('getSetterForState(plan, "pressed")');
    expect(singleBooleanFamily).toContain("getSetterForProp(plan, disabledProp)");
    expect(singleBooleanFamily).toContain("stateEvent.valueProperty");
    expect(singleBooleanFamily).toContain("stateSetter.options");
  });

  it("keeps framework adapter homes free of Toggle-specific boolean state vocabulary", async () => {
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");
    const adapterTypes = await readPortableFile("renderers/framework-adapters/types.ts");

    for (const source of [astroAdapter, reactAdapter, adapterTypes]) {
      expect(source).not.toMatch(/Toggle|toggle|setupToggles/);
      expect(source).not.toMatch(/pressed/i);
    }
  });

  it("keeps framework adapter homes free of migrated boolean form-control component vocabulary", async () => {
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    for (const source of [astroAdapter, reactAdapter]) {
      for (const forbiddenTerm of [
        "SwitchRoot",
        "CheckboxRoot",
        "RadioRoot",
        "createSwitch",
        "createCheckbox",
        "createRadio",
        "setupSwitches",
        "setupCheckboxes",
        "setupRadios",
        "getSwitchInputId",
        "useCheckboxGroupContext",
        "useRadioGroupContext",
      ]) {
        expect(source).not.toContain(forbiddenTerm);
      }
    }
  });

  it("routes Field through the specialized adapter spec writers", async () => {
    await expectSpecializedRouteFreeComponent(
      "field",
      "fieldRuntimeAdapterContract",
      "fieldContract",
    );
    const fieldSpec = await readPortableFile(
      "renderers/specialized-adapter-spec/field-specialized-adapter-spec.ts",
    );
    const adapterTypes = await readPortableFile("renderers/framework-adapters/types.ts");
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    expect(fieldSpec).toContain("buildFieldAdapterOutputModel");
    expect(fieldSpec).toContain('"field-composition"');
    expect(fieldSpec).toContain("spec.field.controlComposition");
    expect(fieldSpec).toContain("spec.field.formTiming");
    expect(fieldSpec).toContain("spec.field.messageProjection");
    expect(fieldSpec).toContain("spec.field.rootState");
    expect(adapterTypes).toContain('"field-composition"');
    expect(astroAdapter).toContain("printAstroFormControlCompositionComponent");
    expect(reactAdapter).toContain("printReactFormControlCompositionComponent");
    expect(astroAdapter).not.toContain("FieldRoot");
    expect(reactAdapter).not.toContain("FieldRoot");
    expect(astroAdapter).not.toContain("createField");
    expect(reactAdapter).not.toContain("createField");
    expect(astroAdapter).not.toContain("setupFields");
    expect(reactAdapter).not.toContain("setupFields");
  });

  it("routes Carousel through the Specialized Adapter Spec seam", async () => {
    await expectSpecializedRouteFreeComponent(
      "carousel",
      "carouselRuntimeAdapterContract",
      "carouselContract",
    );
    const carouselSpecRenderer = await readPortableFile(
      "renderers/specialized-adapter-spec/carousel-specialized-adapter-spec.ts",
    );

    expect(carouselSpecRenderer).toContain("buildCarouselAdapterOutputModel");
    expect(carouselSpecRenderer).toContain("engine-viewport");
    expect(carouselSpecRenderer).not.toContain("writeGeneratedFile");
    expect(carouselSpecRenderer).not.toContain("${astroHeader}");
    expect(carouselSpecRenderer).not.toContain("${tsHeader}");

    const targetAdapterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/types.ts"),
      readPortableFile("renderers/framework-adapters/astro/adapter.ts"),
      readPortableFile("renderers/framework-adapters/astro/engine-viewport.ts"),
      readPortableFile("renderers/framework-adapters/react/adapter.ts"),
      readPortableFile("renderers/framework-adapters/react/engine-viewport.ts"),
    ]);
    for (const adapter of targetAdapterSources) {
      expect(adapter).not.toContain("CarouselRoot");
      expect(adapter).not.toContain("createCarousel");
      expect(adapter).not.toContain("data-sw-carousel");
      expect(adapter).not.toMatch(/\bconst carousel\s*=/);
      expect(adapter).not.toMatch(/\bcarousel\.(?!js")/);
    }
  });

  it("routes Toast through the Specialized Adapter Spec seam", async () => {
    await expectSpecializedRouteFreeComponent(
      "toast",
      "toastRuntimeAdapterContract",
      "toastContract",
    );
    const toastSpecRenderer = await readPortableFile(
      "renderers/specialized-adapter-spec/toast-specialized-adapter-spec.ts",
    );

    expect(toastSpecRenderer).toContain("buildToastAdapterOutputModel");
    expect(toastSpecRenderer).toContain("notification-system");
    expect(toastSpecRenderer).not.toContain("writeGeneratedFile");
    expect(toastSpecRenderer).not.toContain("${astroHeader}");
    expect(toastSpecRenderer).not.toContain("${tsHeader}");

    const targetAdapterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/types.ts"),
      readPortableFile("renderers/framework-adapters/astro/adapter.ts"),
      readPortableFile("renderers/framework-adapters/astro/notification-system.ts"),
      readPortableFile("renderers/framework-adapters/react/adapter.ts"),
      readPortableFile("renderers/framework-adapters/react/notification-system.ts"),
    ]);
    for (const adapter of targetAdapterSources) {
      expect(adapter).not.toContain("ToastViewport");
      expect(adapter).not.toContain("ToastTemplate");
      expect(adapter).not.toContain("createToastManager");
      expect(adapter).not.toContain("data-sw-toast");
      expect(adapter).not.toMatch(/\btoast\.(?!js")/);
    }
  });

  it("uses Input contract value, event, prop, and setter facts in its renderers", async () => {
    await expectGenericRouteFreeComponent("input", "inputRuntimeAdapterContract", "inputContract");
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );

    expect(outputModelBuilder).toContain('"input"');
    expect(outputModelBuilder).toContain("nativeInputValueAdapterFamilyPlan");
  });

  it("uses Switch contract parts, checked state, event, prop, and setter facts in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "switch",
      "switchRuntimeAdapterContract",
      "switchContract",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const booleanFormFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/boolean-form-control.ts",
    );
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    expect(outputModelBuilder).toContain("booleanFormControlAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function isBooleanFormControlOutputModelPlan(");
    expect(outputModelBuilder).not.toContain("function getBooleanFormControlFacts(");
    expect(booleanFormFamily).toContain("booleanFormControlAdapterFamilyPlan");
    expect(booleanFormFamily).toContain("function isBooleanFormControlOutputModelPlan(");
    expect(booleanFormFamily).toContain('getPart(plan, "thumb")');
    expect(booleanFormFamily).toContain("plan.form?.hiddenInput?.part");
    expect(booleanFormFamily).toContain("getPart(plan, inputPartName)");
    expect(booleanFormFamily).toContain('getStateModel(plan, "checked")');
    expect(booleanFormFamily).toContain('getOptionalRuntimeAdapterFamilyProp(plan, "form")');
    expect(booleanFormFamily).toContain(
      'getOptionalRuntimeAdapterFamilyProp(plan, "uncheckedValue")',
    );
    expect(booleanFormFamily).toContain('getEvent(plan, "checkedChange")');
    expect(booleanFormFamily).toContain('getSetterForState(plan, "checked")');
    expect(booleanFormFamily).toContain("getSetterForProp(plan, disabledPropName)");
    expect(booleanFormFamily).toContain("stateEvent.valueProperty");
    expect(booleanFormFamily).toContain('name: "inputRef"');
    expect(booleanFormFamily).toContain("type: getElementType(inputPart.defaultElement)");
    expect(reactAdapter).toContain(
      '${inputRef}?: React.Ref<${requireFamilyProp(facts.input.refProp, "inputRef").type}>;',
    );
  });

  it("uses Checkbox contract parts, state, event, context, presence, and setter facts in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "checkbox",
      "checkboxRuntimeAdapterContract",
      "checkboxContract",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const booleanFormFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/boolean-form-control.ts",
    );

    expect(outputModelBuilder).toContain("booleanFormControlAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function getBooleanFormControlFacts(");
    expect(booleanFormFamily).toContain("function isBooleanFormControlOutputModelPlan(");
    expect(booleanFormFamily).toContain('getPart(plan, "indicator")');
    expect(booleanFormFamily).toContain("plan.form?.hiddenInput?.part");
    expect(booleanFormFamily).toContain('getStateModel(plan, "checked")');
    expect(booleanFormFamily).toContain('getStateModel(plan, "indeterminate")');
    expect(booleanFormFamily).toContain("indeterminateStateModel.controlledProp");
    expect(booleanFormFamily).toContain('getRenderingPropForTarget(plan, "indicator")');
    expect(booleanFormFamily).toContain('getEvent(plan, "checkedChange")');
    expect(booleanFormFamily).toContain('getSetterForState(plan, "checked")');
    expect(booleanFormFamily).toContain('getSetterForState(plan, "indeterminate")');
    expect(booleanFormFamily).toContain("getSetterForProp(plan, disabledPropName)");
    expect(booleanFormFamily).toContain("stateEvent.valueProperty");
    expect(booleanFormFamily).toContain("indeterminateSetter.options");
    expect(booleanFormFamily).toContain("groupContext");
    expect(booleanFormFamily).toContain('context.name === "checkbox-group"');
    expect(booleanFormFamily).toContain('groupContext.values.includes("disabled")');
    expect(booleanFormFamily).toContain('groupContext.values.includes("value")');
  });

  it("uses Radio contract parts, state, event, context, presence, and setter facts in its renderers", async () => {
    await expectGenericRouteFreeComponent("radio", "radioRuntimeAdapterContract", "radioContract");
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const booleanFormFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/boolean-form-control.ts",
    );

    expect(outputModelBuilder).toContain("booleanFormControlAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function getBooleanFormControlFacts(");
    expect(booleanFormFamily).toContain("function isBooleanFormControlOutputModelPlan(");
    expect(booleanFormFamily).toContain('getPart(plan, "indicator")');
    expect(booleanFormFamily).toContain("plan.form?.hiddenInput?.part");
    expect(booleanFormFamily).toContain('getStateModel(plan, "checked")');
    expect(booleanFormFamily).toContain('getRenderingPropForTarget(plan, "indicator")');
    expect(booleanFormFamily).toContain('getRenderingPropForTarget(plan, "root")');
    expect(booleanFormFamily).toContain('getEvent(plan, "checkedChange")');
    expect(booleanFormFamily).toContain('getSetterForState(plan, "checked")');
    expect(booleanFormFamily).toContain("getSetterForProp(plan, disabledPropName)");
    expect(booleanFormFamily).toContain("getSetterForProp(plan, readOnlyPropName)");
    expect(booleanFormFamily).toContain("getSetterForProps(plan, [");
    expect(booleanFormFamily).toContain("stateEvent.valueProperty");
    expect(booleanFormFamily).toContain("groupContext");
    expect(booleanFormFamily).toContain('context.name === "radio-group"');
    expect(booleanFormFamily).toContain(
      'for (const value of ["disabled", "form", "name", "readOnly", "required", "value"])',
    );
    expect(booleanFormFamily).toContain("groupContext.values.includes(value)");
  });

  it("routes Slider through the range control Adapter Output Model family", async () => {
    await expectSpecializedRouteFreeComponent(
      "slider",
      "sliderRuntimeAdapterContract",
      "sliderContract",
    );
    const sliderSpec = await readPortableFile(
      "renderers/specialized-adapter-spec/slider-specialized-adapter-spec.ts",
    );
    const adapterTypes = await readPortableFile("renderers/framework-adapters/types.ts");
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    expect(sliderSpec).toContain("buildSliderAdapterOutputModel");
    expect(sliderSpec).toContain('"range-control"');
    expect(sliderSpec).toContain("spec.slider.thumbInput");
    expect(sliderSpec).toContain("spec.slider.valueControl");
    expect(sliderSpec).toContain("spec.slider.options");
    expect(adapterTypes).toContain('"range-control"');
    expect(astroAdapter).toContain("printAstroRangeControlComponent");
    expect(reactAdapter).toContain("printReactRangeControlComponent");
    expect(astroAdapter).not.toContain("Slider");
    expect(reactAdapter).not.toContain("Slider");
    expect(astroAdapter).not.toContain("createSlider");
    expect(reactAdapter).not.toContain("createSlider");
    expect(astroAdapter).not.toContain("setupSliders");
    expect(reactAdapter).not.toContain("setupSliders");
    expect(sliderSpec).not.toContain("getEvent(");
    expect(sliderSpec).not.toContain("getSetterForState(");
    expect(sliderSpec).not.toContain("getSetterForProp(");
    expect(sliderSpec).not.toContain("getSetterForProps(");
  });

  it("uses Collapsible contract parts, open state, event, presence, asChild, and setter facts in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "collapsible",
      "collapsibleRuntimeAdapterContract",
      "collapsibleContract",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const disclosureFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/disclosure-presence.ts",
    );
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    expect(outputModelBuilder).toContain("disclosurePresenceAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function isDisclosurePresenceOutputModelPlan");
    expect(disclosureFamily).not.toContain("function isCollapsibleDisclosurePresencePlan");
    expect(disclosureFamily).toContain("function isDisclosurePresenceOutputModelPlan");
    expect(disclosureFamily).toContain("function getDisclosurePresenceFacts");
    expect(astroAdapter).toContain("printAstroDisclosurePresenceComponent");
    expect(reactAdapter).toContain("printReactDisclosurePresenceComponent");
    for (const source of [disclosureFamily]) {
      expect(source).toContain('getPart(plan, "root")');
      expect(source).toContain('getPart(plan, "trigger")');
      expect(source).toContain('getPart(plan, "panel")');
      expect(source).toContain('getStateModel(plan, "open")');
      expect(source).toContain('getEvent(plan, "openChange")');
      expect(source).toContain('const openSetter = getSetterForState(plan, "open");');
      expect(source).toContain("openEvent.valueProperty");
      expect(source).toContain('getRenderingPropForTarget(plan, "trigger")');
      expect(source).toContain('getRenderingPropForTarget(plan, "panel")');
      expect(source).toContain('presence?.initialHiddenParts.includes("panel") === true');
    }
    expect(reactAdapter).toContain("formatOptions(facts.setter.options)");
  });

  it("keeps target family printers in framework target homes", async () => {
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    await expectMissingFile("renderers/framework-adapters/astro/static-family-printer-bodies.ts");
    await expectMissingFile("renderers/framework-adapters/react/static-family-printer-bodies.ts");
    for (const adapter of [astroAdapter, reactAdapter]) {
      expect(adapter).not.toContain("STATIC_FAMILY_PRINTER_BRIDGE_DEPENDENCIES");
    }
    expect(astroAdapter).toContain("printAstroDisclosurePresenceComponent");
    expect(astroAdapter).toContain("printAstroPresenceFloatingOverlayComponent");
    expect(reactAdapter).toContain("printReactDisclosurePresenceComponent");
    expect(reactAdapter).toContain("printReactPresenceFloatingOverlayComponent");
  });

  it("uses Toggle Group contract root, value state, event, context, and setter facts in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "toggle-group",
      "toggleGroupRuntimeAdapterContract",
      "toggleGroupContract",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const groupedFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/grouped-value-control.ts",
    );
    const adapterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/astro/adapter.ts"),
      readPortableFile("renderers/framework-adapters/react/adapter.ts"),
    ]);

    expect(outputModelBuilder).toContain("createGroupedValueControlAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function isToggleGroupGroupedValueOutputModelPlan(");
    expect(groupedFamily).toContain("function isToggleGroupGroupedValueOutputModelPlan");
    expect(groupedFamily).toContain("buildGroupedValueControlOutputModel(plan, targetFacts)");
    expect(groupedFamily).toContain('getPart(plan, "root")');
    expect(groupedFamily).toContain('getStateModel(plan, "value")');
    expect(groupedFamily).toContain('getEvent(plan, "valueChange")');
    expect(groupedFamily).toContain('getSetterForState(plan, "value")');
    expect(groupedFamily).toContain("getSetterForProp(plan, disabledProp)");
    expect(groupedFamily).toContain("getSetterForProp(plan, loopFocusProp)");
    expect(groupedFamily).toContain("getSetterForProp(plan, multipleProp)");
    expect(groupedFamily).toContain("getSetterForProp(plan, orientationProp)");
    expect(groupedFamily).toContain("valueEvent.valueProperty");
    expect(groupedFamily).toContain("groupContext");
    expect(groupedFamily).toContain('context.name === "toggle-group"');
    for (const value of ["disabled", "loopFocus", "multiple", "orientation", "value"]) {
      expect(groupedFamily).toContain(`groupContext.values.includes("${value}")`);
    }

    const forbiddenTargetTerms =
      /ToggleGroup|toggleGroup|toggle-group|setupToggleGroups|useToggleGroupContext/;
    for (const adapterSource of adapterSources) {
      expect(adapterSource).not.toMatch(forbiddenTargetTerms);
    }
  });

  it("uses Radio Group contract root, value state, event, context, form, and setter facts in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "radio-group",
      "radioGroupRuntimeAdapterContract",
      "radioGroupContract",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const groupedFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/grouped-value-control.ts",
    );
    const adapterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/astro/adapter.ts"),
      readPortableFile("renderers/framework-adapters/react/adapter.ts"),
    ]);

    expect(outputModelBuilder).toContain("createGroupedValueControlAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function isRadioGroupGroupedValueOutputModelPlan(");
    expect(outputModelBuilder).toContain(
      "getPrimitiveFrameworkAdapterTargetsWithOutputModelCapability",
    );
    expect(outputModelBuilder).toContain("capability.fileExtension");
    expect(groupedFamily).toContain("function isRadioGroupGroupedValueOutputModelPlan");
    expect(groupedFamily).toContain(
      "createGroupedValueControlHelperFile(plan, facts, target, fileExtension)",
    );
    expect(groupedFamily).toContain('getPart(plan, "root")');
    expect(groupedFamily).toContain('getStateModel(plan, "value")');
    expect(groupedFamily).toContain('getEvent(plan, "valueChange")');
    expect(groupedFamily).toContain('getSetterForState(plan, "value")');
    expect(groupedFamily).toContain("getSetterForProp(plan, disabledProp)");
    expect(groupedFamily).toContain("getSetterForProp(plan, orientationProp)");
    expect(groupedFamily).toContain("getSetterForProp(plan, readOnlyProp)");
    expect(groupedFamily).toContain("getSetterForProps(plan, [");
    expect(groupedFamily).toContain("valueSetter.options");
    expect(groupedFamily).toContain("valueEvent.valueProperty");
    expect(groupedFamily).toContain("groupContext");
    expect(groupedFamily).toContain('context.name === "radio-group"');
    for (const value of ["disabled", "form", "name", "readOnly", "required", "value"]) {
      expect(groupedFamily).toContain(`groupContext.values.includes("${value}")`);
    }

    const forbiddenTargetTerms =
      /RadioGroup|radioGroup|radio-group|setupRadioGroups|useRadioGroupContext/;
    for (const adapterSource of adapterSources) {
      expect(adapterSource).not.toMatch(forbiddenTargetTerms);
    }
  });

  it("uses Checkbox Group contract root, value state, event, context, and setter facts in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "checkbox-group",
      "checkboxGroupRuntimeAdapterContract",
      "checkboxGroupContract",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const groupedFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/grouped-value-control.ts",
    );
    const adapterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/astro/adapter.ts"),
      readPortableFile("renderers/framework-adapters/react/adapter.ts"),
    ]);

    expect(outputModelBuilder).toContain("createGroupedValueControlAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain(
      "function isCheckboxGroupGroupedValueOutputModelPlan(",
    );
    expect(outputModelBuilder).toContain(
      "getPrimitiveFrameworkAdapterTargetsWithOutputModelCapability",
    );
    expect(outputModelBuilder).toContain("capability.fileExtension");
    expect(groupedFamily).toContain("function isCheckboxGroupGroupedValueOutputModelPlan");
    expect(groupedFamily).toContain(
      "createGroupedValueControlHelperFile(plan, facts, target, fileExtension)",
    );
    expect(groupedFamily).toContain('getPart(plan, "root")');
    expect(groupedFamily).toContain('getStateModel(plan, "value")');
    expect(groupedFamily).toContain('getEvent(plan, "valueChange")');
    expect(groupedFamily).toContain('getSetterForState(plan, "value")');
    expect(groupedFamily).toContain("getSetterForProp(plan, disabledProp)");
    expect(groupedFamily).toContain("valueEvent.valueProperty");
    expect(groupedFamily).toContain("groupContext");
    expect(groupedFamily).toContain('context.name === "checkbox-group"');
    expect(groupedFamily).toContain('groupContext.values.includes("disabled")');
    expect(groupedFamily).toContain('groupContext.values.includes("value")');
    expect(groupedFamily).toContain("parseValueAttributeFunction");

    const forbiddenTargetTerms =
      /CheckboxGroup|checkboxGroup|checkbox-group|setupCheckboxGroups|parseCheckboxGroupValueAttribute|useCheckboxGroupContext/;
    for (const adapterSource of adapterSources) {
      expect(adapterSource).not.toMatch(forbiddenTargetTerms);
    }
  });

  it("uses Tabs contract parts, value state, event, context, presence, and setter facts in its renderers", async () => {
    await expectSpecializedRouteFreeComponent("tabs", "tabsRuntimeAdapterContract", "tabsContract");
    const tabsSpec = await readPortableFile(
      "renderers/specialized-adapter-spec/tabs-specialized-adapter-spec.ts",
    );
    const adapterTypes = await readPortableFile("renderers/framework-adapters/types.ts");
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    expect(tabsSpec).toContain("buildTabsAdapterOutputModel");
    expect(tabsSpec).toContain('"controlled-value-presence"');
    expect(tabsSpec).toContain("spec.tabs.context");
    expect(tabsSpec).toContain("spec.tabs.valueControl");
    expect(tabsSpec).toContain("spec.tabs.panelVisibility");
    expect(tabsSpec).toContain("spec.tabs.options");
    expect(adapterTypes).toContain('"controlled-value-presence"');
    expect(astroAdapter).toContain("printAstroControlledValuePresenceComponent");
    expect(reactAdapter).toContain("printReactControlledValuePresenceComponent");
    expect(reactAdapter).toContain("printReactControlledValuePresenceHelper");
    expect(tabsSpec).not.toContain('target: "react"');
    expect(astroAdapter).not.toContain("Tabs");
    expect(reactAdapter).not.toContain("Tabs");
    expect(astroAdapter).not.toContain("createTabs");
    expect(reactAdapter).not.toContain("createTabs");
    expect(astroAdapter).not.toContain("setupTabs");
    expect(reactAdapter).not.toContain("setupTabs");
    expect(reactAdapter).not.toContain("useTabsContext");
  });

  it("routes Accordion through the repeated disclosure Adapter Output Model family", async () => {
    await expectSpecializedRouteFreeComponent(
      "accordion",
      "accordionRuntimeAdapterContract",
      "accordionContract",
    );
    const accordionSpec = await readPortableFile(
      "renderers/specialized-adapter-spec/accordion-specialized-adapter-spec.ts",
    );
    const adapterTypes = await readPortableFile("renderers/framework-adapters/types.ts");
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    expect(accordionSpec).toContain("buildAccordionAdapterOutputModel");
    expect(accordionSpec).toContain('"repeated-disclosure"');
    expect(accordionSpec).toContain("spec.accordion.itemContext");
    expect(accordionSpec).toContain("spec.accordion.valueControl");
    expect(accordionSpec).toContain("spec.accordion.panelVisibility");
    expect(adapterTypes).toContain('"repeated-disclosure"');
    expect(astroAdapter).toContain("printAstroRepeatedDisclosureComponent");
    expect(reactAdapter).toContain("printReactRepeatedDisclosureComponent");
    expect(astroAdapter).not.toContain("Accordion");
    expect(reactAdapter).not.toContain("Accordion");
    expect(astroAdapter).not.toContain("createAccordion");
    expect(reactAdapter).not.toContain("createAccordion");
    expect(astroAdapter).not.toContain("setupAccordions");
    expect(reactAdapter).not.toContain("setupAccordions");
  });

  it("uses Form contract parts and validation timing props in its renderers", async () => {
    await expectGenericRouteFreeComponent("form", "formRuntimeAdapterContract", "formContract");
    const contract = await readPortableFile("contracts/primitive/components/form.ts");
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const formFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/form-field-coordinator.ts",
    );
    const frameworkAdapterHomes = await Promise.all(
      [
        "renderers/framework-adapters/astro/adapter.ts",
        "renderers/framework-adapters/react/adapter.ts",
      ].map(readPortableFile),
    );

    expect(outputModelBuilder).toContain("formFieldCoordinatorAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function isFormFieldCoordinatorOutputModelPlan");
    expect(formFamily).toContain("function isFormFieldCoordinatorOutputModelPlan");
    expect(formFamily).toContain("function buildFormFieldCoordinatorOutputModel");
    expect(formFamily).toContain('getPart(plan, "root")');
    expect(formFamily).toContain('getPart(plan, "error-summary")');
    expect(formFamily).toContain('getPlanProp(plan, "validationTiming")');
    expect(formFamily).toContain('getPlanProp(plan, "revalidationTiming")');
    expect(formFamily).toContain('getPlanProp(plan, "errorVisibility")');
    expect(formFamily).toContain('getPlanProp(plan, "data-validation-timing")');
    expect(formFamily).toContain("typeExports");
    expect(formFamily).toContain("helperExports");
    expect(formFamily).not.toContain("formFieldCoordinatorStaticAdapterFamilyPlan");
    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    await expectMissingFile("renderers/framework-adapters/astro/static-family-registry.ts");
    await expectMissingFile("renderers/framework-adapters/react/static-family-registry.ts");
    expect(contract).not.toContain("escapeHatches");

    for (const frameworkAdapterHome of frameworkAdapterHomes) {
      expect(frameworkAdapterHome).toContain("form-field-coordinator");
      expect(frameworkAdapterHome).not.toContain("form-field-control-coordinator");
    }
  });

  it("uses Avatar contract parts, loading status state, event, presence, and prop facts in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "avatar",
      "avatarRuntimeAdapterContract",
      "avatarContract",
    );
    const contract = await readPortableFile("contracts/primitive/components/avatar.ts");
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const mediaStatusFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/media-status.ts",
    );
    const frameworkAdapterHomes = await Promise.all(
      [
        "renderers/framework-adapters/astro/adapter.ts",
        "renderers/framework-adapters/react/adapter.ts",
      ].map(readPortableFile),
    );

    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    expect(outputModelBuilder).toContain("GENERIC_ADAPTER_OUTPUT_FAMILY_MODULES");
    expect(outputModelBuilder).toContain("mediaStatusAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function getMediaStatusFacts");
    expect(mediaStatusFamily).toContain("mediaStatusAdapterFamilyPlan");
    expect(mediaStatusFamily).toContain("matches: isMediaStatusOutputModelPlan");
    expect(mediaStatusFamily).toContain("buildOutputModel: buildMediaStatusOutputModel");
    expect(mediaStatusFamily).toContain('getPart(plan, "image")');
    expect(mediaStatusFamily).toContain('getPart(plan, "fallback")');
    expect(mediaStatusFamily).toContain('getStateModel(plan, "imageLoadingStatus")');
    expect(mediaStatusFamily).toContain('getEvent(plan, "loadingStatusChange")');
    expect(mediaStatusFamily).toContain('getPlanPropForTarget(plan, "alt", "image")');
    expect(mediaStatusFamily).toContain('getPlanPropForTarget(plan, "image", "image")');
    expect(mediaStatusFamily).toContain('getPlanPropForTarget(plan, "src", "image")');
    expect(mediaStatusFamily).toContain('getPlanPropForTarget(plan, "delay", "fallback")');
    expect(mediaStatusFamily).toContain('assetProp?.kind === "rendering"');
    expect(mediaStatusFamily).not.toContain('type === "ImageMetadata"');
    expect(mediaStatusFamily).toContain(
      "getStaticAttributeName(plan, rootPart, loadingStatusAttribute)",
    );
    expect(mediaStatusFamily).toContain("loadingStatusEvent.domEvent");
    expect(mediaStatusFamily).toContain("loadingStatusEvent.valueProperty");
    expect(contract).not.toContain("escapeHatches");

    for (const frameworkAdapterHome of frameworkAdapterHomes) {
      expect(frameworkAdapterHome).toContain("media-status");
      expect(frameworkAdapterHome).not.toContain("Avatar");
      expect(frameworkAdapterHome).not.toContain("avatar");
      expect(frameworkAdapterHome).toContain("MediaStatus");
    }
  });

  it("uses Button contract root, disabled, and action-surface facts in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "button",
      "buttonRuntimeAdapterContract",
      "buttonContract",
    );
    const actionSurfaceFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/action-surface.ts",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const reactActionSurfacePrinter = await readPortableFile(
      "renderers/framework-adapters/react/action-surface.ts",
    );

    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    await expectMissingFile("renderers/framework-adapters/astro/static-family-registry.ts");
    await expectMissingFile("renderers/framework-adapters/react/static-family-registry.ts");
    expect(actionSurfaceFamily).toContain("actionSurfaceAdapterFamilyPlan");
    expect(actionSurfaceFamily).toContain("matches: isActionSurfaceOutputModelPlan");
    expect(actionSurfaceFamily).toContain("buildOutputModel: buildActionSurfaceOutputModel");
    expect(actionSurfaceFamily).toContain('const rootPart = getPart(plan, "root")');
    expect(actionSurfaceFamily).toContain("focusableWhenDisabled: getAdapterFamilyProp(");
    expect(actionSurfaceFamily).toContain('getPlanProp(plan, "focusableWhenDisabled")');
    expect(actionSurfaceFamily).toContain('type: getAdapterFamilyProp(getPlanProp(plan, "type"))');
    expect(actionSurfaceFamily).toContain('getRuntimeOptionProps(plan, ["disabled"])');
    expect(actionSurfaceFamily).toContain('getSetterForProp(plan, "disabled")');
    expect(actionSurfaceFamily).toContain('truthyValue: "true"');
    expect(outputModelBuilder).not.toContain("isButtonRootOutput");
    expect(reactActionSurfacePrinter).toContain("focusableWhenDisabled");
    expect(reactActionSurfacePrinter).toContain("${facts.runtime.factory}(root");
    expect(reactActionSurfacePrinter).toContain("facts.runtime.disabledSetter.method");
    expect(reactActionSurfacePrinter).toContain("dependencies: [focusableWhenDisabled]");
    expect(reactActionSurfacePrinter).toContain("dependencies: [disabled]");
  });

  it("uses Input contract value, event, form, and native-input-value facts in its renderers", async () => {
    await expectGenericRouteFreeComponent("input", "inputRuntimeAdapterContract", "inputContract");
    const nativeInputValueFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/native-input-value.ts",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const reactNativeInputValuePrinter = await readPortableFile(
      "renderers/framework-adapters/react/native-input-value.ts",
    );

    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    await expectMissingFile("renderers/framework-adapters/astro/static-family-registry.ts");
    await expectMissingFile("renderers/framework-adapters/react/static-family-registry.ts");
    expect(nativeInputValueFamily).toContain("nativeInputValueAdapterFamilyPlan");
    expect(nativeInputValueFamily).toContain("matches: isNativeInputValueOutputModelPlan");
    expect(nativeInputValueFamily).toContain("buildOutputModel: buildNativeInputValueOutputModel");
    expect(nativeInputValueFamily).toContain('const valueState = getStateModel(plan, "value")');
    expect(nativeInputValueFamily).toContain(
      'const valueChangeEvent = getEvent(plan, "valueChange")',
    );
    expect(nativeInputValueFamily).toContain(
      'defaultValue: getAdapterFamilyProp(getPlanProp(plan, "defaultValue"))',
    );
    expect(outputModelBuilder).not.toContain("isNativeInputValuePart");
    expect(reactNativeInputValuePrinter).toContain("valueChangeDetailsRef");
    expect(reactNativeInputValuePrinter).toContain("scheduleControlledSync");
  });

  it("uses Progress contract parts, value state, range props, and setter facts in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "progress",
      "progressRuntimeAdapterContract",
      "progressContract",
    );
    const progressFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/range-status.ts",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const reactRangeStatusPrinter = await readPortableFile(
      "renderers/framework-adapters/react/range-status.ts",
    );

    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    await expectMissingFile("renderers/framework-adapters/react/static-family-registry.ts");
    expect(progressFamily).toContain("rangeStatusAdapterFamilyPlan");
    expect(progressFamily).toContain("matches: isRangeStatusOutputModelPlan");
    expect(progressFamily).toContain("buildOutputModel: buildRangeStatusOutputModel");
    expect(progressFamily).toContain('const valueState = getStateModel(plan, "value")');
    expect(progressFamily).toContain('max: getAdapterFamilyProp(getPlanProp(plan, "max"))');
    expect(progressFamily).toContain('min: getAdapterFamilyProp(getPlanProp(plan, "min"))');
    expect(progressFamily).toContain(
      'format: getOptionalAdapterFamilyProp(getOptionalPlanProp(plan, "format"))',
    );
    expect(progressFamily).toContain("getAriaValueText: getOptionalAdapterFamilyProp(");
    expect(progressFamily).toContain('getOptionalPlanProp(plan, "getAriaValueText")');
    expect(progressFamily).toContain(
      'locale: getOptionalAdapterFamilyProp(getOptionalPlanProp(plan, "locale"))',
    );
    expect(progressFamily).toContain(
      'valuePreserveText: getStaticAttributeName(plan, valuePart, "data-preserve-text")',
    );
    expect(progressFamily).toContain(
      'const valueSetter = getSetterForProps(plan, [valuePropName, "max", "min"])',
    );
    expect(outputModelBuilder).not.toContain("function getProgressFacts");
    expect(reactRangeStatusPrinter).toContain("formatOptionsSetter.method");
    expect(reactRangeStatusPrinter).toContain("ariaValueTextRef");
  });

  it("keeps Astro native body printers in the Astro target home", async () => {
    const astroNativeDisabledPrinter = await readPortableFile(
      "renderers/framework-adapters/astro/native-disabled.ts",
    );

    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    await expectMissingFile("renderers/framework-adapters/astro/static-family-registry.ts");
    await expectMissingFile("renderers/framework-adapters/astro/static.ts");
    expect(astroNativeDisabledPrinter).toContain(
      'import type { HTMLAttributes } from "astro/types";',
    );
  });

  it("keeps React native body printers in the React target home", async () => {
    const reactNativeInputValuePrinter = await readPortableFile(
      "renderers/framework-adapters/react/native-input-value.ts",
    );

    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    await expectMissingFile("renderers/framework-adapters/react/static.ts");
    expect(reactNativeInputValuePrinter).toContain('import * as React from "react";');
  });

  it("keeps legacy static family printer registries out of target adapters", async () => {
    const familyPlanTypes = await readPortableFile(
      "renderers/generic-adapter-plan/adapter-family-plans.ts",
    );
    const adapterTypes = await readPortableFile("renderers/framework-adapters/types.ts");
    const frameworkTargetRegistry = await readPortableFile(
      "renderers/framework-adapters/target-registry.ts",
    );
    const astroTargetRegistration = await readPortableFile(
      "renderers/framework-adapters/astro/index.ts",
    );
    const reactTargetRegistration = await readPortableFile(
      "renderers/framework-adapters/react/index.ts",
    );

    expect(familyPlanTypes).not.toContain("printAstro");
    expect(familyPlanTypes).not.toContain("printReact");
    expect(familyPlanTypes).not.toContain("validate?:");
    expect(adapterTypes).toContain("FrameworkAdapterTargetPrimitiveCapability");
    expect(adapterTypes).not.toContain("FrameworkAdapterTargetStaticAdapterPlan");
    expect(adapterTypes).not.toContain("staticPlan:");
    expect(adapterTypes).not.toContain("createFamilyPrinterRegistry()");
    expect(frameworkTargetRegistry).toContain("primitiveFrameworkAdapterTargets");
    expect(astroTargetRegistration).not.toContain("staticPlan");
    expect(reactTargetRegistration).not.toContain("staticPlan");
    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printers.ts");
    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    await expectMissingFile("renderers/framework-adapters/astro/static-family-registry.ts");
    await expectMissingFile("renderers/framework-adapters/react/static-family-registry.ts");
  });

  it("keeps specialized projection surfaces high level", async () => {
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");
    const astroSpecializedProjection = await readPortableFile(
      "renderers/framework-adapters/astro/specialized-adapter-spec.ts",
    );
    const reactSpecializedProjection = await readPortableFile(
      "renderers/framework-adapters/react/specialized-adapter-spec.ts",
    );

    await expectMissingFile("renderers/generic-adapter-plan/static-adapter-printer-core.ts");
    for (const adapter of [astroAdapter, reactAdapter]) {
      expect(adapter).not.toContain("printStaticAdapterPlanWithTarget");
    }

    for (const projection of [astroSpecializedProjection, reactSpecializedProjection]) {
      expect(projection).toContain("projectSpecializedAdapterOutputModel");
      expect(projection).not.toContain("printOutputModel");
      expect(projection).not.toContain("printRenderPlan");
    }
  });

  it("uses Scroll Area contract parts, measurement props, presence, and initial attributes in its renderers", async () => {
    await expectGenericRouteFreeComponent(
      "scroll-area",
      "scrollAreaRuntimeAdapterContract",
      "scrollAreaContract",
    );
    const contract = await readPortableFile("contracts/primitive/components/scroll-area.ts");
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const viewportMeasurementFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/viewport-measurement.ts",
    );
    const frameworkAdapterHomes = await Promise.all(
      [
        "renderers/framework-adapters/astro/adapter.ts",
        "renderers/framework-adapters/react/adapter.ts",
      ].map(readPortableFile),
    );

    expect(outputModelBuilder).toContain("viewportMeasurementAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function buildViewportMeasurementOutputModel");
    expect(outputModelBuilder).not.toContain("function isViewportMeasurementOutputModelPlan");
    expect(viewportMeasurementFamily).toContain("isViewportMeasurementOutputModelPlan(plan)");
    expect(viewportMeasurementFamily).toContain("getViewportMeasurementFacts(plan)");
    expect(viewportMeasurementFamily).toContain("getPart(plan, plan.runtime.rootPart)");
    expect(viewportMeasurementFamily).toContain('getPart(plan, "viewport")');
    expect(viewportMeasurementFamily).toContain('getPart(plan, "content")');
    expect(viewportMeasurementFamily).toContain('getPart(plan, "scrollbar")');
    expect(viewportMeasurementFamily).toContain('getPart(plan, "thumb")');
    expect(viewportMeasurementFamily).toContain('getPart(plan, "corner")');
    expect(viewportMeasurementFamily).toContain(
      'getPlanPropForTarget(plan, "overflowEdgeThreshold", "root")',
    );
    expect(viewportMeasurementFamily).toContain(
      'getPlanPropForTarget(plan, "keepMounted", "scrollbar")',
    );
    expect(viewportMeasurementFamily).toContain(
      'getStaticAttributeName(plan, viewportPart, "tabindex")',
    );
    expect(viewportMeasurementFamily).toContain(
      'getStaticAttributeName(plan, viewportPart, "tabIndex")',
    );
    expect(contract).not.toContain("escapeHatches");

    for (const frameworkAdapterHome of frameworkAdapterHomes) {
      expect(frameworkAdapterHome).toContain("viewport-measurement");
      expect(frameworkAdapterHome).not.toMatch(
        /ScrollArea|scrollArea|scroll-area|setupScrollAreas/,
      );
    }
  });

  it("routes Input OTP through the hidden input visual slot Adapter Output Model family", async () => {
    await expectSpecializedRouteFreeComponent(
      "input-otp",
      "inputOtpRuntimeAdapterContract",
      "inputOtpContract",
    );
    const inputOtpSpec = await readPortableFile(
      "renderers/specialized-adapter-spec/input-otp-specialized-adapter-spec.ts",
    );
    const adapterTypes = await readPortableFile("renderers/framework-adapters/types.ts");
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    expect(inputOtpSpec).toContain("buildInputOtpAdapterOutputModel");
    expect(inputOtpSpec).toContain('"hidden-input-visual-slot"');
    expect(inputOtpSpec).toContain("spec.inputOtp.nativeInput");
    expect(inputOtpSpec).toContain("spec.inputOtp.valueControl");
    expect(inputOtpSpec).toContain("spec.inputOtp.visualSlots");
    expect(adapterTypes).toContain('"hidden-input-visual-slot"');
    expect(astroAdapter).toContain("printAstroHiddenInputVisualSlotComponent");
    expect(reactAdapter).toContain("printReactHiddenInputVisualSlotComponent");
    expect(astroAdapter).not.toContain("InputOtp");
    expect(reactAdapter).not.toContain("InputOtp");
    expect(astroAdapter).not.toContain("createInputOtp");
    expect(reactAdapter).not.toContain("createInputOtp");
    expect(astroAdapter).not.toContain("setupInputOtps");
    expect(reactAdapter).not.toContain("setupInputOtps");
  });

  it("routes Dropzone through the file drop control Adapter Output Model family", async () => {
    await expectSpecializedRouteFreeComponent(
      "dropzone",
      "dropzoneRuntimeAdapterContract",
      "dropzoneContract",
    );
    const dropzoneSpec = await readPortableFile(
      "renderers/specialized-adapter-spec/dropzone-specialized-adapter-spec.ts",
    );
    const adapterTypes = await readPortableFile("renderers/framework-adapters/types.ts");
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    expect(dropzoneSpec).toContain("buildDropzoneAdapterOutputModel");
    expect(dropzoneSpec).toContain('"file-drop-control"');
    expect(dropzoneSpec).toContain("spec.dropzone.fileInput");
    expect(dropzoneSpec).toContain("spec.dropzone.fileList");
    expect(dropzoneSpec).toContain("spec.dropzone.filesChange");
    expect(dropzoneSpec).toContain("spec.dropzone.uploadState");
    expect(adapterTypes).toContain('"file-drop-control"');
    expect(astroAdapter).toContain("printAstroFileDropControlComponent");
    expect(reactAdapter).toContain("printReactFileDropControlComponent");
    expect(astroAdapter).not.toContain("Dropzone");
    expect(reactAdapter).not.toContain("Dropzone");
    expect(astroAdapter).not.toContain("createDropzone");
    expect(reactAdapter).not.toContain("createDropzone");
    expect(astroAdapter).not.toContain("setupDropzones");
    expect(reactAdapter).not.toContain("setupDropzones");
  });

  it("routes Tooltip through the specialized adapter spec writers", async () => {
    await expectSpecializedRouteFreeComponent(
      "tooltip",
      "tooltipRuntimeAdapterContract",
      "tooltipContract",
    );
    const tooltipSpec = await readPortableFile(
      "renderers/specialized-adapter-spec/tooltip-specialized-adapter-spec.ts",
    );

    expect(tooltipSpec).toContain("validateTooltipSpecializedAdapterSpec");
    expect(tooltipSpec).toContain("getTooltipAnatomyPart");
    expect(tooltipSpec).toContain("getTooltipFloatingAttribute");
    expect(tooltipSpec).toContain("getTooltipSpecFileBasename");
    expect(tooltipSpec).toContain("buildTooltipAdapterOutputModel");
    expect(tooltipSpec).toContain("spec.tooltip.stateControl.setterSync.open");
  });

  it("routes Popover through the presence floating overlay Adapter Output Model family", async () => {
    await expectGenericRouteFreeComponent(
      "popover",
      "popoverRuntimeAdapterContract",
      "popoverContract",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const presenceFloatingOverlayFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/presence-floating-overlay.ts",
    );
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");
    const reactAsChildFragments = await readPortableFile(
      "renderers/framework-adapters/react/as-child-trigger-fragments.ts",
    );

    expect(outputModelBuilder).toContain("presenceFloatingOverlayAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function isPresenceFloatingOverlayOutputModelPlan(");
    expect(outputModelBuilder).not.toContain("function getPresenceFloatingOverlayFacts(");
    expect(presenceFloatingOverlayFamily).toContain('"popover"');
    expect(presenceFloatingOverlayFamily).toContain('"presence-floating-overlay"');
    expect(presenceFloatingOverlayFamily).toContain(
      "isPresenceFloatingOverlayOutputModelPlan(plan)",
    );
    expect(presenceFloatingOverlayFamily).toContain('plan.floating?.anchorPart === "trigger"');
    expect(presenceFloatingOverlayFamily).toContain('plan.floating.portalPart === "portal"');
    expect(presenceFloatingOverlayFamily).toContain('asChild?.part === "trigger"');
    expect(presenceFloatingOverlayFamily).toContain("floating: {");
    expect(presenceFloatingOverlayFamily).toContain("closeDelay:");
    expect(presenceFloatingOverlayFamily).toContain("openOnHover:");
    expect(astroAdapter).toContain("printAstroPresenceFloatingOverlayComponent");
    expect(astroAdapter).toContain("printAstroPresenceFloatingOverlayIndex");
    expect(reactAdapter).toContain("printReactPresenceFloatingOverlayComponent");
    expect(reactAdapter).toContain("printReactPresenceFloatingOverlayIndex");
    expect(reactAsChildFragments).toContain("useComposedRefs");
    expect(reactAsChildFragments).toContain("getElementRef");
  });

  it("uses Dialog contract parts, open state, and native overlay facts in the Adapter Output Model", async () => {
    await expectGenericRouteFreeComponent(
      "dialog",
      "dialogRuntimeAdapterContract",
      "dialogContract",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const nativeOverlayFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/native-overlay.ts",
    );
    const astroAdapter = await readPortableFile("renderers/framework-adapters/astro/adapter.ts");
    const reactAdapter = await readPortableFile("renderers/framework-adapters/react/adapter.ts");

    expect(outputModelBuilder).toContain("nativeOverlayAdapterFamilyPlan");
    expect(outputModelBuilder).not.toContain("function isNativeOverlayOutputModelPlan(");
    expect(outputModelBuilder).not.toContain("function getNativeOverlayFacts(");
    expect(nativeOverlayFamily).toContain("function isNativeOverlayOutputModelPlan(");
    expect(nativeOverlayFamily).toContain("function getNativeOverlayFacts(");
    expect(nativeOverlayFamily).toContain('plan.component !== "dialog"');
    expect(nativeOverlayFamily).toContain('getPart(plan, "root")');
    expect(nativeOverlayFamily).toContain('getPart(plan, "trigger")');
    expect(nativeOverlayFamily).toContain('getPart(plan, "backdrop")');
    expect(nativeOverlayFamily).toContain('getPart(plan, "popup")');
    expect(nativeOverlayFamily).toContain('getPart(plan, "title")');
    expect(nativeOverlayFamily).toContain('getPart(plan, "description")');
    expect(nativeOverlayFamily).toContain('getPart(plan, "close")');
    expect(nativeOverlayFamily).toContain('getStateModel(plan, "open")');
    expect(nativeOverlayFamily).toContain('getEvent(plan, "openChange")');
    expect(nativeOverlayFamily).toContain('getEvent(plan, "closeComplete")');
    expect(nativeOverlayFamily).toContain('getSetterForState(plan, "open")');
    expect(nativeOverlayFamily).toContain('plan.presence?.unmountPolicy !== "runtime-owned"');
    expect(nativeOverlayFamily).toContain('kind: "native-overlay"');
    expect(reactAdapter).toContain("${openEvent.callbackProp}: (nextOpen, details)");
    expect(reactAdapter).not.toContain('instance.subscribe("openChange"');
    expect(reactAdapter).toContain("formatOptions(facts.setter.options)");
    expect(astroAdapter).toContain("printAstroNativeOverlayRoot");
    expect(reactAdapter).toContain("printReactNativeOverlayRoot");
  });

  it("routes Alert Dialog through the native overlay Adapter Output Model family", async () => {
    await expectGenericRouteFreeComponent(
      "alert-dialog",
      "alertDialogRuntimeAdapterContract",
      "alertDialogContract",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const nativeOverlayFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/native-overlay.ts",
    );

    expect(outputModelBuilder).toContain("nativeOverlayAdapterFamilyPlan");
    expect(nativeOverlayFamily).toContain('"alert-dialog"');
    expect(nativeOverlayFamily).toContain(
      'popupPart.role === (plan.component === "alert-dialog" ? "alertdialog" : "dialog")',
    );
    expect(nativeOverlayFamily).toContain("hasNativeOverlayPopupRoleAttribute");
    expect(nativeOverlayFamily).toContain("popupRoleValue");
  });

  it("routes Drawer through the native overlay Adapter Output Model family", async () => {
    await expectGenericRouteFreeComponent(
      "drawer",
      "drawerRuntimeAdapterContract",
      "drawerContract",
    );
    const outputModelBuilder = await readPortableFile(
      "renderers/generic-adapter-plan/generic-adapter-output-model.ts",
    );
    const nativeOverlayFamily = await readPortableFile(
      "renderers/generic-adapter-plan/families/native-overlay.ts",
    );

    expect(outputModelBuilder).toContain("nativeOverlayAdapterFamilyPlan");
    expect(nativeOverlayFamily).toContain('"drawer"');
    expect(nativeOverlayFamily).toContain('sideProp?.targets?.includes("popup") === true');
    expect(nativeOverlayFamily).toContain("popupSide");
  });

  it("routes Menu primitive generation through the Specialized Adapter Spec seam", async () => {
    await expectSpecializedRouteFreeComponent("menu", "menuRuntimeAdapterContract", "menuContract");
    const menuSpecRenderer = await readPortableFile(
      "renderers/specialized-adapter-spec/menu-specialized-adapter-spec.ts",
    );

    expect(menuSpecRenderer).toContain("buildMenuAdapterOutputModel");
    expect(menuSpecRenderer).toContain("composite-menu-overlay");
    expect(menuSpecRenderer).not.toContain("writeGeneratedFile");
    expect(menuSpecRenderer).not.toContain("${astroHeader}");
    expect(menuSpecRenderer).not.toContain("${tsHeader}");

    const targetAdapterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/astro/adapter.ts"),
      readPortableFile("renderers/framework-adapters/astro/composite-menu-overlay.ts"),
      readPortableFile("renderers/framework-adapters/react/adapter.ts"),
      readPortableFile("renderers/framework-adapters/react/composite-menu-overlay.ts"),
    ]);
    for (const adapter of targetAdapterSources) {
      expect(adapter).not.toContain("MenuRoot");
      expect(adapter).not.toContain("MenuItem");
      expect(adapter).not.toContain("createMenu");
      expect(adapter).not.toContain("setupMenus");
      expect(adapter).not.toContain("data-sw-context-menu");
      expect(adapter).not.toMatch(/\bconst menu\s*=/);
      expect(adapter).not.toMatch(/\bmenu\./);
    }
  });

  it("routes Context Menu primitive generation through the Specialized Adapter Spec seam", async () => {
    await expectSpecializedRouteFreeComponent(
      "context-menu",
      "contextMenuRuntimeAdapterContract",
      "contextMenuContract",
    );
    const contextMenuSpecRenderer = await readPortableFile(
      "renderers/specialized-adapter-spec/context-menu-specialized-adapter-spec.ts",
    );

    expect(contextMenuSpecRenderer).toContain("buildContextMenuAdapterOutputModel");
    expect(contextMenuSpecRenderer).toContain("anchored-menu-overlay");
    expect(contextMenuSpecRenderer).not.toContain("writeGeneratedFile");
    expect(contextMenuSpecRenderer).not.toContain("${astroHeader}");
    expect(contextMenuSpecRenderer).not.toContain("${tsHeader}");
    expect(contextMenuSpecRenderer).not.toContain("reactProperty");
    expect(contextMenuSpecRenderer).not.toContain("WebkitTouchCallout");

    const targetAdapterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/astro/adapter.ts"),
      readPortableFile("renderers/framework-adapters/astro/anchored-menu-overlay.ts"),
      readPortableFile("renderers/framework-adapters/react/adapter.ts"),
      readPortableFile("renderers/framework-adapters/react/anchored-menu-overlay.ts"),
    ]);
    for (const adapter of targetAdapterSources) {
      expect(adapter).not.toContain("ContextMenuRoot");
      expect(adapter).not.toContain("ContextMenuTrigger");
      expect(adapter).not.toContain("createContextMenu");
      expect(adapter).not.toContain("data-sw-context-menu");
      expect(adapter).not.toMatch(/\bconst contextMenu\s*=/);
      expect(adapter).not.toMatch(/\bcontextMenu\./);
    }
  });

  it("routes Navigation Menu primitive generation through the Specialized Adapter Spec seam", async () => {
    await expectSpecializedRouteFreeComponent(
      "navigation-menu",
      "navigationMenuRuntimeAdapterContract",
      "navigationMenuContract",
    );
    const navigationMenuSpecRenderer = await readPortableFile(
      "renderers/specialized-adapter-spec/navigation-menu-specialized-adapter-spec.ts",
    );

    expect(navigationMenuSpecRenderer).toContain("buildNavigationMenuAdapterOutputModel");
    expect(navigationMenuSpecRenderer).toContain("shared-viewport-navigation");
    expect(navigationMenuSpecRenderer).not.toContain("writeGeneratedFile");
    expect(navigationMenuSpecRenderer).not.toContain("${astroHeader}");
    expect(navigationMenuSpecRenderer).not.toContain("${tsHeader}");

    const targetAdapterSources = await Promise.all([
      readPortableFile("renderers/framework-adapters/astro/adapter.ts"),
      readPortableFile("renderers/framework-adapters/astro/shared-viewport-navigation.ts"),
      readPortableFile("renderers/framework-adapters/react/adapter.ts"),
      readPortableFile("renderers/framework-adapters/react/shared-viewport-navigation.ts"),
    ]);
    for (const adapter of targetAdapterSources) {
      expect(adapter).not.toContain("NavigationMenuRoot");
      expect(adapter).not.toContain("NavigationMenuTrigger");
      expect(adapter).not.toContain("createNavigationMenu");
      expect(adapter).not.toContain("data-sw-nav-menu");
      expect(adapter).not.toMatch(/\bconst navigationMenu\s*=/);
      expect(adapter).not.toMatch(/\bnavigationMenu\./);
    }
  });

  it("uses Sidebar contract parts, dual open state, events, persistence props, and escape-hatched styled anatomy in its renderers", async () => {
    await expectSpecializedRouteFreeComponent(
      "sidebar",
      "sidebarRuntimeAdapterContract",
      "sidebarContract",
    );
    const sidebarSpec = await readPortableFile(
      "renderers/specialized-adapter-spec/sidebar-specialized-adapter-spec.ts",
    );

    expect(sidebarSpec).toContain("validateSidebarSpecializedAdapterSpec");
    expect(sidebarSpec).toContain("spec.sidebar.anatomy");
    expect(sidebarSpec).toContain("spec.sidebar.namespace");
    expect(sidebarSpec).toContain("spec.sidebar.providerOptions");
    expect(sidebarSpec).toContain("spec.sidebar.sidebarOptions");
    expect(sidebarSpec).toContain("spec.sidebar.stateControls");
    expect(sidebarSpec).toContain("spec.sidebar.toggleTargets");
    expect(sidebarSpec).toContain("getSidebarOutputAnatomyPart");
    expect(sidebarSpec).toContain("stateControls.open.state");
    expect(sidebarSpec).toContain("stateControls.mobileOpen.state");
    expect(sidebarSpec).toContain("providerOptions.persistOpen.prop");
    expect(sidebarSpec).toContain("stateControls.open.event");
    expect(sidebarSpec).toContain("stateControls.mobileOpen.event");
    expect(sidebarSpec).toContain("stateControls.open.setterSync.options");
    expect(sidebarSpec).toContain("stateControls.mobileOpen.setterSync.options");
    expect(sidebarSpec).not.toContain("getEvent(");
    expect(sidebarSpec).not.toContain("getSetterForState(");
  });

  it("keeps the styled contract inventory complete", async () => {
    const actualComponents = (await readDirectoryFileNames("contracts/styled/components"))
      .filter((fileName) => fileName.endsWith(".ts") && fileName !== "index.ts")
      .map((fileName) => fileName.replace(/\.ts$/, ""))
      .sort();

    expect(actualComponents).toEqual([...STYLED_COMPONENTS].sort());
  });

  it("keeps styled Starwind contracts component-scoped with a stable thin aggregator", async () => {
    const aggregator = await readPortableFile("contracts/styled/starwind.ts");
    const componentIndex = await readPortableFile("contracts/styled/components/index.ts");

    expect(lineCount(aggregator)).toBeLessThan(10);
    expect(aggregator).toContain("starwindStyledContracts");
    expect(aggregator).toContain("./components/index.js");
    expect(componentIndex).toContain("starwindStyledContracts");

    for (const component of STYLED_COMPONENTS) {
      await expectExistingFile(`contracts/styled/components/${component}.ts`);
      expect(componentIndex).toContain(`./${component}.js`);
    }
  });

  it("keeps styled generator implementation inside framework adapter homes", async () => {
    const astroWrapperScript = await readPortableFile("generate-astro-wrappers.ts");
    const reactWrapperScript = await readPortableFile("generate-react-wrappers.ts");

    await expectMissingFile("renderers/astro-styled.ts");
    await expectMissingFile("renderers/react-styled.ts");
    await expectExistingFile("renderers/framework-adapters/astro/styled.ts");
    await expectExistingFile("renderers/framework-adapters/react/styled.ts");
    expect(astroWrapperScript).toContain("generateFrameworkStyledWrappers");
    expect(reactWrapperScript).toContain("generateFrameworkStyledWrappers");
    expect(astroWrapperScript).not.toContain("framework-adapters/astro/styled.js");
    expect(reactWrapperScript).not.toContain("framework-adapters/react/styled.js");
    expect(astroWrapperScript).not.toContain("renderers/astro-styled");
    expect(reactWrapperScript).not.toContain("renderers/react-styled");
  });
});

function isFrameworkSpecificContainmentAuditScope(relativePath: string): boolean {
  if (!relativePath.startsWith("renderers/")) return false;
  if (FRAMEWORK_ADAPTER_TARGET_HOME_PATTERN.test(relativePath)) return false;

  return true;
}

function getFrameworkSpecificContainmentLabels(source: string): string[] {
  return FRAMEWORK_SPECIFIC_CONTAINMENT_PATTERNS.flatMap(({ label, pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(source) ? [label] : [];
  });
}

function getShippingSpecializedAdapterProjectionLabels(source: string): string[] {
  return SHIPPING_SPECIALIZED_ADAPTER_PROJECTION_PATTERNS.flatMap(({ label, pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(source) ? [label] : [];
  });
}

function getFutureFrameworkTracerSharedLabels(source: string): string[] {
  return FUTURE_FRAMEWORK_TRACER_SHARED_PATTERNS.flatMap(({ label, pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(source) ? [label] : [];
  });
}

function getFutureFrameworkTracerShippingSurfaceLabels(source: string): string[] {
  return FUTURE_FRAMEWORK_TRACER_SHIPPING_SURFACE_PATTERNS.flatMap(({ label, pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(source) ? [label] : [];
  });
}

function isFrameworkSpecificContainmentException(relativePath: string): boolean {
  return FRAMEWORK_SPECIFIC_CONTAINMENT_EXCEPTIONS.some((exception) => {
    if (exception.path && exception.path === relativePath) return true;
    return Boolean(exception.pathPrefix && relativePath.startsWith(exception.pathPrefix));
  });
}

async function expectExistingFile(relativePath: string): Promise<void> {
  const stats = await stat(path.join(SCRIPT_ROOT, relativePath));
  expect(stats.isFile()).toBe(true);
}

async function expectMissingFile(relativePath: string): Promise<void> {
  await expect(stat(path.join(SCRIPT_ROOT, relativePath))).rejects.toMatchObject({
    code: "ENOENT",
  });
}

async function expectGenericRouteFreeComponent(
  component: string,
  _contractName: string,
  legacyContractName: string,
): Promise<void> {
  const registry = await readPortableFile("renderers/primitive-generator-registry.ts");
  const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === component);
  const inventoryEntry = getPrimitiveInventoryEntry(component);

  expect(entry).toEqual(
    expect.objectContaining({
      component,
      routeFree: {
        kind: "adapter-output-model",
        strategy: "generic-adapter-plan",
        targets: ["astro", "react"],
      },
    }),
  );
  expect(inventoryEntry).toEqual(
    expect.objectContaining({
      component,
      contract: expect.objectContaining({ component }),
      generation: expect.objectContaining({
        strategy: "generic-adapter-plan",
      }),
      kind: "runtime-adapter-contract",
    }),
  );
  expect(registry).toContain("createGenericAdapterPlanPrimitiveGeneratorEntry");
  expect(registry).not.toContain(legacyContractName);
}

async function expectSpecializedRouteFreeComponent(
  component: string,
  _contractName: string,
  legacyContractName: string,
): Promise<void> {
  const registry = await readPortableFile("renderers/primitive-generator-registry.ts");
  const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === component);
  const inventoryEntry = getPrimitiveInventoryEntry(component);
  const componentName = toPascalCase(component);

  expect(entry).toEqual(
    expect.objectContaining({
      component,
      routeFree: {
        kind: "adapter-output-model",
        strategy: "specialized-adapter-spec",
        targets: ["astro", "react"],
      },
      source: "specialized-adapter-spec",
    }),
  );
  expect(inventoryEntry).toEqual(
    expect.objectContaining({
      component,
      contract: expect.objectContaining({ component }),
      generation: expect.objectContaining({
        source: "specialized-adapter-spec",
        strategy: "specialized-adapter-spec",
      }),
      kind: "runtime-adapter-contract",
    }),
  );
  expect(registry).toContain(`buildSpec: build${componentName}SpecializedAdapterSpec`);
  expect(registry).toContain(`buildOutputModel: build${componentName}AdapterOutputModel`);
  expect(registry).not.toContain(`./primitives/${component}/astro.js`);
  expect(registry).not.toContain(`./primitives/${component}/react.js`);
  expect(registry).not.toContain(legacyContractName);
  await expectMissingFile(`renderers/primitives/${component}/astro.ts`);
  await expectMissingFile(`renderers/primitives/${component}/react.ts`);
}

async function readPortableFile(relativePath: string): Promise<string> {
  return readFile(path.join(SCRIPT_ROOT, relativePath), "utf8");
}

async function readDirectoryNames(relativePath: string): Promise<string[]> {
  const entries = await readdir(path.join(SCRIPT_ROOT, relativePath), { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function readDirectoryFileNames(relativePath: string): Promise<string[]> {
  const entries = await readdir(path.join(SCRIPT_ROOT, relativePath), { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

async function readFilesRecursively(
  dir: string,
  root: string = dir,
): Promise<Array<{ relativePath: string; source: string }>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return readFilesRecursively(entryPath, root);
      }

      return [
        {
          relativePath: path.relative(root, entryPath).split(path.sep).join("/"),
          source: await readFile(entryPath, "utf8"),
        },
      ];
    }),
  );

  return files.flat();
}

function findRelativeImportCycles(
  files: Array<{ relativePath: string; source: string }>,
): string[][] {
  const filePaths = new Set(files.map((file) => file.relativePath));
  const dependencies = new Map(
    files.map((file) => {
      const imports = [...file.source.matchAll(/from "(\.[^"]+)"/g)]
        .map((match) =>
          path.posix
            .normalize(path.posix.join(path.posix.dirname(file.relativePath), match[1]!))
            .replace(/\.js$/, ".ts"),
        )
        .filter((dependency) => filePaths.has(dependency));
      return [file.relativePath, imports] as const;
    }),
  );
  const cycles: string[][] = [];
  const completed = new Set<string>();

  const visit = (current: string, stack: string[]): void => {
    const cycleStart = stack.indexOf(current);
    if (cycleStart >= 0) {
      cycles.push([...stack.slice(cycleStart), current]);
      return;
    }
    if (completed.has(current)) return;

    const nextStack = [...stack, current];
    for (const dependency of dependencies.get(current) ?? []) visit(dependency, nextStack);
    completed.add(current);
  };

  for (const file of files) visit(file.relativePath, []);
  return cycles;
}

function hasFilesystemWriteEffect(source: string): boolean {
  const writeMethod =
    "(?:appendFile|chmod|chown|copyFile|cp|createWriteStream|link|lchmod|lchown|lutimes|mkdir|mkdtemp|rename|rm|rmdir|symlink|truncate|unlink|utimes|writeFile)(?:Sync)?";
  const namedWriteImport = new RegExp(
    `import\\s+\\{[^}]*\\b${writeMethod}\\b[^}]*\\}\\s+from ["']node:fs(?:/promises)?["']`,
    "s",
  );
  const defaultFsWriteCall = new RegExp(`\\bfs(?:\\.promises)?\\.${writeMethod}\\b`);

  return (
    namedWriteImport.test(source) ||
    defaultFsWriteCall.test(source) ||
    /\bwriteGeneratedFile\b/.test(source)
  );
}

function lineCount(source: string): number {
  return source.split(/\r?\n/).length;
}

function toCamelCase(value: string): string {
  return value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function toPascalCase(value: string): string {
  const camelCase = toCamelCase(value);
  return `${camelCase[0]?.toUpperCase() ?? ""}${camelCase.slice(1)}`;
}
