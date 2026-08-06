import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { vueStyledComponents } from "../../renderers/framework-adapters/vue/inventory.js";
import {
  selectVueStyledContracts,
  supportsVueScope,
} from "../../renderers/framework-adapters/vue/styled.js";
import { PORTABLE_STYLED_CLOSURE } from "../styled-contracts/portable-styled-closure.test.js";

// The declared Order 11 check uses the portable-vue project. Keep the contract-owned depth gate
// attached to that focused project while its source remains in the styled-contract test home.
export const PREVIOUSLY_OWNED_PORTABLE_STYLED = [
  "accordion",
  "alert-dialog",
  "avatar",
  "button",
  "carousel",
  "checkbox",
  "checkbox-group",
  "collapsible",
  "combobox",
  "color-picker",
  "context-menu",
  "dialog",
  "dropzone",
  "dropdown",
  "field",
  "form",
  "hover-card",
  "input",
  "input-otp",
  "navigation-menu",
  "popover",
  "progress",
  "radio-group",
  "scroll-area",
  "select",
  "sheet",
  "sidebar",
  "slider",
  "switch",
  "tabs",
  "theme-toggle",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
] as const;

export type FileManifest = Readonly<Record<string, string>>;

export async function createPortableStyledTempRoot(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "starwind-vue-portable-styled-"));
}

export async function readFileManifest(root: string): Promise<FileManifest> {
  const files = await listFiles(root);
  return Object.fromEntries(
    await Promise.all(
      files.map(async (file) => {
        const bytes = await readFile(path.join(root, file));
        return [file, createHash("sha256").update(bytes).digest("hex")] as const;
      }),
    ),
  );
}

describe("Vue portable Styled closure ownership", () => {
  it("locks the ordered nineteen-contract closure inventory", () => {
    expect(PORTABLE_STYLED_CLOSURE).toEqual([
      "alert",
      "aspect-ratio",
      "badge",
      "breadcrumb",
      "button-group",
      "card",
      "input-group",
      "item",
      "kbd",
      "label",
      "native-select",
      "pagination",
      "prose",
      "separator",
      "skeleton",
      "spinner",
      "table",
      "textarea",
      "video",
    ]);
  });

  it("matches the reviewed selected, transitive, and absent states", () => {
    const selectedRoots = PORTABLE_STYLED_CLOSURE.filter((component) =>
      vueStyledComponents.includes(component as (typeof vueStyledComponents)[number]),
    );
    const materialized = selectVueStyledContracts(starwindStyledContracts).map(
      ({ component }) => component,
    );
    const transitive = PORTABLE_STYLED_CLOSURE.filter(
      (component) => materialized.includes(component) && !selectedRoots.includes(component),
    );
    const absent = PORTABLE_STYLED_CLOSURE.filter((component) => !materialized.includes(component));

    expect(selectedRoots).toEqual([
      "alert",
      "aspect-ratio",
      "badge",
      "breadcrumb",
      "button-group",
      "card",
      "input-group",
      "item",
      "kbd",
      "label",
      "native-select",
      "pagination",
      "prose",
      "separator",
      "skeleton",
      "spinner",
      "table",
      "textarea",
      "video",
    ]);
    expect(transitive).toEqual([]);
    expect(absent).toEqual([]);
  });

  it("proves the prior cohorts and this closure own the exact portable union once", () => {
    const allComponents = starwindStyledContracts.map(({ component }) => component);
    const portableComponents = starwindStyledContracts
      .filter(({ frameworks }) => supportsVueScope(frameworks))
      .map(({ component }) => component)
      .sort();
    const owned = [...PREVIOUSLY_OWNED_PORTABLE_STYLED, ...PORTABLE_STYLED_CLOSURE];

    expect(allComponents).toHaveLength(55);
    expect(new Set(allComponents).size).toBe(55);
    expect(portableComponents).toHaveLength(54);
    expect(owned).toHaveLength(54);
    expect(new Set(owned).size).toBe(54);
    expect([...owned].sort()).toEqual(portableComponents);
    expect(vueStyledComponents).toEqual([
      "accordion",
      "alert-dialog",
      "avatar",
      "button",
      "carousel",
      "checkbox",
      "checkbox-group",
      "collapsible",
      "combobox",
      "color-picker",
      "context-menu",
      "dialog",
      "dropzone",
      "dropdown",
      "field",
      "sheet",
      "form",
      "hover-card",
      "input",
      "input-otp",
      "navigation-menu",
      "popover",
      "progress",
      "radio-group",
      "scroll-area",
      "select",
      "separator",
      "sidebar",
      "slider",
      "switch",
      "tabs",
      "theme-toggle",
      "toast",
      "toggle",
      "toggle-group",
      "tooltip",
      "alert",
      "aspect-ratio",
      "badge",
      "breadcrumb",
      "button-group",
      "card",
      "input-group",
      "item",
      "kbd",
      "label",
      "native-select",
      "pagination",
      "prose",
      "skeleton",
      "spinner",
      "table",
      "textarea",
      "video",
    ]);
  });

  it("keeps Image as the sole Astro-only contract and rejects it as a Vue root", () => {
    const excluded = starwindStyledContracts.filter(({ frameworks }) =>
      frameworks ? !supportsVueScope(frameworks) : false,
    );

    expect(excluded.map(({ component }) => component)).toEqual(["image"]);
    expect(excluded[0]?.frameworks).toEqual(["astro"]);
    expect(vueStyledComponents).not.toContain("image");
    expect(() => selectVueStyledContracts(starwindStyledContracts, ["image"])).toThrow(
      'Missing Vue Styled dependency "image".',
    );
  });

  it("provides stable path and byte manifests for later deletion checks", async () => {
    const fixtureRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/tests/generate-vue-wrappers/fixtures/styled-public-contract",
    );
    const first = await readFileManifest(fixtureRoot);
    const second = await readFileManifest(fixtureRoot);

    expect(Object.keys(first)).toEqual([...Object.keys(first)].sort());
    expect(second).toEqual(first);
    expect(createPortableStyledTempRoot).toBeTypeOf("function");
  });

  it("distinguishes non-text output bytes in manifests", async () => {
    const root = await createPortableStyledTempRoot();
    const artifact = path.join(root, "artifact.bin");

    try {
      await writeFile(artifact, Uint8Array.from([0x80]));
      const first = await readFileManifest(root);
      await writeFile(artifact, Uint8Array.from([0x81]));
      const second = await readFileManifest(root);

      expect(first["artifact.bin"]).not.toBe(second["artifact.bin"]);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});

async function listFiles(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const relativePath = path.posix.join(prefix.replaceAll("\\", "/"), entry.name);
      return entry.isDirectory() ? listFiles(root, relativePath) : [relativePath];
    }),
  );
  return files.flat().sort();
}
