import { verifyStyledComboboxLifecycle } from "../../../../packages/svelte/tests/styled-combobox-browser.js";
import { afterEach, describe, expect, it } from "vitest";

import { createStyledComboboxConsumer } from "../../../../packages/svelte/tests/styled-combobox-consumer.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createStyledComboboxConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}
describe("generated Svelte Styled Combobox", () => {
  it("forwards coupled models through Styled Input, Clear, and portal composition", async () => {
    const { result } = await verifyStyledComboboxLifecycle(await fixture());
    expect(result).toEqual({
      composition: true,
      complete: true,
      hydrationExact: true,
      teardown: true,
    });
  }, 120_000);
});
