import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import Avatar from "../../../../apps/vue-demo/src/components/starwind-runtime/avatar/Avatar.vue";
import AvatarFallback from "../../../../apps/vue-demo/src/components/starwind-runtime/avatar/AvatarFallback.vue";
import AvatarImage from "../../../../apps/vue-demo/src/components/starwind-runtime/avatar/AvatarImage.vue";

describe("generated Vue Styled Avatar SSR", () => {
  it("renders deterministic Primitive-backed parts, variants, attrs, and slots", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            Avatar,
            { class: "consumer-avatar", "data-review": "avatar", size: "lg", variant: "success" },
            {
              default: () => [
                h(AvatarImage, { alt: "Ada Lovelace", src: "/ada.png" }),
                h(AvatarFallback, { delay: 120 }, { default: () => "AL" }),
              ],
            },
          ),
      }),
    );

    expect(html).toContain('data-slot="avatar"');
    expect(html).toContain('data-slot="avatar-image"');
    expect(html).toContain('data-slot="avatar-fallback"');
    expect(html).toContain('alt="Ada Lovelace"');
    expect(html).toContain('src="/ada.png"');
    expect(html).toContain('data-delay="120"');
    expect(html).toContain("consumer-avatar");
    expect(html).toContain("border-success");
    expect(html).toContain("h-12");
    expect(html).toContain("AL");
  });
});
