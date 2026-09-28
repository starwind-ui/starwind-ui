import { afterEach, it } from "vitest";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledRadioGroupConsumer } from "../../../../packages/svelte/tests/styled-radio-group-consumer.js";

import { verifyRadioGroupLifecycle } from "../../../../packages/svelte/tests/radio-and-radio-group-browser.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function consumer() {
  const result = await createStyledRadioGroupConsumer(process.cwd());
  consumers.push(result);
  return result;
}
it("hydrates Styled Radio and Radio Group ownership and reset", async () => {
  await verifyRadioGroupLifecycle(await consumer(), true);
}, 60000);
