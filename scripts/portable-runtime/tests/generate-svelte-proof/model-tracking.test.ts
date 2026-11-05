import { expect, it } from "vitest";
import { createAlertDialogConsumer } from "../../../../packages/svelte/tests/alert-dialog-consumer.js";
import { verifyModelTracking } from "../../../../packages/svelte/tests/model-tracking-browser.js";

it("follows caret, in-place array, late one-way, and cross-model facts", async () => {
  const consumer = await createAlertDialogConsumer(process.cwd());
  try {
    const result = await verifyModelTracking(consumer);
    expect(result.failures).toEqual([]);
  } finally {
    await consumer.dispose();
  }
}, 90000);
