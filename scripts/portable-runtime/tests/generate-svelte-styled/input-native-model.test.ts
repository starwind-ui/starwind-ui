import { expect, it } from "vitest";
import { afterEach } from "vitest";
import path from "node:path";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledInputConsumer } from "../../../../packages/svelte/tests/styled-input-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function consumer() {
  const result = await createStyledInputConsumer(process.cwd());
  consumers.push(result);
  return result;
}

import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
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
