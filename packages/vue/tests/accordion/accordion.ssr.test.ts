import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
} from "@starwind-ui/vue/accordion";
import {
  Accordion as StyledAccordion,
  AccordionContent as StyledAccordionContent,
  AccordionItem as StyledAccordionItem,
  AccordionTrigger as StyledAccordionTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/accordion";

describe("Vue Accordion SSR", () => {
  it("server-renders deterministic repeated disclosure markup without browser globals", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              AccordionRoot,
              { class: "consumer-root", defaultValue: "alpha", id: "accordion" },
              {
                default: () => [
                  h(AccordionItem, { disabled: true, value: "alpha" }, () => [
                    h(AccordionHeader, null, () =>
                      h(AccordionTrigger, { class: "consumer-trigger" }, () => "Alpha"),
                    ),
                    h(AccordionPanel, { class: "consumer-panel" }, () => "Alpha content"),
                  ]),
                ],
              },
            ),
        }),
      );

    const html = await render();
    expect(await render()).toBe(html);
    expect(html).toContain("data-sw-accordion");
    expect(html).toContain('data-default-value="alpha"');
    expect(html).toContain("data-sw-accordion-item");
    expect(html).toMatch(/data-disabled(?:="")?/);
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toMatch(/data-sw-accordion-content[^>]*hidden/);
  });

  it("server-renders Styled composition, slots, classes, and data-slot values", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(StyledAccordion, { class: "styled-root", defaultValue: "alpha" }, () => [
            h(StyledAccordionItem, { class: "styled-item", value: "alpha" }, () => [
              h(
                StyledAccordionTrigger,
                { class: "styled-trigger" },
                {
                  default: () => "Alpha",
                  icon: () => h("span", { "data-custom-icon": "" }, "+"),
                },
              ),
              h(StyledAccordionContent, { class: "styled-content" }, () => "Content"),
            ]),
          ]),
      }),
    );

    expect(html).toContain('data-slot="accordion"');
    expect(html).toContain('data-slot="accordion-item"');
    expect(html).toContain('data-slot="accordion-trigger"');
    expect(html).toContain('data-slot="accordion-content"');
    expect(html).toContain("styled-root");
    expect(html).toContain("styled-item");
    expect(html).toContain("styled-trigger");
    expect(html).toContain("styled-content");
    expect(html).toContain("data-custom-icon");
  });
});
