export async function verifySidebarCases({ page, ids, label, expectations = {} }) {
  const expected = {
    badgeText: "12",
    containerPosition: "absolute",
    firstMenuLinkHref: "#",
    minMenuActionCount: 1,
    minMenuButtonCount: 7,
    minSkeletonCount: 1,
    minSubButtonCount: 2,
    minTooltipButtonCount: 5,
    shortcutWhileInputFocused: true,
    ...expectations,
  };
  const demo = page.locator(`#${ids.demo}`);
  await demo.scrollIntoViewIfNeeded();

  await page.waitForFunction(
    ({ demoId }) => {
      const root = document.getElementById(demoId);
      const provider = root?.querySelector('[data-slot="sidebar-provider"]');
      const sidebar = root?.querySelector("[data-sw-sidebar]");
      const trigger = root?.querySelector("[data-sw-sidebar-trigger]");

      return (
        provider instanceof HTMLElement &&
        sidebar instanceof HTMLElement &&
        trigger instanceof HTMLElement &&
        provider.getAttribute("data-state") === "expanded" &&
        trigger.getAttribute("aria-expanded") === "true"
      );
    },
    { demoId: ids.demo },
  );

  const initialState = await page.evaluate(readSidebarState, ids);
  const tooltipLayoutState = await page.evaluate(readSidebarTooltipLayoutState, ids);

  await demo.getByRole("button", { name: /John Doe/ }).click();
  await page.waitForFunction(() => {
    const content = Array.from(document.querySelectorAll('[data-slot="dropdown-content"]')).find(
      (element) =>
        element instanceof HTMLElement &&
        element.textContent?.includes("Upgrade to Pro") &&
        element.getAttribute("data-state") === "open" &&
        !element.hidden &&
        element.getBoundingClientRect().width > 0,
    );

    return content instanceof HTMLElement;
  });
  const footerDropdownState = await page.evaluate(readSidebarFooterDropdownState, ids);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    return !Array.from(document.querySelectorAll('[data-slot="dropdown-content"]')).some(
      (element) =>
        element instanceof HTMLElement &&
        element.textContent?.includes("Upgrade to Pro") &&
        element.getAttribute("data-state") === "open" &&
        !element.hidden,
    );
  });

  await page.locator(`#${ids.trigger}`).click();
  await page.waitForFunction(
    ({ demoId }) => {
      const root = document.getElementById(demoId);
      const provider = root?.querySelector('[data-slot="sidebar-provider"]');
      const trigger = root?.querySelector("[data-sw-sidebar-trigger]");

      return (
        provider?.getAttribute("data-state") === "collapsed" &&
        trigger?.getAttribute("aria-expanded") === "false" &&
        document.documentElement.getAttribute("data-starwind-sidebar-tooltips") === "enabled"
      );
    },
    { demoId: ids.demo },
  );
  await page.waitForTimeout(250);
  const collapsedByTrigger = await page.evaluate(readSidebarState, ids);
  const collapsedLabelLayoutState = await page.evaluate(readCollapsedSidebarGroupLabelState, ids);
  const collapsedTooltipPositionState = await readSidebarTooltipPositionState(page, ids);
  await dismissSidebarTooltip(page, ids);

  await page.keyboard.down("Control");
  await page.keyboard.press("b");
  await page.keyboard.up("Control");
  await page.waitForFunction(
    ({ demoId }) => {
      const provider = document
        .getElementById(demoId)
        ?.querySelector('[data-slot="sidebar-provider"]');

      return provider?.getAttribute("data-state") === "expanded";
    },
    { demoId: ids.demo },
  );
  const expandedByShortcut = await page.evaluate(readSidebarState, ids);

  let shortcutWhileInputFocused = expandedByShortcut;
  if (expected.shortcutWhileInputFocused) {
    await page.locator(`#${ids.demo} [data-slot="sidebar-input"]`).first().focus();
    await page.keyboard.down("Control");
    await page.keyboard.press("b");
    await page.keyboard.up("Control");
    await page.waitForTimeout(50);
    shortcutWhileInputFocused = await page.evaluate(readSidebarState, ids);
  }

  await page.locator(`#${ids.demo} [data-sw-sidebar-rail]`).first().click();
  await page.waitForFunction(
    ({ demoId }) => {
      const provider = document
        .getElementById(demoId)
        ?.querySelector('[data-slot="sidebar-provider"]');

      return provider?.getAttribute("data-state") === "collapsed";
    },
    { demoId: ids.demo },
  );
  const collapsedByRail = await page.evaluate(readSidebarState, ids);

  await page.setViewportSize({ height: 900, width: 500 });
  await page.locator(`#${ids.trigger}`).click();
  await page.waitForFunction(
    ({ demoId }) => {
      const root = document.getElementById(demoId);
      const provider = root?.querySelector('[data-slot="sidebar-provider"]');
      const sheetContent = root?.querySelector(
        '[data-slot="sheet-content"][data-sidebar="sidebar"]',
      );

      return (
        provider?.getAttribute("data-mobile-open") === "true" &&
        sheetContent?.getAttribute("data-state") === "open"
      );
    },
    { demoId: ids.demo },
  );
  const openedMobileSheet = await page.evaluate(readSidebarState, ids);
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.waitForFunction(
    ({ demoId }) => {
      const root = document.getElementById(demoId);
      const provider = root?.querySelector('[data-slot="sidebar-provider"]');
      const sheetContent = root?.querySelector(
        '[data-slot="sheet-content"][data-sidebar="sidebar"]',
      );
      const sheetDialogOpen = sheetContent instanceof HTMLDialogElement ? sheetContent.open : false;

      return (
        provider?.getAttribute("data-mobile-open") === "false" &&
        sheetContent?.getAttribute("data-state") === "closed" &&
        !sheetDialogOpen &&
        window.matchMedia("(max-width: 767.98px)").matches === false
      );
    },
    { demoId: ids.demo },
  );
  const closedMobileAfterResize = await page.evaluate(readSidebarState, ids);

  if (
    initialState.providerState !== "expanded" ||
    initialState.providerMobileOpen !== "false" ||
    initialState.providerShortcut !== "b" ||
    initialState.sidebarState !== "expanded" ||
    initialState.sidebarCollapsible !== "" ||
    initialState.sidebarMode !== "icon" ||
    initialState.sidebarVariant !== "inset" ||
    initialState.triggerExpanded !== "true" ||
    initialState.triggerSlot !== "sidebar-trigger" ||
    initialState.railSlot !== "sidebar-rail" ||
    initialState.menuButtonCount < expected.minMenuButtonCount ||
    initialState.firstMenuLinkHref !== expected.firstMenuLinkHref ||
    initialState.tooltipButtonCount < expected.minTooltipButtonCount ||
    initialState.menuActionCount < expected.minMenuActionCount ||
    initialState.badgeText !== expected.badgeText ||
    initialState.skeletonCount < expected.minSkeletonCount ||
    initialState.subButtonCount < expected.minSubButtonCount ||
    initialState.containerPosition !== expected.containerPosition ||
    tooltipLayoutState.invalid.length > 0 ||
    footerDropdownState.triggerTagName !== "BUTTON" ||
    footerDropdownState.triggerExpanded !== "true" ||
    footerDropdownState.triggerState !== "open" ||
    footerDropdownState.contentHidden !== false ||
    footerDropdownState.contentState !== "open" ||
    footerDropdownState.contentParentTagName !== "BODY" ||
    footerDropdownState.contentPosition !== "fixed" ||
    collapsedByTrigger.providerState !== "collapsed" ||
    collapsedByTrigger.sidebarState !== "collapsed" ||
    collapsedByTrigger.triggerExpanded !== "false" ||
    collapsedByTrigger.documentTooltipGate !== "enabled" ||
    collapsedLabelLayoutState.invalid.length > 0 ||
    collapsedTooltipPositionState.positionedToRight !== true ||
    collapsedTooltipPositionState.verticallyAligned !== true ||
    expandedByShortcut.providerState !== "expanded" ||
    expandedByShortcut.triggerExpanded !== "true" ||
    shortcutWhileInputFocused.providerState !== "expanded" ||
    collapsedByRail.providerState !== "collapsed" ||
    collapsedByRail.triggerExpanded !== "false" ||
    openedMobileSheet.providerMobileOpen !== "true" ||
    openedMobileSheet.mobileSheetState !== "open" ||
    closedMobileAfterResize.providerMobileOpen !== "false" ||
    closedMobileAfterResize.mobileSheetState !== "closed"
  ) {
    throw new Error(
      `Expected ${label} Sidebar demo to expose sidebar anatomy, trigger/rail collapse, keyboard shortcut behavior, and collapsed tooltip gating, got ${JSON.stringify(
        {
          collapsedByRail,
          collapsedByTrigger,
          collapsedLabelLayoutState,
          collapsedTooltipPositionState,
          closedMobileAfterResize,
          expandedByShortcut,
          footerDropdownState,
          initialState,
          openedMobileSheet,
          shortcutWhileInputFocused,
          tooltipLayoutState,
        },
      )}.`,
    );
  }
}

