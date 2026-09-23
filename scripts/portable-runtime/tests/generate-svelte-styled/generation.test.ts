import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { it, expect } from "vitest";
import { generateSvelteStyled, SVELTE_STYLED_OUTPUT_DIR } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
it("generates the current Styled inventory deterministically and removes stale files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-styled-generation-"));
  try {
    await generateSvelteStyled({ outputRoot: root });
    const first = await readSvelteStyledTree(root);
    expect(first).toEqual(await readSvelteStyledTree(SVELTE_STYLED_OUTPUT_DIR));
    await writeFile(path.join(root, "button/stale.ts"), "stale generated output");
    await generateSvelteStyled({ outputRoot: root });
    expect(await readSvelteStyledTree(root)).toEqual(first);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
