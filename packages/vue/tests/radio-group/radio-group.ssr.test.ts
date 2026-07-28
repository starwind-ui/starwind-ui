import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { RadioGroupRoot } from "@starwind-ui/vue/radio-group";
import { RadioRoot } from "@starwind-ui/vue/radio";
import { RadioGroup as StyledRadioGroup } from "../../../../apps/vue-demo/src/components/starwind-runtime/radio-group";

describe("Vue Radio Group SSR", () => {
  it("renders deterministic group and child state without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              RadioGroupRoot,
              { defaultValue: "alpha", name: "choice", orientation: "horizontal" },
              {
                default: () => [
                  h(RadioRoot, { checked: false, value: "alpha" }, { default: () => "Alpha" }),
                  h(
                    RadioRoot,
                    { checked: true, defaultChecked: true, value: "beta" },
                    { default: () => "Beta" },
                  ),
                ],
              },
            ),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-radio-group");
    expect(first).toContain('data-value="alpha"');
    expect(first).toContain('role="radiogroup"');
    expect(first).toContain('aria-orientation="horizontal"');
    expect(first.match(/role="radio"/g)).toHaveLength(2);
    expect(first.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(first).not.toContain("data-default-checked");
    expect(first).toContain('name="choice"');
  });

  it("preserves consumer aria-label precedence with and without a legend", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h("main", null, [
            h(StyledRadioGroup, { "aria-label": "Consumer only", id: "consumer-only" }),
            h(StyledRadioGroup, { id: "legend-only", legend: "Legend only" }),
            h(StyledRadioGroup, {
              "aria-label": "Consumer override",
              id: "consumer-override",
              legend: "Legend fallback",
            }),
          ]),
      }),
    );

    expect(html).toMatch(
      /id="consumer-only"[^>]*aria-label="Consumer only"|aria-label="Consumer only"[^>]*id="consumer-only"/,
    );
    expect(html).toMatch(
      /id="legend-only"[^>]*aria-label="Legend only"|aria-label="Legend only"[^>]*id="legend-only"/,
    );
    expect(html).toMatch(
      /id="consumer-override"[^>]*aria-label="Consumer override"|aria-label="Consumer override"[^>]*id="consumer-override"/,
    );
    expect(html).not.toContain('aria-label="Legend fallback"');
    expect(html).not.toContain('aria-label="undefined"');
  });
});
