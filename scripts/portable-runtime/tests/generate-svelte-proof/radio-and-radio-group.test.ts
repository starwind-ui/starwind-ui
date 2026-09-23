import { it } from "vitest";
import { createStyledRadioGroupConsumer } from "../../../../packages/svelte/tests/styled-radio-group-consumer.js";
import { verifyRadioGroupLifecycle } from "../../../../packages/svelte/tests/radio-and-radio-group-browser.js";
it("hydrates Radio and Radio Group ownership, empty selection and native reset", async () => {
  const consumer = await createStyledRadioGroupConsumer(process.cwd());
  try {
    await verifyRadioGroupLifecycle(consumer);
  } finally {
    await consumer.dispose();
  }
}, 60000);
