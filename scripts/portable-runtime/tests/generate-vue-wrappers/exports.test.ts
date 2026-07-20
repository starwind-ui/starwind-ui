import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { generateVuePrimitiveWrappers } from "../../generate-vue-wrappers.js";

const PRIMITIVE_EXPORTS = {
  avatar: {
    namespace: "Avatar",
    parts: ["AvatarFallback", "AvatarImage", "AvatarRoot"],
  },
  button: { namespace: "Button", parts: ["ButtonRoot"] },
  checkbox: {
    namespace: "Checkbox",
    parts: ["CheckboxIndicator", "CheckboxRoot"],
  },
  progress: {
    namespace: "Progress",
    parts: ["ProgressIndicator", "ProgressLabel", "ProgressRoot", "ProgressTrack", "ProgressValue"],
  },
  "scroll-area": {
    namespace: "ScrollArea",
    parts: [
      "ScrollAreaContent",
      "ScrollAreaCorner",
      "ScrollAreaRoot",
      "ScrollAreaScrollbar",
      "ScrollAreaThumb",
      "ScrollAreaViewport",
    ],
  },
  select: {
    namespace: "Select",
    parts: [
      "SelectGroup",
      "SelectGroupLabel",
      "SelectIcon",
      "SelectItem",
      "SelectItemIndicator",
      "SelectItemText",
      "SelectLabel",
      "SelectList",
      "SelectPopup",
      "SelectPortal",
      "SelectPositioner",
      "SelectRoot",
      "SelectScrollDownArrow",
      "SelectScrollUpArrow",
      "SelectSeparator",
      "SelectTrigger",
      "SelectValue",
    ],
  },
} as const;

describe("generated Vue Primitive export anatomy", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("exports every part, a named namespace, and that namespace as default", async () => {
    const outputRoot = await generatePackage();

    for (const [subpath, expected] of Object.entries(PRIMITIVE_EXPORTS)) {
      const source = await readFile(path.join(outputRoot, subpath, "index.ts"), "utf8");

      for (const part of expected.parts) {
        expect(source, `${subpath} named export ${part}`).toContain(
          `export { default as ${part} } from "./${part}.vue";`,
        );
        expect(source, `${subpath} namespace member ${part}`).toContain(
          `${part.slice(expected.namespace.length)}: ${part}`,
        );
      }
      expect(source, `${subpath} named namespace`).toContain(`export { ${expected.namespace} };`);
      expect(source, `${subpath} default namespace`).toContain(
        `export default ${expected.namespace};`,
      );
    }
  });

  it("keeps package-root star exports unambiguous", async () => {
    const outputRoot = await generatePackage();
    const source = await readFile(path.join(outputRoot, "index.ts"), "utf8");

    for (const [subpath, expected] of Object.entries(PRIMITIVE_EXPORTS)) {
      expect(source).toContain(`export * from "./${subpath}";`);
      expect(source.match(new RegExp(`\\b${expected.namespace}\\b`, "g"))).toBeNull();
    }
  });

  async function generatePackage(): Promise<string> {
    const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-exports-"));
    temporaryRoots.push(root);
    await generateVuePrimitiveWrappers({ outputDir: "generated", repoRoot: root });
    return path.join(root, "generated");
  }
});
