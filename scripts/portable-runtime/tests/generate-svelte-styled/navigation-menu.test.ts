import { afterEach, describe, expect, it } from "vitest";

import { createStyledNavigationMenuConsumer } from "../../../../packages/svelte/tests/styled-navigation-menu-consumer.js";
import { verifyStyledNavigationMenuLifecycle } from "../../../../packages/svelte/tests/styled-navigation-menu-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createStyledNavigationMenuConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}
describe("generated Svelte Styled Navigation Menu", () => {
  it("forwards Root bindings and child buttons through its composed portal and live viewport", async () => {
    const { result } = await verifyStyledNavigationMenuLifecycle(await fixture());
    expect(result).toEqual({
      composition: true,
      complete: true,
      hydrationExact: true,
      teardown: true,
    });
  }, 120_000);
});
