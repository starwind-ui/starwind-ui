import { expect, it } from "vitest";
import { afterEach } from "vitest";
import path from "node:path";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledFormConsumer } from "../../../../packages/svelte/tests/styled-form-consumer.js";

const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function consumer() {
  const result = await createStyledFormConsumer(process.cwd());
  consumers.push(result);
  return result;
}

import { verifyFormAndFieldset } from "../../../../packages/svelte/tests/form-and-fieldset-browser.js";
it("hydrates Styled Form through validation, Fieldset disabled changes, reset and cleanup", async () => {
  await verifyFormAndFieldset(await consumer(), true);
}, 60000);

import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
it("generates Form deterministically from its contract", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-form-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["form"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["form"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(new Map([...committed].filter(([file]) => file.startsWith("form/"))));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
