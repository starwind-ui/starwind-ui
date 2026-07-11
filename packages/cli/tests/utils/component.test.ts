import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { removeComponent } from "../../src/utils/component.js";
import { parseCurrentConfig } from "../../src/utils/config.js";

const currentConfig = {
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
  components: [],
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

describe("config mutation directories", () => {
  it.each([
    ["componentDir", { componentDir: "../outside" }],
    ["componentDirs.react", { componentDirs: { react: "C:\\outside" } }],
    ["primitiveDir", { primitiveDir: "/outside" }],
    ["primitiveDirs.react", { primitiveDirs: { react: "src/../../outside" } }],
    ["utilsDir", { utilsDir: "\\\\server\\share\\outside" }],
  ])("rejects an unsafe %s", (field, overrides) => {
    expect(() => parseCurrentConfig({ ...currentConfig, ...overrides })).toThrow(
      new RegExp(field.replace(".", "\\.")),
    );
  });

  it.each([
    [
      "component name",
      {
        components: [
          {
            name: "../button",
            version: "1.0.0",
            framework: "astro",
            registry: "default",
          },
        ],
      },
    ],
    [
      "primitive name",
      {
        primitives: [
          {
            name: ".",
            version: "1.0.0",
            framework: "astro",
            source: "bundled",
          },
        ],
      },
    ],
  ])("rejects an unsafe config %s", (field, overrides) => {
    expect(() => parseCurrentConfig({ ...currentConfig, ...overrides })).toThrow(new RegExp(field));
  });
});

describe.sequential("removeComponent", () => {
  let projectDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    projectDir = await mkdtemp(join(tmpdir(), "starwind-component-test-"));
    previousCwd = process.cwd();
    process.chdir(projectDir);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(projectDir, { recursive: true, force: true });
  });

  it("removes components from v2 public component directories without appending starwind twice", async () => {
    const componentPath = join(projectDir, "src", "components", "starwind", "tooltip");
    await mkdir(componentPath, { recursive: true });
    await writeFile(join(componentPath, "tooltip.astro"), "---\n---\n<div />\n", "utf-8");

    const result = await removeComponent({
      name: "tooltip",
      framework: "astro",
      componentDir: "src/components/starwind",
    });

    expect(result).toEqual({
      componentDir: "src/components/starwind",
      name: "tooltip",
      framework: "astro",
      status: "removed",
    });
    await expect(readFile(join(componentPath, "tooltip.astro"), "utf-8")).rejects.toThrow();
  });

  it("removes components from a resolved legacy public starwind folder", async () => {
    const componentPath = join(projectDir, "src", "components", "starwind", "button");
    await mkdir(componentPath, { recursive: true });
    await writeFile(join(componentPath, "Button.astro"), "---\n---\n<button />\n", "utf-8");

    const result = await removeComponent({
      name: "button",
      framework: "astro",
      componentDir: "src/components/starwind",
    });

    expect(result).toEqual({
      componentDir: "src/components/starwind",
      name: "button",
      framework: "astro",
      status: "removed",
    });
    await expect(readFile(join(componentPath, "Button.astro"), "utf-8")).rejects.toThrow();
  });

  it("normalizes alias component roots before removal", async () => {
    const componentPath = join(projectDir, "src", "components", "starwind", "card");
    await mkdir(componentPath, { recursive: true });
    await writeFile(join(componentPath, "Card.astro"), "---\n---\n<div />\n", "utf-8");

    const result = await removeComponent({
      name: "card",
      framework: "astro",
      componentDir: "@/components/starwind",
    });

    expect(result).toEqual({
      componentDir: "@/components/starwind",
      name: "card",
      framework: "astro",
      status: "removed",
    });
  });

  it("removes duplicate names independently from framework-specific component directories", async () => {
    const astroPath = join(projectDir, "src", "components", "starwind", "button");
    const reactPath = join(projectDir, "src", "components", "starwind-react", "button");
    await mkdir(astroPath, { recursive: true });
    await mkdir(reactPath, { recursive: true });
    await writeFile(join(astroPath, "Button.astro"), "astro\n", "utf-8");
    await writeFile(join(reactPath, "index.tsx"), "react\n", "utf-8");

    const reactResult = await removeComponent({
      name: "button",
      framework: "react",
      componentDir: "src/components/starwind-react",
    });

    expect(reactResult).toEqual({
      componentDir: "src/components/starwind-react",
      name: "button",
      framework: "react",
      status: "removed",
    });
    await expect(readFile(join(astroPath, "Button.astro"), "utf-8")).resolves.toBe("astro\n");
    await expect(readFile(join(reactPath, "index.tsx"), "utf-8")).rejects.toThrow();
  });

  it("returns a failed result when the component directory is missing", async () => {
    const result = await removeComponent({
      name: "missing",
      framework: "react",
      componentDir: "src/components/starwind-react",
    });

    expect(result).toEqual({
      componentDir: "src/components/starwind-react",
      name: "missing",
      framework: "react",
      status: "failed",
      error: "Component directory not found",
    });
  });

  it.each([".", "..", "../outside", "nested/component", "nested\\component"])(
    "rejects unsafe removal name %s",
    async (name) => {
      const result = await removeComponent({
        name,
        framework: "astro",
        componentDir: "src/components/starwind",
      });

      expect(result).toEqual({
        componentDir: "src/components/starwind",
        name,
        framework: "astro",
        status: "failed",
        error: expect.stringMatching(/component name/i),
      });
    },
  );

  it("rejects an external component directory before recursive removal", async () => {
    const externalDir = await mkdtemp(join(tmpdir(), "starwind-component-external-test-"));
    const externalComponent = join(externalDir, "starwind", "button");
    const externalFile = join(externalComponent, "Button.astro");
    await mkdir(externalComponent, { recursive: true });
    await writeFile(externalFile, "outside\n", "utf-8");

    try {
      const result = await removeComponent({
        name: "button",
        framework: "astro",
        componentDir: relative(projectDir, externalDir),
      });

      expect(result).toEqual({
        componentDir: relative(projectDir, externalDir),
        name: "button",
        framework: "astro",
        status: "failed",
        error: expect.stringMatching(/inside/i),
      });
      await expect(readFile(externalFile, "utf-8")).resolves.toBe("outside\n");
    } finally {
      await rm(externalDir, { recursive: true, force: true });
    }
  });

  it("rejects recursive removal when the final component directory links outside", async ({
    skip,
  }) => {
    const externalDir = await mkdtemp(join(tmpdir(), "starwind-component-link-test-"));
    const externalFile = join(externalDir, "Button.astro");
    const componentRoot = join(projectDir, "src", "components", "starwind");
    const linkedComponent = join(componentRoot, "button");
    await writeFile(externalFile, "outside\n", "utf-8");
    await mkdir(componentRoot, { recursive: true });

    try {
      const linkError = await createDirectoryLink(externalDir, linkedComponent);
      if (linkError) skip(`Windows junction creation failed with EPERM: ${linkError.message}`);

      const result = await removeComponent({
        name: "button",
        framework: "astro",
        componentDir: "src/components/starwind",
      });

      expect(result).toEqual({
        componentDir: "src/components/starwind",
        name: "button",
        framework: "astro",
        status: "failed",
        error: expect.stringMatching(/symbolic link|junction/i),
      });
      await expect(readFile(externalFile, "utf-8")).resolves.toBe("outside\n");
    } finally {
      await rm(externalDir, { recursive: true, force: true });
    }
  });
});
