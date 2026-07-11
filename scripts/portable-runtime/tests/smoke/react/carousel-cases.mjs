import { expectText } from "../shared/text.mjs";

export async function verifyReactCarouselCases({ page }) {
  const demo = page.locator("#runtime-carousel-demo");
  await demo.scrollIntoViewIfNeeded();
  await page.locator("#react-runtime-carousel-plugin[data-plugin-ready='true']").waitFor();
  await expectText(
    page.locator("#runtime-carousel-demo").getByText("Snap points:"),
    "Snap points: 5",
  );

  const initialState = await page.evaluate(() => {
    const demoRoot = document.querySelector("#runtime-carousel-demo");
    const defaultRoot = demoRoot?.querySelector("#react-runtime-carousel-default");
    const defaultContainer = defaultRoot?.querySelector("[data-sw-carousel-container]");
    const defaultPrevious = defaultRoot?.querySelector('[data-slot="carousel-previous"]');
    const defaultNext = defaultRoot?.querySelector('[data-slot="carousel-next"]');
    const verticalRoot = demoRoot?.querySelector("#react-runtime-carousel-vertical");
    const verticalContainer = verticalRoot?.querySelector("[data-sw-carousel-container]");
    const loopRoot = demoRoot?.querySelector("#react-runtime-carousel-loop");
    const loopPrevious = loopRoot?.querySelector('[data-slot="carousel-previous"]');
    const loopNext = loopRoot?.querySelector('[data-slot="carousel-next"]');
    const pluginRoot = demoRoot?.querySelector("#react-runtime-carousel-plugin");

    return {
      carouselCount: demoRoot?.querySelectorAll('[data-slot="carousel"]').length ?? 0,
      carouselLabels: Array.from(demoRoot?.querySelectorAll('[data-slot="carousel"]') ?? []).map(
        (carousel) => carousel.getAttribute("aria-label"),
      ),
      contentCount: demoRoot?.querySelectorAll('[data-slot="carousel-content"]').length ?? 0,
      defaultAxis: defaultRoot?.getAttribute("data-axis"),
      defaultContainerDirection:
        defaultContainer instanceof HTMLElement
          ? getComputedStyle(defaultContainer).flexDirection
          : null,
      defaultItemCount: defaultRoot?.querySelectorAll('[data-slot="carousel-item"]').length ?? 0,
      defaultNextDisabled: defaultNext?.hasAttribute("data-disabled") ?? null,
      defaultPreviousDisabled: defaultPrevious?.hasAttribute("data-disabled") ?? null,
      loopNextDisabled: loopNext?.hasAttribute("data-disabled") ?? null,
      loopPreviousDisabled: loopPrevious?.hasAttribute("data-disabled") ?? null,
      pluginReady: pluginRoot?.getAttribute("data-plugin-ready"),
      verticalAxis: verticalRoot?.getAttribute("data-axis"),
      verticalContainerDirection:
        verticalContainer instanceof HTMLElement
          ? getComputedStyle(verticalContainer).flexDirection
          : null,
    };
  });

  if (
    initialState.carouselCount !== 5 ||
    initialState.carouselLabels.join(",") !==
      "Default carousel,Multiple item carousel,Vertical carousel,Looping carousel,Plugin carousel" ||
    initialState.contentCount !== 5 ||
    initialState.defaultAxis !== "x" ||
    initialState.defaultContainerDirection !== "row" ||
    initialState.defaultItemCount !== 5 ||
    initialState.defaultPreviousDisabled !== true ||
    initialState.defaultNextDisabled !== false ||
    initialState.verticalAxis !== "y" ||
    initialState.verticalContainerDirection !== "column" ||
    initialState.loopPreviousDisabled !== false ||
    initialState.loopNextDisabled !== false ||
    initialState.pluginReady !== "true"
  ) {
    throw new Error(
      `Expected React Carousel demo to initialize horizontal, vertical, loop, plugin, and API examples, got ${JSON.stringify(
        initialState,
      )}.`,
    );
  }

  await page.locator('#react-runtime-carousel-default [data-slot="carousel-next"]').click();
  await page.waitForFunction(() => {
    const previous = document.querySelector(
      '#react-runtime-carousel-default [data-slot="carousel-previous"]',
    );

    return previous instanceof HTMLButtonElement && !previous.hasAttribute("data-disabled");
  });
}
