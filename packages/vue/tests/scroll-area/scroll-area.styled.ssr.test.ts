import { createSSRApp, h, type Component } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaThumb,
  ScrollAreaViewport,
  ScrollBar,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/scroll-area/index.js";

describe("generated Vue Styled Scroll Area SSR", () => {
  it("server-renders deterministic default anatomy, attrs, viewportClass, variants, and CSS hooks", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderComponent(
        ScrollArea,
        {
          class: "consumer-root",
          "data-review": "server",
          overflowEdgeThreshold: 18,
          viewportClass: "consumer-viewport",
        },
        { default: () => "Scrollable content" },
      );
    const first = await render();

    expect(await render()).toBe(first);
    expect(first).toContain("consumer-root");
    expect(first).toContain("consumer-viewport");
    expect(first).toContain('data-review="server"');
    expect(first).toContain('data-overflow-edge-threshold="18"');
    expect(first).toContain("relative overflow-hidden");
    expect(first).toContain("size-full overflow-auto");
    expect(first).toContain("min-w-fit");
    expect(first).toContain("bg-border relative flex-1 rounded-full");
    expect(first).toContain("Scrollable content");
    expect(first.match(/data-slot=/g)).toHaveLength(6);
    for (const slot of [
      "scroll-area",
      "scroll-area-viewport",
      "scroll-area-content",
      "scroll-area-scrollbar",
      "scroll-area-thumb",
      "scroll-area-corner",
    ]) {
      expect(first).toContain(`data-slot="${slot}"`);
    }
  });

  it("server-renders every public wrapper and custom horizontal scrollbar composition", async () => {
    const cases: Array<[Component, Record<string, unknown>, string]> = [
      [ScrollAreaViewport, { class: "custom-viewport" }, "scroll-area-viewport"],
      [ScrollAreaContent, { class: "custom-content" }, "scroll-area-content"],
      [ScrollBar, { class: "custom-bar", orientation: "horizontal" }, "scroll-area-scrollbar"],
      [ScrollAreaThumb, { class: "custom-thumb" }, "scroll-area-thumb"],
      [ScrollAreaCorner, { class: "custom-corner" }, "scroll-area-corner"],
    ];
    for (const [component, props, slot] of cases) {
      const html = await renderComponent(component, props, { default: () => "Part content" });
      expect(html).toContain(`data-slot="${slot}"`);
    }

    const custom = await renderComponent(
      ScrollArea,
      { "data-testid": "custom-root" },
      {
        default: () => "Custom content",
        scrollbar: () =>
          h(
            ScrollBar,
            {
              class: "custom-horizontal-bar",
              "data-testid": "custom-horizontal",
              keepMounted: true,
              orientation: "horizontal",
            },
            { default: () => h(ScrollAreaThumb, { class: "custom-horizontal-thumb" }) },
          ),
      },
    );

    expect(custom).toContain('data-testid="custom-root"');
    expect(custom).toContain('data-testid="custom-horizontal"');
    expect(custom).toContain('data-orientation="horizontal"');
    expect(custom).toContain("custom-horizontal-bar");
    expect(custom).toContain("custom-horizontal-thumb");
    expect(custom.match(/data-slot="scroll-area-scrollbar"/g)).toHaveLength(1);
    expect(custom.match(/data-slot="scroll-area-thumb"/g)).toHaveLength(1);
  });
});

function renderComponent(
  component: Component,
  props: Record<string, unknown>,
  slots?: Record<string, () => unknown>,
): Promise<string> {
  return renderToString(
    createSSRApp({
      render: () => h(component, props, slots),
    }),
  );
}
