import { expect, it } from "vitest";
import { verifyStyledSidebar } from "../../../../packages/svelte/tests/styled-sidebar-browser.js";
import { createStyledSidebarConsumer } from "../../../../packages/svelte/tests/styled-sidebar-consumer.js";

it("composes Sidebar layout, native controls, tooltips and the owned mobile Sheet", async () => {
  const consumer = await createStyledSidebarConsumer(process.cwd());
  try {
    expect(await verifyStyledSidebar(consumer)).toEqual({
      hydration: true,
      layout: true,
      models: true,
      children: true,
      tooltip: true,
      sheet: true,
      teardown: true,
    });
  } finally {
    await consumer.dispose();
  }
}, 120_000);
