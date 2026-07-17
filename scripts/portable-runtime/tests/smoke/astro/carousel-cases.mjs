export async function verifyAstroCarouselCases({ page }) {
  const demo = page.locator("#runtime-carousel-demo");
  await demo.scrollIntoViewIfNeeded();
  await page.locator("#runtime-carousel-plugin[data-plugin-ready='true']").waitFor();

  const initialState = await page.evaluate(() => {
    const demoRoot = document.querySelector("#runtime-carousel-demo");
    const defaultRoot = demoRoot?.querySelector("#runtime-carousel-default");
    const defaultContainer = defaultRoot?.querySelector("[data-sw-carousel-container]");
    const defaultPrevious = defaultRoot?.querySelector('[data-slot="carousel-previous"]');
    const defaultNext = defaultRoot?.querySelector('[data-slot="carousel-next"]');
    const verticalRoot = demoRoot?.querySelector("#runtime-carousel-vertical");
    const verticalContainer = verticalRoot?.querySelector("[data-sw-carousel-container]");
    const loopRoot = demoRoot?.querySelector("#runtime-carousel-loop");
    const loopPrevious = loopRoot?.querySelector('[data-slot="carousel-previous"]');
    const loopNext = loopRoot?.querySelector('[data-slot="carousel-next"]');
    const pluginRoot = demoRoot?.querySelector("#runtime-carousel-plugin");

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
      `Expected Astro Carousel demo to initialize horizontal, vertical, loop, and plugin examples, got ${JSON.stringify(
        initialState,
      )}.`,
    );
  }

  await page.locator('#runtime-carousel-default [data-slot="carousel-next"]').click();
  await page.waitForFunction(() => {
    const previous = document.querySelector(
      '#runtime-carousel-default [data-slot="carousel-previous"]',
    );

    return previous instanceof HTMLButtonElement && !previous.hasAttribute("data-disabled");
  });
}

export async function verifyAstroCarouselClientRouterCase({ page, baseUrl }) {
  const startCarouselCount = await page.locator('[data-slot="carousel"]').count();
  if (startCarouselCount !== 0) {
    throw new Error(
      `Expected Carousel client-router start page to contain no Carousels, found ${startCarouselCount}.`,
    );
  }

  const sentinel = `carousel-client-router-${Date.now()}`;
  await page.evaluate((value) => {
    globalThis.__starwindCarouselClientRouterSentinel = value;
  }, sentinel);

  await page.getByRole("link", { name: "Open Carousel fixture" }).click();
  await page.waitForURL(`${baseUrl}/smoke/carousel-client-router-destination/`);
  await page.getByRole("heading", { name: "Carousel client router smoke destination" }).waitFor();

  const transitionStayedClientSide = await page.evaluate(
    (value) => globalThis.__starwindCarouselClientRouterSentinel === value,
    sentinel,
  );
  if (!transitionStayedClientSide) {
    throw new Error("Expected Carousel smoke navigation to stay inside Astro's client router.");
  }

  const root = page.locator("#carousel-client-router-smoke");
  const previous = root.getByRole("button", { name: "Previous slide" });
  const next = root.getByRole("button", { name: "Next slide" });
  await previous.waitFor();
  await next.waitFor();
  await page.waitForFunction(() => {
    const carousel = document.querySelector("#carousel-client-router-smoke");
    const previousControl = carousel?.querySelector('[data-slot="carousel-previous"]');
    const nextControl = carousel?.querySelector('[data-slot="carousel-next"]');

    return (
      previousControl?.hasAttribute("data-disabled") === true &&
      nextControl?.hasAttribute("data-disabled") === false
    );
  });

  const initialState = await root.evaluate((carousel) => {
    const previousControl = carousel.querySelector('[data-slot="carousel-previous"]');
    const nextControl = carousel.querySelector('[data-slot="carousel-next"]');

    return {
      nextDisabled: nextControl?.hasAttribute("data-disabled") ?? null,
      previousDisabled: previousControl?.hasAttribute("data-disabled") ?? null,
    };
  });

  if (initialState.previousDisabled !== true || initialState.nextDisabled !== false) {
    throw new Error(
      `Expected client-routed Astro Carousel to initialize its controls, got ${JSON.stringify(
        initialState,
      )}.`,
    );
  }

  await next.click();
  await page.waitForFunction(() => {
    const previousControl = document.querySelector(
      '#carousel-client-router-smoke [data-slot="carousel-previous"]',
    );

    return (
      previousControl instanceof HTMLButtonElement && !previousControl.hasAttribute("data-disabled")
    );
  });

  await previous.click();
  await page.waitForFunction(() => {
    const previousControl = document.querySelector(
      '#carousel-client-router-smoke [data-slot="carousel-previous"]',
    );

    return (
      previousControl instanceof HTMLButtonElement && previousControl.hasAttribute("data-disabled")
    );
  });
}