async function readSidebarTooltipPositionState(page, ids) {
  const tooltipButton = page
    .locator(`#${ids.demo} [data-sw-sidebar-menu-button][data-tooltip]:visible`)
    .first();
  await tooltipButton.hover();

  await page.waitForFunction(
    ({ demoId }) => {
      const isVisibleElement = (element) => {
        if (!(element instanceof HTMLElement)) return false;

        return (
          getComputedStyle(element).display !== "none" &&
          getComputedStyle(element).visibility !== "hidden" &&
          element.getClientRects().length > 0
        );
      };
      const getVisibleTooltipButton = (root) =>
        Array.from(
          root?.querySelectorAll("[data-sw-sidebar-menu-button][data-tooltip]") ?? [],
        ).find(isVisibleElement);
      const getOpenTooltipForButton = (button) => {
        const label = button?.getAttribute("data-tooltip");
        if (!label) return null;

        return Array.from(document.querySelectorAll('[data-slot="tooltip-content"]')).find(
          (element) =>
            element instanceof HTMLElement &&
            isVisibleElement(element) &&
            element.getAttribute("data-state") === "open" &&
            element.textContent?.trim() === label,
        );
      };
      const root = document.getElementById(demoId);
      const button = getVisibleTooltipButton(root);
      const tooltip = getOpenTooltipForButton(button);

      return tooltip instanceof HTMLElement;
    },
    { demoId: ids.demo },
  );

  return page.evaluate(
    ({ demoId }) => {
      const isVisibleElement = (element) => {
        if (!(element instanceof HTMLElement)) return false;

        return (
          getComputedStyle(element).display !== "none" &&
          getComputedStyle(element).visibility !== "hidden" &&
          element.getClientRects().length > 0
        );
      };
      const getVisibleTooltipButton = (root) =>
        Array.from(
          root?.querySelectorAll("[data-sw-sidebar-menu-button][data-tooltip]") ?? [],
        ).find(isVisibleElement);
      const getOpenTooltipForButton = (button) => {
        const label = button?.getAttribute("data-tooltip");
        if (!label) return null;

        return Array.from(document.querySelectorAll('[data-slot="tooltip-content"]')).find(
          (element) =>
            element instanceof HTMLElement &&
            isVisibleElement(element) &&
            element.getAttribute("data-state") === "open" &&
            element.textContent?.trim() === label,
        );
      };
      const serializeRect = (rect) => ({
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
      });
      const root = document.getElementById(demoId);
      const button = getVisibleTooltipButton(root);
      const tooltip = getOpenTooltipForButton(button);

      if (!(button instanceof HTMLElement) || !(tooltip instanceof HTMLElement)) {
        return {
          buttonRect: null,
          label: button?.getAttribute("data-tooltip") ?? null,
          positionedToRight: false,
          tooltipRect: null,
          verticallyAligned: false,
        };
      }

      const buttonRect = button.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const horizontalGap = tooltipRect.left - buttonRect.right;
      const verticalCenterDelta = Math.abs(
        tooltipRect.top + tooltipRect.height / 2 - (buttonRect.top + buttonRect.height / 2),
      );

      return {
        buttonRect: serializeRect(buttonRect),
        horizontalGap: Math.round(horizontalGap),
        label: button.getAttribute("data-tooltip"),
        positionedToRight: horizontalGap >= -1 && horizontalGap <= 80,
        tooltipRect: serializeRect(tooltipRect),
        verticallyAligned: verticalCenterDelta <= Math.max(24, buttonRect.height),
        verticalCenterDelta: Math.round(verticalCenterDelta),
      };
    },
    { demoId: ids.demo },
  );
}

