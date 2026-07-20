import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@starwind-ui/vue/scroll-area";

describe("Vue Scroll Area SSR", () => {
  it("server-renders deterministic complete anatomy without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(
        createSSRApp({
          render: () => scrollAreaTree(),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain(
      '<div class="scroll-area-root" data-review="server" id="server-scroll-area" data-sw-scroll-area data-overflow-edge-threshold-y-start="24" role="presentation">',
    );
    expect(first).toContain(
      'data-sw-scroll-area-viewport role="presentation" tabindex="-1" style="overflow:scroll;"',
    );
    expect(first).toContain('data-sw-scroll-area-content role="presentation"');
    expect(first).toContain(
      'data-sw-scroll-area-scrollbar data-orientation="vertical" aria-hidden="true"',
    );
    expect(first).toContain("data-sw-scroll-area-scrollbar data-keep-mounted");
    expect(first).toContain('data-orientation="horizontal" aria-hidden="true"');
    expect(first).toContain("data-sw-scroll-area-thumb");
    expect(first).toContain('data-sw-scroll-area-corner aria-hidden="true"');
    expect(first).not.toContain(" hidden");
  });

  it("normalizes shared and sparse per-edge thresholds in first-render markup", async () => {
    const shared = await renderToString(
      createSSRApp({
        render: () =>
          h(
            ScrollAreaRoot,
            { overflowEdgeThreshold: -10 },
            { default: () => h(ScrollAreaViewport) },
          ),
      }),
    );
    expect(shared).toContain('data-overflow-edge-threshold="0"');

    const sparse = await renderToString(
      createSSRApp({
        render: () =>
          h(
            ScrollAreaRoot,
            { overflowEdgeThreshold: { xEnd: 12, yStart: Number.NaN } },
            { default: () => h(ScrollAreaViewport) },
          ),
      }),
    );
    expect(sparse).toContain('data-overflow-edge-threshold-x-end="12"');
    expect(sparse).not.toContain("data-overflow-edge-threshold-y-start");
  });
});

function scrollAreaTree() {
  return h(
    ScrollAreaRoot,
    {
      class: "scroll-area-root",
      "data-review": "server",
      id: "server-scroll-area",
      overflowEdgeThreshold: { yStart: 24 },
    },
    {
      default: () => [
        h(ScrollAreaViewport, null, {
          default: () => h(ScrollAreaContent, null, { default: () => "Scrollable content" }),
        }),
        h(ScrollAreaScrollbar, null, {
          default: () => h(ScrollAreaThumb, null, { default: () => "Vertical thumb" }),
        }),
        h(
          ScrollAreaScrollbar,
          { keepMounted: true, orientation: "horizontal" },
          { default: () => h(ScrollAreaThumb) },
        ),
        h(ScrollAreaCorner),
      ],
    },
  );
}
