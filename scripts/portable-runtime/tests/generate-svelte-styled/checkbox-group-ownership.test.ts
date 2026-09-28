import { afterEach, it } from "vitest";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledCheckboxGroupConsumer } from "../../../../packages/svelte/tests/styled-checkbox-group-consumer.js";

import { verifyCheckboxGroupOwnership } from "../../../../packages/svelte/tests/checkbox-group-ownership-browser.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function consumer() {
  const result = await createStyledCheckboxGroupConsumer(process.cwd());
  consumers.push(result);
  return result;
}
it("hydrates Styled Checkbox Group ownership and reset", async () => {
  await verifyCheckboxGroupOwnership(await consumer(), true);
}, 60000);
