import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@starwind-ui/vue/select";
import {
  Select as StyledSelect,
  SelectTrigger as StyledSelectTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/select";

describe("Vue Select SSR", () => {
  it("server-renders deterministic local portal, form, collection and presence markup", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              SelectRoot,
              {
                "aria-label": "Fruit",
                class: "fruit-select",
                defaultValue: "banana",
                name: "fruit",
                required: true,
              },
              {
                default: () => [
                  h(SelectTrigger, null, {
                    default: () => h(SelectValue, { placeholder: "Pick" }),
                  }),
                  h(
                    SelectPortal,
                    { container: "#overlays" },
                    {
                      default: () =>
                        h(SelectPositioner, null, {
                          default: () =>
                            h(SelectPopup, null, {
                              default: () =>
                                h(SelectList, null, {
                                  default: () =>
                                    h(
                                      SelectItem,
                                      { value: "banana" },
                                      {
                                        default: () => [
                                          h(SelectItemText, null, { default: () => "Banana" }),
                                          h(SelectItemIndicator, null, {
                                            default: () => "Selected",
                                          }),
                                        ],
                                      },
                                    ),
                                }),
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
    expect(first).toContain("data-sw-select");
    expect(first).toContain('class="fruit-select"');
    expect(first).toContain('data-default-value="banana"');
    expect(first).toContain('name="fruit"');
    expect(first).toContain("data-sw-select-input");
    expect(first).toContain("data-sw-select-portal");
    expect(first).toContain("data-floating-root");
    expect(first).toContain("data-sw-select-popup");
    expect(first).toContain(" hidden");
    expect(first).toContain('aria-selected="true"');
    expect(first).toContain("data-sw-select-item-indicator");
    expect(first).toContain("teleport start");
    expect(first).toContain("teleport end");
  });

  it("server-renders direct Primitive and Styled composed triggers without wrappers", async () => {
    const primitive = await renderToString(
      createSSRApp({
        render: () =>
          h(SelectRoot, null, {
            default: () =>
              h(
                SelectTrigger,
                { asChild: true, class: "primitive-adapter" },
                {
                  default: () => h("a", { class: "primitive-child", href: "#fruit" }, "Choose"),
                },
              ),
          }),
      }),
    );
    const styled = await renderToString(
      createSSRApp({
        render: () =>
          h(StyledSelect, null, {
            default: () =>
              h(
                StyledSelectTrigger,
                { asChild: true, class: "styled-adapter" },
                {
                  default: () => h("a", { class: "styled-child", href: "#fruit" }, "Choose"),
                },
              ),
          }),
      }),
    );

    expect(primitive).toMatch(/<a[^>]*data-sw-select-trigger[^>]*>Choose<\/a>/);
    expect(primitive).toContain("primitive-adapter");
    expect(primitive).toContain("primitive-child");
    expect(styled).toMatch(/<a[^>]*data-slot="select-trigger"[^>]*>Choose<\/a>/);
    expect(styled).toContain("styled-adapter");
    expect(styled).toContain("styled-child");
  });
});
