import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buttonRuntimeAdapterContract,
  checkboxRuntimeAdapterContract,
  colorPickerRuntimeAdapterContract,
  popoverRuntimeAdapterContract,
  runtimeAdapterContracts,
} from "../contracts/primitive/representatives.js";
import { starwindStyledContracts } from "../contracts/styled/starwind.js";
import type { StyledAdapterContract } from "../contracts/styled/types.js";
import {
  buildPrimitiveVendoringArtifacts,
  buildRuntimeRegistry,
  buildSplitRuntimeRegistry,
  buildStyledArtifactPlanningFacts,
  DEFAULT_COMPONENT_INSTALL_ROOT,
  DEFAULT_PRIMITIVE_INSTALL_ROOT,
  DEFAULT_PRIMITIVE_VERSION_MANIFEST,
  DEFAULT_REGISTRY_VERSION_MANIFEST,
  getLocalGeneratedImportCandidates,
  isValidRegistryPackageName,
  loadPrimitiveVersionManifest,
  loadRegistryVersionManifest,
  type RuntimeRegistry,
  writeRuntimeRegistry,
} from "../generate-cli-registry.js";
import { getPrimitiveFrameworkAdapterTarget } from "../renderers/framework-adapters/index.js";

const runtimePackage = JSON.parse(
  await readFile(new URL("../../../packages/runtime/package.json", import.meta.url), "utf8"),
) as { version: string };
const CURRENT_BETA_PACKAGE_RANGE = `^${runtimePackage.version}`;

