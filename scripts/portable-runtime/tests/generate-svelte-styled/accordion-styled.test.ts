import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
import { accordionStyledContract } from "../../contracts/styled/components/accordion.js";
it("regenerates all stock Accordion exports, content wrapper and default icon", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-styled-accordion-"));
  try {
    await generateSvelteStyled({ outputRoot, roots: ["accordion"] });
    const first = await readSvelteStyledTree(outputRoot);
    expect([...first.keys()].filter((file) => file.endsWith(".svelte")).sort()).toEqual(
      accordionStyledContract.publicExports.map((name) => `accordion/${name}.svelte`).sort(),
    );
    expect(first.get("accordion/AccordionTrigger.svelte")).toContain("<svg");
    expect(first.get("accordion/AccordionContent.svelte")).toContain("pt-0 pb-4");
    await generateSvelteStyled({ outputRoot, roots: ["accordion"] });
    expect(await readSvelteStyledTree(outputRoot)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(new Map([...committed].filter(([file]) => first.has(file)))).toEqual(first);
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

import { createStyledAccordionConsumer } from "../../../../packages/svelte/tests/styled-accordion-consumer.js";
import { verifyStyledAccordion } from "../../../../packages/svelte/tests/styled-accordion-browser.js";
it("hydrates Styled Accordion accepted models, collections and semantic owners", async () => {
  const consumer = await createStyledAccordionConsumer(process.cwd());
  try {
    await verifyStyledAccordion(consumer);
  } finally {
    await consumer.dispose();
  }
}, 60000);
