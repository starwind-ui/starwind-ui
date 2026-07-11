export async function verifyHoverCardCases({ page, ids, label }) {
  await page.locator(`#${ids.demo}`).scrollIntoViewIfNeeded();

  const initialState = await page.evaluate(readHoverCardState, {
    asChildTrigger: ids.asChildTrigger,
    demo: ids.demo,
  });

  for (const side of ["top", "right", "bottom", "left"]) {
    const triggerId = ids.sideTrigger(side);
    const contentId = ids.sideContent(side);

    await page.locator(`#${triggerId}`).hover();
    await page.locator(`#${contentId}`).waitFor({ state: "visible" });
    await waitForFloatingPosition(page, { contentId, expectedSide: side, triggerId });

    const sideState = await page.evaluate(readOpenContentState, {
      contentId,
      expectedSide: side,
      triggerId,
    });

    if (
      sideState.hidden !== false ||
      sideState.state !== "open" ||
      sideState.side !== side ||
      sideState.align !== "center" ||
      sideState.role !== "tooltip" ||
      sideState.positionerSlot !== "hover-card-positioner" ||
      sideState.positionerParentTag !== "BODY" ||
      sideState.positionerPosition !== "fixed" ||
      sideState.positionerStyleLeft === "" ||
      sideState.positionerStyleTop === "" ||
      sideState.geometryMatches !== true ||
      sideState.contentSlot !== "hover-card-content" ||
      sideState.triggerState !== "open" ||
      sideState.triggerDescribedBy !== contentId
    ) {
      throw new Error(
        `Expected ${label} HoverCard ${side} example to open with requested placement, got ${JSON.stringify(
          sideState,
        )}.`,
      );
    }

    await page.mouse.move(0, 0);
    await page.waitForFunction(
      ({ contentId }) =>
        document.getElementById(contentId)?.getAttribute("data-state") === "closed",
      { contentId },
    );
  }

  await page.locator(`#${ids.alignedTrigger}`).hover();
  await page.locator(`#${ids.alignedContent}`).waitFor({ state: "visible" });
  await waitForFloatingPosition(page);
  const alignedState = await page.evaluate(readOpenContentState, {
    contentId: ids.alignedContent,
    triggerId: ids.alignedTrigger,
  });
  if (
    alignedState.side !== "bottom" ||
    alignedState.align !== "end" ||
    alignedState.sideOffset !== "12" ||
    alignedState.inlineAnimationDuration !== "" ||
    alignedState.contentClass?.includes("duration-[160ms]") !== true
  ) {
    throw new Error(
      `Expected ${label} HoverCard aligned example to expose align=end, sideOffset=12, and duration class timing, got ${JSON.stringify(
        alignedState,
      )}.`,
    );
  }

  await page.mouse.move(0, 0);
  await page.waitForFunction(
    ({ contentId }) => document.getElementById(contentId)?.getAttribute("data-state") === "closed",
    { contentId: ids.alignedContent },
  );

  await page.locator(`#${ids.asChildTrigger}`).hover();
  await page.locator(`#${ids.asChildContent}`).waitFor({ state: "visible" });
  await waitForFloatingPosition(page);
  const asChildState = await page.evaluate(readAsChildContentState, {
    contentId: ids.asChildContent,
    triggerId: ids.asChildTrigger,
  });
  if (
    asChildState.href !== ids.asChildHref ||
    asChildState.triggerDescribedBy !== ids.asChildContent ||
    asChildState.triggerHasDataSw !== true ||
    asChildState.wrapperHasDataSw !== false ||
    asChildState.wrapperHasAsChild !== false ||
    (ids.wrapperDisplay && asChildState.wrapperDisplay !== ids.wrapperDisplay) ||
    asChildState.hidden !== false ||
    asChildState.side !== ids.asChildSide ||
    asChildState.align !== ids.asChildAlign
  ) {
    throw new Error(
      `Expected ${label} HoverCard asChild trigger to transfer runtime attributes to the supplied anchor, got ${JSON.stringify(
        asChildState,
      )}.`,
    );
  }

  await page.mouse.move(0, 0);
  await page.waitForFunction(
    ({ contentId }) => document.getElementById(contentId)?.getAttribute("data-state") === "closed",
    { contentId: ids.asChildContent },
  );

  await page.locator(`#${ids.asChildTrigger}`).focus();
  await page.locator(`#${ids.asChildContent}`).waitFor({ state: "visible" });
  await waitForFloatingPosition(page);
  const focusedAsChildState = await page.evaluate(readAsChildContentState, {
    contentId: ids.asChildContent,
    triggerId: ids.asChildTrigger,
  });
  if (
    focusedAsChildState.hidden !== false ||
    focusedAsChildState.state !== "open" ||
    focusedAsChildState.triggerState !== "open" ||
    focusedAsChildState.triggerDescribedBy !== ids.asChildContent
  ) {
    throw new Error(
      `Expected ${label} HoverCard asChild trigger to open from focus with tooltip description, got ${JSON.stringify(
        focusedAsChildState,
      )}.`,
    );
  }

  await page.keyboard.press("Tab");
  await page.waitForFunction(
    ({ contentId }) => document.getElementById(contentId)?.getAttribute("data-state") === "closed",
    { contentId: ids.asChildContent },
  );

  await page.locator(`#${ids.hoverableTrigger}`).hover();
  await page.locator(`#${ids.hoverableContent}`).waitFor({ state: "visible" });
  await page.locator(`#${ids.hoverableContent}`).hover();
  await page.waitForTimeout(325);
  const hoverableState = await page.evaluate(readOpenContentState, {
    contentId: ids.hoverableContent,
    triggerId: ids.hoverableTrigger,
  });
  if (hoverableState.hidden !== false || hoverableState.state !== "open") {
    throw new Error(
      `Expected ${label} HoverCard hoverable content to remain open while popup is hovered, got ${JSON.stringify(
        hoverableState,
      )}.`,
    );
  }

  await page.mouse.move(0, 0);
  await page.waitForFunction(
    ({ contentId }) => document.getElementById(contentId)?.getAttribute("data-state") === "closed",
    { contentId: ids.hoverableContent },
  );

  await page.locator(`#${ids.nonHoverableTrigger}`).hover();
  await page.locator(`#${ids.nonHoverableContent}`).waitFor({ state: "visible" });
  await page.locator(`#${ids.nonHoverableContent}`).hover();
  await page.waitForFunction(
    ({ contentId }) => document.getElementById(contentId)?.getAttribute("data-state") === "closed",
    { contentId: ids.nonHoverableContent },
  );

  if (ids.controlledTrigger && ids.controlledContent) {
    await page.locator(`#${ids.controlledTrigger}`).hover();
    await page.waitForFunction(
      ({ contentId }) => document.getElementById(contentId)?.getAttribute("data-state") === "open",
      { contentId: ids.controlledContent },
    );
    await waitForFloatingPosition(page);
    const controlledOpenState = await page.evaluate(readOpenContentState, {
      contentId: ids.controlledContent,
      triggerId: ids.controlledTrigger,
    });
    const controlledRootOpenState = ids.controlledRoot
      ? await page
          .locator(`#${ids.controlledRoot}`)
          .getAttribute("data-runtime-controlled-hover-card")
      : undefined;

    await page.mouse.move(0, 0);
    await page.waitForFunction(
      ({ contentId }) =>
        document.getElementById(contentId)?.getAttribute("data-state") === "closed",
      { contentId: ids.controlledContent },
    );
    const controlledClosedState = await page.evaluate(readOpenContentState, {
      contentId: ids.controlledContent,
      triggerId: ids.controlledTrigger,
    });
    const controlledRootClosedState = ids.controlledRoot
      ? await page
          .locator(`#${ids.controlledRoot}`)
          .getAttribute("data-runtime-controlled-hover-card")
      : undefined;

    if (
      controlledOpenState.hidden !== false ||
      controlledOpenState.state !== "open" ||
      controlledOpenState.side !== "right" ||
      controlledOpenState.align !== "start" ||
      controlledClosedState.state !== "closed" ||
      controlledClosedState.triggerState !== "closed" ||
      (ids.controlledRoot && controlledRootOpenState !== "open") ||
      (ids.controlledRoot && controlledRootClosedState !== "closed")
    ) {
      throw new Error(
        `Expected ${label} controlled HoverCard example to open and close from React state, got ${JSON.stringify(
          {
            controlledClosedState,
            controlledOpenState,
            controlledRootClosedState,
            controlledRootOpenState,
          },
        )}.`,
      );
    }
  }

  if (
    initialState.rootCount < ids.expectedRootCount ||
    initialState.openRootCount !== 0 ||
    initialState.asChildTriggerTag !== "A"
  ) {
    throw new Error(
      `Expected ${label} HoverCard initial demo state to expose closed roots and asChild anchor, got ${JSON.stringify(
        initialState,
      )}.`,
    );
  }
}