async function dismissSidebarTooltip(page, ids) {
  const viewport = page.viewportSize() ?? { height: 900, width: 1280 };
  await page.mouse.move(Math.max(viewport.width - 2, 0), Math.max(viewport.height - 2, 0));
  await page.waitForFunction(
    ({ demoId }) => {
      const root = document.getElementById(demoId);
      const hasHover = Array.from(
        root?.querySelectorAll("[data-sw-sidebar-menu-button][data-tooltip]") ?? [],
      ).some((element) => element instanceof HTMLElement && element.matches(":hover"));
      const hasOpenTooltip = Array.from(
        document.querySelectorAll('[data-slot="tooltip-content"]'),
      ).some((element) => {
        if (!(element instanceof HTMLElement)) return false;

        return (
          element.getAttribute("data-state") === "open" &&
          !element.hidden &&
          getComputedStyle(element).display !== "none" &&
          getComputedStyle(element).visibility !== "hidden" &&
          element.getClientRects().length > 0
        );
      });

      return !hasHover && !hasOpenTooltip;
    },
    { demoId: ids.demo },
  );
}

export async function verifyNestedSidebarPageCases({
  page,
  ids,
  label,
  dialogTriggerSlots = null,
}) {
  const demo = page.locator(`#${ids.demo}`);
  await demo.scrollIntoViewIfNeeded();

  await page.waitForFunction(
    ({ demoId }) => {
      const root = document.getElementById(demoId);
      const provider = root?.querySelector('[data-slot="sidebar-provider"]');
      const sidebar = root?.querySelector("[data-sw-sidebar]");
      const trigger = root?.querySelector("[data-sw-sidebar-trigger]");

      return (
        provider instanceof HTMLElement &&
        sidebar instanceof HTMLElement &&
        trigger instanceof HTMLElement &&
        root.querySelectorAll('[data-slot="collapsible"]').length >= 4 &&
        root.querySelectorAll('[data-slot="sidebar-menu-sub-button"]').length >= 3
      );
    },
    { demoId: ids.demo },
  );

  if (
    (await page
      .locator(`#${ids.demo} [data-slot="sidebar-provider"]`)
      .first()
      .getAttribute("data-state")) !== "expanded"
  ) {
    await page.locator(`#${ids.trigger}`).click();
    await page.waitForFunction(
      ({ demoId }) =>
        document
          .getElementById(demoId)
          ?.querySelector('[data-slot="sidebar-provider"]')
          ?.getAttribute("data-state") === "expanded",
      { demoId: ids.demo },
    );
  }

  const modelsTrigger = page
    .locator(`#${ids.demo} [data-sw-sidebar-menu-button]`)
    .filter({ hasText: "Models" })
    .first();
  await modelsTrigger.waitFor({ state: "visible" });
  const modelsTriggerInitial = await modelsTrigger.evaluate((trigger) => ({
    ariaExpanded: trigger.getAttribute("aria-expanded"),
    dataAsChild: trigger.hasAttribute("data-as-child"),
    role: trigger.getAttribute("role"),
    tabIndex: trigger.getAttribute("tabindex"),
    tagName: trigger.tagName,
    type: trigger.getAttribute("type"),
  }));
  if (
    modelsTriggerInitial.tagName !== "BUTTON" ||
    modelsTriggerInitial.type !== "button" ||
    modelsTriggerInitial.dataAsChild !== false ||
    modelsTriggerInitial.ariaExpanded !== "false"
  ) {
    throw new Error(
      `Expected ${label} nested Sidebar parent trigger to be a focusable semantic button before keyboard activation, got ${JSON.stringify(
        modelsTriggerInitial,
      )}.`,
    );
  }

  await modelsTrigger.focus();
  const modelsTriggerFocused = await page.evaluate(
    ({ demoId, triggerText }) => {
      const root = document.getElementById(demoId);
      const trigger = Array.from(
        root?.querySelectorAll("[data-sw-sidebar-menu-button]") ?? [],
      ).find((element) => element.textContent?.trim().includes(triggerText));

      return trigger instanceof HTMLElement && document.activeElement === trigger;
    },
    { demoId: ids.demo, triggerText: "Models" },
  );
  if (modelsTriggerFocused !== true) {
    throw new Error(`Expected ${label} nested Sidebar parent trigger to receive focus.`);
  }

  await page.keyboard.press("Enter");
  await page.waitForFunction(
    ({ demoId }) => {
      const root = document.getElementById(demoId);
      return Array.from(root?.querySelectorAll('[data-slot="sidebar-menu-sub-button"]') ?? []).some(
        (element) =>
          element instanceof HTMLElement &&
          element.textContent?.trim() === "Genesis" &&
          getComputedStyle(element).display !== "none" &&
          getComputedStyle(element).visibility !== "hidden" &&
          element.getClientRects().length > 0,
      );
    },
    { demoId: ids.demo },
  );

  const nestedState = await page.evaluate(readNestedSidebarState, ids);
  const dialogTriggerSlotState =
    dialogTriggerSlots === null
      ? null
      : await page.evaluate(readDialogTriggerSlotState, {
          demoId: ids.demo,
          slots: dialogTriggerSlots,
        });

  await page.locator(`#${ids.trigger}`).click();
  await page.waitForFunction(
    ({ demoId }) => {
      const provider = document
        .getElementById(demoId)
        ?.querySelector('[data-slot="sidebar-provider"]');

      return provider?.getAttribute("data-state") === "collapsed";
    },
    { demoId: ids.demo },
  );
  await page.waitForTimeout(250);
  const collapsedLabelLayoutState = await page.evaluate(readCollapsedSidebarGroupLabelState, ids);
  await page.locator(`#${ids.trigger}`).click();
  await page.waitForFunction(
    ({ demoId }) => {
      const provider = document
        .getElementById(demoId)
        ?.querySelector('[data-slot="sidebar-provider"]');

      return provider?.getAttribute("data-state") === "expanded";
    },
    { demoId: ids.demo },
  );

  if (
    nestedState.providerState !== "expanded" ||
    nestedState.sidebarMode !== "icon" ||
    nestedState.collapsibleCount < 4 ||
    nestedState.subButtonCount < 6 ||
    nestedState.visibleGenesis !== true ||
    nestedState.dialogTriggerCount < 1 ||
    dialogTriggerSlotState?.invalid.length > 0 ||
    nestedState.modelsTriggerExpanded !== "true" ||
    collapsedLabelLayoutState.invalid.length > 0
  ) {
    throw new Error(
      `Expected ${label} nested Sidebar page to expose nested collapsible submenus and embedded dialog examples, got ${JSON.stringify(
        { collapsedLabelLayoutState, dialogTriggerSlotState, modelsTriggerInitial, nestedState },
      )}.`,
    );
  }
}

