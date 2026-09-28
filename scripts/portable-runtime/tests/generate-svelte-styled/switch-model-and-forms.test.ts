import { expect, it } from "vitest";
import { afterEach } from "vitest";

import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledSwitchConsumer } from "../../../../packages/svelte/tests/styled-switch-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function consumer() {
  const result = await createStyledSwitchConsumer(process.cwd());
  consumers.push(result);
  return result;
}

import { verifySwitchLifecycle } from "../../../../packages/svelte/tests/switch-model-and-forms-browser.js";
it("hydrates Styled Switch labels, styles, accepted models and form reset", async () => {
  await verifySwitchLifecycle(await consumer(), true);
}, 60000);
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
it("generates Switch deterministically with contract variants and style variables", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-switch-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["switch"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["switch"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(new Map([...committed].filter(([file]) => file.startsWith("switch/"))));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
