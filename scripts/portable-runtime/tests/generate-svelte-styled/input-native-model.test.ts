import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";

it("generates Input deterministically from its contract", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-input-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["input"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["input"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(new Map([...committed].filter(([file]) => file.startsWith("input/"))));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
