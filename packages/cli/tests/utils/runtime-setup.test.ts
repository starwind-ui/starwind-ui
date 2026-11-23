import { readFileSync } from "node:fs";

import semver from "semver";
import { describe, expect, it } from "vitest";

import type { StarwindRegistry, StarwindRegistryFor } from "../../src/utils/registry.js";
import { getRuntimeSetupPlan } from "../../src/utils/runtime-setup.js";

const registry: StarwindRegistry = {
  version: "2.1.0",
  setup: {
    astro: {
      adapterPackage: { name: "@starwind-ui/astro", range: "^0.1.0-beta.3" },
      packageRequirements: [{ name: "@tabler/icons", range: "^3" }],
    },
    react: {
      adapterPackage: { name: "@starwind-ui/react", range: "^0.1.0-beta.3" },
      packageRequirements: [{ name: "@tabler/icons-react", range: "^3" }],
    },
  },
  components: [],
};

describe("Runtime setup plan", () => {
  it("returns install-ready packages for each framework", () => {
    expect(getRuntimeSetupPlan("astro", registry)).toEqual({
      adapterPackage: "@starwind-ui/astro@0.1.0-beta.3",
      packageRequirements: ["@tabler/icons@^3"],
    });
    expect(getRuntimeSetupPlan("react", registry)).toEqual({
      adapterPackage: "@starwind-ui/react@0.1.0-beta.3",
      packageRequirements: ["@tabler/icons-react@^3"],
    });
  });

  it("rejects registries without setup metadata for the selected framework", () => {
    expect(() => getRuntimeSetupPlan("react", { ...registry, setup: undefined })).toThrow(
      'Bundled registry 2.1.0 is missing setup metadata for framework "react".',
    );
  });

  it("returns Svelte beta setup through the production policy", () => {
    const svelteRegistry: StarwindRegistryFor<"astro" | "react" | "vue" | "svelte"> = {
      version: "2.1.0",
      setup: {
        svelte: {
          adapterPackage: { name: "@starwind-ui/svelte", range: "0.0.0" },
          packageRequirements: [{ name: "svelte", range: ">=5.29.0 <6" }],
        },
      },
      components: [],
    };

    expect(getRuntimeSetupPlan("svelte", svelteRegistry)).toEqual({
      adapterPackage: "@starwind-ui/svelte@0.0.0",
      packageRequirements: ["svelte@>=5.29.0 <6"],
    });
  });
  it("returns exact Vue beta setup through the production policy", () => {
    const vueRegistry: StarwindRegistryFor<"astro" | "react" | "vue"> = {
      version: "2.1.0",
      setup: {
        vue: {
          adapterPackage: { name: "@starwind-ui/vue", range: "0.1.0" },
          packageRequirements: [
            { name: "vue", range: ">=3.5" },
            { name: "@tabler/icons-vue", range: "^3" },
          ],
        },
      },
      components: [],
    };

    expect(getRuntimeSetupPlan("vue", vueRegistry)).toEqual({
      adapterPackage: "@starwind-ui/vue@0.1.0",
      packageRequirements: ["vue@>=3.5", "@tabler/icons-vue@^3"],
    });
  });

  it("installs a tailwind-merge that lets px-* override logical ps-* and pe-* classes", () => {
    // tailwind-merge 3.7.0 is the first release that treats px-*, mx-*, and inset-x-* as
    // conflicting with the logical ps-*, pe-*, ms-*, me-*, start-*, and end-* classes.
    const bundledRegistry = JSON.parse(
      readFileSync(new URL("../../src/registry/bundled-registry.json", import.meta.url), "utf8"),
    ) as StarwindRegistry;

    for (const framework of ["astro", "react", "vue", "svelte"] as const) {
      const requirement = getRuntimeSetupPlan(framework, bundledRegistry).packageRequirements.find(
        (spec) => spec.startsWith("tailwind-merge@"),
      );
      const range = requirement?.slice("tailwind-merge@".length);

      expect(range, framework).toBeDefined();
      expect(semver.gte(semver.minVersion(range!)!, "3.7.0"), framework).toBe(true);
    }

    // add and update install only component package requirements. Styled components with
    // logical classes declare the tailwind-merge floor, so they raise it in existing projects.
    // Other components keep their earlier requirements.
    const mergeRange = (componentName: string, framework: string) =>
      bundledRegistry.components
        .find(({ name }) => name === componentName)
        ?.targets?.[
          framework as "astro"
        ]?.packageRequirements.find(({ name }) => name === "tailwind-merge")?.range;
    for (const framework of ["astro", "react", "vue", "svelte"]) {
      for (const component of ["input", "select", "sidebar", "context-menu"]) {
        expect(mergeRange(component, framework), `${component}/${framework}`).toBe("^3.7.0");
      }
      for (const component of ["badge", "button", "theme-toggle"]) {
        expect(mergeRange(component, framework), `${component}/${framework}`).toBeUndefined();
      }
    }
    for (const component of bundledRegistry.components) {
      for (const [framework, target] of Object.entries(component.targets ?? {})) {
        const merge = target.packageRequirements.find(({ name }) => name === "tailwind-merge");
        if (merge) expect(merge.range, `${component.name}/${framework}`).toBe("^3.7.0");
      }
    }
  });
});
