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
});