function readSidebarState(ids) {
  const root = document.getElementById(ids.demo);
  const provider = root?.querySelector('[data-slot="sidebar-provider"]');
  const sidebar = root?.querySelector("[data-sw-sidebar]");
  const trigger = root?.querySelector("[data-sw-sidebar-trigger]");
  const rail = root?.querySelector("[data-sw-sidebar-rail]");
  const container = root?.querySelector('[data-slot="sidebar-container"]');
  const badge = root?.querySelector('[data-slot="sidebar-menu-badge"]');
  const mobileSheetContent = root?.querySelector(
    '[data-slot="sheet-content"][data-sidebar="sidebar"]',
  );

  return {
    badgeText: badge?.textContent?.trim() ?? null,
    containerPosition:
      container instanceof HTMLElement ? getComputedStyle(container).position : null,
    documentTooltipGate: document.documentElement.getAttribute("data-starwind-sidebar-tooltips"),
    firstMenuLinkHref:
      root?.querySelector('[data-slot="sidebar-menu-button"][href]')?.getAttribute("href") ?? null,
    menuActionCount: root?.querySelectorAll('[data-slot="sidebar-menu-action"]').length ?? 0,
    menuButtonCount: root?.querySelectorAll('[data-slot="sidebar-menu-button"]').length ?? 0,
    mobileSheetState: mobileSheetContent?.getAttribute("data-state") ?? null,
    providerMobileOpen: provider?.getAttribute("data-mobile-open") ?? null,
    providerShortcut: provider?.getAttribute("data-keyboard-shortcut") ?? null,
    providerState: provider?.getAttribute("data-state") ?? null,
    railSlot: rail?.getAttribute("data-slot") ?? null,
    sidebarCollapsible: sidebar?.getAttribute("data-collapsible") ?? null,
    sidebarMode: sidebar?.getAttribute("data-collapsible-mode") ?? null,
    sidebarState: sidebar?.getAttribute("data-state") ?? null,
    sidebarVariant: sidebar?.getAttribute("data-variant") ?? null,
    skeletonCount: root?.querySelectorAll('[data-slot="sidebar-menu-skeleton"]').length ?? 0,
    subButtonCount: root?.querySelectorAll('[data-slot="sidebar-menu-sub-button"]').length ?? 0,
    tooltipButtonCount: root?.querySelectorAll("[data-tooltip]").length ?? 0,
    triggerExpanded: trigger?.getAttribute("aria-expanded") ?? null,
    triggerSlot: trigger?.getAttribute("data-slot") ?? null,
  };
}

