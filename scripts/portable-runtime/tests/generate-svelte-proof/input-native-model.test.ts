import { it } from "vitest";
import { createStyledInputConsumer } from "../../../../packages/svelte/tests/styled-input-consumer.js";
import { verifyInputLifecycle } from "../../../../packages/svelte/tests/input-native-model-browser.js";
it("hydrates native Input models, reset races, form association and owner cleanup", async () => {
  const consumer = await createStyledInputConsumer(process.cwd());
  try {
    await verifyInputLifecycle(consumer);
  } finally {
    await consumer.dispose();
  }
}, 60000);
