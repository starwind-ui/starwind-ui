import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATHS } from "../../utils/constants.js";

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

vi.mock("../../utils/astro-config.js");
vi.mock("../../utils/config.js");
vi.mock("../../utils/env.js");
vi.mock("../../utils/fs.js");
vi.mock("../../utils/layout.js");
vi.mock("../../utils/package-manager.js");
vi.mock("../../utils/shadcn-config.js");
vi.mock("../../utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../utils/snippets.js");
vi.mock("../../utils/tsconfig.js");

import * as clackPrompts from "@clack/prompts";

import * as astroConfig from "../../utils/astro-config.js";
import * as config from "../../utils/config.js";
import * as fsUtils from "../../utils/fs.js";
import * as layout from "../../utils/layout.js";
import * as packageManager from "../../utils/package-manager.js";
import * as snippets from "../../utils/snippets.js";
import * as tsconfig from "../../utils/tsconfig.js";
import { init } from "../init.js";

const mockTasks = vi.mocked(clackPrompts.tasks);
const mockFileExists = vi.mocked(fsUtils.fileExists);
const mockReadJsonFile = vi.mocked(fsUtils.readJsonFile);
const mockEnsureDirectory = vi.mocked(fsUtils.ensureDirectory);
const mockWriteCssFile = vi.mocked(fsUtils.writeCssFile);
const mockSetupSnippets = vi.mocked(snippets.setupSnippets);
const mockSetupAstroConfig = vi.mocked(astroConfig.setupAstroConfig);
const mockSetupTsConfig = vi.mocked(tsconfig.setupTsConfig);
const mockSetupLayoutCssImport = vi.mocked(layout.setupLayoutCssImport);
const mockUpdateConfig = vi.mocked(config.updateConfig);
const mockInstallDependencies = vi.mocked(packageManager.installDependencies);

function runTasksSequentially(tasks: Array<{ task?: () => Promise<unknown> }>) {
  return Promise.all(tasks.map(async (task) => task.task?.()));
}

describe("init command", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockTasks.mockImplementation(runTasksSequentially);
    mockFileExists.mockImplementation(async (filePath) => filePath === "package.json");
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        astro: "^5.11.0",
      },
    });

    mockEnsureDirectory.mockResolvedValue(undefined);
    mockWriteCssFile.mockResolvedValue(undefined);
    mockSetupSnippets.mockResolvedValue(undefined);
    mockSetupAstroConfig.mockResolvedValue(true);
    mockSetupTsConfig.mockResolvedValue(true);
    mockSetupLayoutCssImport.mockResolvedValue(true);
    mockUpdateConfig.mockResolvedValue(undefined);
    mockInstallDependencies.mockResolvedValue(undefined);
  });

  it("writes utilsDir to config using the default relative path", async () => {
    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        componentDir: PATHS.LOCAL_COMPONENTS_DIR,
        utilsDir: PATHS.LOCAL_UTILS_DIR,
      }),
    );
  });
});
