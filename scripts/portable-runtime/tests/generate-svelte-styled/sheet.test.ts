import { it, expect } from "vitest";
import { createStyledSheetConsumer } from "../../../../packages/svelte/tests/styled-sheet-consumer.js";
import { verifyDrawerBrowser } from "../../../../packages/svelte/tests/drawer-browser.js";

it("forwards Sheet binding, side variants, and the attached stock close owner", async () => {
  const consumer = await createStyledSheetConsumer(process.cwd());
  try {
    const result = await verifyDrawerBrowser(
      consumer,
      [{ id: "native", initial: false, iconProbe: true }],
      `
trigger("native"); await finish();
assert(state("native").model === true, "Sheet publishes accepted open");
for (const side of ["left", "top", "bottom", "right"]) {
 const current = popup("native"); cases.native.setSide(side); await settle();
 assert(popup("native") === current && current.open && current.getAttribute("data-side") === side, "side changes keep the native owner");
 assert(current.className.includes("slide-in-from-" + side) && current.className.includes("slide-out-to-" + side), "Content forwards side variants");
}
const original = cases.native.stockCloseSnapshot().owners[0];
assert(original === popup("native").querySelector('[data-slot="sheet-close"][data-sw-button]'), "icon attachment reaches the stock close");
original.click(); await finish(); assert(state("native").model === false && !state("native").native, "stock close publishes accepted close");
cases.native.hide(); await finish();
assert(cases.native.stockCloseSnapshot().events.join("|") === "setup|cleanup", "stock close attachment teardown");
return { composition:true };`,
      true,
    );
    expect(result).toMatchObject({ composition: true, hydrationExact: true, teardown: true });
  } finally {
    await consumer.dispose();
  }
}, 60_000);
