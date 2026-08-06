import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  MenuCheckboxItem,
  MenuCheckboxItemIndicator,
  MenuItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRadioItemIndicator,
  MenuRoot,
  MenuSubmenuRoot,
  MenuSubmenuTrigger,
  MenuTrigger,
} from "@starwind-ui/vue/menu";

describe("Vue Menu SSR", () => {
  it("server-renders deterministic local portal, item variants, and submenu ownership", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(
        createSSRApp({
          render: () => renderMenu({ defaultOpen: true }),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-menu");
    expect(first).toContain('data-state="open"');
    expect(first).toContain("data-sw-menu-portal");
    expect(first).toContain("data-sw-menu-checkbox-item");
    expect(first).toContain('aria-checked="true"');
    expect(first).toContain("data-sw-menu-radio-group");
    expect(first).toContain("data-sw-menu-submenu-root");
    expect(first).toContain("teleport start");
    expect(first).toContain("teleport end");
  });

  it("gives a defined radio group value precedence over an item checked prop", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => renderMenu({ defaultOpen: true, conflictingRadioChecked: true }),
      }),
    );

    expect(html).toMatch(/data-value="list"[^>]*aria-checked="true"/);
    expect(html).toMatch(/data-value="grid"[^>]*aria-checked="false"/);
    expect(html).toMatch(
      /data-value="list"[\s\S]*?data-sw-menu-radio-item-indicator[^>]*data-visible/,
    );
    expect(html).toMatch(
      /data-value="grid"[\s\S]*?data-sw-menu-radio-item-indicator[^>]*data-hidden/,
    );
  });
});

function renderMenu(
  rootProps: Record<string, unknown> & { conflictingRadioChecked?: boolean } = {},
) {
  const { conflictingRadioChecked = false, ...menuRootProps } = rootProps;
  return h(MenuRoot, menuRootProps, {
    default: () => [
      h(MenuTrigger, null, { default: () => "Actions" }),
      h(
        MenuPortal,
        { container: "#overlays" },
        {
          default: () =>
            h(MenuPositioner, null, {
              default: () =>
                h(MenuPopup, null, {
                  default: () => [
                    h(MenuItem, null, { default: () => "Edit" }),
                    h(
                      MenuCheckboxItem,
                      { defaultChecked: true },
                      {
                        default: () => [
                          "Pinned",
                          h(MenuCheckboxItemIndicator, null, { default: () => "yes" }),
                        ],
                      },
                    ),
                    h(
                      MenuRadioGroup,
                      { defaultValue: "list" },
                      {
                        default: () => [
                          h(
                            MenuRadioItem,
                            { value: "list" },
                            {
                              default: () => [
                                "List",
                                h(MenuRadioItemIndicator, null, { default: () => "yes" }),
                              ],
                            },
                          ),
                          h(
                            MenuRadioItem,
                            { value: "grid", checked: conflictingRadioChecked },
                            {
                              default: () => [
                                "Grid",
                                h(MenuRadioItemIndicator, null, { default: () => "yes" }),
                              ],
                            },
                          ),
                        ],
                      },
                    ),
                    h(MenuSubmenuRoot, null, {
                      default: () => [
                        h(MenuSubmenuTrigger, null, { default: () => "More" }),
                        h(MenuPortal, null, {
                          default: () =>
                            h(
                              MenuPositioner,
                              { side: "right" },
                              {
                                default: () =>
                                  h(MenuPopup, null, {
                                    default: () =>
                                      h(MenuItem, null, { default: () => "Duplicate" }),
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
