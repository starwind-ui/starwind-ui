import { afterEach, describe, expect, it } from "vitest";
import { createStyledDropdownConsumer } from "../../../../packages/svelte/tests/styled-dropdown-consumer.js";
import { verifyStyledDropdownLifecycle } from "../../../../packages/svelte/tests/styled-dropdown-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createStyledDropdownConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Svelte Dropdown lifecycle", () => {
  it("forwards Root and item bindings through portal and submenu composition", async () => {
    const { result } = await verifyStyledDropdownLifecycle(await fixture());
    expect(result).toEqual({ composition: true, hydrationExact: true, teardown: true });
  }, 120_000);
});
