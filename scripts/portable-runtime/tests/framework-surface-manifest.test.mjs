import { mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertFrameworkSurfaceManifest,
  buildFrameworkSurfaceManifest,
  classifyPublicExports,
  compareFrameworkSurfaceManifests,
  inspectGeneratedTargetSurface,
  serializeFrameworkSurfaceManifest,
} from "../framework-surface-manifest.mjs";
import { generateFrameworkPrimitiveWrappers } from "../renderers/framework-wrapper-generator.js";

const repoRoot = process.cwd();
const manifestPath = path.join(
  repoRoot,
  ".scratch/vue-adapter-optimization-and-portal-parity/framework-surface-manifest.json",
);

const expectedPortablePortalAnatomy = [
  ["alert-dialog", "AlertDialogPortal", "data-sw-alert-dialog-portal"],
  ["combobox", "ComboboxPortal", "data-sw-combobox-portal"],
  ["drawer", "DrawerPortal", "data-sw-drawer-portal"],
  ["menu", "MenuPortal", "data-sw-menu-portal"],
  ["navigation-menu", "NavigationMenuPortal", "data-sw-nav-menu-portal"],
  ["popover", "PopoverPortal", "data-sw-popover-portal"],
  ["preview-card", "PreviewCardPortal", "data-sw-preview-card-portal"],
  ["select", "SelectPortal", "data-sw-select-portal"],
  ["tooltip", "TooltipPortal", "data-sw-tooltip-portal"],
];

function expectedPortalAnatomy(target) {
  return expectedPortablePortalAnatomy.map(([family, component, runtimeHook]) => ({
    family,
    namespacePart: "Portal",
    renderedPath: `${family}/${component}`,
    defaultElement: "div",
    runtimeHooks: [runtimeHook, "data-sw-portal-placement"],
    placement: target === "astro" ? "runtime" : "framework",
    ...(target === "react"
      ? {
          nativeHelper: "internal/ReactPortal",
          placementWiring: {
            report: "reportPortalPlacement",
            resolve: "resolvePortalPlacement",
          },
        }
      : {}),
  }));
}

const expectedDirectStyledPortalOwners = [
  "combobox/ComboboxContent.component",
  "context-menu/ContextMenuContent.component",
  "context-menu/ContextMenuSubContent.component",
  "dropdown/DropdownContent.component",
  "dropdown/DropdownSubContent.component",
  "hover-card/HoverCardContent.component",
  "navigation-menu/NavigationMenuPositioner.component",
  "popover/PopoverContent.component",
  "select/SelectContent.component",
  "tooltip/TooltipContent.component",
];

const expectedComposedStyledPortalOwners = [
  "color-picker/ColorPicker.component",
  "color-picker/ColorPickerContent.component",
  "color-picker/ColorPickerDefaultEditor.component",
  "color-picker/ColorPickerInput.component",
  "navigation-menu/NavigationMenu.component",
];

const expectedRenderedStyledPortalSlots = {
  "combobox/ComboboxContent.component": ["combobox-portal"],
  "context-menu/ContextMenuContent.component": ["context-menu-portal"],
  "context-menu/ContextMenuSubContent.component": ["context-menu-sub-portal"],
  "dropdown/DropdownContent.component": ["dropdown-portal"],
  "dropdown/DropdownSubContent.component": ["dropdown-sub-portal"],
  "hover-card/HoverCardContent.component": ["hover-card-portal"],
  "navigation-menu/NavigationMenuPositioner.component": ["navigation-menu-portal"],
  "popover/PopoverContent.component": ["popover-portal"],
  "select/SelectContent.component": ["select-portal"],
  "tooltip/TooltipContent.component": ["tooltip-portal"],
};

