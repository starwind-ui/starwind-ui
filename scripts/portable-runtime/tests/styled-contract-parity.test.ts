import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { colorPickerStyledContract } from "../contracts/styled/components/color-picker.js";
import { scrollAreaStyledContract } from "../contracts/styled/components/scroll-area.js";
import { starwindStyledContracts } from "../contracts/styled/starwind.js";
import { projectSvelteStyledGroup } from "../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../renderers/framework-adapters/svelte/styled/render.js";
import { assertStyledContractFiles } from "../renderers/styled-output-model/contract-guard.js";
import { projectStyledOutputComponentGroup } from "../renderers/styled-output-model/index.js";

const options = { primitiveImportBase: "@starwind-ui/svelte" };
describe("Styled contract parity", () => {
  it("owns ScrollArea manual viewport composition in the shared contract", () => {
    const root = projectStyledOutputComponentGroup(scrollAreaStyledContract).components.find(
      (c) => c.exportName === "ScrollArea",
    )!;
    expect(root.props?.fields).toContainEqual(
      expect.objectContaining({ name: "autoViewport", type: "boolean" }),
    );
    expect(root.destructure?.props).toContainEqual(
      expect.objectContaining({ name: "autoViewport", defaultValue: "true" }),
    );
  });
  it("preserves ColorPicker's contracted Styled Popover composition", () => {
    const files = renderSvelteStyledFiles(
      projectSvelteStyledGroup(
        projectStyledOutputComponentGroup(colorPickerStyledContract),
        options,
      ),
    );
    const content = files.find(
      (f) => f.relativePath === "color-picker/ColorPickerContent.svelte",
    )!.content;
    expect(content).toContain("<PopoverContent");
    expect(content).not.toContain("<PopoverPortal");
    expect(content).not.toContain("MutationObserver");
  });
});

describe("emitted Styled contract guard", () => {
  const files = () =>
    renderSvelteStyledFiles(
      projectSvelteStyledGroup(
        projectStyledOutputComponentGroup(scrollAreaStyledContract),
        options,
      ),
    );
  it("rejects an undeclared public prop in emitted code", () => {
    const output = files();
    output[0]!.content = output[0]!.content.replace(
      "autoViewport?: boolean",
      "autoViewport?: boolean; uncontracted?: boolean",
    );
    expect(() => assertStyledContractFiles(starwindStyledContracts, output, "svelte")).toThrow(
      /uncontracted.*absent from the shared contract/,
    );
  });
  it("rejects a public prop hidden in a local type alias", () => {
    const output = files();
    output[0]!.content = output[0]!.content.replace(
      "autoViewport?: boolean",
      "autoViewport?: boolean; uncontracted?: boolean",
    );
    output[0]!.content = output[0]!.content
      .replace("export type ScrollAreaProps =", "type HiddenProps =")
      .replace("</script>", "export type ScrollAreaProps = HiddenProps;\n</script>");
    expect(() => assertStyledContractFiles(starwindStyledContracts, output, "svelte")).toThrow(
      /uncontracted.*absent/,
    );
  });
  it("rejects a Primitive imported under a Styled component name", () => {
    expect(() =>
      assertStyledContractFiles(
        starwindStyledContracts,
        [
          {
            relativePath: "color-picker/ColorPickerContent.tsx",
            content:
              'import { PopoverPopup as PopoverContent } from "@starwind-ui/react/popover"; export const Content = () => <PopoverContent />;',
          },
        ],
        "react",
      ),
    ).toThrow(/must import its contracted Styled component/);
  });
  it("rejects a target that forbids a shared prop", () => {
    const output = files();
    output[0]!.content = output[0]!.content.replace(
      "autoViewport?: boolean",
      "autoViewport?: never",
    );
    expect(() => assertStyledContractFiles(starwindStyledContracts, output, "svelte")).toThrow(
      /autoViewport.*forbidden/,
    );
  });
  it.each([
    ["astro", "apps/demo/src/components/starwind-runtime", "astro"],
    ["react", "apps/react-demo/src/components/starwind-runtime", "tsx"],
    ["vue", "apps/vue-demo/src/components/starwind-runtime", "vue"],
    ["svelte", "apps/svelte-demo/src/lib/starwind-runtime", "svelte"],
  ])("rejects a changed default in emitted %s code", (target, root, extension) => {
    const relativePath = `scroll-area/ScrollArea.${extension}`;
    const content = readFileSync(
      new URL(`../../../${root}/${relativePath}`, import.meta.url),
      "utf8",
    );
    expect(content).toContain("autoViewport = true");
    expect(() =>
      assertStyledContractFiles(starwindStyledContracts, [{ relativePath, content }], target),
    ).not.toThrow();
    expect(() =>
      assertStyledContractFiles(
        starwindStyledContracts,
        [{ relativePath, content: content.replace("autoViewport = true", "autoViewport = false") }],
        target,
      ),
    ).toThrow(/default for "autoViewport"/);
  });
  it.each(["react", "astro", "vue", "svelte"])(
    "rejects a removed Styled component boundary for %s",
    (target) => {
      const extension = target === "react" ? "tsx" : target;
      expect(() =>
        assertStyledContractFiles(
          starwindStyledContracts,
          [
            {
              relativePath: `color-picker/ColorPickerContent.${extension}`,
              content: "<PopoverPortal><PopoverPopup /></PopoverPortal>",
            },
          ],
          target,
        ),
      ).toThrow(/missing contracted Styled composition "PopoverContent"/);
    },
  );
});
