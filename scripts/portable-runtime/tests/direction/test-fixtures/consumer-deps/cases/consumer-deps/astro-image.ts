import type { DirectionCase, DirectionExpectation } from "../../../../inventory.js";

export const cases: DirectionCase[] = [
  {
    id: "consumer-astro-image",
    row: "image",
    acceptance: ["SPEC-AC-14"],
    fixtures: {
      astro: {
        source: `---
import { Image } from "@direction/styled-astro/image";
import pricingImage from "@/assets/images/pricing-9.jpg";
import "@direction/sheet";
---
<html><head><title>Astro asset image</title></head><body><Image src={pricingImage} alt="Local image" data-consumer-image /></body></html>`,
        exports: ["Image"],
        assertions: ["native-astro-assets", "local-image-loaded"],
      },
    },
  },
];

export const expectations: DirectionExpectation[] = [
  {
    id: "consumer-astro-image",
    layer: "styled",
    async run(page, _target, ctx) {
      const image = page.locator("[data-consumer-image]");
      await ctx.check("native-astro-assets", async () => {
        await image.waitFor({ state: "visible" });
        const source = await image.getAttribute("src");
        ctx.observe("imageSource", source);
        if (!source?.includes("/_astro/"))
          throw new Error(`Unexpected Astro asset source: ${source}`);
      });
      await ctx.check("local-image-loaded", async () => {
        const dimensions = await image.evaluate(async (element) => {
          if (!(element instanceof HTMLImageElement))
            throw new Error("Astro Image did not render an img");
          await element.decode();
          return { width: element.naturalWidth, height: element.naturalHeight };
        });
        ctx.observe("imageDimensions", dimensions);
        if (dimensions.width <= 0 || dimensions.height <= 0)
          throw new Error("Astro image has no decoded dimensions");
      });
    },
  },
];
