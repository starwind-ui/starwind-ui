import { afterEach, describe, expect, it } from "vitest";
import { createMenuConsumer } from "../../../../packages/svelte/tests/menu-consumer.js";
import { verifyMenuLifecycle } from "../../../../packages/svelte/tests/menu-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createMenuConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Svelte Menu lifecycle", () => {
  it("preserves each accepted model, cancelable transactions, owned collections, submenus, semantic children, portals and teardown", async () => {
    const { result } = await verifyMenuLifecycle(await fixture());
    expect(result).toEqual({
      complete: true,
      hydrationExact: true,
      modelTruthTable: true,
      cancellation: true,
      parentCommands: true,
      refsAndAttachments: true,
      partReplacement: true,
      portalLifecycle: true,
      placement: true,
      teardown: true,
      itemModels: true,
      collectionOwnership: true,
      submenuLifecycle: true,
      keyboardAndTypeahead: true,
      focusAndLock: true,
      closeComplete: true,
      buttonChild: true,
    });
  }, 120_000);
});
