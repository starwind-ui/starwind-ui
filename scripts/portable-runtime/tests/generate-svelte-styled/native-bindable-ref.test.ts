import { afterEach, expect, it } from "vitest";
import { createStyledNativeConsumer } from "../../../../packages/svelte/tests/styled-native-consumer.js";
import { verifyStyledBindableRefs } from "../../../../packages/svelte/tests/styled-bindable-ref-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";

const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});

it("exposes native bindable refs, keeps them stable, clears them, and targets the table", async () => {
  const consumer = await createStyledNativeConsumer(process.cwd(), [
    "card",
    "badge",
    "table",
    "native-select",
    "textarea",
  ]);
  consumers.push(consumer);
  await verifyStyledBindableRefs(consumer);
  expect(true).toBe(true);
}, 60_000);
