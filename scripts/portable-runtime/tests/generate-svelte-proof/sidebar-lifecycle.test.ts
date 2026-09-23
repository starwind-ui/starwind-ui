import { it, expect } from "vitest";
import { createSidebarConsumer } from "../../../../packages/svelte/tests/sidebar-consumer.js";
import { verifySidebarLifecycle } from "../../../../packages/svelte/tests/sidebar-browser.js";
it("preserves Sidebar accepted models, persistence, semantic controls, and the owned Sheet bridge", async () => {
  const consumer = await createSidebarConsumer(process.cwd());
  try {
    expect(await verifySidebarLifecycle(consumer)).toMatchObject({
      models: true,
      persistence: true,
      media: true,
      children: true,
      sheet: true,
      nested: true,
      teardown: true,
    });
  } finally {
    await consumer.dispose();
  }
}, 120_000);
