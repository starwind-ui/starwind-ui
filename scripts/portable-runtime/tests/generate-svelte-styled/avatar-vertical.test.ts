import { describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";
import { avatarStyledContract } from "../../contracts/styled/components/avatar.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";

describe("Avatar vertical", () => {
  it("projects and compiles the contract's three Primitive owners", () => {
    const group = projectStyledOutputComponentGroup(avatarStyledContract);
    const before = structuredClone(group);
    const projection = projectSvelteStyledGroup(group, {
      primitiveImportBase: "@starwind-ui/svelte",
    });
    expect(group).toEqual(before);
    expect(projection.components.map((component) => component.exportName)).toEqual([
      "Avatar",
      "AvatarImage",
      "AvatarFallback",
    ]);
    const files = renderSvelteStyledFiles(projection);
    expect(files).toHaveLength(5);
    for (const file of files.filter((entry) => entry.relativePath.endsWith(".svelte"))) {
      for (const generate of ["client", "server"] as const) {
        expect(compile(file.content, { filename: file.relativePath, generate }).warnings).toEqual(
          [],
        );
      }
    }
  });
});

import { afterEach } from "vitest";
import path from "node:path";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledAvatarConsumer } from "../../../../packages/svelte/tests/styled-avatar-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function consumer() {
  const fixture = await createStyledAvatarConsumer(process.cwd());
  consumers.push(fixture);
  return fixture;
}

import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
it("generates Avatar deterministically from its contract", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-avatar-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["avatar"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["avatar"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(new Map([...committed].filter(([file]) => file.startsWith("avatar/"))));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
it("rejects unsupported owner, native type and callback shapes", () => {
  for (const mutation of ["owner", "native", "callback"] as const) {
    const group = projectStyledOutputComponentGroup(avatarStyledContract);
    const image = group.components.find((component) => component.exportName === "AvatarImage")!;
    if (mutation === "owner") image.render = [];
    if (mutation === "native") image.props!.extends = [];
    if (mutation === "callback") {
      const owner = image.render[0]!;
      if (owner.type !== "primitive") throw new Error("missing test owner");
      owner.attrs = owner.attrs.filter((attr) => attr.name !== "onLoadingStatusChange");
    }
    expect(() =>
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    ).toThrow(/Svelte Styled avatar\/AvatarImage/);
  }
});
