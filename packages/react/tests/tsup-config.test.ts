import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { createReactEntryPoints, reactEntryPoints } from "../tsup.config";

const componentDirectories = [
  "accordion",
  "alert-dialog",
  "avatar",
  "button",
  "carousel",
  "checkbox",
  "checkbox-group",
  "collapsible",
  "color-picker",
  "combobox",
  "context-menu",
  "dialog",
  "drawer",
  "dropzone",
  "field",
  "fieldset",
  "form",
  "input",
  "input-otp",
  "menu",
  "navigation-menu",
  "popover",
  "preview-card",
  "progress",
  "radio",
  "radio-group",
  "scroll-area",
  "select",
  "sidebar",
  "slider",
  "switch",
  "tabs",
  "theme",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
];

const expectedEntries = Object.fromEntries([
  ["index", "src/index.ts"],
  ...componentDirectories.map((component) => [`${component}/index`, `src/${component}/index.ts`]),
]);
const reactPackageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("React tsup entry points", () => {
  it("pins stable sorted public output names and source mappings", () => {
    expect(createReactEntryPoints([...componentDirectories].reverse())).toEqual(expectedEntries);
    expect(reactEntryPoints).toEqual(expectedEntries);
    expect(Object.keys(reactEntryPoints)).toEqual(Object.keys(expectedEntries));
  });

  it("scopes the enlarged heap to the production build wrapper", async () => {
    const packageJson = JSON.parse(
      await readFile(path.join(reactPackageRoot, "package.json"), "utf8"),
    );
    const buildWrapper = await readFile(path.join(reactPackageRoot, "scripts/build.mjs"), "utf8");

    expect(packageJson.scripts.build).toBe("node --max-old-space-size=8192 scripts/build.mjs");
    expect(buildWrapper).toContain('import { rm } from "node:fs/promises"');
    expect(buildWrapper).toContain('import { build } from "tsup"');
    expect(buildWrapper).toContain("await build({})");
    expect(buildWrapper).toContain('await rm(".tsup", { force: true, recursive: true })');
    expect(packageJson.scripts.dev).toBe("tsup --watch");
  });
});
