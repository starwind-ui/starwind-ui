import { expect, it } from "vitest";
import { createAlertDialogConsumer } from "../../../../packages/svelte/tests/alert-dialog-consumer.js";
import { verifyParentOwnedModels } from "../../../../packages/svelte/tests/parent-owned-models-browser.js";

it("holds one-way defined models on overlay, menu and navigation roots until the parent changes them", async () => {
  const consumer = await createAlertDialogConsumer(process.cwd());
  try {
    const result = await verifyParentOwnedModels(consumer);
    expect(result.error).toBeUndefined();
    expect(result.roots).toHaveLength(12);
  } finally {
    await consumer.dispose();
  }
}, 60000);