function readSidebarTooltipLayoutState(ids) {
  const root = document.getElementById(ids.demo);
  const rows = Array.from(root?.querySelectorAll('[data-slot="sidebar-menu-item"]') ?? [])
    .map((item) => {
      const button = item.querySelector("[data-sw-sidebar-menu-button][data-tooltip]");
      const trigger = item.querySelector('[data-slot="tooltip-trigger"]');
      const tooltipRoot = item.querySelector('[data-slot="tooltip"]');

      if (
        !(item instanceof HTMLElement) ||
        !(button instanceof HTMLElement) ||
        !(trigger instanceof HTMLElement)
      ) {
        return null;
      }

      const itemRect = item.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRootRect =
        tooltipRoot instanceof HTMLElement ? tooltipRoot.getBoundingClientRect() : null;
      const label = button.textContent?.trim() ?? "";

      return {
        buttonWidth: Math.round(buttonRect.width),
        itemWidth: Math.round(itemRect.width),
        label,
        tagName: button.tagName,
        tooltipRootWidth: tooltipRootRect ? Math.round(tooltipRootRect.width) : null,
        triggerDisplay: getComputedStyle(trigger).display,
        triggerWidth: Math.round(triggerRect.width),
      };
    })
    .filter(Boolean);

  return {
    invalid: rows.filter((row) => {
      if (row.itemWidth <= 0) {
        return false;
      }

      const buttonIsFullWidth = row.buttonWidth >= row.itemWidth - 2;
      if (row.triggerDisplay === "contents") {
        const tooltipRootIsFullWidth =
          row.tooltipRootWidth !== null && row.tooltipRootWidth >= row.itemWidth - 2;
        return !buttonIsFullWidth || !tooltipRootIsFullWidth;
      }

      return !buttonIsFullWidth || row.triggerWidth < row.itemWidth - 2;
    }),
    rows,
  };
}

