import { expect, it } from "vitest";
import { afterEach } from "vitest";
import path from "node:path";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledInputGroupConsumer } from "../../../../packages/svelte/tests/styled-input-group-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function consumer() {
  const result = await createStyledInputGroupConsumer(process.cwd());
  consumers.push(result);
  return result;
}

import { verifyInputGroupLifecycle } from "../../../../packages/svelte/tests/input-group-composition-browser.js";
it("hydrates all Input Group owners with composed Input and native Textarea lifecycle", async () => {
  await verifyInputGroupLifecycle(await consumer());
}, 60000);

import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
it("generates all six Input Group parts and exact dependency closure deterministically", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-input-group-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["input-group"] });
    const first = await readSvelteStyledTree(root);
    expect([...new Set([...first.keys()].map((file) => file.split("/")[0]))].sort()).toEqual([
      "button",
      "input",
      "input-group",
      "textarea",
    ]);
    expect(
      [...first.keys()].filter(
        (file) => file.startsWith("input-group/") && file.endsWith(".svelte"),
      ),
    ).toHaveLength(6);
    await generateSvelteStyled({ outputRoot: root, roots: ["input-group"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(
      new Map(
        [...committed].filter(([file]) =>
          ["button", "input", "input-group", "textarea"].includes(file.split("/")[0]!),
        ),
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
