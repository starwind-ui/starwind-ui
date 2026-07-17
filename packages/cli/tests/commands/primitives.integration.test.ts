import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { primitivesAdd, primitivesUpdate } from "../../src/commands/primitives.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
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

vi.mock("../../src/utils/package-manager.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/utils/package-manager.js")>();

  return {
    ...actual,
    installDependencies: vi.fn(),
  };
});

vi.mock("../../src/utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

import * as packageManager from "../../src/utils/package-manager.js";

const mockInstallDependencies = vi.mocked(packageManager.installDependencies);
const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockLog = vi.mocked(clackPrompts.log);
const runtimePackage = JSON.parse(
  readFileSync(new URL("../../../runtime/package.json", import.meta.url), "utf8"),
) as { version: string };
const CURRENT_BETA_RUNTIME_SPEC = `@starwind-ui/runtime@^${runtimePackage.version}`;

describe.sequential("primitives add integration", () => {
  let tempDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await mkdtemp(join(tmpdir(), "starwind-primitives-add-test-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);

    await writeFile(
      "package.json",
      JSON.stringify({ dependencies: { astro: "^5.0.0" } }, null, 2),
      "utf-8",
    );
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "astro",
          registry: {
            source: "bundled",
            version: "0.1.0",
          },
          packageRequirements: {
            "@starwind-ui/runtime": "*",
          },
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          utilsDir: "src/lib/utils",
          components: [
            {
              name: "card",
              version: "2.0.0",
              framework: "astro",
              registry: "default",
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );
    mockInstallDependencies.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("writes primitive source, installs missing packages from package.json, and records primitive metadata", async () => {
    await primitivesAdd(["button"], {
      packageManager: "pnpm",
      to: "src/reference/primitives",
      yes: true,
    });

    await expect(
      readFile(
        join(tempDir, "src", "reference", "primitives", "button", "ButtonRoot.astro"),
        "utf-8",
      ),
    ).resolves.toContain("data-sw-button");
    expect(mockInstallDependencies).toHaveBeenCalledWith([CURRENT_BETA_RUNTIME_SPEC], "pnpm");

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    expect(updatedConfig.components).toEqual([
      {
        name: "card",
        version: "2.0.0",
        framework: "astro",
        registry: "default",
      },
    ]);
    expect(updatedConfig.primitiveDir).toBe("src/reference/primitives");
    expect(updatedConfig.primitives).toEqual([
      {
        name: "button",
        version: "0.1.1",
        framework: "astro",
        source: "bundled",
      },
    ]);
    expect(updatedConfig.packageRequirements).toBeUndefined();
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully installed primitives:"),
    );
  });

  it("appends primitive metadata while preserving existing primitives and styled components", async () => {
    const config = JSON.parse(await readFile(join(tempDir, "starwind.config.json"), "utf-8"));
    config.primitives = [
      {
        name: "checkbox",
        version: "0.1.0",
        framework: "astro",
        source: "bundled",
      },
    ];
    await writeFile("starwind.config.json", JSON.stringify(config, null, 2), "utf-8");

    await primitivesAdd(["button"], { packageManager: "pnpm", yes: true });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );

    expect(updatedConfig.components).toEqual([
      {
        name: "card",
        version: "2.0.0",
        framework: "astro",
        registry: "default",
      },
    ]);
    expect(updatedConfig.primitives).toEqual([
      {
        name: "checkbox",
        version: "0.1.0",
        framework: "astro",
        source: "bundled",
      },
      {
        name: "button",
        version: "0.1.1",
        framework: "astro",
        source: "bundled",
      },
    ]);
  });

  it("protects existing primitive files by default in --yes mode", async () => {
    const targetPath = join(
      tempDir,
      "src",
      "components",
      "starwind-primitives",
      "button",
      "ButtonRoot.astro",
    );
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "local edit\n", "utf-8");

    await primitivesAdd(["button"], { packageManager: "pnpm", yes: true });

    await expect(readFile(targetPath, "utf-8")).resolves.toBe("local edit\n");
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("Skipped primitives:"));
  });

  it("overwrites existing primitive files when --overwrite is requested", async () => {
    const targetPath = join(
      tempDir,
      "src",
      "components",
      "starwind-primitives",
      "button",
      "ButtonRoot.astro",
    );
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "local edit\n", "utf-8");

    await primitivesAdd(["button"], { overwrite: true, packageManager: "pnpm", yes: true });

    await expect(readFile(targetPath, "utf-8")).resolves.toContain("data-sw-button");
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully installed primitives:"),
    );
  });

  it("continues installing valid primitives when another requested primitive is skipped for local edits", async () => {
    const buttonPath = join(
      tempDir,
      "src",
      "components",
      "starwind-primitives",
      "button",
      "ButtonRoot.astro",
    );
    await mkdir(dirname(buttonPath), { recursive: true });
    await writeFile(buttonPath, "local edit\n", "utf-8");

    await primitivesAdd(["button", "checkbox"], { packageManager: "pnpm", yes: true });

    await expect(readFile(buttonPath, "utf-8")).resolves.toBe("local edit\n");
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-primitives", "checkbox", "CheckboxRoot.astro"),
        "utf-8",
      ),
    ).resolves.toContain("data-sw-checkbox");

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    expect(updatedConfig.primitives).toEqual([
      {
        name: "checkbox",
        version: "0.1.0",
        framework: "astro",
        source: "bundled",
      },
    ]);
    expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("Skipped primitives:"));
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully installed primitives:"),
    );
  });

  it("prompts before primitive updates that require package changes", async () => {
    const config = JSON.parse(await readFile(join(tempDir, "starwind.config.json"), "utf-8"));
    config.primitives = [
      {
        name: "button",
        version: "0.0.0",
        framework: "astro",
        source: "bundled",
      },
    ];
    await writeFile("starwind.config.json", JSON.stringify(config, null, 2), "utf-8");
    mockConfirm.mockResolvedValue(false);

    await primitivesUpdate(["button"], { packageManager: "pnpm" });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Install required package updates"),
      }),
    );
    expect(mockInstallDependencies).not.toHaveBeenCalled();

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    expect(updatedConfig.primitives).toEqual([
      {
        name: "button",
        version: "0.0.0",
        framework: "astro",
        source: "bundled",
      },
    ]);
  });

  it("dry-runs primitive updates without writing files, installing packages, or mutating config", async () => {
    const config = JSON.parse(await readFile(join(tempDir, "starwind.config.json"), "utf-8"));
    config.primitives = [
      {
        name: "button",
        version: "0.0.0",
        framework: "astro",
        source: "bundled",
      },
    ];
    await writeFile("starwind.config.json", JSON.stringify(config, null, 2), "utf-8");

    const targetPath = join(
      tempDir,
      "src",
      "components",
      "starwind-primitives",
      "button",
      "ButtonRoot.astro",
    );
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "old primitive\n", "utf-8");

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await primitivesUpdate(["button"], { dryRun: true, packageManager: "pnpm" });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Update Preview"));
    } finally {
      consoleLogSpy.mockRestore();
    }

    await expect(readFile(targetPath, "utf-8")).resolves.toBe("old primitive\n");
    expect(mockInstallDependencies).not.toHaveBeenCalled();

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    expect(updatedConfig.primitives).toEqual([
      {
        name: "button",
        version: "0.0.0",
        framework: "astro",
        source: "bundled",
      },
    ]);
  });
});
