import * as p from "@clack/prompts";
import fs from "fs-extra";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as astroConfig from "../../src/utils/astro-config.js";
import { ASTRO_INTEGRATION_RANGES } from "../../src/utils/astro-integration-version.js";
import {
  ensureAstroSvelteIntegration,
  inspectAstroSvelteConfig,
  preflightAstroSvelteIntegration,
  setupAstroSvelteConfig,
  updateAstroSvelteConfigContent,
} from "../../src/utils/astro-svelte-integration.js";
import * as packageManager from "../../src/utils/package-manager.js";
import * as projectPath from "../../src/utils/project-path.js";

vi.mock("@clack/prompts");
vi.mock("fs-extra");
vi.mock("../../src/utils/astro-config.js");
vi.mock("../../src/utils/package-manager.js");
vi.mock("../../src/utils/project-path.js");

const mockFindConfig = vi.mocked(astroConfig.findAstroConfig);
const mockInstall = vi.mocked(packageManager.installDependencies);
const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);

describe("Astro Svelte integration", () => {
  const baseConfig =
    'import { defineConfig } from "astro/config";\nexport default defineConfig({ output: "static", integrations: [] });\n';
  const configuredConfig =
    'import svelte from "@astrojs/svelte";\nexport default defineConfig({ integrations: [svelte()] });';

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

  it("maps each Astro major to the integration major that supports it", () => {
    expect(ASTRO_INTEGRATION_RANGES["@astrojs/svelte"]).toEqual({
      5: "^7.2.5",
      6: "^8.1.2",
      7: "^9.1.2",
    });
  });

  it("detects configured imports and ignores nested calls", () => {
    expect(
      inspectAstroSvelteConfig(
        'import renderer from "@astrojs/svelte";\nexport default defineConfig({ integrations: [renderer({ extensions: [".svelte"] })] });',
      ),
    ).toEqual({ status: "ready" });
    expect(
      inspectAstroSvelteConfig(
        'import svelte from "@astrojs/svelte";\nexport default defineConfig({ integrations: [[svelte()]] });',
      ),
    ).toEqual({ status: "configurable" });
  });

  it("follows an aliased defineConfig import", () => {
    const source =
      'import { defineConfig as config } from "astro/config";\nimport svelte from "@astrojs/svelte";\nexport default config({ integrations: [svelte()] });\n';
    expect(inspectAstroSvelteConfig(source)).toEqual({ status: "ready" });
    expect(updateAstroSvelteConfigContent(source)).toBe(source);
  });

  it("adds svelte() idempotently and preserves existing Astro settings", () => {
    const updated = updateAstroSvelteConfigContent(baseConfig);
    expect(updated).toContain('import svelte from "@astrojs/svelte"');
    expect(updated).toContain('output: "static"');
    expect(updated).toContain("integrations: [svelte()]");
    expect(updateAstroSvelteConfigContent(updated!)).toBe(updated);
  });

  it("adds the integration to a config without an integrations array", () => {
    const updated = updateAstroSvelteConfigContent(
      'import { defineConfig } from "astro/config";\nexport default defineConfig({});\n',
    );
    expect(updated).toContain("integrations: [svelte()]");
  });

  it("keeps other integrations and picks a free local name", () => {
    const updated = updateAstroSvelteConfigContent(
      'import { defineConfig } from "astro/config";\nimport mdx from "@astrojs/mdx";\nconst svelte = 1;\nexport default defineConfig({ integrations: [mdx()] });\n',
    );
    expect(updated).toContain('import astroSvelte from "@astrojs/svelte"');
    expect(updated).toContain("integrations: [astroSvelte(), mdx()]");
  });

  it("rejects an integrations shorthand before adding another property", () => {
    const source = `import { defineConfig } from "astro/config";
const integrations = [];
export default defineConfig({ integrations });
`;

    expect(inspectAstroSvelteConfig(source)).toEqual(
      expect.objectContaining({ status: "manual-action-required" }),
    );
    expect(updateAstroSvelteConfigContent(source)).toBeNull();
  });

  it("reports configured and configurable states from dependency and config evidence", async () => {
    mockReadFile.mockResolvedValue(configuredConfig as never);
    await expect(
      preflightAstroSvelteIntegration({
        dependencies: { "@astrojs/svelte": "^9.1.2", astro: "^7", svelte: "^5.43.6" },
      }),
    ).resolves.toEqual({ status: "ready", packages: [] });

    mockReadFile.mockResolvedValue(baseConfig as never);
    await expect(
      preflightAstroSvelteIntegration({ dependencies: { astro: "^7" } }),
    ).resolves.toEqual({ status: "configurable", packages: ["@astrojs/svelte@^9.1.2"] });
  });

  it.each([
    ["^5.17.0", "@astrojs/svelte@^7.2.5"],
    ["^6.1.0", "@astrojs/svelte@^8.1.2"],
    ["^7.0.0", "@astrojs/svelte@^9.1.2"],
  ])("selects the integration major for Astro %s", async (astro, integration) => {
    await expect(
      preflightAstroSvelteIntegration({ dependencies: { astro } }, async () => undefined),
    ).resolves.toEqual({ status: "configurable", packages: [integration] });
  });

  it("prefers the installed Astro version over a declared range", async () => {
    await expect(
      preflightAstroSvelteIntegration({ dependencies: { astro: ">=5" } }, async (name) =>
        name === "astro" ? "6.2.0" : undefined,
      ),
    ).resolves.toEqual({ status: "configurable", packages: ["@astrojs/svelte@^8.1.2"] });
  });

  it.each([
    ["Astro 5 with the Astro 6 integration", "^5.17.0", "^8.1.2", "@astrojs/svelte@^7.2.5"],
    ["Astro 6 with the Astro 5 integration", "^6.1.0", "^7.2.5", "@astrojs/svelte@^8.1.2"],
    ["Astro 7 with an older Astro 7 integration", "^7.0.0", "^9.0.0", "@astrojs/svelte@^9.1.2"],
  ])("replaces an integration that does not fit: %s", async (_name, astro, declared, expected) => {
    mockReadFile.mockResolvedValue(configuredConfig as never);
    await expect(
      preflightAstroSvelteIntegration(
        { dependencies: { "@astrojs/svelte": declared, astro } },
        async () => undefined,
      ),
    ).resolves.toEqual({ status: "configurable", packages: [expected] });
  });

  it("keeps a configured integration when Astro cannot be read", async () => {
    mockReadFile.mockResolvedValue(configuredConfig as never);
    await expect(
      preflightAstroSvelteIntegration(
        { dependencies: { "@astrojs/svelte": "^8.1.2", astro: ">=5" } },
        async () => undefined,
      ),
    ).resolves.toEqual({ status: "ready", packages: [] });
  });

  it.each([
    ["no Astro declaration", {}, "could not read an installed Astro version"],
    ["a range across majors", { astro: ">=5" }, "spans multiple supported majors"],
    ["an unsupported Astro", { astro: "^4.0.0" }, "Astro 5, 6, and 7"],
  ])("asks for manual action with %s", async (_name, dependencies, guidance) => {
    await expect(
      preflightAstroSvelteIntegration({ dependencies }, async () => undefined),
    ).resolves.toEqual({
      status: "manual-action-required",
      guidance: expect.stringContaining(guidance),
    });
  });

  describe("TypeScript peer of the Astro 5 integration", () => {
    it.each([
      ["declares no TypeScript", {}],
      ["declares TypeScript 5", { typescript: "^5.9.3" }],
    ])("installs the integration when the project %s", async (_name, extra) => {
      await expect(
        preflightAstroSvelteIntegration(
          { dependencies: { astro: "^5.17.0" }, devDependencies: extra },
          async () => undefined,
        ),
      ).resolves.toEqual({ status: "configurable", packages: ["@astrojs/svelte@^7.2.5"] });
    });

    it.each([
      ["declared", { typescript: "^6.0.0" }, undefined],
      ["installed", {}, "6.0.2"],
    ])("stops before install when %s TypeScript is 6", async (_name, extra, installed) => {
      await expect(
        preflightAstroSvelteIntegration(
          { dependencies: { astro: "^5.17.0" }, devDependencies: extra },
          async (name) => (name === "typescript" ? installed : undefined),
        ),
      ).resolves.toEqual({
        status: "manual-action-required",
        guidance: expect.stringContaining("needs TypeScript ^5.3.3"),
      });
    });

    it("accepts TypeScript 6 with the Astro 6 integration", async () => {
      await expect(
        preflightAstroSvelteIntegration(
          { dependencies: { astro: "^6.1.0" }, devDependencies: { typescript: "^6.0.0" } },
          async () => undefined,
        ),
      ).resolves.toEqual({ status: "configurable", packages: ["@astrojs/svelte@^8.1.2"] });
    });

    it("ignores a TypeScript tag that is not a version range", async () => {
      await expect(
        preflightAstroSvelteIntegration(
          { dependencies: { astro: "^5.17.0" }, devDependencies: { typescript: "latest" } },
          async () => undefined,
        ),
      ).resolves.toEqual({ status: "configurable", packages: ["@astrojs/svelte@^7.2.5"] });
    });
  });

  it("installs the official integration and updates config once", async () => {
    await expect(
      ensureAstroSvelteIntegration({
        packageManager: "pnpm",
        projectPackage: { dependencies: { astro: "^7" } },
        skipPrompts: true,
      }),
    ).resolves.toEqual({ status: "configured" });
    expect(mockInstall).toHaveBeenCalledWith(["@astrojs/svelte@^9.1.2"], "pnpm");
    expect(mockWriteFile).toHaveBeenCalledWith(
      "astro.config.ts",
      expect.stringContaining("integrations: [svelte()]"),
      "utf8",
    );

    vi.clearAllMocks();
    mockFindConfig.mockResolvedValue("astro.config.ts");
    mockReadFile.mockResolvedValue(configuredConfig as never);
    await expect(
      ensureAstroSvelteIntegration({
        packageManager: "pnpm",
        projectPackage: {
          dependencies: { "@astrojs/svelte": "^9.1.2", astro: "^7", svelte: "^5.43.6" },
        },
        skipPrompts: true,
      }),
    ).resolves.toEqual({ status: "ready" });
    expect(mockInstall).not.toHaveBeenCalled();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("names Svelte when the user declines the prompt", async () => {
    vi.mocked(p.confirm).mockResolvedValue(false);
    await expect(
      ensureAstroSvelteIntegration({ projectPackage: { dependencies: { astro: "^7" } } }),
    ).resolves.toEqual({ status: "declined" });
    expect(p.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Astro Svelte integration") }),
    );
    expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining('"astro add svelte"'));
    expect(mockInstall).not.toHaveBeenCalled();
  });

  it("preserves files when the config shape needs manual action", async () => {
    mockReadFile.mockResolvedValue(
      "export default defineConfig(() => ({ integrations: [] }));" as never,
    );
    await expect(setupAstroSvelteConfig()).resolves.toBe(false);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
