import { afterEach, describe, expect, it } from "vitest";
import { createContextMenuConsumer } from "../../../../packages/svelte/tests/context-menu-consumer.js";
import { verifyContextMenuLifecycle } from "../../../../packages/svelte/tests/context-menu-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createContextMenuConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Svelte Context Menu lifecycle", () => {
  it("preserves each accepted model, cancelable transactions, owned collections, submenus, coordinate anchors, touch, portals and teardown", async () => {
    const { result } = await verifyContextMenuLifecycle(await fixture());
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
      contextActivation: true,
      anchorLifecycle: true,
    });
  }, 120_000);
});
