import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PATHS } from "../../utils/constants.js";
import { setup } from "../setup.js";

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

vi.mock("../../utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../init.js", () => ({
  init: vi.fn(),
}));

const mockTasks = vi.mocked(clackPrompts.tasks);

function runTasksSequentially(tasks: Array<{ task?: () => Promise<unknown> }>) {
  return Promise.all(tasks.map(async (task) => task.task?.()));
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
          $schema: "https://starwind.dev/config-schema.json",
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
  });

  it("writes real Starwind Pro files using project config", async () => {
    await setup({ yes: true, pro: true });

    const componentsJson = JSON.parse(await readFile(join(tempDir, "components.json"), "utf-8"));
    const envLocal = await readFile(join(tempDir, ".env.local"), "utf-8");
    const gitignore = await readFile(join(tempDir, ".gitignore"), "utf-8");

    expect(componentsJson.tailwind.css).toBe("src/styles/globals.css");
    expect(componentsJson.tailwind.baseColor).toBe("stone");
    expect(componentsJson.registries["@starwind-pro"].url).toBe(PATHS.STARWIND_PRO_REGISTRY);

    expect(envLocal).toContain("STARWIND_LICENSE_KEY=");
    expect(gitignore).toContain(".env.local");
  });
});
