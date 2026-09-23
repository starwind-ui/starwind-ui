import { it, expect } from "vitest";
import { createStyledTooltipConsumer } from "../../../../packages/svelte/tests/styled-tooltip-consumer.js";
import { verifyTooltipBrowser } from "../../../../packages/svelte/tests/tooltip-browser.js";

it("forwards Styled Tooltip bindings, semantic children, and portal composition", async () => {
  const consumer = await createStyledTooltipConsumer(process.cwd());
  try {
    const result = await verifyTooltipBrowser(
      consumer,
      [
        { id: "main", initial: false, mode: "bound" },
        { id: "cancel", initial: false, proposal: "cancel" },
      ],
      `for (const item of Object.values(cases)) item.delays(0, 0); await settle();
await trigger("main"); await finish();
assert(state("main").visible && state("main").model === true, "Styled Root publishes accepted open");
assert(button("main").tagName === "BUTTON", "Styled trigger forwards the semantic child");
assert(wrapper("main").parentElement.id === "portal-a", "Content composes its portal");
cases.main.place("#portal-b"); await finish();
assert(wrapper("main").parentElement.id === "portal-b", "Content forwards a changed portal target");
const previous = popup("main"); cases.main.replace("popup"); await finish();
assert(popup("main") !== previous && state("main").visible, "Content replacement preserves accepted open");
cases.main.setModel(false); await finish();
assert(!state("main").visible, "Styled Root accepts a parent close");
await trigger("cancel"); await finish();
assert(!state("cancel").visible && state("cancel").writes.length === 0, "Styled callback cancellation blocks publication");
return { composition: true };`,
      true,
    );
    expect(result).toMatchObject({ composition: true, hydrationExact: true, teardown: true });
  } finally {
    await consumer.dispose();
  }
}, 60_000);
