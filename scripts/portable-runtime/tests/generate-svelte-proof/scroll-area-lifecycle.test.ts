import { it } from "vitest";
import { createStyledScrollAreaConsumer } from "../../../../packages/svelte/tests/styled-scroll-area-consumer.js";
import { verifyScrollAreaLifecycle } from "../../../../packages/svelte/tests/scroll-area-lifecycle-browser.js";
it("owns Scroll Area viewport measurement through the built Primitive", async () => {
  const consumer = await createStyledScrollAreaConsumer(process.cwd());
  try {
    await verifyScrollAreaLifecycle(consumer);
  } finally {
    await consumer.dispose();
  }
}, 60000);