function readSidebarFooterDropdownState(ids) {
  const root = document.getElementById(ids.demo);
  const trigger = Array.from(root?.querySelectorAll("[data-sw-sidebar-menu-button]") ?? []).find(
    (element) =>
      element instanceof HTMLElement &&
      element.textContent?.includes("John Doe") &&
      element.getAttribute("data-state") === "open" &&
      element.getBoundingClientRect().width > 0,
  );
  const content = Array.from(document.querySelectorAll('[data-slot="dropdown-content"]')).find(
    (element) =>
      element instanceof HTMLElement &&
      element.textContent?.includes("Upgrade to Pro") &&
      element.getAttribute("data-state") === "open" &&
      !element.hidden,
  );

  return {
    contentHidden: content instanceof HTMLElement ? content.hidden : null,
    contentParentTagName: content?.parentElement?.tagName ?? null,
    contentPosition: content instanceof HTMLElement ? getComputedStyle(content).position : null,
    contentState: content?.getAttribute("data-state") ?? null,
    triggerControls: trigger?.getAttribute("aria-controls") ?? null,
    triggerExpanded: trigger?.getAttribute("aria-expanded") ?? null,
    triggerState: trigger?.getAttribute("data-state") ?? null,
    triggerTagName: trigger?.tagName ?? null,
  };
}

