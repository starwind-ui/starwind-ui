import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { remove } from "../../src/commands/remove.js";
import type { ComponentConfig, StarwindConfig } from "../../src/utils/config.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  multiselect: vi.fn(),
  log: {
    error: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../src/utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockIsCancel = vi.mocked(clackPrompts.isCancel);
const mockLog = vi.mocked(clackPrompts.log);
const mockMultiselect = vi.mocked(clackPrompts.multiselect);

function component(name: string, framework: "astro" | "react"): ComponentConfig {
  return {
    name,
    version: "1.0.0",
    framework,
    registry: "default",
  };
}

function runtimeConfig(overrides: Partial<StarwindConfig> = {}): StarwindConfig {
  return {
    $schema: "https://starwind.dev/config-schema.v2.json",
    version: 2,
    framework: "astro",
    registry: {
      source: "bundled",
      version: "0.1.0",
    },
    tailwind: {
      css: "src/styles/starwind.css",
      baseColor: "neutral",
      cssVariables: true,
    },
    componentDir: "src/components/starwind",
    componentDirs: {
      react: "src/components/starwind-react",
    },
    utilsDir: "src/lib/utils",
    components: [],
    ...overrides,
  };
}

describe.sequential("remove command", () => {
  let projectDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConfirm.mockResolvedValue(true);
    mockIsCancel.mockReturnValue(false);

    projectDir = await mkdtemp(join(tmpdir(), "starwind-remove-test-"));
    previousCwd = process.cwd();
    process.chdir(projectDir);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(projectDir, { recursive: true, force: true });
  });

  it("removes only the configured primary framework by default", async () => {
    await writeConfig(
      runtimeConfig({
        components: [component("button", "astro"), component("button", "react")],
      }),
    );
    const astroFile = await writeComponent("src/components/starwind", "button", "Button.astro");
    const reactFile = await writeComponent("src/components/starwind-react", "button", "index.tsx");

    await remove(["button"]);

    await expect(stat(astroFile)).rejects.toThrow();
    await expect(readFile(reactFile, "utf-8")).resolves.toBe("component\n");
    expect((await readConfig()).components).toEqual([component("button", "react")]);
  });

  it("removes an explicit React target from componentDirs.react", async () => {
    await writeConfig(
      runtimeConfig({
        components: [component("button", "astro"), component("button", "react")],
      }),
    );
    const astroFile = await writeComponent("src/components/starwind", "button", "Button.astro");
    const reactFile = await writeComponent("src/components/starwind-react", "button", "index.tsx");

    await remove(["button"], { framework: "react" });

    await expect(readFile(astroFile, "utf-8")).resolves.toBe("component\n");
    await expect(stat(reactFile)).rejects.toThrow();
    expect((await readConfig()).components).toEqual([component("button", "astro")]);
  });

  it("removes every installed framework record for a selected name and disambiguates summaries", async () => {
    await writeConfig(
      runtimeConfig({
        components: [component("button", "astro"), component("button", "react")],
      }),
    );
    const astroFile = await writeComponent("src/components/starwind", "button", "Button.astro");
    const reactFile = await writeComponent("src/components/starwind-react", "button", "index.tsx");

    await remove(["button"], { framework: "all" });

    await expect(stat(astroFile)).rejects.toThrow();
    await expect(stat(reactFile)).rejects.toThrow();
    expect((await readConfig()).components).toEqual([]);
    expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("button [astro]"));
    expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("button [react]"));
  });

  it("keeps --all scoped to the explicit React framework", async () => {
    await writeConfig(
      runtimeConfig({
        components: [
          component("button", "astro"),
          component("button", "react"),
          component("card", "astro"),
          component("card", "react"),
        ],
      }),
    );
    const astroButton = await writeComponent("src/components/starwind", "button", "Button.astro");
    const astroCard = await writeComponent("src/components/starwind", "card", "Card.astro");
    const reactButton = await writeComponent(
      "src/components/starwind-react",
      "button",
      "index.tsx",
    );
    const reactCard = await writeComponent("src/components/starwind-react", "card", "index.tsx");

    await remove(undefined, { all: true, framework: "react" });

    await expect(readFile(astroButton, "utf-8")).resolves.toBe("component\n");
    await expect(readFile(astroCard, "utf-8")).resolves.toBe("component\n");
    await expect(stat(reactButton)).rejects.toThrow();
    await expect(stat(reactCard)).rejects.toThrow();
    expect((await readConfig()).components).toEqual([
      component("button", "astro"),
      component("card", "astro"),
    ]);
  });

  it("deduplicates repeated config records before deleting a framework target", async () => {
    await writeConfig(
      runtimeConfig({
        components: [component("button", "react"), component("button", "react")],
      }),
    );
    const reactFile = await writeComponent("src/components/starwind-react", "button", "index.tsx");

    await remove(undefined, { all: true, framework: "react" });

    await expect(stat(reactFile)).rejects.toThrow();
    expect((await readConfig()).components).toEqual([]);
    expect(mockLog.error).not.toHaveBeenCalledWith(
      expect.stringContaining("Failed to remove components"),
    );
  });

  it("retains the exact config record whose filesystem removal failed", async () => {
    await writeConfig(
      runtimeConfig({
        components: [component("button", "astro"), component("button", "react")],
      }),
    );
    const astroFile = await writeComponent("src/components/starwind", "button", "Button.astro");

    await remove(["button"], { framework: "all" });

    await expect(stat(astroFile)).rejects.toThrow();
    expect((await readConfig()).components).toEqual([component("button", "react")]);
    expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("button [astro]"));
    expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining("button [react]"));
  });

  it("does not rewrite config and exits with an error when every removal fails", async () => {
    const config = runtimeConfig({ components: [component("button", "react")] });
    const originalConfig = `${JSON.stringify(config)}\n`;
    await writeFile("starwind.config.json", originalConfig, "utf-8");
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(remove(["button"], { framework: "react" })).rejects.toThrow(
        "process.exit called",
      );

      await expect(readFile("starwind.config.json", "utf-8")).resolves.toBe(originalConfig);
      expect(exitSpy).toHaveBeenCalledWith(1);
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("reads config successfully before any removal mutation", async () => {
    const invalidConfig = runtimeConfig({
      registry: {
        source: "bundled",
        version: "not-semver",
      },
      components: [component("button", "astro")],
    });
    const originalConfig = `${JSON.stringify(invalidConfig)}\n`;
    await writeFile("starwind.config.json", originalConfig, "utf-8");
    const astroFile = await writeComponent("src/components/starwind", "button", "Button.astro");
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(remove(["button"])).rejects.toThrow("process.exit called");

      await expect(readFile(astroFile, "utf-8")).resolves.toBe("component\n");
      await expect(readFile("starwind.config.json", "utf-8")).resolves.toBe(originalConfig);
      expect(mockConfirm).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("ties legacy records to the Astro primary framework and resolved public folder", async () => {
    await writeFile(
      "starwind.config.json",
      `${JSON.stringify({
        $schema: "https://starwind.dev/config-schema.json",
        tailwind: {
          css: "src/styles/starwind.css",
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: "src/components",
        components: [{ name: "button", version: "1.0.0" }],
      })}\n`,
      "utf-8",
    );
    const astroFile = await writeComponent("src/components/starwind", "button", "Button.astro");

    await remove(["button"]);

    await expect(stat(astroFile)).rejects.toThrow();
    expect((await readConfig()).components).toEqual([]);
    expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("button [astro]"));
  });

  it("shows qualified interactive choices only when duplicate names need disambiguation", async () => {
    await writeConfig(
      runtimeConfig({
        components: [
          component("button", "astro"),
          component("button", "react"),
          component("card", "react"),
        ],
      }),
    );
    const astroButton = await writeComponent("src/components/starwind", "button", "Button.astro");
    const reactButton = await writeComponent(
      "src/components/starwind-react",
      "button",
      "index.tsx",
    );
    mockMultiselect.mockResolvedValue(["react:button"]);

    await remove(undefined, { framework: "all" });

    expect(mockMultiselect).toHaveBeenCalledWith({
      message: "Select components to remove",
      options: [
        { value: "astro:button", label: "button [astro]" },
        { value: "react:button", label: "button [react]" },
        { value: "react:card", label: "card" },
      ],
    });
    await expect(readFile(astroButton, "utf-8")).resolves.toBe("component\n");
    await expect(stat(reactButton)).rejects.toThrow();
    expect((await readConfig()).components).toEqual([
      component("button", "astro"),
      component("card", "react"),
    ]);
  });
});

async function writeConfig(config: StarwindConfig): Promise<void> {
  await writeFile("starwind.config.json", `${JSON.stringify(config, null, 2)}\n`, "utf-8");
}

async function readConfig(): Promise<StarwindConfig> {
  return JSON.parse(await readFile("starwind.config.json", "utf-8")) as StarwindConfig;
}

async function writeComponent(
  componentDir: string,
  name: string,
  filename: string,
): Promise<string> {
  const componentPath = join(process.cwd(), componentDir, name);
  const filePath = join(componentPath, filename);
  await mkdir(componentPath, { recursive: true });
  await writeFile(filePath, "component\n", "utf-8");
  return filePath;
}
