import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { ToggleGroupRoot } from "@starwind-ui/vue/toggle-group";
import { ToggleRoot } from "@starwind-ui/vue/toggle";
import {
  ToggleGroup as StyledToggleGroup,
  ToggleGroupItem as StyledToggleGroupItem,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/toggle-group";

describe("Vue Toggle Group SSR", () => {
  it("renders deterministic single and multiple group state without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h("main", null, [
              h(
                ToggleGroupRoot,
                { defaultValue: ["bold", "italic"], orientation: "vertical" },
                {
                  default: () => [
                    h(ToggleRoot, { value: "bold" }, { default: () => "Bold" }),
                    h(ToggleRoot, { value: "italic" }, { default: () => "Italic" }),
                  ],
                },
              ),
              h(
                ToggleGroupRoot,
                { defaultValue: ["left", "right"], multiple: true },
                {
                  default: () => [
                    h(ToggleRoot, { value: "left" }, { default: () => "Left" }),
                    h(ToggleRoot, { value: "right" }, { default: () => "Right" }),
                  ],
                },
              ),
            ]),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first.match(/data-sw-toggle-group/g)).toHaveLength(2);
    expect(first).toContain('data-default-value="[&quot;bold&quot;]"');
    expect(first).toContain('data-value="[&quot;bold&quot;]"');
    expect(first).toContain('data-orientation="vertical"');
    expect(first).toContain('data-value="[&quot;left&quot;,&quot;right&quot;]"');
    expect(first).toContain("data-multiple");
    expect(first.match(/aria-pressed="true"/g)).toHaveLength(3);
  });

  it("renders Styled spacing and consumer style on the Primitive root", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            StyledToggleGroup,
            {
              id: "styled-toggle-group",
              spacing: 7,
              style: "color: rgb(1, 2, 3); outline-width: 2px",
            },
            {
              default: () =>
                h(StyledToggleGroupItem, { value: "alpha" }, { default: () => "Alpha" }),
            },
          ),
      }),
    );

    expect(html).toContain('id="styled-toggle-group"');
    expect(html).toContain('style="--gap:7;color:rgb(1, 2, 3);outline-width:2px;"');
    expect(html.match(/style="/g)).toHaveLength(1);
  });
});
