import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
import { dropzoneStyledContract } from "../../contracts/styled/components/dropzone.js";
import { createStyledDropzoneConsumer } from "../../../../packages/svelte/tests/styled-dropzone-consumer.js";
import { verifyDropzone } from "../../../../packages/svelte/tests/dropzone-browser.js";

it("hydrates Styled Dropzone through its native file owner and committed notifications", async () => {
  const consumer = await createStyledDropzoneConsumer(process.cwd());
  try {
    await verifyDropzone(consumer, true);
  } finally {
    await consumer.dispose();
  }
}, 60000);

it("regenerates all stock Dropzone exports and indicator icons", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-styled-dropzone-"));
  try {
    await generateSvelteStyled({ outputRoot, roots: ["dropzone"] });
    const first = await readSvelteStyledTree(outputRoot);
    expect([...first.keys()].filter((file) => file.endsWith(".svelte")).sort()).toEqual(
      dropzoneStyledContract.publicExports.map((name) => `dropzone/${name}.svelte`).sort(),
    );
    expect(first.get("dropzone/DropzoneUploadIndicator.svelte")).toContain("<svg");
    expect(first.get("dropzone/DropzoneLoadingIndicator.svelte")).toContain("animate-spin");
    await generateSvelteStyled({ outputRoot, roots: ["dropzone"] });
    expect(await readSvelteStyledTree(outputRoot)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(new Map([...committed].filter(([file]) => first.has(file)))).toEqual(first);
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
