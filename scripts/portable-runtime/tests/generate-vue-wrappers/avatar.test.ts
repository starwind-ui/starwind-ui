import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { avatarRuntimeAdapterContract } from "../../contracts/primitive/components/avatar.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Avatar Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects Avatar through the media-status family", () => {
    const plan = buildGenericAdapterPlan(avatarRuntimeAdapterContract);
    const outputModel = buildGenericAdapterOutputModel(plan);

    expect(outputModel.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({ kind: "media-status", part: "root" }),
          }),
        }),
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({ kind: "media-status", part: "image" }),
          }),
        }),
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({ kind: "media-status", part: "fallback" }),
          }),
        }),
      ]),
    );
  });

  it("generates deterministic compiler-valid semantic parts from media-status facts", async () => {
    const first = await generateAvatar();
    const second = await generateAvatar();

    expect(first).toEqual(second);
    for (const [name, source] of Object.entries(first.sources)) {
      expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }

    expect(first.sources["AvatarRoot.vue"]).toContain(
      "const rootRef = ref<HTMLSpanElement | null>(null)",
    );
    expect(first.sources["AvatarRoot.vue"]).toContain(
      'import { createAvatar } from "@starwind-ui/runtime/avatar";',
    );
    expect(first.sources["AvatarRoot.vue"]).toContain("onMounted(setupRuntime);");
    expect(first.sources["AvatarRoot.vue"]).toContain("onBeforeUnmount(destroyOwnedInstance);");
    expect(first.sources["AvatarRoot.vue"]).toContain("data-sw-avatar");
    expect(first.sources["AvatarRoot.vue"]).toContain('data-image-loading-status="idle"');

    expect(first.sources["AvatarImage.vue"]).toContain("alt: string;");
    expect(first.sources["AvatarImage.vue"]).toContain("src?: string;");
    expect(first.sources["AvatarImage.vue"]).not.toContain("image?:");
    expect(first.sources["AvatarImage.vue"]).toContain("loadingStatusChange:");
    expect(first.sources["AvatarImage.vue"]).toContain(
      'root.addEventListener("starwind:loading-status-change"',
    );
    expect(first.sources["AvatarImage.vue"]).toContain('previousStatus: "idle"');
    expect(first.sources["AvatarImage.vue"]).toContain(':hidden="true"');

    expect(first.sources["AvatarFallback.vue"]).toContain("delay?: number;");
    expect(first.sources["AvatarFallback.vue"]).toContain(':data-delay="props.delay"');
    expect(first.sources["AvatarFallback.vue"]).toContain(
      `:hidden="props.delay !== undefined || includesBooleanAttribute(attrs.hidden)"`,
    );
    expect(first.sources["AvatarFallback.vue"]).toContain(
      `return value === "" || Boolean(value);`,
    );
    expect(first.index).toContain('export { default as AvatarRoot } from "./AvatarRoot.vue";');
    expect(first.index).toContain('export { default as AvatarImage } from "./AvatarImage.vue";');
    expect(first.index).toContain(
      'export { default as AvatarFallback } from "./AvatarFallback.vue";',
    );
  });

  async function generateAvatar(): Promise<{
    index: string;
    sources: Record<string, string>;
  }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-avatar-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "avatar");
    if (!entry) throw new Error("Avatar Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });

    const directory = path.join(outputRoot, "avatar");
    return {
      index: await readFile(path.join(directory, "index.ts"), "utf8"),
      sources: Object.fromEntries(
        await Promise.all(
          ["AvatarRoot.vue", "AvatarImage.vue", "AvatarFallback.vue"].map(async (name) => [
            name,
            await readFile(path.join(directory, name), "utf8"),
          ]),
        ),
      ),
    };
  }
});
