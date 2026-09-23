import { it, expect } from "vitest";
import { createStyledPopoverConsumer } from "../../../../packages/svelte/tests/styled-popover-consumer.js";
import { verifyPopoverBrowser } from "../../../../packages/svelte/tests/popover-browser.js";

it("forwards Styled Popover bindings, semantic children, and portal composition", async () => {
  const consumer = await createStyledPopoverConsumer(process.cwd());
  try {
    const result = await verifyPopoverBrowser(
      consumer,
      [
        { id: "main", initial: false, mode: "bound" },
        { id: "cancel", initial: false, proposal: "cancel" },
      ],
      `
trigger("main"); await finish();
assert(state("main").visible && state("main").model === true, "Styled Root publishes accepted open");
assert(button("main").tagName === "BUTTON", "Styled trigger forwards the semantic child");
assert(wrapper("main").parentElement.id === "portal-a", "Content composes its portal");
cases.main.place("#portal-b"); await finish();
assert(wrapper("main").parentElement.id === "portal-b", "Content forwards a changed portal target");
cases.main.setModel(false); await finish();
assert(!state("main").visible, "Styled Root accepts a parent close");
trigger("cancel"); await finish();
assert(!state("cancel").visible && state("cancel").writes.length === 0, "Styled callback cancellation blocks publication");
return { composition: true };`,
      true,
    );
    expect(result).toMatchObject({ composition: true, hydrationExact: true, teardown: true });
  } finally {
    await consumer.dispose();
  }
}, 60_000);
