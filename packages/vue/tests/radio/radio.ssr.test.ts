import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { RadioRoot } from "@starwind-ui/vue/radio";

describe("Vue Radio SSR", () => {
  it("renders deterministic standalone state without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              RadioRoot,
              { defaultChecked: true, name: "choice", value: "alpha" },
              { default: () => "Alpha" },
            ),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-radio");
    expect(first).toContain('role="radio"');
    expect(first).toContain('aria-checked="true"');
    expect(first).toContain('type="radio"');
    expect(first).toContain('name="choice"');
  });
});
