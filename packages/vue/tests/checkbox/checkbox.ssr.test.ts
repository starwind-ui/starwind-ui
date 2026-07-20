import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { CheckboxIndicator, CheckboxRoot } from "@starwind-ui/vue/checkbox";

describe("Vue Checkbox SSR", () => {
  it("server-renders deterministic initial form and presence markup without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              CheckboxRoot,
              {
                "aria-label": "Accept terms",
                class: "terms-checkbox",
                defaultChecked: true,
                id: "terms",
                name: "terms",
                required: true,
                value: "accepted",
              },
              {
                default: () => [
                  h(CheckboxIndicator, null, { default: () => "Checked" }),
                  "Accept terms",
                ],
              },
            ),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("<span");
    expect(first).toContain('role="checkbox"');
    expect(first).toContain('aria-checked="true"');
    expect(first).toContain('data-default-checked="true"');
    expect(first).toContain("data-checked");
    expect(first).toContain('class="terms-checkbox"');
    expect(first).toContain('aria-label="Accept terms"');
    expect(first).toContain("data-sw-checkbox-indicator");
    expect(first).toContain(" hidden");
    expect(first).toContain("data-sw-checkbox-input");
    expect(first).toContain('type="checkbox"');
    expect(first).toContain('name="terms"');
    expect(first).not.toContain("data-sw-checkbox-unchecked-input");
  });

  it("keeps native-button semantics and sibling input deterministic", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            CheckboxRoot,
            { defaultChecked: false, nativeButton: true },
            { default: () => "Toggle" },
          ),
      }),
    );

    expect(html).toMatch(/<button[^>]*role="checkbox"[^>]*>/);
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toMatch(/<\/button>\s*<input[^>]*data-sw-checkbox-input/);
  });
});
