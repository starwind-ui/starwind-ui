import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPopup,
  NavigationMenuPortal,
  NavigationMenuPositioner,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@starwind-ui/vue/navigation-menu";

describe("Vue Navigation Menu SSR", () => {
  it("renders its public Portal wrapper inline without browser work", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              NavigationMenuRoot,
              { defaultValue: "products" },
              {
                default: () => [
                  h(NavigationMenuList, null, {
                    default: () =>
                      h(
                        NavigationMenuItem,
                        { value: "products" },
                        {
                          default: () => [
                            h(NavigationMenuTrigger, null, { default: () => "Products" }),
                            h(NavigationMenuContent, null, {
                              default: () =>
                                h(
                                  NavigationMenuLink,
                                  { href: "/products" },
                                  {
                                    default: () => "Products link",
                                  },
                                ),
                            }),
                          ],
                        },
                      ),
                  }),
                  h(
                    NavigationMenuPortal,
                    { container: "#overlays" },
                    {
                      default: () =>
                        h(NavigationMenuPositioner, null, {
                          default: () =>
                            h(NavigationMenuPopup, null, {
                              default: () => h(NavigationMenuViewport),
                            }),
                        }),
                    },
                  ),
                ],
              },
            ),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-nav-menu-portal");
    expect(first).toContain("data-sw-nav-menu-positioner");
    expect(first).toContain("data-sw-nav-menu-popup");
    expect(first).toContain("teleport start");
    expect(first).toContain("teleport end");
  });
});
