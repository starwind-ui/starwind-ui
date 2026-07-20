import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import ThemeToggle from "../../../../apps/vue-demo/src/components/starwind-runtime/theme-toggle/ThemeToggle.vue";

describe("generated Vue Theme Toggle SSR", () => {
  it("renders one semantic button with deterministic state, attrs, and default icons", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(ThemeToggle, {
            "aria-label": "Change appearance",
            class: "consumer-class",
            "data-consumer": "forwarded",
            pressed: true,
            style: { color: "red" },
            type: "submit",
          }),
      }),
    );

    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Change appearance"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('data-state="on"');
    expect(html).toContain('data-slot="theme-toggle"');
    expect(html).toContain('data-consumer="forwarded"');
    expect(html).toContain("consumer-class");
    expect(html).toContain("color:red");
    expect(html.match(/data-theme-icon(?:>|\s)/g)).toHaveLength(2);
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(2);
  });

  it("projects named icon slots without duplicating fallback icons", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            ThemeToggle,
            { defaultPressed: false },
            {
              "dark-icon": () => h("span", { "data-custom-dark": "" }, "Dark"),
              "light-icon": () => h("span", { "data-custom-light": "" }, "Light"),
            },
          ),
      }),
    );

    expect(html).toContain("data-custom-dark");
    expect(html).toContain("data-custom-light");
    expect(html.match(/data-theme-icon(?:>|\s)/g)).toBeNull();
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('data-state="off"');
  });
});
