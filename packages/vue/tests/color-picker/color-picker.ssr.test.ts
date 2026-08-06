import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { ColorPickerRoot } from "@starwind-ui/vue/color-picker";
import { colorPickerChildren } from "./tree.js";

describe("Vue Color Picker SSR", () => {
  it("renders deterministic complete compound anatomy without browser globals", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(ColorPickerRoot, { defaultValue: "#336699", name: "accent" }, colorPickerChildren),
        }),
      );
    const html = await render();
    expect(await render()).toBe(html);
    expect(html).toContain("data-sw-color-picker");
    expect(html).toContain("data-sw-color-picker-area");
    expect(html).toContain("data-sw-color-picker-channel-slider");
    expect(html).toContain("data-sw-color-picker-hidden-input");
    expect(html).toContain("#336699");
  });
});
