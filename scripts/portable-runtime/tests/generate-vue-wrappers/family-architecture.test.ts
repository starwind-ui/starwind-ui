import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { format, resolveConfig } from "prettier";

import { buttonRuntimeAdapterContract } from "../../contracts/primitive/components/button.js";
import { vueFrameworkAdapter } from "../../renderers/framework-adapters/vue/adapter.js";
import type { AdapterComponentFile } from "../../renderers/framework-adapters/types.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { generateVuePrimitiveWrappers } from "../../generate-vue-wrappers.js";
import { formatGeneratedOutput } from "../../format-generated-output.js";

const FAMILY_MODULES = [
  "action-surface",
  "boolean-form-control",
  "media-status",
  "option-collection-overlay",
  "range-status",
  "viewport-measurement",
] as const;

describe("Vue Primitive family renderer architecture", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("routes every current real family through a family-named module", async () => {
    const vueRendererRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters/vue",
    );
    const [adapter, familyFragments, indexPrinter] = await Promise.all([
      readFile(path.join(vueRendererRoot, "adapter.ts"), "utf8"),
      readFile(path.join(vueRendererRoot, "primitive/shared-fragments.ts"), "utf8"),
      readFile(path.join(vueRendererRoot, "exports.ts"), "utf8"),
    ]);

    for (const family of FAMILY_MODULES) {
      expect(adapter).toContain(`from "./${family}.js"`);
      expect(adapter).toContain(`kind === "${family}"`);
    }
    expect(adapter).not.toContain("family.facts.displayName");
    expect(adapter).not.toMatch(
      /from "\.\/primitive\/(?:avatar|button|checkbox|progress|scroll-area|select)\.js"/,
    );
    expect(familyFragments).not.toContain(".replace(");
    expect(indexPrinter).toContain("partExportOrder");
  });

  it("rejects mismatched family facts with an actionable family error", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(buttonRuntimeAdapterContract),
    );
    const button = output.files.find(
      (file): file is AdapterComponentFile => file.kind === "component",
    );
    if (!button?.component.family) throw new TypeError("Button family fixture is missing.");

    const mismatched = {
      ...button,
      component: {
        ...button.component,
        family: {
          facts: button.component.family.facts,
          kind: "boolean-form-control",
          part: "root",
        },
      },
    } as unknown as AdapterComponentFile;

    expect(() => vueFrameworkAdapter.printComponentFile(mismatched)).toThrow(
      "Vue boolean-form-control projection requires the state prop fact.",
    );
  });

  it(
    "regenerates the complete package deterministically against checked-in bytes",
    async () => {
      const firstRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-family-first-"));
      const secondRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-family-second-"));
      temporaryRoots.push(firstRoot, secondRoot);

      await generateVuePrimitiveWrappers({ outputDir: ".", repoRoot: firstRoot });
      await generateVuePrimitiveWrappers({ outputDir: ".", repoRoot: secondRoot });
      await formatGeneratedOutput([firstRoot, secondRoot], process.cwd());
      await Promise.all([formatTypeScriptTree(firstRoot), formatTypeScriptTree(secondRoot)]);

      const first = await readTree(firstRoot);
      const second = await readTree(secondRoot);
      const checkedIn = await readTree(path.join(process.cwd(), "packages/vue/src"));

      expect(first).toEqual(second);
      expect(first).toEqual(checkedIn);
      expect(Object.keys(first)).toEqual(Object.keys(checkedIn));
    },
    120_000,
  );
});

async function readTree(root: string): Promise<Record<string, string>> {
  const files = await listFiles(root);
  return Object.fromEntries(
    await Promise.all(
      files.map(async (file) => [
        path.relative(root, file).replaceAll("\\", "/"),
        await readFile(file, "utf8"),
      ]),
    ),
  );
}

async function formatTypeScriptTree(root: string): Promise<void> {
  const files = (await listFiles(root)).filter((file) => file.endsWith(".ts"));
  const config = (await resolveConfig(path.join(process.cwd(), "prettier.config.mjs"))) ?? {};
  await Promise.all(
    files.map(async (file) => {
      const source = await readFile(file, "utf8");
      await writeFile(file, await format(source, { ...config, filepath: file }), "utf8");
    }),
  );
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const candidate = path.join(root, entry.name);
      return entry.isDirectory() ? listFiles(candidate) : entry.isFile() ? [candidate] : [];
    }),
  );
  return files.flat().sort();
}
