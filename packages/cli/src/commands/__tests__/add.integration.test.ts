import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { add } from "../add.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  tasks: vi.fn(),
  note: vi.fn(),
  multiselect: vi.fn(),
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

vi.mock("../../utils/install.js", () => ({
  installComponent: vi.fn(),
}));

vi.mock("../../utils/registry.js", () => ({
  getAllComponents: vi.fn(),
}));

vi.mock("../../utils/validate.js", () => ({
  isValidComponent: vi.fn(),
}));

import { installComponent } from "../../utils/install.js";
import { getAllComponents } from "../../utils/registry.js";
import { isValidComponent } from "../../utils/validate.js";

const mockInstallComponent = vi.mocked(installComponent);
const mockGetAllComponents = vi.mocked(getAllComponents);
const mockIsValidComponent = vi.mocked(isValidComponent);

describe.sequential("add command integration", () => {
  let tempDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "starwind-add-test-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);

    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.json",
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
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

    mockGetAllComponents.mockResolvedValue([
      { name: "button", version: "2.1.0", dependencies: [], type: "component" },
    ]);
    mockIsValidComponent.mockResolvedValue(true);
    mockInstallComponent.mockResolvedValue({
      status: "installed",
      name: "button",
      version: "2.1.0",
    });
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it("updates starwind.config.json with installed component using real config utils", async () => {
    await add(["button"], { yes: true });

    const updatedConfig = JSON.parse(await readFile(join(tempDir, "starwind.config.json"), "utf-8"));

    expect(updatedConfig.components).toEqual([{ name: "button", version: "2.1.0" }]);
  });

  it("deduplicates components across repeated installs using real updateConfig behavior", async () => {
    await add(["button"], { yes: true });
    await add(["button"], { yes: true });

    const updatedConfig = JSON.parse(await readFile(join(tempDir, "starwind.config.json"), "utf-8"));

    expect(updatedConfig.components).toEqual([{ name: "button", version: "2.1.0" }]);
  });
});
