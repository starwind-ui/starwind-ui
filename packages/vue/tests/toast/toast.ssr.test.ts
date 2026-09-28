import * as ToastPackage from "@starwind-ui/vue/toast";
import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

import Toaster from "../../../../apps/vue-demo/src/components/starwind-runtime/toast/Toaster.vue";

import { toastProvider } from "./tree.js";

describe("Vue Toast SSR", () => {
  it.each([
    { props: { gap: "2rem", peek: "3rem" }, gap: "2rem", peek: "3rem" },
    { props: {}, gap: "0.5rem", peek: "1rem" },
  ])("renders Styled Toaster spacing $gap / $peek", async ({ props, gap, peek }) => {
    const html = await renderToString(createSSRApp({ render: () => h(Toaster, props) }));
    expect(html).toContain(`--gap:${gap}`);
    expect(html).toContain(`--peek:${peek}`);
    expect(html).toContain('data-slot="toast-viewport"');
  });

  it("renders deterministic viewport semantics and every template without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () => renderToString(createSSRApp({ render: () => toastProvider() }));
    const first = await render();

    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-toast-viewport");
    expect(first).toContain('role="region"');
    expect(first).toContain('aria-live="polite"');
    expect(first).toContain('data-position="bottom-right"');
    expect(first).toContain('data-limit="3"');
    expect(first).toContain('data-duration="5000"');
    expect(first.match(/data-sw-toast-template-source/g)).toHaveLength(6);
    expect(first).toContain('data-variant="success"');
  });

  it("exports every part, namespace, service, and public Runtime type surface", () => {
    expect(Object.keys(ToastPackage).sort()).toEqual(
      [
        "Toast",
        "ToastAction",
        "ToastClose",
        "ToastContent",
        "ToastDescription",
        "ToastRoot",
        "ToastTemplate",
        "ToastTitle",
        "ToastTitleText",
        "ToastViewport",
        "default",
        "toast",
      ].sort(),
    );
  });
});
