import { expect, it } from "vitest";
import { verifyStyledColorPicker } from "../../../../packages/svelte/tests/styled-color-picker-browser.js";
import { createStyledColorPickerConsumer } from "../../../../packages/svelte/tests/styled-color-picker-consumer.js";

it("composes Color Picker models, format controls, native form state and local Popover ownership", async () => {
  const consumer = await createStyledColorPickerConsumer(process.cwd());
  try {
    expect(await verifyStyledColorPicker(consumer)).toEqual({
      hydration: true,
      models: true,
      formats: true,
      custom: true,
      form: true,
      dialog: true,
      teardown: true,
    });
  } finally {
    await consumer.dispose();
  }
}, 120_000);
