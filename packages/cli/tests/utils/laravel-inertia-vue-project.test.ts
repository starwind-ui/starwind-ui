import fs from "fs-extra";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getLaravelInertiaVueProjectPlan,
  prepareLaravelHostCss,
  projectLaravelStarwindStylesheet,
  setupLaravelInertiaVueProject,
  validateLaravelInertiaVueProjectSetup,
} from "../../src/utils/laravel-inertia-vue-project.js";
import * as projectPath from "../../src/utils/project-path.js";
import { tailwindConfig } from "../../src/templates/starwind.css.js";

vi.mock("fs-extra");
vi.mock("../../src/utils/project-path.js");

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockResolvePath = vi.mocked(projectPath.resolveProjectMutationPath);

const composer = JSON.stringify({ require: { "laravel/framework": "^13.0" } });
const entry =
  "import { createInertiaApp } from '@inertiajs/vue3';\ncreateInertiaApp({ setup() {} });\n";
const tsconfig = `{
  // Laravel owns this source alias.
  "compilerOptions": { "paths": { "@/*": ["./resources/js/*"], }, },
}`;
const markerBlock = `/* starwind:start */
@import "./starwind.css";
/* starwind:end */`;
const hostCss = `@import 'tailwindcss';
@import 'tw-animate-css';

@source '../../vendor/laravel/framework/**/*.blade.php';
@custom-variant dark (&:is(.dark *));
@theme inline {
  --color-background: var(--background);
}
:root { --background: white; }
.dark { --background: black; }
`;

function viteConfig(appEntry = "resources/js/app.ts"): string {
  return `import inertia from '@inertiajs/vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [
    laravel({ input: ['resources/css/app.css', '${appEntry}'], refresh: true }),
    inertia(),
    tailwindcss(),
    vue({ template: {} }),
  ],
});
`;
}

const pkg = {
  dependencies: {
    "@inertiajs/vite": "^3.0.0",
    "@inertiajs/vue3": "^3.0.0",
    "laravel-vite-plugin": "^3.0.0",
    tailwindcss: "^4.1.0",
    vue: "^3.5.13",
  },
  devDependencies: {
    "@tailwindcss/vite": "^4.1.0",
    "@vitejs/plugin-vue": "^6.0.0",
  },
};

function evidence(
  appEntry: "resources/js/app.ts" | "resources/js/app.js" = "resources/js/app.ts",
  configPath: "vite.config.ts" | "vite.config.js" = "vite.config.ts",
): {
  existingPaths: Set<string>;
  projectFiles: Record<string, string>;
} {
  return {
    existingPaths: new Set([
      "artisan",
      "composer.json",
      configPath,
      appEntry,
      "resources/css/app.css",
      ...(appEntry.endsWith(".ts") ? ["tsconfig.json"] : []),
    ]),
    projectFiles: {
      "composer.json": composer,
      [configPath]: viteConfig(appEntry),
      [appEntry]: entry,
      "resources/css/app.css": hostCss,
      ...(appEntry.endsWith(".ts") ? { "tsconfig.json": tsconfig } : {}),
    },
  };
}

