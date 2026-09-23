import { it } from "vitest";
import { createStyledCheckboxGroupConsumer } from "../../../../packages/svelte/tests/styled-checkbox-group-consumer.js";
import { verifyCheckboxGroupOwnership } from "../../../../packages/svelte/tests/checkbox-group-ownership-browser.js";
it("hydrates Checkbox Group ownership, accepted arrays and native reset", async () => {
  const consumer = await createStyledCheckboxGroupConsumer(process.cwd());
  try {
    await verifyCheckboxGroupOwnership(consumer);
  } finally {
    await consumer.dispose();
  }
}, 60000);
