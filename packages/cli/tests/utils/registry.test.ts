import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearRegistryCache,
  getComponent,
  getRegistry,
  loadRegistry,
  type StarwindRegistry,
} from "../../src/utils/registry.js";

const runtimePackage = JSON.parse(
  readFileSync(new URL("../../../runtime/package.json", import.meta.url), "utf8"),
) as { version: string };
const CURRENT_BETA_PACKAGE_RANGE = `^${runtimePackage.version}`;

const validRegistry: StarwindRegistry = {
  $schema: "https://starwind.dev/registry-schema.v2.json",
  version: "2.0.0",
  components: [
    {
      name: "button",
      version: "2.4.0",
      type: "component",
      dependencies: [],
      targets: {
        astro: {
          files: [{ path: "button/Button.astro", content: "---\n---\n<button />\n" }],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/astro", range: "^0.1.0" }],
        },
        react: {
          files: [{ path: "button/index.tsx", content: "export function Button() {}\n" }],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/react", range: "^0.1.0" }],
        },
      },
    },
  ],
};

describe.sequential("runtime registry loading", () => {
  let tempDir = "";
  let previousFetch: typeof globalThis.fetch | undefined;

  beforeEach(async () => {
    clearRegistryCache();
    tempDir = await mkdtemp(join(tmpdir(), "starwind-registry-test-"));
    previousFetch = globalThis.fetch;
  });

  afterEach(async () => {
    clearRegistryCache();
    await rm(tempDir, { recursive: true, force: true });
    globalThis.fetch = previousFetch!;
    vi.restoreAllMocks();
  });

  it("loads the generated Runtime bundled registry through the component list interface", async () => {
    const components = await getRegistry(true);
    const button = await getComponent("button", true);

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "button",
          type: "component",
          dependencies: expect.any(Array),
        }),
      ]),
    );
    expect(components.length).toBeGreaterThan(40);
    expect(components.map((component) => component.name)).toEqual(
      expect.arrayContaining(["dropdown", "tooltip", "sidebar"]),
    );
    expect(button?.targets?.astro?.files.length).toBeGreaterThan(0);
    expect(button?.targets?.react?.files.length).toBeGreaterThan(0);
  });

  it("loads a local v2 registry source", async () => {
    const registryPath = join(tempDir, "registry.json");
    await writeFile(registryPath, JSON.stringify(validRegistry, null, 2), "utf-8");

    await expect(loadRegistry({ type: "local", path: registryPath })).resolves.toMatchObject({
      version: "2.0.0",
      components: [
        {
          name: "button",
          version: "2.4.0",
          targets: {
            astro: {
              packageRequirements: [{ name: "@starwind-ui/astro", range: "^0.1.0" }],
            },
          },
        },
      ],
    });
  });

  it("loads optional framework setup metadata from a v2 registry source", async () => {
    const registryPath = join(tempDir, "registry-with-setup.json");
    const registryWithSetup: StarwindRegistry = {
      ...validRegistry,
      setup: {
        astro: {
          adapterPackage: { name: "@starwind-ui/astro", range: "^0.1.0" },
          packageRequirements: [{ name: "@tabler/icons", range: "^3" }],
        },
        react: {
          adapterPackage: { name: "@starwind-ui/react", range: "^0.1.0" },
          packageRequirements: [{ name: "@tabler/icons-react", range: "^3" }],
        },
      },
    };
    await writeFile(registryPath, JSON.stringify(registryWithSetup, null, 2), "utf-8");

    await expect(loadRegistry({ type: "local", path: registryPath })).resolves.toMatchObject({
      setup: registryWithSetup.setup,
    });
  });

  it.each([
    {
      name: "unsupported targets",
      setup: {
        vue: {
          adapterPackage: { name: "@starwind-ui/vue", range: "^0.1.0" },
          packageRequirements: [],
        },
      },
      error: /Unsupported registry setup target/,
    },
    {
      name: "malformed ranges",
      setup: {
        react: {
          adapterPackage: { name: "@starwind-ui/react", range: "not-semver" },
          packageRequirements: [],
        },
      },
      error: /Expected a semver range/,
    },
    {
      name: "duplicate package requirements",
      setup: {
        react: {
          adapterPackage: { name: "@starwind-ui/react", range: "^0.1.0" },
          packageRequirements: [
            { name: "@tabler/icons-react", range: "^3" },
            { name: "@tabler/icons-react", range: "^3" },
          ],
        },
      },
      error: /Duplicate setup package requirement/,
    },
    {
      name: "adapter package repetition",
      setup: {
        react: {
          adapterPackage: { name: "@starwind-ui/react", range: "^0.1.0" },
          packageRequirements: [{ name: "@starwind-ui/react", range: "^0.1.0" }],
        },
      },
      error: /must not repeat adapter package/,
    },
  ])("rejects setup metadata with $name", async ({ setup, error }) => {
    const registryPath = join(tempDir, "invalid-setup-registry.json");
    await writeFile(registryPath, JSON.stringify({ ...validRegistry, setup }, null, 2), "utf-8");

    await expect(loadRegistry({ type: "local", path: registryPath })).rejects.toThrow(error);
  });

  it("loads optional public rename metadata from a v2 registry source", async () => {
    const registryPath = join(tempDir, "rename-registry.json");
    await writeFile(
      registryPath,
      JSON.stringify(
        {
          ...validRegistry,
          components: [
            {
              ...validRegistry.components[0],
              name: "menu",
              publicRenames: {
                paths: [{ from: "old-menu", to: "menu" }],
                usages: [{ from: "OldMenu", to: "Menu" }],
              },
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(loadRegistry({ type: "local", path: registryPath })).resolves.toMatchObject({
      components: [
        {
          name: "menu",
          publicRenames: {
            paths: [{ from: "old-menu", to: "menu" }],
            usages: [{ from: "OldMenu", to: "Menu" }],
          },
        },
      ],
    });
  });

  it("loads the generated runtime bundled registry with prepared target artifacts", async () => {
    const registry = await loadRegistry({ type: "bundled" }, { forceRefresh: true });
    const dropdown = registry.components.find((component) => component.name === "dropdown");

    expect(registry.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(dropdown?.targets?.astro?.files.length).toBeGreaterThan(0);
    expect(dropdown?.targets?.react?.files.length).toBeGreaterThan(0);
    expect(dropdown?.publicRenames).toBeUndefined();
    expect(JSON.stringify(dropdown)).not.toContain("dropdown-menu");
    expect(dropdown?.targets?.astro?.packageRequirements).toEqual(
      expect.arrayContaining([{ name: "@starwind-ui/astro", range: CURRENT_BETA_PACKAGE_RANGE }]),
    );
    expect(dropdown?.targets?.astro?.packageRequirements).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "@starwind-ui/runtime" })]),
    );
  });

  it("loads a remote v2 registry source", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => validRegistry,
    })) as unknown as typeof fetch;

    await expect(
      loadRegistry({ type: "remote", url: "https://starwind.dev/registry/2.0.0/registry.json" }),
    ).resolves.toMatchObject({
      version: "2.0.0",
      components: [expect.objectContaining({ name: "button" })],
    });
  });

  it("hydrates a local split registry component artifact", async () => {
    const registryPath = join(tempDir, "registry.json");
    const artifactPath = join(tempDir, "artifacts", "button.json");
    await mkdir(join(tempDir, "artifacts"), { recursive: true });
    await writeFile(
      registryPath,
      JSON.stringify(
        {
          $schema: "https://starwind.dev/registry-schema.v2.json",
          version: "2.0.0",
          components: [
            {
              name: "button",
              version: "2.4.0",
              type: "component",
              dependencies: [],
              artifact: { path: "artifacts/button.json" },
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );
    await writeFile(
      artifactPath,
      JSON.stringify(
        {
          $schema: "https://starwind.dev/registry-component-artifact-schema.v2.json",
          registryVersion: "2.0.0",
          component: validRegistry.components[0],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(loadRegistry({ type: "local", path: registryPath })).resolves.toMatchObject({
      components: [
        {
          name: "button",
          artifact: { path: "artifacts/button.json" },
          targets: {
            react: {
              files: [
                {
                  path: "button/index.tsx",
                  content: "export function Button() {}\n",
                },
              ],
            },
          },
        },
      ],
    });
  });

  it("hydrates and caches remote split registry component artifacts", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "https://starwind.dev/registry/2.0.0/registry.json") {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            $schema: "https://starwind.dev/registry-schema.v2.json",
            version: "2.0.0",
            components: [
              {
                name: "button",
                version: "2.4.0",
                type: "component",
                dependencies: [],
                artifact: { path: "artifacts/button.json" },
              },
            ],
          }),
        };
      }

      if (url === "https://starwind.dev/registry/2.0.0/artifacts/button.json") {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            $schema: "https://starwind.dev/registry-component-artifact-schema.v2.json",
            registryVersion: "2.0.0",
            component: validRegistry.components[0],
          }),
        };
      }

      throw new Error(`Unexpected fetch ${url}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const source = {
      type: "remote" as const,
      url: "https://starwind.dev/registry/2.0.0/registry.json",
    };

    await expect(loadRegistry(source)).resolves.toMatchObject({
      components: [expect.objectContaining({ name: "button", targets: expect.any(Object) })],
    });
    await expect(loadRegistry(source)).resolves.toMatchObject({
      components: [expect.objectContaining({ name: "button", targets: expect.any(Object) })],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("force refreshes remote split registry component artifacts", async () => {
    let artifactVersion = "2.4.0";
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "https://starwind.dev/registry/2.0.0/registry.json") {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            $schema: "https://starwind.dev/registry-schema.v2.json",
            version: "2.0.0",
            components: [
              {
                name: "button",
                version: artifactVersion,
                type: "component",
                dependencies: [],
                artifact: { path: "artifacts/button.json" },
              },
            ],
          }),
        };
      }

      if (url === "https://starwind.dev/registry/2.0.0/artifacts/button.json") {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            $schema: "https://starwind.dev/registry-component-artifact-schema.v2.json",
            registryVersion: "2.0.0",
            component: {
              ...validRegistry.components[0],
              version: artifactVersion,
            },
          }),
        };
      }

      throw new Error(`Unexpected fetch ${url}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const source = {
      type: "remote" as const,
      url: "https://starwind.dev/registry/2.0.0/registry.json",
    };

    await expect(loadRegistry(source)).resolves.toMatchObject({
      components: [expect.objectContaining({ version: "2.4.0" })],
    });

    artifactVersion = "2.5.0";
    await expect(loadRegistry(source, { forceRefresh: true })).resolves.toMatchObject({
      components: [expect.objectContaining({ version: "2.5.0" })],
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("clears split registry artifact caches", async () => {
    let artifactVersion = "2.4.0";
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "https://starwind.dev/registry/2.0.0/registry.json") {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            $schema: "https://starwind.dev/registry-schema.v2.json",
            version: "2.0.0",
            components: [
              {
                name: "button",
                version: artifactVersion,
                type: "component",
                dependencies: [],
                artifact: { path: "artifacts/button.json" },
              },
            ],
          }),
        };
      }

      if (url === "https://starwind.dev/registry/2.0.0/artifacts/button.json") {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            $schema: "https://starwind.dev/registry-component-artifact-schema.v2.json",
            registryVersion: "2.0.0",
            component: {
              ...validRegistry.components[0],
              version: artifactVersion,
            },
          }),
        };
      }

      throw new Error(`Unexpected fetch ${url}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const source = {
      type: "remote" as const,
      url: "https://starwind.dev/registry/2.0.0/registry.json",
    };

    await expect(loadRegistry(source)).resolves.toMatchObject({
      components: [expect.objectContaining({ version: "2.4.0" })],
    });

    artifactVersion = "2.5.0";
    clearRegistryCache();

    await expect(loadRegistry(source)).resolves.toMatchObject({
      components: [expect.objectContaining({ version: "2.5.0" })],
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("rejects encoded remote split registry artifact traversal paths before fetching artifacts", async () => {
    const encodedTraversals = ["%2e%2e/secret.json", ".%2e/secret.json", "%2e./secret.json"];

    for (const artifactPath of encodedTraversals) {
      clearRegistryCache();
      const fetchMock = vi.fn(async (url: string) => {
        if (url === "https://starwind.dev/registry/2.0.0/registry.json") {
          return {
            ok: true,
            status: 200,
            statusText: "OK",
            json: async () => ({
              $schema: "https://starwind.dev/registry-schema.v2.json",
              version: "2.0.0",
              components: [
                {
                  name: "button",
                  version: "2.4.0",
                  type: "component",
                  dependencies: [],
                  artifact: { path: artifactPath },
                },
              ],
            }),
          };
        }

        throw new Error(`Unexpected artifact fetch ${url}`);
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      await expect(
        loadRegistry({
          type: "remote",
          url: "https://starwind.dev/registry/2.0.0/registry.json",
        }),
      ).rejects.toThrow(/artifact path.*registry root/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it("rejects missing split registry component artifacts before returning a registry", async () => {
    const registryPath = join(tempDir, "registry.json");
    await writeFile(
      registryPath,
      JSON.stringify(
        {
          $schema: "https://starwind.dev/registry-schema.v2.json",
          version: "2.0.0",
          components: [
            {
              name: "button",
              version: "2.4.0",
              type: "component",
              dependencies: [],
              artifact: { path: "artifacts/missing.json" },
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(loadRegistry({ type: "local", path: registryPath })).rejects.toThrow(
      /button.*artifacts\/missing\.json/,
    );
  });

  it("rejects split registry artifact paths that escape the registry root", async () => {
    const registryPath = join(tempDir, "registry.json");
    await writeFile(
      registryPath,
      JSON.stringify(
        {
          $schema: "https://starwind.dev/registry-schema.v2.json",
          version: "2.0.0",
          components: [
            {
              name: "button",
              version: "2.4.0",
              type: "component",
              dependencies: [],
              artifact: { path: "../button.json" },
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(loadRegistry({ type: "local", path: registryPath })).rejects.toThrow(
      /artifact path.*registry root/,
    );
  });

  it("rejects malformed or semver-incompatible split registry artifacts", async () => {
    const registryPath = join(tempDir, "registry.json");
    const artifactPath = join(tempDir, "artifacts", "button.json");
    await mkdir(join(tempDir, "artifacts"), { recursive: true });
    await writeFile(
      registryPath,
      JSON.stringify(
        {
          $schema: "https://starwind.dev/registry-schema.v2.json",
          version: "2.0.0",
          components: [
            {
              name: "button",
              version: "2.4.0",
              type: "component",
              dependencies: [],
              artifact: { path: "artifacts/button.json" },
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );
    await writeFile(
      artifactPath,
      JSON.stringify(
        {
          $schema: "https://starwind.dev/registry-component-artifact-schema.v2.json",
          registryVersion: "3.0.0",
          component: validRegistry.components[0],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(loadRegistry({ type: "local", path: registryPath })).rejects.toThrow(
      /semver-compatible/,
    );
  });

  it("rejects invalid registry targets with a field-specific error", async () => {
    const registryPath = join(tempDir, "invalid-registry.json");
    await writeFile(
      registryPath,
      JSON.stringify(
        {
          ...validRegistry,
          components: [
            {
              ...validRegistry.components[0],
              targets: {
                svelte: {
                  files: [{ path: "button/Button.svelte", content: "<button />" }],
                  componentDependencies: [],
                  packageRequirements: [{ name: "@starwind-ui/svelte", range: "^0.1.0" }],
                },
              },
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(loadRegistry({ type: "local", path: registryPath })).rejects.toThrow(
      /components\.0\.targets\.svelte/,
    );
  });

  it("rejects non-semver component versions with a field-specific error", async () => {
    const registryPath = join(tempDir, "invalid-version-registry.json");
    await writeFile(
      registryPath,
      JSON.stringify(
        {
          ...validRegistry,
          components: [
            {
              ...validRegistry.components[0],
              version: "2026-06-18",
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(loadRegistry({ type: "local", path: registryPath })).rejects.toThrow(
      /components\.0\.version/,
    );
  });

  it("rejects prepared files without exactly one payload source", async () => {
    const pathOnlyRegistryPath = join(tempDir, "path-only-registry.json");
    await writeFile(
      pathOnlyRegistryPath,
      JSON.stringify(
        {
          ...validRegistry,
          components: [
            {
              ...validRegistry.components[0],
              targets: {
                astro: {
                  files: [{ path: "button/Button.astro" }],
                  componentDependencies: [],
                  packageRequirements: [{ name: "@starwind-ui/astro", range: "^0.1.0" }],
                },
              },
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(loadRegistry({ type: "local", path: pathOnlyRegistryPath })).rejects.toThrow(
      /components\.0\.targets\.astro\.files\.0/,
    );

    const duplicatePayloadRegistryPath = join(tempDir, "duplicate-payload-registry.json");
    await writeFile(
      duplicatePayloadRegistryPath,
      JSON.stringify(
        {
          ...validRegistry,
          components: [
            {
              ...validRegistry.components[0],
              targets: {
                astro: {
                  files: [
                    {
                      path: "button/Button.astro",
                      content: "---\n---\n<button />\n",
                      sourcePath: "generated/astro/button/Button.astro",
                    },
                  ],
                  componentDependencies: [],
                  packageRequirements: [{ name: "@starwind-ui/astro", range: "^0.1.0" }],
                },
              },
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(
      loadRegistry({ type: "local", path: duplicatePayloadRegistryPath }),
    ).rejects.toThrow(/components\.0\.targets\.astro\.files\.0/);
  });

  it("rejects targets with files but without compatible adapter requirements", async () => {
    const registryPath = join(tempDir, "missing-package-requirements.json");
    await writeFile(
      registryPath,
      JSON.stringify(
        {
          ...validRegistry,
          components: [
            {
              ...validRegistry.components[0],
              targets: {
                astro: {
                  files: [
                    {
                      path: "src/components/starwind/button/Button.astro",
                      content: "---\n---\n<button />\n",
                    },
                  ],
                  componentDependencies: [],
                  packageRequirements: [],
                },
              },
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(loadRegistry({ type: "local", path: registryPath })).rejects.toThrow(
      /components\.0\.targets\.astro\.packageRequirements/,
    );
  });
});
