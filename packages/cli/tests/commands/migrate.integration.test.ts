import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { migrate } from "../../src/commands/migrate.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  log: {
    error: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    warning: vi.fn(),
  },
  tasks: vi.fn(async (tasks: Array<{ task: () => Promise<unknown> }>) => {
    for (const task of tasks) {
      await task.task();
    }
  }),
}));

vi.mock("../../src/utils/package-manager.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/utils/package-manager.js")>();

  return {
    ...actual,
    detectPackageManager: vi.fn(() => ({
      name: "pnpm",
      installCmd: "pnpm install",
      addCmd: "pnpm add",
      removeCmd: "pnpm remove",
      runCmd: "pnpm",
    })),
    installDependencies: vi.fn(),
  };
});

vi.mock("../../src/utils/registry.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/utils/registry.js")>();

  return {
    ...actual,
    loadRegistry: vi.fn(),
  };
});

vi.mock("../../src/utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

import * as clackPrompts from "@clack/prompts";

import * as packageManager from "../../src/utils/package-manager.js";
import * as registry from "../../src/utils/registry.js";

const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockLog = vi.mocked(clackPrompts.log);
const mockTasks = vi.mocked(clackPrompts.tasks);
const mockInstallDependencies = vi.mocked(packageManager.installDependencies);
const mockLoadRegistry = vi.mocked(registry.loadRegistry);

const registryFixture: registry.StarwindRegistry = {
  $schema: "https://starwind.dev/registry-schema.v2.json",
  version: "0.1.0",
  components: [
    {
      name: "button",
      version: "2.0.0",
      type: "component",
      dependencies: [],
      targets: {
        astro: {
          files: [
            {
              path: "src/components/starwind/button/Button.astro",
              content: '---\n---\n<button data-slot="button" />\n',
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
        },
      },
    },
    {
      name: "dropdown",
      version: "2.0.0",
      type: "component",
      dependencies: [],
      targets: {
        astro: {
          files: [
            {
              path: "src/components/starwind/dropdown/Dropdown.astro",
              content: '---\n---\n<div data-slot="dropdown" />\n',
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
        },
      },
    },
    {
      name: "menu",
      version: "2.0.0",
      type: "component",
      dependencies: [],
      publicRenames: {
        paths: [{ from: "old-menu", to: "menu" }],
        usages: [{ from: "OldMenu", to: "Menu" }],
      },
      targets: {
        astro: {
          files: [
            {
              path: "src/components/starwind/menu/Menu.astro",
              content: '---\n---\n<div data-slot="menu" />\n',
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
        },
      },
    },
    {
      name: "combobox",
      version: "2.0.0",
      type: "component",
      dependencies: [],
      targets: {
        astro: {
          files: [
            {
              path: "src/components/starwind/combobox/Combobox.astro",
              content: '---\n---\n<div data-slot="combobox" />\n',
            },
          ],
          componentDependencies: ["input-group"],
          packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
        },
      },
    },
    {
      name: "input-group",
      version: "2.0.0",
      type: "component",
      dependencies: [],
      targets: {
        astro: {
          files: [
            {
              path: "src/components/starwind/input-group/InputGroup.astro",
              content: '---\n---\n<div data-slot="input-group" />\n',
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
        },
      },
    },
    {
      name: "color-picker",
      version: "1.2.0",
      type: "component",
      dependencies: [],
      targets: {
        astro: {
          files: [
            {
              path: "src/components/starwind/color-picker/ColorPicker.astro",
              content:
                '---\nimport ColorPickerPrimitive from "@starwind-ui/astro/color-picker";\n---\n<ColorPickerPrimitive.Root data-slot="color-picker" />\n',
            },
          ],
          componentDependencies: ["select"],
          packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
        },
      },
    },
    {
      name: "select",
      version: "2.0.0",
      type: "component",
      dependencies: [],
      targets: {
        astro: {
          files: [
            {
              path: "src/components/starwind/select/Select.astro",
              content: '---\n---\n<div data-slot="select" />\n',
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
        },
      },
    },
  ],
};

async function createDirectoryLink(target: string, linkPath: string): Promise<Error | undefined> {
  try {
    await symlink(target, linkPath, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if (
      process.platform === "win32" &&
      error instanceof Error &&
      "code" in error &&
      error.code === "EPERM"
    ) {
      return error;
    }

    throw error;
  }
}

describe.sequential("migrate command", () => {
  let tempDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConfirm.mockReset();
    mockConfirm.mockResolvedValue(true);

    tempDir = await mkdtemp(join(tmpdir(), "starwind-migrate-test-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);

    await writeFile("package.json", JSON.stringify({ dependencies: {} }), "utf-8");
    await writeLegacyConfig([
      { name: "button", version: "1.0.0" },
      { name: "dropdown", version: "1.0.0" },
    ]);
    await writeComponent(tempDir, "button", "Button.astro", "---\n---\n<button>old</button>\n");
    await writeComponent(
      tempDir,
      "dropdown",
      "Dropdown.astro",
      "---\n---\n<div>old dropdown</div>\n",
    );
    await writeComponent(
      tempDir,
      "my-component",
      "MyComponent.astro",
      "---\n---\n<div>custom</div>\n",
    );

    mockLoadRegistry.mockResolvedValue(registryFixture);
    mockInstallDependencies.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("rejects migration backup writes through an external directory link", async ({ skip }) => {
    const externalDir = await mkdtemp(join(tmpdir(), "starwind-migrate-external-test-"));
    const componentsRoot = join(tempDir, "src", "components");
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    await rm(componentsRoot, { recursive: true, force: true });
    await writeComponent(
      externalDir,
      "button",
      "Button.astro",
      "---\n---\n<button>outside</button>\n",
    );

    try {
      const linkError = await createDirectoryLink(
        join(externalDir, "src", "components"),
        componentsRoot,
      );
      if (linkError) skip(`Windows junction creation failed with EPERM: ${linkError.message}`);

      await expect(migrate({ packageManager: "pnpm", yes: true })).rejects.toThrow(
        "process.exit called",
      );
      await expect(
        readFile(
          join(externalDir, "src", "components", "starwind", "button", "Button.astro"),
          "utf-8",
        ),
      ).resolves.toContain("outside");
      await expect(
        readFile(
          join(externalDir, "src", "components", "starwind-legacy", "button", "Button.astro"),
          "utf-8",
        ),
      ).rejects.toThrow();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(getLoggedOutput()).toMatch(/outside/i);
    } finally {
      exitSpy.mockRestore();
      await rm(externalDir, { recursive: true, force: true });
    }
  });

  it("backs up legacy components, overwrites confirmed conflicts, and writes v2 config", async () => {
    mockConfirm.mockResolvedValue(true);

    await migrate({ packageManager: "pnpm" });

    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-legacy", "button", "Button.astro"),
        "utf-8",
      ),
    ).resolves.toContain("old");
    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "button", "Button.astro"), "utf-8"),
    ).resolves.toContain('data-slot="button"');
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind", "dropdown", "Dropdown.astro"),
        "utf-8",
      ),
    ).resolves.toContain('data-slot="dropdown"');

    const config = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(config).toMatchObject({
      version: 2,
      framework: "astro",
      registry: {
        source: "bundled",
        version: "0.1.0",
      },
      componentDir: "src/components/starwind",
      components: [
        {
          name: "button",
          version: "2.0.0",
          framework: "astro",
        },
        {
          name: "dropdown",
          version: "2.0.0",
          framework: "astro",
          registry: "default",
        },
      ],
    });
    expect(JSON.stringify(config)).not.toContain("dropdown-menu");
    const confirmMessages = mockConfirm.mock.calls.map(([prompt]) => String(prompt.message));
    expect(confirmMessages.join("\n")).not.toContain("dropdown-menu");
    expect(
      confirmMessages.filter((message) =>
        message.startsWith("Overwrite all existing Starwind registry components"),
      ),
    ).toEqual([]);
    expect(confirmMessages[0]).toContain("src/components/starwind-legacy");
    expect(confirmMessages[0]).not.toContain("\\");
    expect(
      confirmMessages.filter(
        (message) =>
          message.startsWith("Overwrite ") &&
          !message.startsWith("Overwrite all existing Starwind registry components"),
      ),
    ).toHaveLength(0);
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/astro@^1.0.0"], "pnpm");
    expect(mockLog.message).toHaveBeenCalledWith(expect.stringContaining("Migration Summary"));
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Backed up legacy components to:"),
    );
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("src/components/starwind-legacy"),
    );
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully migrated all components."),
    );
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("Left custom component folders untouched:"),
    );
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("my-component"));
    expect(getTaskTitles()).toEqual(
      expect.arrayContaining([
        "Backing up existing components",
        "Migrating Starwind components",
        "Updating Starwind configuration",
      ]),
    );
    const loggedOutput = getLoggedOutput();
    expect(loggedOutput).not.toContain("Overwritten");
    expect(loggedOutput).not.toContain("Applied codemods");
    expect(loggedOutput).not.toContain("Skipped codemods");
    expect(loggedOutput).not.toContain("Unavailable codemods");
  });

  it("migrates customized legacy Color Picker and Select components to Runtime versions", async () => {
    await writeLegacyConfig([
      { name: "color-picker", version: "1.0.0" },
      { name: "select", version: "1.0.0" },
    ]);
    await writeComponent(
      tempDir,
      "color-picker",
      "ColorPicker.astro",
      "<script>/* customized legacy color picker */</script>",
    );
    await writeComponent(tempDir, "select", "Select.astro", "<div>legacy select</div>");

    await migrate({ packageManager: "pnpm", yes: true });

    const colorPicker = await readFile(
      join(tempDir, "src", "components", "starwind", "color-picker", "ColorPicker.astro"),
      "utf8",
    );
    expect(colorPicker).toContain("@starwind-ui/astro/color-picker");
    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "select", "Select.astro"), "utf8"),
    ).resolves.toContain('data-slot="select"');

    const config = JSON.parse(await readFile("starwind.config.json", "utf8"));
    expect(config.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "color-picker", framework: "astro", version: "1.2.0" }),
        expect.objectContaining({ name: "select", framework: "astro", version: "2.0.0" }),
      ]),
    );
    expect(config.components).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ source: "legacy" })]),
    );
    expect(getLoggedOutput()).not.toMatch(
      /Color Picker.*legacy|legacy Astro-only|Select remains legacy/,
    );
  });

  it("does not reinstall registry packages already present as local links", async () => {
    await writeFile(
      "package.json",
      JSON.stringify({
        dependencies: {
          "@starwind-ui/astro": "link:../../packages/astro",
        },
      }),
      "utf-8",
    );

    await migrate({ packageManager: "pnpm" });

    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("imports existing components.json Starwind Pro registry settings into migrated config", async () => {
    const componentsJson = JSON.stringify(
      {
        $schema: "https://ui.shadcn.com/schema.json",
        registries: {
          "@starwind-pro": {
            url: "http://localhost:4321/r/{name}",
            headers: {
              Authorization: "Bearer ${LOCAL_STARWIND_KEY}",
            },
            params: {
              channel: "${STARWIND_PRO_CHANNEL}",
            },
          },
          "@other": {
            url: "https://example.com/r/{name}",
          },
        },
      },
      null,
      2,
    );
    await writeFile("components.json", componentsJson, "utf-8");

    await migrate({ packageManager: "pnpm", yes: true });

    const config = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(config.pro).toEqual({
      registry: {
        url: "http://localhost:4321/r/{name}",
        headers: {
          Authorization: "Bearer ${LOCAL_STARWIND_KEY}",
        },
        params: {
          channel: "${STARWIND_PRO_CHANNEL}",
        },
      },
    });
    await expect(readFile("components.json", "utf-8")).resolves.toBe(componentsJson);
  });

  it("leaves refused overwrites in place and records them as legacy-astro", async () => {
    mockConfirm
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await migrate({ packageManager: "pnpm" });

    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "button", "Button.astro"), "utf-8"),
    ).resolves.toContain("old");
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind", "my-component", "MyComponent.astro"),
        "utf-8",
      ),
    ).resolves.toContain("custom");

    const config = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(config.components).toEqual(
      expect.arrayContaining([
        {
          name: "button",
          version: "1.0.0",
          source: "legacy",
        },
        {
          name: "dropdown",
          version: "2.0.0",
          framework: "astro",
          registry: "default",
        },
      ]),
    );
  });

  it("does not migrate projects that are already on v2 config", async () => {
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
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          utilsDir: "src/lib/utils",
          components: [],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await migrate({ packageManager: "pnpm" });

    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("already using"));
    expect(mockLoadRegistry).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("plans dependencies before writing so custom dependency folders can be skipped safely", async () => {
    await writeLegacyConfig([{ name: "combobox", version: "1.0.0" }]);
    await writeComponent(tempDir, "combobox", "Combobox.astro", "---\n---\n<div>old combo</div>\n");
    await writeComponent(
      tempDir,
      "input-group",
      "InputGroup.astro",
      "---\n---\n<div>custom input group</div>\n",
    );
    mockConfirm
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await migrate({ packageManager: "pnpm" });

    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind", "input-group", "InputGroup.astro"),
        "utf-8",
      ),
    ).resolves.toContain("custom input group");
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind", "combobox", "Combobox.astro"),
        "utf-8",
      ),
    ).resolves.toContain('data-slot="combobox"');

    const config = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(config.components).toEqual(
      expect.arrayContaining([
        {
          name: "combobox",
          version: "2.0.0",
          framework: "astro",
          registry: "default",
        },
        {
          name: "input-group",
          version: "0.0.0",
          source: "legacy",
        },
      ]),
    );
  });

  it("records migrated dependencies in config when no custom conflict exists", async () => {
    await writeLegacyConfig([{ name: "combobox", version: "1.0.0" }]);
    await writeComponent(tempDir, "combobox", "Combobox.astro", "---\n---\n<div>old combo</div>\n");
    mockConfirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await migrate({ packageManager: "pnpm" });

    const config = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(config.components).toEqual(
      expect.arrayContaining([
        {
          name: "input-group",
          version: "2.0.0",
          framework: "astro",
          registry: "default",
        },
        {
          name: "combobox",
          version: "2.0.0",
          framework: "astro",
          registry: "default",
        },
      ]),
    );
  });

  it("does not overwrite an existing backup directory without confirmation", async () => {
    const backupFile = join(
      tempDir,
      "src",
      "components",
      "starwind-legacy",
      "button",
      "Button.astro",
    );
    await mkdir(dirname(backupFile), { recursive: true });
    await writeFile(backupFile, "---\n---\n<button>original backup</button>\n", "utf-8");
    mockConfirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await migrate({ packageManager: "pnpm" });

    await expect(readFile(backupFile, "utf-8")).resolves.toContain("original backup");
  });

  it("prompts before applying registry-declared rename codemods", async () => {
    await writeLegacyConfig([{ name: "old-menu", version: "1.0.0" }]);
    await writeComponent(tempDir, "old-menu", "OldMenu.astro", "---\n---\n<div>old menu</div>\n");

    const pagePath = join(tempDir, "src", "pages", "index.astro");
    await mkdir(dirname(pagePath), { recursive: true });
    await writeFile(
      pagePath,
      '---\nimport { OldMenu } from "../components/starwind/old-menu";\n---\n<OldMenu />\n',
      "utf-8",
    );

    mockConfirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await migrate({ packageManager: "pnpm" });

    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "menu", "Menu.astro"), "utf-8"),
    ).resolves.toContain('data-slot="menu"');
    await expect(readFile(pagePath, "utf-8")).resolves.toContain(
      'import { Menu } from "../components/starwind/menu";',
    );
    await expect(readFile(pagePath, "utf-8")).resolves.toContain("<Menu />");

    const config = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(config.components).toEqual([
      {
        name: "menu",
        version: "2.0.0",
        framework: "astro",
        registry: "default",
      },
    ]);
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("old-menu"),
      }),
    );
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("OldMenu"),
      }),
    );
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Updated project imports/usages"),
    );
  });

  it("keeps migrating components when a registry-declared rename codemod is refused", async () => {
    await writeLegacyConfig([{ name: "old-menu", version: "1.0.0" }]);
    await writeComponent(tempDir, "old-menu", "OldMenu.astro", "---\n---\n<div>old menu</div>\n");

    const pagePath = join(tempDir, "src", "pages", "index.astro");
    await mkdir(dirname(pagePath), { recursive: true });
    await writeFile(
      pagePath,
      '---\nimport { OldMenu } from "../components/starwind/old-menu";\n---\n<OldMenu />\n',
      "utf-8",
    );

    mockConfirm.mockResolvedValueOnce(false).mockResolvedValueOnce(false);

    await migrate({ packageManager: "pnpm" });

    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "menu", "Menu.astro"), "utf-8"),
    ).resolves.toContain('data-slot="menu"');
    await expect(readFile(pagePath, "utf-8")).resolves.toContain(
      'import { OldMenu } from "../components/starwind/old-menu";',
    );

    const config = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(config.components).toEqual([
      {
        name: "menu",
        version: "2.0.0",
        framework: "astro",
        registry: "default",
      },
    ]);
    expect(mockLog.warn).toHaveBeenCalledWith(
      expect.stringContaining("Skipped import/usage updates"),
    );
    expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("old-menu -> menu"));
  });

  it("does not codemod alternate backup directories created during migration", async () => {
    await writeLegacyConfig([{ name: "old-menu", version: "1.0.0" }]);
    await writeComponent(
      tempDir,
      "old-menu",
      "OldMenu.astro",
      '---\nconst importPath = "starwind/old-menu";\n---\n<OldMenu data-path={importPath} />\n',
    );

    const existingBackupFile = join(
      tempDir,
      "src",
      "components",
      "starwind-legacy",
      "button",
      "Button.astro",
    );
    await mkdir(dirname(existingBackupFile), { recursive: true });
    await writeFile(existingBackupFile, "---\n---\n<button>existing backup</button>\n", "utf-8");

    const pagePath = join(tempDir, "src", "pages", "index.astro");
    await mkdir(dirname(pagePath), { recursive: true });
    await writeFile(
      pagePath,
      '---\nimport { OldMenu } from "../components/starwind/old-menu";\n---\n<OldMenu />\n',
      "utf-8",
    );

    mockConfirm.mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    await migrate({ packageManager: "pnpm" });

    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-legacy-1", "old-menu", "OldMenu.astro"),
        "utf-8",
      ),
    ).resolves.toContain("starwind/old-menu");
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-legacy-1", "old-menu", "OldMenu.astro"),
        "utf-8",
      ),
    ).resolves.toContain("OldMenu");
    await expect(readFile(pagePath, "utf-8")).resolves.toContain(
      'import { Menu } from "../components/starwind/menu";',
    );
  });

  it("does not codemod any existing legacy backup directory siblings", async () => {
    await writeLegacyConfig([{ name: "old-menu", version: "1.0.0" }]);
    await writeComponent(
      tempDir,
      "old-menu",
      "OldMenu.astro",
      '---\nconst importPath = "starwind/old-menu";\n---\n<OldMenu data-path={importPath} />\n',
    );

    for (const backupName of ["starwind-legacy", "starwind-legacy-1"]) {
      const backupFile = join(
        tempDir,
        "src",
        "components",
        backupName,
        "old-menu",
        "OldMenu.astro",
      );
      await mkdir(dirname(backupFile), { recursive: true });
      await writeFile(
        backupFile,
        '---\nconst importPath = "starwind/old-menu";\n---\n<OldMenu data-path={importPath} />\n',
        "utf-8",
      );
    }

    const pagePath = join(tempDir, "src", "pages", "index.astro");
    await mkdir(dirname(pagePath), { recursive: true });
    await writeFile(
      pagePath,
      '---\nimport { OldMenu } from "../components/starwind/old-menu";\n---\n<OldMenu />\n',
      "utf-8",
    );

    mockConfirm.mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    await migrate({ packageManager: "pnpm" });

    for (const backupName of ["starwind-legacy", "starwind-legacy-1", "starwind-legacy-2"]) {
      const backup = await readFile(
        join(tempDir, "src", "components", backupName, "old-menu", "OldMenu.astro"),
        "utf-8",
      );
      expect(backup).toContain("starwind/old-menu");
      expect(backup).toContain("OldMenu");
    }
    await expect(readFile(pagePath, "utf-8")).resolves.toContain(
      'import { Menu } from "../components/starwind/menu";',
    );
  });

  it("only codemods exact renamed public path segments", async () => {
    await writeLegacyConfig([{ name: "old-menu", version: "1.0.0" }]);
    await writeComponent(tempDir, "old-menu", "OldMenu.astro", "---\n---\n<div>old menu</div>\n");

    const pagePath = join(tempDir, "src", "pages", "index.astro");
    await mkdir(dirname(pagePath), { recursive: true });
    await writeFile(
      pagePath,
      [
        "---",
        'import { OldMenu } from "../components/starwind/old-menu";',
        'import { OldMenuItem } from "../components/starwind/old-menu-item";',
        "---",
        "<OldMenu />",
        "<OldMenuItem />",
        "",
      ].join("\n"),
      "utf-8",
    );

    mockConfirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await migrate({ packageManager: "pnpm" });

    const page = await readFile(pagePath, "utf-8");
    expect(page).toContain('import { Menu } from "../components/starwind/menu";');
    expect(page).toContain('import { OldMenuItem } from "../components/starwind/old-menu-item";');
    expect(page).toContain("<Menu />");
    expect(page).toContain("<OldMenuItem />");
  });
});

async function writeLegacyConfig(components: Array<{ name: string; version: string }>) {
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
        utilsDir: "src/lib/utils",
        components,
      },
      null,
      2,
    ),
    "utf-8",
  );
}

async function writeComponent(root: string, component: string, file: string, content: string) {
  const filePath = join(root, "src", "components", "starwind", component, file);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf-8");
}

function getLoggedOutput(): string {
  return [
    ...mockLog.error.mock.calls,
    ...mockLog.info.mock.calls,
    ...mockLog.message.mock.calls,
    ...mockLog.success.mock.calls,
    ...mockLog.warn.mock.calls,
    ...mockLog.warning.mock.calls,
  ]
    .flat()
    .map(String)
    .join("\n");
}

function getTaskTitles(): string[] {
  return mockTasks.mock.calls.flatMap(([tasks]) =>
    (tasks as Array<{ title: string }>).map((task) => task.title),
  );
}
