import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import { AvatarFallback, AvatarImage, AvatarRoot } from "@starwind-ui/vue/avatar";

describe("Vue Avatar SSR", () => {
  it("server-renders deterministic semantic markup without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              AvatarRoot,
              { class: "avatar", id: "server-avatar" },
              {
                default: () => [
                  h(AvatarImage, { alt: "Profile", src: "/avatar.png" }),
                  h(AvatarFallback, { delay: 100 }, { default: () => "AB" }),
                ],
              },
            ),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain('<span class="avatar" id="server-avatar" data-sw-avatar');
    expect(first).toContain('data-image-loading-status="idle"');
    expect(first).toContain('<img alt="Profile" src="/avatar.png" data-sw-avatar-image');
    expect(first).toMatch(/<img[^>]+hidden/);
    expect(first).toMatch(/<span[^>]+data-sw-avatar-fallback[^>]+data-delay="100"[^>]+hidden/);
    expect(first).toMatch(/data-sw-avatar-fallback[\s\S]*AB[\s\S]*<\/span>/);
  });

  it("projects consumer hidden attrs with Vue Boolean-attribute inclusion semantics", async () => {
    const renderFallback = (hidden: unknown) =>
      renderToString(
        createSSRApp({
          render: () => h(AvatarFallback, { hidden }, { default: () => "AB" }),
        }),
      );

    expect(await renderFallback("hidden")).toMatch(/\shidden(?:>| )/);
    expect(await renderFallback(false)).not.toMatch(/\shidden(?:>| )/);
    expect(await renderFallback(null)).not.toMatch(/\shidden(?:>| )/);
  });
});