async function waitForFloatingPosition(page, options = undefined) {
  if (options?.expectedSide) {
    await page.waitForFunction(({ contentId, expectedSide, triggerId }) => {
      const content = document.getElementById(contentId);
      const trigger = document.getElementById(triggerId);
      const positioner = content?.parentElement;
      const contentRect = content instanceof HTMLElement ? content.getBoundingClientRect() : null;
      const triggerRect = trigger instanceof HTMLElement ? trigger.getBoundingClientRect() : null;
      const tolerance = 4;
      const geometryMatches =
        contentRect && triggerRect
          ? expectedSide === "top"
            ? contentRect.bottom <= triggerRect.top + tolerance
            : expectedSide === "right"
              ? contentRect.left >= triggerRect.right - tolerance
              : expectedSide === "left"
                ? contentRect.right <= triggerRect.left + tolerance
                : contentRect.top >= triggerRect.bottom - tolerance
          : false;

      return (
        positioner instanceof HTMLElement &&
        positioner.style.left !== "" &&
        positioner.style.top !== "" &&
        geometryMatches
      );
    }, options);
    return;
  }

  await page.waitForTimeout(50);
}

function readHoverCardState(ids) {
  return {
    asChildTriggerTag: document.getElementById(ids.asChildTrigger)?.tagName ?? null,
    openRootCount: document.querySelectorAll(
      `#${ids.demo} [data-slot='hover-card'][data-state='open']`,
    ).length,
    rootCount: document.querySelectorAll(
      `#${ids.demo} [data-slot='hover-card'][data-sw-preview-card]`,
    ).length,
  };
}

