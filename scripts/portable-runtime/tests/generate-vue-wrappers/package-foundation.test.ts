import { readdir, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { createVueEntryPoints, vueEntryPoints } from "../../../../packages/vue/tsup.config.js";
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
  it("derives every executable Vue projection from one typed inventory", () => {
    expect(vueAdapterInventory.runtimePrimitives.map(({ component }) => component)).toEqual([
      "avatar",
      "button",
      "checkbox",
      "progress",
      "scroll-area",
      "select",
    ]);
    expect(vueAdapterInventory.manualFacades.map(({ component }) => component)).toEqual(["theme"]);
    expect(vuePrimitiveComponents).toEqual([
      "avatar",
      "button",
      "checkbox",
      "progress",
      "scroll-area",
      "select",
      "theme",
    ]);
    expect(vueStyledComponents).toEqual([
      "avatar",
      "button",
      "checkbox",
      "progress",
      "scroll-area",
      "select",
      "theme-toggle",
    ]);
    expect(vuePackageSubpaths.map(({ subpath }) => subpath)).toEqual([
      ".",
      "./avatar",
      "./button",
      "./checkbox",
      "./progress",
      "./scroll-area",
      "./select",
      "./theme",
    ]);
    expect(vuePackageExports).toEqual(
      Object.fromEntries(
        vuePackageSubpaths.map(({ exportTarget, subpath }) => [subpath, exportTarget]),
      ),
    );
    expect(vueGeneratedSourceFiles).toContain("select/SelectRoot.vue");
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

  it("does not expose Vue through current public support or release generation", async () => {
    expect(vueFrameworkAdapterTarget.publicSupport).toMatchObject({
      cliRegistry: false,
      demoIntegration: false,
      packageExports: false,
      publicDocsClaim: false,
    });

    const rootPackage = JSON.parse(await readFile("package.json", "utf8"));
    expect(rootPackage.scripts["runtime:generate:all"]).not.toContain("vue");
    expect(rootPackage.scripts["release:prepare"]).not.toContain("vue");
    expect(rootPackage.scripts["release:artifacts"]).not.toContain("vue");
  });
});
