import { afterEach, describe, expect, it } from "vitest";
import { createStyledCarouselConsumer } from "../../../../packages/svelte/tests/styled-carousel-consumer.js";
import { verifyStyledCarousel } from "../../../../packages/svelte/tests/styled-carousel-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
describe("generated Svelte Styled Carousel", () => {
  it("forwards the service, native controls and custom slides through its composed viewport", async () => {
    const consumer = await createStyledCarouselConsumer(process.cwd());
    consumers.push(consumer);
    expect(await verifyStyledCarousel(consumer)).toEqual({
      hydrationExact: true,
      forwarding: true,
      controls: true,
      customSlides: true,
      owners: true,
      teardown: true,
    });
  }, 120_000);
});
