import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  CarouselContainer,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselRoot,
  CarouselViewport,
} from "@starwind-ui/vue/carousel";

describe("Vue Carousel SSR", () => {
  it("renders deterministic engine anatomy without browser globals", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(CarouselRoot, { orientation: "vertical", opts: { loop: true } }, () => [
              h(CarouselViewport, null, () =>
                h(CarouselContainer, null, () => [
                  h(CarouselItem, { key: "one" }, () => "One"),
                  h(CarouselItem, { key: "two" }, () => "Two"),
                ]),
              ),
              h(CarouselPrevious, null, () => "Previous"),
              h(CarouselNext, null, () => "Next"),
            ]),
        }),
      );

    const html = await render();
    expect(await render()).toBe(html);
    expect(html).toContain("data-sw-carousel");
    expect(html).toContain('data-axis="y"');
    expect(html).toContain('data-auto-init="false"');
    expect(html.match(/data-sw-carousel-item/g)).toHaveLength(2);
  });
});
