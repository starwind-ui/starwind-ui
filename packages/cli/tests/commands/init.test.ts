import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATHS } from "../../src/utils/constants.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  group: vi.fn(),
  select: vi.fn(),
  text: vi.fn(),
  tasks: vi.fn(),
  note: vi.fn(),
  log: {
    error: vi.fn(),
    warn: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
    step: vi.fn(),
  },
}));

vi.mock("../../src/utils/astro-config.js");
vi.mock("../../src/utils/astro-react-integration.js");
vi.mock("../../src/utils/config.js");
vi.mock("../../src/utils/env.js");
vi.mock("../../src/utils/fs.js");
vi.mock("../../src/utils/host-planner.js");
vi.mock("../../src/utils/layout.js");
vi.mock("../../src/utils/package-manager.js");
vi.mock("../../src/utils/react-project.js");
vi.mock("../../src/utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../src/utils/snippets.js");
vi.mock("../../src/utils/tsconfig.js");
vi.mock("../../src/utils/vite-config.js");
vi.mock("../../src/commands/migrate.js", () => ({
  migrate: vi.fn(),
}));

import type { Task } from "@clack/prompts";
import * as clackPrompts from "@clack/prompts";

import * as astroConfig from "../../src/utils/astro-config.js";
import * as astroReactIntegration from "../../src/utils/astro-react-integration.js";
import * as config from "../../src/utils/config.js";
import { CONFIG_SCHEMA_V2_URL } from "../../src/utils/config.js";
import * as env from "../../src/utils/env.js";
import * as fsUtils from "../../src/utils/fs.js";
import * as hostPlanner from "../../src/utils/host-planner.js";
import * as layout from "../../src/utils/layout.js";
import * as packageManager from "../../src/utils/package-manager.js";
import * as reactProject from "../../src/utils/react-project.js";
import * as snippets from "../../src/utils/snippets.js";
import * as sleepUtils from "../../src/utils/sleep.js";
import * as tsconfig from "../../src/utils/tsconfig.js";
import * as viteConfig from "../../src/utils/vite-config.js";
import { init } from "../../src/commands/init.js";
import { migrate } from "../../src/commands/migrate.js";

const runtimePackage = JSON.parse(
  readFileSync(new URL("../../../runtime/package.json", import.meta.url), "utf8"),
) as { version: string };
const registryVersionManifest = JSON.parse(
  readFileSync(new URL("../../registry/styled-component-versions.json", import.meta.url), "utf8"),
) as { registryVersion: string };
const CURRENT_ASTRO_SPEC = `@starwind-ui/astro@${runtimePackage.version}`;
const CURRENT_REACT_SPEC = `@starwind-ui/react@${runtimePackage.version}`;
const ASTRO_SETUP_REQUIREMENTS = [
  "@tabler/icons@^3",
  "@tailwindcss/forms@^0.5",
  "@tailwindcss/vite@^4",
  "tailwind-merge@^3",
  "tailwind-variants@^3",
  "tailwindcss@^4",
  "tw-animate-css@^1",
];
const REACT_SETUP_REQUIREMENTS = [
  "@tabler/icons-react@^3",
  "@tailwindcss/forms@^0.5",
  "@tailwindcss/vite@^4",
  "tailwind-merge@^3",
  "tailwind-variants@^3",
  "tailwindcss@^4",
  "tw-animate-css@^1",
];

