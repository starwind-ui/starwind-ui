import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { SwitchRoot, SwitchThumb } from "@starwind-ui/vue/switch";

describe("Vue Switch SSR", () => {
  it("renders deterministic initial state, external input, attrs, and thumb markup", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              SwitchRoot,
              {
                "aria-label": "Notifications",
                class: "notifications-switch",
                defaultChecked: true,
                id: "notifications",
                name: "notifications",
                required: true,
                value: "yes",
              },
              { default: () => h(SwitchThumb, { "data-testid": "thumb" }) },
            ),
        }),
      );

    const html = await render();
    expect(await render()).toBe(html);
    expect(html).toMatch(/<span[^>]*role="switch"[^>]*>/);
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('data-default-checked="true"');
    expect(html).toContain('class="notifications-switch"');
    expect(html).toContain("data-sw-switch-thumb");
    expect(html).toMatch(/<\/span>\s*<input[^>]*data-sw-switch-input/);
    expect(html).toContain('id="notifications"');
    expect(html).toContain('name="notifications"');
  });

  it("keeps native button and input ids distinct", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            SwitchRoot,
            { defaultChecked: false, id: "native-switch", nativeButton: true },
            { default: () => h(SwitchThumb) },
          ),
      }),
    );

    expect(html).toMatch(/<button[^>]*id="native-switch"[^>]*>/);
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toMatch(/<\/button>\s*<input[^>]*id="native-switch-input"/);
  });
});
