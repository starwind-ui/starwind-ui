import * as p from "@clack/prompts";
import fs from "fs-extra";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as astroConfig from "../../src/utils/astro-config.js";
import * as packageManager from "../../src/utils/package-manager.js";
import * as projectPath from "../../src/utils/project-path.js";
import {
  ensureAstroVueIntegration,
  inspectAstroVueConfig,
  preflightAstroVueIntegration,
  setupAstroVueConfig,
  updateAstroVueConfigContent,
} from "../../src/utils/astro-vue-integration.js";

vi.mock("@clack/prompts");
vi.mock("fs-extra");
vi.mock("../../src/utils/astro-config.js");
vi.mock("../../src/utils/package-manager.js");
vi.mock("../../src/utils/project-path.js");

const mockFindConfig = vi.mocked(astroConfig.findAstroConfig);
const mockInstall = vi.mocked(packageManager.installDependencies);
const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);

describe("Astro Vue integration", () => {
  const baseConfig =
    'import { defineConfig } from "astro/config";\nexport default defineConfig({ output: "static", integrations: [] });\n';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(p.isCancel).mockReturnValue(false);
    vi.mocked(p.confirm).mockResolvedValue(true);
    mockFindConfig.mockResolvedValue("astro.config.ts");
    mockReadFile.mockResolvedValue(baseConfig as never);
    mockWriteFile.mockResolvedValue(undefined);
    vi.mocked(projectPath.resolveProjectMutationPath).mockImplementation(
      async (filePath) => filePath,
    );
  });

  it("detects configured imports and ignores nested calls", () => {
    expect(
      inspectAstroVueConfig(
        'import renderer from "@astrojs/vue";\nexport default defineConfig({ integrations: [renderer({ include: ["src/**"], appEntrypoint: getApp() })] });',
      ),
    ).toEqual({ status: "ready" });
    expect(
      inspectAstroVueConfig(
        'import vue from "@astrojs/vue";\nexport default defineConfig({ integrations: [[vue()]] });',
      ),
    ).toEqual({ status: "configurable" });
  });

  it("adds vue() idempotently and preserves existing Astro settings", () => {
    const updated = updateAstroVueConfigContent(baseConfig);
    expect(updated).toContain('import vue from "@astrojs/vue"');
    expect(updated).toContain('output: "static"');
    expect(updated).toContain("integrations: [vue()]");
    expect(updateAstroVueConfigContent(updated!)).toBe(updated);
  });

  it("rejects computed top-level keys without changing source", () => {
    const source = `import { defineConfig } from "astro/config";
const key = "integrations";
export default defineConfig({
  [key]: [],
});
`;

    expect(inspectAstroVueConfig(source)).toEqual(
      expect.objectContaining({ status: "manual-action-required" }),
    );
    expect(updateAstroVueConfigContent(source)).toBeNull();
  });

  it("rejects an integrations shorthand before adding another property", () => {
    const source = `import { defineConfig } from "astro/config";
const integrations = [];
export default defineConfig({ integrations });
`;

    expect(inspectAstroVueConfig(source)).toEqual(
      expect.objectContaining({ status: "manual-action-required" }),
    );
    expect(updateAstroVueConfigContent(source)).toBeNull();
  });

  it("preserves string, comment, and template decoys while adding the integration", () => {
    const source = `import { defineConfig } from "astro/config";
const note = "integrations: [vue()]";
const template = \`integrations: [vue()]\`;
export default defineConfig({
  // integrations: [vue()]
  output: "static",
});
`;

    const updated = updateAstroVueConfigContent(source);

    expect(updated).toContain('const note = "integrations: [vue()]";');
    expect(updated).toContain("const template = `integrations: [vue()]`;");
    expect(updated).toContain("// integrations: [vue()]");
    expect(updated).toContain("integrations: [vue()]");
  });
  it("reports configured and configurable states from dependency and config evidence", async () => {
    mockReadFile.mockResolvedValue(
      'import vue from "@astrojs/vue";\nexport default defineConfig({ integrations: [vue()] });' as never,
    );
    await expect(
      preflightAstroVueIntegration({
        dependencies: { "@astrojs/vue": "^5.1.5", astro: "^7", vue: "^3.5" },
      }),
    ).resolves.toEqual({ status: "ready", packages: [] });

    mockReadFile.mockResolvedValue(baseConfig as never);
    await expect(preflightAstroVueIntegration({ dependencies: { astro: "^7" } })).resolves.toEqual({
      status: "configurable",
      packages: ["@astrojs/vue"],
    });
  });

  it("installs the official integration and updates config once", async () => {
    await expect(
      ensureAstroVueIntegration({
        packageManager: "pnpm",
        projectPackage: { dependencies: { astro: "^7" } },
        skipPrompts: true,
      }),
    ).resolves.toEqual({ status: "configured" });
    expect(mockInstall).toHaveBeenCalledWith(["@astrojs/vue"], "pnpm");
    expect(mockWriteFile).toHaveBeenCalledWith(
      "astro.config.ts",
      expect.stringContaining("integrations: [vue()]"),
      "utf8",
    );

    vi.clearAllMocks();
    mockFindConfig.mockResolvedValue("astro.config.ts");
    mockReadFile.mockResolvedValue(
      'import vue from "@astrojs/vue";\nexport default defineConfig({ integrations: [vue()] });' as never,
    );
    await expect(
      ensureAstroVueIntegration({
        packageManager: "pnpm",
        projectPackage: {
          dependencies: { "@astrojs/vue": "^5.1.5", astro: "^7", vue: "^3.5" },
        },
        skipPrompts: true,
      }),
    ).resolves.toEqual({ status: "ready" });
    expect(mockInstall).not.toHaveBeenCalled();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("preserves files when the config shape needs manual action", async () => {
    mockReadFile.mockResolvedValue(
      "export default defineConfig(() => ({ integrations: [] }));" as never,
    );
    await expect(setupAstroVueConfig()).resolves.toBe(false);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
