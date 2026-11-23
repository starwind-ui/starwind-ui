import { it } from "vitest";
import { verifyFieldOwnership } from "../../../../packages/svelte/tests/field-and-form-ownership-browser.js";
import { createStyledFieldConsumer } from "../../../../packages/svelte/tests/styled-field-consumer.js";

it("hydrates Field with stable Form ownership, removal, overrides and controls", async () => {
  const consumer = await createStyledFieldConsumer(process.cwd());
  try {
    await verifyFieldOwnership(consumer, false);
  } finally {
    await consumer.dispose();
  }
}, 60000);
