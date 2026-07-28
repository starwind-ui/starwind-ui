import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTab } from "@starwind-ui/vue/tabs";
import {
  Tabs as StyledTabs,
  TabsContent as StyledTabsContent,
  TabsList as StyledTabsList,
  TabsTrigger as StyledTabsTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/tabs";

describe("Vue Tabs SSR", () => {
  it("server-renders deterministic linked-part markup without browser globals", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              TabsRoot,
              {
                class: "consumer-root",
                defaultValue: "account",
                id: "tabs",
                orientation: "vertical",
                syncKey: "settings",
              },
              () => [
                h(TabsList, { activateOnFocus: true, loopFocus: false }, () => [
                  h(TabsTab, { value: "account" }, () => "Account"),
                  h(TabsTab, { disabled: true, value: "password" }, () => "Password"),
                  h(TabsIndicator),
                ]),
                h(TabsPanel, { value: "account" }, () => "Account panel"),
                h(TabsPanel, { keepMounted: true, value: "password" }, () => "Password panel"),
              ],
            ),
        }),
      );

    const html = await render();
    expect(await render()).toBe(html);
    expect(html).toContain("data-sw-tabs");
    expect(html).toContain('data-default-value="account"');
    expect(html).toContain('data-orientation="vertical"');
    expect(html).toContain('data-sync-key="settings"');
    expect(html).toContain("data-sw-tabs-list");
    expect(html).toContain("data-sw-tabs-tab");
    expect(html).toContain("data-sw-tabs-panel");
    expect(html).toContain("data-sw-tabs-indicator");
    expect(html).toMatch(/data-disabled(?:="")?/);
    expect(html).toMatch(/data-keep-mounted(?:="")?/);
  });

  it("server-renders Styled composition, classes, and data-slot values", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(StyledTabs, { class: "styled-root", defaultValue: "account" }, () => [
            h(StyledTabsList, { class: "styled-list" }, () => [
              h(StyledTabsTrigger, { class: "styled-trigger", value: "account" }, () => "Account"),
            ]),
            h(
              StyledTabsContent,
              { class: "styled-content", value: "account" },
              () => "Account content",
            ),
          ]),
      }),
    );

    expect(html).toContain('data-slot="tabs"');
    expect(html).toContain('data-slot="tabs-list"');
    expect(html).toContain('data-slot="tabs-trigger"');
    expect(html).toContain('data-slot="tabs-content"');
    expect(html).toContain("styled-root");
    expect(html).toContain("styled-list");
    expect(html).toContain("styled-trigger");
    expect(html).toContain("styled-content");
  });
});
