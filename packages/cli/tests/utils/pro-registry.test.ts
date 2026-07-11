import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StarwindConfig } from "../../src/utils/config.js";
import { PATHS } from "../../src/utils/constants.js";
import * as dependencyResolver from "../../src/utils/dependency-resolver.js";
import * as packageManager from "../../src/utils/package-manager.js";
import { installProRegistryItems } from "../../src/utils/pro-registry.js";

vi.mock("../../src/utils/dependency-resolver.js");
vi.mock("../../src/utils/package-manager.js");

const mockFilterUninstalledDependencies = vi.mocked(
  dependencyResolver.filterUninstalledDependencies,
);
const mockInstallDependencies = vi.mocked(packageManager.installDependencies);

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
    components: [],
    ...overrides,
  };
}

function registryItem(overrides: Record<string, unknown> = {}) {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "free-card",
    type: "registry:block",
    title: "Free Card",
    dependencies: [],
    registryDependencies: [],
    files: [
      {
        path: "blocks/FreeCard.astro",
        type: "registry:block",
        target: "components/starwind-pro/free-card/FreeCard.astro",
        content: "---\n---\n<div>free</div>\n",
      },
    ],
    meta: {
      plan: "free",
      version: "1.0.0",
      framework: "astro",
    },
    ...overrides,
  };
}

function statusTextFor(status: number): string {
  switch (status) {
    case 200:
      return "OK";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    default:
      return "Error";
  }
}

function mockFetchJson(body: unknown, status = 200) {
  globalThis.fetch = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: statusTextFor(status),
    json: async () => body,
  })) as unknown as typeof fetch;
}

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

