import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  InputOtpGroup,
  InputOtpRoot,
  InputOtpSeparator,
  InputOtpSlot,
} from "@starwind-ui/vue/input-otp";
import {
  InputOtp as StyledInputOtp,
  InputOtpGroup as StyledInputOtpGroup,
  InputOtpSeparator as StyledInputOtpSeparator,
  InputOtpSlot as StyledInputOtpSlot,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/input-otp";

describe("Vue Input OTP SSR", () => {
  it("renders deterministic native input and indexed visual slots without browser globals", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(InputOtpRoot, { defaultValue: "12", name: "code" }, () =>
              h(InputOtpGroup, null, () => [
                ...Array.from({ length: 3 }, (_, index) => h(InputOtpSlot, { index, key: index })),
                h(InputOtpSeparator),
                ...Array.from({ length: 3 }, (_, offset) =>
                  h(InputOtpSlot, { index: offset + 3, key: offset + 3 }),
                ),
              ]),
            ),
        }),
      );

    const html = await render();
    expect(await render()).toBe(html);
    expect(html.match(/data-sw-input-otp-input/g)).toHaveLength(1);
    expect(html.match(/data-sw-input-otp-slot/g)).toHaveLength(6);
    expect(html).toContain('autocomplete="one-time-code"');
    expect(html).toContain('name="code"');
  });

  it("renders Styled composition, variants, caret pipeline, and data-slot values", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(StyledInputOtp, { defaultValue: "123456" }, () =>
            h(StyledInputOtpGroup, null, () => [
              ...Array.from({ length: 3 }, (_, index) =>
                h(StyledInputOtpSlot, { index, key: index, size: "sm" }),
              ),
              h(StyledInputOtpSeparator),
              ...Array.from({ length: 3 }, (_, offset) =>
                h(StyledInputOtpSlot, { index: offset + 3, key: offset + 3, size: "sm" }),
              ),
            ]),
          ),
      }),
    );

    expect(html).toContain('data-slot="input-otp"');
    expect(html).toContain('data-slot="input-otp-group"');
    expect(html).toContain('data-slot="input-otp-slot"');
    expect(html).toContain('data-slot="input-otp-separator"');
    expect(html).toContain("animate-caret-blink");
  });
});
