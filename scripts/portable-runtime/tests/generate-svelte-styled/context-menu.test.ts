import { afterEach, describe, expect, it } from "vitest";
import { createStyledContextMenuConsumer } from "../../../../packages/svelte/tests/styled-context-menu-consumer.js";
import { verifyStyledContextMenuLifecycle } from "../../../../packages/svelte/tests/styled-context-menu-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createStyledContextMenuConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Svelte ContextMenu lifecycle", () => {
  it("forwards Root and item bindings through portal and submenu composition", async () => {
    const { result } = await verifyStyledContextMenuLifecycle(await fixture());
    expect(result).toEqual({ composition: true, hydrationExact: true, teardown: true });
  }, 120_000);
});
