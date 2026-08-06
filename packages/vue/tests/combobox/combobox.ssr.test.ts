import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxItemText,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxRoot,
  ComboboxValue,
} from "@starwind-ui/vue/combobox";

describe("Vue Combobox SSR", () => {
  it("renders deterministic local portal, form, collection and presence markup", async () => {
    expect(globalThis).not.toHaveProperty("document");
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              ComboboxRoot,
              { defaultValue: "banana", name: "fruit" },
              {
                default: () => [
                  h(ComboboxInputGroup, null, { default: () => h(ComboboxInput) }),
                  h(ComboboxValue, { placeholder: "Pick fruit" }),
                  h(
                    ComboboxValue,
                    { placeholder: "Unused fallback" },
                    { default: () => "Custom value" },
                  ),
                  h(
                    ComboboxPortal,
                    { container: "#overlays" },
                    {
                      default: () =>
                        h(ComboboxPositioner, null, {
                          default: () =>
                            h(ComboboxPopup, null, {
                              default: () =>
                                h(ComboboxList, null, {
                                  default: () =>
                                    h(
                                      ComboboxItem,
                                      { value: "banana" },
                                      {
                                        default: () =>
                                          h(ComboboxItemText, null, { default: () => "Banana" }),
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
    expect(first).toContain("data-sw-combobox");
    expect(first).toContain("data-sw-combobox-hidden-input");
    expect(first).toContain("data-sw-combobox-input");
    expect(first).toMatch(
      /<span data-sw-combobox-value data-sw-part="value" data-placeholder="Pick fruit">[\s\S]*Pick fruit[\s\S]*<\/span>/,
    );
    expect(first).toMatch(
      /<span data-sw-part="value" data-placeholder="Unused fallback">[\s\S]*Custom value[\s\S]*<\/span>/,
    );
    expect(first).toContain("data-sw-combobox-portal");
    expect(first).toContain("data-sw-combobox-popup");
    expect(first).toContain(" hidden");
    expect(first).toContain('aria-selected="true"');
  });
});
