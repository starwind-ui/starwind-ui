import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  FieldControl,
  FieldDescription,
  FieldError,
  FieldItem,
  FieldLabel,
  FieldRoot,
  FieldValidity,
} from "@starwind-ui/vue/field";
import {
  Field as StyledField,
  FieldControl as StyledFieldControl,
  FieldDescription as StyledFieldDescription,
  FieldError as StyledFieldError,
  FieldLabel as StyledFieldLabel,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/field";

describe("Vue Field SSR", () => {
  it("server-renders deterministic semantic, state, timing, and message projection", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              FieldRoot,
              {
                class: "consumer-field",
                dirty: true,
                disabled: true,
                errorVisibility: "blur",
                id: "profile-field",
                invalid: true,
                name: "profile",
                revalidationTiming: "change",
                touched: true,
                validationTiming: "submit",
              },
              () => [
                h(FieldLabel, null, () => "Profile"),
                h(FieldControl, { defaultValue: "Ada", required: true }),
                h(FieldDescription, null, () => "Public name"),
                h(FieldItem, null, () => "Input row"),
                h(
                  FieldError,
                  { match: "valueMissing", messageSource: "validation" },
                  () => "Required",
                ),
                h(FieldValidity, { match: "valid" }, () => "Ready"),
              ],
            ),
        }),
      );

    const html = await render();
    expect(await render()).toBe(html);
    expect(html).toContain("data-sw-field");
    expect(html).toContain("data-sw-field-control");
    expect(html).toContain("data-sw-input");
    expect(html).toContain("data-sw-field-label");
    expect(html).toContain("data-sw-field-description");
    expect(html).toContain("data-sw-field-item");
    expect(html).toContain("data-sw-field-error");
    expect(html).toContain("data-sw-field-validity");
    expect(html).toContain('data-error-visibility="blur"');
    expect(html).toContain('data-validation-timing="submit"');
    expect(html).toContain('data-message-source="validation"');
    expect(html).toContain('data-match="valueMissing"');
  });

  it("server-renders Styled Field composition, variants, and canonical slots", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(StyledField, { class: "styled-field", name: "email" }, () => [
            h(StyledFieldLabel, { class: "styled-label" }, () => "Email"),
            h(StyledFieldControl, {
              class: "styled-control",
              defaultValue: "reader@example.com",
            }),
            h(StyledFieldDescription, { class: "styled-description" }, () => "Used for receipts"),
            h(StyledFieldError, { class: "styled-error" }, () => "Invalid email"),
          ]),
      }),
    );

    expect(html).toContain('data-slot="field"');
    expect(html).toContain('data-slot="field-label"');
    expect(html).toContain('data-slot="field-control"');
    expect(html).toContain('data-slot="field-description"');
    expect(html).toContain('data-slot="field-error"');
    expect(html).toContain("styled-field");
    expect(html).toContain("styled-label");
    expect(html).toContain("styled-control");
    expect(html).toContain("styled-description");
    expect(html).toContain("styled-error");
  });
});