describe("Pro registry installer", () => {
  let tempDir = "";
  let previousCwd = "";
  let previousFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await mkdtemp(join(tmpdir(), "starwind-pro-registry-test-"));
    previousCwd = process.cwd();
    previousFetch = globalThis.fetch;
    process.chdir(tempDir);
    mockFilterUninstalledDependencies.mockImplementation(async (dependencies) => dependencies);
    mockInstallDependencies.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    globalThis.fetch = previousFetch;
    await rm(tempDir, { recursive: true, force: true });
  });

  it("installs a free Pro item from the default registry without auth", async () => {
    mockFetchJson(registryItem());

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig(),
      env: {},
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      PATHS.STARWIND_PRO_REGISTRY.replace("{name}", "free-card"),
      expect.objectContaining({
        headers: {},
      }),
    );
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-pro", "free-card", "FreeCard.astro"),
        "utf-8",
      ),
    ).resolves.toContain("<div>free</div>");
    expect(result).toMatchObject({
      installed: [{ name: "@starwind-pro/free-card", status: "installed", version: "1.0.0" }],
      skipped: [],
      failed: [],
    });
  });

  it("uses STARWIND_LICENSE_KEY as the default Pro authorization header", async () => {
    mockFetchJson(registryItem());

    await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig(),
      env: {
        STARWIND_LICENSE_KEY: "sw_live_123",
      },
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      PATHS.STARWIND_PRO_REGISTRY.replace("{name}", "free-card"),
      expect.objectContaining({
        headers: {
          Authorization: "Bearer sw_live_123",
        },
      }),
    );
  });

  it("uses default Pro authorization for a custom path on the official origin", async () => {
    mockFetchJson(registryItem());

    await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig({
        pro: {
          registry: {
            url: "https://pro.starwind.dev/custom/{name}",
          },
        },
      }),
      env: {
        STARWIND_LICENSE_KEY: "fake-official-origin-license",
      },
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://pro.starwind.dev/custom/free-card",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer fake-official-origin-license",
        },
      }),
    );
  });

  it("expands config headers and params before fetching", async () => {
    mockFetchJson(registryItem());

    await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig({
        pro: {
          registry: {
            url: "http://localhost:4321/r/{name}",
            headers: {
              "X-Starwind-Key": "Token ${LOCAL_STARWIND_KEY}",
            },
            params: {
              channel: "${STARWIND_PRO_CHANNEL}",
            },
          },
        },
      }),
      env: {
        LOCAL_STARWIND_KEY: "local-key",
        STARWIND_PRO_CHANNEL: "beta",
        STARWIND_PRO_TRUSTED_ORIGINS: "https://other.example, http://localhost:4321",
      },
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:4321/r/free-card?channel=beta",
      expect.objectContaining({
        headers: {
          "X-Starwind-Key": "Token local-key",
        },
      }),
    );
  });

  it("rejects sensitive headers for an untrusted custom origin before fetching", async () => {
    mockFetchJson(registryItem());

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig({
        pro: {
          registry: {
            url: "https://registry.example/r/{name}",
            headers: {
              Authorization: "Bearer ${FAKE_CUSTOM_REGISTRY_KEY}",
            },
          },
        },
      }),
      env: {
        FAKE_CUSTOM_REGISTRY_KEY: "fake-untrusted-credential",
      },
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.failed[0]?.error).toContain("https://registry.example");
    expect(result.failed[0]?.error).toContain("STARWIND_PRO_TRUSTED_ORIGINS");
    expect(result.failed[0]?.error).not.toContain("fake-untrusted-credential");
  });

  it.each([
    ["authorization", "Authorization", "Bearer fake-static-value"],
    ["proxy authorization", "Proxy-Authorization", "Bearer fake-static-value"],
    ["cookie", "Cookie", "session=fake-static-value"],
    ["set-cookie", "Set-Cookie", "session=fake-static-value"],
    ["API key", "X-Api-Key", "fake-static-value"],
    ["token", "X-Access-Token", "fake-static-value"],
    ["placeholder-backed", "X-Registry-Mode", "${FAKE_HEADER_VALUE}"],
  ])("treats %s custom-origin headers as sensitive", async (_label, name, value) => {
    mockFetchJson(registryItem());

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig({
        pro: {
          registry: {
            url: "https://example.com/r/{name}",
            headers: {
              [name]: value,
            },
          },
        },
      }),
      env: {
        FAKE_HEADER_VALUE: "fake-expanded-value",
      },
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.failed[0]?.error).toContain("STARWIND_PRO_TRUSTED_ORIGINS");
    expect(result.failed[0]?.error).not.toContain("fake-expanded-value");
  });

  it.each([
    ["unrelated host", "https://example.com", "https://evil.example"],
    ["subdomain", "https://example.com", "https://sub.example.com"],
    ["deceptive suffix", "https://example.com", "https://example.com.evil"],
    ["wildcard", "https://example.com", "https://*.example.com"],
    ["different port", "https://example.com:8443", "https://example.com"],
    ["path", "https://example.com", "https://example.com/registry"],
    ["normalized path", "https://example.com", "https://example.com/."],
    ["backslash path", "https://example.com", "https://example.com\\."],
    ["credentials", "https://example.com", "https://operator:fake@example.com"],
  ])(
    "does not trust a %s entry for a custom registry origin",
    async (_label, requestOrigin, trustedOrigin) => {
      mockFetchJson(registryItem());

      const result = await installProRegistryItems(["@starwind-pro/free-card"], {
        config: runtimeConfig({
          pro: {
            registry: {
              url: `${requestOrigin}/r/{name}`,
              headers: {
                Authorization: "Bearer fake-static-value",
              },
            },
          },
        }),
        env: {
          STARWIND_PRO_TRUSTED_ORIGINS: trustedOrigin,
        },
      });

      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(result.failed).toHaveLength(1);
    },
  );

  it("fails closed when a trust list contains a malformed entry", async () => {
    mockFetchJson(registryItem());

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig({
        pro: {
          registry: {
            url: "https://example.com/r/{name}",
            headers: {
              Authorization: "Bearer fake-static-value",
            },
          },
        },
      }),
      env: {
        STARWIND_PRO_TRUSTED_ORIGINS: "https://example.com,not-an-origin",
      },
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.failed[0]?.error).toContain("Invalid STARWIND_PRO_TRUSTED_ORIGINS");
  });

  it("allows static non-sensitive headers and params for a custom origin", async () => {
    mockFetchJson(registryItem());

    await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig({
        pro: {
          registry: {
            url: "https://example.com/r/{name}",
            headers: {
              "X-Registry-Mode": "preview",
            },
            params: {
              channel: "canary",
            },
          },
        },
      }),
      env: {
        STARWIND_LICENSE_KEY: "fake-unused-license",
      },
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://example.com/r/free-card?channel=canary",
      expect.objectContaining({
        headers: {
          "X-Registry-Mode": "preview",
        },
      }),
    );
  });

  it("does not forward sensitive headers across an untrusted redirect", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({
      headers: new Headers({ location: "https://evil.example/free-card" }),
      ok: false,
      status: 302,
      statusText: "Found",
    });

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig({
        pro: {
          registry: {
            url: "https://registry.example/r/{name}",
            headers: { "X-Api-Key": "fake-secret" },
          },
        },
      }),
      env: { STARWIND_PRO_TRUSTED_ORIGINS: "https://registry.example" },
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.failed[0]?.error).toContain("https://evil.example");
    expect(result.failed[0]?.error).not.toContain("fake-secret");
  });

  it("follows a sensitive redirect when both exact origins are trusted", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        headers: new Headers({ location: "https://cdn.example/free-card" }),
        ok: false,
        status: 307,
        statusText: "Temporary Redirect",
      })
      .mockResolvedValueOnce({
        headers: new Headers(),
        json: async () => registryItem(),
        ok: true,
        status: 200,
        statusText: "OK",
      });

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig({
        pro: {
          registry: {
            url: "https://registry.example/r/{name}",
            headers: { "X-Api-Key": "fake-secret" },
          },
        },
      }),
      env: {
        STARWIND_PRO_TRUSTED_ORIGINS: "https://registry.example,https://cdn.example",
      },
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(result.installed).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]?.[0]).toBe("https://cdn.example/free-card");
    expect(fetcher.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({ headers: { "X-Api-Key": "fake-secret" }, redirect: "manual" }),
    );
  });

  it("loads env files with shadcn-compatible priority when no explicit env is passed", async () => {
    await writeFile(".env", "STARWIND_TEST_LICENSE_KEY=env\n", "utf-8");
    await writeFile(".env.development", "STARWIND_TEST_LICENSE_KEY=development\n", "utf-8");
    await writeFile(
      ".env.development.local",
      "STARWIND_TEST_LICENSE_KEY=development-local\n",
      "utf-8",
    );
    await writeFile(
      ".env.local",
      "STARWIND_TEST_LICENSE_KEY=local\nSTARWIND_PRO_TRUSTED_ORIGINS=http://localhost:4321\n",
      "utf-8",
    );
    mockFetchJson(registryItem());

    await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig({
        pro: {
          registry: {
            url: "http://localhost:4321/r/{name}",
            headers: {
              "X-Starwind-Key": "${STARWIND_TEST_LICENSE_KEY}",
            },
          },
        },
      }),
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:4321/r/free-card",
      expect.objectContaining({
        headers: {
          "X-Starwind-Key": "local",
        },
      }),
    );
  });

  it("keeps process env values ahead of dotenv file values", async () => {
    const previous = process.env.STARWIND_TEST_PROCESS_KEY;
    process.env.STARWIND_TEST_PROCESS_KEY = "process-key";
    await writeFile(".env.local", "STARWIND_TEST_PROCESS_KEY=local-key\n", "utf-8");
    mockFetchJson(registryItem());

    try {
      await installProRegistryItems(["@starwind-pro/free-card"], {
        config: runtimeConfig({
          pro: {
            registry: {
              headers: {
                "X-Starwind-Key": "${STARWIND_TEST_PROCESS_KEY}",
              },
            },
          },
        }),
      });
    } finally {
      if (previous === undefined) {
        delete process.env.STARWIND_TEST_PROCESS_KEY;
      } else {
        process.env.STARWIND_TEST_PROCESS_KEY = previous;
      }
    }

    expect(globalThis.fetch).toHaveBeenCalledWith(
      PATHS.STARWIND_PRO_REGISTRY.replace("{name}", "free-card"),
      expect.objectContaining({
        headers: {
          "X-Starwind-Key": "process-key",
        },
      }),
    );
  });

  it("adds Starwind auth guidance for missing paid license responses", async () => {
    mockFetchJson(
      {
        error: "Unauthorized",
        message: "License key required.",
      },
      401,
    );

    const result = await installProRegistryItems(["@starwind-pro/paid-card"], {
      config: runtimeConfig(),
      env: {},
    });

    expect(result.failed[0]).toMatchObject({
      authFailure: true,
      error: expect.stringContaining("401 Unauthorized - License key required."),
      name: "@starwind-pro/paid-card",
      status: "failed",
    });
    expect(result.failed[0]?.error).not.toContain("Starwind Pro authorization uses");
    expect(result.failed[0]?.error).not.toContain("Failed to fetch");
  });

  it("adds Starwind auth guidance for invalid paid license responses", async () => {
    mockFetchJson(
      {
        error: "Forbidden",
        message: "License validation failed. Please check your key.",
      },
      403,
    );

    const result = await installProRegistryItems(["@starwind-pro/paid-card"], {
      config: runtimeConfig(),
      env: {
        STARWIND_LICENSE_KEY: "bad-key",
      },
    });

    expect(result.failed[0]).toMatchObject({
      authFailure: true,
      error: expect.stringContaining("403 Forbidden - License validation failed"),
      name: "@starwind-pro/paid-card",
      status: "failed",
    });
    expect(result.failed[0]?.error).not.toContain("Starwind Pro authorization uses");
    expect(result.failed[0]?.error).not.toContain("Failed to fetch");
  });

  it("uses the Starwind config Pro registry URL override", async () => {
    mockFetchJson(registryItem());

    await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig({
        pro: {
          registry: {
            url: "http://localhost:4321/r/{name}",
          },
        },
      }),
      env: {
        STARWIND_LICENSE_KEY: "fake-custom-origin-license",
      },
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:4321/r/free-card",
      expect.objectContaining({
        headers: {},
      }),
    );
  });

  it("validates registry items before writing files", async () => {
    mockFetchJson({
      name: "free-card",
      type: "registry:block",
      files: [],
    });

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig(),
      env: {},
    });

    expect(result.failed[0]?.error).toContain("Invalid Starwind Pro registry item");
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-pro", "free-card", "FreeCard.astro"),
        "utf-8",
      ),
    ).rejects.toThrow();
  });

  it("rejects unsafe target paths before writing any files", async () => {
    mockFetchJson(
      registryItem({
        files: [
          {
            path: "blocks/FreeCard.astro",
            type: "registry:block",
            target: "components/starwind-pro/free-card/FreeCard.astro",
            content: "---\n---\n<div>safe</div>\n",
          },
          {
            path: "blocks/Escape.ts",
            type: "registry:block",
            target: "../Escape.ts",
            content: "export const escaped = true;\n",
          },
        ],
      }),
    );

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig(),
      env: {},
    });

    expect(result.failed[0]?.error).toContain("contains an invalid path");
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-pro", "free-card", "FreeCard.astro"),
        "utf-8",
      ),
    ).rejects.toThrow();
    await expect(readFile(join(tempDir, "Escape.ts"), "utf-8")).rejects.toThrow();
  });

  it("rejects Pro writes through an external directory link before package mutations", async ({
    skip,
  }) => {
    const externalDir = await mkdtemp(join(tmpdir(), "starwind-pro-external-test-"));
    const componentsRoot = join(tempDir, "src", "components");
    await mkdir(join(tempDir, "src"), { recursive: true });

    try {
      const linkError = await createDirectoryLink(externalDir, componentsRoot);
      if (linkError) skip(`Windows junction creation failed with EPERM: ${linkError.message}`);
      mockFetchJson(registryItem({ dependencies: ["motion@^12.0.0"] }));

      const result = await installProRegistryItems(["@starwind-pro/free-card"], {
        config: runtimeConfig(),
        env: {},
        packageManager: "pnpm",
      });

      expect(result.failed).toEqual([
        expect.objectContaining({
          name: "@starwind-pro/free-card",
          error: expect.stringMatching(/outside/i),
        }),
      ]);
      await expect(
        readFile(join(externalDir, "starwind-pro", "free-card", "FreeCard.astro"), "utf-8"),
      ).rejects.toThrow();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
    } finally {
      await rm(externalDir, { recursive: true, force: true });
    }
  });

  it("skips existing files when overwrite is not requested", async () => {
    const target = join(tempDir, "src", "components", "starwind-pro", "free-card");
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "FreeCard.astro"), "local edit\n", "utf-8");
    mockFetchJson(registryItem());

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig(),
      env: {},
    });

    await expect(readFile(join(target, "FreeCard.astro"), "utf-8")).resolves.toBe("local edit\n");
    expect(result).toMatchObject({
      installed: [],
      skipped: [{ name: "@starwind-pro/free-card", status: "skipped", version: "1.0.0" }],
      failed: [],
    });
  });

  it("reports a partial file write as skipped when any item file already exists", async () => {
    const target = join(tempDir, "src", "components", "starwind-pro", "free-card");
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "FreeCard.astro"), "local edit\n", "utf-8");
    mockFetchJson(
      registryItem({
        files: [
          {
            path: "blocks/FreeCard.astro",
            type: "registry:block",
            target: "components/starwind-pro/free-card/FreeCard.astro",
            content: "---\n---\n<div>free</div>\n",
          },
          {
            path: "blocks/FreeCardDemo.astro",
            type: "registry:block",
            target: "components/starwind-pro/free-card/FreeCardDemo.astro",
            content: "---\n---\n<div>demo</div>\n",
          },
        ],
      }),
    );

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig(),
      env: {},
    });

    await expect(readFile(join(target, "FreeCard.astro"), "utf-8")).resolves.toBe("local edit\n");
    await expect(readFile(join(target, "FreeCardDemo.astro"), "utf-8")).resolves.toContain(
      "<div>demo</div>",
    );
    expect(result.installed).toEqual([]);
    expect(result.skipped).toEqual([
      expect.objectContaining({
        name: "@starwind-pro/free-card",
        skippedFiles: ["src/components/starwind-pro/free-card/FreeCard.astro"],
        status: "skipped",
        writtenFiles: ["src/components/starwind-pro/free-card/FreeCardDemo.astro"],
      }),
    ]);
  });

  it("overwrites existing files when requested", async () => {
    const target = join(tempDir, "src", "components", "starwind-pro", "free-card");
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "FreeCard.astro"), "local edit\n", "utf-8");
    mockFetchJson(registryItem());

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig(),
      env: {},
      overwrite: true,
    });

    await expect(readFile(join(target, "FreeCard.astro"), "utf-8")).resolves.toContain(
      "<div>free</div>",
    );
    expect(result).toMatchObject({
      installed: [{ name: "@starwind-pro/free-card", status: "installed", version: "1.0.0" }],
      skipped: [],
      failed: [],
    });
  });

  it("installs transitive Pro registry dependencies before requested items", async () => {
    const items = new Map<string, unknown>([
      [
        "free-card",
        registryItem({
          registryDependencies: ["@starwind-pro/shared-runtime"],
        }),
      ],
      [
        "shared-runtime",
        registryItem({
          name: "shared-runtime",
          type: "registry:lib",
          files: [
            {
              path: "lib/shared-runtime.ts",
              type: "registry:lib",
              target: "lib/utils/starwind/shared-runtime.ts",
              content: "export const shared = true;\n",
            },
          ],
          meta: {
            plan: "free",
            version: "1.0.0",
            framework: "astro",
          },
        }),
      ],
    ]);
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const name = String(url).split("/").pop()!;
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => items.get(name),
      };
    }) as unknown as typeof fetch;

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig(),
      env: {},
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(result.failed).toEqual([]);
    expect(result.installed.map((item) => item.name)).toEqual([
      "@starwind-pro/shared-runtime",
      "@starwind-pro/free-card",
    ]);
    await expect(
      readFile(join(tempDir, "src", "lib", "utils", "starwind", "shared-runtime.ts"), "utf-8"),
    ).resolves.toContain("shared");
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-pro", "free-card", "FreeCard.astro"),
        "utf-8",
      ),
    ).resolves.toContain("<div>free</div>");
  });

  it("dedupes duplicate registry dependencies per command", async () => {
    const items = new Map<string, unknown>([
      [
        "free-card",
        registryItem({
          registryDependencies: ["@starwind-pro/shared-runtime"],
        }),
      ],
      [
        "free-panel",
        registryItem({
          name: "free-panel",
          registryDependencies: ["@starwind-pro/shared-runtime"],
          files: [
            {
              path: "blocks/FreePanel.astro",
              type: "registry:block",
              target: "components/starwind-pro/free-panel/FreePanel.astro",
              content: "---\n---\n<div>panel</div>\n",
            },
          ],
        }),
      ],
      [
        "shared-runtime",
        registryItem({
          name: "shared-runtime",
          type: "registry:lib",
          files: [
            {
              path: "lib/shared-runtime.ts",
              type: "registry:lib",
              target: "lib/utils/starwind/shared-runtime.ts",
              content: "export const shared = true;\n",
            },
          ],
        }),
      ],
    ]);
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const name = String(url).split("/").pop()!;
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => items.get(name),
      };
    }) as unknown as typeof fetch;

    const result = await installProRegistryItems(
      ["@starwind-pro/free-card", "@starwind-pro/free-panel"],
      {
        config: runtimeConfig(),
        env: {},
      },
    );

    const fetchedNames = vi
      .mocked(globalThis.fetch)
      .mock.calls.map(([url]) => String(url).split("/").pop());
    expect(fetchedNames.filter((name) => name === "shared-runtime")).toHaveLength(1);
    expect(result.failed).toEqual([]);
    expect(result.installed.map((item) => item.name)).toEqual([
      "@starwind-pro/shared-runtime",
      "@starwind-pro/free-card",
      "@starwind-pro/free-panel",
    ]);
  });

  it("fails dependency cycles with a clear error", async () => {
    const items = new Map<string, unknown>([
      [
        "cycle-a",
        registryItem({
          name: "cycle-a",
          registryDependencies: ["@starwind-pro/cycle-b"],
        }),
      ],
      [
        "cycle-b",
        registryItem({
          name: "cycle-b",
          registryDependencies: ["@starwind-pro/cycle-a"],
        }),
      ],
    ]);
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const name = String(url).split("/").pop()!;
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => items.get(name),
      };
    }) as unknown as typeof fetch;

    const result = await installProRegistryItems(["@starwind-pro/cycle-a"], {
      config: runtimeConfig(),
      env: {},
    });

    expect(result.installed).toEqual([]);
    expect(result.failed[0]?.error).toContain("Dependency cycle");
  });

  it("fails unsupported registry dependency namespaces clearly", async () => {
    mockFetchJson(
      registryItem({
        registryDependencies: ["@other/thing"],
      }),
    );

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig(),
      env: {},
    });

    expect(result.installed).toEqual([]);
    expect(result.failed[0]?.error).toContain("Unsupported Pro registry dependency");
  });

  it("installs npm dependencies through existing package manager helpers", async () => {
    mockFetchJson(
      registryItem({
        dependencies: ["motion@^12.0.0", "embla-carousel-autoplay"],
      }),
    );
    mockFilterUninstalledDependencies.mockImplementation(async (dependencies) =>
      dependencies.filter((dependency) => dependency.startsWith("motion")),
    );

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig(),
      env: {},
      packageManager: "pnpm",
    });

    expect(result.failed).toEqual([]);
    expect(mockFilterUninstalledDependencies).toHaveBeenCalledWith([
      "motion@^12.0.0",
      "embla-carousel-autoplay",
    ]);
    expect(mockFilterUninstalledDependencies).toHaveBeenCalledWith([]);
    expect(mockInstallDependencies).toHaveBeenCalledWith(["motion@^12.0.0"], "pnpm");
    expect(mockInstallDependencies).toHaveBeenCalledTimes(1);
  });

  it("installs declared dev dependencies as dev dependencies", async () => {
    mockFetchJson(
      registryItem({
        devDependencies: ["vite-plugin-example@^1.0.0"],
      }),
    );
    mockFilterUninstalledDependencies.mockImplementation(async (dependencies) =>
      dependencies.filter((dependency) => dependency.startsWith("vite-plugin-example")),
    );

    const result = await installProRegistryItems(["@starwind-pro/free-card"], {
      config: runtimeConfig(),
      env: {},
      packageManager: "pnpm",
    });

    expect(result.failed).toEqual([]);
    expect(mockFilterUninstalledDependencies).toHaveBeenCalledWith([]);
    expect(mockFilterUninstalledDependencies).toHaveBeenCalledWith(["vite-plugin-example@^1.0.0"]);
    expect(mockInstallDependencies).toHaveBeenCalledWith(
      ["vite-plugin-example@^1.0.0"],
      "pnpm",
      true,
    );
    expect(mockInstallDependencies).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["dependencies", "--global"],
    ["dependencies", "-D"],
    ["dependencies", "../motion"],
    ["dependencies", "file:../motion"],
    ["dependencies", "https://registry.example/motion.tgz"],
    ["dependencies", "motion@npm:other-motion"],
    ["devDependencies", "workspace:^"],
    ["devDependencies", "motion\n--global"],
  ] as const)(
    "rejects unsafe Pro %s package spec %s before recursive planning or side effects",
    async (field, packageSpec) => {
      const items = new Map<string, unknown>([
        [
          "free-card",
          registryItem({
            [field]: [packageSpec],
            registryDependencies: ["@starwind-pro/shared-runtime"],
          }),
        ],
        [
          "shared-runtime",
          registryItem({
            name: "shared-runtime",
            files: [
              {
                path: "lib/shared.ts",
                type: "registry:lib",
                target: "lib/shared.ts",
                content: "export const shared = true;\n",
              },
            ],
          }),
        ],
      ]);
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        const name = String(url).split("/").pop()!;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => items.get(name),
        };
      }) as unknown as typeof fetch;

      const result = await installProRegistryItems(["@starwind-pro/free-card"], {
        config: runtimeConfig(),
        env: {},
        packageManager: "pnpm",
      });

      const fetchedNames = vi
        .mocked(globalThis.fetch)
        .mock.calls.map(([url]) => String(url).split("/").pop());
      expect(fetchedNames).toEqual(["free-card"]);
      expect(result.installed).toEqual([]);
      expect(result.failed[0]?.error).toMatch(/package/i);
      expect(mockFilterUninstalledDependencies).not.toHaveBeenCalled();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      await expect(
        readFile(
          join(tempDir, "src", "components", "starwind-pro", "free-card", "FreeCard.astro"),
          "utf-8",
        ),
      ).rejects.toThrow();
      await expect(readFile(join(tempDir, "lib", "shared.ts"), "utf-8")).rejects.toThrow();
    },
  );
});
