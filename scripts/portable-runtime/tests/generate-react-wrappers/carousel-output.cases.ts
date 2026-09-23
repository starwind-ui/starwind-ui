import { compactCode } from "../source-comparison.js";
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
    expect(compactCode(root)).toContain(compactCode('from "@starwind-ui/runtime/carousel";'));
    expect(compactCode(root)).toContain(compactCode("type CarouselInstance"));
    expect(compactCode(root)).toContain(compactCode("type CarouselOptions"));
    expect(compactCode(root)).toContain(compactCode("createCarousel"));
    expect(compactCode(root)).toContain(compactCode('opts?: CarouselOptions["opts"]'));
    expect(compactCode(root)).toContain(compactCode('plugins?: CarouselOptions["plugins"]'));
    expect(compactCode(root)).toContain(
      compactCode('setApi?: (api: CarouselInstance["api"]) => void'),
    );
    expect(compactCode(root)).toContain(
      compactCode('const DEFAULT_CAROUSEL_OPTS: CarouselOptions["opts"] = {};'),
    );
    expect(root.indexOf("const DEFAULT_CAROUSEL_OPTS")).toBeLessThan(
      root.indexOf("const CarouselRoot = React.forwardRef"),
    );
    expect(compactCode(root)).toContain(
      compactCode(
        '{ orientation = "horizontal", opts = DEFAULT_CAROUSEL_OPTS, plugins, setApi, ...props }',
      ),
    );
    expect(compactCode(root)).not.toContain(compactCode("opts = {}"));
    expect(compactCode(root)).toContain(compactCode("createCarousel(root"));
    expect(compactCode(root)).toContain(compactCode("plugins: inputs.current.plugins"));
    expect(compactCode(root)).toContain(compactCode("inputs.current.setApi?.(api)"));
    expect(compactCode(root)).toContain(compactCode('data-auto-init="false"'));
    expect(root.indexOf("{...props}")).toBeLessThan(root.indexOf('data-auto-init="false"'));
    expect(compactCode(root)).toContain(
      compactCode('data-axis={orientation === "vertical" ? "y" : "x"}'),
    );
    expect(compactCode(root)).toContain(compactCode("data-opts={JSON.stringify(opts)}"));
    expect(root.indexOf("next.plugins === previous.plugins")).toBeLessThan(
      root.indexOf("instance.reInit"),
    );
    expect(root.indexOf('role="region"')).toBeLessThan(root.indexOf("{...props}"));
    expect(root.indexOf('aria-roledescription="carousel"')).toBeLessThan(
      root.indexOf("{...props}"),
    );
    expect(compactCode(viewport)).toContain(compactCode("data-sw-carousel-viewport"));
    expect(compactCode(container)).toContain(compactCode("data-sw-carousel-container"));
    expect(compactCode(item)).toContain(compactCode("data-sw-carousel-item"));
    expect(compactCode(item)).toContain(compactCode('role="group"'));
    expect(compactCode(item)).toContain(compactCode('aria-roledescription="slide"'));
    expect(compactCode(previous)).toContain(compactCode("data-sw-carousel-previous"));
    expect(compactCode(next)).toContain(compactCode("data-sw-carousel-next"));
    expect(compactCode(index)).toContain(compactCode("Root: CarouselRoot"));
    expect(compactCode(index)).toContain(compactCode("Viewport: CarouselViewport"));
    expect(compactCode(index)).toContain(
      compactCode('export type { CarouselInstance, CarouselOptions } from "@starwind-ui/runtime"'),
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

    expect(compactCode(root)).toContain(
      compactCode('CarouselPrimitive from "../primitives/react/carousel"'),
    );
    expect(compactCode(root)).toContain(compactCode("<CarouselPrimitive.Root"));
    expect(compactCode(root)).toContain(compactCode('data-slot="carousel"'));
    expect(compactCode(content)).toContain(compactCode("<CarouselPrimitive.Viewport"));
    expect(compactCode(content)).toContain(compactCode("className={carouselContent()}"));
    expect(compactCode(content)).toContain(compactCode("<CarouselPrimitive.Container"));
    expect(compactCode(content)).toContain(
      compactCode("className={carouselContainer({ class: className })}"),
    );
    expect(compactCode(content)).toContain(compactCode('data-slot="carousel-container"'));
    expect(compactCode(item)).toContain(compactCode("<CarouselPrimitive.Item"));
    expect(compactCode(previous)).toContain(compactCode("IconChevronLeft as ChevronLeft"));
    expect(compactCode(previous)).not.toContain(compactCode("data-sw-carousel-previous"));
    expect(compactCode(next)).toContain(compactCode("IconChevronRight as ChevronRight"));
    expect(compactCode(next)).not.toContain(compactCode("data-sw-carousel-next"));
    expect(compactCode(variants)).not.toContain(compactCode("starwind-carousel"));
    expect(compactCode(variants)).toContain(compactCode("group/carousel relative"));
    expect(compactCode(variants)).toContain(compactCode("overflow-hidden"));
    expect(compactCode(index)).toContain(compactCode("Root: Carousel"));
    expect(compactCode(index)).toContain(compactCode("Content: CarouselContent"));
  });
}
