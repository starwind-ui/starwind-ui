import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Task } from "@clack/prompts";
import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CONFIG_SCHEMA_V2_URL } from "../../src/utils/config.js";
import { setup } from "../../src/commands/setup.js";

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

vi.mock("../../src/utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/commands/init.js", () => ({
  init: vi.fn(),
}));

const mockTasks = vi.mocked(clackPrompts.tasks);

async function runTasksSequentially(tasks: Task[]) {
  for (const task of tasks) {
    await task.task(() => {});
  }
}

describe.sequential("setup command integration", () => {
  let tempDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "starwind-setup-test-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);

    mockTasks.mockImplementation(runTasksSequentially);

    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: CONFIG_SCHEMA_V2_URL,
          version: 2,
          framework: "astro",
          registry: {
            source: "bundled",
            version: "0.1.0",
          },
          tailwind: {
            css: "src/styles/globals.css",
            baseColor: "stone",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          components: [],
        },
        null,
        2,
      ),
      "utf-8",
    );
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("writes real Starwind Pro files using project config", async () => {
    await setup({ yes: true, pro: true });

    const starwindConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    const envLocal = await readFile(join(tempDir, ".env.local"), "utf-8");
    const gitignore = await readFile(join(tempDir, ".gitignore"), "utf-8");

    expect(starwindConfig.pro).toEqual({
      registry: {
        headers: {
          Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
        },
      },
    });
    expect(starwindConfig.pro.registry).not.toHaveProperty("url");
    await expect(readFile(join(tempDir, "components.json"), "utf-8")).rejects.toThrow();

    expect(envLocal).toContain("STARWIND_LICENSE_KEY=");
    expect(gitignore).toContain(".env.local");
  });

  it("adds paid auth to a partial Pro config and leaves unrelated components.json untouched", async () => {
    const starwindConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    starwindConfig.pro = {
      registry: {
        url: "http://localhost:4321/r/{name}",
        headers: {
          "X-Registry-Mode": "preview",
        },
        params: {
          channel: "dev",
        },
      },
    };
    await writeFile("starwind.config.json", JSON.stringify(starwindConfig, null, 2), "utf-8");

    const componentsJson = JSON.stringify(
      {
        style: "new-york",
        tailwind: {
          css: "src/styles/globals.css",
        },
      },
      null,
      2,
    );
    await writeFile("components.json", componentsJson, "utf-8");

    await setup({ yes: true, pro: true });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );

    expect(updatedConfig.pro).toEqual({
      registry: {
        url: "http://localhost:4321/r/{name}",
        headers: {
          "X-Registry-Mode": "preview",
          Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
        },
        params: {
          channel: "dev",
        },
      },
    });
    await expect(readFile(join(tempDir, "components.json"), "utf-8")).resolves.toBe(componentsJson);
  });

  it("reports malformed config without rewriting config or environment files", async () => {
    const malformedConfig = Buffer.from(
      '{\r\n  "$schema": "https://starwind.dev/config-schema.v2.json",\r\n',
    );
    const envLocal = Buffer.from("STARWIND_LICENSE_KEY=existing\r\n");
    const gitignore = Buffer.from("# existing entries\r\n");
    await writeFile("starwind.config.json", malformedConfig);
    await writeFile(".env.local", envLocal);
    await writeFile(".gitignore", gitignore);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    await expect(setup({ yes: true, pro: true })).rejects.toThrow("process.exit called");

    expect(clackPrompts.log.error).toHaveBeenCalledWith(
      expect.stringMatching(/starwind\.config\.json/),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    await expect(readFile("starwind.config.json")).resolves.toEqual(malformedConfig);
    await expect(readFile(".env.local")).resolves.toEqual(envLocal);
    await expect(readFile(".gitignore")).resolves.toEqual(gitignore);
  });
});
