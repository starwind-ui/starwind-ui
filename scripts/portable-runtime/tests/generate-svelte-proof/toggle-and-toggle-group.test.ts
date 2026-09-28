import { it } from "vitest";
import { createStyledToggleConsumer } from "../../../../packages/svelte/tests/styled-toggle-consumer.js";
import { verifyToggleLifecycle } from "../../../../packages/svelte/tests/toggle-and-toggle-group-browser.js";
it("hydrates Toggle and Toggle Group transactions, ownership, keys and sync groups", async () => {
  const consumer = await createStyledToggleConsumer(process.cwd());
  try {
    await verifyToggleLifecycle(consumer);
  } finally {
    await consumer.dispose();
  }
}, 60000);
