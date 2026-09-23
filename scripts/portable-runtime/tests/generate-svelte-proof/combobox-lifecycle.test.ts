import { verifyComboboxLifecycle } from "../../../../packages/svelte/tests/combobox-browser.js";
import { afterEach, describe, expect, it } from "vitest";

import { createComboboxConsumer } from "../../../../packages/svelte/tests/combobox-consumer.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createComboboxConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}
describe("generated Svelte Combobox", () => {
  it("keeps accepted models and native filtering through the built consumer", async () => {
    const { result } = await verifyComboboxLifecycle(await fixture());
    expect(result.modelTruthTable).toBe(true);
  }, 120_000);
});
