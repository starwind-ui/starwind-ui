import { describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";
import { scrollAreaStyledContract } from "../../contracts/styled/components/scroll-area.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";

describe("Scroll Area vertical", () => {
  it("projects the complete contract anatomy and stylesheet for client and SSR", () => {
    const group = projectStyledOutputComponentGroup(scrollAreaStyledContract);
    const before = structuredClone(group);
    const files = renderSvelteStyledFiles(
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    );
    expect(group).toEqual(before);
    expect(files).toHaveLength(9);
    for (const component of files.filter((file) => file.relativePath.endsWith(".svelte")))
      for (const generate of ["client", "server"] as const)
        expect(
          compile(component.content, { filename: component.relativePath, generate }).warnings,
        ).toEqual([]);
    expect(files.find((file) => file.relativePath.endsWith("styles.css"))?.content).toContain(
      "scrollbar-width: none",
    );
  });
});

import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
it("generates Scroll Area deterministically from the contract", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-scroll-area-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["scroll-area"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["scroll-area"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(
      new Map([...committed].filter(([file]) => file.startsWith("scroll-area/"))),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
it("rejects unsupported anatomy, stylesheet owners, native bases and public fields", () => {
  for (const mutation of ["anatomy", "styles", "native", "field"] as const) {
    const group = projectStyledOutputComponentGroup(scrollAreaStyledContract);
    const component = group.components[0]!;
    if (mutation === "anatomy") component.render = [];
    if (mutation === "styles") group.styles = undefined;
    if (mutation === "native") component.props!.extends = [];
    if (mutation === "field")
      component.props!.fields.push({ name: "invalid", type: "number", optional: true });
    expect(() =>
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    ).toThrow(/Svelte Styled scroll-area/);
  }
});

import { afterEach } from "vitest";
import path from "node:path";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledScrollAreaConsumer } from "../../../../packages/svelte/tests/styled-scroll-area-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function consumer() {
  const result = await createStyledScrollAreaConsumer(process.cwd());
  consumers.push(result);
  return result;
}