const mockTasks = vi.mocked(clackPrompts.tasks);
const mockGroup = vi.mocked(clackPrompts.group);
const mockSelect = vi.mocked(clackPrompts.select);
const mockText = vi.mocked(clackPrompts.text);
const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockFileExists = vi.mocked(fsUtils.fileExists);
const mockReadJsonFile = vi.mocked(fsUtils.readJsonFile);
const mockEnsureDirectory = vi.mocked(fsUtils.ensureDirectory);
const mockWriteCssFile = vi.mocked(fsUtils.writeCssFile);
const mockDetectHostPlan = vi.mocked(hostPlanner.detectHostPlan);
const mockFormatDetectedHost = vi.mocked(hostPlanner.formatDetectedHost);
const mockValidateHostTarget = vi.mocked(hostPlanner.validateHostTarget);
const mockSetupSnippets = vi.mocked(snippets.setupSnippets);
const mockSetupAstroConfig = vi.mocked(astroConfig.setupAstroConfig);
const mockEnsureAstroReactIntegration = vi.mocked(
  astroReactIntegration.ensureAstroReactIntegration,
);
const mockSetupTsConfig = vi.mocked(tsconfig.setupTsConfig);
const mockSetupLayoutCssImport = vi.mocked(layout.setupLayoutCssImport);
const mockSetupReactViteConfig = vi.mocked(viteConfig.setupReactViteConfig);
const mockSetupReactCssImport = vi.mocked(viteConfig.setupReactCssImport);
const mockGetConfigState = vi.mocked(config.getConfigState);
const mockUpdateConfig = vi.mocked(config.updateConfig);
const mockInstallDependencies = vi.mocked(packageManager.installDependencies);
const mockDetectReactProjectPlan = vi.mocked(reactProject.detectReactProjectPlan);
const mockGetReactPackageRequirements = vi.mocked(reactProject.getReactPackageRequirements);
const mockSetupReactProject = vi.mocked(reactProject.setupReactProject);
const mockValidateReactProjectSetup = vi.mocked(reactProject.validateReactProjectSetup);
const mockHasStarwindProAuthConfig = vi.mocked(config.hasStarwindProAuthConfig);
const mockSetupStarwindProConfig = vi.mocked(config.setupStarwindProConfig);
const mockSetupStarwindProEnv = vi.mocked(env.setupStarwindProEnv);
const mockCheckStarwindProEnv = vi.mocked(env.checkStarwindProEnv);
const mockMigrate = vi.mocked(migrate);

async function runTasksSequentially(tasks: Task[]) {
  for (const task of tasks) {
    await task.task(() => {});
  }
}

function createCurrentConfig(framework: "astro" | "react" = "astro") {
  return {
    $schema: CONFIG_SCHEMA_V2_URL,
    version: 2 as const,
    framework,
    registry: {
      source: "bundled" as const,
      version: "0.1.0",
    },
    tailwind: {
      css: PATHS.LOCAL_CSS_FILE,
      baseColor: "neutral" as const,
      cssVariables: true,
    },
    componentDir: PATHS.LOCAL_STARWIND_COMPONENTS_DIR,
    utilsDir: PATHS.LOCAL_UTILS_DIR,
    components: [],
  };
}

