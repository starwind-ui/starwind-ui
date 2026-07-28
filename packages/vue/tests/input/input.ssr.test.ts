import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { InputRoot } from "@starwind-ui/vue/input";
import { Input as StyledInput } from "../../../../apps/vue-demo/src/components/starwind-runtime/input";

describe("Vue Input SSR", () => {
  it("renders deterministic native form markup without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h("form", null, [
              h(InputRoot, {
                "aria-label": "Email",
                class: "email",
                defaultValue: "reader@example.com",
                name: "email",
                required: true,
              }),
              h(StyledInput, {
                "data-testid": "styled-input",
                defaultValue: "Styled",
                size: "lg",
              }),
            ]),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-input");
    expect(first).toContain('data-sw-part="root"');
    expect(first).toContain('name="email"');
    expect(first).toContain("required");
    expect(first).toContain('value="reader@example.com"');
    expect(first).toContain('data-slot="input"');
    expect(first).toContain("h-12");
  });
});
