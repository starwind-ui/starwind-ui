import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { ToggleRoot } from "@starwind-ui/vue/toggle";
import { Toggle as StyledToggle } from "../../../../apps/vue-demo/src/components/starwind-runtime/toggle";

describe("Vue Toggle SSR", () => {
  it("server-renders deterministic native-button state without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              ToggleRoot,
              {
                "aria-label": "Pin message",
                class: "pin-toggle",
                defaultPressed: true,
                syncGroup: "pins",
                value: "message-1",
              },
              { default: () => "Pin" },
            ),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toMatch(/<button[^>]*>/);
    expect(first).toContain('type="button"');
    expect(first).toContain('aria-pressed="true"');
    expect(first).toContain('data-default-pressed="true"');
    expect(first).toContain("data-pressed");
    expect(first).toContain('data-state="on"');
    expect(first).toContain('data-sync-group="pins"');
    expect(first).toContain('value="message-1"');
    expect(first).toContain('class="pin-toggle"');
    expect(first).toContain('aria-label="Pin message"');
    expect(first).toContain("Pin");
    expect(first).toContain("</button>");
  });

  it("renders non-native semantics and controlled state without native-only attributes", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            ToggleRoot,
            { disabled: true, nativeButton: false, pressed: false, value: "quiet" },
            { default: () => "Quiet" },
          ),
      }),
    );

    expect(html).toMatch(/<span[^>]*role="button"[^>]*>/);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('data-state="off"');
    expect(html).toContain("data-unpressed");
    expect(html).toContain('tabindex="-1"');
    expect(html).not.toContain("data-default-pressed");
    expect(html).not.toContain('disabled=""');
    expect(html).not.toMatch(/\svalue="quiet"/);
  });

  it("renders the Styled slot default and preserves an explicit consumer override", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h("main", null, [
            h(StyledToggle, null, { default: () => "Default slot" }),
            h(
              StyledToggle,
              { defaultPressed: true, id: "default-pressed-styled-toggle" },
              { default: () => "Pressed slot" },
            ),
            h(
              StyledToggle,
              { "data-slot": "custom-toggle", nativeButton: false },
              { default: () => "Custom slot" },
            ),
          ]),
      }),
    );

    expect(html).toContain('data-slot="toggle"');
    expect(html).toContain('data-slot="custom-toggle"');
    expect(html).toMatch(/id="default-pressed-styled-toggle"[^>]*aria-pressed="true"/);
  });
});
