import type { CarouselInstance, CarouselOptions } from "@starwind-ui/react/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useMemo, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../kit";

const slides = Array.from({ length: 5 }, (_, index) => index + 1);
const manySlides = Array.from({ length: 8 }, (_, index) => index + 1);
const startOpts: CarouselOptions["opts"] = { align: "start" };
const loopOpts: CarouselOptions["opts"] = { align: "start", loop: true };

export function CarouselDemo() {
  const [snapCount, setSnapCount] = useState(0);
  const [pluginReady, setPluginReady] = useState(false);
  const autoplayPlugins = useMemo(
    () => [Autoplay({ delay: 1400, stopOnInteraction: false, stopOnMouseEnter: true })],
    [],
  );
  const handleApi = useMemo(
    () => (api: CarouselInstance["api"]) => {
      setSnapCount(api.scrollSnapList().length);
      setPluginReady(Boolean(api.plugins().autoplay));
    },
    [],
  );

  return (
    <section id="runtime-carousel-demo" className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Carousel</h2>
      <div className="grid gap-8">
        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Default</h3>
          <div className="px-12">
            <Carousel
              id="react-runtime-carousel-default"
              aria-label="Default carousel"
              className="mx-auto w-full max-w-xs"
            >
              <CarouselContent>
                {slides.map((slide) => (
                  <CarouselItem key={slide}>
                    <div className="bg-muted/50 flex aspect-square items-center justify-center rounded-md border text-3xl font-semibold">
                      {slide}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Multiple items</h3>
          <div className="px-12">
            <Carousel
              id="react-runtime-carousel-multiple"
              aria-label="Multiple item carousel"
              opts={startOpts}
              className="mx-auto w-full max-w-xl"
            >
              <CarouselContent>
                {manySlides.map((slide) => (
                  <CarouselItem key={slide} className="sm:basis-1/2">
                    <div className="bg-muted/50 flex aspect-square items-center justify-center rounded-md border text-2xl font-semibold">
                      {slide}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Vertical</h3>
          <div className="px-12 py-12">
            <Carousel
              id="react-runtime-carousel-vertical"
              aria-label="Vertical carousel"
              orientation="vertical"
              opts={startOpts}
              className="mx-auto w-full max-w-xs"
            >
              <CarouselContent className="h-56">
                {slides.map((slide) => (
                  <CarouselItem key={slide} className="basis-1/2">
                    <div className="bg-muted/50 flex h-full items-center justify-center rounded-md border text-3xl font-semibold">
                      {slide}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-heading text-base font-semibold">Looping</h3>
            <div className="px-12">
              <Carousel
                id="react-runtime-carousel-loop"
                aria-label="Looping carousel"
                opts={loopOpts}
                className="mx-auto w-full max-w-xs"
              >
                <CarouselContent>
                  {slides.map((slide) => (
                    <CarouselItem key={slide}>
                      <div className="bg-muted/50 flex aspect-square items-center justify-center rounded-md border text-3xl font-semibold">
                        {slide}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-heading text-base font-semibold">Autoplay plugin</h3>
            <div className="px-12">
              <Carousel
                id="react-runtime-carousel-plugin"
                aria-label="Plugin carousel"
                opts={loopOpts}
                plugins={autoplayPlugins}
                setApi={handleApi}
                data-plugin-ready={pluginReady ? "true" : undefined}
                className="mx-auto w-full max-w-xs"
              >
                <CarouselContent>
                  {slides.map((slide) => (
                    <CarouselItem key={slide}>
                      <div className="bg-muted/50 flex aspect-square items-center justify-center rounded-md border text-3xl font-semibold">
                        {slide}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
            <p className="text-muted-foreground text-sm">Snap points: {snapCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
