import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  CollapsiblePanel,
  CollapsibleRoot,
  CollapsibleTrigger,
} from "@starwind-ui/vue/collapsible";
import {
  Collapsible as StyledCollapsible,
  CollapsibleContent as StyledCollapsibleContent,
  CollapsibleTrigger as StyledCollapsibleTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/collapsible";

describe("Vue Collapsible SSR", () => {
  it("server-renders deterministic closed and open Primitive trees", async () => {
    const render = (defaultOpen: boolean) =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              CollapsibleRoot,
              {
                class: "consumer-root",
                defaultOpen,
                id: defaultOpen ? "open" : "closed",
              },
              {
                default: () => [
                  h(
                    CollapsibleTrigger,
                    { class: "consumer-trigger" },
                    { default: () => "Details" },
                  ),
                  h(
                    CollapsiblePanel,
                    { class: "consumer-panel", hiddenUntilFound: !defaultOpen },
                    { default: () => "Content" },
                  ),
                ],
              },
            ),
        }),
      );

    const closed = await render(false);
    expect(await render(false)).toBe(closed);
    expect(closed).toContain(
      'class="consumer-root" id="closed" data-sw-collapsible data-sw-part="root"',
    );
    expect(closed).toContain('data-state="closed"');
    expect(closed).toContain("data-sw-collapsible-trigger");
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("data-hidden-until-found");
    expect(closed).toMatch(/hidden(?:="until-found")?/);

    const open = await render(true);
    expect(open).toContain('data-default-open="true"');
    expect(open).toContain('data-state="open"');
  });

  it("server-renders the strict native asChild trigger as one semantic element", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(CollapsibleRoot, null, {
            default: () => [
              h(
                CollapsibleTrigger,
                { asChild: true, class: "outer" },
                {
                  default: () => h("button", { class: "child", "data-testid": "child" }, "Details"),
                },
              ),
              h(CollapsiblePanel),
            ],
          }),
      }),
    );

    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('data-testid="child"');
    expect(html).toContain("data-sw-collapsible-trigger");
    expect(html).toContain("data-as-child");
    expect(html).toContain('class="child outer"');
    expect(html).toContain('type="button"');
  });

  it("server-renders Styled output with its established public slots", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            StyledCollapsible,
            { class: "styled-root", defaultOpen: true },
            {
              default: () => [
                h(
                  StyledCollapsibleTrigger,
                  { class: "styled-trigger" },
                  { default: () => "Styled details" },
                ),
                h(
                  StyledCollapsibleContent,
                  { class: "styled-content" },
                  { default: () => "Styled content" },
                ),
              ],
            },
          ),
      }),
    );

    expect(html).toContain('data-slot="collapsible"');
    expect(html).toContain('data-slot="collapsible-trigger"');
    expect(html).toContain('data-slot="collapsible-content"');
    expect(html).toContain("styled-root");
    expect(html).toContain("styled-trigger");
    expect(html).toContain("styled-content");
  });
});
