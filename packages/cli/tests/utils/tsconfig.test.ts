import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import * as p from "@clack/prompts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as fsUtils from "../../src/utils/fs.js";
import {
  createDefaultTsConfig,
  isAstroReactTsConfigReady,
  mergeTsConfig,
  mergeVueTsConfig,
  setupTsConfig,
  setupVueTsConfig,
  setupAstroReactTsConfig,
  validateTsConfig,
} from "../../src/utils/tsconfig.js";

// Mock dependencies
vi.mock("@clack/prompts");
vi.mock("../../src/utils/fs.js");

const mockFileExists = vi.mocked(fsUtils.fileExists);
const mockReadJsonFile = vi.mocked(fsUtils.readJsoncFile);
const mockWriteJsonFile = vi.mocked(fsUtils.writeJsonFile);
const mockLogError = vi.fn();
const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const tscPath = path.join(
  path.dirname(require.resolve("typescript/package.json")),
  "lib",
  "tsc.js",
);

async function compileReactJavaScriptFixture(
  configFile: "tsconfig.app.json" | "tsconfig.json",
  config: ReturnType<typeof mergeTsConfig>,
): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "starwind-tsconfig-"));
  try {
    await Promise.all([
      mkdir(path.join(directory, "src", "components"), { recursive: true }),
      mkdir(path.join(directory, "src", "lib"), { recursive: true }),
      mkdir(path.join(directory, "node_modules", "react"), { recursive: true }),
      mkdir(path.join(directory, "node_modules", "vite"), { recursive: true }),
      mkdir(path.join(directory, "node_modules", "@starwind-ui", "react"), { recursive: true }),
    ]);
    if (configFile === "tsconfig.app.json") {
      await writeFile(
        path.join(directory, "tsconfig.json"),
        JSON.stringify({ files: [], references: [{ path: "./tsconfig.app.json" }] }),
        "utf8",
      );
    }
    await Promise.all([
      writeFile(path.join(directory, configFile), JSON.stringify(config), "utf8"),
      writeFile(
        path.join(directory, "src", "App.jsx"),
        'import { Button } from "@/components/Button";\nexport default function App() { return <Button label="Ready" />; }\n',
        "utf8",
      ),
      writeFile(
        path.join(directory, "src", "components", "Button.tsx"),
        'import { ButtonRoot } from "@starwind-ui/react/button";\nimport { message } from "@/lib/message";\nexport function Button({ label }: { label: string }) { return <ButtonRoot label={`${message}: ${label}`} />; }\n',
        "utf8",
      ),
      writeFile(
        path.join(directory, "src", "lib", "message.ts"),
        'export const message = "Status";\n',
        "utf8",
      ),
      writeFile(
        path.join(directory, "node_modules", "react", "package.json"),
        JSON.stringify({
          name: "react",
          exports: { "./jsx-runtime": { types: "./jsx-runtime.d.ts" } },
        }),
        "utf8",
      ),
      writeFile(
        path.join(directory, "node_modules", "react", "jsx-runtime.d.ts"),
        "export namespace JSX { interface Element {} interface IntrinsicElements { button: { label?: string } } }\nexport function jsx(type: unknown, props: unknown): JSX.Element;\nexport function jsxs(type: unknown, props: unknown): JSX.Element;\nexport const Fragment: unknown;\n",
        "utf8",
      ),
      writeFile(
        path.join(directory, "node_modules", "vite", "client.d.ts"),
        'declare module "*.css" {}\n',
        "utf8",
      ),
      writeFile(
        path.join(directory, "node_modules", "@starwind-ui", "react", "package.json"),
        JSON.stringify({
          name: "@starwind-ui/react",
          exports: { "./button": { types: "./button.d.ts", default: "./button.js" } },
        }),
        "utf8",
      ),
      writeFile(
        path.join(directory, "node_modules", "@starwind-ui", "react", "button.d.ts"),
        'export declare function ButtonRoot(props: { label: string }): import("react/jsx-runtime").JSX.Element;\n',
        "utf8",
      ),
      writeFile(
        path.join(directory, "node_modules", "@starwind-ui", "react", "button.js"),
        "export function ButtonRoot() {}\n",
        "utf8",
      ),
    ]);

    try {
      const args =
        configFile === "tsconfig.app.json"
          ? [tscPath, "--build", "tsconfig.json", "--listFiles", "--pretty", "false"]
          : [tscPath, "--noEmit", "--project", configFile, "--listFiles", "--pretty", "false"];
      const result = await execFileAsync(process.execPath, args, { cwd: directory });
      return result.stdout.replaceAll("\\", "/");
    } catch (error) {
      if (error instanceof Error && ("stdout" in error || "stderr" in error)) {
        const stdout = "stdout" in error ? String(error.stdout) : "";
        const stderr = "stderr" in error ? String(error.stderr) : "";
        throw new Error(`${stdout}${stderr}`);
      }
      throw error;
    }
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

async function assertInstalledCompilerAcceptsTargets(targets: string[]): Promise<void> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "starwind-tsconfig-targets-"));
  try {
    const source = path.join(directory, "index.ts");
    await writeFile(source, "export const value = 1;\n", "utf8");
    const projects = await Promise.all(
      targets.map(async (target) => {
        const config = path.join(directory, `tsconfig.${target.toLowerCase()}.json`);
        await writeFile(
          config,
          JSON.stringify({
            compilerOptions: { noEmit: true, skipLibCheck: true, target, types: [] },
            files: [source],
          }),
          "utf8",
        );
        return config;
      }),
    );
    await Promise.all(
      projects.map((project) =>
        execFileAsync(process.execPath, [tscPath, "--project", project, "--pretty", "false"]),
      ),
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

describe("tsconfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(p.log).error = mockLogError;
  });

  it("adds Vue source aliases and preserves official create-vue settings", () => {
    const existing = {
      extends: "@vue/tsconfig/tsconfig.dom.json",
      compilerOptions: {
        paths: { "~/*": ["./src/*"] },
        strict: true,
      },
      include: ["env.d.ts", "src/**/*", "src/**/*.vue"],
    };
    const merged = mergeVueTsConfig(existing);

    expect(merged).toEqual({
      ...existing,
      compilerOptions: {
        ...existing.compilerOptions,
        baseUrl: ".",
        paths: { "~/*": ["./src/*"], "@/*": ["./src/*"] },
      },
    });
    expect(mergeVueTsConfig(merged)).toEqual(merged);
  });

  it("updates the official split Vue app config", async () => {
    mockFileExists.mockImplementation(async (filePath) => filePath === "tsconfig.app.json");
    mockReadJsonFile.mockResolvedValue({
      extends: "@vue/tsconfig/tsconfig.dom.json",
      include: ["src/**/*.vue"],
    });

    expect(await setupVueTsConfig()).toBe(true);
    expect(mockWriteJsonFile).toHaveBeenCalledWith(
      "tsconfig.app.json",
      expect.objectContaining({
        compilerOptions: expect.objectContaining({
          baseUrl: ".",
          paths: { "@/*": ["./src/*"] },
        }),
      }),
    );
  });

  it("adds the official Astro React JSX settings and preserves existing compiler options", async () => {
    mockFileExists.mockResolvedValue(true);
    mockReadJsonFile.mockResolvedValue({
      extends: "astro/tsconfigs/strict",
      compilerOptions: { paths: { "@/*": ["src/*"] }, target: "ES2022" },
    });

    expect(await setupAstroReactTsConfig()).toBe(true);
    expect(mockWriteJsonFile).toHaveBeenCalledWith(
      "tsconfig.json",
      expect.objectContaining({
        compilerOptions: expect.objectContaining({
          jsx: "react-jsx",
          jsxImportSource: "react",
          target: "ES2022",
          paths: { "@/*": ["src/*"] },
        }),
      }),
    );
  });

  it("reports Astro React JSX readiness from the project tsconfig", async () => {
    mockFileExists.mockResolvedValue(true);
    mockReadJsonFile.mockResolvedValue({
      compilerOptions: { jsx: "react-jsx", jsxImportSource: "react" },
    });

    await expect(isAstroReactTsConfigReady()).resolves.toBe(true);
  });

  describe("validateTsConfig", () => {
    it("should return all false for empty config", () => {
      const result = validateTsConfig({});

      expect(result).toEqual({
        hasExtends: false,
        hasBaseUrl: false,
        hasPathAlias: false,
        isComplete: false,
      });
    });

    it("should detect valid extends", () => {
      const result = validateTsConfig({
        extends: "astro/tsconfigs/strict",
      });

      expect(result.hasExtends).toBe(true);
      expect(result.isComplete).toBe(false);
    });

    it("should detect invalid extends", () => {
      const result = validateTsConfig({
        extends: "some/other/config",
      });

      expect(result.hasExtends).toBe(false);
    });

    it("should detect valid baseUrl", () => {
      const result = validateTsConfig({
        compilerOptions: {
          baseUrl: ".",
        },
      });

      expect(result.hasBaseUrl).toBe(true);
      expect(result.isComplete).toBe(false);
    });

    it("should detect invalid baseUrl", () => {
      const result = validateTsConfig({
        compilerOptions: {
          baseUrl: "./src",
        },
      });

      expect(result.hasBaseUrl).toBe(false);
    });

    it("should detect valid path alias", () => {
      const result = validateTsConfig({
        compilerOptions: {
          paths: {
            "@/*": ["src/*"],
          },
        },
      });

      expect(result.hasPathAlias).toBe(true);
      expect(result.isComplete).toBe(false);
    });

    it("should detect missing @/* path alias", () => {
      const result = validateTsConfig({
        compilerOptions: {
          paths: {
            "~/*": ["src/*"],
          },
        },
      });

      expect(result.hasPathAlias).toBe(false);
    });

    it("should detect @/* alias without src/*", () => {
      const result = validateTsConfig({
        compilerOptions: {
          paths: {
            "@/*": ["lib/*"],
          },
        },
      });

      expect(result.hasPathAlias).toBe(false);
    });

    it("should detect @/* alias with src/* among other paths", () => {
      const result = validateTsConfig({
        compilerOptions: {
          paths: {
            "@/*": ["src/*", "lib/*"],
          },
        },
      });

      expect(result.hasPathAlias).toBe(true);
    });

    it("should return isComplete true when all requirements are met", () => {
      const result = validateTsConfig({
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      });

      expect(result).toEqual({
        hasExtends: true,
        hasBaseUrl: true,
        hasPathAlias: true,
        isComplete: true,
      });
    });

    it("should handle missing compilerOptions", () => {
      const result = validateTsConfig({
        extends: "astro/tsconfigs/strict",
      });

      expect(result.hasBaseUrl).toBe(false);
      expect(result.hasPathAlias).toBe(false);
    });

    it("should handle missing paths in compilerOptions", () => {
      const result = validateTsConfig({
        compilerOptions: {
          baseUrl: ".",
        },
      });

      expect(result.hasPathAlias).toBe(false);
    });

    it("should handle paths that is not an array", () => {
      const result = validateTsConfig({
        compilerOptions: {
          paths: {
            "@/*": "src/*" as unknown as string[],
          },
        },
      });

      expect(result.hasPathAlias).toBe(false);
    });

    it("should handle null values in paths", () => {
      const result = validateTsConfig({
        compilerOptions: {
          paths: {
            "@/*": null as unknown as string[],
          },
        },
      });

      expect(result.hasPathAlias).toBe(false);
    });

    it("should handle undefined compilerOptions", () => {
      const result = validateTsConfig({
        extends: "astro/tsconfigs/strict",
        compilerOptions: undefined,
      });

      expect(result.hasBaseUrl).toBe(false);
      expect(result.hasPathAlias).toBe(false);
    });
  });

  describe("mergeTsConfig", () => {
    it("repairs incompatible Vite scalar options as one valid compiler profile", () => {
      const result = mergeTsConfig(
        {
          compilerOptions: {
            checkJs: false,
            jsx: "react",
            jsxImportSource: "preact",
            module: "CommonJS",
            moduleResolution: "Node",
            paths: { "@/*": ["./*", "./src/*", "./legacy/*"] },
            target: "ES5",
          },
          include: ["src"],
        },
        "react",
        "src",
        true,
      );

      expect(result.compilerOptions).toMatchObject({
        checkJs: false,
        jsx: "react-jsx",
        jsxImportSource: "react",
        module: "ESNext",
        moduleResolution: "Bundler",
        paths: { "@/*": ["./src/*", "./*", "./legacy/*"] },
        target: "ES2022",
      });
    });

    it("preserves compatible modern scalar options and explicit JavaScript checking", () => {
      const result = mergeTsConfig(
        {
          compilerOptions: {
            checkJs: true,
            jsx: "preserve",
            jsxImportSource: "react",
            module: "ES2022",
            moduleResolution: "Bundler",
            paths: { "@/*": ["./src/*"] },
            target: "ES2020",
          },
          include: ["src"],
        },
        "react",
        "src",
        true,
      );

      expect(result.compilerOptions).toMatchObject({
        checkJs: true,
        jsx: "preserve",
        jsxImportSource: "react",
        module: "ES2022",
        moduleResolution: "Bundler",
        target: "ES2020",
      });
    });

    it("preserves only targets accepted by the installed TypeScript compiler", async () => {
      const supportedTargets = ["ES2020", "ES2021", "ES2022", "ES2023", "ES2024", "ESNext"];
      const preservedTargets = supportedTargets.map((target) => {
        const result = mergeTsConfig(
          {
            compilerOptions: { target },
          },
          "react",
          "src",
          true,
        );
        expect(result.compilerOptions?.target).toBe(target);
        return String(result.compilerOptions?.target);
      });

      await assertInstalledCompilerAcceptsTargets(preservedTargets);
    }, 15_000);

    it("repairs the first target beyond the installed compiler boundary", () => {
      const result = mergeTsConfig({ compilerOptions: { target: "ES2025" } }, "react", "src", true);

      expect(result.compilerOptions?.target).toBe("ES2022");
    });

    it("puts the required React source alias before a broader host target", () => {
      const result = mergeTsConfig(
        { compilerOptions: { paths: { "@/*": ["./*"] } } },
        "react",
        "src",
      );

      expect(result.compilerOptions?.paths?.["@/*"]).toEqual(["./src/*", "./*"]);
    });

    it("keeps additional alias targets after the required React source target", () => {
      const result = mergeTsConfig(
        { compilerOptions: { paths: { "@/*": ["./legacy/*", "./src/*", "./generated/*"] } } },
        "react",
        "src",
      );

      expect(result.compilerOptions?.paths?.["@/*"]).toEqual([
        "./src/*",
        "./legacy/*",
        "./generated/*",
      ]);
    });

    it("compiles application JSX and generated TSX from a repaired partial config", async () => {
      const config = mergeTsConfig(
        {
          compilerOptions: {
            jsx: "react",
            module: "CommonJS",
            moduleResolution: "Node",
            paths: { "@/*": ["./*"] },
            target: "ES5",
          },
          include: ["src/**/*.jsx"],
        },
        "react",
        "src",
        true,
      );

      const files = await compileReactJavaScriptFixture("tsconfig.json", config);

      expect(files).toContain("/src/App.jsx");
      expect(files).toContain("/src/components/Button.tsx");
    }, 15_000);

    it("compiles application JSX and generated TSX through a split app config", async () => {
      const config = mergeTsConfig(
        {
          compilerOptions: {
            composite: true,
            module: "ESNext",
            paths: { "@/*": ["./*"] },
          },
          include: ["src"],
        },
        "react",
        "src",
        true,
      );

      const files = await compileReactJavaScriptFixture("tsconfig.app.json", config);

      expect(files).toContain("/src/App.jsx");
      expect(files).toContain("/src/components/Button.tsx");
    }, 15_000);

    it("completes a partial Vite React JavaScript config and preserves host settings", () => {
      const existingConfig = {
        compilerOptions: {
          module: "Preserve",
          strict: false,
        },
        include: ["src/**/*.jsx"],
        references: [{ path: "./tsconfig.node.json" }],
      };

      const result = mergeTsConfig(existingConfig, "react", "src", true);

      expect(result).toEqual({
        compilerOptions: {
          allowJs: true,
          checkJs: false,
          jsx: "react-jsx",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "Preserve",
          moduleResolution: "Bundler",
          noEmit: true,
          paths: { "@/*": ["./src/*"] },
          skipLibCheck: true,
          strict: false,
          target: "ES2022",
          types: ["vite/client"],
        },
        include: ["src/**/*.jsx", "src/**/*.js", "src/**/*.ts", "src/**/*.tsx"],
        references: [{ path: "./tsconfig.node.json" }],
      });
    });

    it("keeps a complete Vite React JavaScript config unchanged", () => {
      const existingConfig = createDefaultTsConfig("react", "src", true);

      expect(mergeTsConfig(existingConfig, "react", "src", true)).toBe(existingConfig);
    });

    it("preserves React project references without adding an Astro extends", () => {
      const existingConfig = {
        files: [],
        references: [{ path: "./tsconfig.app.json" }, { path: "./tsconfig.node.json" }],
      };

      const result = mergeTsConfig(existingConfig, "react");

      expect(result.extends).toBeUndefined();
      expect(result.references).toEqual(existingConfig.references);
      expect(result.compilerOptions?.baseUrl).toBeUndefined();
      expect(result.compilerOptions?.paths?.["@/*"]).toEqual(["./src/*"]);
    });

    it("keeps a broader React alias after the required source alias", () => {
      const existingConfig = {
        compilerOptions: { paths: { "@/*": ["./*"] } },
      };

      const result = mergeTsConfig(existingConfig, "react", "src");

      expect(result.compilerOptions?.paths?.["@/*"]).toEqual(["./src/*", "./*"]);
    });

    it("should return existing config if already complete", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result).toEqual(existingConfig);
    });

    it("should add extends if missing", () => {
      const existingConfig = {
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.extends).toBe("astro/tsconfigs/strict");
    });

    it("should not override existing extends", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {},
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.extends).toBe("astro/tsconfigs/strict");
    });

    it("should add baseUrl if missing", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          paths: {
            "@/*": ["src/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.baseUrl).toBe(".");
    });

    it("should not override existing baseUrl that matches", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          strict: true,
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.baseUrl).toBe(".");
      expect(result.compilerOptions?.strict).toBe(true);
    });

    it("should add paths if missing", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.paths).toEqual({
        "@/*": ["src/*"],
      });
    });

    it("should add @/* path alias if paths exists but @/* is missing", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "~/*": ["lib/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.paths).toEqual({
        "~/*": ["lib/*"],
        "@/*": ["src/*"],
      });
    });

    it("should preserve existing path aliases when adding @/*", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "$lib/*": ["src/lib/*"],
            "~/*": ["src/components/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.paths).toEqual({
        "$lib/*": ["src/lib/*"],
        "~/*": ["src/components/*"],
        "@/*": ["src/*"],
      });
    });

    it("should not modify @/* if it already includes src/*", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*", "lib/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.paths?.["@/*"]).toEqual(["src/*", "lib/*"]);
    });

    it("should replace @/* if it doesn't include src/*", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["lib/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.paths?.["@/*"]).toEqual(["src/*"]);
    });

    it("should create compilerOptions if missing", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions).toBeDefined();
      expect(result.compilerOptions?.baseUrl).toBe(".");
      expect(result.compilerOptions?.paths?.["@/*"]).toEqual(["src/*"]);
    });

    it("should preserve other config properties", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        include: ["src/**/*"],
        exclude: ["node_modules"],
        compilerOptions: {
          baseUrl: ".",
          strict: true,
          paths: {
            "@/*": ["src/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.include).toEqual(["src/**/*"]);
      expect(result.exclude).toEqual(["node_modules"]);
      expect(result.compilerOptions?.strict).toBe(true);
    });

    it("should preserve other compilerOptions when adding required ones", () => {
      const existingConfig = {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          strict: true,
          jsx: "react-jsx",
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.target).toBe("ES2022");
      expect(result.compilerOptions?.module).toBe("ESNext");
      expect(result.compilerOptions?.strict).toBe(true);
      expect(result.compilerOptions?.jsx).toBe("react-jsx");
      expect(result.compilerOptions?.baseUrl).toBe(".");
      expect(result.compilerOptions?.paths?.["@/*"]).toEqual(["src/*"]);
    });
  });

  describe("createDefaultTsConfig", () => {
    it("creates a complete config for a Vite React JavaScript project", () => {
      expect(createDefaultTsConfig("react", "src", true)).toEqual({
        compilerOptions: {
          allowJs: true,
          checkJs: false,
          jsx: "react-jsx",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          paths: { "@/*": ["./src/*"] },
          skipLibCheck: true,
          target: "ES2022",
          types: ["vite/client"],
        },
        include: ["src"],
      });
    });

    it("creates a path-only React config when JavaScript support is not requested", () => {
      expect(createDefaultTsConfig("react")).toEqual({
        compilerOptions: { paths: { "@/*": ["./src/*"] } },
      });
    });

    it("creates a root-directory React alias for a root Next app", () => {
      expect(createDefaultTsConfig("react", ".")).toEqual({
        compilerOptions: {
          paths: { "@/*": ["./*"] },
        },
      });
    });

    it("creates an app-directory React alias for React Router framework mode", () => {
      expect(createDefaultTsConfig("react", "app")).toEqual({
        compilerOptions: {
          paths: { "@/*": ["./app/*"] },
        },
      });
    });

    it("should create a valid default config", () => {
      const result = createDefaultTsConfig();

      expect(result).toEqual({
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      });
    });

    it("should create a new object each time", () => {
      const result1 = createDefaultTsConfig();
      const result2 = createDefaultTsConfig();

      expect(result1).not.toBe(result2);
      expect(result1.compilerOptions).not.toBe(result2.compilerOptions);
      expect(result1.compilerOptions?.paths).not.toBe(result2.compilerOptions?.paths);
    });
  });

  describe("setupTsConfig", () => {
    it("updates the split Vite React app config when present", async () => {
      mockFileExists.mockImplementation(async (filePath) => filePath === "tsconfig.app.json");
      mockReadJsonFile.mockResolvedValue({
        compilerOptions: { jsx: "react-jsx" },
      });
      mockWriteJsonFile.mockResolvedValue(undefined);

      const result = await setupTsConfig("react", "src", true);

      expect(result).toBe(true);
      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        "tsconfig.app.json",
        expect.objectContaining({
          compilerOptions: expect.objectContaining({
            jsx: "react-jsx",
            allowJs: true,
            checkJs: false,
            module: "ESNext",
            moduleResolution: "Bundler",
            paths: { "@/*": ["./src/*"] },
          }),
          include: ["src"],
        }),
      );
      expect(mockWriteJsonFile.mock.calls[0]?.[1]).not.toHaveProperty("extends");
    });

    it("creates the normal project config for an official Vite React JavaScript starter", async () => {
      mockFileExists.mockResolvedValue(false);
      mockWriteJsonFile.mockResolvedValue(undefined);

      expect(await setupTsConfig("react", "src", true)).toBe(true);

      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        "tsconfig.json",
        createDefaultTsConfig("react", "src", true),
      );
    });

    describe("when tsconfig.json does not exist", () => {
      it("should create a new tsconfig.json with default config", async () => {
        mockFileExists.mockResolvedValue(false);
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith("tsconfig.json", {
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
      });
    });

    describe("when tsconfig.json exists", () => {
      it("should not modify complete config", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).not.toHaveBeenCalled();
      });

      it("should add missing extends", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            extends: "astro/tsconfigs/strict",
          }),
        );
      });

      it("should add missing baseUrl", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            compilerOptions: expect.objectContaining({
              baseUrl: ".",
            }),
          }),
        );
      });

      it("should add missing path alias", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            compilerOptions: expect.objectContaining({
              paths: {
                "@/*": ["src/*"],
              },
            }),
          }),
        );
      });

      it("should preserve existing paths when adding @/*", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "~/*": ["lib/*"],
            },
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            compilerOptions: expect.objectContaining({
              paths: {
                "~/*": ["lib/*"],
                "@/*": ["src/*"],
              },
            }),
          }),
        );
      });

      it("should preserve all existing config properties", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          include: ["src/**/*"],
          exclude: ["node_modules"],
          compilerOptions: {
            baseUrl: ".",
            strict: true,
            target: "ES2022",
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            include: ["src/**/*"],
            exclude: ["node_modules"],
            compilerOptions: expect.objectContaining({
              strict: true,
              target: "ES2022",
            }),
          }),
        );
      });

      it("should handle empty tsconfig.json", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({});
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith("tsconfig.json", {
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
      });

      it("should handle config with only extends", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith("tsconfig.json", {
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
      });

      it("should handle config with different extends value", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "some/other/config",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        // Should update extends to the required value
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            extends: "astro/tsconfigs/strict",
          }),
        );
      });
    });

    describe("error handling", () => {
      it("should return false and log error if file read fails", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockRejectedValue(new Error("Read error"));

        const result = await setupTsConfig();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup tsconfig.json"),
        );
      });

      it("should return false and log error if file write fails", async () => {
        mockFileExists.mockResolvedValue(false);
        mockWriteJsonFile.mockRejectedValue(new Error("Write error"));

        const result = await setupTsConfig();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup tsconfig.json"),
        );
      });

      it("should return false and log error if fileExists check fails", async () => {
        mockFileExists.mockRejectedValue(new Error("Permission denied"));

        const result = await setupTsConfig();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup tsconfig.json"),
        );
      });

      it("should handle unknown errors gracefully", async () => {
        mockFileExists.mockRejectedValue("Unknown error");

        const result = await setupTsConfig();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("An unknown error occurred"),
        );
      });
    });

    describe("edge cases", () => {
      it("should handle tsconfig with comments stripped (valid JSON)", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).not.toHaveBeenCalled();
      });

      it("should handle deeply nested existing config", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
              "@components/*": ["src/components/*"],
              "@utils/*": ["src/utils/*"],
            },
            lib: ["ES2022", "DOM"],
            moduleResolution: "bundler",
          },
          include: ["src/**/*", "tests/**/*"],
          exclude: ["node_modules", "dist"],
        });

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).not.toHaveBeenCalled();
      });

      it("should handle @/* with empty array", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": [],
            },
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            compilerOptions: expect.objectContaining({
              paths: {
                "@/*": ["src/*"],
              },
            }),
          }),
        );
      });
    });
  });
});
