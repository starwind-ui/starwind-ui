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
vi.mock("../../src/utils/config.js");
vi.mock("../../src/utils/env.js");
vi.mock("../../src/utils/fs.js");
vi.mock("../../src/utils/layout.js");
vi.mock("../../src/utils/package-manager.js");
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
import * as config from "../../src/utils/config.js";
import { CONFIG_SCHEMA_V2_URL } from "../../src/utils/config.js";
import * as env from "../../src/utils/env.js";
import * as fsUtils from "../../src/utils/fs.js";
import * as layout from "../../src/utils/layout.js";
import * as packageManager from "../../src/utils/package-manager.js";
import * as snippets from "../../src/utils/snippets.js";
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
const mockSetupSnippets = vi.mocked(snippets.setupSnippets);
const mockSetupAstroConfig = vi.mocked(astroConfig.setupAstroConfig);
const mockSetupTsConfig = vi.mocked(tsconfig.setupTsConfig);
const mockSetupLayoutCssImport = vi.mocked(layout.setupLayoutCssImport);
const mockSetupReactViteConfig = vi.mocked(viteConfig.setupReactViteConfig);
const mockSetupReactCssImport = vi.mocked(viteConfig.setupReactCssImport);
const mockGetConfigState = vi.mocked(config.getConfigState);
const mockUpdateConfig = vi.mocked(config.updateConfig);
const mockInstallDependencies = vi.mocked(packageManager.installDependencies);
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
  mockMigrate.mockResolvedValue(undefined);
}

describe("init command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDefaultProject();
  });

  it("writes v2 runtime config and package plan for a React framework flag", async () => {
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
    expect(mockSetupReactViteConfig).toHaveBeenCalled();
    expect(mockSetupReactCssImport).toHaveBeenCalledWith(PATHS.LOCAL_CSS_FILE);
    expect(mockSetupTsConfig).toHaveBeenCalledWith("react");
    expect(mockInstallDependencies.mock.calls).toEqual([
      [[CURRENT_REACT_SPEC], "pnpm"],
      [REACT_SETUP_REQUIREMENTS, "pnpm", false, false],
    ]);
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).not.toContain('"@tabler/icons@^3"');
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

  it("prompts for framework without asking for a component layer", async () => {
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

    expect(selectMessages).toContain("Which framework is this project using?");
    expect(selectMessages).not.toContain("Which Starwind component layer do you want to use?");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        framework: "astro",
      }),
      { appendComponents: false },
    );
  });

  it("uses framework alias flags for runtime setup", async () => {
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
});
