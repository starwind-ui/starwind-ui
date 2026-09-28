import { it } from "vitest";
import { createStyledFormConsumer } from "../../../../packages/svelte/tests/styled-form-consumer.js";
import { verifyFormAndFieldset } from "../../../../packages/svelte/tests/form-and-fieldset-browser.js";
it("hydrates Form and Fieldset with native validation, discovery, disabled state and cleanup", async () => {
  const consumer = await createStyledFormConsumer(process.cwd());
  try {
    await verifyFormAndFieldset(consumer);
  } finally {
    await consumer.dispose();
  }
}, 60000);
