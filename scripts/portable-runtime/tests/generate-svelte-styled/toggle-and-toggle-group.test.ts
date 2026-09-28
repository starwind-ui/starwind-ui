import { it } from "vitest";
import { createStyledToggleConsumer } from "../../../../packages/svelte/tests/styled-toggle-consumer.js";
import { verifyToggleLifecycle } from "../../../../packages/svelte/tests/toggle-and-toggle-group-browser.js";
it("hydrates Styled Toggle and Toggle Group transactions and spacing", async () => {
  const consumer = await createStyledToggleConsumer(process.cwd());
  try {
    await verifyToggleLifecycle(consumer, true);
  } finally {
    await consumer.dispose();
  }
}, 60000);
