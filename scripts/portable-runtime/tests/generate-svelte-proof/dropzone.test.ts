import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { generateSveltePrimitiveWrappers } from "../../generate-svelte-wrappers.js";

it("generates all five contracted Dropzone parts", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-dropzone-"));
  try {
    await generateSveltePrimitiveWrappers({ outputRoot });
    expect((await readdir(path.join(outputRoot, "dropzone"))).sort()).toEqual([
      "DropzoneFilesList.svelte",
      "DropzoneInput.svelte",
      "DropzoneLoadingIndicator.svelte",
      "DropzoneRoot.svelte",
      "DropzoneUploadIndicator.svelte",
      "index.ts",
    ]);
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

import { createStyledDropzoneConsumer } from "../../../../packages/svelte/tests/styled-dropzone-consumer.js";

import { verifyDropzone } from "../../../../packages/svelte/tests/dropzone-browser.js";
it("hydrates Dropzone files, native events, capture replacement and Field subscriptions", async () => {
  const consumer = await createStyledDropzoneConsumer(process.cwd());
  try {
    await verifyDropzone(consumer, false);
  } finally {
    await consumer.dispose();
  }
}, 60000);
