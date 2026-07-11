import {
  assertNoStarwindClassHooksInSource,
  assertNoStarwindClassHooksInStyledContracts,
  assertNoStarwindClassHooksInTree,
} from "../../starwind-class-guard.js";
import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateStarwindAstroWrappers,
  it,
  path,
  readGeneratedFile,
  readGeneratedTree,
} from "./shared.js";
import { assertAstroStyledFormOutput } from "./styled-output/form.cases.js";
import {
  assertAstroBadgeToneAppearanceFoundationOutput,
  assertAstroStyledFoundationOutput,
} from "./styled-output/foundation.cases.js";
import { assertAstroStyledMediaOutput } from "./styled-output/media.cases.js";
import { assertAstroStyledOverlayOutput } from "./styled-output/overlay.cases.js";
import { assertAstroStyledStateOutput } from "./styled-output/state.cases.js";

export function defineAstroStyledOutputTests(getTempRoot: GetTempRoot): void {
  it("generates Badge tone and appearance styled Astro output", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/astro",
      repoRoot: tempRoot,
    });

    await assertAstroBadgeToneAppearanceFoundationOutput(
      path.join(tempRoot, "generated/starwind-runtime"),
    );
  });

  it("generates styled Starwind Astro wrappers that compose primitive wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    await assertAstroStyledFoundationOutput(outputRoot);
    await assertAstroStyledMediaOutput(outputRoot);
    await assertAstroStyledFormOutput(outputRoot);
    await assertAstroStyledStateOutput(outputRoot);
    await assertAstroStyledOverlayOutput(outputRoot);
    await assertNoStarwindClassHooksInTree(outputRoot);
    await assertNoStarwindClassHooksInStyledContracts();
  });

  it("distinguishes removed Starwind class hooks from allowed non-class identifiers", () => {
    assertNoStarwindClassHooksInSource(
      "allowed.ts",
      [
        'import { createToggle } from "@starwind-ui/runtime/toggle";',
        'document.addEventListener("starwind-toggle:change", () => {});',
        'const storageKey = "starwind-sidebar-open";',
        'const selector = "[data-starwind-sidebar-tooltips]";',
        'const size = "var(--starwind-accordion-content-height)";',
      ].join("\n"),
    );

    expect(() =>
      assertNoStarwindClassHooksInSource(
        "button/variants.ts",
        'export const button = tv({ base: "starwind-button inline-flex" });',
      ),
    ).toThrow("starwind-button");

    expect(() =>
      assertNoStarwindClassHooksInSource(
        "toast/styles.css",
        ".starwind-toast-viewport { pointer-events: none; }",
      ),
    ).toThrow(".starwind-toast-viewport");

    expect(() =>
      assertNoStarwindClassHooksInSource(
        "dialog/variants.ts",
        'export const dialog = tv({ base: "starwind-dialog:whatever" });',
      ),
    ).toThrow("starwind-dialog");
  });

  it("uses Astro primitive package imports for default styled output", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "apps/demo/src/components/starwind-runtime");
    const button = await readGeneratedFile(outputRoot, "button/Button.astro");
    const carousel = await readGeneratedFile(outputRoot, "carousel/Carousel.astro");
    const carouselNext = await readGeneratedFile(outputRoot, "carousel/CarouselNext.astro");
    const carouselPrevious = await readGeneratedFile(outputRoot, "carousel/CarouselPrevious.astro");
    const carouselVariants = await readGeneratedFile(outputRoot, "carousel/variants.ts");
    const form = await readGeneratedFile(outputRoot, "form/Form.astro");
    const field = await readGeneratedFile(outputRoot, "field/Field.astro");
    const navigationMenu = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenu.astro",
    );
    const themeToggle = await readGeneratedFile(outputRoot, "theme-toggle/ThemeToggle.astro");
    const toaster = await readGeneratedFile(outputRoot, "toast/Toaster.astro");

    expect(button).toContain('import ButtonPrimitive from "@starwind-ui/astro/button";');
    expect(button).not.toContain("primitives/astro");
    expect(carousel).toContain('import CarouselPrimitive from "@starwind-ui/astro/carousel";');
    expect(carousel).toContain('opts?: import("@starwind-ui/astro/carousel").CarouselOptions');
    expect(carouselVariants).toContain(
      'import { button as buttonVariants } from "../button/variants";',
    );
    expect(carouselVariants).toContain("export const carouselControl = tv({");
    expect(carouselVariants).toContain("extend: buttonVariants");
    expect(carouselVariants).toContain("defaultVariants: {");
    expect(carouselVariants).toContain('variant: "outline"');
    expect(carouselVariants).toContain('size: "icon"');
    expect(carouselVariants).toContain('"absolute size-8 rounded-full"');
    expect(carouselNext).toContain("const controlClassName = carouselNext({ class: className });");
    expect(carouselNext).toContain(
      "class={carouselControl({ variant, size, class: controlClassName })}",
    );
    expect(carouselPrevious).toContain(
      "const controlClassName = carouselPrevious({ class: className });",
    );
    expect(carouselPrevious).toContain(
      "class={carouselControl({ variant, size, class: controlClassName })}",
    );
    expect(form).toContain('validationTiming?: import("@starwind-ui/astro/form")');
    expect(field).toContain('validationTiming?: import("@starwind-ui/astro/form")');
    expect(navigationMenu).toContain(
      'import NavigationMenuPrimitive from "@starwind-ui/astro/navigation-menu";',
    );
    expect(themeToggle).toContain(
      'import { initThemeController } from "@starwind-ui/astro/theme";',
    );
    expect(toaster).toContain('import ToastPrimitive from "@starwind-ui/astro/toast";');

    const outputTree = await readGeneratedTree(outputRoot);
    const directRuntimeRefs = Object.entries(outputTree)
      .filter(([fileName]) => /\.(astro|ts|tsx)$/.test(fileName))
      .filter(([, contents]) => contents.includes("@starwind-ui/runtime"));

    expect(directRuntimeRefs).toEqual([]);
  });
}
