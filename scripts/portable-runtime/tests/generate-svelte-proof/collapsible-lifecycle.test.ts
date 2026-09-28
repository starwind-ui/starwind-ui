import { it } from "vitest";
import { createStyledCollapsibleConsumer } from "../../../../packages/svelte/tests/styled-collapsible-consumer.js";
import { verifyCollapsibleLifecycle } from "../../../../packages/svelte/tests/collapsible-lifecycle-browser.js";
it("owns accepted Collapsible transactions, child and presence lifecycle", async () => {
  const consumer = await createStyledCollapsibleConsumer(process.cwd());
  try {
    await verifyCollapsibleLifecycle(consumer);
  } finally {
    await consumer.dispose();
  }
}, 60000);
