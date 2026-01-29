import * as clackPrompts from "@clack/prompts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as fs from "../../utils/fs.js";
import * as shadcnConfig from "../../utils/shadcn-config.js";
import * as env from "../../utils/env.js";
import { setup } from "../setup.js";

// Mock all dependencies
vi.mock("@clack/prompts");
vi.mock("../../utils/fs.js");
vi.mock("../../utils/shadcn-config.js");
vi.mock("../../utils/env.js");

const mockIntro = vi.mocked(clackPrompts.intro);
const mockOutro = vi.mocked(clackPrompts.outro);
const mockCancel = vi.mocked(clackPrompts.cancel);
const mockLog = {
  error: vi.fn(),
  warn: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  message: vi.fn(),
  step: vi.fn(),
};
vi.mocked(clackPrompts).log = mockLog as typeof clackPrompts.log;
const mockTasks = vi.mocked(clackPrompts.tasks);

const mockFileExists = vi.mocked(fs.fileExists);
const mockReadJsonFile = vi.mocked(fs.readJsonFile);
const mockHasStarwindProRegistry = vi.mocked(shadcnConfig.hasStarwindProRegistry);
const mockSetupShadcnProConfig = vi.mocked(shadcnConfig.setupShadcnProConfig);
const mockSetupStarwindProEnv = vi.mocked(env.setupStarwindProEnv);

// Mock process.exit
const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit called");
});

describe("setup command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFileExists.mockResolvedValue(true); // Config exists by default
    mockHasStarwindProRegistry.mockResolvedValue(false); // Pro not configured by default
    mockReadJsonFile.mockResolvedValue({
      tailwind: {
        css: "src/styles/globals.css",
        baseColor: "neutral",
      },
    });
    mockSetupStarwindProEnv.mockResolvedValue(true);
  });

  it("should exit if starwind.config.json is not found", async () => {
    mockFileExists.mockResolvedValue(false);

    await expect(setup()).rejects.toThrow("process.exit called");

    expect(mockLog.error).toHaveBeenCalledWith(
      "No starwind.config.json found. Please run `starwind init` first.",
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should inform the user if Starwind Pro is already configured", async () => {
    mockHasStarwindProRegistry.mockResolvedValue(true);

    await setup();

    expect(mockLog.info).toHaveBeenCalledWith("Starwind Pro registry already configured");
    expect(mockSetupShadcnProConfig).not.toHaveBeenCalled();
    expect(mockSetupStarwindProEnv).not.toHaveBeenCalled();
  });

  it("should exit if the config file is malformed", async () => {
    mockReadJsonFile.mockResolvedValue({ tailwind: {} }); // Missing css and baseColor

    await setup();

    expect(mockLog.error).toHaveBeenCalledWith(
      "Invalid `starwind.config.json`. Could not set up Starwind Pro registry.",
    );
    expect(mockSetupShadcnProConfig).not.toHaveBeenCalled();
  });

  it("should set up Starwind Pro if it is not already configured", async () => {
    mockTasks.mockImplementation(async (tasks) => {
      for (const task of tasks) {
        if (task.task) {
          await task.task();
        }
      }
    });

    await setup();

    expect(mockTasks).toHaveBeenCalled();
    expect(mockSetupShadcnProConfig).toHaveBeenCalledWith("src/styles/globals.css", "neutral");
    expect(mockSetupStarwindProEnv).toHaveBeenCalled();
  });

  it("should handle errors during setup", async () => {
    mockSetupShadcnProConfig.mockRejectedValue(new Error("Failed to write to components.json"));

    // We need to mock the tasks implementation to simulate the error
    mockTasks.mockImplementation(async (tasks) => {
      for (const task of tasks) {
        await task.task();
      }
    });

    await expect(setup()).rejects.toThrow("process.exit called");

    expect(mockLog.error).toHaveBeenCalledWith("Failed to write to components.json");
    expect(mockCancel).toHaveBeenCalledWith("Operation cancelled");
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
