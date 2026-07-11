import { expectText } from "../../shared/text.mjs";

export async function verifyReactDisplayControlCases({ page }) {
  const textareaCount = await page
    .locator('textarea[data-slot="textarea"][data-sw-textarea]')
    .count();
  const defaultTextarea = page.locator("#react-runtime-textarea-default");
  const textareaLabelAssociation = await page.evaluate(() => {
    const label = document.querySelector(
      'label[data-slot="label"][for="react-runtime-textarea-default"]',
    );
    if (label instanceof HTMLLabelElement) {
      label.click();
    }

    return {
      activeId: document.activeElement?.id,
      controlId: label instanceof HTMLLabelElement ? label.control?.id : null,
    };
  });
  await defaultTextarea.fill("Portable textarea note");
  const defaultTextareaState = await defaultTextarea.evaluate((textarea) => ({
    className: textarea.getAttribute("class"),
    dataSlot: textarea.getAttribute("data-slot"),
    hasDataSwTextarea: textarea.hasAttribute("data-sw-textarea"),
    formValue:
      textarea instanceof HTMLTextAreaElement && textarea.form
        ? new FormData(textarea.form).get(textarea.name)
        : null,
    name: textarea.getAttribute("name"),
    placeholder: textarea.getAttribute("placeholder"),
    value: textarea instanceof HTMLTextAreaElement ? textarea.value : null,
  }));
  const invalidTextareaClass = await page
    .locator("#react-runtime-textarea-invalid")
    .getAttribute("class");
  const invalidTextareaAttributes = await page
    .locator("#react-runtime-textarea-invalid")
    .evaluate((textarea) => ({
      ariaInvalid: textarea.getAttribute("aria-invalid"),
      dataSlot: textarea.getAttribute("data-slot"),
      hasDataSwTextarea: textarea.hasAttribute("data-sw-textarea"),
    }));
  const disabledTextareaStyle = await page
    .locator("#react-runtime-textarea-disabled")
    .evaluate((textarea) => {
      const style = getComputedStyle(textarea);

      return {
        cursor: style.cursor,
        disabled: textarea instanceof HTMLTextAreaElement ? textarea.disabled : null,
        opacity: style.opacity,
      };
    });
  if (
    textareaCount !== 3 ||
    textareaLabelAssociation.activeId !== "react-runtime-textarea-default" ||
    textareaLabelAssociation.controlId !== "react-runtime-textarea-default" ||
    defaultTextareaState.className?.includes("runtime-textarea-custom") !== true ||
    defaultTextareaState.dataSlot !== "textarea" ||
    defaultTextareaState.hasDataSwTextarea !== true ||
    defaultTextareaState.formValue !== "Portable textarea note" ||
    defaultTextareaState.name !== "message" ||
    defaultTextareaState.placeholder !== "Write a note" ||
    defaultTextareaState.value !== "Portable textarea note" ||
    invalidTextareaAttributes.ariaInvalid !== "true" ||
    invalidTextareaAttributes.dataSlot !== "textarea" ||
    invalidTextareaAttributes.hasDataSwTextarea !== true ||
    !invalidTextareaClass?.includes("text-lg") ||
    (invalidTextareaClass?.includes("aria-invalid:border-error") !== true &&
      invalidTextareaClass?.includes("data-error-visible:border-error") !== true) ||
    disabledTextareaStyle.cursor !== "not-allowed" ||
    disabledTextareaStyle.disabled !== true ||
    Number(disabledTextareaStyle.opacity) > 0.8
  ) {
    throw new Error(
      `Expected three React textareas with native input behavior and Starwind states, got ${JSON.stringify(
        {
          defaultTextareaState,
          disabledTextareaStyle,
          invalidTextareaClass,
          invalidTextareaAttributes,
          textareaCount,
          textareaLabelAssociation,
        },
      )}.`,
    );
  }

  const skeletons = page.locator(
    '#react-runtime-skeleton-demo [data-slot="skeleton"][data-sw-skeleton]',
  );
  const skeletonCount = await skeletons.count();
  const skeletonStates = await page
    .locator('#react-runtime-skeleton-demo [data-slot="skeleton"][data-sw-skeleton]')
    .evaluateAll((items) =>
      items.map((item) => ({
        ariaHidden: item.getAttribute("aria-hidden"),
        className: item.getAttribute("class"),
        hasDataSwSkeleton: item.hasAttribute("data-sw-skeleton"),
      })),
    );
  await expectText(page.locator("[data-runtime-skeleton-ref]"), "skeleton");
  const customSkeleton = skeletonStates[0];
  if (
    skeletonCount !== 3 ||
    customSkeleton?.hasDataSwSkeleton !== true ||
    customSkeleton.ariaHidden !== "true" ||
    customSkeleton.className?.includes("bg-muted") !== true ||
    customSkeleton.className?.includes("animate-pulse") !== true ||
    customSkeleton.className?.includes("runtime-skeleton-custom") !== true ||
    customSkeleton.className?.includes("size-12") !== true ||
    customSkeleton.className?.includes("rounded-full") !== true ||
    skeletonStates.slice(1).some((state) => state.className?.includes("rounded-md") !== true) ||
    skeletonStates.some((state) => state.ariaHidden !== "true")
  ) {
    throw new Error(
      `Expected three React skeletons with Starwind classes and data markers, got ${JSON.stringify({
        skeletonCount,
        skeletonStates,
      })}.`,
    );
  }

  const cardCount = await page.locator('[data-slot="card"][data-sw-card]').count();
  const card = page.locator('[data-slot="card"][data-sw-card].runtime-card-custom').first();
  const defaultCardState = await page
    .locator('[data-slot="card"][data-sw-card].runtime-card-default')
    .evaluate((element) => ({
      className: element.getAttribute("class"),
      dataSize: element.getAttribute("data-size"),
      text: element.textContent?.replace(/\s+/g, " ").trim(),
    }));
  const cardState = await card.evaluate((element) => ({
    className: element.getAttribute("class"),
    dataSize: element.getAttribute("data-size"),
    hasDataSwCard: element.hasAttribute("data-sw-card"),
    text: element.textContent?.replace(/\s+/g, " ").trim(),
  }));
  const cardPartStates = await card
    .locator(
      [
        '[data-slot="card-header"][data-sw-card-header]',
        '[data-slot="card-title"][data-sw-card-title]',
        '[data-slot="card-description"][data-sw-card-description]',
        '[data-slot="card-action"][data-sw-card-action]',
        '[data-slot="card-content"][data-sw-card-content]',
        '[data-slot="card-footer"][data-sw-card-footer]',
      ].join(","),
    )
    .evaluateAll((items) =>
      items.map((item) => ({
        className: item.getAttribute("class"),
        slot: item.getAttribute("data-slot"),
        text: item.textContent?.replace(/\s+/g, " ").trim(),
      })),
    );
  await expectText(page.locator("[data-runtime-card-ref]"), "card");
  const cardHeader = cardPartStates.find((part) => part.slot === "card-header");
  const cardTitle = cardPartStates.find((part) => part.slot === "card-title");
  const cardDescription = cardPartStates.find((part) => part.slot === "card-description");
  const cardAction = cardPartStates.find((part) => part.slot === "card-action");
  const cardContent = cardPartStates.find((part) => part.slot === "card-content");
  const cardFooter = cardPartStates.find((part) => part.slot === "card-footer");
  if (
    cardCount !== 4 ||
    cardState.dataSize !== "sm" ||
    defaultCardState.dataSize !== "default" ||
    cardState.hasDataSwCard !== true ||
    cardState.className?.includes("runtime-card-custom") !== true ||
    cardState.className?.includes("bg-card") !== true ||
    cardState.className?.includes("group/card") !== true ||
    cardState.className?.includes("gap-4") !== true ||
    cardState.className?.includes("text-sm") !== true ||
    defaultCardState.className?.includes("gap-6") !== true ||
    defaultCardState.className?.includes("py-6") !== true ||
    defaultCardState.text !== "Default card shell" ||
    cardPartStates.length !== 6 ||
    cardHeader?.className?.includes("@container/card-header") !== true ||
    cardHeader.className?.includes("has-data-[slot=card-action]:grid-cols") !== true ||
    cardTitle?.text !== "Portable card" ||
    cardTitle.className?.includes("font-heading") !== true ||
    cardDescription?.text !== "Generated styled card anatomy" ||
    cardDescription.className?.includes("text-muted-foreground") !== true ||
    cardAction?.text !== "Ready" ||
    cardAction.className?.includes("justify-self-end") !== true ||
    cardContent?.className?.includes("group-data-[size=sm]/card:px-4") !== true ||
    cardFooter?.className?.includes("bg-muted/50") !== true ||
    cardState.text?.includes("Footer content") !== true
  ) {
    throw new Error(
      `Expected React Card anatomy with Starwind classes and data markers, got ${JSON.stringify({
        cardCount,
        defaultCardState,
        cardPartStates,
        cardState,
      })}.`,
    );
  }

  const breadcrumbState = await page.locator('nav[data-slot="breadcrumb"]').evaluate((nav) => {
    const list = nav.querySelector('[data-slot="breadcrumb-list"]');
    const links = [...nav.querySelectorAll('a[data-slot="breadcrumb-link"]')].map((link) => ({
      className: link.getAttribute("class"),
      href: link instanceof HTMLAnchorElement ? new URL(link.href).pathname : null,
      text: link.textContent?.trim(),
    }));
    const asChild = nav.querySelector("[data-runtime-react-breadcrumb-as-child]");
    const pageNode = nav.querySelector('[data-slot="breadcrumb-page"]');
    const ellipsis = nav.querySelector('[data-slot="breadcrumb-ellipsis"]');
    const separators = [...nav.querySelectorAll('[data-slot="breadcrumb-separator"]')];

    return {
      ariaLabel: nav.getAttribute("aria-label"),
      asChildHasGeneratedLink: Boolean(asChild?.closest('[data-slot="breadcrumb-link"]')),
      asChildText: asChild?.textContent?.trim(),
      className: nav.getAttribute("class"),
      hasDataSwBreadcrumb: nav.hasAttribute("data-sw-breadcrumb"),
      itemCount: nav.querySelectorAll('[data-slot="breadcrumb-item"]').length,
      linkCount: links.length,
      links,
      listClassName: list?.getAttribute("class"),
      listTagName: list?.tagName,
      pageAriaCurrent: pageNode?.getAttribute("aria-current"),
      pageAriaDisabled: pageNode?.getAttribute("aria-disabled"),
      pageRole: pageNode?.getAttribute("role"),
      pageText: pageNode?.textContent?.trim(),
      ellipsisAriaHidden: ellipsis?.getAttribute("aria-hidden"),
      ellipsisRole: ellipsis?.getAttribute("role"),
      ellipsisHasIcon: Boolean(ellipsis?.querySelector("svg")),
      ellipsisText: ellipsis?.textContent?.replace(/\s+/g, " ").trim(),
      separatorCount: separators.length,
      separatorsHaveIcons: separators.every((separator) => Boolean(separator.querySelector("svg"))),
      separatorsHidden: separators.every(
        (separator) =>
          separator.getAttribute("aria-hidden") === "true" &&
          separator.getAttribute("role") === "presentation",
      ),
    };
  });
  await expectText(page.locator("[data-runtime-breadcrumb-ref]"), "breadcrumb");
  if (
    breadcrumbState.ariaLabel !== "breadcrumb" ||
    breadcrumbState.hasDataSwBreadcrumb !== true ||
    breadcrumbState.className?.includes("runtime-breadcrumb-custom") !== true ||
    breadcrumbState.listTagName !== "OL" ||
    breadcrumbState.listClassName?.includes("text-muted-foreground") !== true ||
    breadcrumbState.itemCount !== 5 ||
    breadcrumbState.linkCount !== 2 ||
    JSON.stringify(breadcrumbState.links.map((link) => link.href)) !==
      JSON.stringify(["/", "/components"]) ||
    breadcrumbState.links.some(
      (link) => link.className?.includes("hover:text-foreground") !== true,
    ) ||
    breadcrumbState.asChildText !== "Custom child" ||
    breadcrumbState.asChildHasGeneratedLink !== false ||
    breadcrumbState.pageRole !== "link" ||
    breadcrumbState.pageAriaDisabled !== "true" ||
    breadcrumbState.pageAriaCurrent !== "page" ||
    breadcrumbState.pageText !== "Breadcrumb" ||
    breadcrumbState.ellipsisRole !== "presentation" ||
    breadcrumbState.ellipsisAriaHidden !== "true" ||
    breadcrumbState.ellipsisHasIcon !== true ||
    breadcrumbState.ellipsisText !== "More" ||
    breadcrumbState.separatorCount !== 4 ||
    breadcrumbState.separatorsHaveIcons !== true ||
    breadcrumbState.separatorsHidden !== true
  ) {
    throw new Error(
      `Expected React Breadcrumb anatomy with Starwind classes and ARIA, got ${JSON.stringify(
        breadcrumbState,
      )}.`,
    );
  }

  const separatorState = await page.evaluate(() => {
    const readSeparator = (selector) => {
      const separator = document.querySelector(selector);
      const style = separator instanceof HTMLElement ? getComputedStyle(separator) : null;

      return {
        ariaOrientation: separator?.getAttribute("aria-orientation"),
        className: separator?.getAttribute("class"),
        dataOrientation: separator?.getAttribute("data-orientation"),
        dataSlot: separator?.getAttribute("data-slot"),
        hasDataSwSeparator: separator?.hasAttribute("data-sw-separator") ?? null,
        height: style?.height ?? null,
        role: separator?.getAttribute("role"),
        width: style?.width ?? null,
      };
    };

    return {
      horizontal: readSeparator("#react-runtime-separator-horizontal"),
      vertical: readSeparator("#react-runtime-separator-vertical"),
    };
  });
  if (
    separatorState.horizontal.role !== "separator" ||
    separatorState.horizontal.ariaOrientation !== "horizontal" ||
    separatorState.horizontal.dataOrientation !== "horizontal" ||
    separatorState.horizontal.dataSlot !== "separator" ||
    separatorState.horizontal.hasDataSwSeparator !== true ||
    separatorState.horizontal.className?.includes("runtime-separator-custom") !== true ||
    separatorState.horizontal.height !== "1px" ||
    separatorState.vertical.role !== "separator" ||
    separatorState.vertical.ariaOrientation !== "vertical" ||
    separatorState.vertical.dataOrientation !== "vertical" ||
    separatorState.vertical.dataSlot !== "separator" ||
    separatorState.vertical.hasDataSwSeparator !== true ||
    separatorState.vertical.className?.includes("h-full") !== true ||
    separatorState.vertical.width !== "1px"
  ) {
    throw new Error(
      `Expected React Separator horizontal and vertical semantics, got ${JSON.stringify(
        separatorState,
      )}.`,
    );
  }

  const scrollAreaState = await page.evaluate(async () => {
    const readScrollArea = (selector) => {
      const root = document.querySelector(selector);
      const viewport = root?.querySelector("[data-sw-scroll-area-viewport]");
      const content = root?.querySelector("[data-sw-scroll-area-content]");
      const verticalScrollbar = root?.querySelector(
        '[data-sw-scroll-area-scrollbar][data-orientation="vertical"]',
      );
      const horizontalScrollbar = root?.querySelector(
        '[data-sw-scroll-area-scrollbar][data-orientation="horizontal"]',
      );
      const corner = root?.querySelector("[data-sw-scroll-area-corner]");

      const readScrollbar = (scrollbar) => {
        const style = scrollbar instanceof HTMLElement ? getComputedStyle(scrollbar) : null;
        const thumb = scrollbar?.querySelector("[data-sw-scroll-area-thumb]");

        return {
          className: scrollbar?.getAttribute("class"),
          display: style?.display ?? null,
          hasThumb: Boolean(thumb),
          id: scrollbar?.id,
        };
      };

      return {
        className: root?.getAttribute("class"),
        contentPresent: Boolean(content),
        cornerDisplay: corner instanceof HTMLElement ? getComputedStyle(corner).display : null,
        hasDataSwScrollArea: root?.hasAttribute("data-sw-scroll-area") ?? null,
        horizontalScrollbar: readScrollbar(horizontalScrollbar),
        tabIndex: viewport instanceof HTMLElement ? viewport.tabIndex : null,
        verticalScrollbar: readScrollbar(verticalScrollbar),
        viewportClassName: viewport?.getAttribute("class"),
      };
    };

    const defaultRoot = document.querySelector("#react-runtime-scroll-area-default");
    const defaultViewport = defaultRoot?.querySelector("[data-sw-scroll-area-viewport]");

    if (defaultViewport instanceof HTMLElement) {
      defaultViewport.scrollTop = 80;
      defaultViewport.dispatchEvent(new Event("scroll", { bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    return {
      defaultArea: readScrollArea("#react-runtime-scroll-area-default"),
      defaultOverflowYEnd: defaultRoot?.hasAttribute("data-overflow-y-end") ?? null,
      defaultOverflowYStart: defaultRoot?.hasAttribute("data-overflow-y-start") ?? null,
      twoAxisArea: readScrollArea("#react-runtime-scroll-area-both"),
    };
  });
  if (
    scrollAreaState.defaultArea.hasDataSwScrollArea !== true ||
    scrollAreaState.defaultArea.className?.includes("rounded-md") !== true ||
    scrollAreaState.defaultArea.viewportClassName?.includes("p-4") !== true ||
    scrollAreaState.defaultArea.contentPresent !== true ||
    scrollAreaState.defaultArea.tabIndex !== 0 ||
    scrollAreaState.defaultArea.verticalScrollbar.display !== "flex" ||
    scrollAreaState.defaultArea.verticalScrollbar.hasThumb !== true ||
    scrollAreaState.defaultOverflowYEnd !== true ||
    scrollAreaState.defaultOverflowYStart !== true ||
    scrollAreaState.twoAxisArea.hasDataSwScrollArea !== true ||
    scrollAreaState.twoAxisArea.horizontalScrollbar.id !==
      "react-runtime-scroll-area-both-horizontal-scrollbar" ||
    scrollAreaState.twoAxisArea.horizontalScrollbar.display !== "flex" ||
    scrollAreaState.twoAxisArea.horizontalScrollbar.hasThumb !== true ||
    scrollAreaState.twoAxisArea.verticalScrollbar.id !==
      "react-runtime-scroll-area-both-vertical-scrollbar" ||
    scrollAreaState.twoAxisArea.verticalScrollbar.display !== "flex" ||
    scrollAreaState.twoAxisArea.cornerDisplay !== "block"
  ) {
    throw new Error(
      `Expected React Scroll Area generated anatomy and overflow state, got ${JSON.stringify(
        scrollAreaState,
      )}.`,
    );
  }
}
