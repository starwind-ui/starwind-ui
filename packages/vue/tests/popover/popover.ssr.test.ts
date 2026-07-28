import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import * as Popover from "@starwind-ui/vue/popover";
import {
  Popover as StyledPopover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/popover";

describe("Vue Popover SSR", () => {
  it("renders deterministic inline Primitive Portal and floating anatomy", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              Popover.PopoverRoot,
              { defaultOpen: true },
              {
                default: () => [
                  h(Popover.PopoverTrigger, null, { default: () => "Open" }),
                  h(Popover.PopoverPortal, null, {
                    default: () =>
                      h(
                        Popover.PopoverPositioner,
                        { align: "end", side: "right" },
                        {
                          default: () =>
                            h(
                              Popover.PopoverPopup,
                              { align: "end", side: "right" },
                              {
                                default: () => [
                                  h(Popover.PopoverTitle, null, { default: () => "Popover" }),
                                  h(Popover.PopoverDescription, null, { default: () => "Details" }),
                                ],
                              },
                            ),
                        },
                      ),
                  }),
                ],
              },
            ),
        }),
      );
    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-popover-portal");
    expect(first).toContain("data-sw-popover-positioner");
    expect(first).toContain("data-sw-popover-popup");
    expect(first).toContain('data-side="right"');
    expect(first).toContain('data-align="end"');
  });

  it("renders Styled Popover through Primitive Portal and Popup", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(StyledPopover, null, {
            default: () => [
              h(PopoverTrigger, null, { default: () => "Open" }),
              h(
                PopoverContent,
                { align: "start", side: "top" },
                {
                  default: () => [
                    h(PopoverTitle, null, { default: () => "Styled Popover" }),
                    h(PopoverDescription, null, { default: () => "Details" }),
                  ],
                },
              ),
            ],
          }),
      }),
    );
    expect(html).toContain('data-slot="popover"');
    expect(html).toContain('data-slot="popover-content"');
    expect(html).toContain('data-side="top"');
    expect(html).toContain('data-align="start"');
  });
});
