import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, posix } from "node:path";
import { describe, expect, it } from "vitest";
import { checkboxGroupRuntimeAdapterContract } from "../contracts/primitive/representatives.js";
import { buttonStyledContract } from "../contracts/styled/components/button.js";
import { colorPickerStyledContract } from "../contracts/styled/components/color-picker.js";
import { inputOtpStyledContract } from "../contracts/styled/components/input-otp.js";
import { separatorStyledContract } from "../contracts/styled/components/separator.js";
import { toggleStyledContract } from "../contracts/styled/components/toggle.js";
import { starwindStyledContracts } from "../contracts/styled/starwind.js";
import { exportPrinter as astroExportPrinter } from "../renderers/framework-adapters/astro/exports.js";
import { astroLifecycleProjection } from "../renderers/framework-adapters/astro/lifecycle-projection.js";
import { renderIndex as renderAstroStyledIndex } from "../renderers/framework-adapters/astro/styled/index-output.js";
import { getFutureFrameworkTracerTarget } from "../renderers/framework-adapters/future-framework-tracer.js";
import {
  type AdapterNamespaceExport,
  type AdapterOutputModel,
  analyzeStyledOutputGroup,
  astroFrameworkAdapter,
  createAdapterExportInventory,
  createFrameworkAdapterConformanceFixture,
  createHelperExportFacts,
  createRuntimeTypeExportFacts,
  createValueExportFacts,
  defineFrameworkAdapter,
  defineFrameworkAdapterTarget,
  type FrameworkAdapter,
  getFrameworkAdapterTargetsWithStyledCapability,
  getPrimitiveFrameworkAdapterTarget,
  primitiveFrameworkAdapterTargets,
  printAdapterOutput,
  printFrameworkAdapterConformanceFixture,
  projectStyledOutputModel,
  reactFrameworkAdapter,
  SVELTE_FRAMEWORK_ADAPTER_DEFERRED,
  solidFrameworkAdapter,
  solidFrameworkAdapterReadiness,
  toStyledAdapterContract,
  vueFrameworkAdapter,
  vueFrameworkAdapterReadiness,
} from "../renderers/framework-adapters/index.js";
import { exportPrinter as reactExportPrinter } from "../renderers/framework-adapters/react/exports.js";
import { reactLifecycleProjection } from "../renderers/framework-adapters/react/lifecycle-projection.js";
import { renderIndex as renderReactStyledIndex } from "../renderers/framework-adapters/react/styled/index-output.js";
import {
  renderComponentBody as renderReactStyledComponentBody,
  renderProps as renderReactStyledProps,
} from "../renderers/framework-adapters/react/styled/props-client.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../renderers/generic-adapter-plan/index.js";
import type { StyledOutputComponentGroup } from "../renderers/styled-output-model/index.js";

