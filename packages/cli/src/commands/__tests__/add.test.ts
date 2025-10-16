import * as clackPrompts from "@clack/prompts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as config from "../../utils/config.js";
import * as fs from "../../utils/fs.js";
import * as install from "../../utils/install.js";
import * as prompts from "../../utils/prompts.js";
import * as registry from "../../utils/registry.js";
import * as validate from "../../utils/validate.js";
import { add } from "../add.js";

// Mock all dependencies
vi.mock("@clack/prompts");
vi.mock("../../utils/config.js");
vi.mock("../../utils/fs.js");
vi.mock("../../utils/install.js");
vi.mock("../../utils/prompts.js");
vi.mock("../../utils/registry.js");
vi.mock("../../utils/validate.js");
vi.mock("../init.js");

const mockIntro = vi.mocked(clackPrompts.intro);
const mockOutro = vi.mocked(clackPrompts.outro);
const mockCancel = vi.mocked(clackPrompts.cancel);
const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockIsCancel = vi.mocked(clackPrompts.isCancel);
const mockLog = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  message: vi.fn(),
};
vi.mocked(clackPrompts).log = mockLog;

const mockFileExists = vi.mocked(fs.fileExists);
const mockUpdateConfig = vi.mocked(config.updateConfig);
const mockInstallComponent = vi.mocked(install.installComponent);
const mockSelectComponents = vi.mocked(prompts.selectComponents);
const mockGetAllComponents = vi.mocked(registry.getAllComponents);
const mockIsValidComponent = vi.mocked(validate.isValidComponent);

// Mock process.exit
const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit called");
});