function readCollapsedSidebarGroupLabelState(ids) {
  const root = document.getElementById(ids.demo);
  const provider = root?.querySelector('[data-slot="sidebar-provider"]');
  const menuButtons = Array.from(root?.querySelectorAll("[data-sw-sidebar-menu-button]") ?? []);
  const serializeRect = (rect) => ({
    bottom: Math.round(rect.bottom),
    height: Math.round(rect.height),
    left: Math.round(rect.left),
    right: Math.round(rect.right),
    top: Math.round(rect.top),
    width: Math.round(rect.width),
  });
  const rows = Array.from(root?.querySelectorAll('[data-slot="sidebar-group-label"]') ?? []).map(
    (label) => {
      const rect = label.getBoundingClientRect();
      const style = getComputedStyle(label);
      const intersections = menuButtons
        .map((button) => {
          const buttonRect = button.getBoundingClientRect();
          const left = Math.max(rect.left, buttonRect.left);
          const right = Math.min(rect.right, buttonRect.right);
          const top = Math.max(rect.top, buttonRect.top);
          const bottom = Math.min(rect.bottom, buttonRect.bottom);

          if (right - left <= 1 || bottom - top <= 1) {
            return null;
          }

          const x = (left + right) / 2;
          const y = (top + bottom) / 2;
          const target = document.elementFromPoint(x, y);
          const targetElement = target instanceof HTMLElement ? target : null;
          const targetButton = targetElement?.closest("[data-sw-sidebar-menu-button]");
          const targetSlot = targetElement?.closest("[data-slot]")?.getAttribute("data-slot");

          return {
            buttonText: button.textContent?.trim() ?? "",
            labelReceivesHit:
              targetElement instanceof HTMLElement &&
              (targetElement === label || label.contains(targetElement)),
            sample: { x: Math.round(x), y: Math.round(y) },
            targetButtonMatches: targetButton === button,
            targetSlot,
            targetText: targetElement?.textContent?.trim() ?? "",
          };
        })
        .filter(Boolean);

      return {
        collapsedHeight: Math.round(rect.height),
        intersections,
        label: label.textContent?.trim() ?? "",
        opacity: style.opacity,
        overflow: style.overflow,
        pointerEvents: style.pointerEvents,
        rect: serializeRect(rect),
      };
    },
  );

  return {
    invalid: rows.filter((row) => {
      const hasRenderedBox = row.collapsedHeight > 1 || row.rect.width > 1;

      return (
        hasRenderedBox &&
        (row.pointerEvents !== "none" ||
          row.intersections.some((intersection) => intersection.labelReceivesHit))
      );
    }),
    providerState: provider?.getAttribute("data-state") ?? null,
    rows,
  };
}

function readNestedSidebarState(ids) {
  const root = document.getElementById(ids.demo);
  const isVisibleElement = (element) => {
    if (!(element instanceof HTMLElement)) return false;

    return (
      getComputedStyle(element).display !== "none" &&
      getComputedStyle(element).visibility !== "hidden" &&
      element.getClientRects().length > 0
    );
  };
  const provider = root?.querySelector('[data-slot="sidebar-provider"]');
  const sidebar = root?.querySelector("[data-sw-sidebar]");
  const genesisButtons = Array.from(
    root?.querySelectorAll('[data-slot="sidebar-menu-sub-button"]') ?? [],
  ).filter((element) => element.textContent?.trim() === "Genesis");
  const modelTriggers = Array.from(
    root?.querySelectorAll("[data-sw-sidebar-menu-button]") ?? [],
  ).filter((element) => element.textContent?.trim().includes("Models"));
  const modelsTrigger = modelTriggers.find(isVisibleElement) ?? modelTriggers[0];

  return {
    collapsibleCount: root?.querySelectorAll('[data-slot="collapsible"]').length ?? 0,
    dialogTriggerCount: root?.querySelectorAll('[data-slot="dialog-trigger"]').length ?? 0,
    modelsTriggerExpanded: modelsTrigger?.getAttribute("aria-expanded") ?? null,
    modelsTriggerTagName: modelsTrigger?.tagName ?? null,
    providerState: provider?.getAttribute("data-state") ?? null,
    sidebarMode: sidebar?.getAttribute("data-collapsible-mode") ?? null,
    subButtonCount: root?.querySelectorAll('[data-slot="sidebar-menu-sub-button"]').length ?? 0,
    visibleGenesis: genesisButtons.some(
      (element) => element instanceof HTMLElement && isVisibleElement(element),
    ),
  };
}

function readDialogTriggerSlotState({ demoId, slots }) {
  const root = document.getElementById(demoId);
  const rows = Object.entries(slots).map(([id, expectedSlot]) => {
    const trigger = root?.querySelector(`#${CSS.escape(id)}`);

    return {
      actualSlot: trigger?.getAttribute("data-slot") ?? null,
      expectedSlot,
      hasTriggerAttribute: trigger?.hasAttribute("data-sw-dialog-trigger") ?? null,
      id,
      tagName: trigger?.tagName ?? null,
    };
  });

  return {
    invalid: rows.filter(
      (row) =>
        row.actualSlot !== row.expectedSlot ||
        row.hasTriggerAttribute !== true ||
        row.tagName !== "BUTTON",
    ),
    rows,
  };
}
