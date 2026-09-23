import { afterEach, describe, expect, it } from "vitest";
import { createAlertDialogConsumer } from "../../../../packages/svelte/tests/alert-dialog-consumer.js";
import { verifyAlertDialogLifecycle } from "../../../../packages/svelte/tests/alert-dialog-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createAlertDialogConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Svelte Alert Dialog lifecycle", () => {
  it("preserves accepted models, cancelable commands, native ownership, portals, refs, hydration, and teardown through built exports", async () => {
    const { result } = await verifyAlertDialogLifecycle(await fixture());
    expect(result).toMatchObject({
      complete: true,
      hydrationExact: true,
      modelTruthTable: true,
      cancellation: true,
      parentCommands: true,
      refsAndAttachments: true,
      partReplacement: false,
      portalLifecycle: true,
      focusAndLock: true,
      closeComplete: true,
      teardown: true,
    });
  }, 120_000);
});
