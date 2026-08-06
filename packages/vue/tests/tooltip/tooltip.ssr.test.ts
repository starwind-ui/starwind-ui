import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import * as Tooltip from "@starwind-ui/vue/tooltip";

describe("Vue Tooltip SSR", () => {
  it("renders deterministic inline portal anatomy without browser work", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              Tooltip.TooltipRoot,
              { defaultOpen: true },
              {
                default: () => [
                  h(Tooltip.TooltipTrigger, null, { default: () => "Help" }),
                  h(Tooltip.TooltipPortal, null, {
                    default: () =>
                      h(
                        Tooltip.TooltipPositioner,
                        { align: "end", side: "right" },
                        {
                          default: () =>
                            h(
                              Tooltip.TooltipPopup,
                              { align: "end", side: "right" },
                              {
                                default: () => "Details",
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
    expect(first).toContain("data-sw-tooltip-portal");
    expect(first).toContain('data-side="right"');
    expect(first).toContain('role="tooltip"');
  });
});
