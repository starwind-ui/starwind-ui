import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { SliderControl, SliderRoot, SliderThumb, SliderTrack } from "@starwind-ui/vue/slider";
import { Slider as StyledSlider } from "../../../../apps/vue-demo/src/components/starwind-runtime/slider";

describe("Vue Slider SSR", () => {
  it("renders deterministic scalar and array placeholder markup without browser globals", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(SliderRoot, { defaultValue: [20, 80], name: "price" }, () =>
              h(SliderControl, null, () => [
                h(SliderTrack),
                h(SliderThumb, { index: 0 }),
                h(SliderThumb, { index: 1 }),
              ]),
            ),
        }),
      );
    const html = await render();
    expect(await render()).toBe(html);
    expect(html).toContain("data-sw-slider");
    expect(html).toContain('data-default-value="[20,80]"');
    expect(html.match(/data-sw-slider-input/g)).toHaveLength(2);
  });

  it("renders Styled geometry and canonical slots", async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(StyledSlider, { defaultValue: 35 }) }),
    );
    expect(html).toContain('data-slot="slider"');
    expect(html).toContain('data-slot="slider-range"');
    expect(html).toContain('data-slot="slider-thumb"');
  });
});
