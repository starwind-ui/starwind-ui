import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { avatarStyledContract } from "../../contracts/styled/components/avatar.js";
import { generateStarwindVueWrappers } from "../../generate-vue-wrappers.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";

describe("generated Vue Styled Avatar", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
  });

  it("projects all semantic Primitive parts with attrs, listeners, slots, and exposed elements", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-avatar-"));
    roots.push(root);
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: root });

    const sources = Object.fromEntries(
      await Promise.all(
        ["Avatar.vue", "AvatarImage.vue", "AvatarFallback.vue"].map(
          async (file): Promise<[string, string]> => [
            file,
            await readFile(path.join(root, "styled/avatar", file), "utf8"),
          ],
        ),
      ),
    );
    const variants = await readFile(path.join(root, "styled/avatar/variants.ts"), "utf8");
    for (const [file, source] of Object.entries(sources)) {
      expect(() => assertVueSfcCompiles(source, file)).not.toThrow();
      expect(source).toContain("defineExpose({ element });");
      expect(source).toContain('v-bind="attrs"');
      expect(source).not.toContain("createAvatar");
    }

    expect(sources["Avatar.vue"]).toContain("<AvatarPrimitive.AvatarRoot");
    expect(sources["Avatar.vue"]).toContain('data-slot="avatar"');
    expect(sources["AvatarImage.vue"]).toContain("<AvatarPrimitive.AvatarImage");
    expect(sources["AvatarImage.vue"]).toContain(':alt="alt"');
    expect(sources["AvatarImage.vue"]).toContain(
      '@loading-status-change="handleLoadingStatusChange"',
    );
    expect(sources["AvatarImage.vue"]).toContain('data-slot="avatar-image"');
    expect(sources["AvatarFallback.vue"]).toContain("<AvatarPrimitive.AvatarFallback");
    expect(sources["AvatarFallback.vue"]).toContain("<slot />");
    expect(sources["AvatarFallback.vue"]).toContain('data-slot="avatar-fallback"');
    expect(avatarStyledContract.variants?.avatar?.base).toBe(
      "text-foreground bg-muted relative inline-flex overflow-hidden rounded-full border-2",
    );
    expect(variants).toContain(
      'base: "text-foreground bg-muted relative inline-flex overflow-hidden rounded-full border-2"',
    );
    expect(variants).toContain('sm: "h-8 w-8 text-xs"');
    expect(variants).toContain('md: "h-10 w-10 text-sm"');
    expect(variants).toContain('lg: "h-12 w-12 text-base"');
  });
});
