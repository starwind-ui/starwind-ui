import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  SidebarComponent,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@starwind-ui/vue/sidebar";

describe("Vue Sidebar SSR", () => {
  it("renders deterministic anatomy without browser globals", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(SidebarProvider, { defaultOpen: false }, () => [
              h(SidebarComponent, { collapsible: "icon", side: "right" }, () => "Sidebar"),
              h(SidebarTrigger, null, () => "Toggle"),
              h(SidebarRail),
              h(SidebarMenuButton, null, () => "Menu"),
            ]),
        }),
      );

    const html = await render();
    expect(await render()).toBe(html);
    expect(html).toContain("data-sw-sidebar-provider");
    expect(html).toContain('data-state="collapsed"');
    expect(html).toContain('data-collapsible="icon"');
    expect(html).toContain("data-sw-sidebar-trigger");
    expect(html).toContain("data-sw-sidebar-rail");
    expect(html).toContain("data-sw-sidebar-menu-button");
  });
});