describe("Framework Adapter seam", () => {
  it("builds framework-neutral export and type facts for target printers", () => {
    const fixture = createFrameworkAdapterConformanceFixture();
    const indexFile = fixture.files.find((file) => file.kind === "index");
    const typeFacadeFile = fixture.files.find((file) => file.kind === "type-facade");
    if (!indexFile || !typeFacadeFile) {
      throw new Error("Conformance fixture must include index and type-facade files.");
    }

    const namespaceExport = {
      ...indexFile.exports,
      members: [
        ...indexFile.exports.members,
        {
          from: "./ConformanceRoot",
          kind: "type",
          name: "ConformanceRootProps",
        },
      ],
    } satisfies AdapterNamespaceExport;

    const inventory = createAdapterExportInventory({
      namespaceExport,
      reExports: [
        createRuntimeTypeExportFacts({
          names: ["ConformanceDetails", "ConformanceRootProps"],
          source: "@starwind-ui/runtime/conformance",
        }),
        createHelperExportFacts({
          names: ["createConformance"],
          source: "@starwind-ui/runtime/conformance",
        }),
        createValueExportFacts({
          names: ["normalizeConformanceValue"],
          source: "./normalizeConformanceValue",
        }),
      ],
      typeFacades: [...indexFile.typeFacades, ...typeFacadeFile.typeFacades],
    });

    expect(inventory).toEqual({
      namespace: {
        kind: "namespace",
        members: [
          {
            from: "./ConformanceRoot",
            mode: "value",
            name: "ConformanceRoot",
          },
          {
            from: "./ConformanceRoot",
            mode: "type",
            name: "ConformanceRootProps",
          },
        ],
        name: "Conformance",
      },
      reExports: [
        {
          kind: "re-export",
          mode: "type",
          names: ["ConformanceDetails", "ConformanceRootProps"],
          role: "runtime-type",
          source: "@starwind-ui/runtime/conformance",
        },
        {
          kind: "re-export",
          mode: "value",
          names: ["createConformance"],
          role: "helper",
          source: "@starwind-ui/runtime/conformance",
        },
        {
          kind: "re-export",
          mode: "value",
          names: ["normalizeConformanceValue"],
          role: "value",
          source: "./normalizeConformanceValue",
        },
      ],
      typeFacades: [
        {
          body: indexFile.typeFacades[0]?.body,
          exports: ["ConformanceRootProps"],
          name: "ConformanceRootProps",
        },
        {
          body: typeFacadeFile.typeFacades[0]?.body,
          exports: ["ConformanceRootPublicTypes"],
          name: "ConformanceRootPublicTypes",
        },
      ],
    });

    const toolkitSource = readFileSync(
      join(
        process.cwd(),
        "scripts/portable-runtime/renderers/framework-adapters/export-toolkit.ts",
      ),
      "utf8",
    );

    for (const forbiddenSyntax of [
      "Astro",
      "React.",
      "React<",
      "---",
      "<script",
      'from "@starwind-ui/astro',
      'from "@starwind-ui/react',
      'from "astro/types',
      'from "react',
      "from 'astro/types",
      "from 'react",
      "export type {",
      "export {",
    ]) {
      expect(toolkitSource).not.toContain(forbiddenSyntax);
    }
  });

  it("preserves target import syntax while printing export files from shared facts", () => {
    const outputModel = {
      files: [
        {
          exports: {
            kind: "namespace",
            members: [],
            namespace: "Conformance",
          },
          imports: [
            {
              id: "types",
              kind: "type",
              members: [{ imported: "ConformanceRootProps" }],
              source: "./ConformanceRoot",
            },
            {
              id: "values",
              kind: "value",
              members: [{ imported: "createConformance", local: "createLocalConformance" }],
              source: "@starwind-ui/runtime/conformance",
            },
          ],
          kind: "index",
          path: "conformance/imports.ts",
          typeFacades: [],
        },
      ],
    } satisfies AdapterOutputModel;

    expect(
      printAdapterOutput(astroFrameworkAdapter, outputModel).map((file) => file.contents),
    ).toEqual([
      'import type { ConformanceRootProps } from "./ConformanceRoot";\nimport { createConformance as createLocalConformance } from "@starwind-ui/runtime/conformance";',
    ]);
    expect(
      printAdapterOutput(reactFrameworkAdapter, outputModel).map((file) => file.contents),
    ).toEqual([
      'import type { ConformanceRootProps } from "./ConformanceRoot";\nimport { createConformance as createLocalConformance } from "@starwind-ui/runtime/conformance";',
    ]);
  });

  it("exposes the same target-local export printer surface for Astro and React", () => {
    const expectedSurface = [
      "printIndexFileExports",
      "printNamespaceExport",
      "printRuntimeTypeReExport",
      "printTypeFacadeFileExports",
    ];

    expect(Object.keys(astroExportPrinter).sort()).toEqual(expectedSurface);
    expect(Object.keys(reactExportPrinter).sort()).toEqual(expectedSurface);
  });

  it("registers shipping styled target capabilities with a shared surface", () => {
    const styledTargets = getFrameworkAdapterTargetsWithStyledCapability();

    expect(
      styledTargets.map(({ capability, target }) => ({
        generatedImportCandidateExtensions:
          getPrimitiveFrameworkAdapterTarget(target).cliRegistry.generatedImportCandidateExtensions,
        project: typeof capability.project,
        target,
        write: typeof capability.write,
      })),
    ).toEqual([
      {
        generatedImportCandidateExtensions: [".astro", ".ts", ".js"],
        project: "function",
        target: "astro",
        write: "function",
      },
      {
        generatedImportCandidateExtensions: [".ts", ".tsx", ".js", ".jsx"],
        project: "function",
        target: "react",
        write: "function",
      },
    ]);

    for (const { capability } of styledTargets) {
      expect(
        capability.project({
          contracts: [separatorStyledContract],
          outputRoot: "/tmp/styled",
          primitiveOutputRoot: "/tmp/primitives",
        }),
      ).toMatchObject({
        componentGroups: [
          {
            component: "separator",
            components: [
              {
                exportName: "Separator",
              },
            ],
          },
        ],
      });
    }
  });

  it("writes styled output through registered target capabilities", async () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "starwind-styled-capability-"));

    try {
      for (const { capability, target } of getFrameworkAdapterTargetsWithStyledCapability()) {
        const outputRoot = join(tempRoot, target, "styled");
        const primitiveOutputRoot = join(tempRoot, target, "primitives");

        await capability.write({
          contracts: [separatorStyledContract],
          generatedBy: "scripts/portable-runtime/tests/framework-adapters.test.ts",
          outputRoot,
          primitiveOutputRoot,
        });

        expect(existsSync(join(outputRoot, "separator", "index.ts"))).toBe(true);

        if (target === "astro") {
          const separator = readFileSync(join(outputRoot, "separator", "Separator.astro"), "utf8");
          expect(separator).toContain("data-sw-separator");
          expect(separator).toContain("<div");
        }

        if (target === "react") {
          const separator = readFileSync(join(outputRoot, "separator", "Separator.tsx"), "utf8");
          expect(separator).toContain("data-sw-separator");
          expect(separator).toContain("function Separator");
        }
      }
    } finally {
      rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  it("keeps the Styled Output Model pure model files free of framework syntax", () => {
    const modelDirectory = join(
      process.cwd(),
      "scripts/portable-runtime/renderers/styled-output-model",
    );
    const modelSources = ["types.ts"]
      .map((fileName) => readFileSync(join(modelDirectory, fileName), "utf8"))
      .join("\n");

    for (const forbiddenSyntax of [
      "Astro",
      "React",
      "astro/types",
      "react",
      "frontmatter",
      "JSX",
      "hooks",
      ".astro",
      ".tsx",
      "Astro.props",
    ]) {
      expect(modelSources).not.toContain(forbiddenSyntax);
    }
  });

  it("projects tracer styled contracts into Styled Output Model facts", () => {
    const model = projectStyledOutputModel([
      separatorStyledContract,
      buttonStyledContract,
      toggleStyledContract,
      inputOtpStyledContract,
    ]);
    const groups = new Map(model.componentGroups.map((group) => [group.component, group]));

    expect([...groups.keys()]).toEqual(["separator", "button", "toggle", "input-otp"]);
    expect(groups.get("separator")?.components[0]?.render[0]?.type).toBe("element");
    expect(groups.get("button")?.components[0]?.render[0]?.type).toBe("condition");
    expect(groups.get("toggle")?.components[0]?.render[0]).toMatchObject({
      component: "toggle",
      part: "Root",
      type: "primitive",
    });
    expect(groups.get("input-otp")?.constants).toEqual([
      {
        name: "REGEXP_ONLY_DIGITS",
        value: "/^[0-9]+$/",
      },
      {
        name: "REGEXP_ONLY_DIGITS_AND_CHARS",
        value: "/^[A-Za-z0-9]+$/",
      },
    ]);
    expect(groups.get("input-otp")?.components.map((component) => component.exportName)).toEqual([
      "InputOtp",
      "InputOtpGroup",
      "InputOtpSlot",
      "InputOtpSeparator",
    ]);

    const serializedModel = JSON.stringify(model);
    for (const forbiddenSyntax of ["Astro.props", "---", "<script", ".astro", ".tsx"]) {
      expect(serializedModel).not.toContain(forbiddenSyntax);
    }

    const roundTrippedModel = projectStyledOutputModel(
      model.componentGroups.map(toStyledAdapterContract),
    );
    expect(roundTrippedModel).toEqual(model);
  });

  it("projects styled forward-ref intent and target type through the output model", () => {
    const model = projectStyledOutputModel([colorPickerStyledContract]);
    const components = model.componentGroups[0]?.components;

    expect(components?.find(({ exportName }) => exportName === "ColorPicker")?.forwardRef).toEqual({
      targetType: "HTMLDivElement",
    });
    expect(
      components?.find(({ exportName }) => exportName === "ColorPickerRoot")?.forwardRef,
    ).toEqual({ targetType: "HTMLDivElement" });
    expect(projectStyledOutputModel(model.componentGroups.map(toStyledAdapterContract))).toEqual(
      model,
    );
  });

  it("routes all styled output through the Styled Output Model before target writing", () => {
    const targetSources = [
      readFileSync(
        join(
          process.cwd(),
          "scripts/portable-runtime/renderers/framework-adapters/astro/styled/writer.ts",
        ),
        "utf8",
      ),
      readFileSync(
        join(
          process.cwd(),
          "scripts/portable-runtime/renderers/framework-adapters/react/styled/writer.ts",
        ),
        "utf8",
      ),
    ];

    for (const source of targetSources) {
      expect(source).toContain("projectStyledOutputModel");
      expect(source).toContain("generateStyledOutputComponentGroup");
      expect(source).not.toContain("toStyledAdapterContract");
      expect(source).not.toContain("STYLED_OUTPUT_MODEL_MIGRATED_COMPONENTS");
      expect(source).not.toContain("generateLegacyStyledComponentGroup");
    }
  });

  it("prints styled model constants deterministically in target indexes", () => {
    const group = {
      component: "constant-order",
      components: [],
      constants: [
        { name: "B_CONSTANT", value: '"b"' },
        { name: "A_CONSTANT", value: '"a"' },
      ],
      defaultExport: {
        members: [],
        mode: "parts",
      },
      publicExports: [],
      variants: [],
    } satisfies StyledOutputComponentGroup;

    for (const output of [renderAstroStyledIndex(group, ""), renderReactStyledIndex(group, "")]) {
      expect(output.indexOf("const A_CONSTANT")).toBeLessThan(output.indexOf("const B_CONSTANT"));
      expect(output).toContain("export { A_CONSTANT, B_CONSTANT };");
    }
  });

  it("analyzes Styled Output Model references without framework syntax", () => {
    const group = {
      component: "analysis-fixture",
      components: [
        {
          exportName: "AnalysisRoot",
          imports: [],
          primitiveAliases: [],
          props: {
            extends: [
              {
                kind: "variant-props",
                targetScopes: ["astro"],
                variant: "rootVariant",
              },
              {
                component: "card",
                exportName: "Card",
                kind: "component-props",
                keys: [],
                targetScopes: ["react"],
              },
            ],
            fields: [],
          },
          render: [
            {
              condition: "open",
              else: [
                {
                  attrs: [
                    {
                      name: "data-astro-only",
                      targetScopes: ["astro"],
                      value: { type: "literal", value: "yes" },
                    },
                    {
                      name: "class",
                      targetScopes: ["astro"],
                      value: { type: "class-variant", variant: "astroAttr" },
                    },
                  ],
                  children: [
                    {
                      attrs: [],
                      children: [],
                      component: "tooltip",
                      part: "Trigger",
                      selfClosing: true,
                      type: "primitive",
                    },
                  ],
                  comments: [{ targetScopes: ["react"], value: "react-only comment" }],
                  selfClosing: false,
                  tag: "div",
                  type: "element",
                },
              ],
              then: [
                {
                  attrs: [
                    {
                      name: "class",
                      value: { type: "class-variant", variant: "dialogRoot" },
                    },
                  ],
                  children: [
                    {
                      fallback: [],
                      type: "slot",
                    },
                    {
                      fallback: [
                        {
                          attrs: [],
                          children: [],
                          component: "card",
                          exportName: "Card",
                          selfClosing: true,
                          type: "component",
                        },
                      ],
                      name: "footer",
                      type: "slot",
                    },
                  ],
                  component: "dialog",
                  part: "Root",
                  selfClosing: false,
                  type: "primitive",
                },
              ],
              type: "condition",
            },
          ],
          sourceFileName: "AnalysisRoot.astro",
          variables: [
            {
              name: "reactTone",
              targetScopes: ["react"],
              value: { type: "class-variant", variant: "reactTone" },
            },
          ],
        },
      ],
      constants: [],
      defaultExport: {
        members: [{ exportName: "AnalysisRoot", localName: "AnalysisRoot" }],
        mode: "component",
      },
      publicExports: ["AnalysisRoot"],
      variants: [],
    } satisfies StyledOutputComponentGroup;

    const allTargets = analyzeStyledOutputGroup(group);
    const astro = analyzeStyledOutputGroup(group, { target: "astro" });
    const react = analyzeStyledOutputGroup(group, { target: "react" });

    expect(allTargets.dependencies).toEqual({
      primitives: ["dialog", "tooltip"],
      styledComponents: ["card"],
      variants: ["astroAttr", "dialogRoot", "reactTone", "rootVariant"],
    });
    expect(allTargets.components[0]?.slots).toEqual([{ name: undefined }, { name: "footer" }]);
    expect(allTargets.components[0]?.usesDefaultSlot).toBe(true);
    expect(allTargets.components[0]?.composedComponentReferences).toEqual([
      {
        component: "card",
        exportName: "Card",
        localName: undefined,
      },
    ]);
    expect(astro.components[0]?.variantReferences).toEqual([
      "astroAttr",
      "dialogRoot",
      "rootVariant",
    ]);
    expect(react.components[0]?.variantReferences).toEqual(["dialogRoot", "reactTone"]);
    expect(astro.targetScopedFacts).toContainEqual({
      componentExportName: "AnalysisRoot",
      kind: "attribute",
      name: "data-astro-only",
      targetScopes: ["astro"],
    });
    expect(JSON.stringify(allTargets)).not.toMatch(
      /Astro\.props|React\.|astro\/types|from "react"|\.astro|\.tsx|JSX/,
    );
  });

  it("dedupes React named slots after target-local prop name projection", () => {
    const component = {
      exportName: "SlotCollision",
      imports: [],
      primitiveAliases: [],
      props: {
        extends: [],
        fields: [],
      },
      render: [
        {
          children: [
            {
              fallback: [],
              name: "card-footer",
              type: "slot",
            },
            {
              fallback: [],
              name: "card_footer",
              type: "slot",
            },
          ],
          type: "fragment",
        },
      ],
      variables: [],
    } satisfies StyledOutputComponentGroup["components"][number];

    const props = renderReactStyledProps(component, {});
    const body = renderReactStyledComponentBody(component, {}, {});

    expect(props.match(/cardFooter\?: React\.ReactNode;/g)).toHaveLength(1);
    expect(body).toContain("const { cardFooter, ...rest } = props;");
    expect(body).not.toContain("cardFooter, cardFooter");
  });

  it("round-trips every styled component through the Styled Output Model", () => {
    const contracts = starwindStyledContracts;
    const model = projectStyledOutputModel(contracts);

    expect(model.componentGroups.map((group) => group.component).sort()).toEqual(
      starwindStyledContracts.map((contract) => contract.component).sort(),
    );
    expect(model.componentGroups).toEqual(
      expect.arrayContaining(
        [
          "alert",
          "card",
          "dialog",
          "dropdown",
          "select",
          "sidebar",
          "table",
          "theme-toggle",
          "toast",
        ].map((component) => expect.objectContaining({ component })),
      ),
    );

    expect(projectStyledOutputModel(model.componentGroups.map(toStyledAdapterContract))).toEqual(
      model,
    );
  });

  it("registers shipping primitive framework targets from target homes", () => {
    const legacyLowLevelRegistrationKeys = [
      "generatePrimitivePackage",
      "manualPrimitives",
      "outputModelCapabilities",
      "specializedAdapterSpec",
      "staticAdapterPlan",
      "staticPlan",
      "styledAdapter",
      "writePrimitiveOutput",
    ];

    expect(
      primitiveFrameworkAdapterTargets.map((registration) => ({
        adapterTarget: registration.adapter.target,
        cliRegistry: {
          ...registration.cliRegistry,
          styledArtifact: {
            ...registration.cliRegistry.styledArtifact,
            collectPackageImportSources:
              typeof registration.cliRegistry.styledArtifact.collectPackageImportSources,
          },
        },
        fileExtension: registration.adapter.fileExtension,
        home: registration.home,
        packageName: registration.packageName,
        primitive: {
          generatePackage: typeof registration.primitive.generatePackage,
          manualPrimitives: typeof registration.primitive.manualPrimitives,
          outputModel: {
            projectSpecialized: typeof registration.primitive.outputModel.projectSpecialized,
            write: typeof registration.primitive.outputModel.write,
          },
        },
        publicSupport: registration.publicSupport,
        styled: {
          project: typeof registration.styled?.project,
          write: typeof registration.styled?.write,
        },
        target: registration.target,
      })),
    ).toEqual([
      {
        adapterTarget: "astro",
        cliRegistry: {
          generatedImportCandidateExtensions: [".astro", ".ts", ".js"],
          primitiveArtifact: {
            outputDir: "astro-primitives",
            sourceRoot: "packages/astro/src",
          },
          styledArtifact: {
            collectPackageImportSources: "function",
            outputDir: "astro",
            primitiveOutputDir: "astro-primitives",
          },
        },
        fileExtension: ".astro",
        home: "scripts/portable-runtime/renderers/framework-adapters/astro",
        packageName: "@starwind-ui/astro",
        primitive: {
          generatePackage: "function",
          manualPrimitives: "object",
          outputModel: {
            projectSpecialized: "function",
            write: "function",
          },
        },
        publicSupport: {
          cliRegistry: true,
          demoIntegration: true,
          packageExports: true,
          publicDocsClaim: true,
          status: "shipping",
        },
        styled: {
          project: "function",
          write: "function",
        },
        target: "astro",
      },
      {
        adapterTarget: "react",
        cliRegistry: {
          generatedImportCandidateExtensions: [".ts", ".tsx", ".js", ".jsx"],
          primitiveArtifact: {
            extraPackageRequirements: ["react", "react-dom"],
            includeLocalImportGraph: true,
            outputDir: "react-primitives",
            sourceRoot: "packages/react/src",
          },
          styledArtifact: {
            collectPackageImportSources: "function",
            outputDir: "react",
            primitiveOutputDir: "react-primitives",
          },
        },
        fileExtension: ".tsx",
        home: "scripts/portable-runtime/renderers/framework-adapters/react",
        packageName: "@starwind-ui/react",
        primitive: {
          generatePackage: "function",
          manualPrimitives: "object",
          outputModel: {
            projectSpecialized: "function",
            write: "function",
          },
        },
        publicSupport: {
          cliRegistry: true,
          demoIntegration: true,
          packageExports: true,
          publicDocsClaim: true,
          status: "shipping",
        },
        styled: {
          project: "function",
          write: "function",
        },
        target: "react",
      },
    ]);
    for (const registration of primitiveFrameworkAdapterTargets) {
      expect(Object.keys(registration).sort()).toEqual([
        "adapter",
        "cliRegistry",
        "displayName",
        "home",
        "packageName",
        "primitive",
        "publicSupport",
        "styled",
        "target",
      ]);
      for (const key of legacyLowLevelRegistrationKeys) {
        expect(
          registration,
          `${registration.target} registration should not expose ${key}`,
        ).not.toHaveProperty(key);
      }
      expect(Object.keys(registration.primitive).sort()).toEqual([
        "generatePackage",
        "manualPrimitives",
        "outputModel",
      ]);
      expect(Object.keys(registration.primitive.outputModel).sort()).toEqual([
        "capabilities",
        "projectSpecialized",
        "write",
      ]);
      expect(Object.keys(registration.styled ?? {}).sort()).toEqual(["project", "write"]);
    }
    expect(getPrimitiveFrameworkAdapterTarget("astro").adapter).toBe(astroFrameworkAdapter);
    expect(getPrimitiveFrameworkAdapterTarget("react").adapter).toBe(reactFrameworkAdapter);
    expect(
      new Set(primitiveFrameworkAdapterTargets.map((registration) => registration.target)).size,
    ).toBe(primitiveFrameworkAdapterTargets.length);
  });

  it("keeps CLI registry metadata complete and relative on public targets", () => {
    const cliTargets = primitiveFrameworkAdapterTargets.filter(
      (registration) => registration.publicSupport.cliRegistry,
    );

    expect(cliTargets.map((registration) => registration.target)).toEqual(["astro", "react"]);

    for (const registration of cliTargets) {
      const metadata = registration.cliRegistry;

      expect(metadata.generatedImportCandidateExtensions.length).toBeGreaterThan(0);
      expect(new Set(metadata.generatedImportCandidateExtensions).size).toBe(
        metadata.generatedImportCandidateExtensions.length,
      );

      for (const extension of metadata.generatedImportCandidateExtensions) {
        expect(extension, `${registration.target} generated extension`).toMatch(/^\.[\w-]+$/);
      }

      expectSafeCliRegistryPath(registration.target, metadata.styledArtifact.outputDir);
      expectSafeCliRegistryPath(registration.target, metadata.styledArtifact.primitiveOutputDir);

      if (metadata.primitiveArtifact) {
        expectSafeCliRegistryPath(registration.target, metadata.primitiveArtifact.outputDir);
        expectSafeCliRegistryPath(registration.target, metadata.primitiveArtifact.sourceRoot);
      }
    }
  });

  it("prints grouped-value context helpers for targets declaring that output-model capability", () => {
    const plan = buildGenericAdapterPlan(checkboxGroupRuntimeAdapterContract);
    const outputModel = buildGenericAdapterOutputModel(plan);
    const capabilityTargets = primitiveFrameworkAdapterTargets.filter(
      (registration) =>
        registration.primitive.outputModel.capabilities?.groupedValueControlContextHelper,
    );

    expect(capabilityTargets.map((registration) => registration.target)).toEqual(["react"]);

    for (const registration of capabilityTargets) {
      const extension =
        registration.primitive.outputModel.capabilities?.groupedValueControlContextHelper
          ?.fileExtension;
      if (!extension) {
        throw new Error(`${registration.target} is missing grouped-value helper extension.`);
      }

      const printedFiles = printAdapterOutput(registration.adapter, outputModel);
      const contextHelper = printedFiles.find(
        (file) => file.path === `checkbox-group/CheckboxGroupContext${extension}`,
      );
      const index = printedFiles.find((file) => file.path === "checkbox-group/index.ts");

      expect(contextHelper?.contents).toContain(
        "React.createContext<CheckboxGroupContextValue | undefined>",
      );
      expect(contextHelper?.contents).toContain("useCheckboxGroupContext");
      expect(index?.contents).toContain("CheckboxGroupContext");
      expect(index?.contents).toContain("useCheckboxGroupContext");
    }
  });

  it("prints only unscoped and matching-target output model files for every framework adapter", () => {
    const outputModel = {
      files: [
        {
          body: { code: "return undefined;" },
          imports: [],
          kind: "helper",
          name: "shared",
          path: "target-filter/shared.ts",
        },
        {
          body: { code: "return undefined;" },
          imports: [],
          kind: "helper",
          name: "reactOnly",
          path: "target-filter/react.ts",
          target: "react",
        },
        {
          body: { code: "return undefined;" },
          imports: [],
          kind: "helper",
          name: "astroOnly",
          path: "target-filter/astro.ts",
          target: "astro",
        },
      ],
    } satisfies AdapterOutputModel;

    expect(printAdapterOutput(astroFrameworkAdapter, outputModel).map((file) => file.path)).toEqual(
      ["target-filter/shared.ts", "target-filter/astro.ts"],
    );
    expect(printAdapterOutput(reactFrameworkAdapter, outputModel).map((file) => file.path)).toEqual(
      ["target-filter/shared.ts", "target-filter/react.ts"],
    );
    expect(printAdapterOutput(solidFrameworkAdapter, outputModel).map((file) => file.path)).toEqual(
      ["target-filter/shared.ts"],
    );
    expect(printAdapterOutput(vueFrameworkAdapter, outputModel).map((file) => file.path)).toEqual([
      "target-filter/shared.ts",
    ]);
  });

  it("exposes concrete Astro lifecycle projection helpers from the Astro target home", () => {
    expect(Object.keys(astroLifecycleProjection).sort()).toEqual([
      "printFileEnvelope",
      "printRestPropsBinding",
      "printRuntimeSetup",
      "printRuntimeSetupWithCleanup",
    ]);
    expect(astroLifecycleProjection.printRestPropsBinding({ defaultElement: "button" })).toContain(
      'type Props = HTMLAttributes<"button">;',
    );
    expect(astroLifecycleProjection.printRestPropsBinding({ defaultElement: "button" })).toContain(
      "Astro.props",
    );
    expect(
      astroLifecycleProjection.printRuntimeSetup({
        elementName: "root",
        factory: "createExample",
        importSource: "@starwind-ui/runtime/example",
        selectorAttribute: "data-sw-example",
        setupFunction: "setupExamples",
      }),
    ).toContain('document.addEventListener("astro:after-swap", setupExamples);');
  });

  it("exposes concrete React lifecycle projection helpers from the React target home", () => {
    expect(Object.keys(reactLifecycleProjection).sort()).toEqual([
      "printCallback",
      "printComposedRefCallback",
      "printControlledSyncCallback",
      "printDisplayNameAndDefaultExport",
      "printEffect",
      "printRefSyncEffect",
      "printRootRef",
    ]);
    expect(reactLifecycleProjection.printRootRef({ elementType: "HTMLButtonElement" })).toContain(
      "React.useRef<HTMLButtonElement>(null)",
    );
    expect(
      reactLifecycleProjection.printComposedRefCallback({
        elementType: "HTMLButtonElement",
        format: "compact",
      }),
    ).toContain("setRef(forwardedRef, node);");
    expect(
      reactLifecycleProjection.printRefSyncEffect({
        refName: "valueRef",
        value: "value",
      }),
    ).toContain("React.useEffect");
    expect(
      reactLifecycleProjection.printCallback({
        body: "onChange?.(event);",
        dependencies: ["onChange"],
        name: "handleChange",
        parameters: "(event: React.ChangeEvent<HTMLInputElement>)",
      }),
    ).toContain("const handleChange = React.useCallback(");
    expect(
      reactLifecycleProjection.printControlledSyncCallback({
        setterMethod: "setValue",
        setterOptions: "{ emit: true }",
        setterValue: "root.value",
      }),
    ).toContain("window.setTimeout");
  });

  it("rejects mismatched framework target registrations", () => {
    expect(() =>
      defineFrameworkAdapterTarget({
        adapter: recordingAdapter,
        cliRegistry: {
          generatedImportCandidateExtensions: [".example"],
          styledArtifact: {
            outputDir: "example",
            primitiveOutputDir: "example-primitives",
          },
        },
        displayName: "Mismatch",
        home: "scripts/portable-runtime/renderers/framework-adapters/mismatch",
        primitive: {
          generatePackage: async () => {},
          outputModel: {
            projectSpecialized: (model) => model,
            write: async () => {},
          },
        },
        publicSupport: {
          cliRegistry: false,
          demoIntegration: false,
          packageExports: false,
          publicDocsClaim: false,
          status: "non-shipping-tracer",
        },
        target: "mismatch",
      }),
    ).toThrow(/target mismatch/);
  });

  it("represents the output concepts a framework adapter must handle", () => {
    const fixture = createFrameworkAdapterConformanceFixture();
    const componentFile = fixture.files.find((file) => file.kind === "component");
    const helperFile = fixture.files.find((file) => file.kind === "helper");
    const indexFile = fixture.files.find((file) => file.kind === "index");
    const typeFacadeFile = fixture.files.find((file) => file.kind === "type-facade");

    expect(componentFile?.component.imports.map((importModel) => importModel.id)).toEqual([
      "runtime",
      "helper",
    ]);
    expect(componentFile?.component.props.map((prop) => prop.name)).toEqual([
      "value",
      "disabled",
      "tone",
    ]);
    expect(componentFile?.component.defaults.map((defaultModel) => defaultModel.prop)).toEqual([
      "value",
    ]);
    expect(componentFile?.component.render.kind).toBe("element");
    expect(componentFile?.component.lifecycle?.factory).toBe("createConformance");
    expect(componentFile?.component.refs.map((ref) => ref.id)).toEqual(["rootRef"]);
    expect(componentFile?.component.events.map((event) => event.handlerProp)).toEqual([
      "onValueChange",
    ]);
    expect(componentFile?.component.stateSync.map((sync) => sync.setter)).toEqual(["setValue"]);
    expect(componentFile?.component.context.map((context) => context.role)).toEqual([
      "provider",
      "consumer",
    ]);
    expect(componentFile?.component.portals.map((portal) => portal.sourcePart)).toEqual([
      "overlay",
    ]);
    expect(componentFile?.component.exports.namespace).toBe("Conformance");
    expect(helperFile?.name).toBe("normalizeConformanceValue");
    expect(indexFile?.typeFacades.map((typeFacade) => typeFacade.name)).toEqual([
      "ConformanceRootProps",
    ]);
    expect(typeFacadeFile?.typeFacades.map((typeFacade) => typeFacade.name)).toEqual([
      "ConformanceRootPublicTypes",
    ]);
  });

  it("prints a conformance fixture through a target adapter", () => {
    const printedFiles = printFrameworkAdapterConformanceFixture(recordingAdapter);

    expect(printedFiles).toEqual([
      {
        contents: [
          "target=example",
          "component=ConformanceRoot",
          "imports=runtime, helper",
          "props=value:state|disabled:boolean|tone:string",
          "defaulted=value",
          "render=element",
          "lifecycle=createConformance",
          "refs=rootRef",
          "events=onValueChange",
          "context=provider:ConformanceContext, consumer:ConformanceContext",
          "portal=overlay -> body",
          "exports=namespace",
        ].join("\n"),
        path: "conformance/ConformanceRoot.example",
      },
      {
        contents: "helper=normalizeConformanceValue",
        path: "conformance/normalizeConformanceValue.ts",
      },
      {
        contents: "index=Conformance, types=ConformanceRootProps",
        path: "conformance/index.ts",
      },
      {
        contents: "typeFacade=ConformanceRootPublicTypes",
        path: "conformance/types.ts",
      },
    ]);
  });

  it("keeps component-specific vocabulary out of the framework adapter contract", () => {
    const adapterDirectory = join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters",
    );
    const contractSource = readdirSync(adapterDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map((entry) => readFileSync(join(adapterDirectory, entry.name), "utf8"))
      .join("\n");

    expect(contractSource).not.toMatch(/\b(Accordion|Select|Menu|Carousel|Toast)\b/);
  });

  it.each([
    {
      adapter: astroFrameworkAdapter,
      extension: ".astro",
      requiredSnippets: [
        "---",
        "Astro.props",
        "<slot",
        "<script>",
        "createConformance",
        'data-sw-context-role="provider"',
        'data-sw-portal-target="body"',
      ],
      target: "astro",
    },
    {
      adapter: reactFrameworkAdapter,
      extension: ".tsx",
      requiredSnippets: [
        "import * as React",
        "React.forwardRef",
        "React.useEffect",
        "createPortal",
        "createConformance",
        'data-sw-context-role="provider"',
      ],
      target: "react",
    },
  ] satisfies Array<{
    adapter: FrameworkAdapter;
    extension: string;
    requiredSnippets: string[];
    target: string;
  }>)(
    "prints the conformance fixture through the $target adapter home",
    ({ adapter, extension, requiredSnippets, target }) => {
      const adapterHome = join(
        process.cwd(),
        "scripts/portable-runtime/renderers/framework-adapters",
        target,
      );
      const printedFiles = printFrameworkAdapterConformanceFixture(adapter);
      const componentFile = printedFiles.find((file) =>
        file.path.endsWith(`ConformanceRoot${extension}`),
      );
      const indexFile = printedFiles.find((file) => file.path === "conformance/index.ts");
      const typeFacadeFile = printedFiles.find((file) => file.path === "conformance/types.ts");

      expect(adapter.target).toBe(target);
      expect(existsSync(join(adapterHome, "index.ts"))).toBe(true);
      expect(existsSync(join(adapterHome, "README.md"))).toBe(true);
      for (const snippet of requiredSnippets) {
        expect(componentFile?.contents).toContain(snippet);
      }
      expect(printedFiles.map((file) => file.path)).toContain("conformance/types.ts");
      expect(typeFacadeFile?.contents).toContain(
        "export type ConformanceRootPublicTypes = ConformanceRootProps;",
      );

      if (target === "astro") {
        expect(componentFile?.contents).toContain(
          `<button data-slot="root" aria-disabled={disabled ? 'true' : undefined} data-sw-part="root" {...attrs}>`,
        );
        expect(componentFile?.contents).toContain(
          `<template data-sw-portal-source="overlay" data-sw-portal-target="body">`,
        );
        expect(indexFile?.contents).toContain(
          `export { default as ConformanceRoot } from "./ConformanceRoot.astro";`,
        );
      }

      if (target === "react") {
        expect(componentFile?.contents).toContain("overlay?: React.ReactNode;");
        expect(componentFile?.contents).toContain(
          `{ value = "initial", disabled, tone, onValueChange, overlay, children, ...props },`,
        );
        expect(componentFile?.contents).toContain(
          `<button data-slot="root" aria-disabled={disabled ? 'true' : undefined} data-sw-part="root" ref={setRootRef}>`,
        );
        expect(componentFile?.contents).toContain("{overlay ?? null}");
        expect(indexFile?.contents).toContain(
          `export { ConformanceRoot } from "./ConformanceRoot";`,
        );
      }
    },
  );

  it.each([
    {
      adapter: vueFrameworkAdapter,
      extension: ".vue",
      readiness: vueFrameworkAdapterReadiness,
      requiredSnippets: [
        "Non-shipping future framework tracer adapter",
        '<script setup lang="ts">',
        "defineProps",
        "onMounted",
        "provide",
        '<Teleport to="body">',
      ],
      target: "vue",
    },
    {
      adapter: solidFrameworkAdapter,
      extension: ".tsx",
      readiness: solidFrameworkAdapterReadiness,
      requiredSnippets: [
        "Non-shipping future framework tracer adapter",
        "createContext",
        "onMount",
        "onCleanup",
        "<Portal mount={document.body}>",
      ],
      target: "solid",
    },
  ] satisfies Array<{
    adapter: FrameworkAdapter;
    extension: string;
    readiness: {
      publicSupport: {
        cliRegistry: boolean;
        demoIntegration: boolean;
        packageExports: boolean;
        publicDocsClaim: boolean;
        status: string;
      };
    };
    requiredSnippets: string[];
    target: string;
  }>)(
    "keeps the $target future tracer home Framework Adapter compatible and non-shipping",
    ({ adapter, extension, readiness, requiredSnippets, target }) => {
      const adapterHome = join(
        process.cwd(),
        "scripts/portable-runtime/renderers/framework-adapters",
        target,
      );
      const printedFiles = printFrameworkAdapterConformanceFixture(adapter);
      const componentFile = printedFiles.find((file) =>
        file.path.endsWith(`ConformanceRoot${extension}`),
      );

      expect(existsSync(join(adapterHome, "index.ts"))).toBe(true);
      expect(existsSync(join(adapterHome, "README.md"))).toBe(true);
      expect(readiness.publicSupport).toEqual({
        cliRegistry: false,
        demoIntegration: false,
        packageExports: false,
        publicDocsClaim: false,
        status: "non-shipping-tracer",
      });
      expect(printedFiles.map((file) => file.path)).toContain(
        `conformance/ConformanceRoot${extension}`,
      );
      for (const snippet of requiredSnippets) {
        expect(componentFile?.contents).toContain(snippet);
      }
    },
  );

  it.each([
    {
      adapter: vueFrameworkAdapter,
      expectedSnippets: [
        "selectedKey?: string;",
        "selectionChange: [event: Event];",
        'emit("selectionChange", event);',
        "props.selectedKey",
        "setSelectedKey",
      ],
      forbiddenSnippets: ["valueChange: [event: Event];", 'emit("valueChange"'],
      target: "vue",
    },
    {
      adapter: solidFrameworkAdapter,
      expectedSnippets: [
        "selectedKey?: string;",
        "onSelectionChange?: (event: Event) => void;",
        '"selectedKey"',
        '"onSelectionChange"',
        'new Event("selectionchange")',
      ],
      forbiddenSnippets: ["onValueChange?:", 'new Event("valuechange")'],
      target: "solid",
    },
  ] satisfies Array<{
    adapter: FrameworkAdapter;
    expectedSnippets: string[];
    forbiddenSnippets: string[];
    target: string;
  }>)(
    "prints alternate $target future conformance props and events from the Adapter Output Model",
    ({ adapter, expectedSnippets, forbiddenSnippets }) => {
      const printedFiles = printAdapterOutput(
        adapter,
        createAlternateFrameworkAdapterConformanceFixture(),
      );
      const componentFile = printedFiles.find((file) => file.path.includes("ConformanceRoot"));

      for (const snippet of expectedSnippets) {
        expect(componentFile?.contents).toContain(snippet);
      }
      for (const snippet of forbiddenSnippets) {
        expect(componentFile?.contents).not.toContain(snippet);
      }
    },
  );

  it("keeps future framework tracers discoverable from adapter homes without public support claims", () => {
    const futureFixturesSource = readFileSync(
      join(
        process.cwd(),
        "scripts/portable-runtime/renderers/specialized-adapter-spec/future-framework-fixtures.ts",
      ),
      "utf8",
    );
    const selectSpecSource = readFileSync(
      join(
        process.cwd(),
        "scripts/portable-runtime/renderers/specialized-adapter-spec/select-specialized-adapter-spec.ts",
      ),
      "utf8",
    );
    const vueFutureTracerSource = readFileSync(
      join(
        process.cwd(),
        "scripts/portable-runtime/renderers/framework-adapters/vue/future-framework-tracer.ts",
      ),
      "utf8",
    );
    const solidFutureTracerSource = readFileSync(
      join(
        process.cwd(),
        "scripts/portable-runtime/renderers/framework-adapters/solid/future-framework-tracer.ts",
      ),
      "utf8",
    );
    const vueSpecializedTracerSource = readFileSync(
      join(
        process.cwd(),
        "scripts/portable-runtime/renderers/framework-adapters/vue/specialized-future-framework-tracer.ts",
      ),
      "utf8",
    );
    const solidSpecializedTracerSource = readFileSync(
      join(
        process.cwd(),
        "scripts/portable-runtime/renderers/framework-adapters/solid/specialized-future-framework-tracer.ts",
      ),
      "utf8",
    );
    const publicSurfaces = [
      "package.json",
      "README.md",
      "packages/cli/src/registry/bundled-registry.json",
      "packages/cli/registry/primitive-versions.json",
    ].map((relativePath) => readFileSync(join(process.cwd(), relativePath), "utf8"));

    expect(getFutureFrameworkTracerTarget("vue")).toMatchObject({
      printGenericAdapterPlan: expect.any(Function),
      printSelectSpecializedAdapterSpec: expect.any(Function),
      printSpecializedAdapterSpec: expect.any(Function),
    });
    expect(getFutureFrameworkTracerTarget("solid")).toMatchObject({
      printGenericAdapterPlan: expect.any(Function),
      printSelectSpecializedAdapterSpec: expect.any(Function),
      printSpecializedAdapterSpec: expect.any(Function),
    });
    expect(vueFutureTracerSource).toContain("vueFutureFrameworkTracer");
    expect(solidFutureTracerSource).toContain("solidFutureFrameworkTracer");
    expect(vueSpecializedTracerSource).toContain("vueFrameworkAdapterReadiness");
    expect(solidSpecializedTracerSource).toContain("solidFrameworkAdapterReadiness");
    expect(futureFixturesSource).not.toContain("FrameworkAdapterReadiness");
    expect(futureFixturesSource).not.toMatch(/__future-fixtures\/(?:vue|solid)\//);
    expect(selectSpecSource).not.toContain("FrameworkAdapterReadiness");
    expect(selectSpecSource).not.toMatch(/__future-fixtures\/(?:vue|solid)\//);
    expect(existsSync(join(process.cwd(), "packages/vue"))).toBe(false);
    expect(existsSync(join(process.cwd(), "packages/solid"))).toBe(false);
    for (const surface of publicSurfaces) {
      expect(surface).not.toContain("@starwind-ui/vue");
      expect(surface).not.toContain("@starwind-ui/solid");
      expect(surface).not.toContain("__future-fixtures/vue");
      expect(surface).not.toContain("__future-fixtures/solid");
    }
  });

  it("keeps Vue tracer compilation dev-only and generated in a temporary fixture directory", () => {
    const rootPackage = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    const compileScript = readFileSync(
      join(process.cwd(), "scripts/portable-runtime/check-vue-tracer-fixtures.ts"),
      "utf8",
    );

    expect(rootPackage.scripts?.["runtime:generate:vue:check"]).toBe(
      "tsx scripts/portable-runtime/check-vue-tracer-fixtures.ts",
    );
    expect(rootPackage.devDependencies).toMatchObject({
      "@vue/compiler-sfc": expect.any(String),
      vue: expect.any(String),
      "vue-tsc": expect.any(String),
    });
    expect(rootPackage.dependencies).not.toHaveProperty("vue");
    expect(rootPackage.dependencies).not.toHaveProperty("vue-tsc");
    expect(compileScript).toContain("mkdtemp");
    expect(compileScript).toContain("__future-fixtures/vue");
    expect(compileScript).toContain("printFutureFrameworkTracerPlan(");
    expect(compileScript).toContain("printFutureSelectSpecializedAdapterSpecFixture(");
    expect(compileScript).toContain('"vue"');
    expect(compileScript).toContain("vue-tsc");
    expect(compileScript).toContain("rm(fixtureRoot, { force: true, recursive: true })");
  });

  it("documents Svelte as deferred until its setup model is chosen", () => {
    const svelteReadme = readFileSync(
      join(process.cwd(), "scripts/portable-runtime/renderers/framework-adapters/svelte/README.md"),
      "utf8",
    );

    expect(SVELTE_FRAMEWORK_ADAPTER_DEFERRED).toMatchObject({
      reason: "setup-model-undecided",
      status: "deferred",
      target: "svelte",
    });
    expect(svelteReadme).toContain("deferred");
    expect(svelteReadme).toContain("setup model");
    expect(svelteReadme).not.toContain("package-ready");
  });
});

function createAlternateFrameworkAdapterConformanceFixture(): AdapterOutputModel {
  const fixture = createFrameworkAdapterConformanceFixture();

  return {
    files: fixture.files.map((file) => {
      if (file.kind !== "component") return file;

      return {
        ...file,
        component: {
          ...file.component,
          context: [
            {
              name: "SelectionContext",
              role: "provider",
              value: { code: "selectionContext" },
            },
            {
              name: "SelectionContext",
              role: "consumer",
              value: { code: "parentSelectionContext" },
            },
          ],
          defaults: [
            {
              prop: "selectedKey",
              value: { code: '"alpha"' },
            },
          ],
          events: [
            {
              handlerProp: "onSelectionChange",
              runtimeEvent: "selectionchange",
              targetPart: "root",
            },
          ],
          lifecycle: file.component.lifecycle
            ? {
                ...file.component.lifecycle,
                options: [{ name: "selectedKey", source: "prop" }],
              }
            : undefined,
          props: [
            {
              attributes: [{ name: "data-selected-key", value: { code: "selectedKey" } }],
              kind: "state",
              name: "selectedKey",
              type: "string",
            },
            {
              attributes: [{ name: "aria-current", value: { code: "selectedKey" } }],
              kind: "string",
              name: "ariaCurrent",
              type: "string",
            },
          ],
          render:
            file.component.render.kind === "element"
              ? {
                  ...file.component.render,
                  attrs: [
                    { name: "data-slot", value: "root" },
                    { name: "data-selected-key", value: { code: "selectedKey" } },
                  ],
                  defaultElement: "section",
                  events: [
                    {
                      handlerProp: "onSelectionChange",
                      runtimeEvent: "selectionchange",
                      targetPart: "root",
                    },
                  ],
                }
              : file.component.render,
          stateSync: [
            {
              setter: "setSelectedKey",
              state: "selectedKey",
              valueProp: "selectedKey",
            },
          ],
        },
      };
    }),
  };
}

function expectSafeCliRegistryPath(target: string, value: string): void {
  const portablePath = value.replace(/\\/g, "/");
  const normalizedPath = posix.normalize(portablePath);

  expect(value, `${target} CLI registry path`).not.toBe("");
  expect(isAbsolute(value), `${target} CLI registry path must be relative`).toBe(false);
  expect(portablePath, `${target} CLI registry path must not be absolute`).not.toMatch(
    /^(?:\/|[a-zA-Z][a-zA-Z\d+.-]*:)/,
  );
  expect(normalizedPath, `${target} CLI registry path must not contain traversal`).toBe(
    portablePath,
  );
  expect(portablePath, `${target} CLI registry path must stay inside repo`).not.toMatch(
    /^(?:\.?\.\/|\.{1,2}$)/,
  );
}

const recordingAdapter = defineFrameworkAdapter({
  target: "example",
  fileExtension: ".example",
  printOutput(model) {
    return model.files.map((file) => {
      if (file.kind === "component") return this.printComponentFile(file);
      if (file.kind === "helper") return this.printHelperFile(file);
      if (file.kind === "index") return this.printIndexFile(file);
      return this.printTypeFacadeFile(file);
    });
  },
  printComponentFile(file) {
    const component = file.component;

    return {
      contents: [
        `target=${this.target}`,
        `component=${component.name}`,
        `imports=${component.imports.map((importModel) => importModel.id).join(", ")}`,
        `props=${component.props.map((prop) => `${prop.name}:${prop.kind}`).join("|")}`,
        `defaulted=${component.defaults.map((defaultModel) => defaultModel.prop).join(", ")}`,
        `render=${component.render.kind}`,
        `lifecycle=${component.lifecycle?.factory ?? "none"}`,
        `refs=${component.refs.map((ref) => ref.id).join(", ")}`,
        `events=${component.events.map((event) => event.handlerProp).join(", ")}`,
        `context=${component.context
          .map((context) => `${context.role}:${context.name}`)
          .join(", ")}`,
        `portal=${component.portals
          .map((portal) => `${portal.sourcePart} -> ${portal.target}`)
          .join(", ")}`,
        `exports=${component.exports.kind}`,
      ].join("\n"),
      path: `${file.path}${this.fileExtension}`,
    };
  },
  printHelperFile(file) {
    return {
      contents: `helper=${file.name}`,
      path: file.path,
    };
  },
  printIndexFile(file) {
    return {
      contents: `index=${file.exports.namespace}, types=${file.typeFacades
        .map((typeFacade) => typeFacade.name)
        .join(", ")}`,
      path: file.path,
    };
  },
  printTypeFacadeFile(file) {
    return {
      contents: `typeFacade=${file.typeFacades.map((typeFacade) => typeFacade.name).join(", ")}`,
      path: file.path,
    };
  },
  normalizeAttributeName(name) {
    return name;
  },
  projectBooleanAttribute(attribute) {
    return { ...attribute, value: attribute.value ?? true };
  },
  projectProp(prop) {
    return prop;
  },
  projectDefaultValue(defaultValue) {
    return defaultValue;
  },
  projectRenderTree(renderTree) {
    return renderTree;
  },
  projectSlot(slot) {
    return slot;
  },
  projectRuntimeLifecycle(lifecycle) {
    return lifecycle;
  },
  projectRef(ref) {
    return ref;
  },
  projectEventBridge(event) {
    return event;
  },
  projectControlledStateSync(sync) {
    return sync;
  },
  projectContext(context) {
    return context;
  },
  projectPortal(portal) {
    return portal;
  },
  printExports(exportsModel) {
    return exportsModel.namespace;
  },
}) satisfies FrameworkAdapter;
