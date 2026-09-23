import { describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";
import { progressStyledContract } from "../../contracts/styled/components/progress.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";

describe("Progress vertical", () => {
  it("projects the composed Progress contract and compiles its indicator styles", () => {
    const group = projectStyledOutputComponentGroup(progressStyledContract);
    const before = structuredClone(group);
    const files = renderSvelteStyledFiles(
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    );
    expect(group).toEqual(before);
    expect(files).toHaveLength(3);
    const component = files.find((file) => file.relativePath.endsWith("Progress.svelte"))!;
    for (const generate of ["client", "server"] as const)
      expect(
        compile(component.content, { filename: component.relativePath, generate }).warnings,
      ).toEqual([]);
  });
});

import { afterEach } from "vitest";
import path from "node:path";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledProgressConsumer } from "../../../../packages/svelte/tests/styled-progress-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function consumer() {
  const result = await createStyledProgressConsumer(process.cwd());
  consumers.push(result);
  return result;
}

import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
it("generates Progress deterministically from its contract", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-progress-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["progress"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["progress"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(new Map([...committed].filter(([file]) => file.startsWith("progress/"))));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it("rejects unsupported composed owners, native types and style expressions", () => {
  for (const mutation of ["owner", "native", "style"] as const) {
    const group = projectStyledOutputComponentGroup(progressStyledContract);
    const component = group.components[0]!;
    if (mutation === "owner") component.render = [];
    if (mutation === "native") component.props!.extends = [];
    if (mutation === "style")
      component.variables.find((variable) => variable.name === "indicatorStyle")!.value = {
        type: "raw",
        code: "undefined",
      };
    expect(() =>
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    ).toThrow(/Svelte Styled progress\/Progress/);
  }
});
