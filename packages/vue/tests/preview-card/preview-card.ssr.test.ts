import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import * as PreviewCard from "@starwind-ui/vue/preview-card";

describe("Vue Preview Card SSR", () => {
  it("renders deterministic inline portal and full presence anatomy", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              PreviewCard.PreviewCardRoot,
              { defaultOpen: true },
              {
                default: () => [
                  h(
                    PreviewCard.PreviewCardTrigger,
                    { href: "#profile" },
                    { default: () => "Profile" },
                  ),
                  h(PreviewCard.PreviewCardPortal, null, {
                    default: () => [
                      h(PreviewCard.PreviewCardBackdrop),
                      h(
                        PreviewCard.PreviewCardPositioner,
                        { align: "start", side: "top" },
                        {
                          default: () =>
                            h(PreviewCard.PreviewCardViewport, null, {
                              default: () =>
                                h(
                                  PreviewCard.PreviewCardPopup,
                                  { align: "start", side: "top" },
                                  {
                                    default: () => "Profile details",
                                  },
                                ),
                            }),
                        },
                      ),
                    ],
                  }),
                ],
              },
            ),
        }),
      );
    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-preview-card-portal");
    expect(first).toContain("data-sw-preview-card-backdrop");
    expect(first).toContain("data-sw-preview-card-viewport");
    expect(first).toContain('data-side="top"');
  });
});
