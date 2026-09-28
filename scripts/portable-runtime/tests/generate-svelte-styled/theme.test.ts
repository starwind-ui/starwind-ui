import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createDistConsumer,
  type DistConsumer,
} from "../../../../packages/svelte/tests/dist-consumer.js";
import { themeToggleStyledContract } from "../../contracts/styled/components/theme-toggle.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";
import { generateSvelteStyled, SVELTE_STYLED_OUTPUT_DIR } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";

const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createDistConsumer({
    packageRoot: path.join(process.cwd(), "packages/svelte"),
    additionalPackages: ["tailwind-variants", "tailwind-merge"].map((name) => ({
      name,
      from: path.join(process.cwd(), "apps/svelte-demo/package.json"),
    })),
  });
  consumers.push(consumer);
  const ts: typeof import("typescript") = createRequire(path.join(consumer.root, "package.json"))(
    "typescript",
  );
  const files: Record<string, string> = {};
  for (const name of ["ThemeToggle.svelte", "variants.ts", "index.ts"]) {
    const source = await readFile(
      path.join(SVELTE_STYLED_OUTPUT_DIR, "theme-toggle", name),
      "utf8",
    );
    files[`theme-toggle/${name}`] = source;
    if (name.endsWith(".ts"))
      files[`theme-toggle/${name.slice(0, -3)}.js`] = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText;
  }
  await consumer.write(files);
  return consumer;
}

describe("generated Theme Toggle", () => {
  it("projects the complete Theme contract without mutating its source and regenerates exactly", async () => {
    const group = projectStyledOutputComponentGroup(themeToggleStyledContract);
    const before = structuredClone(group);
    const files = renderSvelteStyledFiles(
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    );
    expect(group).toEqual(before);
    expect(files.map((file) => file.relativePath)).toEqual([
      "theme-toggle/ThemeToggle.svelte",
      "theme-toggle/variants.ts",
      "theme-toggle/index.ts",
    ]);
    const source = files[0]!.content;
    expect(source).toContain("pressed ?? defaultPressed ?? false");
    expect(source).toContain('from "@starwind-ui/svelte/theme"');
    expect(source).toContain("lightIcon?: Snippet");
    expect(source).toContain("darkIcon?: Snippet");
    expect(source).not.toContain(".destroy()");
    const root = await mkdtemp(path.join(os.tmpdir(), "svelte-theme-generated-"));
    try {
      await generateSvelteStyled({ outputRoot: root, roots: ["theme-toggle"] });
      const first = await readSvelteStyledTree(path.join(root, "theme-toggle"));
      await generateSvelteStyled({ outputRoot: root, roots: ["theme-toggle"] });
      expect(await readSvelteStyledTree(path.join(root, "theme-toggle"))).toEqual(first);
      expect(
        await readSvelteStyledTree(path.join(SVELTE_STYLED_OUTPUT_DIR, "theme-toggle")),
      ).toEqual(first);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects unsupported Theme effects and missing SVG assets with their file context", () => {
    const group = projectStyledOutputComponentGroup(themeToggleStyledContract);
    group.components[0]!.client!.effects.push("unknownBehavior();");
    expect(() =>
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    ).toThrow(/theme-toggle\/ThemeToggle.svelte: unsupported Theme client behavior/);
    const missing = projectStyledOutputComponentGroup(themeToggleStyledContract);
    const pending = [...missing.components[0]!.render];
    while (pending.length) {
      const node = pending.shift()!;
      if (node.type === "icon") {
        delete node.asset;
        break;
      }
      if ("children" in node) pending.push(...node.children);
      if (node.type === "condition") pending.push(...node.then, ...node.else);
      if (node.type === "slot") pending.push(...node.fallback);
    }
    expect(() =>
      projectSvelteStyledGroup(missing, { primitiveImportBase: "@starwind-ui/svelte" }),
    ).toThrow(/ThemeToggle.svelte: missing projected SVG asset/);
  });

  it("server-renders Theme seeds and snippets without starting DOM work", async () => {
    const consumer = await fixture();
    await consumer.write({
      "SSR.svelte": `<script lang="ts">import ThemeToggle from "./theme-toggle/index.js";</script><ThemeToggle id="default" /><ThemeToggle id="seed" defaultPressed /><ThemeToggle id="explicit" defaultPressed pressed={false} disabled>Content</ThemeToggle>`,
      "ssr.mjs": `import assert from "node:assert/strict"; import { render } from "svelte/server"; import App from "./SSR.svelte"; import Default, * as exports from "./theme-toggle/index.js";
assert.equal(globalThis.document, undefined); assert.equal(Default, exports.ThemeToggle); assert.deepEqual(Object.keys(exports).sort(), ["ThemeToggle", "ThemeToggleVariants", "default"]); console.log(JSON.stringify({ body: render(App).body, facade: import.meta.resolve("@starwind-ui/svelte/theme") }));`,
    });
    const { body, facade } = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
    expect(facade).toContain(
      `${consumer.root}/node_modules/@starwind-ui/svelte/dist/theme/index.js`,
    );
    expect(body.match(/aria-pressed="false"/g)).toHaveLength(2);
    expect(body.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(body.match(/<svg\b/g)).toHaveLength(4);
    expect(body).toContain("Content");
    expect(body).toContain("data-sw-theme-control");
    expect(body).not.toMatch(/\sdata-ready(?:=|\s|>)/);
  });
});
