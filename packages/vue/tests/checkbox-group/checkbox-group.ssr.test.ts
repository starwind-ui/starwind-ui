import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { CheckboxGroupRoot } from "@starwind-ui/vue/checkbox-group";
import { CheckboxRoot } from "@starwind-ui/vue/checkbox";

describe("Vue Checkbox Group SSR", () => {
  it("renders deterministic group and child state without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              CheckboxGroupRoot,
              { defaultValue: ["alpha"], disabled: true },
              {
                default: () => [
                  h(CheckboxRoot, { value: "alpha" }, { default: () => "Alpha" }),
                  h(CheckboxRoot, { value: "beta" }, { default: () => "Beta" }),
                ],
              },
            ),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-checkbox-group");
    expect(first).toContain('data-default-value="[&quot;alpha&quot;]"');
    expect(first).toContain('data-value="[&quot;alpha&quot;]"');
    expect(first).toContain('role="group"');
    expect(first.match(/role="checkbox"/g)).toHaveLength(2);
    expect(first).toContain('aria-checked="true"');
    expect(first).toContain("data-disabled");
  });
});
