import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = process.cwd();
const APP_SOURCE_ROOTS = ["apps/demo/src", "apps/react-demo/src"] as const;
const DEMO_PACKAGE_MANIFEST_FILES = [
  "apps/demo/package.json",
  "apps/react-demo/package.json",
] as const;
const DEMO_CONFIG_FILES = [
  "apps/demo/astro.config.mjs",
  "apps/demo/tsconfig.json",
  "apps/react-demo/vite.config.ts",
  "apps/react-demo/tsconfig.json",
] as const;
const FRAMEWORK_PACKAGE_MANIFEST_FILES = [
  "packages/astro/package.json",
  "packages/react/package.json",
] as const;
const RUNTIME_PACKAGE_MANIFEST_FILE = "packages/runtime/package.json";
const PACKAGE_DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;
const DEMO_FORBIDDEN_DIRECT_DEPENDENCIES = ["@starwind-ui/runtime", "@floating-ui/dom"] as const;
const DEMO_CONFIG_FORBIDDEN_IMPORTS = ["@floating-ui/dom"] as const;

type PackageJson = Record<string, unknown> & {
  [field in (typeof PACKAGE_DEPENDENCY_FIELDS)[number]]?: Record<string, string>;
};

describe("demo dependency routing", () => {
  it("keeps app source imports routed through framework packages instead of Runtime", async () => {
    const matches: string[] = [];

    for (const sourceRoot of APP_SOURCE_ROOTS) {
      for (const filePath of await collectSourceFiles(path.join(REPO_ROOT, sourceRoot))) {
        const source = await readFile(filePath, "utf8");
        if (source.includes("@starwind-ui/runtime")) {
          matches.push(path.relative(REPO_ROOT, filePath).replaceAll(path.sep, "/"));
        }
      }
    }

    expect(matches).toEqual([]);
  });

  it("keeps demo package manifests free of direct Runtime and Floating UI dependencies", async () => {
    const matches: string[] = [];

    for (const relativeFilePath of DEMO_PACKAGE_MANIFEST_FILES) {
      const packageJson = await readPackageJson(relativeFilePath);
      for (const dependencies of dependencyFields(packageJson)) {
        for (const dependencyName of DEMO_FORBIDDEN_DIRECT_DEPENDENCIES) {
          if (dependencies[dependencyName]) {
            matches.push(`${relativeFilePath}: ${dependencyName}`);
          }
        }
      }
    }

    expect(matches).toEqual([]);
  });

  it("keeps demo config free of direct Floating UI imports and optimization entries", async () => {
    const matches: string[] = [];

    for (const relativeFilePath of DEMO_CONFIG_FILES) {
      const source = await readFile(path.join(REPO_ROOT, relativeFilePath), "utf8");
      for (const pattern of DEMO_CONFIG_FORBIDDEN_IMPORTS) {
        if (source.includes(pattern)) {
          matches.push(`${relativeFilePath}: ${pattern}`);
        }
      }
    }

    expect(matches).toEqual([]);
  });

  it("keeps Runtime owned by framework packages and Floating UI owned by Runtime", async () => {
    const frameworkPackageMatches: string[] = [];

    for (const relativeFilePath of FRAMEWORK_PACKAGE_MANIFEST_FILES) {
      const packageJson = await readPackageJson(relativeFilePath);
      if (!packageJson.dependencies?.["@starwind-ui/runtime"]) {
        frameworkPackageMatches.push(`${relativeFilePath}: @starwind-ui/runtime`);
      }
    }

    const runtimePackageJson = await readPackageJson(RUNTIME_PACKAGE_MANIFEST_FILE);
    const runtimeOwnsFloatingUi = dependencyFields(runtimePackageJson).some((dependencies) =>
      Boolean(dependencies["@floating-ui/dom"]),
    );

    expect(frameworkPackageMatches).toEqual([]);
    expect(runtimeOwnsFloatingUi).toBe(true);
  });
});

async function readPackageJson(relativeFilePath: string): Promise<PackageJson> {
  return JSON.parse(await readFile(path.join(REPO_ROOT, relativeFilePath), "utf8")) as PackageJson;
}

function dependencyFields(packageJson: PackageJson): Record<string, string>[] {
  return PACKAGE_DEPENDENCY_FIELDS.map((field) => packageJson[field]).filter(
    (dependencies): dependencies is Record<string, string> => Boolean(dependencies),
  );
}

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(entryPath);
      if (!/\.(astro|ts|tsx)$/.test(entry.name)) return [];

      return [entryPath];
    }),
  );

  return files.flat();
}
