import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import tsupConfig from "../tsup.config";
import * as colorPickerSubpath from "../src/components/color-picker";
import * as runtimeRoot from "../src/index";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("runtime package exports", () => {
  it("exposes the approved color picker values from root and subpath barrels", () => {
    expect(Object.keys(colorPickerSubpath).sort()).toEqual(
      [
        "COLOR_PICKER_FORMATS",
        "createColorPicker",
        "createColorPickerInitialState",
        "parseColor",
        "projectColorPickerInitialPart",
      ].sort(),
    );
    expect(runtimeRoot.COLOR_PICKER_FORMATS).toBe(colorPickerSubpath.COLOR_PICKER_FORMATS);
    expect(runtimeRoot.createColorPicker).toBe(colorPickerSubpath.createColorPicker);
    expect(runtimeRoot.createColorPickerInitialState).toBe(
      colorPickerSubpath.createColorPickerInitialState,
    );
    expect(runtimeRoot.parseColor).toBe(colorPickerSubpath.parseColor);
    expect(runtimeRoot.projectColorPickerInitialPart).toBe(
      colorPickerSubpath.projectColorPickerInitialPart,
    );
  });

  it("exports every component runtime subpath", async () => {
    const packageJson = JSON.parse(
      await readFile(path.join(packageRoot, "package.json"), "utf8"),
    ) as {
      exports: Record<string, { import: string; types: string }>;
    };
    const expectedSubpaths = await getExpectedSubpaths();

    expect(Object.keys(packageJson.exports).sort()).toEqual(
      [".", ...expectedSubpaths.map((subpath) => `./${subpath}`)].sort(),
    );
    expect(packageJson.exports["."]).toEqual({
      import: "./dist/index.js",
      types: "./dist/index.d.ts",
    });

    expectedSubpaths.forEach((subpath) => {
      expect(packageJson.exports[`./${subpath}`]).toEqual({
        import: `./dist/${subpath}.js`,
        types: `./dist/${subpath}.d.ts`,
      });
    });
  });

  it("builds every exported runtime subpath", async () => {
    const config = await resolveTsupConfig();
    const entry = config.entry as Record<string, string>;
    const componentNames = await getComponentNames();

    expect(Object.keys(entry).sort()).toEqual(
      ["index", ...componentNames, "init-starwind", "theme"].sort(),
    );
    expect(entry.index).toBe("src/index.ts");

    componentNames.forEach((componentName) => {
      expect(entry[componentName]).toBe(`src/components/${componentName}/index.ts`);
    });
    expect(entry["init-starwind"]).toBe("src/init-starwind.ts");
    expect(entry.theme).toBe("src/theme/theme.ts");
  });
});

async function getExpectedSubpaths(): Promise<string[]> {
  return [...(await getComponentNames()), "init-starwind", "theme"];
}

async function getComponentNames(): Promise<string[]> {
  const entries = await readdir(path.join(packageRoot, "src", "components"), {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function resolveTsupConfig(): Promise<{ entry?: unknown }> {
  const config =
    typeof tsupConfig === "function" ? await tsupConfig({}) : await Promise.resolve(tsupConfig);
  return Array.isArray(config) ? (config[0] ?? {}) : config;
}
