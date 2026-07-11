import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateAstroPrimitiveWrappers,
  generateStarwindAstroWrappers,
  it,
  path,
  readdir,
  readGeneratedFile,
} from "./shared.js";

export function defineAstroCarouselOutputTests(getTempRoot: GetTempRoot): void {
  it("generates Astro carousel primitive wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/astro");
    const generatedPrimitiveEntries = (await readdir(outputRoot)).sort();
    const root = await readGeneratedFile(outputRoot, "carousel/CarouselRoot.astro");
    const viewport = await readGeneratedFile(outputRoot, "carousel/CarouselViewport.astro");
    const container = await readGeneratedFile(outputRoot, "carousel/CarouselContainer.astro");
    const item = await readGeneratedFile(outputRoot, "carousel/CarouselItem.astro");
    const previous = await readGeneratedFile(outputRoot, "carousel/CarouselPrevious.astro");
    const next = await readGeneratedFile(outputRoot, "carousel/CarouselNext.astro");
    const index = await readGeneratedFile(outputRoot, "carousel/index.ts");

    expect(generatedPrimitiveEntries).toContain("carousel");
    expect(root).toContain('import { createCarousel } from "@starwind-ui/runtime/carousel"');
    expect(root).toContain("data-sw-carousel");
    expect(root).toContain('data-axis={orientation === "vertical" ? "y" : "x"}');
    expect(root).toContain("data-opts={JSON.stringify(opts)}");
    expect(root).toContain('aria-roledescription="carousel"');
    expect(root).toContain('registerAstroControllerLifecycle("CarouselRoot", setupCarousels)');
    expect(viewport).toContain("data-sw-carousel-viewport");
    expect(container).toContain("data-sw-carousel-container");
    expect(item).toContain("data-sw-carousel-item");
    expect(item).toContain('role="group"');
    expect(item).toContain('aria-roledescription="slide"');
    expect(previous).toContain("data-sw-carousel-previous");
    expect(next).toContain("data-sw-carousel-next");
    expect(index).toContain("Root: CarouselRoot");
    expect(index).toContain("Viewport: CarouselViewport");
    expect(index).toContain(
      'export type { CarouselInstance, CarouselOptions } from "@starwind-ui/runtime"',
    );
  });

  it("generates Astro carousel styled wrappers from carousel primitives", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    const root = await readGeneratedFile(outputRoot, "carousel/Carousel.astro");
    const content = await readGeneratedFile(outputRoot, "carousel/CarouselContent.astro");
    const item = await readGeneratedFile(outputRoot, "carousel/CarouselItem.astro");
    const previous = await readGeneratedFile(outputRoot, "carousel/CarouselPrevious.astro");
    const next = await readGeneratedFile(outputRoot, "carousel/CarouselNext.astro");
    const variants = await readGeneratedFile(outputRoot, "carousel/variants.ts");
    const index = await readGeneratedFile(outputRoot, "carousel/index.ts");

    expect(root).toContain('CarouselPrimitive from "../primitives/astro/carousel"');
    expect(root).toContain("<CarouselPrimitive.Root");
    expect(root).toContain('data-slot="carousel"');
    expect(content).toContain("<CarouselPrimitive.Viewport");
    expect(content).toContain("class={carouselContent()}");
    expect(content).toContain("<CarouselPrimitive.Container");
    expect(content).toContain("class={carouselContainer({ class: className })}");
    expect(content).toContain('data-slot="carousel-container"');
    expect(item).toContain("<CarouselPrimitive.Item");
    expect(previous).toContain("ChevronLeft");
    expect(previous).not.toContain("data-sw-carousel-previous");
    expect(next).toContain("ChevronRight");
    expect(next).not.toContain("data-sw-carousel-next");
    expect(variants).not.toContain("starwind-carousel");
    expect(variants).toContain("group/carousel relative");
    expect(variants).toContain("overflow-hidden");
    expect(index).toContain("Root: Carousel");
    expect(index).toContain("Content: CarouselContent");
  });
}
