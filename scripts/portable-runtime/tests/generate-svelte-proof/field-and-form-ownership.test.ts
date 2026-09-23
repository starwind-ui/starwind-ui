import { it } from "vitest";
import { createStyledFieldConsumer } from "../../../../packages/svelte/tests/styled-field-consumer.js";

import { verifyFieldOwnership } from "../../../../packages/svelte/tests/field-and-form-ownership-browser.js";
it("hydrates Field with stable Form ownership, removal, overrides and controls", async () => {
  const consumer = await createStyledFieldConsumer(process.cwd());
  try {
    await verifyFieldOwnership(consumer, false);
  } finally {
    await consumer.dispose();
  }
}, 60000);