function mockDefaultProject() {
  mockTasks.mockImplementation(runTasksSequentially);
  mockFileExists.mockImplementation(async (filePath) => filePath === "package.json");
  mockReadJsonFile.mockResolvedValue({
    dependencies: {
      astro: "^5.11.0",
    },
  });

  mockEnsureDirectory.mockResolvedValue(undefined);
  mockWriteCssFile.mockResolvedValue(undefined);
  mockSetupSnippets.mockResolvedValue(true);
  mockSetupAstroConfig.mockResolvedValue(true);
  mockEnsureAstroReactIntegration.mockResolvedValue({ status: "ready" });
  mockSetupTsConfig.mockResolvedValue(true);
  mockSetupLayoutCssImport.mockResolvedValue(true);
  mockSetupReactViteConfig.mockResolvedValue(true);
  mockSetupReactCssImport.mockResolvedValue(true);
  mockSetupStarwindProEnv.mockResolvedValue(true);
  mockCheckStarwindProEnv.mockResolvedValue(false);
  mockHasStarwindProAuthConfig.mockReturnValue(false);
  mockSetupStarwindProConfig.mockResolvedValue(undefined);
  mockGetConfigState.mockResolvedValue({
    status: "missing",
    config: createCurrentConfig(),
  });
  mockUpdateConfig.mockResolvedValue(undefined);
  mockInstallDependencies.mockResolvedValue(undefined);
  mockDetectReactProjectPlan.mockResolvedValue({
    componentDir: "src/components/starwind",
    cssEntry: "src/main.tsx",
    cssFile: "src/styles/starwind.css",
    kind: "vite",
    sourceRoot: "src",
    utilsDir: "src/lib/utils",
    viteConfig: "vite.config.ts",
  });
  mockDetectHostPlan.mockImplementation(async (pkg) => {
    const dependencies = {
      ...pkg.devDependencies,
      ...pkg.dependencies,
    };
    if (dependencies.astro) {
      return {
        host: { kind: "astro", label: "Astro" },
        targets: [
          { framework: "astro", readiness: "ready" },
          { framework: "react", readiness: "configurable" },
        ],
      };
    }
    if (dependencies.react || dependencies["react-dom"]) {
      const reactProject = await mockDetectReactProjectPlan(pkg);
      return {
        host: {
          kind: reactProject.kind,
          label: reactProject.kind === "vite" ? "Vite" : reactProject.kind,
        },
        reactProject,
        targets: [{ framework: "react", readiness: "ready" }],
      };
    }
    return {
      diagnostic:
        "No supported Starwind target was detected. Use --astro for an Astro project, or run Starwind in a supported React host.",
      host: { kind: "unknown", label: "Unknown" },
      targets: [{ framework: "astro", readiness: "configurable" }],
    };
  });
  mockFormatDetectedHost.mockImplementation(
    (plan, framework) =>
      `Detected ${framework === "astro" ? "Astro" : "React"}${plan.host.kind === framework ? "" : ` (${plan.host.label})`}`,
  );
  mockValidateHostTarget.mockImplementation((plan, framework) => {
    if (plan.targets.some((target) => target.framework === framework)) return framework;
    throw new Error(`${framework} is not available for ${plan.host.label}`);
  });
  mockGetReactPackageRequirements.mockImplementation((requirements) => requirements);
  mockSetupReactProject.mockResolvedValue(undefined);
  mockValidateReactProjectSetup.mockResolvedValue(undefined);
  mockMigrate.mockResolvedValue(undefined);
}

