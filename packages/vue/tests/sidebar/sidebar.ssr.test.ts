import * as SidebarExports from "@starwind-ui/vue/sidebar";
import {
  SidebarComponent,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebarContext,
} from "@starwind-ui/vue/sidebar";
import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

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

  it("renders parts outside a Provider as expanded, as React does", async () => {
    const contexts: unknown[] = [];
    const Probe = {
      setup() {
        contexts.push(useSidebarContext());
        return () => null;
      },
    };
    const html = await renderToString(
      createSSRApp({
        render: () => [
          h(Probe),
          h(SidebarComponent, { collapsible: "icon" }, () => "Sidebar"),
          h(SidebarTrigger, null, () => "Toggle"),
          h(SidebarRail),
          h(SidebarMenuButton, null, () => "Menu"),
        ],
      }),
    );

    expect(contexts).toEqual([null]);
    expect(html).toMatch(
      /<div[^>]*data-sw-sidebar[\s>][^>]*data-state="expanded"[^>]*data-collapsible(?:="")?[\s>]/,
    );
    expect(html).toMatch(
      /<button[^>]*data-sw-sidebar-trigger[\s>][^>]*data-state="expanded"[^>]*aria-expanded="false"/,
    );
    expect(html).toMatch(
      /<button[^>]*data-sw-sidebar-rail[\s>][^>]*data-state="expanded"[^>]*aria-expanded="false"/,
    );
    expect(html).toMatch(
      /<button[^>]*data-sw-sidebar-menu-button[\s>][^>]*data-sidebar-state="expanded"/,
    );
    expect(Object.keys(SidebarExports)).not.toContain("useSidebarState");
  });
});
