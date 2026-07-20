import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { ButtonRoot } from "@starwind-ui/vue/button";

describe("Vue Button SSR", () => {
  it("server-renders deterministic semantic markup without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              ButtonRoot,
              {
                "aria-label": "Save changes",
                class: "primary-action",
                disabled: true,
                focusableWhenDisabled: true,
                id: "save-button",
              },
              { default: () => "Save" },
            ),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("<button");
    expect(first).toContain('type="button"');
    expect(first).toContain('id="save-button"');
    expect(first).toContain('class="primary-action"');
    expect(first).toContain('aria-label="Save changes"');
    expect(first).toContain('aria-disabled="true"');
    expect(first).toContain("data-focusable-when-disabled");
    expect(first).not.toContain(" disabled");
    expect(first).toMatch(/>[\s\S]*Save[\s\S]*<\/button>/);
  });
});
