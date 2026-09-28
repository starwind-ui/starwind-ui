import { afterEach, describe, expect, it } from "vitest";

import { createNavigationMenuConsumer } from "../../../../packages/svelte/tests/navigation-menu-consumer.js";
import {
  verifyNavigationMenuLifecycle,
  verifyNavigationMenuOrdinary,
} from "../../../../packages/svelte/tests/navigation-menu-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createNavigationMenuConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}
describe("generated Svelte Navigation Menu", () => {
  it("preserves ordinary bound navigation, cancellation, hover, focus and portals", async () => {
    const { result } = await verifyNavigationMenuOrdinary(await fixture());
    expect(result).toEqual({
      complete: true,
      hydrationExact: true,
      ordinary: true,
      teardown: true,
    });
  }, 120_000);

  it("preserves accepted values, live viewport ownership, child buttons, collection replacement, timing, portals and cleanup", async () => {
    const { result } = await verifyNavigationMenuLifecycle(await fixture());
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
      viewportMovement: true,
      reactiveContent: true,
      collectionOwnership: true,
      keyboardAndFocus: true,
      timing: true,
      nestedOwnership: true,
      buttonChild: true,
    });
  }, 120_000);
});