describe("generateCliRegistry", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-cli-registry-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { force: true, recursive: true });
  });

  it("rejects malformed setup package names", () => {
    expect(isValidRegistryPackageName("@tabler/icons-react")).toBe(true);
    expect(isValidRegistryPackageName("tailwindcss")).toBe(true);
    expect(isValidRegistryPackageName("bad package")).toBe(false);
    expect(isValidRegistryPackageName("foo@1")).toBe(false);
    expect(isValidRegistryPackageName("@scope/BadName")).toBe(false);
  });

  it("generates target-specific styled artifacts and separated dependency metadata", async () => {
    const contracts = starwindStyledContracts.filter((contract) =>
      ["button", "button-group", "carousel", "separator", "dropdown"].includes(contract.component),
    );

    const registry = await buildRuntimeRegistry({
      componentVersion: "2.0.0",
      contracts,
      registryVersion: "2.0.0",
      tempRoot,
    });

    expect(registry.version).toBe("2.0.0");
    expect(registry.setup).toEqual({
      astro: {
        adapterPackage: { name: "@starwind-ui/astro", range: CURRENT_BETA_PACKAGE_RANGE },
        packageRequirements: [
          { name: "@tabler/icons", range: "^3" },
          { name: "@tailwindcss/forms", range: "^0.5" },
          { name: "@tailwindcss/vite", range: "^4" },
          { name: "tailwind-merge", range: "^3" },
          { name: "tailwind-variants", range: "^3" },
          { name: "tailwindcss", range: "^4" },
          { name: "tw-animate-css", range: "^1" },
        ],
      },
      react: {
        adapterPackage: { name: "@starwind-ui/react", range: CURRENT_BETA_PACKAGE_RANGE },
        packageRequirements: [
          { name: "@tabler/icons-react", range: "^3" },
          { name: "@tailwindcss/forms", range: "^0.5" },
          { name: "@tailwindcss/vite", range: "^4" },
          { name: "tailwind-merge", range: "^3" },
          { name: "tailwind-variants", range: "^3" },
          { name: "tailwindcss", range: "^4" },
          { name: "tw-animate-css", range: "^1" },
        ],
      },
    });
    expect(registry.setup.astro?.packageRequirements.map(({ name }) => name)).not.toContain(
      "@tabler/icons-react",
    );
    expect(registry.setup.react?.packageRequirements.map(({ name }) => name)).not.toContain(
      "@tabler/icons",
    );
    expect(JSON.stringify(registry)).not.toContain("dropdown-menu");

    const button = getRegistryComponentWithTargets(registry, "button");
    expect(button).toMatchObject({
      name: "button",
      version: "2.0.0",
      dependencies: [],
    });
    expect(button.targets.astro.packageRequirements).toEqual(
      expect.arrayContaining([{ name: "@starwind-ui/astro", range: CURRENT_BETA_PACKAGE_RANGE }]),
    );
    expect(button.targets.astro.packageRequirements).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "@starwind-ui/runtime" })]),
    );
    expect(button.targets.react.packageRequirements).toEqual(
      expect.arrayContaining([{ name: "@starwind-ui/react", range: CURRENT_BETA_PACKAGE_RANGE }]),
    );
    expect(button.targets.react.packageRequirements).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "@starwind-ui/runtime" })]),
    );
    expect(button?.targets?.astro?.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `${DEFAULT_COMPONENT_INSTALL_ROOT}/button/index.ts`,
          content: expect.stringContaining("export default"),
        }),
      ]),
    );
    expect(button?.targets?.react?.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `${DEFAULT_COMPONENT_INSTALL_ROOT}/button/index.ts`,
          content: expect.stringContaining("export default"),
        }),
      ]),
    );
    for (const component of registry.components) {
      if (!component.targets) continue;
      for (const target of Object.values(component.targets)) {
        for (const file of target.files) {
          expect(file.content, file.path).toMatch(/[^\s]\n$/);
          expect(file.content, file.path).not.toMatch(/\n\n$/);
        }
      }
    }
    expect(button?.targets?.astro?.packageRequirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "tailwind-variants",
          range: expect.stringMatching(/^\^3/),
        }),
      ]),
    );

    const buttonGroup = registry.components.find((component) => component.name === "button-group");
    expect(buttonGroup?.targets?.astro?.componentDependencies).toEqual(["separator"]);
    expect(buttonGroup?.targets?.astro?.packageRequirements.map((pkg) => pkg.name)).toEqual(
      expect.arrayContaining(["@starwind-ui/astro"]),
    );
    expect(buttonGroup?.targets?.astro?.packageRequirements.map((pkg) => pkg.name)).not.toEqual(
      expect.arrayContaining(["@starwind-ui/runtime"]),
    );

    const carousel = getRegistryComponentWithTargets(registry, "carousel");
    expect(carousel.targets.astro.componentDependencies).toEqual(["button"]);
    expect(carousel.targets.react.componentDependencies).toEqual(["button"]);
  });

  it("adds package requirements for direct imports in prepared files", async () => {
    const registry = await buildRuntimeRegistry({
      componentVersion: "2.0.0",
      contracts: starwindStyledContracts.filter((contract) =>
        ["image", "spinner"].includes(contract.component),
      ),
      registryVersion: "2.0.0",
      tempRoot,
    });

    const image = getRegistryComponentWithTargets(registry, "image");
    const spinner = getRegistryComponentWithTargets(registry, "spinner");
    expect(image.targets.astro.packageRequirements).toEqual(
      expect.arrayContaining([{ name: "astro", range: ">=5" }]),
    );
    expect(spinner.targets.astro.packageRequirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "@tabler/icons", range: expect.stringMatching(/^\^3/) }),
        expect.objectContaining({
          name: "tailwind-variants",
          range: expect.stringMatching(/^\^3/),
        }),
      ]),
    );
    expect(spinner.targets.react.packageRequirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "@tabler/icons-react",
          range: expect.stringMatching(/^\^3/),
        }),
        expect.objectContaining({
          name: "tailwind-variants",
          range: expect.stringMatching(/^\^3/),
        }),
      ]),
    );
  });

  it("derives workspace package ranges from package metadata", async () => {
    const astroPackageJson = JSON.parse(
      await readFile(path.join(process.cwd(), "packages/astro/package.json"), "utf8"),
    ) as { version: string };
    const reactPackageJson = JSON.parse(
      await readFile(path.join(process.cwd(), "packages/react/package.json"), "utf8"),
    ) as { version: string };
    const runtimePackageJson = JSON.parse(
      await readFile(path.join(process.cwd(), "packages/runtime/package.json"), "utf8"),
    ) as { version: string };

    const registry = await buildRuntimeRegistry({
      componentVersion: "2.0.0",
      contracts: starwindStyledContracts.filter((contract) => contract.component === "button"),
      registryVersion: "2.0.0",
      tempRoot,
    });
    const button = getRegistryComponentWithTargets(registry, "button");

    expect(button.targets.astro.packageRequirements).toEqual(
      expect.arrayContaining([
        { name: "@starwind-ui/astro", range: expectedPackageRange(astroPackageJson.version) },
      ]),
    );
    expect(button.targets.astro.packageRequirements).not.toEqual(
      expect.arrayContaining([
        { name: "@starwind-ui/runtime", range: expectedPackageRange(runtimePackageJson.version) },
      ]),
    );
    expect(button.targets.react.packageRequirements).toEqual(
      expect.arrayContaining([
        { name: "@starwind-ui/react", range: expectedPackageRange(reactPackageJson.version) },
      ]),
    );
    expect(button.targets.react.packageRequirements).not.toEqual(
      expect.arrayContaining([
        { name: "@starwind-ui/runtime", range: expectedPackageRange(runtimePackageJson.version) },
      ]),
    );
  });

  it("keeps component dependencies target-scoped for framework-specific contract references", async () => {
    const registry = await buildRuntimeRegistry({
      componentVersion: "2.0.0",
      contracts: [
        {
          component: "shared-child",
          publicExports: ["SharedChild"],
          defaultExport: { Root: "SharedChild" },
          defaultExportMode: "component",
          components: [
            {
              exportName: "SharedChild",
              render: [{ type: "element", tag: "div", selfClosing: true }],
            },
          ],
        },
        {
          component: "target-scoped-parent",
          publicExports: ["TargetScopedParent"],
          defaultExport: { Root: "TargetScopedParent" },
          defaultExportMode: "component",
          components: [
            {
              exportName: "TargetScopedParent",
              props: {
                extends: [
                  {
                    component: "shared-child",
                    exportName: "SharedChild",
                    frameworks: ["astro"],
                    type: "componentProps",
                  },
                ],
              },
              render: [{ tag: "div", selfClosing: true, type: "element" }],
            },
          ],
        },
      ],
      registryVersion: "2.0.0",
      tempRoot,
    });

    const parent = getRegistryComponentWithTargets(registry, "target-scoped-parent");
    expect(parent.targets.astro.componentDependencies).toEqual(["shared-child"]);
    expect(parent.targets.react.componentDependencies).toEqual([]);
  });

  it("plans styled artifact dependencies and package sources from model facts", () => {
    const planningFacts = buildStyledArtifactPlanningFacts({
      contracts: [
        {
          component: "shared-child",
          publicExports: ["SharedChild"],
          defaultExport: { Root: "SharedChild" },
          defaultExportMode: "component",
          components: [
            {
              exportName: "SharedChild",
              render: [{ type: "element", tag: "div", selfClosing: true }],
            },
          ],
        },
        {
          component: "model-parent",
          publicExports: ["ModelParent"],
          defaultExport: { Root: "ModelParent" },
          defaultExportMode: "component",
          variantCollectionName: "ModelParentVariants",
          variants: {
            modelParent: {
              base: "grid",
            },
          },
          components: [
            {
              exportName: "ModelParent",
              imports: [
                {
                  importName: "X",
                  source: "@tabler/icons/outline/x.svg",
                  type: "default",
                },
              ],
              props: {
                extends: [
                  {
                    code: 'import("astro-only-package").AstroThing',
                    frameworks: ["astro"],
                    type: "raw",
                  },
                  {
                    component: "shared-child",
                    exportName: "SharedChild",
                    type: "componentProps",
                  },
                ],
                fields: [
                  {
                    frameworks: ["react"],
                    name: "external",
                    optional: true,
                    type: 'import("react-only-package").ReactThing',
                  },
                ],
              },
              render: [
                {
                  component: "shared-child",
                  exportName: "SharedChild",
                  selfClosing: true,
                  type: "component",
                },
                {
                  component: "dialog",
                  part: "Root",
                  selfClosing: true,
                  type: "primitive",
                },
                {
                  importName: "X",
                  type: "icon",
                },
              ],
            },
          ],
        },
        {
          component: "astro-only-card",
          frameworks: ["astro"],
          publicExports: ["AstroOnlyCard"],
          defaultExport: { Root: "AstroOnlyCard" },
          defaultExportMode: "component",
          components: [
            {
              exportName: "AstroOnlyCard",
              render: [{ type: "element", tag: "div", selfClosing: true }],
            },
          ],
        },
      ] satisfies StyledAdapterContract[],
    });

    expect(planningFacts.targets.astro?.["model-parent"]).toMatchObject({
      componentDependencies: ["shared-child"],
      packageRequirementSources: expect.arrayContaining([
        "@starwind-ui/astro",
        "@starwind-ui/astro/dialog",
        "@tabler/icons/outline/x.svg",
        "astro-only-package",
        "tailwind-variants",
      ]),
    });
    expect(planningFacts.targets.react?.["model-parent"]).toMatchObject({
      componentDependencies: ["shared-child"],
      packageRequirementSources: expect.arrayContaining([
        "@starwind-ui/react",
        "@starwind-ui/react/dialog",
        "@tabler/icons-react",
        "react",
        "react-only-package",
        "tailwind-variants",
      ]),
    });
    expect(planningFacts.targets.astro?.["astro-only-card"]).toBeDefined();
    expect(planningFacts.targets.react?.["astro-only-card"]).toBeUndefined();
  });

  it("keeps representative styled package metadata covered by planning facts", async () => {
    const contracts = starwindStyledContracts.filter((contract) =>
      ["button", "dialog", "field", "image", "spinner", "theme-toggle"].includes(
        contract.component,
      ),
    );
    const planningFacts = buildStyledArtifactPlanningFacts({ contracts });
    const registry = await buildRuntimeRegistry({
      componentVersion: "2.0.0",
      contracts,
      registryVersion: "2.0.0",
      tempRoot,
    });
    const fallbackOnlyPackageAllowlist = new Map<string, string[]>();

    for (const component of registry.components) {
      const componentTargets = getRegistryComponentWithTargets(registry, component.name).targets;

      for (const [target, registryTarget] of Object.entries(componentTargets)) {
        const targetName = target as keyof typeof planningFacts.targets;
        const plannedPackageNames = packageNamesFromImportSources(
          planningFacts.targets[targetName]?.[component.name]?.packageRequirementSources ?? [],
        );
        const registryPackageNames = registryTarget.packageRequirements
          .map((requirement) => requirement.name)
          .sort();

        expect(plannedPackageNames, `${target}:${component.name}`).toEqual(
          [
            ...registryPackageNames,
            ...(fallbackOnlyPackageAllowlist.get(`${target}:${component.name}`) ?? []),
          ].sort(),
        );
      }
    }
  });

  it("does not use generated styled file imports as a package requirement fallback", async () => {
    const registryGeneratorSource = await readFile(
      path.join(process.cwd(), "scripts/portable-runtime/generate-cli-registry.ts"),
      "utf8",
    );

    const styledRequirementBody = extractFunctionBody(
      registryGeneratorSource,
      "collectPackageRequirements",
    );
    const primitiveRequirementBody = extractFunctionBody(
      registryGeneratorSource,
      "collectPrimitivePackageRequirements",
    );

    expect(styledRequirementBody).not.toContain("files: RegistryFile[]");
    expect(styledRequirementBody).not.toContain("collectImportSources(file.content)");
    expect(primitiveRequirementBody).toContain("collectImportSources(file.content)");
  });

  it("derives local generated import candidates from framework target metadata", async () => {
    const registryGeneratorSource = await readFile(
      path.join(process.cwd(), "scripts/portable-runtime/generate-cli-registry.ts"),
      "utf8",
    );

    expect(registryGeneratorSource).toContain("generatedImportCandidateExtensions");
    for (const bakedCandidate of [
      "`${importPath}.astro`",
      "`${importPath}.ts`",
      "`${importPath}.tsx`",
      "`${importPath}.js`",
      "`${importPath}.jsx`",
      'path.posix.join(importPath, "index.astro")',
      'path.posix.join(importPath, "index.ts")',
      'path.posix.join(importPath, "index.tsx")',
      'path.posix.join(importPath, "index.js")',
      'path.posix.join(importPath, "index.jsx")',
    ]) {
      expect(registryGeneratorSource).not.toContain(bakedCandidate);
    }
    expect(getPrimitiveFrameworkAdapterTarget("astro").cliRegistry).toMatchObject({
      generatedImportCandidateExtensions: [".astro", ".ts", ".js"],
      styledArtifact: {
        outputDir: "astro",
        primitiveOutputDir: "astro-primitives",
      },
    });
    expect(getPrimitiveFrameworkAdapterTarget("react").cliRegistry).toMatchObject({
      generatedImportCandidateExtensions: [".ts", ".tsx", ".js", ".jsx"],
      styledArtifact: {
        outputDir: "react",
        primitiveOutputDir: "react-primitives",
      },
    });
    expect(getLocalGeneratedImportCandidates("widget/WidgetRoot", [".vue"])).toEqual([
      "widget/WidgetRoot.vue",
      "widget/WidgetRoot/index.vue",
    ]);
    expect(getLocalGeneratedImportCandidates("widget/WidgetRoot.custom", [".vue"])).toEqual([
      "widget/WidgetRoot.custom",
    ]);
  });

  it("reads registry and component styled versions from a manifest", async () => {
    const manifestPath = path.join(tempRoot, "registry-versions.json");
    await writeRegistryVersionManifest(manifestPath, {
      registryVersion: "3.0.0",
      components: {
        button: "2.1.0",
        dropdown: "2.2.0",
      },
    });

    const registry = await buildRuntimeRegistry({
      contracts: starwindStyledContracts.filter((contract) =>
        ["button", "dropdown"].includes(contract.component),
      ),
      tempRoot: path.join(tempRoot, "generated"),
      versionManifestPath: manifestPath,
    });

    expect(registry.version).toBe("3.0.0");
    expect(registry.components.find((component) => component.name === "button")?.version).toBe(
      "2.1.0",
    );
    expect(registry.components.find((component) => component.name === "dropdown")?.version).toBe(
      "2.2.0",
    );
    expect(
      getRegistryComponentWithTargets(registry, "button").targets.astro.packageRequirements,
    ).toEqual(
      expect.arrayContaining([{ name: "@starwind-ui/astro", range: CURRENT_BETA_PACKAGE_RANGE }]),
    );
  });

  it("changes only the bumped component version when the manifest version changes", async () => {
    const firstManifestPath = path.join(tempRoot, "registry-versions.first.json");
    const secondManifestPath = path.join(tempRoot, "registry-versions.second.json");
    await writeRegistryVersionManifest(firstManifestPath, {
      registryVersion: "3.0.0",
      components: {
        button: "2.1.0",
        dropdown: "2.2.0",
      },
    });
    await writeRegistryVersionManifest(secondManifestPath, {
      registryVersion: "3.0.0",
      components: {
        button: "2.1.1",
        dropdown: "2.2.0",
      },
    });

    const contracts = starwindStyledContracts.filter((contract) =>
      ["button", "dropdown"].includes(contract.component),
    );
    const firstRegistry = await buildRuntimeRegistry({
      contracts,
      tempRoot: path.join(tempRoot, "first-generated"),
      versionManifestPath: firstManifestPath,
    });
    const secondRegistry = await buildRuntimeRegistry({
      contracts,
      tempRoot: path.join(tempRoot, "second-generated"),
      versionManifestPath: secondManifestPath,
    });

    const firstButton = firstRegistry.components.find((component) => component.name === "button")!;
    const secondButton = secondRegistry.components.find(
      (component) => component.name === "button",
    )!;
    const firstDropdown = firstRegistry.components.find(
      (component) => component.name === "dropdown",
    )!;
    const secondDropdown = secondRegistry.components.find(
      (component) => component.name === "dropdown",
    )!;

    expect(secondButton.version).toBe("2.1.1");
    expect(firstDropdown.version).toBe(secondDropdown.version);
    expect({ ...firstButton, version: secondButton.version }).toEqual(secondButton);
    expect(firstDropdown).toEqual(secondDropdown);
  });

  it("fails when a styled contract is missing from the version manifest", async () => {
    const manifestPath = path.join(tempRoot, "registry-versions.json");
    await writeRegistryVersionManifest(manifestPath, {
      registryVersion: "3.0.0",
      components: {
        button: "2.1.0",
      },
    });

    await expect(
      buildRuntimeRegistry({
        contracts: starwindStyledContracts.filter((contract) =>
          ["button", "dropdown"].includes(contract.component),
        ),
        tempRoot: path.join(tempRoot, "generated"),
        versionManifestPath: manifestPath,
      }),
    ).rejects.toThrow(/registry-versions\.json.*dropdown/);
  });

  it("validates manifest registry and component versions as semver", async () => {
    const manifestPath = path.join(tempRoot, "registry-versions.json");
    await writeRegistryVersionManifest(manifestPath, {
      registryVersion: "2026-06-19",
      components: {
        button: "2.1.0",
      },
    });

    await expect(
      buildRuntimeRegistry({
        contracts: starwindStyledContracts.filter((contract) => contract.component === "button"),
        tempRoot: path.join(tempRoot, "generated"),
        versionManifestPath: manifestPath,
      }),
    ).rejects.toThrow(/registryVersion.*semver/);

    await writeRegistryVersionManifest(manifestPath, {
      registryVersion: "3.0.0",
      components: {
        button: "latest",
      },
    });

    await expect(
      buildRuntimeRegistry({
        contracts: starwindStyledContracts.filter((contract) => contract.component === "button"),
        tempRoot: path.join(tempRoot, "generated-again"),
        versionManifestPath: manifestPath,
      }),
    ).rejects.toThrow(/button.*semver/);

    await writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          registryVersion: "3.0.0",
          defaultComponentVersion: "latest",
          components: {
            button: "2.1.0",
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    await expect(
      buildRuntimeRegistry({
        contracts: starwindStyledContracts.filter((contract) => contract.component === "button"),
        tempRoot: path.join(tempRoot, "generated-yet-again"),
        versionManifestPath: manifestPath,
      }),
    ).rejects.toThrow(/defaultComponentVersion.*semver/);
  });

  it("can build a split registry index with per-component artifact documents", async () => {
    const fullRegistry = await buildRuntimeRegistry({
      componentVersion: "2.0.0",
      contracts: starwindStyledContracts.filter((contract) => contract.component === "button"),
      registryVersion: "2.0.0",
      tempRoot: path.join(tempRoot, "full"),
    });
    const splitRegistry = await buildSplitRuntimeRegistry({
      componentVersion: "2.0.0",
      contracts: starwindStyledContracts.filter((contract) => contract.component === "button"),
      registryVersion: "2.0.0",
      tempRoot: path.join(tempRoot, "split"),
    });

    expect(splitRegistry.registry.setup).toEqual(fullRegistry.setup);
    expect(splitRegistry.registry.components).toEqual([
      expect.objectContaining({
        name: "button",
        version: "2.0.0",
        artifact: { path: "artifacts/button.json" },
      }),
    ]);
    expect(splitRegistry.registry.components[0]).not.toHaveProperty("targets");
    expect(splitRegistry.artifacts).toEqual([
      {
        path: "artifacts/button.json",
        artifact: expect.objectContaining({
          registryVersion: "2.0.0",
          component: expect.objectContaining({
            name: "button",
            version: "2.0.0",
            targets: expect.objectContaining({
              astro: expect.objectContaining({
                files: expect.arrayContaining([
                  expect.objectContaining({
                    path: `${DEFAULT_COMPONENT_INSTALL_ROOT}/button/index.ts`,
                    content: expect.stringContaining("export default"),
                  }),
                ]),
              }),
            }),
          }),
        }),
      },
    ]);
  });

  it("can write a split registry index and artifact files", async () => {
    const registry = await writeRuntimeRegistry({
      artifactDir: "components",
      componentVersion: "2.0.0",
      contracts: starwindStyledContracts.filter((contract) => contract.component === "button"),
      outputPath: "registry/index.json",
      outputRoot: tempRoot,
      registryVersion: "2.0.0",
      splitArtifacts: true,
      tempRoot: path.join(tempRoot, "generated"),
    });

    const registryFile = JSON.parse(
      await readFile(path.join(tempRoot, "registry", "index.json"), "utf8"),
    );
    const artifactFile = JSON.parse(
      await readFile(path.join(tempRoot, "registry", "components", "button.json"), "utf8"),
    );

    expect(registry).toEqual(registryFile);
    expect(registryFile.components[0]).toMatchObject({
      name: "button",
      artifact: { path: "components/button.json" },
    });
    expect(artifactFile.component).toMatchObject({
      name: "button",
      targets: expect.any(Object),
    });
  });

  it("keeps the committed bundled registry synced with styled contract inventory", async () => {
    const versionManifest = await loadRegistryVersionManifest();
    const runtimeBundledRegistry = JSON.parse(
      await readFile(
        path.join(process.cwd(), "packages/cli/src/registry/bundled-registry.json"),
        "utf8",
      ),
    ) as RuntimeRegistry;
    const contractNames = starwindStyledContracts.map((contract) => contract.component).sort();
    const registryNames = runtimeBundledRegistry.components
      .map((component) => component.name)
      .sort();

    expect(runtimeBundledRegistry.version).toBe(versionManifest.registryVersion);
    expect(runtimeBundledRegistry.components.every((component) => component.version)).toBe(true);
    expect(registryNames).toEqual(contractNames);
    expect(registryNames).toContain("dropdown");
    expect(registryNames).toContain("navigation-menu");
    expect(registryNames).not.toContain("dropdown-menu");

    const badge = getRegistryComponentWithTargets(runtimeBundledRegistry, "badge");
    expect(badge.version).toBe("1.5.0");
    const badgeAstroRoot = badge.targets.astro.files.find((file) =>
      file.path.endsWith("/badge/Badge.astro"),
    );
    const badgeReactRoot = badge.targets.react.files.find((file) =>
      file.path.endsWith("/badge/Badge.tsx"),
    );
    const badgeAstroVariants = badge.targets.astro.files.find((file) =>
      file.path.endsWith("/badge/variants.ts"),
    );
    const badgeReactVariants = badge.targets.react.files.find((file) =>
      file.path.endsWith("/badge/variants.ts"),
    );
    for (const badgeRoot of [badgeAstroRoot, badgeReactRoot]) {
      expect(badgeRoot, "badge registry root").toBeDefined();
      expect(badgeRoot?.content).toContain("tone, appearance, eyebrow");
      expect(badgeRoot?.content).toContain("usesComposedBadgeStyle");
      expect(badgeRoot?.content).toContain("appearance: resolvedAppearance");
      expect(badgeRoot?.content).toContain('Omit<VariantProps<typeof badge>, "isLink">');
    }
    for (const badgeVariants of [badgeAstroVariants, badgeReactVariants]) {
      expect(badgeVariants, "badge registry variants").toBeDefined();
      expect(badgeVariants?.content).toContain('frosted: ""');
      expect(badgeVariants?.content).toContain("bg-primary-accent/10 text-primary-accent");
      expect(badgeVariants?.content).toContain(
        "rounded-none border-0 bg-transparent p-0 shadow-none",
      );
      expect(badgeVariants?.content).toContain(
        "border bg-background/80 shadow-sm backdrop-blur-sm",
      );
      expect(badgeVariants?.content).toContain('true: "uppercase tracking-wider"');
      expect(badgeVariants?.content).not.toContain("announcement");
    }

    const navigationMenu = runtimeBundledRegistry.components.find(
      (component) => component.name === "navigation-menu",
    );
    expect(navigationMenu).toBeDefined();
    expect(navigationMenu?.targets).toBeDefined();
    const navigationMenuTargets = navigationMenu!.targets!;
    expect(navigationMenuTargets.astro.packageRequirements).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "@starwind-ui/astro" })]),
    );
    expect(navigationMenuTargets.react.packageRequirements).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "@starwind-ui/react" })]),
    );
    const navigationMenuAstroRoot = navigationMenuTargets.astro.files.find((file) =>
      file.path.endsWith("/navigation-menu/NavigationMenu.astro"),
    );
    const navigationMenuReactRoot = navigationMenuTargets.react.files.find((file) =>
      file.path.endsWith("/navigation-menu/NavigationMenu.tsx"),
    );
    expect(navigationMenuAstroRoot?.content).toContain(
      'import NavigationMenuPrimitive from "@starwind-ui/astro/navigation-menu";',
    );
    expect(navigationMenuReactRoot?.content).toContain(
      'import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";',
    );
    const navigationMenuReactTrigger = navigationMenuTargets.react.files.find((file) =>
      file.path.endsWith("/navigation-menu/NavigationMenuTrigger.tsx"),
    );
    expect(navigationMenuReactTrigger?.content).toContain("if (asChild) {");
    expect(navigationMenuReactTrigger?.content).toContain("{showIcon && (");
    expect(navigationMenuReactTrigger?.content).not.toContain("{!asChild && showIcon && (");
    const navigationMenuAstroVariants = navigationMenuTargets.astro.files.find((file) =>
      file.path.endsWith("/navigation-menu/variants.ts"),
    );
    const navigationMenuReactVariants = navigationMenuTargets.react.files.find((file) =>
      file.path.endsWith("/navigation-menu/variants.ts"),
    );
    for (const variantFile of [navigationMenuAstroVariants, navigationMenuReactVariants]) {
      expect(variantFile, "navigation-menu registry variants").toBeDefined();
      expect(variantFile?.content).toContain(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
      );
      expect(variantFile?.content).not.toContain("group/navigation-menu relative z-10");
      expect(variantFile?.content).toContain(
        "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all outline-none",
      );
      expect(variantFile?.content).toContain(
        "ml-1 size-3 shrink-0 origin-center transition duration-300",
      );
      expect(variantFile?.content).toContain(
        "data-[state=closed]:pointer-events-none data-[state=closed]:absolute data-[state=closed]:inset-0",
      );
      const navigationMenuContentVariant =
        variantFile?.content.match(
          /export const navigationMenuContent = tv\(\{\n  base: \[\n([\s\S]*?)\n  \],\n\}\);/,
        )?.[1] ?? "";
      expect(navigationMenuContentVariant).toContain("transition-opacity");
      expect(navigationMenuContentVariant).not.toContain("translate-x");
      expect(variantFile?.content).toContain(
        "h-(--popup-height) w-(--popup-width) origin-(--transform-origin)",
      );
      expect(variantFile?.content).toContain("data-starting-style:opacity-0");
      expect(variantFile?.content).toContain("data-ending-style:opacity-0");
      expect(variantFile?.content).not.toContain("data-[state=open]:animate-in");
      expect(variantFile?.content).not.toContain("data-[state=closed]:animate-out");
      expect(variantFile?.content).not.toContain("slide-in-from-right-4");
      expect(variantFile?.content).not.toContain("slide-in-from-left-4");
      expect(variantFile?.content).not.toContain("min-w-[18rem]");
      const navigationMenuPositionerVariant =
        variantFile?.content.match(
          /export const navigationMenuPositioner = tv\(\{\n  base: \[\n([\s\S]*?)\n  \],\n\}\);/,
        )?.[1] ?? "";
      expect(navigationMenuPositionerVariant).toContain("--positioner-width");
      expect(navigationMenuPositionerVariant).not.toContain("flex justify-center");
      expect(variantFile?.content).not.toContain("--sw-nav-menu-positioner-width");
      expect(variantFile?.content).toContain("transition-[top,left,right,bottom,transform]");
      expect(variantFile?.content).not.toContain("transition-[left,top,width,height,transform]");
      expect(variantFile?.content).toContain("ring-foreground/10");
      expect(variantFile?.content).toContain("relative size-full overflow-hidden");
      expect(variantFile?.content).not.toContain("transition-[width,height]");
      expect(variantFile?.content).not.toContain("rounded-md shadow-md");
    }

    const registrySource = JSON.stringify(runtimeBundledRegistry);
    expect(registrySource).not.toContain("@starwind-ui/core");
    expect(registrySource).not.toContain("@starwind-ui/runtime");
    expect(registrySource).not.toContain("@floating-ui/dom");
    expect(registrySource).not.toContain("data-sw-navigation-menu");
    expect(registrySource).not.toContain("NavigationMenuBackdrop");
    expect(registrySource).not.toContain("actionsRef");
    expect(registrySource).not.toContain("onOpenChangeComplete");
    expect(registrySource).not.toContain("data-dialog-for");
    expect(registrySource).not.toContain("dialogFor");
    expect(registrySource).not.toContain("alignItemsWithTrigger");
    expect(registrySource).not.toContain("data-align-items-with-trigger");

    const themeToggle = getRegistryComponentWithTargets(runtimeBundledRegistry, "theme-toggle");
    const themeToggleAstro = themeToggle.targets.astro.files.find((file) =>
      file.path.endsWith("/theme-toggle/ThemeToggle.astro"),
    );
    const themeToggleReact = themeToggle.targets.react.files.find((file) =>
      file.path.endsWith("/theme-toggle/ThemeToggle.tsx"),
    );
    for (const themeToggleFile of [themeToggleAstro, themeToggleReact]) {
      expect(themeToggleFile?.content).toContain(
        'aria-pressed={initialPressed ? "true" : "false"}',
      );
      expect(themeToggleFile?.content).not.toContain("aria-pressed={String(initialPressed)}");
    }

    assertRegistryTriggerTargetId({
      registry: runtimeBundledRegistry,
      component: "dialog",
      triggerFile: `${DEFAULT_COMPONENT_INSTALL_ROOT}/dialog/DialogTrigger`,
      targetAttribute: "data-sw-dialog-target-id",
    });
    assertRegistryTriggerTargetId({
      registry: runtimeBundledRegistry,
      component: "sheet",
      triggerFile: `${DEFAULT_COMPONENT_INSTALL_ROOT}/sheet/SheetTrigger`,
      targetAttribute: "data-sw-drawer-target-id",
    });
    assertRegistryTriggerTargetId({
      registry: runtimeBundledRegistry,
      component: "alert-dialog",
      triggerFile: `${DEFAULT_COMPONENT_INSTALL_ROOT}/alert-dialog/AlertDialogTrigger`,
      targetAttribute: "data-sw-alert-dialog-target-id",
    });

    for (const component of runtimeBundledRegistry.components) {
      const contract = starwindStyledContracts.find((item) => item.component === component.name);
      const supportsAstro = !contract?.frameworks || contract.frameworks.includes("astro");
      const supportsReact = !contract?.frameworks || contract.frameworks.includes("react");

      expect(component.version).toBe(versionManifest.components[component.name]);
      expect(component.targets).toBeDefined();
      const targets = component.targets!;

      if (supportsAstro) {
        expect(targets.astro?.files.length ?? 0).toBeGreaterThan(0);
      }

      if (supportsReact) {
        expect(targets.react?.files.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the registry version manifest synced with styled contract inventory", async () => {
    const versionManifest = await loadRegistryVersionManifest();
    const contractNames = starwindStyledContracts.map((contract) => contract.component).sort();

    expect(DEFAULT_REGISTRY_VERSION_MANIFEST).toBe(
      "packages/cli/registry/styled-component-versions.json",
    );
    expect(Object.keys(versionManifest.components).sort()).toEqual(contractNames);
  });

  it("generates Astro primitive vendoring artifacts from source with Runtime package requirements", async () => {
    const manifestPath = path.join(tempRoot, "primitive-versions.json");
    await writePrimitiveVersionManifest(manifestPath, {
      primitives: {
        button: "0.3.0",
      },
    });

    const artifactSet = await buildPrimitiveVendoringArtifacts({
      contracts: [buttonRuntimeAdapterContract],
      primitiveVersionManifestPath: manifestPath,
      tempRoot,
    });
    const button = artifactSet.primitives.find((primitive) => primitive.component === "button");

    expect(DEFAULT_PRIMITIVE_INSTALL_ROOT).toBe("src/components/starwind-primitives");
    expect(button).toMatchObject({
      component: "button",
      framework: "astro",
      version: "0.3.0",
      packageRequirements: expect.arrayContaining([
        expect.objectContaining({
          name: "@starwind-ui/runtime",
          range: expect.not.stringContaining("workspace:"),
        }),
      ]),
    });
    expect(button?.packageRequirements).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "@starwind-ui/astro" })]),
    );
    expect(button?.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/button/ButtonRoot.astro`,
          sourcePath: "packages/astro/src/button/ButtonRoot.astro",
          content: expect.stringContaining('from "@starwind-ui/runtime/button"'),
          sourceHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        }),
        expect.objectContaining({
          path: `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/button/index.ts`,
          sourcePath: "packages/astro/src/button/index.ts",
        }),
      ]),
    );
    expect(button?.files[0]?.content).toContain("Vendored by the Starwind CLI");
    expect(button?.files[0]?.content).not.toContain("Do not edit by hand");
  });

  it("generates React primitive vendoring artifacts with internal helper dependencies", async () => {
    const manifestPath = path.join(tempRoot, "primitive-versions.json");
    await writePrimitiveVersionManifest(manifestPath, {
      primitives: {
        button: "0.3.0",
      },
    });

    const artifactSet = await buildPrimitiveVendoringArtifacts({
      contracts: [buttonRuntimeAdapterContract],
      primitiveVersionManifestPath: manifestPath,
      tempRoot,
    });
    const button = artifactSet.primitives.find(
      (primitive) => primitive.component === "button" && primitive.framework === "react",
    );

    expect(button).toMatchObject({
      component: "button",
      framework: "react",
      version: "0.3.0",
      packageRequirements: expect.arrayContaining([
        expect.objectContaining({
          name: "@starwind-ui/runtime",
          range: expect.not.stringContaining("workspace:"),
        }),
        expect.objectContaining({ name: "react" }),
        expect.objectContaining({ name: "react-dom" }),
      ]),
    });
    expect(button?.packageRequirements).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "@starwind-ui/react" })]),
    );
    expect(button?.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/button/ButtonRoot.tsx`,
          sourcePath: "packages/react/src/button/ButtonRoot.tsx",
          content: expect.stringContaining('from "@starwind-ui/runtime/button"'),
          sourceHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        }),
        expect.objectContaining({
          path: `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/button/index.ts`,
          sourcePath: "packages/react/src/button/index.ts",
        }),
        expect.objectContaining({
          path: `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/internal/use-isomorphic-layout-effect.ts`,
          sourcePath: "packages/react/src/internal/use-isomorphic-layout-effect.ts",
          content: expect.stringContaining("useIsomorphicLayoutEffect"),
        }),
      ]),
    );
    expect(
      button?.files.find((file) => file.path.endsWith("button/ButtonRoot.tsx"))?.content,
    ).toContain("../internal/use-isomorphic-layout-effect");
    expect(button?.files[0]?.content).toContain("Vendored by the Starwind CLI");
    expect(button?.files[0]?.content).not.toContain("Do not edit by hand");
  });

  it("keeps representative primitive vendoring content aligned with formatted package source", async () => {
    const manifestPath = path.join(tempRoot, "primitive-versions.json");
    await writePrimitiveVersionManifest(manifestPath, {
      primitives: {
        checkbox: "0.3.0",
        popover: "0.3.0",
      },
    });

    const artifactSet = await buildPrimitiveVendoringArtifacts({
      contracts: [checkboxRuntimeAdapterContract, popoverRuntimeAdapterContract],
      primitiveVersionManifestPath: manifestPath,
      tempRoot,
    });
    const comparisons = [
      {
        component: "checkbox",
        framework: "react",
        sourcePath: "packages/react/src/checkbox/CheckboxRoot.tsx",
      },
      {
        component: "popover",
        framework: "react",
        sourcePath: "packages/react/src/popover/PopoverPopup.tsx",
      },
      {
        component: "checkbox",
        framework: "astro",
        sourcePath: "packages/astro/src/checkbox/CheckboxRoot.astro",
      },
      {
        component: "popover",
        framework: "astro",
        sourcePath: "packages/astro/src/popover/PopoverPopup.astro",
      },
    ] as const;

    for (const comparison of comparisons) {
      const artifactFile = getPrimitiveVendoringFileBySourcePath(artifactSet, comparison);
      const packageSource = await readFile(path.join(process.cwd(), comparison.sourcePath), "utf8");

      expect(artifactFile.content, comparison.sourcePath).toBe(
        normalizeGeneratedPackageContentForVendoring(packageSource),
      );
    }
  });

  it("generates default primitive artifacts for every current primitive contract", async () => {
    const artifactSet = await buildPrimitiveVendoringArtifacts({
      tempRoot,
    });
    const artifactComponents = artifactSet.primitives.map((primitive) => primitive.component);
    const artifactsByComponent = new Map(
      artifactSet.primitives.map((primitive) => [
        `${primitive.framework}:${primitive.component}`,
        primitive,
      ]),
    );

    for (const contract of runtimeAdapterContracts) {
      expect(artifactsByComponent.get(`astro:${contract.component}`)?.files.length).toBeGreaterThan(
        0,
      );
      expect(artifactsByComponent.get(`react:${contract.component}`)?.files.length).toBeGreaterThan(
        0,
      );
    }

    for (const artifact of artifactSet.primitives) {
      const registration = getPrimitiveFrameworkAdapterTarget(artifact.framework);

      assertSafeInstallPaths(artifact.files, DEFAULT_PRIMITIVE_INSTALL_ROOT);
      assertInstallGraphSourceClosure({
        files: artifact.files,
        generatedImportCandidateExtensions:
          registration.cliRegistry.generatedImportCandidateExtensions,
        installRoot: DEFAULT_PRIMITIVE_INSTALL_ROOT,
      });
      assertNoMonorepoOnlyImports(artifact.files);
    }

    expect(artifactComponents).not.toContain("theme");
  });

  it("tracks external imports used by primitive artifact files", async () => {
    const manifestPath = path.join(tempRoot, "primitive-versions.json");
    await writePrimitiveVersionManifest(manifestPath, {
      primitives: {
        button: "0.3.0",
      },
    });

    const artifactSet = await buildPrimitiveVendoringArtifacts({
      contracts: [buttonRuntimeAdapterContract],
      primitiveVersionManifestPath: manifestPath,
      tempRoot,
    });
    const button = artifactSet.primitives.find(
      (primitive) => primitive.component === "button" && primitive.framework === "astro",
    );
    const packageNames = button?.packageRequirements.map((requirement) => requirement.name);

    expect(packageNames).toEqual(expect.arrayContaining(["@starwind-ui/runtime", "astro"]));
    expect(packageNames).not.toEqual(expect.arrayContaining(["@starwind-ui/astro"]));
  });

  it("resolves primitive Runtime requirements to publishable ranges instead of workspace ranges", async () => {
    const runtimePackageJson = JSON.parse(
      await readFile(path.join(process.cwd(), "packages/runtime/package.json"), "utf8"),
    ) as { version: string };
    const manifestPath = path.join(tempRoot, "primitive-versions.json");
    await writePrimitiveVersionManifest(manifestPath, {
      primitives: {
        button: "0.3.0",
      },
    });

    const artifactSet = await buildPrimitiveVendoringArtifacts({
      contracts: [buttonRuntimeAdapterContract],
      primitiveVersionManifestPath: manifestPath,
      tempRoot,
    });
    const button = artifactSet.primitives.find(
      (primitive) => primitive.component === "button" && primitive.framework === "astro",
    );

    expect(button?.packageRequirements).toEqual(
      expect.arrayContaining([
        {
          name: "@starwind-ui/runtime",
          range: expectedPackageRange(runtimePackageJson.version),
        },
      ]),
    );
    expect(JSON.stringify(button?.packageRequirements)).not.toContain("workspace:");
  });

  it("fails when primitive vendoring version metadata is missing or invalid", async () => {
    const manifestPath = path.join(tempRoot, "primitive-versions.json");
    await writePrimitiveVersionManifest(manifestPath, {
      primitives: {},
    });

    await expect(
      buildPrimitiveVendoringArtifacts({
        contracts: [buttonRuntimeAdapterContract],
        primitiveVersionManifestPath: manifestPath,
        tempRoot: path.join(tempRoot, "missing-version"),
      }),
    ).rejects.toThrow(/primitive-versions\.json.*button/);

    await writePrimitiveVersionManifest(manifestPath, {
      primitives: {
        button: "latest",
      },
    });

    await expect(
      buildPrimitiveVendoringArtifacts({
        contracts: [buttonRuntimeAdapterContract],
        primitiveVersionManifestPath: manifestPath,
        tempRoot: path.join(tempRoot, "invalid-version"),
      }),
    ).rejects.toThrow(/button.*semver/);
  });

  it("rejects primitive vendoring paths that escape the destination root", async () => {
    const manifestPath = path.join(tempRoot, "primitive-versions.json");
    await writePrimitiveVersionManifest(manifestPath, {
      primitives: {
        button: "0.3.0",
      },
    });

    await expect(
      buildPrimitiveVendoringArtifacts({
        contracts: [buttonRuntimeAdapterContract],
        primitiveInstallRoot: "../starwind-primitives",
        primitiveVersionManifestPath: manifestPath,
        tempRoot,
      }),
    ).rejects.toThrow(/Primitive install root.*must stay inside/);
  });

  it("rejects unsafe primitive contract names before reading generated files", async () => {
    const manifestPath = path.join(tempRoot, "primitive-versions.json");
    await writePrimitiveVersionManifest(manifestPath, {
      primitives: {
        "../button": "0.3.0",
      },
    });

    await expect(
      buildPrimitiveVendoringArtifacts({
        contracts: [
          {
            ...buttonRuntimeAdapterContract,
            component: "../button",
          },
        ],
        primitiveVersionManifestPath: manifestPath,
        tempRoot,
      }),
    ).rejects.toThrow(/Unsafe primitive component name/);
  });

  it("keeps the primitive version manifest synced with primitive contract inventory", async () => {
    const versionManifest = await loadPrimitiveVersionManifest();
    const contractNames = runtimeAdapterContracts.map((contract) => contract.component).sort();

    expect(DEFAULT_PRIMITIVE_VERSION_MANIFEST).toBe(
      "packages/cli/registry/primitive-versions.json",
    );
    expect(Object.keys(versionManifest.primitives).sort()).toEqual(contractNames);
  });

  it("publishes deterministic, source-closed Color Picker candidates for Astro and React", async () => {
    const styledContract = starwindStyledContracts.find(
      (contract) => contract.component === "color-picker",
    );
    const styledVersionManifest = await loadRegistryVersionManifest();
    const primitiveVersionManifest = await loadPrimitiveVersionManifest();
    const [styledVersionManifestSource, primitiveVersionManifestSource] = await Promise.all([
      readFile(path.join(process.cwd(), DEFAULT_REGISTRY_VERSION_MANIFEST), "utf8"),
      readFile(path.join(process.cwd(), DEFAULT_PRIMITIVE_VERSION_MANIFEST), "utf8"),
    ]);
    const styledComponentCandidates = [
      "ColorPicker",
      "ColorPickerArea",
      "ColorPickerAreaThumb",
      "ColorPickerChannelInput",
      "ColorPickerChannelSlider",
      "ColorPickerClear",
      "ColorPickerContent",
      "ColorPickerControl",
      "ColorPickerEyeDropper",
      "ColorPickerFormatSelect",
      "ColorPickerHiddenInput",
      "ColorPickerInput",
      "ColorPickerLabel",
      "ColorPickerNativeFormatSelect",
      "ColorPickerRoot",
      "ColorPickerSliders",
      "ColorPickerSwatch",
      "ColorPickerSwatchGroup",
      "ColorPickerTrigger",
      "ColorPickerValueInput",
      "ColorPickerValueSwatch",
    ] as const;
    const styledCandidatePaths = new Map<"astro" | "react", string[]>();
    const primitiveCandidatePaths = new Map<"astro" | "react", string[]>();

    expect(styledContract).toBeDefined();
    expect(styledVersionManifest.components["color-picker"]).toBe("1.2.0");
    expect(primitiveVersionManifest.primitives["color-picker"]).toBe("0.1.0");
    expect(styledComponentCandidates).toHaveLength(21);

    const firstRegistry = await buildRuntimeRegistry({
      contracts: [styledContract!],
      tempRoot: path.join(tempRoot, "color-picker-registry-first"),
    });
    const secondRegistry = await buildRuntimeRegistry({
      contracts: [styledContract!],
      tempRoot: path.join(tempRoot, "color-picker-registry-second"),
    });
    const firstPrimitiveArtifacts = await buildPrimitiveVendoringArtifacts({
      contracts: [colorPickerRuntimeAdapterContract],
      tempRoot: path.join(tempRoot, "color-picker-primitives-first"),
    });
    const secondPrimitiveArtifacts = await buildPrimitiveVendoringArtifacts({
      contracts: [colorPickerRuntimeAdapterContract],
      tempRoot: path.join(tempRoot, "color-picker-primitives-second"),
    });

    expect(firstRegistry).toEqual(secondRegistry);
    expect(firstPrimitiveArtifacts).toEqual(secondPrimitiveArtifacts);
    expect(firstRegistry.$schema).toBe("https://starwind.dev/registry-schema.v2.json");
    expect(firstPrimitiveArtifacts.$schema).toBe(
      "https://starwind.dev/primitive-vendoring-artifacts-schema.v1.json",
    );

    const styled = getRegistryComponentWithTargets(firstRegistry, "color-picker");
    expect(styled.version).toBe("1.2.0");

    for (const framework of ["astro", "react"] as const) {
      const target = styled.targets[framework];
      const registration = getPrimitiveFrameworkAdapterTarget(framework);
      const adapterPackage = framework === "astro" ? "@starwind-ui/astro" : "@starwind-ui/react";
      const expectedPackageNames =
        framework === "astro"
          ? [adapterPackage, "@tabler/icons", "astro", "tailwind-variants"]
          : [adapterPackage, "@tabler/icons-react", "react", "tailwind-variants"];

      const expectedStyledPaths = [
        ...styledComponentCandidates.map(
          (component) =>
            `${DEFAULT_COMPONENT_INSTALL_ROOT}/color-picker/${component}${registration.adapter.fileExtension}`,
        ),
        `${DEFAULT_COMPONENT_INSTALL_ROOT}/color-picker/index.ts`,
        `${DEFAULT_COMPONENT_INSTALL_ROOT}/color-picker/styles.css`,
        `${DEFAULT_COMPONENT_INSTALL_ROOT}/color-picker/variants.ts`,
      ].sort();
      const actualStyledPaths = target.files.map((file) => file.path).sort();

      expect(target.componentDependencies).toEqual(["input", "native-select", "popover", "select"]);
      expect(target.packageRequirements.map((requirement) => requirement.name)).toEqual(
        expectedPackageNames,
      );
      expect(target.packageRequirements).toEqual(
        expect.arrayContaining([{ name: adapterPackage, range: CURRENT_BETA_PACKAGE_RANGE }]),
      );
      expect(JSON.stringify(target.packageRequirements)).not.toContain("workspace:");
      expect(target.files).toHaveLength(styledComponentCandidates.length + 3);
      expect(actualStyledPaths).toEqual(expectedStyledPaths);
      styledCandidatePaths.set(
        framework,
        actualStyledPaths.map((filePath) =>
          filePath.replace(registration.adapter.fileExtension, ".component"),
        ),
      );
      assertSafeInstallPaths(target.files, DEFAULT_COMPONENT_INSTALL_ROOT);
      assertInstallGraphSourceClosure({
        componentDependencies: target.componentDependencies,
        files: target.files,
        generatedImportCandidateExtensions:
          registration.cliRegistry.generatedImportCandidateExtensions,
        installRoot: DEFAULT_COMPONENT_INSTALL_ROOT,
      });
      assertNoMonorepoOnlyImports(target.files);
    }

    for (const framework of ["astro", "react"] as const) {
      const registration = getPrimitiveFrameworkAdapterTarget(framework);
      const artifact = firstPrimitiveArtifacts.primitives.find(
        (primitive) => primitive.component === "color-picker" && primitive.framework === framework,
      );
      const expectedPackageNames =
        framework === "astro"
          ? ["@starwind-ui/runtime", "astro"]
          : ["@starwind-ui/runtime", "react", "react-dom"];

      expect(artifact, `${framework}:color-picker`).toBeDefined();
      expect(artifact?.version).toBe("0.1.0");
      expect(artifact?.packageRequirements.map((requirement) => requirement.name)).toEqual(
        expectedPackageNames,
      );
      expect(artifact?.packageRequirements).toEqual(
        expect.arrayContaining([
          { name: "@starwind-ui/runtime", range: CURRENT_BETA_PACKAGE_RANGE },
        ]),
      );
      expect(JSON.stringify(artifact?.packageRequirements)).not.toContain("workspace:");
      expect(artifact?.files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/color-picker/ColorPickerRoot${registration.adapter.fileExtension}`,
          }),
          expect.objectContaining({
            path: `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/color-picker/ColorPickerFormatControl${registration.adapter.fileExtension}`,
          }),
          expect.objectContaining({
            path: `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/color-picker/index.ts`,
          }),
        ]),
      );

      const colorPickerInstallRoot = `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/color-picker/`;
      primitiveCandidatePaths.set(
        framework,
        artifact!.files
          .map((file) => file.path)
          .filter(
            (filePath) =>
              filePath.startsWith(colorPickerInstallRoot) &&
              !filePath.endsWith("ColorPickerRenderProjection.ts"),
          )
          .map((filePath) => filePath.replace(registration.adapter.fileExtension, ".component"))
          .sort(),
      );

      if (framework === "astro") {
        expect(artifact?.files).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/internal/controller-lifecycle.ts`,
            }),
          ]),
        );
      } else {
        expect(artifact?.files).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/internal/compose-refs.ts`,
            }),
            expect.objectContaining({
              path: `${DEFAULT_PRIMITIVE_INSTALL_ROOT}/internal/use-isomorphic-layout-effect.ts`,
            }),
          ]),
        );
      }

      assertSafeInstallPaths(artifact!.files, DEFAULT_PRIMITIVE_INSTALL_ROOT);
      assertInstallGraphSourceClosure({
        files: artifact!.files,
        generatedImportCandidateExtensions:
          registration.cliRegistry.generatedImportCandidateExtensions,
        installRoot: DEFAULT_PRIMITIVE_INSTALL_ROOT,
      });
      assertNoMonorepoOnlyImports(artifact!.files);
    }

    expect(styledCandidatePaths.get("astro")).toEqual(styledCandidatePaths.get("react"));
    expect(primitiveCandidatePaths.get("astro")).toEqual(primitiveCandidatePaths.get("react"));
    await expect(
      readFile(path.join(process.cwd(), DEFAULT_REGISTRY_VERSION_MANIFEST), "utf8"),
    ).resolves.toBe(styledVersionManifestSource);
    await expect(
      readFile(path.join(process.cwd(), DEFAULT_PRIMITIVE_VERSION_MANIFEST), "utf8"),
    ).resolves.toBe(primitiveVersionManifestSource);
  });

  it("keeps the committed primitive vendoring artifacts synced with generated source", async () => {
    const committedArtifacts = JSON.parse(
      await readFile(
        path.join(process.cwd(), "packages/cli/src/registry/primitive-vendoring-artifacts.json"),
        "utf8",
      ),
    );
    const generatedArtifacts = await buildPrimitiveVendoringArtifacts({
      tempRoot: path.join(tempRoot, "primitive-artifacts"),
    });
    const committedArtifactsSource = JSON.stringify(committedArtifacts);
    const navigationMenu = committedArtifacts.primitives.find(
      (primitive: { component: string; framework: string }) =>
        primitive.component === "navigation-menu" && primitive.framework === "astro",
    );
    const reactButton = committedArtifacts.primitives.find(
      (primitive: { component: string; framework: string }) =>
        primitive.component === "button" && primitive.framework === "react",
    );

    expect(committedArtifacts).toEqual(generatedArtifacts);
    expect(navigationMenu).toBeDefined();
    expect(JSON.stringify(navigationMenu)).toContain("data-sw-nav-menu");
    expect(JSON.stringify(navigationMenu)).toContain("@starwind-ui/runtime/navigation-menu");
    expect(JSON.stringify(navigationMenu)).not.toContain("data-sw-navigation-menu");
    expect(JSON.stringify(navigationMenu)).not.toContain("NavigationMenuBackdrop");
    expect(committedArtifactsSource).not.toContain("alignItemsWithTrigger");
    expect(committedArtifactsSource).not.toContain("data-align-items-with-trigger");
    expect(reactButton).toBeDefined();
    expect(JSON.stringify(reactButton)).toContain("ButtonRoot.tsx");
    expect(JSON.stringify(reactButton)).toContain("internal/use-isomorphic-layout-effect.ts");
  });
});

const PRIMITIVE_VENDORED_HEADER = `/**
 * Vendored by the Starwind CLI.
 * You own this file in your project.
 */`;

function getPrimitiveVendoringFileBySourcePath(
  artifactSet: Awaited<ReturnType<typeof buildPrimitiveVendoringArtifacts>>,
  comparison: {
    component: string;
    framework: "astro" | "react";
    sourcePath: string;
  },
) {
  const primitive = artifactSet.primitives.find(
    (candidate) =>
      candidate.component === comparison.component && candidate.framework === comparison.framework,
  );
  const file = primitive?.files.find((candidate) => candidate.sourcePath === comparison.sourcePath);

  expect(primitive, `${comparison.framework}:${comparison.component}`).toBeDefined();
  expect(file, comparison.sourcePath).toBeDefined();

  return file!;
}

function normalizeGeneratedPackageContentForVendoring(content: string): string {
  const normalized = content.replace(
    /\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-(?:astro|react)-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\//,
    PRIMITIVE_VENDORED_HEADER,
  );

  expect(normalized).not.toContain("Do not edit by hand; update the contract/template instead.");

  return normalized;
}

type InstallGraphFile = {
  content: string;
  path: string;
};

function assertSafeInstallPaths(files: readonly InstallGraphFile[], installRoot: string): void {
  expect(new Set(files.map((file) => file.path)).size).toBe(files.length);

  for (const file of files) {
    expect(file.path, file.path).not.toContain("\\");
    expect(file.path, file.path).toBe(path.posix.normalize(file.path));
    expect(file.path, file.path).toMatch(new RegExp(`^${escapeRegExp(installRoot)}/`));
    expect(file.path, file.path).not.toMatch(/(^|\/)\.\.?($|\/)/);
    expect(path.posix.isAbsolute(file.path), file.path).toBe(false);
  }
}

function assertInstallGraphSourceClosure(options: {
  componentDependencies?: readonly string[];
  files: readonly InstallGraphFile[];
  generatedImportCandidateExtensions: readonly string[];
  installRoot: string;
}): void {
  const filePaths = new Set(options.files.map((file) => file.path));
  const componentDependencyRoots = new Set(
    (options.componentDependencies ?? []).map((dependency) =>
      path.posix.join(options.installRoot, dependency),
    ),
  );

  for (const file of options.files) {
    for (const importSource of collectTestImportSources(file.content)) {
      if (!importSource.startsWith(".")) continue;

      const importBase = path.posix.normalize(
        path.posix.join(path.posix.dirname(file.path), importSource),
      );
      const resolvedFile = getLocalGeneratedImportCandidates(
        importBase,
        options.generatedImportCandidateExtensions,
      ).find((candidate) => filePaths.has(candidate));
      const resolvedComponentDependency = [...componentDependencyRoots].find(
        (dependencyRoot) =>
          importBase === dependencyRoot || importBase.startsWith(`${dependencyRoot}/`),
      );

      expect(
        resolvedFile ?? resolvedComponentDependency,
        `${file.path} has unresolved local import ${importSource}`,
      ).toBeDefined();
    }
  }
}

function assertNoMonorepoOnlyImports(files: readonly InstallGraphFile[]): void {
  for (const file of files) {
    for (const importSource of collectTestImportSources(file.content)) {
      expect(importSource, `${file.path} imports a monorepo-only source`).not.toMatch(
        /^(?:@\/|apps\/|packages\/|\.local\/)/,
      );
    }
  }
}

function collectTestImportSources(source: string): string[] {
  const importSources = new Set<string>();
  const staticImportPattern =
    /(?:import|export)\s+(?:type\s+)?(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g;
  const dynamicImportPattern = /import\(["']([^"']+)["']\)/g;

  for (const match of source.matchAll(staticImportPattern)) {
    importSources.add(match[1]);
  }

  for (const match of source.matchAll(dynamicImportPattern)) {
    importSources.add(match[1]);
  }

  return [...importSources];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expectedPackageRange(version: string): string {
  return version === "0.0.0" ? "*" : `^${version}`;
}

function packageNamesFromImportSources(importSources: readonly string[]): string[] {
  return [
    ...new Set(
      importSources.map(getImportedPackageName).filter((name): name is string => Boolean(name)),
    ),
  ].sort();
}

function getImportedPackageName(importSource: string): string | undefined {
  if (
    importSource.startsWith(".") ||
    importSource.startsWith("/") ||
    importSource.startsWith("node:") ||
    importSource.startsWith("@/")
  ) {
    return undefined;
  }

  if (importSource.startsWith("astro:")) {
    return "astro";
  }

  if (importSource.startsWith("@")) {
    const [scope, name] = importSource.split("/");
    return scope && name ? `${scope}/${name}` : importSource;
  }

  return importSource.split("/")[0];
}

function extractFunctionBody(source: string, functionName: string): string {
  const signatureIndex = source.indexOf(`function ${functionName}`);

  expect(signatureIndex, `${functionName} should exist`).toBeGreaterThanOrEqual(0);

  const implementationSignatureEnd = source.indexOf("):", signatureIndex);

  expect(
    implementationSignatureEnd,
    `${functionName} implementation signature should exist`,
  ).toBeGreaterThanOrEqual(0);

  const bodyStart = source.indexOf("{", implementationSignatureEnd);
  let depth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    const character = source[index];

    if (character === "{") {
      depth += 1;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(bodyStart, index + 1);
      }
    }
  }

  throw new Error(`Could not extract ${functionName} body.`);
}

type RuntimeRegistryComponentWithTargets = RuntimeRegistry["components"][number] & {
  targets: NonNullable<RuntimeRegistry["components"][number]["targets"]>;
};

function getRegistryComponentWithTargets(
  registry: RuntimeRegistry,
  componentName: string,
): RuntimeRegistryComponentWithTargets {
  const component = registry.components.find((item) => item.name === componentName);

  expect(component, `${componentName} registry component should exist`).toBeDefined();
  expect(
    component?.targets,
    `${componentName} registry component should include targets`,
  ).toBeDefined();

  return component as RuntimeRegistryComponentWithTargets;
}

async function writeRegistryVersionManifest(
  manifestPath: string,
  manifest: {
    components: Record<string, string>;
    registryVersion: string;
  },
) {
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        defaultComponentVersion: "0.1.0",
        ...manifest,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

async function writePrimitiveVersionManifest(
  manifestPath: string,
  manifest: {
    primitives: Record<string, string>;
  },
) {
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        defaultPrimitiveVersion: "0.1.0",
        ...manifest,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

function assertRegistryTriggerTargetId(options: {
  component: string;
  registry: RuntimeRegistry;
  targetAttribute: string;
  triggerFile: string;
}): void {
  const component = options.registry.components.find(
    (registryComponent) => registryComponent.name === options.component,
  );

  expect(component, options.component).toBeDefined();

  for (const framework of ["astro", "react"] as const) {
    const extension = getPrimitiveFrameworkAdapterTarget(framework).adapter.fileExtension;
    const file = component?.targets?.[framework]?.files.find(
      (registryFile) => registryFile.path === `${options.triggerFile}${extension}`,
    );

    expect(file, `${options.component} ${framework} trigger`).toBeDefined();
    expect(file?.content).toContain("targetId?: string");
    expect(file?.content).toContain(options.targetAttribute);
    expect(file?.content).not.toContain("data-dialog-for");
    expect(file?.content).not.toContain("dialogFor");
    expect(file?.content).not.toContain("for?: string");
  }
}
