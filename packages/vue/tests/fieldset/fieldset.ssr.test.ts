import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { FieldsetLegend, FieldsetRoot } from "@starwind-ui/vue/fieldset";
import { InputRoot } from "@starwind-ui/vue/input";

describe("Vue Fieldset SSR", () => {
  it("renders deterministic semantic disabled markup without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              FieldsetRoot,
              { class: "preferences", disabled: true },
              {
                default: () => [
                  h(FieldsetLegend, { id: "preferences-label" }, () => "Preferences"),
                  h(InputRoot, { name: "nickname", value: "Ada" }),
                ],
              },
            ),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("<fieldset");
    expect(first).toContain("data-sw-fieldset");
    expect(first).toContain("data-disabled");
    expect(first).toContain("disabled");
    expect(first).toContain("data-sw-fieldset-legend");
    expect(first).toContain('name="nickname"');
  });
});
