import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import FormReview from "../../../../apps/vue-demo/src/components/FormReview.vue";

describe("Vue Form review demo", () => {
  it("server-renders the Primitive review with real Input controls", async () => {
    const output = await renderToString(createSSRApp({ render: () => h(FormReview) }));

    expect(output).toContain('data-testid="form-review"');
    expect(output).toContain('data-testid="primitive-form"');
    expect(output).toContain("data-sw-form-error-summary");
    expect(output).toContain("data-sw-fieldset");
    expect(output).toContain("data-sw-field-control");
    expect(output).toContain('name="email"');
  });
});
