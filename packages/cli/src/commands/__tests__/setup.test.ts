import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PATHS } from "../../utils/constants.js";

// Mock prompts first with a factory, this is hoisted
vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
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

// Mock other utils
vi.mock("../../utils/fs.js");
vi.mock("../../utils/shadcn-config.js");
vi.mock("../../utils/env.js");
vi.mock("../../utils/config.js");
vi.mock("../../utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../init.js");

// Now import the modules
import * as clackPrompts from "@clack/prompts";

import * as config from "../../utils/config.js";
import * as env from "../../utils/env.js";
import * as fs from "../../utils/fs.js";
import * as shadcnConfig from "../../utils/shadcn-config.js";
import * as initModule from "../init.js";
import { setup } from "../setup.js";

// Get references to the mocked functions
const mockCancel = vi.mocked(clackPrompts.cancel);
const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockIsCancel = vi.mocked(clackPrompts.isCancel);
const mockTasks = vi.mocked(clackPrompts.tasks);
const mockLog = vi.mocked(clackPrompts.log);

const mockFileExists = vi.mocked(fs.fileExists);
const mockGetConfig = vi.mocked(config.getConfig);
const mockHasStarwindProRegistry = vi.mocked(shadcnConfig.hasStarwindProRegistry);
const mockSetupShadcnProConfig = vi.mocked(shadcnConfig.setupShadcnProConfig);
const mockCheckStarwindProEnv = vi.mocked(env.checkStarwindProEnv);
const mockSetupStarwindProEnv = vi.mocked(env.setupStarwindProEnv);
const mockInit = vi.mocked(initModule.init);

function runTasksSequentially(tasks: Array<{ task?: () => Promise<unknown> }>) {
  return Promise.all(tasks.map(async (task) => task.task?.()));
}

describe("setup command", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    mockFileExists.mockResolvedValue(true);
    mockHasStarwindProRegistry.mockResolvedValue(false);
    mockCheckStarwindProEnv.mockResolvedValue(false);
    mockGetConfig.mockResolvedValue({
      $schema: "https://starwind.dev/config-schema.json",
      tailwind: {
        css: "src/styles/globals.css",
        baseColor: "neutral",
        cssVariables: true,
      },
      componentDir: "src/components/starwind",
      components: [],
    });
    mockSetupStarwindProEnv.mockResolvedValue(true);
    mockIsCancel.mockReturnValue(false);
    mockInit.mockResolvedValue(undefined);
    mockTasks.mockImplementation(runTasksSequentially);
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  it("should exit if starwind.config.json is not found and user declines init", async () => {
    mockFileExists.mockResolvedValue(false);
    mockConfirm.mockResolvedValue(false);
    await expect(setup()).rejects.toThrow("process.exit called");
    expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining("starwind init"));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should inform the user if Starwind Pro is already configured", async () => {
    mockHasStarwindProRegistry.mockResolvedValue(true);
    mockCheckStarwindProEnv.mockResolvedValue(true);
    await setup();
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("Starwind Pro registry and environment already configured"),
    );
    expect(mockSetupShadcnProConfig).not.toHaveBeenCalled();
    expect(mockSetupStarwindProEnv).not.toHaveBeenCalled();
  });

  it("should proceed with defaults if getConfig throws", async () => {
    mockGetConfig.mockRejectedValue(new Error("Config read error"));
    await setup();
    expect(mockTasks).toHaveBeenCalled();
    expect(mockSetupShadcnProConfig).toHaveBeenCalledWith(PATHS.LOCAL_CSS_FILE, "neutral");
  });

  it("should set up Starwind Pro if it is not already configured", async () => {
    await setup();
    expect(mockTasks).toHaveBeenCalled();
    expect(mockSetupShadcnProConfig).toHaveBeenCalledWith("src/styles/globals.css", "neutral");
    expect(mockSetupStarwindProEnv).toHaveBeenCalled();
  });

  it("should handle errors during setup", async () => {
    mockSetupShadcnProConfig.mockRejectedValue(new Error("Failed to write to components.json"));
    await expect(setup()).rejects.toThrow("process.exit called");
    expect(mockLog.error).toHaveBeenCalledWith("Failed to write to components.json");
    expect(mockCancel).toHaveBeenCalledWith("Operation cancelled");
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
