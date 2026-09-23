import { describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";
import { collapsibleStyledContract } from "../../contracts/styled/components/collapsible.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";

describe("Collapsible vertical", () => {
  it("projects Root, Trigger and Content with accepted model and semantic child syntax", () => {
    const group = projectStyledOutputComponentGroup(collapsibleStyledContract);
    const original = structuredClone(group);
    const files = renderSvelteStyledFiles(
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    );
    expect(group).toEqual(original);
    expect(files).toHaveLength(5);
    for (const file of files.filter((file) => file.relativePath.endsWith(".svelte")))
      for (const generate of ["client", "server"] as const)
        expect(compile(file.content, { filename: file.relativePath, generate }).warnings).toEqual(
          [],
        );
  });
});

import { verifyCollapsibleLifecycle } from "../../../../packages/svelte/tests/collapsible-lifecycle-browser.js";
it("hydrates accepted models, semantic Trigger ownership and Runtime presence", async () => {
  await verifyCollapsibleLifecycle(await consumer(), true);
}, 60000);

import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
it("generates Collapsible deterministically from its contract", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-collapsible-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["collapsible"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["collapsible"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(
      new Map([...committed].filter(([file]) => file.startsWith("collapsible/"))),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
it("rejects unsupported anatomy, native bases, callbacks and child projection", () => {
  for (const mutation of ["anatomy", "native", "callback", "child"] as const) {
    const group = projectStyledOutputComponentGroup(collapsibleStyledContract);
    const component = group.components.find(
      (component) =>
        component.exportName === (mutation === "child" ? "CollapsibleTrigger" : "Collapsible"),
    )!;
    if (mutation === "anatomy") component.render = [];
    if (mutation === "native") component.props!.extends = [];
    const node = component.render[0];
    if ((mutation === "callback" || mutation === "child") && node?.type === "primitive")
      node.attrs = node.attrs.filter(
        (attr) => attr.name !== (mutation === "callback" ? "onOpenChange" : "asChild"),
      );
    expect(() =>
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    ).toThrow(/Svelte Styled collapsible/);
  }
});

import { afterEach } from "vitest";
import path from "node:path";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledCollapsibleConsumer } from "../../../../packages/svelte/tests/styled-collapsible-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function consumer() {
  const result = await createStyledCollapsibleConsumer(process.cwd());
  consumers.push(result);
  return result;
}
