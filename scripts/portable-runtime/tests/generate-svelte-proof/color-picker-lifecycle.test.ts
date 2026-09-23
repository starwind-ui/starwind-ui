import { afterEach, describe, expect, it } from "vitest";
import { createColorPickerConsumer } from "../../../../packages/svelte/tests/color-picker-consumer.js";
import { verifyColorPickerLifecycle } from "../../../../packages/svelte/tests/color-picker-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
describe("generated Svelte Color Picker", () => {
  it("preserves accepted models, native reset and owned live parts through hydration", async () => {
    const consumer = await createColorPickerConsumer(process.cwd());
    consumers.push(consumer);
    const result = await verifyColorPickerLifecycle(consumer);
    expect(result).toMatchObject({
      models: true,
      transactions: true,
      reset: true,
      parts: true,
      swatchDisabled: true,
      eyeDropper: true,
      teardown: true,
    });
  }, 120_000);
});