describe("Laravel Inertia Vue project setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolvePath.mockImplementation(async (filePath) => filePath);
    mockWriteFile.mockResolvedValue(undefined);
  });

  it.each([
    ["TypeScript", "resources/js/app.ts", "vite.config.ts"],
    ["JavaScript", "resources/js/app.js", "vite.config.js"],
  ] as const)("plans the supported %s entry shape", (_label, appEntry, configPath) => {
    expect(getLaravelInertiaVueProjectPlan(pkg, evidence(appEntry, configPath))).toEqual({
      componentDir: "resources/js/components/starwind",
      cssFile: "resources/css/starwind.css",
      entry: appEntry,
      hostCss: "resources/css/app.css",
      kind: "laravel",
      utilsDir: "resources/js/lib/utils",
      viteConfig: configPath,
      vueUpgradeRequired: false,
    });
  });

  it("projects the standard stylesheet without duplicate host declarations", () => {
    const fragment = projectLaravelStarwindStylesheet(tailwindConfig);

    expect(fragment).not.toContain('@import "tailwindcss"');
    expect(fragment).not.toContain('@import "tw-animate-css"');
    expect(fragment).not.toContain("@custom-variant dark");
    expect(fragment).toContain('@plugin "@tailwindcss/forms"');
    expect(fragment).toContain("--animate-accordion-down");
    expect(fragment).toContain("@keyframes accordion-down");
    expect(fragment).toContain("--color-background");
    expect(fragment).toContain(":root");
  });

  it("adds one marker import after the host import prelude idempotently", () => {
    const updated = prepareLaravelHostCss(hostCss)!;

    expect(updated.indexOf("tw-animate-css")).toBeLessThan(updated.indexOf("starwind:start"));
    expect(updated.indexOf("starwind:end")).toBeLessThan(updated.indexOf("@source"));
    expect(updated).toContain('@import "./starwind.css";');
    expect(prepareLaravelHostCss(updated)).toBe(updated);
  });

  it.each([
    hostCss.replace("@custom-variant", `${markerBlock}\n@custom-variant`),
    hostCss.replace(":root", `${markerBlock}\n:root`),
    hostCss.replace(".dark {", `${markerBlock}\n.dark {`),
    `${hostCss}${markerBlock}\n`,
    `${hostCss}body { color: red; }\n${markerBlock}\n`,
  ])("rejects an exact marker block outside the canonical import-prelude offset", (source) => {
    expect(prepareLaravelHostCss(source)).toBeUndefined();
  });

  it.each([
    hostCss.replace("@theme inline", "@layer utilities"),
    hostCss.replace("\n\n@source", '\n@import "./starwind.css";\n\n@source'),
    `${hostCss}\n/* starwind:start */\n`,
    `${hostCss}\n/* starwind:end */\n`,
    `${hostCss}\n/* starwind:start */\n@import './other.css';\n/* starwind:end */\n`,
  ])("rejects an unrecognized or conflicting host stylesheet", (source) => {
    expect(prepareLaravelHostCss(source)).toBeUndefined();
  });

  it.each([
    [
      "missing artisan",
      {
        ...evidence(),
        existingPaths: new Set([
          "composer.json",
          "vite.config.ts",
          "resources/js/app.ts",
          "resources/css/app.css",
        ]),
      },
    ],
    [
      "non-Laravel composer",
      { ...evidence(), projectFiles: { ...evidence().projectFiles, "composer.json": "{}" } },
    ],
    [
      "missing Inertia call",
      {
        ...evidence(),
        projectFiles: {
          ...evidence().projectFiles,
          "resources/js/app.ts": "import { createInertiaApp } from '@inertiajs/vue3';",
        },
      },
    ],
    [
      "wrong Vite input",
      {
        ...evidence(),
        projectFiles: {
          ...evidence().projectFiles,
          "vite.config.ts": viteConfig("resources/js/other.ts"),
        },
      },
    ],
    [
      "missing Tailwind call",
      {
        ...evidence(),
        projectFiles: {
          ...evidence().projectFiles,
          "vite.config.ts": viteConfig().replace("tailwindcss(),", ""),
        },
      },
    ],
    [
      "dynamic extra Vite input",
      {
        ...evidence(),
        projectFiles: {
          ...evidence().projectFiles,
          "vite.config.ts": viteConfig().replace("], refresh", ", dynamicEntry], refresh"),
        },
      },
    ],
    [
      "custom TypeScript alias",
      {
        ...evidence(),
        projectFiles: {
          ...evidence().projectFiles,
          "tsconfig.json": tsconfig.replace("./resources/js/*", "./frontend/*"),
        },
      },
    ],
  ])("rejects %s evidence with manual action", (_case, projectEvidence) => {
    expect(() => getLaravelInertiaVueProjectPlan(pkg, projectEvidence)).toThrow(/manual action/i);
  });

  it.each([
    [
      "later static plugins",
      (source: string) => source.replace("\n});", "\n  plugins: [vue()],\n});"),
    ],
    [
      "later dynamic plugins",
      (source: string) => source.replace("\n});", "\n  plugins: getPlugins(),\n});"),
    ],
    [
      "later static Laravel input",
      (source: string) =>
        source.replace("refresh: true", "refresh: true, input: ['resources/js/other.js']"),
    ],
    [
      "later dynamic Laravel input",
      (source: string) => source.replace("refresh: true", "refresh: true, input: getInputs()"),
    ],
  ])("rejects %s in JavaScript Vite evidence", (_case, transform) => {
    const projectEvidence = evidence("resources/js/app.js", "vite.config.js");
    projectEvidence.projectFiles["vite.config.js"] = transform(
      projectEvidence.projectFiles["vite.config.js"],
    );
    expect(() => getLaravelInertiaVueProjectPlan(pkg, projectEvidence)).toThrow(/manual action/i);
  });

  it.each([
    `import { createInertiaApp } from '@inertiajs/vue3';\n"createInertiaApp()";`,
    String.raw`import { createInertiaApp } from '@inertiajs/vue3';\n\u0063reateInertiaApp({});`,
    `import { createInertiaApp } from '@inertiajs/vue3';\n// createInertiaApp({});`,
    "import { createInertiaApp } from '@inertiajs/vue3';\n`createInertiaApp({})`;",
    `import { createInertiaApp } from '@inertiajs/vue3';\nfoo.createInertiaApp({});`,
    `import { createInertiaApp } from '@inertiajs/vue3';\nfoo?.createInertiaApp({});`,
    `import { createInertiaApp } from '@inertiajs/vue3';\nfunction createInertiaApp() {}`,
  ])("rejects an Inertia token decoy without a direct imported-binding call", (entrySource) => {
    const projectEvidence = evidence();
    projectEvidence.projectFiles["resources/js/app.ts"] = entrySource;
    expect(() => getLaravelInertiaVueProjectPlan(pkg, projectEvidence)).toThrow(/manual action/i);
  });

  it("ignores quoted, escaped, commented, and template decoys before a direct Inertia call", () => {
    const projectEvidence = evidence();
    projectEvidence.projectFiles["resources/js/app.ts"] =
      String.raw`
import { createInertiaApp } from '@inertiajs/vue3';
const quoted = "createInertiaApp()";
const escaped = "\x63reateInertiaApp()";
// createInertiaApp({});
const template = ` +
      "`createInertiaApp({})`" +
      `;
createInertiaApp({});
`;
    expect(getLaravelInertiaVueProjectPlan(pkg, projectEvidence)?.kind).toBe("laravel");
  });
  it("requires all direct frontend dependencies", () => {
    const partial = { ...pkg, dependencies: { ...pkg.dependencies } };
    delete (partial.dependencies as Record<string, string>)["@inertiajs/vue3"];
    expect(() => getLaravelInertiaVueProjectPlan(partial, evidence())).toThrow(/manual action/i);
  });

  it("marks an older Vue declaration for registry-derived correction", () => {
    const oldVue = { ...pkg, dependencies: { ...pkg.dependencies, vue: "^3.4.0" } };
    expect(getLaravelInertiaVueProjectPlan(oldVue, evidence())).toMatchObject({
      vueUpgradeRequired: true,
    });
  });

  it("preflights without writes and changes only the host stylesheet once", async () => {
    const plan = getLaravelInertiaVueProjectPlan(pkg, evidence())!;
    const files: Record<string, string> = {
      "composer.json": composer,
      [plan.entry]: entry,
      [plan.viteConfig]: viteConfig(),
      [plan.hostCss]: hostCss,
      "tsconfig.json": tsconfig,
    };
    mockReadFile.mockImplementation(async (filePath) => files[String(filePath)] as never);

    await validateLaravelInertiaVueProjectSetup(plan);
    expect(mockWriteFile).not.toHaveBeenCalled();

    await setupLaravelInertiaVueProject(plan, plan.cssFile);
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockWriteFile).toHaveBeenCalledWith(
      "resources/css/app.css",
      expect.stringContaining("/* starwind:start */"),
      "utf8",
    );

    files[plan.hostCss] = mockWriteFile.mock.calls[0]![1] as string;
    mockWriteFile.mockClear();
    await setupLaravelInertiaVueProject(plan, plan.cssFile);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("rejects a custom fragment destination before writing", async () => {
    const plan = getLaravelInertiaVueProjectPlan(pkg, evidence())!;
    await expect(setupLaravelInertiaVueProject(plan, "resources/css/custom.css")).rejects.toThrow(
      /plan-owned stylesheet path/i,
    );
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
