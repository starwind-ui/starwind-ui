import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  ContextMenuCheckboxItem,
  ContextMenuCheckboxItemIndicator,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuPortal,
  ContextMenuPositioner,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRadioItemIndicator,
  ContextMenuRoot,
  ContextMenuSubmenuRoot,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
} from "@starwind-ui/vue/context-menu";

describe("Vue Context Menu SSR", () => {
  it("server-renders the local anchored root through Menu-backed parts", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(createSSRApp({ render: () => renderContextMenu({ defaultOpen: true }) }));
    const first = await render();

    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-context-menu");
    expect(first).toContain("data-sw-menu");
    expect(first).toContain("data-sw-context-menu-trigger");
    expect(first).toContain('aria-expanded="true"');
    expect(first).toContain("data-sw-menu-checkbox-item");
    expect(first).toContain("data-sw-menu-radio-group");
    expect(first).toContain("data-sw-menu-submenu-root");
    expect(first).toContain("teleport start");
    expect(first).toContain("teleport end");
    expect(first).not.toContain("data-sw-context-menu-anchor");
  });
});

function renderContextMenu(rootProps: Record<string, unknown> = {}) {
  return h(ContextMenuRoot, rootProps, {
    default: () => [
      h(ContextMenuTrigger, null, { default: () => "Canvas" }),
      h(
        ContextMenuPortal,
        { container: "#overlays" },
        {
          default: () =>
            h(ContextMenuPositioner, null, {
              default: () =>
                h(ContextMenuPopup, null, {
                  default: () => [
                    h(ContextMenuItem, null, { default: () => "Rename" }),
                    h(
                      ContextMenuCheckboxItem,
                      { defaultChecked: true },
                      {
                        default: () => ["Pinned", h(ContextMenuCheckboxItemIndicator)],
                      },
                    ),
                    h(
                      ContextMenuRadioGroup,
                      { defaultValue: "list" },
                      {
                        default: () =>
                          h(
                            ContextMenuRadioItem,
                            { value: "list" },
                            {
                              default: () => ["List", h(ContextMenuRadioItemIndicator)],
                            },
                          ),
                      },
                    ),
                    h(ContextMenuSubmenuRoot, null, {
                      default: () => [
                        h(ContextMenuSubmenuTrigger, null, { default: () => "More" }),
                        h(ContextMenuPortal, null, {
                          default: () =>
                            h(
                              ContextMenuPositioner,
                              { side: "right" },
                              {
                                default: () =>
                                  h(ContextMenuPopup, null, {
                                    default: () =>
                                      h(ContextMenuItem, null, { default: () => "Duplicate" }),
                                  }),
                              },
                            ),
                        }),
                      ],
                    }),
                  ],
                }),
            }),
        },
      ),
    ],
  });
}