describe("init command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDefaultProject();
  });

  it("writes v2 runtime config and package plan for a React framework flag", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
      devDependencies: { vite: "^8.2.0" },
    });

    await init(true, { defaults: true, framework: "react", packageManager: "pnpm" });

    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        $schema: CONFIG_SCHEMA_V2_URL,
        version: 2,
        framework: "react",
        registry: {
          source: "bundled",
          version: registryVersionManifest.registryVersion,
        },
        componentDir: `${PATHS.LOCAL_COMPONENTS_DIR}/starwind`,
        utilsDir: PATHS.LOCAL_UTILS_DIR,
      }),
      { appendComponents: false },
    );
    expect(mockSetupAstroConfig).not.toHaveBeenCalled();
    expect(mockSetupLayoutCssImport).not.toHaveBeenCalled();
    expect(mockSetupReactViteConfig).not.toHaveBeenCalled();
    expect(mockSetupReactCssImport).not.toHaveBeenCalled();
    expect(mockSetupReactProject).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "vite" }),
      PATHS.LOCAL_CSS_FILE,
    );
    expect(mockSetupTsConfig).toHaveBeenCalledWith("react", "src", false);
    expect(mockInstallDependencies.mock.calls).toEqual([
      [[CURRENT_REACT_SPEC], "pnpm"],
      [REACT_SETUP_REQUIREMENTS, "pnpm", false, false],
    ]);
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).not.toContain('"@tabler/icons@^3"');
  });

  it("requests JavaScript and generated TSX support for a Vite React JavaScript host", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
      devDependencies: { vite: "^8.2.0" },
    });
    mockDetectReactProjectPlan.mockResolvedValue({
      componentDir: "src/components/starwind",
      cssEntry: "src/main.jsx",
      cssFile: "src/styles/starwind.css",
      kind: "vite",
      sourceRoot: "src",
      utilsDir: "src/lib/utils",
      viteConfig: "vite.config.js",
    });

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockSetupTsConfig).toHaveBeenCalledWith("react", "src", true);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.not.objectContaining({ language: expect.anything(), tsx: expect.anything() }),
      { appendComponents: false },
    );
  });

  it("detects a React project when defaults are used without a framework flag", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        react: "^19.2.0",
        "react-dom": "^19.2.0",
      },
    });

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockUpdateConfig).toHaveBeenCalledWith(expect.objectContaining({ framework: "react" }), {
      appendComponents: false,
    });
    expect(mockInstallDependencies.mock.calls).toEqual([
      [[CURRENT_REACT_SPEC], "pnpm"],
      [REACT_SETUP_REQUIREMENTS, "pnpm", false, false],
    ]);
    expect(mockSelect).not.toHaveBeenCalled();
    expect(clackPrompts.log.info).toHaveBeenCalledWith("Detected React (Vite)");
  });

  it("uses detected Next App paths and validates setup before installing packages", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        next: "^16.3.0",
        react: "^19.2.0",
        "react-dom": "^19.2.0",
      },
    });
    const nextPlan = {
      componentDir: "src/components/starwind",
      cssEntry: "src/app/globals.css",
      cssFile: "src/styles/starwind.css",
      kind: "next-app" as const,
      rootEntry: "src/app/layout.tsx",
      sourceRoot: "src" as const,
      utilsDir: "src/lib/utils",
    };
    mockDetectReactProjectPlan.mockResolvedValue(nextPlan);
    mockGetReactPackageRequirements.mockReturnValue([
      "@tabler/icons-react@^3",
      "@tailwindcss/forms@^0.5",
      "tailwind-merge@^3",
      "tailwind-variants@^3",
      "tailwindcss@^4",
      "tw-animate-css@^1",
      "@tailwindcss/postcss@^4",
    ]);

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockValidateReactProjectSetup).toHaveBeenCalledWith(nextPlan);
    expect(mockValidateReactProjectSetup.mock.invocationCallOrder[0]).toBeLessThan(
      mockInstallDependencies.mock.invocationCallOrder[0]!,
    );
    expect(mockSetupReactProject).toHaveBeenCalledWith(nextPlan, nextPlan.cssFile);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        componentDir: nextPlan.componentDir,
        utilsDir: nextPlan.utilsDir,
        tailwind: expect.objectContaining({ css: nextPlan.cssFile }),
      }),
      { appendComponents: false },
    );
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).not.toContain("@tailwindcss/vite");
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).toContain("@tailwindcss/postcss");
  });

  it("uses detected Next Pages paths and the PostCSS package plan", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        next: "^16.3.0",
        react: "^19.2.0",
        "react-dom": "^19.2.0",
      },
    });
    const nextPagesPlan = {
      componentDir: "components/starwind",
      cssEntry: "styles/globals.css",
      cssFile: "styles/starwind.css",
      kind: "next-pages" as const,
      rootEntry: "pages/_document.tsx",
      sourceRoot: "." as const,
      utilsDir: "lib/utils",
    };
    mockDetectReactProjectPlan.mockResolvedValue(nextPagesPlan);
    mockGetReactPackageRequirements.mockReturnValue([
      "@tabler/icons-react@^3",
      "@tailwindcss/forms@^0.5",
      "tailwind-merge@^3",
      "tailwind-variants@^3",
      "tailwindcss@^4",
      "tw-animate-css@^1",
      "@tailwindcss/postcss@^4",
    ]);

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockValidateReactProjectSetup).toHaveBeenCalledWith(nextPagesPlan);
    expect(mockSetupReactProject).toHaveBeenCalledWith(nextPagesPlan, nextPagesPlan.cssFile);
    expect(mockSetupTsConfig).toHaveBeenCalledWith("react", ".", false);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        componentDir: "components/starwind",
        utilsDir: "lib/utils",
        tailwind: expect.objectContaining({ css: "styles/starwind.css" }),
      }),
      { appendComponents: false },
    );
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).not.toContain("@tailwindcss/vite");
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).toContain("@tailwindcss/postcss");
  });

  it("uses detected React Router paths and keeps the Vite package plan", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        react: "^19.2.0",
        "react-dom": "^19.2.0",
        "react-router": "^7.15.0",
      },
      devDependencies: {
        "@react-router/dev": "^7.15.0",
        vite: "^8.0.0",
      },
    });
    const reactRouterPlan = {
      componentDir: "app/components/starwind",
      cssEntry: "app/app.css",
      cssFile: "app/styles/starwind.css",
      kind: "react-router" as const,
      rootEntry: "app/root.tsx",
      sourceRoot: "app" as const,
      utilsDir: "app/lib/utils",
      viteConfig: "vite.config.ts",
    };
    mockDetectReactProjectPlan.mockResolvedValue(reactRouterPlan);

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockValidateReactProjectSetup).toHaveBeenCalledWith(reactRouterPlan);
    expect(mockSetupReactProject).toHaveBeenCalledWith(reactRouterPlan, reactRouterPlan.cssFile);
    expect(mockSetupTsConfig).toHaveBeenCalledWith("react", "app", false);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        componentDir: "app/components/starwind",
        utilsDir: "app/lib/utils",
        tailwind: expect.objectContaining({ css: "app/styles/starwind.css" }),
      }),
      { appendComponents: false },
    );
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).toContain("@tailwindcss/vite");
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).not.toContain(
      "@tailwindcss/postcss",
    );
  });

  it("stops before package installation when React host preflight fails", async () => {
    mockReadJsonFile.mockResolvedValue({ dependencies: { next: "^16.3.0", react: "^19.2.0" } });
    mockValidateReactProjectSetup.mockRejectedValue(new Error("Unsupported Next layout"));
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(init(true, { defaults: true, packageManager: "pnpm" })).rejects.toThrow(
        "process.exit called",
      );
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
      expect(mockEnsureDirectory).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("keeps Astro as the project framework when React is used for Astro islands", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        astro: "^7.0.0",
        react: "^19.2.0",
        "react-dom": "^19.2.0",
      },
    });

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockUpdateConfig).toHaveBeenCalledWith(expect.objectContaining({ framework: "astro" }), {
      appendComponents: false,
    });
    expect(mockInstallDependencies.mock.calls[0]).toEqual([[CURRENT_ASTRO_SPEC], "pnpm"]);
  });

  it("requires an explicit framework when defaults cannot identify the project", async () => {
    mockReadJsonFile.mockResolvedValue({ devDependencies: { vite: "^9.1.1" } });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(init(true, { defaults: true, packageManager: "pnpm" })).rejects.toThrow(
        "process.exit called",
      );
      expect(clackPrompts.log.error).toHaveBeenCalledWith(
        expect.stringMatching(/--astro.*supported React host/s),
      );
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("configures Pro authorization during fresh init without shadcn components config", async () => {
    await init(true, {
      defaults: true,
      framework: "astro",
      packageManager: "pnpm",
      pro: true,
    });

    expect(mockSetupStarwindProConfig).toHaveBeenCalled();
    expect(mockSetupStarwindProEnv).toHaveBeenCalled();
    expect(clackPrompts.note).toHaveBeenCalledWith(
      expect.stringContaining("Starwind Pro is now configured"),
      "Next steps",
    );
    const nextStepsMessage = String(vi.mocked(clackPrompts.note).mock.calls[0]?.[0]);
    expect(nextStepsMessage).toContain("starwind add @starwind-pro/component-name");
    expect(nextStepsMessage).toContain(".env.local");
    expect(nextStepsMessage).toContain("STARWIND_LICENSE_KEY");
  });

  it("auto-selects a plain Astro target without asking for a framework", async () => {
    const selectMessages: string[] = [];

    mockGroup.mockImplementation(async (prompts) => {
      const answers: Record<string, unknown> = {};

      for (const [key, prompt] of Object.entries(prompts)) {
        answers[key] = await (prompt as () => unknown | Promise<unknown>)();
      }

      return answers;
    });
    mockSelect.mockImplementation(async (options) => {
      selectMessages.push(options.message);

      if (options.message.includes("framework")) {
        return "astro";
      }

      return options.initialValue ?? "styled";
    });
    mockText.mockImplementation(async (options) => options.initialValue ?? "");
    mockConfirm.mockResolvedValue(true);

    await init(true, { packageManager: "pnpm" });

    expect(selectMessages).not.toContain("Which framework is this project using?");
    expect(selectMessages).not.toContain("Which Starwind component layer do you want to use?");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        framework: "astro",
      }),
      { appendComponents: false },
    );
  });

  it("prompts once with only ready targets for a mixed Astro host", async () => {
    const selectMessages: string[] = [];
    mockDetectHostPlan.mockResolvedValue({
      host: { kind: "astro", label: "Astro" },
      targets: [
        { framework: "astro", readiness: "ready" },
        { framework: "react", readiness: "ready" },
      ],
    });
    mockGroup.mockImplementation(async (prompts) => {
      const answers: Record<string, unknown> = {};
      for (const [key, prompt] of Object.entries(prompts)) {
        answers[key] = await (prompt as () => unknown | Promise<unknown>)();
      }
      return answers;
    });
    mockSelect.mockImplementation(async (options) => {
      selectMessages.push(options.message);
      if (options.message.includes("detected framework")) return "astro";
      return options.initialValue ?? "neutral";
    });
    mockText.mockImplementation(async (options) => options.initialValue ?? "");
    mockConfirm.mockResolvedValue(true);

    await init(true, { packageManager: "pnpm" });

    expect(selectMessages.filter((message) => message.includes("detected framework"))).toEqual([
      "Which detected framework target would you like to use?",
    ]);
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { label: "Astro", value: "astro" },
          { label: "React", value: "react" },
        ],
      }),
    );
  });

  it("uses the same constrained target prompt in defaults mode for an ambiguous host", async () => {
    mockDetectHostPlan.mockResolvedValue({
      host: { kind: "astro", label: "Astro" },
      targets: [
        { framework: "astro", readiness: "ready" },
        { framework: "react", readiness: "ready" },
      ],
    });
    mockSelect.mockResolvedValue("astro");

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { label: "Astro", value: "astro" },
          { label: "React", value: "react" },
        ],
      }),
    );
    expect(mockUpdateConfig).toHaveBeenCalledWith(expect.objectContaining({ framework: "astro" }), {
      appendComponents: false,
    });
  });

  it("executes a mixed Astro prompt React selection as a configured secondary target", async () => {
    mockDetectHostPlan.mockResolvedValue({
      host: { kind: "astro", label: "Astro" },
      targets: [
        { framework: "astro", readiness: "ready" },
        { framework: "react", readiness: "ready" },
      ],
    });
    mockSelect.mockResolvedValue("react");
    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockEnsureAstroReactIntegration).toHaveBeenCalledWith({
      packageManager: "pnpm",
      skipPrompts: true,
    });
    expect(clackPrompts.log.info).toHaveBeenCalledWith("Detected React (Astro)");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        framework: "astro",
        componentDirs: { react: "src/components/starwind-react" },
      }),
      { appendComponents: false },
    );
  });

  it.each(["cancelled", "declined"] as const)(
    "stops Astro React initialization cleanly when setup is %s",
    async (status) => {
      mockDetectHostPlan.mockResolvedValue({
        host: { kind: "astro", label: "Astro" },
        targets: [
          { framework: "astro", readiness: "ready" },
          { framework: "react", readiness: "configurable" },
        ],
      });
      mockValidateHostTarget.mockReturnValue("react");
      mockEnsureAstroReactIntegration.mockResolvedValue({ status });

      await init(true, { defaults: true, framework: "react", packageManager: "pnpm" });

      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
      expect(mockEnsureDirectory).not.toHaveBeenCalled();
    },
  );

  it("rejects an explicit target that the host plan cannot support before mutation", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: { react: "^19.2.0" },
      devDependencies: { vite: "^8.2.0" },
    });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(
        init(true, { astro: true, defaults: true, packageManager: "pnpm" }),
      ).rejects.toThrow("process.exit called");
      expect(clackPrompts.log.error).toHaveBeenCalledWith(expect.stringMatching(/not available/i));
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
      expect(mockEnsureDirectory).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("preserves the conflicting framework option error before mutation", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(
        init(true, { astro: true, defaults: true, packageManager: "pnpm", react: true }),
      ).rejects.toThrow("process.exit called");
      expect(clackPrompts.log.error).toHaveBeenCalledWith(
        "Choose only one Starwind framework target.",
      );
      expect(mockDetectHostPlan).not.toHaveBeenCalled();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("rejects conflicting framework options before legacy migration", async () => {
    mockFileExists.mockResolvedValue(true);
    mockConfirm.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({
      status: "legacy",
      config: {
        $schema: "https://starwind.dev/config-schema.json",
        tailwind: {
          css: PATHS.LOCAL_CSS_FILE,
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: PATHS.LOCAL_COMPONENTS_DIR,
        utilsDir: PATHS.LOCAL_UTILS_DIR,
        components: [],
      },
    });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(
        init(false, { astro: true, packageManager: "pnpm", react: true }),
      ).rejects.toThrow("process.exit called");
      expect(clackPrompts.log.error).toHaveBeenCalledWith(
        "Choose only one Starwind framework target.",
      );
      expect(mockConfirm).not.toHaveBeenCalled();
      expect(mockMigrate).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("uses framework alias flags for runtime setup", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
      devDependencies: { vite: "^8.2.0" },
    });
    await init(true, { defaults: true, packageManager: "pnpm", react: true });

    expect(mockUpdateConfig).toHaveBeenLastCalledWith(
      expect.objectContaining({
        framework: "react",
      }),
      { appendComponents: false },
    );
    expect(mockInstallDependencies.mock.calls).toEqual([
      [[CURRENT_REACT_SPEC], "pnpm"],
      [REACT_SETUP_REQUIREMENTS, "pnpm", false, false],
    ]);

    vi.clearAllMocks();
    mockDefaultProject();

    await init(true, { astro: true, defaults: true, packageManager: "pnpm" });

    expect(mockUpdateConfig).toHaveBeenLastCalledWith(
      expect.objectContaining({
        framework: "astro",
      }),
      { appendComponents: false },
    );
    expect(mockInstallDependencies.mock.calls).toEqual([
      [[CURRENT_ASTRO_SPEC], "pnpm"],
      [ASTRO_SETUP_REQUIREMENTS, "pnpm", false, false],
    ]);
  });

  it("recommends migrate for legacy configs before writing runtime setup", async () => {
    mockFileExists.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({
      status: "legacy",
      config: {
        $schema: "https://starwind.dev/config-schema.json",
        tailwind: {
          css: PATHS.LOCAL_CSS_FILE,
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: PATHS.LOCAL_COMPONENTS_DIR,
        utilsDir: PATHS.LOCAL_UTILS_DIR,
        components: [{ name: "button", version: "2.3.1" }],
      },
    });

    await init(true, { defaults: true, framework: "astro", packageManager: "pnpm" });

    expect(clackPrompts.log.warn).toHaveBeenCalledWith(expect.stringContaining("starwind migrate"));
    expect(mockMigrate).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("prompts to migrate legacy configs and continues into Pro setup", async () => {
    mockFileExists.mockResolvedValue(true);
    mockConfirm.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({
      status: "legacy",
      config: {
        $schema: "https://starwind.dev/config-schema.json",
        tailwind: {
          css: PATHS.LOCAL_CSS_FILE,
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: PATHS.LOCAL_COMPONENTS_DIR,
        utilsDir: PATHS.LOCAL_UTILS_DIR,
        components: [{ name: "button", version: "2.3.1" }],
      },
    });

    await init(false, { packageManager: "pnpm", pro: true });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("run `starwind migrate` now"),
        initialValue: true,
      }),
    );
    expect(mockMigrate).toHaveBeenCalledWith({
      packageManager: "pnpm",
      withinInit: true,
    });
    expect(mockSetupStarwindProConfig).toHaveBeenCalled();
    expect(mockSetupStarwindProEnv).toHaveBeenCalled();
    expect(clackPrompts.note).toHaveBeenCalledWith(
      expect.stringContaining("Starwind Pro is now configured"),
      "Next steps",
    );
    const nextStepsMessage = String(vi.mocked(clackPrompts.note).mock.calls[0]?.[0]);
    expect(nextStepsMessage).toContain("starwind add @starwind-pro/component-name");
    expect(nextStepsMessage).toContain(".env.local");
    expect(nextStepsMessage).toContain("STARWIND_LICENSE_KEY");
  });

  it("keeps legacy configs unchanged when migration is declined", async () => {
    mockFileExists.mockResolvedValue(true);
    mockConfirm.mockResolvedValue(false);
    mockGetConfigState.mockResolvedValue({
      status: "legacy",
      config: {
        $schema: "https://starwind.dev/config-schema.json",
        tailwind: {
          css: PATHS.LOCAL_CSS_FILE,
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: PATHS.LOCAL_COMPONENTS_DIR,
        utilsDir: PATHS.LOCAL_UTILS_DIR,
        components: [{ name: "button", version: "2.3.1" }],
      },
    });

    await init(false, { packageManager: "pnpm", pro: true });

    expect(mockMigrate).not.toHaveBeenCalled();
    expect(mockSetupStarwindProConfig).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("returns without changes when a v2 config is already present", async () => {
    mockFileExists.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: createCurrentConfig("react"),
    });

    await init(true, { defaults: true, framework: "react", packageManager: "pnpm" });

    expect(clackPrompts.log.info).toHaveBeenCalledWith(
      expect.stringContaining("already configured"),
    );
    expect(mockUpdateConfig).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("configures Pro when a v2 config is already present and --pro is used", async () => {
    mockFileExists.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: createCurrentConfig("react"),
    });

    await init(false, { packageManager: "pnpm", pro: true });

    expect(clackPrompts.log.info).toHaveBeenCalledWith(
      expect.stringContaining("already configured"),
    );
    expect(mockSetupStarwindProConfig).toHaveBeenCalled();
    expect(mockSetupStarwindProEnv).toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("configures Pro auth when an existing v2 config has only a partial Pro registry", async () => {
    mockFileExists.mockResolvedValue(true);
    mockCheckStarwindProEnv.mockResolvedValue(true);
    mockHasStarwindProAuthConfig.mockReturnValue(false);
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: {
        ...createCurrentConfig("react"),
        pro: {
          registry: {
            url: "http://localhost:4321/r/{name}",
            headers: {},
          },
        },
      },
    });

    await init(false, { packageManager: "pnpm", pro: true });

    expect(mockSetupStarwindProConfig).toHaveBeenCalled();
    expect(mockSetupStarwindProEnv).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("owns standalone completion through the final delay and outro", async () => {
    let resolveFinalDelay!: () => void;
    const finalDelay = new Promise<void>((resolve) => {
      resolveFinalDelay = resolve;
    });
    vi.mocked(sleepUtils.sleep).mockImplementation((milliseconds) =>
      milliseconds === 1000 ? finalDelay : Promise.resolve(),
    );
    let completed = false;

    const initPromise = init(false, {
      defaults: true,
      framework: "astro",
      packageManager: "pnpm",
    }).then(() => {
      completed = true;
    });

    await vi.waitFor(() => expect(sleepUtils.sleep).toHaveBeenCalledWith(1000));
    expect(completed).toBe(false);
    expect(clackPrompts.outro).not.toHaveBeenCalled();

    resolveFinalDelay();
    await initPromise;

    expect(clackPrompts.intro).toHaveBeenCalledTimes(1);
    expect(clackPrompts.outro).toHaveBeenCalledTimes(1);
  });
});
