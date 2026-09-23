import { it } from "vitest";
import { createStyledAvatarConsumer } from "../../../../packages/svelte/tests/styled-avatar-consumer.js";
import { verifyAvatarLifecycle } from "../../../../packages/svelte/tests/avatar-lifecycle-browser.js";
it("hydrates generated Primitive Avatar with current callbacks, replaced parts, delayed fallback and cleanup", async () => {
  const consumer = await createStyledAvatarConsumer(process.cwd());
  try {
    await verifyAvatarLifecycle(consumer, false);
  } finally {
    await consumer.dispose();
  }
}, 60000);
