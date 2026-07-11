import {
  assertNoStarwindClassHooksInStyledContracts,
  assertNoStarwindClassHooksInTree,
} from "../../starwind-class-guard.js";
import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateStarwindReactWrappers,
  it,
  path,
  readGeneratedFile,
  readGeneratedTree,
} from "./shared.js";
import { assertReactStyledFormOutput } from "./styled-output/form.cases.js";
import {
  assertReactBadgeToneAppearanceFoundationOutput,
  assertReactStyledFoundationOutput,
} from "./styled-output/foundation.cases.js";
import { assertReactStyledMediaOutput } from "./styled-output/media.cases.js";
import { assertReactStyledOverlayOutput } from "./styled-output/overlay.cases.js";
import { assertReactStyledStateOutput } from "./styled-output/state.cases.js";

export function defineReactStyledOutputTests(getTempRoot: GetTempRoot): void {
  it("generates Badge tone and appearance styled React output", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/react",
      repoRoot: tempRoot,
    });

    await assertReactBadgeToneAppearanceFoundationOutput(
      path.join(tempRoot, "generated/starwind-runtime"),
    );
  });

  it("generates styled Starwind React wrappers that compose primitive wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    await assertReactStyledFoundationOutput(outputRoot);
    await assertReactStyledMediaOutput(outputRoot);
    await assertReactStyledFormOutput(outputRoot);
    await assertReactStyledStateOutput(outputRoot);
    await assertReactStyledOverlayOutput(outputRoot);
    await assertNoStarwindClassHooksInTree(outputRoot);
    await assertNoStarwindClassHooksInStyledContracts();
  });

  it("uses React primitive package imports for default styled output", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "apps/react-demo/src/components/starwind-runtime");
    const button = await readGeneratedFile(outputRoot, "button/Button.tsx");
    const carousel = await readGeneratedFile(outputRoot, "carousel/Carousel.tsx");
    const carouselNext = await readGeneratedFile(outputRoot, "carousel/CarouselNext.tsx");
    const carouselPrevious = await readGeneratedFile(outputRoot, "carousel/CarouselPrevious.tsx");
    const carouselVariants = await readGeneratedFile(outputRoot, "carousel/variants.ts");
    const form = await readGeneratedFile(outputRoot, "form/Form.tsx");
    const field = await readGeneratedFile(outputRoot, "field/Field.tsx");
    const navigationMenu = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenu.tsx",
    );
    const select = await readGeneratedFile(outputRoot, "select/Select.tsx");
    const themeToggle = await readGeneratedFile(outputRoot, "theme-toggle/ThemeToggle.tsx");
    const toaster = await readGeneratedFile(outputRoot, "toast/Toaster.tsx");

    expect(button).toContain('import ButtonPrimitive from "@starwind-ui/react/button";');
    expect(button).not.toContain("primitives/react");
    expect(carousel).toContain('import CarouselPrimitive from "@starwind-ui/react/carousel";');
    expect(carousel).toContain('opts?: import("@starwind-ui/react/carousel").CarouselOptions');
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
      "className={carouselControl({ variant, size, class: controlClassName })}",
    );
    expect(carouselPrevious).toContain(
      "const controlClassName = carouselPrevious({ class: className });",
    );
    expect(carouselPrevious).toContain(
      "className={carouselControl({ variant, size, class: controlClassName })}",
    );
    expect(form).toContain('validationTiming?: import("@starwind-ui/react/form")');
    expect(field).toContain('validationTiming?: import("@starwind-ui/react/form")');
    expect(navigationMenu).toContain(
      'import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";',
    );
    expect(navigationMenu).toContain('import("@starwind-ui/react/navigation-menu")');
    expect(navigationMenu).not.toContain('import("@starwind-ui/runtime")');
    expect(select).toContain('import SelectPrimitive from "@starwind-ui/react/select";');
    expect(select).toContain('import("@starwind-ui/react/select").SelectOpenChangeDetails');
    expect(select).toContain('import("@starwind-ui/react/select").SelectValueChangeDetails');
    expect(select).not.toContain('import("@starwind-ui/runtime")');
    expect(themeToggle).toContain(
      'import { initThemeController } from "@starwind-ui/react/theme";',
    );
    expect(toaster).toContain('import ToastPrimitive from "@starwind-ui/react/toast";');

    const outputTree = await readGeneratedTree(outputRoot);
    const directRuntimeRefs = Object.entries(outputTree)
      .filter(([fileName]) => /\.(ts|tsx)$/.test(fileName))
      .filter(([, contents]) => contents.includes("@starwind-ui/runtime"));

    expect(directRuntimeRefs).toEqual([]);
  });
}