describe("framework surface manifest", () => {
  it("matches fresh deterministic Primitive and Styled output", async () => {
    const committed = JSON.parse(await readFile(manifestPath, "utf8"));
    const first = await buildFrameworkSurfaceManifest({ repoRoot });
    const second = await buildFrameworkSurfaceManifest({ repoRoot });

    expect(serializeFrameworkSurfaceManifest(first)).toBe(
      serializeFrameworkSurfaceManifest(second),
    );
    expect(compareFrameworkSurfaceManifests(committed, first)).toEqual([]);
  }, 60_000);

  it("freezes the complete counts and approved Astro exceptions", async () => {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

    expect(() => assertFrameworkSurfaceManifest(manifest)).not.toThrow();
    expect(manifest.approvedExceptions).toEqual([
      {
        id: "astro-theme-init-script",
        target: "astro",
        surface: "primitive.renderedPaths",
        path: "theme/ThemeInitScript",
        reason: "Astro emits ThemeInitScript as a rendered .astro helper.",
      },
      {
        id: "astro-image-styled-root",
        target: "astro",
        surface: "styled.roots",
        path: "image",
        reason: "Image is an Astro-only Styled root with three normalized files.",
      },
    ]);

    expect(manifest.targets.astro.counts).toEqual({
      familySubpaths: 37,
      namespaceParts: 242,
      renderedPrimitivePaths: 227,
      styledNormalizedPaths: 393,
      styledRoots: 55,
    });
    for (const target of ["react", "vue"]) {
      expect(manifest.targets[target].counts).toEqual({
        familySubpaths: 37,
        namespaceParts: 242,
        renderedPrimitivePaths: 226,
        styledNormalizedPaths: 390,
        styledRoots: 54,
      });
    }
  });

  it("freezes exact public Portal anatomy and Styled portable control owners", async () => {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

    expect(manifest.schemaVersion).toBe(3);
    for (const target of ["astro", "react", "vue"]) {
      expect(manifest.targets[target].primitive.portalAnatomy).toEqual(
        expectedPortalAnatomy(target),
      );
      expect(manifest.targets[target].styled.portalControls).toEqual({
        props: ["portalContainer", "disablePortal"],
        directOwners: expectedDirectStyledPortalOwners,
        composedOwners: expectedComposedStyledPortalOwners,
        renderedPortalSlots: expectedRenderedStyledPortalSlots,
      });
    }
  });

  it("derives the approved Astro ThemeInitScript path from fresh output", async () => {
    const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-surface-theme-"));
    const primitiveRoot = path.join(temporaryRoot, "primitive", "astro");

    try {
      await generateFrameworkPrimitiveWrappers("astro", {
        generatedBy: "scripts/portable-runtime/tests/framework-surface-manifest.test.mjs",
        outputRoot: primitiveRoot,
      });
      await rename(
        path.join(primitiveRoot, "theme", "ThemeInitScript.astro"),
        path.join(primitiveRoot, "theme", "RenamedThemeInitScript.astro"),
      );

      await expect(inspectGeneratedTargetSurface("astro", temporaryRoot)).rejects.toThrow(
        "theme/ThemeInitScript.astro",
      );
    } finally {
      await rm(temporaryRoot, { force: true, recursive: true });
    }
  });

  it.each(["astro", "react", "vue"])(
    "rejects %s Portal output when its rendered public wrapper loses a required hook",
    async (target) => {
      const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), `starwind-surface-${target}-`));
      const primitiveRoot = path.join(temporaryRoot, "primitive", target);
      const portalPath = path.join(
        primitiveRoot,
        "combobox",
        `ComboboxPortal.${target === "astro" ? "astro" : target === "react" ? "tsx" : "vue"}`,
      );

      try {
        await generateFrameworkPrimitiveWrappers(target, {
          generatedBy: "scripts/portable-runtime/tests/framework-surface-manifest.test.mjs",
          outputRoot: primitiveRoot,
        });
        const source = await readFile(portalPath, "utf8");
        await writeFile(
          portalPath,
          source.replace("data-sw-combobox-portal", "data-sw-combobox-missing"),
          "utf8",
        );

        await expect(inspectGeneratedTargetSurface(target, temporaryRoot)).rejects.toThrow(
          `${target} combobox rendered Portal wrapper is missing runtime hook data-sw-combobox-portal`,
        );
      } finally {
        await rm(temporaryRoot, { force: true, recursive: true });
      }
    },
    30_000,
  );

  it.each(["astro", "react", "vue"])(
    "rejects %s Portal output when its rendered public wrapper uses the wrong element",
    async (target) => {
      const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), `starwind-surface-${target}-`));
      const primitiveRoot = path.join(temporaryRoot, "primitive", target);
      const portalPath =
        target === "react"
          ? path.join(primitiveRoot, "internal", "portal.tsx")
          : path.join(
              primitiveRoot,
              "combobox",
              `ComboboxPortal.${target === "astro" ? "astro" : "vue"}`,
            );

      try {
        await generateFrameworkPrimitiveWrappers(target, {
          generatedBy: "scripts/portable-runtime/tests/framework-surface-manifest.test.mjs",
          outputRoot: primitiveRoot,
        });
        const source = await readFile(portalPath, "utf8");
        const mutated =
          target === "react"
            ? source.replace(/(const\s+wrapper\s*=\s*\(\s*)<div\b/, "$1<span")
            : target === "vue"
              ? source.replace(/(<template>[\s\S]*?)<div\b/, "$1<span")
              : source.replace(/(---\s*)<div\b/, "$1<span");
        expect(mutated).not.toBe(source);
        await writeFile(portalPath, mutated, "utf8");

        await expect(inspectGeneratedTargetSurface(target, temporaryRoot)).rejects.toThrow(
          target === "react"
            ? /react [a-z-]+ rendered Portal wrapper uses span instead of div/
            : `${target} combobox rendered Portal wrapper uses span instead of div`,
        );
      } finally {
        await rm(temporaryRoot, { force: true, recursive: true });
      }
    },
    30_000,
  );

  it("records exact namespace defaults and no Theme facade default", async () => {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

    for (const target of ["astro", "react", "vue"]) {
      expect(
        manifest.targets[target].primitive.exports.avatar.filter(
          (entry) => entry.kind === "default",
        ),
      ).toEqual([
        {
          name: "default",
          reference: "Avatar",
          kind: "default",
          classification: "namespace",
        },
      ]);
      expect(
        manifest.targets[target].primitive.exports.theme.filter(
          (entry) => entry.kind === "default",
        ),
      ).toEqual([]);
    }
  });

  it("records the corrected Vue namespace order and internal context boundary", async () => {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const expectedAvatar = ["Root", "Image", "Fallback"];
    const expectedScrollArea = ["Root", "Viewport", "Content", "Scrollbar", "Thumb", "Corner"];

    for (const target of ["astro", "react", "vue"]) {
      expect(manifest.targets[target].primitive.namespaces.avatar).toEqual(expectedAvatar);
      expect(manifest.targets[target].primitive.namespaces["scroll-area"]).toEqual(
        expectedScrollArea,
      );
    }

    for (const component of ["menu", "navigation-menu"]) {
      expect(manifest.targets.vue.primitive.exports[component]).toEqual(
        manifest.targets.react.primitive.exports[component],
      );
      expect(manifest.targets.vue.primitive.exports[component]).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ classification: "helper" }),
          expect.objectContaining({ classification: "helper-type" }),
        ]),
      );
    }
  });

  it("classifies a known public export fixture independently", () => {
    const source = `
const Example = {
  Root: ExampleRoot,
};
export { Example, ExampleRoot, localHelper, runtimeHelper };
export type { HelperType, RuntimeType } from "./types";
export default Example;
`;

    expect(
      classifyPublicExports(source, {
        component: "example",
        runtimeFacades: { types: ["RuntimeType"], values: ["runtimeHelper"] },
      }),
    ).toEqual([
      {
        name: "default",
        reference: "Example",
        kind: "default",
        classification: "namespace",
      },
      { name: "HelperType", kind: "type", classification: "helper-type" },
      { name: "RuntimeType", kind: "type", classification: "runtime-facade" },
      { name: "Example", kind: "value", classification: "namespace" },
      {
        name: "ExampleRoot",
        kind: "value",
        classification: "rendered-component",
      },
      { name: "localHelper", kind: "value", classification: "helper" },
      { name: "runtimeHelper", kind: "value", classification: "runtime-facade" },
    ]);
  });

  it.each([
    ["added", (value) => value.targets.react.primitive.renderedPaths.push("button/Extra")],
    ["removed", (value) => value.targets.react.primitive.renderedPaths.pop()],
    [
      "renamed",
      (value) => {
        value.targets.react.primitive.renderedPaths[0] = "accordion/Renamed";
      },
    ],
    [
      "reordered",
      (value) => {
        value.targets.react.primitive.namespaces.avatar.reverse();
      },
    ],
    [
      "reclassified",
      (value) => {
        value.targets.vue.primitive.exports.menu[0].classification = "helper";
      },
    ],
    [
      "duplicated",
      (value) => {
        value.targets.react.primitive.renderedPaths.push(
          value.targets.react.primitive.renderedPaths[0],
        );
      },
    ],
  ])("rejects a %s surface entry", async (_label, mutate) => {
    const expected = JSON.parse(await readFile(manifestPath, "utf8"));
    const fixture = structuredClone(expected);
    mutate(fixture);

    expect(compareFrameworkSurfaceManifests(expected, fixture)).not.toEqual([]);
    expect(() => assertFrameworkSurfaceManifest(fixture)).toThrow();
  });
});
