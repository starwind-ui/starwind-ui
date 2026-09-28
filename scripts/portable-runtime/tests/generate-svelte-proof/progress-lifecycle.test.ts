import { it } from "vitest";
import { createStyledProgressConsumer } from "../../../../packages/svelte/tests/styled-progress-consumer.js";
import { verifyProgressLifecycle } from "../../../../packages/svelte/tests/progress-lifecycle-browser.js";
it("hydrates Progress setters, formatting, Value ownership, labels and cleanup", async () => {
  const consumer = await createStyledProgressConsumer(process.cwd());
  try {
    await verifyProgressLifecycle(consumer);
  } finally {
    await consumer.dispose();
  }
}, 60000);
