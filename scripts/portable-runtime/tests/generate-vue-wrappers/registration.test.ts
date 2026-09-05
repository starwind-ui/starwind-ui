import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { solidFrameworkAdapterReadiness } from "../../renderers/framework-adapters/solid/adapter.js";
import { defineFrameworkAdapterTarget } from "../../renderers/framework-adapters/target-definition.js";
import {
  getPrimitiveFrameworkAdapterTarget,
  getPrimitiveFrameworkAdapterTargetNames,
  getPrimitiveFrameworkAdapterTargetsForComponent,
  resolvePrimitiveFrameworkAdapterTargetComponents,
} from "../../renderers/framework-adapters/target-registry.js";
import type { FrameworkAdapterTargetRegistration } from "../../renderers/framework-adapters/types.js";
import { vueFrameworkAdapterTarget } from "../../renderers/framework-adapters/vue/index.js";
import { vuePrimitiveComponents } from "../../renderers/framework-adapters/vue/inventory.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { expectedPrimitiveTargets, hasPrivateSvelte } from "../workspace-support.js";

describe("registered Vue Framework Adapter target", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("registers exactly the approved public-beta Primitive subset", () => {
    expect(getPrimitiveFrameworkAdapterTargetNames()).toEqual(expectedPrimitiveTargets);
    expect(resolvePrimitiveFrameworkAdapterTargetComponents("vue")).toEqual(vuePrimitiveComponents);
    expect(vueFrameworkAdapterTarget.primitive.support).toEqual({
      components: vuePrimitiveComponents,
      kind: "subset",
    });
    expect(vueFrameworkAdapterTarget.publicSupport).toEqual({
      cliRegistry: true,
      demoIntegration: true,
      packageExports: true,
      publicDocsClaim: true,
      status: "public-beta",
    });
    expect(vueFrameworkAdapterTarget.cliRegistry).toMatchObject({
      generatedImportCandidateExtensions: [".vue", ".ts", ".js"],
      packageMetadataSources: [
        "packages/vue/package.json",
        "packages/runtime/package.json",
        "apps/vue-demo/package.json",
      ],
      primitiveArtifact: {
        includeLocalImportGraph: true,
        outputDir: "vue-primitives",
        sourceRoot: "packages/vue/src",
      },
      styledArtifact: {
        collectPackageImportSources: expect.any(Function),
        outputDir: "vue",
        primitiveOutputDir: "vue-primitives",
      },
      setupPackageRequirements: [{ name: "vue", range: ">=3.5" }],
    });
  });

  it("rejects a partial public-beta capability promotion", () => {
    expect(() =>
      defineFrameworkAdapterTarget({
        ...vueFrameworkAdapterTarget,
        publicSupport: {
          ...vueFrameworkAdapterTarget.publicSupport,
          publicDocsClaim: false,
        },
      } as unknown as FrameworkAdapterTargetRegistration<"vue">),
    ).toThrow(/status "public-beta" requires .* to be true together.*publicDocsClaim/);
  });

  it("keeps stable and quarantined target support classifications unchanged", () => {
    const shipping = {
      cliRegistry: true,
      demoIntegration: true,
      packageExports: true,
      publicDocsClaim: true,
      status: "shipping",
    };
    const quarantined = {
      cliRegistry: false,
      demoIntegration: false,
      packageExports: false,
      publicDocsClaim: false,
      status: "non-shipping-tracer",
    };

    expect(getPrimitiveFrameworkAdapterTarget("astro").publicSupport).toEqual(shipping);
    expect(getPrimitiveFrameworkAdapterTarget("react").publicSupport).toEqual(shipping);
    if (hasPrivateSvelte)
      expect(getPrimitiveFrameworkAdapterTarget("svelte").publicSupport).toEqual(quarantined);
    expect(solidFrameworkAdapterReadiness.publicSupport).toEqual(quarantined);
  });

  it("collects Styled package imports from Vue projection and output-model facts", () => {
    const styled = vueFrameworkAdapterTarget.styled;
    const collectPackageImportSources =
      vueFrameworkAdapterTarget.cliRegistry.styledArtifact.collectPackageImportSources;
    if (!styled || !collectPackageImportSources) {
      throw new Error("The Vue target must provide Styled projection and package import metadata.");
    }

    const model = styled.project({
      contracts: starwindStyledContracts,
      outputRoot: "",
      primitiveImportBase: "@starwind-ui/vue",
      primitiveOutputRoot: "vue-primitives",
    });
    const sourcesByGroup = Object.fromEntries(
      model.componentGroups.map((group) => [
        group.component,
        collectPackageImportSources({ group, primitiveImportBase: "@starwind-ui/vue" }),
      ]),
    );
    const allSources = [...new Set(Object.values(sourcesByGroup).flat())].sort();

    expect(sourcesByGroup["theme-toggle"]).toEqual([
      "@starwind-ui/vue/theme",
      "tailwind-variants",
      "vue",
    ]);
    expect(sourcesByGroup["color-picker"]).toEqual(
      expect.arrayContaining([
        "@starwind-ui/runtime/color-picker",
        "@starwind-ui/vue/color-picker",
        "tailwind-variants",
        "vue",
      ]),
    );
    expect(allSources).toContain("@starwind-ui/runtime");
    expect(allSources).toContain("@starwind-ui/vue/button");
    expect(sourcesByGroup["navigation-menu"]).toContain("@starwind-ui/vue/navigation-menu");
    expect(allSources).not.toContain("@tabler/icons");
    expect(allSources.some((source) => source.startsWith("@tabler/icons/"))).toBe(false);
    expect(allSources.some((source) => source.startsWith("."))).toBe(false);
    expect(
      allSources.filter((source) =>
        ["@starwind-ui/astro", "@starwind-ui/react", "@starwind-ui/svelte"].some(
          (packageName) => source === packageName || source.startsWith(`${packageName}/`),
        ),
      ),
    ).toEqual([]);
    for (const sources of Object.values(sourcesByGroup)) {
      expect(new Set(sources).size).toBe(sources.length);
    }
  });

  it("registers only the manual Theme helper in addition to the component subset", async () => {
    expect(getPrimitiveFrameworkAdapterTargetsForComponent("theme")).toEqual([
      "astro",
      "react",
      "vue",
    ]);
    expect(Object.keys(vueFrameworkAdapterTarget.primitive.manualPrimitives ?? {})).toEqual([
      "theme",
    ]);
    expect(getPrimitiveFrameworkAdapterTargetsForComponent("dialog")).toEqual([
      "astro",
      "react",
      "vue",
      ...(hasPrivateSvelte ? ["svelte"] : []),
    ]);

    const dialog = primitiveGeneratorRegistry.find((entry) => entry.component === "dialog");
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-unsupported-"));
    temporaryRoots.push(outputRoot);

    await expect(
      dialog?.generateTarget({
        moduleHeader: "",
        outputRoot,
        target: "vue",
      }),
    ).resolves.toBeUndefined();
  });
});