describe("add command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFileExists.mockResolvedValue(true); // Config exists by default
    mockIsCancel.mockReturnValue(false);
  });

  describe("component with Starwind dependencies", () => {
    it("should install component and its Starwind dependencies", async () => {
      const mockComponents = [
        {
          name: "alert-dialog",
          version: "1.0.0",
          dependencies: ["@starwind-ui/core/button@^2.1.0"],
          type: "component" as const,
        },
        { name: "button", version: "2.1.0", dependencies: [], type: "component" as const },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);
      mockIsValidComponent.mockResolvedValue(true);

      // Mock successful installation with dependency results
      mockInstallComponent.mockResolvedValue({
        status: "installed",
        name: "alert-dialog",
        version: "1.0.0",
        dependencyResults: [
          {
            status: "installed",
            name: "button",
            version: "2.1.0",
          },
        ],
      });

      await add(["alert-dialog"]);

      expect(mockInstallComponent).toHaveBeenCalledWith("alert-dialog");
      expect(mockUpdateConfig).toHaveBeenCalledWith(
        { components: [{ name: "alert-dialog", version: "1.0.0" }] },
        { appendComponents: true },
      );

      // Should show both components in success message
      expect(mockLog.success).toHaveBeenCalledWith(
        expect.stringContaining("Successfully installed components:"),
      );
      expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("alert-dialog v1.0.0"));
      expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("button v2.1.0"));
    });

    it("should handle dependency installation failures", async () => {
      const mockComponents = [
        {
          name: "alert-dialog",
          version: "1.0.0",
          dependencies: ["@starwind-ui/core/button@^2.1.0"],
          type: "component" as const,
        },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);
      mockIsValidComponent.mockResolvedValue(true);

      // Mock failed dependency installation
      mockInstallComponent.mockResolvedValue({
        status: "installed",
        name: "alert-dialog",
        version: "1.0.0",
        dependencyResults: [
          {
            status: "failed",
            name: "button",
            error: "Component files not found",
          },
        ],
      });

      await add(["alert-dialog"]);

      // Should show both success and failure messages
      expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("alert-dialog v1.0.0"));
      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to install components:"),
      );
      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining("button - Component files not found"),
      );
    });

    it("should handle dependency updates", async () => {
      const mockComponents = [
        {
          name: "alert-dialog",
          version: "1.0.0",
          dependencies: ["@starwind-ui/core/button@^2.1.0"],
          type: "component" as const,
        },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);
      mockIsValidComponent.mockResolvedValue(true);

      // Mock installation with dependency update (skipped because already up to date)
      mockInstallComponent.mockResolvedValue({
        status: "installed",
        name: "alert-dialog",
        version: "1.0.0",
        dependencyResults: [
          {
            status: "skipped",
            name: "button",
            version: "2.1.0",
          },
        ],
      });

      await add(["alert-dialog"]);

      expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("alert-dialog v1.0.0"));
      expect(mockLog.warn).toHaveBeenCalledWith(
        expect.stringContaining("Skipped components (already installed):"),
      );
      expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("button v2.1.0"));
    });

    it("should handle mixed dependency results", async () => {
      const mockComponents = [
        {
          name: "complex-component",
          version: "1.0.0",
          dependencies: [],
          type: "component" as const,
        },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);
      mockIsValidComponent.mockResolvedValue(true);

      // Mock installation with mixed dependency results
      mockInstallComponent.mockResolvedValue({
        status: "installed",
        name: "complex-component",
        version: "1.0.0",
        dependencyResults: [
          {
            status: "installed",
            name: "button",
            version: "2.1.0",
          },
          {
            status: "skipped",
            name: "input",
            version: "1.0.0",
          },
          {
            status: "failed",
            name: "dialog",
            error: "Registry error",
          },
        ],
      });

      await add(["complex-component"]);

      // Should show all three types of results
      expect(mockLog.success).toHaveBeenCalledWith(
        expect.stringContaining("complex-component v1.0.0"),
      );
      expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("button v2.1.0"));
      expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("input v1.0.0"));
      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining("dialog - Registry error"),
      );
    });
  });

  describe("multiple components with dependencies", () => {
    it("should install multiple components and aggregate dependency results", async () => {
      const mockComponents = [
        {
          name: "alert-dialog",
          version: "1.0.0",
          dependencies: ["@starwind-ui/core/button@^2.1.0"],
          type: "component" as const,
        },
        {
          name: "dialog",
          version: "1.3.0",
          dependencies: ["@starwind-ui/core/button@^2.1.0"],
          type: "component" as const,
        },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);
      mockIsValidComponent.mockResolvedValue(true);

      // Mock installations - first installs button, second skips it
      mockInstallComponent
        .mockResolvedValueOnce({
          status: "installed",
          name: "alert-dialog",
          version: "1.0.0",
          dependencyResults: [
            {
              status: "installed",
              name: "button",
              version: "2.1.0",
            },
          ],
        })
        .mockResolvedValueOnce({
          status: "installed",
          name: "dialog",
          version: "1.3.0",
          dependencyResults: [
            {
              status: "skipped",
              name: "button",
              version: "2.1.0",
            },
          ],
        });

      await add(["alert-dialog", "dialog"]);

      // Should show all components in appropriate categories
      expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("alert-dialog v1.0.0"));
      expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("dialog v1.3.0"));
      expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("button v2.1.0"));
      expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("button v2.1.0"));
    });
  });

  describe("interactive component selection", () => {
    it("should handle interactive selection with dependencies", async () => {
      const mockComponents = [
        {
          name: "alert-dialog",
          version: "1.0.0",
          dependencies: ["@starwind-ui/core/button@^2.1.0"],
          type: "component" as const,
        },
        { name: "button", version: "2.1.0", dependencies: [], type: "component" as const },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);
      mockSelectComponents.mockResolvedValue(["alert-dialog"]);

      mockInstallComponent.mockResolvedValue({
        status: "installed",
        name: "alert-dialog",
        version: "1.0.0",
        dependencyResults: [
          {
            status: "installed",
            name: "button",
            version: "2.1.0",
          },
        ],
      });

      await add(); // No components specified, should use interactive selection

      expect(mockSelectComponents).toHaveBeenCalled();
      expect(mockInstallComponent).toHaveBeenCalledWith("alert-dialog");
      expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("alert-dialog v1.0.0"));
      expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("button v2.1.0"));
    });

    it("should handle cancellation of interactive selection", async () => {
      mockSelectComponents.mockResolvedValue([]);

      try {
        await add();
      } catch (error) {
        expect(error.message).toBe("process.exit called");
      }

      expect(mockCancel).toHaveBeenCalledWith("Operation cancelled");
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });

  describe("--all option with dependencies", () => {
    it("should install all components including their dependencies", async () => {
      const mockComponents = [
        { name: "button", version: "2.1.0", dependencies: [], type: "component" as const },
        {
          name: "alert-dialog",
          version: "1.0.0",
          dependencies: ["@starwind-ui/core/button@^2.1.0"],
          type: "component" as const,
        },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);

      mockInstallComponent
        .mockResolvedValueOnce({
          status: "installed",
          name: "button",
          version: "2.1.0",
        })
        .mockResolvedValueOnce({
          status: "installed",
          name: "alert-dialog",
          version: "1.0.0",
          dependencyResults: [
            {
              status: "skipped", // Button already installed
              name: "button",
              version: "2.1.0",
            },
          ],
        });

      await add(undefined, { all: true });

      expect(mockInstallComponent).toHaveBeenCalledTimes(2);
      expect(mockInstallComponent).toHaveBeenCalledWith("button");
      expect(mockInstallComponent).toHaveBeenCalledWith("alert-dialog");
    });
  });

  describe("error handling", () => {
    it("should handle component installation failure with dependency results", async () => {
      const mockComponents = [
        { name: "alert-dialog", version: "1.0.0", dependencies: [], type: "component" as const },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);
      mockIsValidComponent.mockResolvedValue(true);

      mockInstallComponent.mockResolvedValue({
        status: "failed",
        name: "alert-dialog",
        error: "Component files not found",
        dependencyResults: [
          {
            status: "installed",
            name: "button",
            version: "2.1.0",
          },
        ],
      });

      await add(["alert-dialog"]);

      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to install components:"),
      );
      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining("alert-dialog - Component files not found"),
      );

      // Should still show successful dependency installation
      expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("button v2.1.0"));
    });

    it("should handle config update failure", async () => {
      const mockComponents = [
        { name: "button", version: "2.1.0", dependencies: [], type: "component" as const },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);
      mockIsValidComponent.mockResolvedValue(true);

      mockInstallComponent.mockResolvedValue({
        status: "installed",
        name: "button",
        version: "2.1.0",
      });

      mockUpdateConfig.mockRejectedValue(new Error("Config write failed"));

      try {
        await add(["button"]);
      } catch (error) {
        expect(error.message).toBe("process.exit called");
      }

      expect(mockLog.error).toHaveBeenCalledWith("Failed to update config: Config write failed");
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