function readAsChildContentState({ contentId, triggerId }) {
  const content = document.getElementById(contentId);
  const trigger = document.getElementById(triggerId);
  const positioner = content?.parentElement;
  const wrapper = trigger?.parentElement;

  return {
    align: content?.getAttribute("data-align") ?? null,
    contentClass: content?.getAttribute("class") ?? null,
    contentSlot: content?.getAttribute("data-slot") ?? null,
    hidden: content instanceof HTMLElement ? content.hidden : null,
    inlineAnimationDuration:
      content instanceof HTMLElement ? content.style.animationDuration : null,
    href: trigger?.getAttribute("href") ?? null,
    positionerParentTag: positioner?.parentElement?.tagName ?? null,
    positionerPosition:
      positioner instanceof HTMLElement ? getComputedStyle(positioner).position : null,
    positionerSlot: positioner?.getAttribute("data-slot") ?? null,
    role: content?.getAttribute("role") ?? null,
    side: content?.getAttribute("data-side") ?? null,
    sideOffset: content?.getAttribute("data-side-offset") ?? null,
    state: content?.getAttribute("data-state") ?? null,
    triggerDescribedBy: trigger?.getAttribute("aria-describedby") ?? null,
    triggerHasDataSw:
      trigger instanceof HTMLElement ? trigger.hasAttribute("data-sw-preview-card-trigger") : null,
    triggerState: trigger?.getAttribute("data-state") ?? null,
    wrapperDisplay: wrapper instanceof HTMLElement ? getComputedStyle(wrapper).display : null,
    wrapperHasAsChild:
      wrapper instanceof HTMLElement ? wrapper.hasAttribute("data-as-child") : null,
    wrapperHasDataSw:
      wrapper instanceof HTMLElement ? wrapper.hasAttribute("data-sw-preview-card-trigger") : null,
  };
}

function readOpenContentState({ contentId, expectedSide, triggerId }) {
  const content = document.getElementById(contentId);
  const trigger = document.getElementById(triggerId);
  const positioner = content?.parentElement;
  const contentRect = content instanceof HTMLElement ? content.getBoundingClientRect() : null;
  const triggerRect = trigger instanceof HTMLElement ? trigger.getBoundingClientRect() : null;
  const tolerance = 4;
  const geometryMatches =
    contentRect && triggerRect && expectedSide
      ? expectedSide === "top"
        ? contentRect.bottom <= triggerRect.top + tolerance
        : expectedSide === "right"
          ? contentRect.left >= triggerRect.right - tolerance
          : expectedSide === "left"
            ? contentRect.right <= triggerRect.left + tolerance
            : contentRect.top >= triggerRect.bottom - tolerance
      : null;

  return {
    align: content?.getAttribute("data-align") ?? null,
    contentClass: content?.getAttribute("class") ?? null,
    contentSlot: content?.getAttribute("data-slot") ?? null,
    hidden: content instanceof HTMLElement ? content.hidden : null,
    inlineAnimationDuration:
      content instanceof HTMLElement ? content.style.animationDuration : null,
    positionerParentTag: positioner?.parentElement?.tagName ?? null,
    positionerPosition:
      positioner instanceof HTMLElement ? getComputedStyle(positioner).position : null,
    positionerStyleLeft: positioner instanceof HTMLElement ? positioner.style.left : null,
    positionerStyleTop: positioner instanceof HTMLElement ? positioner.style.top : null,
    positionerSlot: positioner?.getAttribute("data-slot") ?? null,
    role: content?.getAttribute("role") ?? null,
    side: content?.getAttribute("data-side") ?? null,
    sideOffset: content?.getAttribute("data-side-offset") ?? null,
    state: content?.getAttribute("data-state") ?? null,
    triggerDescribedBy: trigger?.getAttribute("aria-describedby") ?? null,
    geometryMatches,
    triggerState: trigger?.getAttribute("data-state") ?? null,
  };
}
