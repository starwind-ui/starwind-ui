import { afterEach, describe, expect, it } from "vitest";
import { createStyledToastConsumer } from "../../../../packages/svelte/tests/styled-toast-consumer.js";
import { verifyStyledToast } from "../../../../packages/svelte/tests/styled-toast-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
describe("generated Svelte Styled Toast", () => {
  it("composes default and custom templates with the service, stylesheet and native owners", async () => {
    const consumer = await createStyledToastConsumer(process.cwd());
    consumers.push(consumer);
    expect(await verifyStyledToast(consumer)).toEqual({
      defaults: true,
      custom: true,
      service: true,
      config: true,
      stylesheet: true,
      owners: true,
      teardown: true,
    });
  }, 120_000);
});
