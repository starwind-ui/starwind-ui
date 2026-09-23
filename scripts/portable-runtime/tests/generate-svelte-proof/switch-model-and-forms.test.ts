import { it } from "vitest";
import { createStyledSwitchConsumer } from "../../../../packages/svelte/tests/styled-switch-consumer.js";
import { verifySwitchLifecycle } from "../../../../packages/svelte/tests/switch-model-and-forms-browser.js";
it("hydrates Switch span/button anatomy, accepted models and native forms", async () => {
  const consumer = await createStyledSwitchConsumer(process.cwd());
  try {
    await verifySwitchLifecycle(consumer, false);
  } finally {
    await consumer.dispose();
  }
}, 60000);
