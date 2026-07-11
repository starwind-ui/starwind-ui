import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateReactPrimitiveWrappers,
  generateStarwindReactWrappers,
  it,
  path,
  readdir,
  readGeneratedFile,
} from "./shared.js";

export function defineReactCarouselOutputTests(getTempRoot: GetTempRoot): void {
  it("generates React carousel primitive wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const generatedPrimitiveEntries = (await readdir(outputRoot)).sort();
    const root = await readGeneratedFile(outputRoot, "carousel/CarouselRoot.tsx");
    const viewport = await readGeneratedFile(outputRoot, "carousel/CarouselViewport.tsx");
    const container = await readGeneratedFile(outputRoot, "carousel/CarouselContainer.tsx");
    const item = await readGeneratedFile(outputRoot, "carousel/CarouselItem.tsx");
    const previous = await readGeneratedFile(outputRoot, "carousel/CarouselPrevious.tsx");
    const next = await readGeneratedFile(outputRoot, "carousel/CarouselNext.tsx");
    const index = await readGeneratedFile(outputRoot, "carousel/index.ts");

    expect(generatedPrimitiveEntries).toContain("carousel");
    expect(root).toContain('from "@starwind-ui/runtime/carousel";');
    expect(root).toContain("type CarouselInstance");
    expect(root).toContain("type CarouselOptions");
    expect(root).toContain("createCarousel");
    expect(root).toContain('opts?: CarouselOptions["opts"]');
    expect(root).toContain('plugins?: CarouselOptions["plugins"]');
    expect(root).toContain('setApi?: (api: CarouselInstance["api"]) => void');
    expect(root).toContain('const DEFAULT_CAROUSEL_OPTS: CarouselOptions["opts"] = {};');
    expect(root.indexOf("const DEFAULT_CAROUSEL_OPTS")).toBeLessThan(
      root.indexOf("const CarouselRoot = React.forwardRef"),
    );
    expect(root).toContain(
      '{ orientation = "horizontal", opts = DEFAULT_CAROUSEL_OPTS, plugins, setApi, ...props }',
    );
    expect(root).not.toContain("opts = {}");
    expect(root).toContain("createCarousel(root");
    expect(root).toContain("plugins: pluginsRef.current");
    expect(root).toContain("setApiRef.current?.(api)");
    expect(root).toContain('data-auto-init="false"');
    expect(root.indexOf("{...props}")).toBeLessThan(root.indexOf('data-auto-init="false"'));
    expect(root).toContain('data-axis={orientation === "vertical" ? "y" : "x"}');
    expect(root).toContain("data-opts={JSON.stringify(opts)}");
    expect(root).toContain("const skipInitialReInitRef = React.useRef(true)");
    expect(root.indexOf("if (skipInitialReInitRef.current)")).toBeLessThan(
      root.indexOf("instance.reInit"),
    );
    expect(root.indexOf('role="region"')).toBeLessThan(root.indexOf("{...props}"));
    expect(root.indexOf('aria-roledescription="carousel"')).toBeLessThan(
      root.indexOf("{...props}"),
    );
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

  it("generates React carousel styled wrappers from carousel primitives", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    const root = await readGeneratedFile(outputRoot, "carousel/Carousel.tsx");
    const content = await readGeneratedFile(outputRoot, "carousel/CarouselContent.tsx");
    const item = await readGeneratedFile(outputRoot, "carousel/CarouselItem.tsx");
    const previous = await readGeneratedFile(outputRoot, "carousel/CarouselPrevious.tsx");
    const next = await readGeneratedFile(outputRoot, "carousel/CarouselNext.tsx");
    const variants = await readGeneratedFile(outputRoot, "carousel/variants.ts");
    const index = await readGeneratedFile(outputRoot, "carousel/index.ts");

    expect(root).toContain('CarouselPrimitive from "../primitives/react/carousel"');
    expect(root).toContain("<CarouselPrimitive.Root");
    expect(root).toContain('data-slot="carousel"');
    expect(content).toContain("<CarouselPrimitive.Viewport");
    expect(content).toContain("className={carouselContent()}");
    expect(content).toContain("<CarouselPrimitive.Container");
    expect(content).toContain("className={carouselContainer({ class: className })}");
    expect(content).toContain('data-slot="carousel-container"');
    expect(item).toContain("<CarouselPrimitive.Item");
    expect(previous).toContain("IconChevronLeft as ChevronLeft");
    expect(previous).not.toContain("data-sw-carousel-previous");
    expect(next).toContain("IconChevronRight as ChevronRight");
    expect(next).not.toContain("data-sw-carousel-next");
    expect(variants).not.toContain("starwind-carousel");
    expect(variants).toContain("group/carousel relative");
    expect(variants).toContain("overflow-hidden");
    expect(index).toContain("Root: Carousel");
    expect(index).toContain("Content: CarouselContent");
  });
}
