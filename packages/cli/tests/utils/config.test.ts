import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CONFIG_SCHEMA_V2_URL,
  getConfig,
  getConfigState,
  getStyledComponentDir,
  getStyledComponentDirConfigUpdate,
  parseCurrentConfig,
  resolveStarwindProRegistryConfig,
  resolveStarwindProRegistryRequest,
  setupStarwindProConfig,
  updateConfig,
} from "../../src/utils/config.js";
import { PATHS } from "../../src/utils/constants.js";
import * as fsUtils from "../../src/utils/fs.js";

const DEFAULT_SCHEMA = "https://starwind.dev/config-schema.json";

type JsonSchemaFixture = {
  additionalProperties?: boolean | JsonSchemaFixture;
  const?: unknown;
  enum?: unknown[];
  items?: JsonSchemaFixture;
  minLength?: number;
  not?: JsonSchemaFixture;
  oneOf?: JsonSchemaFixture[];
  properties?: Record<string, JsonSchemaFixture>;
  required?: string[];
  type?: "array" | "boolean" | "number" | "object" | "string";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateSchemaFixture(
  schema: JsonSchemaFixture,
  value: unknown,
  path: string = "$",
): string[] {
  const errors: string[] = [];

  if (schema.const !== undefined && !Object.is(value, schema.const)) {
    errors.push(`${path} must equal ${String(schema.const)}`);
  }

  if (schema.not && validateSchemaFixture(schema.not, value, path).length === 0) {
    errors.push(`${path} must not match schema`);
  }

  if (schema.oneOf) {
    const matchingSchemas = schema.oneOf.filter(
      (entry) => validateSchemaFixture(entry, value, path).length === 0,
    );

    if (matchingSchemas.length !== 1) {
      errors.push(`${path} must match exactly one schema`);
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path} must be one of ${schema.enum.join(", ")}`);
  }

  if (schema.type === "string") {
    if (typeof value !== "string") {
      errors.push(`${path} must be a string`);
      return errors;
    }

    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path} must have length at least ${schema.minLength}`);
    }
  }

  if (schema.type === "boolean" && typeof value !== "boolean") {
    errors.push(`${path} must be a boolean`);
  }

  if (schema.type === "number" && typeof value !== "number") {
    errors.push(`${path} must be a number`);
  }

  if (schema.type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array`);
      return errors;
    }

    if (schema.items) {
      value.forEach((entry, index) => {
        errors.push(...validateSchemaFixture(schema.items!, entry, `${path}[${index}]`));
      });
    }
  }

  if (schema.type === "object") {
    if (!isRecord(value)) {
      errors.push(`${path} must be an object`);
      return errors;
    }

    for (const requiredKey of schema.required ?? []) {
      if (!(requiredKey in value)) errors.push(`${path}.${requiredKey} is required`);
    }

    for (const [key, entry] of Object.entries(value)) {
      const propertySchema = schema.properties?.[key];

      if (propertySchema) {
        errors.push(...validateSchemaFixture(propertySchema, entry, `${path}.${key}`));
        continue;
      }

      if (schema.additionalProperties === false) {
        errors.push(`${path}.${key} is not allowed`);
      } else if (isRecord(schema.additionalProperties)) {
        errors.push(...validateSchemaFixture(schema.additionalProperties, entry, `${path}.${key}`));
      }
    }
  }

  return errors;
}

describe.sequential("config utilsDir handling", () => {
  let tempDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "starwind-config-test-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("returns default utilsDir when config file is missing", async () => {
    const config = await getConfig();

    expect(config.utilsDir).toBe(PATHS.LOCAL_UTILS_DIR);
  });

  it("returns a fresh default when the config file is missing", async () => {
    const firstConfig = await getConfig();
    firstConfig.components.push({ name: "button", version: "1.0.0" });
    const secondConfig = await getConfig();
    const secondComponents = [...secondConfig.components];
    firstConfig.components.length = 0;

    expect(secondComponents).toEqual([]);
  });

  it("rejects malformed config reads and updates without changing the file bytes", async () => {
    const malformedConfig = Buffer.from(
      '{\r\n  "$schema": "https://starwind.dev/config-schema.v2.json",\r\n',
    );
    await writeFile("starwind.config.json", malformedConfig);

    await expect(getConfig()).rejects.toThrow(/starwind\.config\.json/);
    await expect(readFile("starwind.config.json")).resolves.toEqual(malformedConfig);

    await expect(
      updateConfig({ components: [{ name: "button", version: "1.0.0" }] }),
    ).rejects.toThrow(/starwind\.config\.json/);
    await expect(readFile("starwind.config.json")).resolves.toEqual(malformedConfig);
  });

  it("rejects invalid current config reads and updates without changing the file bytes", async () => {
    const invalidConfig = Buffer.from(
      JSON.stringify(
        {
          $schema: CONFIG_SCHEMA_V2_URL,
          version: 2,
          framework: "vue",
          registry: {
            source: "bundled",
            version: "2.0.0",
          },
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
    );
    await writeFile("starwind.config.json", invalidConfig);

    await expect(getConfig()).rejects.toThrow(/starwind\.config\.json/);
    await expect(readFile("starwind.config.json")).resolves.toEqual(invalidConfig);

    await expect(updateConfig({ utilsDir: "src/shared/utils" })).rejects.toThrow(
      /starwind\.config\.json/,
    );
    await expect(readFile("starwind.config.json")).resolves.toEqual(invalidConfig);
  });

  it("propagates non-missing config read errors with path context", async () => {
    const readError = Object.assign(new Error("permission denied"), { code: "EACCES" });
    vi.spyOn(fsUtils, "readJsonFile").mockRejectedValueOnce(readError);

    const error = await getConfig().then(
      () => undefined,
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/starwind\.config\.json/);
    expect((error as Error).cause).toBe(readError);
  });

  it("preserves existing utilsDir when updates omit it", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: DEFAULT_SCHEMA,
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          utilsDir: "src/custom/utils",
          components: [],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await updateConfig({ components: [{ name: "button", version: "2.3.1" }] });

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(updatedConfig.utilsDir).toBe("src/custom/utils");
  });

  it("writes updated utilsDir when explicitly provided", async () => {
    await updateConfig({ utilsDir: "src/shared/utils", components: [] });

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(updatedConfig.utilsDir).toBe("src/shared/utils");
  });

  it("detects legacy and v2 config files without losing component version data", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: DEFAULT_SCHEMA,
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          components: [{ name: "button", version: "2.3.1" }],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(getConfigState()).resolves.toMatchObject({
      status: "legacy",
      config: {
        componentDir: "src/components/starwind",
        components: [{ name: "button", version: "2.3.1" }],
      },
    });

    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "react",
          registry: {
            source: "remote",
            url: "https://starwind.dev/registry/2.0.0/registry.json",
            version: "2.0.0",
          },
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          utilsDir: "src/lib/utils",
          components: [
            {
              name: "button",
              version: "2.4.0",
              framework: "react",
              registry: "default",
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(getConfigState()).resolves.toMatchObject({
      status: "current",
      config: {
        version: 2,
        framework: "react",
        registry: {
          source: "remote",
          version: "2.0.0",
        },
        componentDir: "src/components/starwind",
        components: [
          {
            name: "button",
            version: "2.4.0",
            framework: "react",
            registry: "default",
          },
        ],
      },
    });
  });

  it("preserves v2 registry metadata while updating styled component versions", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "react",
          registry: {
            source: "bundled",
            version: "2.0.0",
          },
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          utilsDir: "src/lib/utils",
          components: [
            {
              name: "button",
              version: "2.4.0",
              framework: "react",
              registry: "default",
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await updateConfig({
      components: [
        {
          name: "button",
          version: "2.5.0",
          framework: "react",
          registry: "default",
        },
      ],
    });

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(updatedConfig).toMatchObject({
      version: 2,
      framework: "react",
      registry: {
        source: "bundled",
        version: "2.0.0",
      },
      components: [
        {
          name: "button",
          version: "2.5.0",
          framework: "react",
          registry: "default",
        },
      ],
    });
  });

  it("writes full v2 metadata when promoting a project config", async () => {
    await updateConfig({
      $schema: "https://starwind.dev/config-schema.v2.json",
      version: 2,
      framework: "react",
      registry: {
        source: "bundled",
        version: "2.0.0",
      },
      componentDir: "src/components/starwind",
      components: [
        {
          name: "button",
          version: "2.4.0",
          framework: "react",
        },
      ],
    });

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(Object.keys(updatedConfig).slice(0, 10)).toEqual([
      "$schema",
      "version",
      "framework",
      "registry",
      "components",
      "tailwind",
      "componentDir",
      "utilsDir",
    ]);
    expect(updatedConfig.componentLayer).toBeUndefined();
    expect(updatedConfig.primitives).toBeUndefined();
    expect(updatedConfig.packageRequirements).toBeUndefined();
    expect(updatedConfig).toMatchObject({
      $schema: "https://starwind.dev/config-schema.v2.json",
      version: 2,
      framework: "react",
      registry: {
        source: "bundled",
        version: "2.0.0",
      },
      components: [
        {
          name: "button",
          version: "2.4.0",
          framework: "react",
        },
      ],
    });
  });

  it("resolves default Starwind Pro registry config without writing it to generated v2 config", async () => {
    await updateConfig({
      $schema: CONFIG_SCHEMA_V2_URL,
      version: 2,
      framework: "astro",
      registry: {
        source: "bundled",
        version: "2.0.0",
      },
      componentDir: "src/components/starwind",
      components: [],
    });

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(updatedConfig.pro).toBeUndefined();

    const state = await getConfigState();
    expect(resolveStarwindProRegistryConfig(state.config)).toEqual({
      url: PATHS.STARWIND_PRO_REGISTRY,
      headers: {
        Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
      },
      params: {},
    });
  });

  it("preserves explicit Starwind Pro registry URL, headers, and params", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: CONFIG_SCHEMA_V2_URL,
          version: 2,
          framework: "astro",
          registry: {
            source: "bundled",
            version: "2.0.0",
          },
          pro: {
            registry: {
              url: "http://localhost:4321/r/{name}",
              headers: {
                Authorization: "Bearer ${LOCAL_STARWIND_KEY}",
                "X-Registry-Mode": "preview",
              },
              params: {
                channel: "${STARWIND_PRO_CHANNEL}",
              },
            },
          },
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

    await updateConfig({ components: [{ name: "button", version: "2.5.0" }] });

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(updatedConfig.pro).toEqual({
      registry: {
        url: "http://localhost:4321/r/{name}",
        headers: {
          Authorization: "Bearer ${LOCAL_STARWIND_KEY}",
          "X-Registry-Mode": "preview",
        },
        params: {
          channel: "${STARWIND_PRO_CHANNEL}",
        },
      },
    });

    expect(resolveStarwindProRegistryConfig(updatedConfig)).toEqual({
      url: "http://localhost:4321/r/{name}",
      headers: {
        Authorization: "Bearer ${LOCAL_STARWIND_KEY}",
        "X-Registry-Mode": "preview",
      },
      params: {
        channel: "${STARWIND_PRO_CHANNEL}",
      },
    });
  });

  it("adds default Starwind Pro auth while preserving existing registry overrides", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: CONFIG_SCHEMA_V2_URL,
          version: 2,
          framework: "astro",
          registry: {
            source: "bundled",
            version: "2.0.0",
          },
          pro: {
            registry: {
              url: "http://localhost:4321/r/{name}",
              headers: {
                "X-Registry-Mode": "preview",
              },
              params: {
                channel: "dev",
              },
            },
          },
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

    await setupStarwindProConfig();

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    const updatedKeys = Object.keys(updatedConfig);
    expect(updatedKeys.indexOf("pro")).toBeLessThan(updatedKeys.indexOf("components"));
    expect(updatedKeys.indexOf("pro")).toBeLessThan(updatedKeys.indexOf("tailwind"));
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
  });

  it("expands available Starwind Pro registry values and omits missing optional headers and params", () => {
    const requestConfig = resolveStarwindProRegistryRequest(
      {
        $schema: CONFIG_SCHEMA_V2_URL,
        version: 2,
        framework: "astro",
        registry: {
          source: "bundled",
          version: "2.0.0",
        },
        pro: {
          registry: {
            headers: {
              Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
              "X-Static": "yes",
              "X-Missing": "${OPTIONAL_HEADER}",
            },
            params: {
              channel: "${STARWIND_PRO_CHANNEL}",
              empty: "${OPTIONAL_PARAM}",
            },
          },
        },
        tailwind: {
          css: "src/styles/starwind.css",
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: "src/components/starwind",
        components: [],
      },
      {
        STARWIND_LICENSE_KEY: "abc123",
        STARWIND_PRO_CHANNEL: "beta",
      },
    );

    expect(requestConfig).toEqual({
      url: PATHS.STARWIND_PRO_REGISTRY,
      headers: {
        Authorization: "Bearer abc123",
        "X-Static": "yes",
      },
      params: {
        channel: "beta",
      },
    });
  });

  it("does not include a blank default Pro auth header when no license key is available", () => {
    expect(resolveStarwindProRegistryRequest(undefined, {})).toEqual({
      url: PATHS.STARWIND_PRO_REGISTRY,
      headers: {},
      params: {},
    });
  });

  it("couples default Pro auth to the final expanded official origin", () => {
    expect(
      resolveStarwindProRegistryRequest(
        {
          pro: {
            registry: {
              url: "${FAKE_REGISTRY_ORIGIN}/custom/{name}",
            },
          },
        },
        {
          FAKE_REGISTRY_ORIGIN: "https://pro.starwind.dev",
          STARWIND_LICENSE_KEY: "fake-expanded-origin-license",
        },
      ),
    ).toEqual({
      url: "https://pro.starwind.dev/custom/{name}",
      headers: {
        Authorization: "Bearer fake-expanded-origin-license",
      },
      params: {},
    });
  });

  it("rejects the default license placeholder in Pro registry query params", () => {
    const resolveRequest = () =>
      resolveStarwindProRegistryRequest(
        {
          pro: {
            registry: {
              params: {
                license: "${STARWIND_LICENSE_KEY}",
              },
            },
          },
        },
        {
          STARWIND_LICENSE_KEY: "fake-query-license",
        },
      );

    expect(resolveRequest).toThrow(/query params/i);

    try {
      resolveRequest();
    } catch (error) {
      expect(String(error)).not.toContain("fake-query-license");
    }
  });

  it("rejects the default license placeholder in the Pro registry URL query", () => {
    expect(() =>
      resolveStarwindProRegistryRequest(
        {
          pro: {
            registry: {
              url: "https://pro.starwind.dev/r/{name}?license=${STARWIND_LICENSE_KEY}",
            },
          },
        },
        {
          STARWIND_LICENSE_KEY: "fake-url-query-license",
        },
      ),
    ).toThrow(/query params/i);
  });

  it("rejects malformed Starwind Pro registry config with field-specific errors", () => {
    expect(() =>
      parseCurrentConfig({
        $schema: CONFIG_SCHEMA_V2_URL,
        version: 2,
        framework: "astro",
        registry: {
          source: "bundled",
          version: "2.0.0",
        },
        pro: {
          registry: {
            url: 42,
          },
        },
        tailwind: {
          css: "src/styles/starwind.css",
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: "src/components/starwind",
        components: [],
      }),
    ).toThrow(/pro\.registry\.url/);

    expect(() =>
      parseCurrentConfig({
        $schema: CONFIG_SCHEMA_V2_URL,
        version: 2,
        framework: "astro",
        registry: {
          source: "bundled",
          version: "2.0.0",
        },
        pro: {
          registry: {
            headers: {
              Authorization: 42,
            },
          },
        },
        tailwind: {
          css: "src/styles/starwind.css",
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: "src/components/starwind",
        components: [],
      }),
    ).toThrow(/pro\.registry\.headers\.Authorization/);
  });

  it("publishes a docs-site v2 config schema with optional Starwind Pro registry settings", async () => {
    const schemaPath = join(
      previousCwd,
      "..",
      "..",
      ".local",
      "starwind-docs",
      "public",
      "config-schema.v2.json",
    );
    let schema: any;
    try {
      schema = JSON.parse(await readFile(schemaPath, "utf-8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }

    expect(schema.properties.$schema.default).toBe(CONFIG_SCHEMA_V2_URL);
    expect(schema.properties.version.const).toBe(2);
    expect(schema.properties.implementation).toBeUndefined();
    expect(schema.properties.componentLayer).toBeUndefined();
    expect(schema.properties.packageRequirements).toBeUndefined();
    expect(schema.required).toEqual(
      expect.arrayContaining([
        "$schema",
        "version",
        "framework",
        "registry",
        "tailwind",
        "componentDir",
        "components",
      ]),
    );

    const proRegistry = schema.properties.pro.properties.registry;
    expect(proRegistry.required ?? []).toEqual([]);
    expect(proRegistry.properties.url.type).toBe("string");
    expect(proRegistry.properties.headers.additionalProperties.type).toBe("string");
    expect(proRegistry.properties.params.additionalProperties.type).toBe("string");
    expect(proRegistry.additionalProperties).toBe(false);
    const customRegistrySchemas = schema.properties.registries.additionalProperties.oneOf;
    expect(customRegistrySchemas.map((entry: any) => entry.properties.source.const)).toEqual([
      "local",
      "remote",
    ]);
    expect(customRegistrySchemas[0].required).toEqual(["source", "version", "path"]);
    expect(customRegistrySchemas[1].required).toEqual(["source", "version", "url"]);
    expect(schema.required).not.toContain("primitiveDir");
    expect(schema.required).not.toContain("primitiveDirs");
    expect(schema.required).not.toContain("primitives");
    expect(schema.required).not.toContain("componentDirs");
    expect(schema.properties.componentDir.description).toContain("primary framework");
    expect(schema.properties.componentDirs.properties.astro.type).toBe("string");
    expect(schema.properties.componentDirs.properties.astro.minLength).toBe(1);
    expect(schema.properties.componentDirs.properties.react.type).toBe("string");
    expect(schema.properties.componentDirs.properties.react.minLength).toBe(1);
    expect(schema.properties.componentDirs.additionalProperties).toBe(false);
    expect(schema.properties.primitiveDir.description).toContain("vendored");
    expect(schema.properties.primitiveDirs.properties.react.type).toBe("string");
    expect(schema.properties.primitiveDirs.additionalProperties).toBe(false);
    expect(schema.properties.primitives.description).toContain("vendored");
    const componentEntrySchemas = schema.properties.components.items.oneOf;
    const styledComponentSchema = componentEntrySchemas.find((entry: any) =>
      Boolean(entry.properties.framework),
    );
    const legacyComponentSchema = componentEntrySchemas.find((entry: any) =>
      Boolean(entry.properties.source),
    );
    expect(styledComponentSchema.properties.framework.enum).toEqual(["astro", "react"]);
    expect(styledComponentSchema.required).toEqual(["name", "version", "framework", "registry"]);
    expect(legacyComponentSchema.properties.source.enum).toEqual(["legacy"]);
    expect(legacyComponentSchema.properties.framework).toBeUndefined();
    expect(legacyComponentSchema.properties.registry).toBeUndefined();
    expect(styledComponentSchema.properties.styledVersion).toBeUndefined();
    expect(styledComponentSchema.properties.implementation).toBeUndefined();

    const validConfig = {
      $schema: CONFIG_SCHEMA_V2_URL,
      version: 2,
      framework: "astro",
      registry: {
        source: "bundled",
        version: "2.0.0",
      },
      registries: {
        "remote-docs": {
          source: "remote",
          version: "2.0.0",
          url: "https://example.com/starwind-registry.json",
        },
        "local-docs": {
          source: "local",
          version: "2.0.0",
          path: "fixtures/starwind-registry.json",
        },
      },
      pro: {
        registry: {
          url: "http://localhost:4321/r/{name}",
          headers: {
            Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
          },
          params: {
            channel: "${STARWIND_PRO_CHANNEL}",
          },
        },
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
      primitiveDir: "src/components/starwind-primitives",
      primitiveDirs: {
        react: "src/components/starwind-react-primitives",
      },
      utilsDir: "src/lib/utils",
      components: [
        {
          name: "button",
          version: "2.5.0",
          framework: "astro",
          registry: "default",
        },
      ],
      primitives: [
        {
          framework: "astro",
          name: "accordion",
          source: "bundled",
          version: "1.0.0",
        },
      ],
    };

    expect(validateSchemaFixture(schema, validConfig)).toEqual([]);

    const invalidConfig = {
      ...validConfig,
      pro: {
        registry: {
          url: "",
          headers: {
            Authorization: 42,
          },
          extra: true,
        },
      },
    };

    expect(validateSchemaFixture(schema, invalidConfig)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("$.pro.registry.url"),
        expect.stringContaining("$.pro.registry.headers.Authorization"),
        expect.stringContaining("$.pro.registry.extra"),
      ]),
    );

    const invalidComponentConfig = {
      ...validConfig,
      components: [
        {
          name: "button",
          version: "2.5.0",
          styledVersion: "2.5.0",
          implementation: "astro",
          registry: "default",
        },
      ],
    };

    expect(validateSchemaFixture(schema, invalidComponentConfig)).toEqual(
      expect.arrayContaining([expect.stringContaining("$.components[0]")]),
    );

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        registry: {
          source: "local",
          version: "2.0.0",
        },
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.registry")]));

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        componentDirs: {
          vue: "src/components/starwind-vue",
        },
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.componentDirs.vue")]));

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        componentDirs: {
          react: 42,
        },
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.componentDirs.react")]));

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        componentDirs: {
          react: "",
        },
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.componentDirs.react")]));

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        registry: {
          source: "remote",
          version: "2.0.0",
        },
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.registry")]));

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        components: [{ name: "button", version: "2.5.0", framework: "astro" }],
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.components[0]")]));

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        components: [
          {
            framework: "astro",
            name: "button",
            registry: "default",
            source: "legacy",
            version: "2.5.0",
          },
        ],
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.components[0]")]));

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        components: [
          {
            name: "button",
            version: "2.5.0",
            source: "legacy",
            registry: "default",
          },
        ],
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.components[0]")]));

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        components: [
          {
            name: "button",
            version: "2.5.0",
            source: "legacy",
            framework: "astro",
          },
        ],
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.components[0]")]));

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        registries: {
          default: {
            source: "remote",
            version: "2.0.0",
            url: "https://example.com/starwind-registry.json",
          },
        },
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.registries")]));

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        registries: {
          "remote-docs": {
            source: "remote",
            version: "2.0.0",
          },
        },
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.registries.remote-docs")]));

    expect(
      validateSchemaFixture(schema, {
        ...validConfig,
        registries: {
          "local-docs": {
            source: "local",
            version: "2.0.0",
          },
        },
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("$.registries.local-docs")]));
  });

  it("rejects ambiguous current v2 component entry shapes", () => {
    const baseConfig = {
      $schema: CONFIG_SCHEMA_V2_URL,
      version: 2,
      framework: "astro",
      registry: {
        source: "bundled",
        version: "2.0.0",
      },
      tailwind: {
        css: "src/styles/starwind.css",
        baseColor: "neutral",
        cssVariables: true,
      },
      componentDir: "src/components/starwind",
      components: [],
    };

    expect(() =>
      parseCurrentConfig({
        ...baseConfig,
        components: [{ name: "button", version: "2.5.0", registry: "default" }],
      }),
    ).toThrow(/Expected exactly one of framework or source/);

    expect(() =>
      parseCurrentConfig({
        ...baseConfig,
        components: [
          {
            framework: "astro",
            name: "button",
            registry: "default",
            source: "legacy",
            version: "2.5.0",
          },
        ],
      }),
    ).toThrow(/Expected exactly one of framework or source/);
  });

  it("parses styled registry catalogs and rejects missing component registry references", () => {
    const baseConfig = {
      $schema: CONFIG_SCHEMA_V2_URL,
      version: 2,
      framework: "astro",
      registry: {
        source: "bundled",
        version: "2.0.0",
      },
      registries: {
        "remote-custom": {
          source: "remote",
          version: "2.0.0",
          url: "https://example.com/starwind-registry.json",
        },
      },
      tailwind: {
        css: "src/styles/starwind.css",
        baseColor: "neutral",
        cssVariables: true,
      },
      componentDir: "src/components/starwind",
      components: [
        {
          framework: "astro",
          name: "button",
          registry: "remote-custom",
          version: "2.5.0",
        },
      ],
    };

    expect(parseCurrentConfig(baseConfig)).toMatchObject({
      registries: baseConfig.registries,
      components: [{ name: "button", registry: "remote-custom" }],
    });

    expect(() =>
      parseCurrentConfig({
        ...baseConfig,
        components: [{ framework: "astro", name: "button", version: "2.5.0" }],
      }),
    ).toThrow(/component "button" registry/);

    expect(() =>
      parseCurrentConfig({
        ...baseConfig,
        components: [
          {
            framework: "astro",
            name: "button",
            registry: "missing-registry",
            version: "2.5.0",
          },
        ],
      }),
    ).toThrow(/unknown styled registry/);
  });

  it("ignores stale private-beta top-level implementation labels", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "react",
          implementation: "vue",
          registry: {
            source: "bundled",
            version: "2.0.0",
          },
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

    await expect(getConfigState()).resolves.toMatchObject({
      status: "current",
      config: {
        framework: "react",
      },
    });

    const state = await getConfigState();
    expect(state.config).not.toHaveProperty("implementation");
  });

  it("rejects current configs that only provide stale top-level implementation labels", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          implementation: "react",
          registry: {
            source: "bundled",
            version: "2.0.0",
          },
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

    await expect(getConfigState()).rejects.toThrow(/Invalid Starwind config framework/);
  });

  it("parses private-beta component layer fields but normalizes them away on write", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "react",
          componentLayer: "widgets",
          packageRequirements: {
            "@starwind-ui/runtime": "^1.0.0",
          },
          registry: {
            source: "bundled",
            version: "2.0.0",
          },
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          primitiveDir: "src/custom-primitives",
          components: [],
          primitives: [{ name: "button", version: "0.1.0", framework: "react" }],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(getConfigState()).resolves.toMatchObject({
      status: "current",
      config: {
        componentLayer: "widgets",
        packageRequirements: {
          "@starwind-ui/runtime": "^1.0.0",
        },
        primitives: [{ name: "button", version: "0.1.0", framework: "react" }],
      },
    });

    await updateConfig({ components: [{ name: "card", version: "1.0.0" }] });

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(updatedConfig.componentLayer).toBeUndefined();
    expect(updatedConfig.packageRequirements).toBeUndefined();
    expect(updatedConfig.primitiveDir).toBe("src/custom-primitives");
    expect(updatedConfig.primitives).toEqual([
      { name: "button", version: "0.1.0", framework: "react" },
    ]);
  });

  it("tracks primitive directories per framework and merges primitive state by framework and name", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "astro",
          registry: {
            source: "bundled",
            version: "2.0.0",
          },
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          primitiveDir: "src/components/starwind-primitives",
          primitiveDirs: {
            react: "src/components/starwind-react-primitives",
          },
          components: [],
          primitives: [{ name: "button", version: "0.1.0", framework: "astro" }],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(getConfigState()).resolves.toMatchObject({
      status: "current",
      config: {
        primitiveDirs: {
          react: "src/components/starwind-react-primitives",
        },
      },
    });

    await updateConfig({
      primitiveDirs: {
        react: "src/reference/react-primitives",
      },
      primitives: [{ name: "button", version: "0.2.0", framework: "react" }],
    });

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(updatedConfig.primitiveDir).toBe("src/components/starwind-primitives");
    expect(updatedConfig.primitiveDirs).toEqual({
      react: "src/reference/react-primitives",
    });
    expect(updatedConfig.primitives).toEqual([
      { name: "button", version: "0.1.0", framework: "astro" },
      { name: "button", version: "0.2.0", framework: "react" },
    ]);
  });

  it("tracks component directories per framework and merges Runtime components by framework and name", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "astro",
          registry: {
            source: "bundled",
            version: "2.0.0",
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
          components: [
            { name: "button", version: "1.0.0", framework: "astro", registry: "default" },
            { name: "button", version: "0.9.0", source: "legacy" },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(getConfigState()).resolves.toMatchObject({
      status: "current",
      config: {
        componentDirs: {
          react: "src/components/starwind-react",
        },
      },
    });

    await updateConfig({
      componentDirs: {
        react: "src/reference/react-components",
      },
      components: [{ name: "button", version: "2.0.0", framework: "react" }],
    });

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(updatedConfig.componentDir).toBe("src/components/starwind");
    expect(updatedConfig.componentDirs).toEqual({
      react: "src/reference/react-components",
    });
    expect(Object.keys(updatedConfig)).toEqual([
      "$schema",
      "version",
      "framework",
      "registry",
      "components",
      "tailwind",
      "componentDir",
      "componentDirs",
      "utilsDir",
    ]);
    expect(updatedConfig.components).toEqual([
      { name: "button", version: "1.0.0", framework: "astro", registry: "default" },
      { name: "button", version: "0.9.0", source: "legacy" },
      { name: "button", version: "2.0.0", framework: "react", registry: "default" },
    ]);

    await updateConfig({
      components: [{ name: "button", version: "2.1.0", framework: "react" }],
    });

    const replacedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(replacedConfig.components).toEqual([
      { name: "button", version: "1.0.0", framework: "astro", registry: "default" },
      { name: "button", version: "0.9.0", source: "legacy" },
      { name: "button", version: "2.1.0", framework: "react", registry: "default" },
    ]);
  });

  it("rejects invalid component directory maps", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "astro",
          registry: {
            source: "bundled",
            version: "2.0.0",
          },
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          componentDirs: {
            vue: "src/components/starwind-vue",
          },
          components: [],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(getConfigState()).rejects.toThrow(/componentDirs\.vue/);

    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "astro",
          registry: {
            source: "bundled",
            version: "2.0.0",
          },
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          componentDirs: {
            react: 123,
          },
          components: [],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(getConfigState()).rejects.toThrow(/componentDirs\.react/);
  });

  it("normalizes empty component directory maps away", () => {
    const config = parseCurrentConfig({
      $schema: "https://starwind.dev/config-schema.v2.json",
      version: 2,
      framework: "astro",
      registry: {
        source: "bundled",
        version: "2.0.0",
      },
      tailwind: {
        css: "src/styles/starwind.css",
        baseColor: "neutral",
        cssVariables: true,
      },
      componentDir: "src/components/starwind",
      componentDirs: {},
      components: [],
    });

    expect(config.componentDirs).toBeUndefined();
  });

  it("resolves primary and alternative styled component directories", () => {
    const config = parseCurrentConfig({
      $schema: "https://starwind.dev/config-schema.v2.json",
      version: 2,
      framework: "astro",
      registry: {
        source: "bundled",
        version: "2.0.0",
      },
      tailwind: {
        css: "src/styles/starwind.css",
        baseColor: "neutral",
        cssVariables: true,
      },
      componentDir: "src/components/starwind",
      componentDirs: {
        react: "src/reference/react-components",
      },
      components: [],
    });

    expect(getStyledComponentDir(config, "astro")).toBe("src/components/starwind");
    expect(getStyledComponentDir(config, "react")).toBe("src/reference/react-components");
    expect(
      getStyledComponentDir(
        {
          ...config,
          componentDirs: undefined,
        },
        "react",
      ),
    ).toBe("src/components/starwind-react");
    expect(getStyledComponentDirConfigUpdate(config, "astro", "src/custom/starwind")).toEqual({
      componentDir: "src/custom/starwind",
    });
    expect(getStyledComponentDirConfigUpdate(config, "react", "src/custom/starwind-react")).toEqual(
      {
        componentDirs: {
          react: "src/custom/starwind-react",
        },
      },
    );
  });

  it("rejects non-semver v2 registry and component versions", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "react",
          registry: {
            source: "bundled",
            version: "2026-06-18",
          },
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

    await expect(getConfigState()).rejects.toThrow(/registry version/);

    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "react",
          registry: {
            source: "bundled",
            version: "2.0.0",
          },
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          components: [
            {
              name: "button",
              version: "latest",
              framework: "react",
              registry: "default",
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await expect(getConfigState()).rejects.toThrow(/component "button" version/);
  });
});
