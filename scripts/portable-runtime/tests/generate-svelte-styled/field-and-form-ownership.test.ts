import { expect, it } from "vitest";
import { createStyledFieldConsumer } from "../../../../packages/svelte/tests/styled-field-consumer.js";

import { verifyFieldOwnership } from "../../../../packages/svelte/tests/field-and-form-ownership-browser.js";
it("hydrates Field with stable Form ownership, removal, overrides and controls", async () => {
  const consumer = await createStyledFieldConsumer(process.cwd());
  try {
    await verifyFieldOwnership(consumer, true);
  } finally {
    await consumer.dispose();
  }
}, 60000);

import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
import { fieldStyledContract } from "../../contracts/styled/components/field.js";
it("regenerates every Field export and its stock Separator dependency", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-field-output-"));
  try {
    await generateSvelteStyled({ outputRoot, roots: ["field"] });
    const first = await readSvelteStyledTree(outputRoot);
    expect(
      [...first.keys()]
        .filter((file) => file.startsWith("field/") && file.endsWith(".svelte"))
        .sort(),
    ).toEqual(fieldStyledContract.publicExports.map((name) => `field/${name}.svelte`).sort());
    expect(first.has("separator/Separator.svelte")).toBe(true);
    for (const name of ["FieldContent", "FieldGroup", "FieldSeparator", "FieldTitle"]) {
      const source = first.get(`field/${name}.svelte`);
      expect(source).toContain("const attachNative: Attachment<HTMLDivElement>");
      expect(source).not.toContain("../_internal/attachment-execution.svelte.js");
    }
    await rm(path.join(outputRoot, "field"), { recursive: true });
    await generateSvelteStyled({ outputRoot, roots: ["field"] });
    expect(await readSvelteStyledTree(outputRoot)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(new Map([...committed].filter(([file]) => first.has(file)))).toEqual(first);
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
