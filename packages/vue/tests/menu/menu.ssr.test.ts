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
import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

import {
  Dropdown,
  DropdownContent,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/dropdown";

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

  it("server-renders the bottom side default on Popup and Positioner without a side intent", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => [
          h(MenuPositioner, { id: "positioner" }),
          h(MenuPopup, { id: "popup" }),
          h(MenuPopup, { id: "explicit", side: "left" }),
        ],
      }),
    );

    expect(html).toMatch(/<div[^>]*id="positioner"[^>]*data-side="bottom"/);
    expect(html).toMatch(/<div[^>]*id="popup"[^>]*data-side="bottom"/);
    expect(html).toMatch(/<div[^>]*id="explicit"[^>]*data-side="left"/);
    expect(html).not.toContain("data-sw-menu-side-intent");
  });

  it("server-renders the Styled submenu right side with an empty side intent", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(Dropdown, { defaultOpen: true }, () => [
            h(DropdownTrigger, null, () => "Open"),
            h(DropdownContent, null, () =>
              (["sub-default", "sub-explicit"] as const).map((id) =>
                h(DropdownSub, null, () => [
                  h(DropdownSubTrigger, null, () => "More"),
                  h(
                    DropdownSubContent,
                    id === "sub-explicit" ? { id, side: "left" } : { id },
                    () => "Child",
                  ),
                ]),
              ),
            ),
          ]),
      }),
    );
    const tag = (id: string) => html.match(new RegExp(`<div[^>]*id="${id}"[^>]*>`))?.[0] ?? "";

    // Older Runtime copies ignore the intent, so the first markup keeps the base right side.
    expect(tag("sub-default")).toContain('data-side="right"');
    expect(tag("sub-default")).toMatch(/ data-sw-menu-side-intent(="")?[ >]/);
    expect(tag("sub-explicit")).toContain('data-side="left"');
    expect(tag("sub-explicit")).toContain('data-sw-menu-side-intent="left"');
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
