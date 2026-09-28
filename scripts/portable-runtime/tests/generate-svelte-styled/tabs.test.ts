import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
import { tabsStyledContract } from "../../contracts/styled/components/tabs.js";
it("regenerates all stock Tabs exports and variants", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-styled-tabs-"));
  try {
    await generateSvelteStyled({ outputRoot, roots: ["tabs"] });
    const first = await readSvelteStyledTree(outputRoot);
    expect([...first.keys()].filter((file) => file.endsWith(".svelte")).sort()).toEqual(
      tabsStyledContract.publicExports.map((name) => `tabs/${name}.svelte`).sort(),
    );
    await generateSvelteStyled({ outputRoot, roots: ["tabs"] });
    expect(await readSvelteStyledTree(outputRoot)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(new Map([...committed].filter(([file]) => first.has(file)))).toEqual(first);
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

import { createStyledTabsConsumer } from "../../../../packages/svelte/tests/styled-tabs-consumer.js";
import { verifyTabs } from "../../../../packages/svelte/tests/tabs-browser.js";
it("hydrates Styled Tabs accepted models, storage and part owners", async () => {
  const consumer = await createStyledTabsConsumer(process.cwd());
  try {
    await verifyTabs(consumer, true);
  } finally {
    await consumer.dispose();
  }
}, 60000);
