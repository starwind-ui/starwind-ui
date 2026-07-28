import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import * as Drawer from "@starwind-ui/vue/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/sheet";

describe("Vue Drawer and Sheet SSR", () => {
  it("renders deterministic inline Drawer Portal anatomy for every side", async () => {
    for (const side of ["top", "right", "bottom", "left"] as const) {
      const render = () =>
        renderToString(
          createSSRApp({
            render: () =>
              h(Drawer.DrawerRoot, null, {
                default: () => [
                  h(Drawer.DrawerTrigger),
                  h(Drawer.DrawerPortal, null, {
                    default: () =>
                      h(Drawer.DrawerViewport, null, {
                        default: () => [
                          h(Drawer.DrawerBackdrop),
                          h(
                            Drawer.DrawerPopup,
                            { side },
                            {
                              default: () =>
                                h(Drawer.DrawerTitle, null, { default: () => "Drawer" }),
                            },
                          ),
                        ],
                      }),
                  }),
                ],
              }),
          }),
        );
      const first = await render();
      expect(await render()).toBe(first);
      expect(first).toContain("data-sw-drawer-portal");
      expect(first).toContain("data-sw-drawer-viewport");
      expect(first).toContain(`data-side="${side}"`);
    }
  });

  it("renders Styled Sheet on Drawer primitives", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(Sheet, null, {
            default: () => [
              h(SheetTrigger, null, { default: () => "Open" }),
              h(
                SheetContent,
                { side: "left" },
                {
                  default: () => [
                    h(SheetTitle, null, { default: () => "Sheet" }),
                    h(SheetDescription, null, { default: () => "Details" }),
                  ],
                },
              ),
            ],
          }),
      }),
    );
    expect(html).toContain('data-slot="sheet"');
    expect(html).toContain('data-slot="sheet-content"');
    expect(html).toContain('data-side="left"');
  });
});
