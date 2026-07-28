import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { FormErrorSummary, FormRoot } from "@starwind-ui/vue/form";
import { InputRoot } from "@starwind-ui/vue/input";
import {
  Form as StyledForm,
  FormErrorSummary as StyledFormErrorSummary,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/form";

describe("Vue Form SSR", () => {
  it("renders deterministic native timing, summary, Input, and Styled Form markup", async () => {
    expect(globalThis).not.toHaveProperty("window");
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h("main", null, [
              h(
                FormRoot,
                {
                  "data-validation-timing": "blur",
                  errorVisibility: "submit",
                  validationTiming: "change",
                },
                {
                  default: () => [
                    h(FormErrorSummary, {
                      "aria-live": "assertive",
                      hidden: false,
                      role: "alert",
                    }),
                    h(InputRoot, { name: "email", required: true }),
                  ],
                },
              ),
              h(
                StyledForm,
                { validationTiming: "submit" },
                { default: () => h(StyledFormErrorSummary) },
              ),
            ]),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-form");
    expect(first).toContain('data-validation-timing="blur"');
    expect(first).toContain('data-error-visibility="submit"');
    expect(first).toContain("data-sw-form-error-summary");
    expect(first).toContain('aria-live="polite"');
    expect(first).toContain('<div role="alert" aria-live="assertive"');
    expect(first).toContain('data-slot="form"');
    expect(first).toContain('data-slot="form-error-summary"');
    expect(first).toContain('name="email"');
  });
});
