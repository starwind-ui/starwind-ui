export async function verifyReactSheetPortalCases({ page }) {
  const sheetDropdownState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-dropdown-sheet [data-slot='sheet-content']",
    );
    const floatingRoot = sheetContent?.querySelector(":scope > [data-floating-root]");
    const content = document.querySelector("#react-runtime-sheet-dropdown-content");
    const sheetTrigger = document.querySelector("#react-runtime-sheet-dropdown-sheet-trigger");
    const root = document.querySelector("#react-runtime-sheet-dropdown");
    const trigger = document.querySelector("#react-runtime-sheet-dropdown-trigger");

    return {
      className: content instanceof HTMLElement ? content.className : null,
      contentDataSlot: content?.getAttribute("data-slot"),
      contentHidden: content instanceof HTMLElement ? content.hidden : null,
      contentState: content?.getAttribute("data-state"),
      closeClassName:
        document.querySelector("#react-runtime-sheet-dropdown-close") instanceof HTMLElement
          ? document.querySelector("#react-runtime-sheet-dropdown-close").className
          : null,
      closeDataSlot: document
        .querySelector("#react-runtime-sheet-dropdown-close")
        ?.getAttribute("data-slot"),
      closeHasSheetAttribute:
        document
          .querySelector("#react-runtime-sheet-dropdown-close")
          ?.hasAttribute("data-sw-drawer-close") ?? null,
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
      sheetState: sheetContent?.getAttribute("data-state"),
      sheetTriggerClassName: sheetTrigger instanceof HTMLElement ? sheetTrigger.className : null,
      sheetTriggerDataSlot: sheetTrigger?.getAttribute("data-slot"),
      sheetTriggerHasAttribute: sheetTrigger?.hasAttribute("data-sw-drawer-trigger"),
      floatingRootContainsContent:
        floatingRoot instanceof HTMLElement && content instanceof HTMLElement
          ? floatingRoot.contains(content)
          : null,
      nearestFloatingRootSlot:
        content instanceof HTMLElement
          ? content.closest("[data-floating-root]")?.getAttribute("data-slot")
          : null,
      position: content instanceof HTMLElement ? getComputedStyle(content).position : null,
      role: content?.getAttribute("role"),
      rootContains:
        root instanceof HTMLElement && content instanceof HTMLElement
          ? root.contains(content)
          : null,
      side: content?.getAttribute("data-side"),
      styleLeft: content instanceof HTMLElement ? content.style.left : null,
      styleTop: content instanceof HTMLElement ? content.style.top : null,
      triggerClassName: trigger instanceof HTMLElement ? trigger.className : null,
      triggerDataSlot: trigger?.getAttribute("data-slot"),
      triggerExpanded: trigger?.getAttribute("aria-expanded"),
      triggerHasMenuAttribute: trigger?.hasAttribute("data-sw-menu-trigger"),
    };
  });
  if (
    sheetDropdownState.sheetOpen !== true ||
    sheetDropdownState.sheetState !== "open" ||
    sheetDropdownState.contentHidden !== false ||
    sheetDropdownState.contentState !== "open" ||
    sheetDropdownState.role !== "menu" ||
    !["left", "right"].includes(sheetDropdownState.side ?? "") ||
    sheetDropdownState.sheetTriggerDataSlot !== "button" ||
    sheetDropdownState.sheetTriggerHasAttribute !== true ||
    sheetDropdownState.floatingRootContainsContent !== true ||
    sheetDropdownState.nearestFloatingRootSlot !== "floating-root" ||
    sheetDropdownState.rootContains !== false ||
    sheetDropdownState.position !== "fixed" ||
    sheetDropdownState.styleLeft === "" ||
    sheetDropdownState.styleTop === "" ||
    sheetDropdownState.triggerExpanded !== "true" ||
    sheetDropdownState.triggerDataSlot !== "dropdown-trigger" ||
    sheetDropdownState.triggerHasMenuAttribute !== true ||
    sheetDropdownState.closeDataSlot !== "button" ||
    sheetDropdownState.closeHasSheetAttribute !== true ||
    sheetDropdownState.contentDataSlot !== "dropdown-content"
  ) {
    throw new Error(
      `Expected React Dropdown inside Sheet to portal into the sheet floating root, got ${JSON.stringify(
        sheetDropdownState,
      )}.`,
    );
  }

  await page.locator("#react-runtime-sheet-dropdown-sub-trigger").focus();
  await page.keyboard.press("ArrowRight");
  await page.locator("#react-runtime-sheet-dropdown-sub-content").waitFor({ state: "visible" });
  await page.waitForFunction(
    () => document.activeElement?.id === "react-runtime-sheet-dropdown-email",
  );
  const sheetDropdownSubmenuState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-dropdown-sheet [data-slot='sheet-content']",
    );
    const floatingRoot = sheetContent?.querySelector(":scope > [data-floating-root]");
    const menuContent = document.querySelector("#react-runtime-sheet-dropdown-content");
    const submenuContent = document.querySelector("#react-runtime-sheet-dropdown-sub-content");
    const trigger = document.querySelector("#react-runtime-sheet-dropdown-sub-trigger");

    return {
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
      menuHidden: menuContent instanceof HTMLElement ? menuContent.hidden : null,
      submenuHidden: submenuContent instanceof HTMLElement ? submenuContent.hidden : null,
      submenuPosition:
        submenuContent instanceof HTMLElement ? getComputedStyle(submenuContent).position : null,
      submenuState: submenuContent?.getAttribute("data-state"),
      activeElementId:
        document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
      nearestFloatingRootSlot:
        submenuContent instanceof HTMLElement
          ? submenuContent.closest("[data-floating-root]")?.getAttribute("data-slot")
          : null,
      triggerExpanded: trigger?.getAttribute("aria-expanded"),
      usesSheetFloatingRoot:
        floatingRoot instanceof HTMLElement && submenuContent instanceof HTMLElement
          ? floatingRoot.contains(submenuContent)
          : null,
    };
  });
  if (
    sheetDropdownSubmenuState.sheetOpen !== true ||
    sheetDropdownSubmenuState.menuHidden !== false ||
    sheetDropdownSubmenuState.submenuHidden !== false ||
    sheetDropdownSubmenuState.submenuState !== "open" ||
    sheetDropdownSubmenuState.nearestFloatingRootSlot !== "floating-root" ||
    sheetDropdownSubmenuState.submenuPosition !== "fixed" ||
    sheetDropdownSubmenuState.activeElementId !== "react-runtime-sheet-dropdown-email" ||
    sheetDropdownSubmenuState.triggerExpanded !== "true" ||
    sheetDropdownSubmenuState.usesSheetFloatingRoot !== true
  ) {
    throw new Error(
      `Expected React Dropdown submenu inside Sheet to stay in the sheet floating root, got ${JSON.stringify(
        sheetDropdownSubmenuState,
      )}.`,
    );
  }

  await page.locator("#react-runtime-sheet-dropdown-email").click();
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-sheet-dropdown-content");
    const submenu = document.querySelector("#react-runtime-sheet-dropdown-sub-content");
    const sheet = document.querySelector(
      "#react-runtime-sheet-dropdown-sheet [data-slot='sheet-content']",
    );

    return (
      content instanceof HTMLElement &&
      submenu instanceof HTMLElement &&
      sheet instanceof HTMLDialogElement &&
      content.hidden &&
      submenu.hidden &&
      sheet.open
    );
  });
  await page.getByRole("button", { name: "Close React sheet menu" }).click();
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);

  await page.getByRole("button", { name: "Open React sheet popover" }).click();
  await page.getByRole("heading", { name: "React sheet popover portal" }).waitFor();
  await page.locator("#react-runtime-sheet-popover-details-trigger").focus();
  await page.keyboard.press("Enter");
  await page.locator("#react-runtime-sheet-popover-details-content").waitFor({ state: "visible" });
  const sheetPopoverState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-popover [data-slot='sheet-content']",
    );
    const floatingRoot = sheetContent?.querySelector(":scope > [data-floating-root]");
    const content = document.querySelector("#react-runtime-sheet-popover-details-content");
    const sheetTrigger = document.querySelector("#react-runtime-sheet-popover-trigger");
    const root = document.querySelector("#react-runtime-sheet-popover-details");
    const trigger = document.querySelector("#react-runtime-sheet-popover-details-trigger");
    const close = document.querySelector("#react-runtime-sheet-popover-close");

    return {
      className: content instanceof HTMLElement ? content.className : null,
      contentDataSlot: content?.getAttribute("data-slot"),
      closeClassName: close instanceof HTMLElement ? close.className : null,
      closeDataSlot: close?.getAttribute("data-slot"),
      closeHasSheetAttribute: close?.hasAttribute("data-sw-drawer-close") ?? null,
      contentHidden: content instanceof HTMLElement ? content.hidden : null,
      contentState: content?.getAttribute("data-state"),
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
      sheetState: sheetContent?.getAttribute("data-state"),
      sheetTriggerClassName: sheetTrigger instanceof HTMLElement ? sheetTrigger.className : null,
      sheetTriggerDataSlot: sheetTrigger?.getAttribute("data-slot"),
      sheetTriggerHasAttribute: sheetTrigger?.hasAttribute("data-sw-drawer-trigger"),
      floatingRootContainsContent:
        floatingRoot instanceof HTMLElement && content instanceof HTMLElement
          ? floatingRoot.contains(content)
          : null,
      labelledBy: content?.getAttribute("aria-labelledby"),
      describedBy: content?.getAttribute("aria-describedby"),
      nearestFloatingRootSlot:
        content instanceof HTMLElement
          ? content.closest("[data-floating-root]")?.getAttribute("data-slot")
          : null,
      position: content instanceof HTMLElement ? getComputedStyle(content).position : null,
      role: content?.getAttribute("role"),
      rootContains:
        root instanceof HTMLElement && content instanceof HTMLElement
          ? root.contains(content)
          : null,
      side: content?.getAttribute("data-side"),
      styleLeft: content instanceof HTMLElement ? content.style.left : null,
      styleTop: content instanceof HTMLElement ? content.style.top : null,
      triggerClassName: trigger instanceof HTMLElement ? trigger.className : null,
      triggerDataSlot: trigger?.getAttribute("data-slot"),
      triggerExpanded: trigger?.getAttribute("aria-expanded"),
      triggerHasPopoverAttribute: trigger?.hasAttribute("data-sw-popover-trigger"),
    };
  });
  if (
    sheetPopoverState.sheetOpen !== true ||
    sheetPopoverState.sheetState !== "open" ||
    sheetPopoverState.contentHidden !== false ||
    sheetPopoverState.contentState !== "open" ||
    sheetPopoverState.role !== "dialog" ||
    !["left", "right"].includes(sheetPopoverState.side ?? "") ||
    !sheetPopoverState.labelledBy ||
    !sheetPopoverState.describedBy ||
    sheetPopoverState.sheetTriggerDataSlot !== "button" ||
    sheetPopoverState.sheetTriggerHasAttribute !== true ||
    sheetPopoverState.floatingRootContainsContent !== true ||
    sheetPopoverState.nearestFloatingRootSlot !== "floating-root" ||
    sheetPopoverState.rootContains !== false ||
    sheetPopoverState.position !== "fixed" ||
    sheetPopoverState.styleLeft === "" ||
    sheetPopoverState.styleTop === "" ||
    sheetPopoverState.triggerExpanded !== "true" ||
    sheetPopoverState.triggerDataSlot !== "popover-trigger" ||
    sheetPopoverState.triggerHasPopoverAttribute !== true ||
    sheetPopoverState.closeDataSlot !== "button" ||
    sheetPopoverState.closeHasSheetAttribute !== true ||
    sheetPopoverState.contentDataSlot !== "popover-content"
  ) {
    throw new Error(
      `Expected React Popover inside Sheet to portal into the sheet floating root, got ${JSON.stringify(
        sheetPopoverState,
      )}.`,
    );
  }

  await page.locator("#react-runtime-sheet-popover-nested-trigger").focus();
  await page.keyboard.press("Enter");
  await page.locator("#react-runtime-sheet-popover-nested-content").waitFor({ state: "visible" });
  const sheetNestedPopoverState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-popover [data-slot='sheet-content']",
    );
    const floatingRoot = sheetContent?.querySelector(":scope > [data-floating-root]");
    const parentContent = document.querySelector("#react-runtime-sheet-popover-details-content");
    const nestedContent = document.querySelector("#react-runtime-sheet-popover-nested-content");
    const trigger = document.querySelector("#react-runtime-sheet-popover-nested-trigger");

    return {
      describedBy: nestedContent?.getAttribute("aria-describedby"),
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
      labelledBy: nestedContent?.getAttribute("aria-labelledby"),
      nestedHidden: nestedContent instanceof HTMLElement ? nestedContent.hidden : null,
      nestedPosition:
        nestedContent instanceof HTMLElement ? getComputedStyle(nestedContent).position : null,
      nestedRootContains:
        document.querySelector("#react-runtime-sheet-popover-nested") instanceof HTMLElement &&
        nestedContent instanceof HTMLElement
          ? document.querySelector("#react-runtime-sheet-popover-nested").contains(nestedContent)
          : null,
      nestedSide: nestedContent?.getAttribute("data-side"),
      nestedState: nestedContent?.getAttribute("data-state"),
      role: nestedContent?.getAttribute("role"),
      nearestFloatingRootSlot:
        nestedContent instanceof HTMLElement
          ? nestedContent.closest("[data-floating-root]")?.getAttribute("data-slot")
          : null,
      parentHidden: parentContent instanceof HTMLElement ? parentContent.hidden : null,
      parentState: parentContent?.getAttribute("data-state"),
      triggerExpanded: trigger?.getAttribute("aria-expanded"),
      usesSheetFloatingRoot:
        floatingRoot instanceof HTMLElement &&
        parentContent instanceof HTMLElement &&
        nestedContent instanceof HTMLElement
          ? floatingRoot.contains(parentContent) && floatingRoot.contains(nestedContent)
          : null,
    };
  });
  if (
    sheetNestedPopoverState.sheetOpen !== true ||
    sheetNestedPopoverState.parentHidden !== false ||
    sheetNestedPopoverState.parentState !== "open" ||
    sheetNestedPopoverState.nestedHidden !== false ||
    sheetNestedPopoverState.nestedState !== "open" ||
    sheetNestedPopoverState.role !== "dialog" ||
    !sheetNestedPopoverState.labelledBy ||
    !sheetNestedPopoverState.describedBy ||
    !["left", "right"].includes(sheetNestedPopoverState.nestedSide ?? "") ||
    sheetNestedPopoverState.nearestFloatingRootSlot !== "floating-root" ||
    sheetNestedPopoverState.nestedRootContains !== false ||
    sheetNestedPopoverState.nestedPosition !== "fixed" ||
    sheetNestedPopoverState.triggerExpanded !== "true" ||
    sheetNestedPopoverState.usesSheetFloatingRoot !== true
  ) {
    throw new Error(
      `Expected nested React Popover inside Sheet to stay in the sheet floating root, got ${JSON.stringify(
        sheetNestedPopoverState,
      )}.`,
    );
  }

  await page.locator("#react-runtime-sheet-popover-close").click();
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);
  const sheetPopoverClosedState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-popover [data-slot='sheet-content']",
    );
    const parentContent = document.querySelector("#react-runtime-sheet-popover-details-content");
    const nestedContent = document.querySelector("#react-runtime-sheet-popover-nested-content");
    const parentTrigger = document.querySelector("#react-runtime-sheet-popover-details-trigger");
    const nestedTrigger = document.querySelector("#react-runtime-sheet-popover-nested-trigger");

    return {
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
      sheetState: sheetContent?.getAttribute("data-state"),
      nestedExpanded: nestedTrigger?.getAttribute("aria-expanded"),
      nestedHidden: nestedContent instanceof HTMLElement ? nestedContent.hidden : null,
      nestedState: nestedContent?.getAttribute("data-state"),
      parentExpanded: parentTrigger?.getAttribute("aria-expanded"),
      parentHidden: parentContent instanceof HTMLElement ? parentContent.hidden : null,
      parentState: parentContent?.getAttribute("data-state"),
    };
  });
  if (
    sheetPopoverClosedState.sheetOpen !== false ||
    sheetPopoverClosedState.sheetState !== "closed" ||
    sheetPopoverClosedState.parentHidden !== true ||
    sheetPopoverClosedState.parentState !== "closed" ||
    sheetPopoverClosedState.parentExpanded !== "false" ||
    sheetPopoverClosedState.nestedHidden !== true ||
    sheetPopoverClosedState.nestedState !== "closed" ||
    sheetPopoverClosedState.nestedExpanded !== "false"
  ) {
    throw new Error(
      `Expected closing React Sheet to reset open Popovers, got ${JSON.stringify(
        sheetPopoverClosedState,
      )}.`,
    );
  }

  await page.getByRole("button", { name: "Open React sheet accordion menu" }).click();
  await page.getByRole("heading", { name: "React sheet accordion navigation" }).waitFor();
  const sheetAccordionInitialState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-accordion [data-slot='sheet-content']",
    );
    const root = document.querySelector("#react-runtime-sheet-accordion-menu");
    const sheetTrigger = document.querySelector("#react-runtime-sheet-accordion-trigger");
    const close = document.querySelector("#react-runtime-sheet-accordion-close");
    const productsTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-products-trigger",
    );
    const productsContent = document.querySelector(
      "#react-runtime-sheet-accordion-products-content",
    );
    const servicesTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-services-trigger",
    );
    const servicesContent = document.querySelector(
      "#react-runtime-sheet-accordion-services-content",
    );
    const nav = document.querySelector("#react-runtime-sheet-accordion nav");

    return {
      accordionInsideSheet:
        sheetContent instanceof HTMLElement && root instanceof HTMLElement
          ? sheetContent.contains(root)
          : null,
      closeDataSlot: close?.getAttribute("data-slot"),
      closeHasSheetAttribute: close?.hasAttribute("data-sw-drawer-close") ?? null,
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
      sheetState: sheetContent?.getAttribute("data-state"),
      sheetTriggerClassName: sheetTrigger instanceof HTMLElement ? sheetTrigger.className : null,
      sheetTriggerDataSlot: sheetTrigger?.getAttribute("data-slot"),
      sheetTriggerHasAttribute: sheetTrigger?.hasAttribute("data-sw-drawer-trigger"),
      navLabel: nav?.getAttribute("aria-label"),
      productsExpanded: productsTrigger?.getAttribute("aria-expanded"),
      productsHidden: productsContent instanceof HTMLElement ? productsContent.hidden : null,
      productsState: productsContent?.getAttribute("data-state"),
      rootCollapsible: root?.hasAttribute("data-collapsible"),
      rootDataSlot: root?.getAttribute("data-slot"),
      rootType: root?.getAttribute("data-type"),
      servicesExpanded: servicesTrigger?.getAttribute("aria-expanded"),
      servicesHidden: servicesContent instanceof HTMLElement ? servicesContent.hidden : null,
      servicesState: servicesContent?.getAttribute("data-state"),
    };
  });
  if (
    sheetAccordionInitialState.sheetOpen !== true ||
    sheetAccordionInitialState.sheetState !== "open" ||
    sheetAccordionInitialState.accordionInsideSheet !== true ||
    sheetAccordionInitialState.rootDataSlot !== "accordion" ||
    sheetAccordionInitialState.rootType !== "single" ||
    sheetAccordionInitialState.rootCollapsible !== true ||
    sheetAccordionInitialState.navLabel !== "React sheet accordion navigation" ||
    sheetAccordionInitialState.sheetTriggerDataSlot !== "button" ||
    sheetAccordionInitialState.sheetTriggerHasAttribute !== true ||
    sheetAccordionInitialState.closeDataSlot !== "button" ||
    sheetAccordionInitialState.closeHasSheetAttribute !== true ||
    sheetAccordionInitialState.productsExpanded !== "false" ||
    sheetAccordionInitialState.productsHidden !== true ||
    sheetAccordionInitialState.productsState !== "closed" ||
    sheetAccordionInitialState.servicesExpanded !== "false" ||
    sheetAccordionInitialState.servicesHidden !== true ||
    sheetAccordionInitialState.servicesState !== "closed"
  ) {
    throw new Error(
      `Expected React Sheet accordion menu to initialize closed inside the sheet, got ${JSON.stringify(
        sheetAccordionInitialState,
      )}.`,
    );
  }

  const sheetAccordionProductsTabSequence = [];
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press("Tab");
    const activeId = await page.evaluate(() =>
      document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
    );
    sheetAccordionProductsTabSequence.push(activeId);
    if (activeId === "react-runtime-sheet-accordion-products-trigger") break;
  }
  if (
    !sheetAccordionProductsTabSequence.includes("react-runtime-sheet-accordion-products-trigger")
  ) {
    throw new Error(
      `Expected Tab navigation to reach the React Sheet accordion Products trigger, got ${JSON.stringify(
        sheetAccordionProductsTabSequence,
      )}.`,
    );
  }
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-sheet-accordion-products-content");
    return (
      content instanceof HTMLElement &&
      !content.hidden &&
      content.getAttribute("data-state") === "open"
    );
  });
  const sheetAccordionProductsState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-accordion [data-slot='sheet-content']",
    );
    const productsTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-products-trigger",
    );
    const productsContent = document.querySelector(
      "#react-runtime-sheet-accordion-products-content",
    );
    const servicesTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-services-trigger",
    );
    const servicesContent = document.querySelector(
      "#react-runtime-sheet-accordion-services-content",
    );

    return {
      activeElementId:
        document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
      productsExpanded: productsTrigger?.getAttribute("aria-expanded"),
      productsHidden: productsContent instanceof HTMLElement ? productsContent.hidden : null,
      productsState: productsContent?.getAttribute("data-state"),
      servicesExpanded: servicesTrigger?.getAttribute("aria-expanded"),
      servicesHidden: servicesContent instanceof HTMLElement ? servicesContent.hidden : null,
      servicesState: servicesContent?.getAttribute("data-state"),
    };
  });
  if (
    sheetAccordionProductsState.sheetOpen !== true ||
    sheetAccordionProductsState.activeElementId !==
      "react-runtime-sheet-accordion-products-trigger" ||
    sheetAccordionProductsState.productsExpanded !== "true" ||
    sheetAccordionProductsState.productsHidden !== false ||
    sheetAccordionProductsState.productsState !== "open" ||
    sheetAccordionProductsState.servicesExpanded !== "false" ||
    sheetAccordionProductsState.servicesHidden !== true ||
    sheetAccordionProductsState.servicesState !== "closed"
  ) {
    throw new Error(
      `Expected keyboard opening Products in React Sheet accordion to keep the sheet open, got ${JSON.stringify(
        sheetAccordionProductsState,
      )}.`,
    );
  }

  const sheetAccordionServicesTabSequence = [];
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press("Tab");
    const activeId = await page.evaluate(() =>
      document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
    );
    sheetAccordionServicesTabSequence.push(activeId);
    if (activeId === "react-runtime-sheet-accordion-services-trigger") break;
  }
  if (
    !sheetAccordionServicesTabSequence.includes("react-runtime-sheet-accordion-services-trigger")
  ) {
    throw new Error(
      `Expected Tab navigation to reach the React Sheet accordion Services trigger, got ${JSON.stringify(
        sheetAccordionServicesTabSequence,
      )}.`,
    );
  }
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => {
    const productsContent = document.querySelector(
      "#react-runtime-sheet-accordion-products-content",
    );
    const servicesContent = document.querySelector(
      "#react-runtime-sheet-accordion-services-content",
    );
    return (
      productsContent instanceof HTMLElement &&
      servicesContent instanceof HTMLElement &&
      productsContent.hidden &&
      productsContent.getAttribute("data-state") === "closed" &&
      !servicesContent.hidden &&
      servicesContent.getAttribute("data-state") === "open"
    );
  });
  const sheetAccordionServicesState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-accordion [data-slot='sheet-content']",
    );
    const productsTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-products-trigger",
    );
    const productsContent = document.querySelector(
      "#react-runtime-sheet-accordion-products-content",
    );
    const servicesTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-services-trigger",
    );
    const servicesContent = document.querySelector(
      "#react-runtime-sheet-accordion-services-content",
    );

    return {
      activeElementId:
        document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
      productsExpanded: productsTrigger?.getAttribute("aria-expanded"),
      productsHidden: productsContent instanceof HTMLElement ? productsContent.hidden : null,
      productsState: productsContent?.getAttribute("data-state"),
      servicesExpanded: servicesTrigger?.getAttribute("aria-expanded"),
      servicesHidden: servicesContent instanceof HTMLElement ? servicesContent.hidden : null,
      servicesState: servicesContent?.getAttribute("data-state"),
    };
  });
  if (
    sheetAccordionServicesState.sheetOpen !== true ||
    sheetAccordionServicesState.activeElementId !==
      "react-runtime-sheet-accordion-services-trigger" ||
    sheetAccordionServicesState.productsExpanded !== "false" ||
    sheetAccordionServicesState.productsHidden !== true ||
    sheetAccordionServicesState.productsState !== "closed" ||
    sheetAccordionServicesState.servicesExpanded !== "true" ||
    sheetAccordionServicesState.servicesHidden !== false ||
    sheetAccordionServicesState.servicesState !== "open"
  ) {
    throw new Error(
      `Expected keyboard switching Services in React Sheet accordion to keep one open item, got ${JSON.stringify(
        sheetAccordionServicesState,
      )}.`,
    );
  }

  await page.keyboard.press("Enter");
  await page.waitForFunction(() => {
    const productsContent = document.querySelector(
      "#react-runtime-sheet-accordion-products-content",
    );
    const servicesContent = document.querySelector(
      "#react-runtime-sheet-accordion-services-content",
    );
    return (
      productsContent instanceof HTMLElement &&
      servicesContent instanceof HTMLElement &&
      productsContent.hidden &&
      productsContent.getAttribute("data-state") === "closed" &&
      servicesContent.hidden &&
      servicesContent.getAttribute("data-state") === "closed"
    );
  });
  const sheetAccordionCollapsedState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-accordion [data-slot='sheet-content']",
    );
    const productsTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-products-trigger",
    );
    const productsContent = document.querySelector(
      "#react-runtime-sheet-accordion-products-content",
    );
    const servicesTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-services-trigger",
    );
    const servicesContent = document.querySelector(
      "#react-runtime-sheet-accordion-services-content",
    );

    return {
      activeElementId:
        document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
      productsExpanded: productsTrigger?.getAttribute("aria-expanded"),
      productsHidden: productsContent instanceof HTMLElement ? productsContent.hidden : null,
      productsState: productsContent?.getAttribute("data-state"),
      servicesExpanded: servicesTrigger?.getAttribute("aria-expanded"),
      servicesHidden: servicesContent instanceof HTMLElement ? servicesContent.hidden : null,
      servicesState: servicesContent?.getAttribute("data-state"),
    };
  });
  if (
    sheetAccordionCollapsedState.sheetOpen !== true ||
    sheetAccordionCollapsedState.activeElementId !==
      "react-runtime-sheet-accordion-services-trigger" ||
    sheetAccordionCollapsedState.productsExpanded !== "false" ||
    sheetAccordionCollapsedState.productsHidden !== true ||
    sheetAccordionCollapsedState.productsState !== "closed" ||
    sheetAccordionCollapsedState.servicesExpanded !== "false" ||
    sheetAccordionCollapsedState.servicesHidden !== true ||
    sheetAccordionCollapsedState.servicesState !== "closed"
  ) {
    throw new Error(
      `Expected pressing an open React Sheet accordion item to close it, got ${JSON.stringify(
        sheetAccordionCollapsedState,
      )}.`,
    );
  }

  await page.getByRole("button", { name: "Close Menu" }).click();
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);
  const sheetAccordionClosedState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-accordion [data-slot='sheet-content']",
    );
    const root = document.querySelector("#react-runtime-sheet-accordion-menu");
    const productsTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-products-trigger",
    );
    const servicesTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-services-trigger",
    );

    return {
      activeElementId:
        document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
      sheetHidden: sheetContent instanceof HTMLElement ? sheetContent.hidden : null,
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
      sheetState: sheetContent?.getAttribute("data-state"),
      productsExpanded: productsTrigger?.getAttribute("aria-expanded"),
      productsVisible:
        productsTrigger instanceof HTMLElement ? productsTrigger.getClientRects().length > 0 : null,
      rootInsideClosedSheet:
        sheetContent instanceof HTMLElement && root instanceof HTMLElement
          ? sheetContent.contains(root) && !sheetContent.hasAttribute("open")
          : null,
      servicesExpanded: servicesTrigger?.getAttribute("aria-expanded"),
      servicesVisible:
        servicesTrigger instanceof HTMLElement ? servicesTrigger.getClientRects().length > 0 : null,
    };
  });
  if (
    sheetAccordionClosedState.activeElementId !== "react-runtime-sheet-accordion-trigger" ||
    sheetAccordionClosedState.sheetHidden !== true ||
    sheetAccordionClosedState.sheetOpen !== false ||
    sheetAccordionClosedState.sheetState !== "closed" ||
    sheetAccordionClosedState.rootInsideClosedSheet !== true ||
    sheetAccordionClosedState.productsVisible !== false ||
    sheetAccordionClosedState.servicesVisible !== false
  ) {
    throw new Error(
      `Expected closing React Sheet accordion menu to hide the sheet and return focus, got ${JSON.stringify(
        sheetAccordionClosedState,
      )}.`,
    );
  }

  await page.getByRole("button", { name: "Open React sheet FAQ" }).click();
  await page.getByRole("heading", { name: "React sheet FAQ accordion" }).waitFor();
  const sheetAccordionFaqInitialState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-accordion-faq [data-slot='sheet-content']",
    );
    const root = document.querySelector("#react-runtime-sheet-accordion-faq-menu");
    const availabilityTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-faq-availability-trigger",
    );
    const availabilityContent = document.querySelector(
      "#react-runtime-sheet-accordion-faq-availability-content",
    );

    return {
      availabilityExpanded: availabilityTrigger?.getAttribute("aria-expanded"),
      availabilityHidden:
        availabilityContent instanceof HTMLElement ? availabilityContent.hidden : null,
      availabilityState: availabilityContent?.getAttribute("data-state"),
      rootCollapsible: root?.hasAttribute("data-collapsible"),
      rootDefaultValue: root?.getAttribute("data-default-value"),
      rootType: root?.getAttribute("data-type"),
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
    };
  });
  if (
    sheetAccordionFaqInitialState.sheetOpen !== true ||
    sheetAccordionFaqInitialState.rootType !== "single" ||
    sheetAccordionFaqInitialState.rootCollapsible !== true ||
    sheetAccordionFaqInitialState.rootDefaultValue !== "availability" ||
    sheetAccordionFaqInitialState.availabilityExpanded !== "true" ||
    sheetAccordionFaqInitialState.availabilityHidden !== false ||
    sheetAccordionFaqInitialState.availabilityState !== "open"
  ) {
    throw new Error(
      `Expected React Sheet FAQ accordion to start with a collapsible default-open item, got ${JSON.stringify(
        sheetAccordionFaqInitialState,
      )}.`,
    );
  }
  await page.locator("#react-runtime-sheet-accordion-faq-availability-trigger").click();
  await page.waitForFunction(() => {
    const content = document.querySelector(
      "#react-runtime-sheet-accordion-faq-availability-content",
    );
    return (
      content instanceof HTMLElement &&
      content.hidden &&
      content.getAttribute("data-state") === "closed"
    );
  });
  const sheetAccordionFaqCollapsedState = await page.evaluate(() => {
    const sheetContent = document.querySelector(
      "#react-runtime-sheet-accordion-faq [data-slot='sheet-content']",
    );
    const availabilityTrigger = document.querySelector(
      "#react-runtime-sheet-accordion-faq-availability-trigger",
    );
    const availabilityContent = document.querySelector(
      "#react-runtime-sheet-accordion-faq-availability-content",
    );

    return {
      availabilityExpanded: availabilityTrigger?.getAttribute("aria-expanded"),
      availabilityHidden:
        availabilityContent instanceof HTMLElement ? availabilityContent.hidden : null,
      availabilityState: availabilityContent?.getAttribute("data-state"),
      sheetOpen: sheetContent instanceof HTMLDialogElement ? sheetContent.open : null,
    };
  });
  if (
    sheetAccordionFaqCollapsedState.sheetOpen !== true ||
    sheetAccordionFaqCollapsedState.availabilityExpanded !== "false" ||
    sheetAccordionFaqCollapsedState.availabilityHidden !== true ||
    sheetAccordionFaqCollapsedState.availabilityState !== "closed"
  ) {
    throw new Error(
      `Expected React Sheet FAQ accordion default item to close in-place, got ${JSON.stringify(
        sheetAccordionFaqCollapsedState,
      )}.`,
    );
  }
  await page.getByRole("button", { name: "Close FAQ" }).click();
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);
}
