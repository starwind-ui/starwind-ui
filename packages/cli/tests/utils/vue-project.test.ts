import fs from "fs-extra";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as projectPath from "../../src/utils/project-path.js";
import {
  starwindStylesheetPackageRequirements,
  tailwindConfig,
} from "../../src/templates/starwind.css.js";
import {
  createVuePackageRequirementPlanner,
  getVuePackageRequirements,
  getVueProjectPlan,
  isCompatiblePublishedRange,
  meetsVueVersionFloor,
  setupVueProject,
  validateVueProjectSetup,
} from "../../src/utils/vue-project.js";

vi.mock("fs-extra");
vi.mock("../../src/utils/project-path.js");

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockResolvePath = vi.mocked(projectPath.resolveProjectMutationPath);

describe("Vite Vue project setup", () => {
  const plan = getVueProjectPlan(
    {
      dependencies: { vue: "^3.5.0" },
      devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.2.0" },
    },
    new Set(["vite.config.ts", "src/main.ts", "src/App.vue"]),
  );
  const config = `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({ plugins: [vue()] });
`;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResolvePath.mockImplementation(async (filePath) => filePath);
    mockReadFile.mockImplementation(async (filePath) =>
      String(filePath).includes("vite.config")
        ? (config as never)
        : ('import { createApp } from "vue";\n' as never),
    );
    mockWriteFile.mockResolvedValue(undefined);
  });

  it("plans official create-vue paths and target-owned directories", () => {
    expect(plan).toEqual({
      componentDir: "src/components/starwind",
      cssEntry: "src/main.ts",
      cssFile: "src/styles/starwind.css",
      kind: "vite",
      sourceRoot: "src",
      utilsDir: "src/lib/utils",
      viteConfig: "vite.config.ts",
      vueUpgradeRequired: false,
    });
  });

  it.each([
    ["^3.5.0", true],
    [">=3.5", true],
    ["3.5.0", true],
    ["^3.4.0", false],
    ["3.4.38", false],
    ["^2.7.16", false],
    ["workspace:*", false],
  ])("classifies Vue range %s against the 3.5 floor", (range, expected) => {
    expect(meetsVueVersionFloor(range)).toBe(expected);
  });

  it.each(["^3.4.0", "^2.7.16"])(
    "marks an official Vite project using Vue %s for corrective installation",
    (range) => {
      expect(
        getVueProjectPlan(
          {
            dependencies: { vue: range },
            devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.2.0" },
          },
          new Set(["vite.config.ts", "src/main.ts", "src/App.vue"]),
        ).vueUpgradeRequired,
      ).toBe(true);
    },
  );

  it("rejects incomplete Vue layouts", () => {
    expect(() =>
      getVueProjectPlan(
        {
          dependencies: { vue: "^3.5.0" },
          devDependencies: { "@vitejs/plugin-vue": "^6.0.0" },
        },
        new Set(["vite.config.ts", "src/main.ts"]),
      ),
    ).toThrow(/src\/App\.vue/);
  });

  it("preflights before writing and configures Vite and the CSS entry", async () => {
    await expect(validateVueProjectSetup(plan)).resolves.toBeUndefined();
    expect(mockWriteFile).not.toHaveBeenCalled();

    await setupVueProject(plan, plan.cssFile);
    expect(mockWriteFile).toHaveBeenCalledWith(
      "vite.config.ts",
      expect.stringContaining("tailwindcss()"),
      "utf8",
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      "src/main.ts",
      expect.stringContaining('import "./styles/starwind.css";'),
      "utf8",
    );
  });

  it("keeps registry requirements and adds the stylesheet package closure once", () => {
    const requirements = getVuePackageRequirements(["vue@>=3.5", "tailwindcss@^4.1"]);
    expect(requirements).toEqual([
      "vue@>=3.5",
      "tailwindcss@^4.1",
      "@tailwindcss/vite@^4",
      "tw-animate-css@^1",
      "@tailwindcss/forms@^0.5",
    ]);
    expect(getVuePackageRequirements(requirements)).toEqual(requirements);
  });

  it("binds every external stylesheet directive to a package requirement", () => {
    const externalPackages = [
      ...tailwindConfig.matchAll(/@(import|plugin)\s+["']([^"']+)["']/g),
    ].map((match) => match[2]);
    const requiredPackages = starwindStylesheetPackageRequirements.map((requirement) =>
      requirement.slice(0, requirement.lastIndexOf("@")),
    );

    expect(externalPackages).toEqual(["tailwindcss", "tw-animate-css", "@tailwindcss/forms"]);
    expect(requiredPackages).toEqual(expect.arrayContaining([...new Set(externalPackages)]));
  });

  it("excludes satisfied direct declarations from the mutating installer plan", () => {
    const requirements = getVuePackageRequirements(["vue@>=3.5", "tailwindcss@^4"], {
      dependencies: { vue: "3.5.39" },
      devDependencies: { tailwindcss: "^4.1" },
      optionalDependencies: { "@tailwindcss/vite": "~4.1.0" },
      peerDependencies: { "@tailwindcss/forms": "^0.5.1", "tw-animate-css": "^1.2.0" },
    });

    expect(requirements).toEqual([]);
  });

  it("requires every duplicate direct declaration to be compatible", () => {
    expect(
      getVuePackageRequirements(["vue@>=3.5"], {
        dependencies: { vue: "3.5.39" },
        peerDependencies: { vue: "^3.5.0" },
      }),
    ).not.toContain("vue@>=3.5");
    expect(
      getVuePackageRequirements(["vue@>=3.5"], {
        dependencies: { vue: "3.5.39" },
        devDependencies: { vue: "workspace:*" },
      }),
    ).toContain("vue@>=3.5");
  });

  it("accepts outer whitespace and captures an immutable declaration view", () => {
    const projectPackage = { dependencies: { vue: "  3.5.39  " } };
    const requirements = createVuePackageRequirementPlanner(projectPackage);
    projectPackage.dependencies.vue = "workspace:*";

    expect(requirements(["vue@>=3.5"])).not.toContain("vue@>=3.5");
  });

  it.each([
    ["3.5.39", ">=3.5", true],
    ["^4.1", "^4", true],
    ["^3.4", ">=3.5", false],
    ["^5", "^4", false],
    ["workspace:*", ">=3.5", false],
    ["file:../vue", ">=3.5", false],
    ["link:../vue", ">=3.5", false],
    ["portal:../vue", ">=3.5", false],
    ["latest", ">=3.5", false],
    ["npm:vue@3.5.39", ">=3.5", false],
    ["github:vuejs/core", ">=3.5", false],
    ["https://example.com/vue.tgz", ">=3.5", false],
    ["not a range", ">=3.5", false],
  ])("classifies declared range %s within %s", (declared, required, expected) => {
    expect(isCompatiblePublishedRange(declared, required)).toBe(expected);
  });

  it("rejects a future Vue major outside the private Vue 3 host contract", () => {
    expect(isCompatiblePublishedRange("^4", ">=3.5", "vue")).toBe(false);
  });

  it("keeps canonical specs for missing and incompatible declarations", () => {
    const requirements = getVuePackageRequirements(["vue@>=3.5", "tailwindcss@^4"], {
      dependencies: { vue: "^3.4.0" },
      devDependencies: { tailwindcss: "workspace:*", "tw-animate-css": "^2" },
    });

    expect(requirements).toEqual([
      "vue@>=3.5",
      "tailwindcss@^4",
      "@tailwindcss/vite@^4",
      "tw-animate-css@^1",
      "@tailwindcss/forms@^0.5",
    ]);
  });
});
