import { verifyTooltipPlacements, verifyTooltipPropExamples } from "../shared/tooltip.mjs";
import { verifyHoverCardCases } from "../shared/hover-card.mjs";
import { verifyVideoCases } from "../shared/video.mjs";
import { verifyDialogEntryAnimationGestures } from "../shared/dialog-entry-animation.mjs";

export async function verifyAstroMediaOverlayCases({ page, serverMode = "preview" }) {
  await verifyVideoCases({
    page,
    ids: {
      demo: "runtime-video-demo",
      native: "runtime-video-native",
      shorts: "runtime-video-shorts",
      youtube: "runtime-video-youtube",
    },
    label: "Astro",
  });
  await verifyAstroImageCases({ page, serverMode });
  await verifyHoverCardCases({
    page,
    ids: {
      asChildAlign: "start",
      asChildContent: "runtime-hover-card-as-child-content",
      asChildHref: "#runtime-hover-card-as-child",
      asChildSide: "right",
      asChildTrigger: "runtime-hover-card-as-child-trigger",
      alignedContent: "runtime-hover-card-aligned-content",
      alignedTrigger: "runtime-hover-card-aligned-trigger",
      demo: "runtime-hover-card-demo",
      expectedRootCount: 7,
      hoverableContent: "runtime-hover-card-aligned-content",
      hoverableTrigger: "runtime-hover-card-aligned-trigger",
      nonHoverableContent: "runtime-hover-card-no-hoverable-content",
      nonHoverableTrigger: "runtime-hover-card-no-hoverable-trigger",
      sideContent: (side) => `runtime-hover-card-side-${side}-content`,
      sideTrigger: (side) => `runtime-hover-card-side-${side}-trigger`,
      wrapperDisplay: "contents",
    },
    label: "Astro",
  });

  const avatarState = await page.evaluate(() => {
    const readVisibleImageState = (image) => {
      if (!(image instanceof HTMLImageElement)) {
        return { hasVisiblePixel: undefined, naturalHeight: undefined, naturalWidth: undefined };
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, image.naturalWidth);
      canvas.height = Math.max(1, image.naturalHeight);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context?.drawImage(image, 0, 0, canvas.width, canvas.height);
      let pixels;
      try {
        pixels = context?.getImageData(0, 0, canvas.width, canvas.height).data;
      } catch {
        const rect = image.getBoundingClientRect();
        return {
          hasVisiblePixel:
            image.complete &&
            image.naturalHeight > 1 &&
            image.naturalWidth > 1 &&
            rect.height > 0 &&
            rect.width > 0,
          naturalHeight: image.naturalHeight,
          naturalWidth: image.naturalWidth,
        };
      }
      let hasVisiblePixel = false;

      if (pixels) {
        for (let index = 3; index < pixels.length; index += 4) {
          if (pixels[index] > 0) {
            hasVisiblePixel = true;
            break;
          }
        }
      }

      return {
        hasVisiblePixel,
        naturalHeight: image.naturalHeight,
        naturalWidth: image.naturalWidth,
      };
    };
    const loadedRoot = document.querySelector("#runtime-avatar-loaded");
    const loadedImage = loadedRoot?.querySelector('[data-slot="avatar-image"]');
    const loadedFallback = loadedRoot?.querySelector('[data-slot="avatar-fallback"]');
    const errorRoot = document.querySelector("#runtime-avatar-error");
    const errorImage = errorRoot?.querySelector('[data-slot="avatar-image"]');
    const errorFallback = errorRoot?.querySelector('[data-slot="avatar-fallback"]');
    const delayedRoot = document.querySelector("#runtime-avatar-delayed");
    const delayedFallback = delayedRoot?.querySelector('[data-slot="avatar-fallback"]');

    loadedImage?.dispatchEvent(new Event("load"));
    errorImage?.dispatchEvent(new Event("error"));

    return {
      delayedFallbackDelay: delayedFallback?.getAttribute("data-delay"),
      delayedFallbackHidden:
        delayedFallback instanceof HTMLElement ? delayedFallback.hidden : undefined,
      errorFallbackClassName: errorFallback?.getAttribute("class"),
      errorFallbackHidden: errorFallback instanceof HTMLElement ? errorFallback.hidden : undefined,
      errorImageHidden: errorImage instanceof HTMLImageElement ? errorImage.hidden : undefined,
      errorRootClassName: errorRoot?.getAttribute("class"),
      errorStatus: errorRoot?.getAttribute("data-image-loading-status"),
      loadedFallbackClassName: loadedFallback?.getAttribute("class"),
      loadedFallbackHidden:
        loadedFallback instanceof HTMLElement ? loadedFallback.hidden : undefined,
      loadedImageAlt: loadedImage?.getAttribute("alt"),
      loadedImageClassName: loadedImage?.getAttribute("class"),
      loadedImageHidden: loadedImage instanceof HTMLImageElement ? loadedImage.hidden : undefined,
      loadedImageVisibleState: readVisibleImageState(loadedImage),
      loadedRootClassName: loadedRoot?.getAttribute("class"),
      loadedRootHasDataSw: loadedRoot?.hasAttribute("data-sw-avatar"),
      loadedRootTagName: loadedRoot?.tagName,
      loadedStatus: loadedRoot?.getAttribute("data-image-loading-status"),
      rootCount: document.querySelectorAll('[data-slot="avatar"][data-sw-avatar]').length,
    };
  });
  if (
    avatarState.rootCount !== 3 ||
    avatarState.loadedRootTagName !== "SPAN" ||
    avatarState.loadedRootHasDataSw !== true ||
    avatarState.loadedStatus !== "loaded" ||
    avatarState.loadedRootClassName?.includes("runtime-avatar-custom") !== true ||
    avatarState.loadedRootClassName?.includes("border-primary") !== true ||
    avatarState.loadedRootClassName?.includes("h-12") !== true ||
    avatarState.loadedImageHidden !== false ||
    avatarState.loadedImageVisibleState.hasVisiblePixel !== true ||
    avatarState.loadedImageVisibleState.naturalHeight < 2 ||
    avatarState.loadedImageVisibleState.naturalWidth < 2 ||
    avatarState.loadedImageAlt !== "Jane Doe" ||
    avatarState.loadedImageClassName?.includes("object-cover") !== true ||
    avatarState.loadedFallbackHidden !== true ||
    avatarState.loadedFallbackClassName?.includes("absolute") !== true ||
    avatarState.errorStatus !== "error" ||
    avatarState.errorRootClassName?.includes("border-error") !== true ||
    avatarState.errorImageHidden !== true ||
    avatarState.errorFallbackHidden !== false ||
    avatarState.errorFallbackClassName?.includes("font-medium") !== true ||
    avatarState.delayedFallbackDelay !== "1000" ||
    avatarState.delayedFallbackHidden !== true
  ) {
    throw new Error(
      `Expected Astro Avatar runtime transitions and Starwind classes, got ${JSON.stringify(
        avatarState,
      )}.`,
    );
  }

  const kbdCount = await page.locator('kbd[data-slot="kbd"][data-sw-kbd]').count();
  const kbdGroupCount = await page.locator('kbd[data-slot="kbd-group"][data-sw-kbd-group]').count();
  const firstKbdClass = await page
    .locator('kbd[data-slot="kbd"][data-sw-kbd]')
    .first()
    .getAttribute("class");
  const kbdGroupClass = await page
    .locator('kbd[data-slot="kbd-group"][data-sw-kbd-group]')
    .getAttribute("class");
  const tooltipKbdClass = await page
    .locator('[data-slot="tooltip-content"] kbd[data-slot="kbd"][data-sw-kbd]')
    .getAttribute("class");
  const kbdTexts = await page
    .locator('kbd[data-slot="kbd"][data-sw-kbd]')
    .evaluateAll((items) => items.map((item) => item.textContent?.trim()));
  if (
    kbdCount !== 5 ||
    kbdGroupCount !== 1 ||
    !firstKbdClass?.includes("pointer-events-none") ||
    !kbdGroupClass?.includes("inline-flex") ||
    !kbdGroupClass?.includes("items-center") ||
    !kbdGroupClass?.includes("gap-1") ||
    !tooltipKbdClass?.includes("[[data-slot=tooltip-content]_&]:bg-background/20") ||
    !tooltipKbdClass?.includes("[[data-slot=tooltip-content]_&]:text-background") ||
    JSON.stringify(kbdTexts) !== JSON.stringify(["Ctrl K", "Esc", "Ctrl", "K", "?"])
  ) {
    throw new Error(
      `Expected Astro Kbd roots and group with Starwind classes, got ${JSON.stringify({
        firstKbdClass,
        kbdCount,
        kbdGroupClass,
        kbdGroupCount,
        kbdTexts,
        tooltipKbdClass,
      })}.`,
    );
  }

  await page.getByRole("button", { name: "Shortcut help" }).hover();
  await page.locator("#runtime-tooltip-content").waitFor({ state: "visible" });
  const openTooltipState = await page.locator("#runtime-tooltip-content").evaluate((content) => {
    const positioner = content.parentElement;

    return {
      className: content.getAttribute("class"),
      dataAlign: content.getAttribute("data-align"),
      dataSide: content.getAttribute("data-side"),
      dataSlot: content.getAttribute("data-slot"),
      describedBy: document
        .querySelector("#runtime-tooltip-default [data-sw-tooltip-trigger] button")
        ?.getAttribute("aria-describedby"),
      hidden: content instanceof HTMLElement ? content.hidden : null,
      interactiveDescendantCount: content.querySelectorAll(
        [
          "a[href]",
          "button",
          "input",
          "select",
          "textarea",
          "summary",
          "iframe",
          "audio[controls]",
          "video[controls]",
          "[contenteditable]:not([contenteditable='false'])",
          "[tabindex]:not([tabindex='-1'])",
          "[role='button']",
          "[role='checkbox']",
          "[role='link']",
          "[role='menuitem']",
          "[role='option']",
          "[role='radio']",
          "[role='switch']",
          "[role='tab']",
        ].join(","),
      ).length,
      parentDataSlot: positioner?.getAttribute("data-slot"),
      parentTagName: positioner?.tagName,
      position: positioner instanceof HTMLElement ? getComputedStyle(positioner).position : null,
      positionerParentTagName: positioner?.parentElement?.tagName,
      popupPosition: content instanceof HTMLElement ? getComputedStyle(content).position : null,
      role: content.getAttribute("role"),
      rootContains: document.querySelector("#runtime-tooltip-default")?.contains(content) ?? null,
      state: content.getAttribute("data-state"),
      styleLeft: positioner instanceof HTMLElement ? positioner.style.left : null,
      styleTop: positioner instanceof HTMLElement ? positioner.style.top : null,
      tabIndexAttribute: content.getAttribute("tabindex"),
    };
  });
  if (
    openTooltipState.hidden !== false ||
    openTooltipState.role !== "tooltip" ||
    openTooltipState.state !== "open" ||
    !["top", "bottom"].includes(openTooltipState.dataSide ?? "") ||
    openTooltipState.dataAlign !== "center" ||
    openTooltipState.parentDataSlot !== "tooltip-positioner" ||
    openTooltipState.parentTagName !== "DIV" ||
    openTooltipState.positionerParentTagName !== "BODY" ||
    openTooltipState.rootContains !== false ||
    openTooltipState.position !== "fixed" ||
    openTooltipState.popupPosition === "fixed" ||
    openTooltipState.styleLeft === "" ||
    openTooltipState.styleTop === "" ||
    openTooltipState.describedBy !== "runtime-tooltip-content" ||
    openTooltipState.tabIndexAttribute !== null ||
    openTooltipState.interactiveDescendantCount !== 0 ||
    openTooltipState.dataSlot !== "tooltip-content"
  ) {
    throw new Error(
      `Expected Astro Tooltip to open as a portaled positioned tooltip, got ${JSON.stringify(
        openTooltipState,
      )}.`,
    );
  }
  await page.mouse.move(20, 20);
  await page.waitForFunction(() => {
    const content = document.querySelector("#runtime-tooltip-content");
    const root = document.querySelector("#runtime-tooltip-default");

    return (
      content instanceof HTMLElement &&
      root instanceof HTMLElement &&
      content.hidden &&
      root.contains(content)
    );
  });

  await verifyTooltipPropExamples(page, "runtime");
  await verifyTooltipPlacements(page, "runtime");

  const progressState = await page.evaluate(async () => {
    const readProgress = (id) => {
      const root = document.querySelector(`#${id}`);
      const indicator = root?.querySelector("[data-sw-progress-indicator]");
      const track = root?.querySelector("[data-sw-progress-track]");

      return {
        ariaLabel: root?.getAttribute("aria-label"),
        ariaMax: root?.getAttribute("aria-valuemax"),
        ariaMin: root?.getAttribute("aria-valuemin"),
        ariaNow: root?.getAttribute("aria-valuenow"),
        ariaText: root?.getAttribute("aria-valuetext"),
        className: root?.getAttribute("class"),
        dataIndeterminate: root?.hasAttribute("data-indeterminate") ?? null,
        dataProgressing: root?.hasAttribute("data-progressing") ?? null,
        dataSlot: root?.getAttribute("data-slot"),
        dataStatus: root?.getAttribute("data-status"),
        dataValue: root?.getAttribute("data-value"),
        indicatorClassName: indicator?.getAttribute("class"),
        indicatorSlot: indicator?.getAttribute("data-slot"),
        indicatorTransform: indicator instanceof HTMLElement ? indicator.style.transform : null,
        role: root?.getAttribute("role"),
        trackClassName: track?.getAttribute("class"),
        trackSlot: track?.getAttribute("data-slot"),
      };
    };

    const initial = {
      default: readProgress("runtime-progress-default"),
      indeterminate: readProgress("runtime-progress-indeterminate"),
      rootCount: document.querySelectorAll('[data-slot="progress"][data-sw-progress]').length,
      updating: readProgress("runtime-progress-updating"),
    };

    document.querySelector("#runtime-progress-updating")?.setAttribute("data-value", "75");
    await Promise.resolve();
    await Promise.resolve();

    return {
      initial,
      updated: readProgress("runtime-progress-updating"),
    };
  });
  if (
    progressState.initial.rootCount !== 10 ||
    progressState.initial.default.role !== "progressbar" ||
    progressState.initial.default.ariaMin !== "0" ||
    progressState.initial.default.ariaMax !== "100" ||
    progressState.initial.default.ariaNow !== "40" ||
    progressState.initial.default.ariaLabel !== "Runtime upload progress" ||
    progressState.initial.default.ariaText !== "40%" ||
    progressState.initial.default.dataValue !== "40" ||
    progressState.initial.default.dataProgressing !== true ||
    progressState.initial.default.dataSlot !== "progress" ||
    progressState.initial.default.indicatorSlot !== "progress-indicator" ||
    progressState.initial.default.trackSlot !== "progress-track" ||
    progressState.initial.default.indicatorTransform !== "translateX(-60%)" ||
    progressState.initial.indeterminate.dataIndeterminate !== true ||
    progressState.initial.indeterminate.ariaLabel !== "Runtime sync progress" ||
    progressState.initial.indeterminate.ariaNow !== null ||
    progressState.initial.indeterminate.indicatorTransform !== "" ||
    progressState.initial.indeterminate.className?.includes("relative") !== true ||
    progressState.initial.indeterminate.indicatorClassName?.includes("absolute") !== true ||
    progressState.initial.updating.ariaNow !== "25" ||
    progressState.initial.updating.ariaLabel !== "Runtime processing progress" ||
    progressState.updated.ariaNow !== "75" ||
    progressState.updated.ariaText !== "75%" ||
    progressState.updated.indicatorTransform !== "translateX(-25%)"
  ) {
    throw new Error(
      `Expected Astro Progress runtime styling, ARIA, and data-value updates, got ${JSON.stringify(
        progressState,
      )}.`,
    );
  }

  const collapsibleContent = page.locator('[data-slot="collapsible-content"]').first();
  const initialCollapsibleState = await collapsibleContent.evaluate((content) => ({
    animations: content instanceof HTMLElement ? content.getAnimations().length : null,
    hidden: content instanceof HTMLElement ? content.hidden : null,
    inlineAnimationName: content instanceof HTMLElement ? content.style.animationName : null,
    state: content.getAttribute("data-state"),
  }));
  if (
    initialCollapsibleState.state !== "open" ||
    initialCollapsibleState.hidden !== false ||
    initialCollapsibleState.inlineAnimationName !== "" ||
    initialCollapsibleState.animations !== 0
  ) {
    throw new Error(
      `Expected default Astro collapsible panel to open without animation styling, got ${JSON.stringify(
        initialCollapsibleState,
      )}.`,
    );
  }

  await page.getByRole("button", { name: "Runtime notes" }).click();
  const closingCollapsibleState = await collapsibleContent.evaluate((content) => ({
    hidden: content instanceof HTMLElement ? content.hidden : null,
    inlineAnimationName: content instanceof HTMLElement ? content.style.animationName : null,
    state: content.getAttribute("data-state"),
  }));
  if (
    closingCollapsibleState.state !== "closed" ||
    closingCollapsibleState.inlineAnimationName !== ""
  ) {
    throw new Error(
      `Expected closing Astro collapsible panel to enter closed state without inline animation styling, got ${JSON.stringify(
        closingCollapsibleState,
      )}.`,
    );
  }
  await page.waitForFunction(() => {
    const content = document.querySelector('[data-slot="collapsible-content"]');
    return content instanceof HTMLElement && content.hidden;
  });

  const collapsibleAsChildInitial = await page
    .locator("#runtime-collapsible-as-child-trigger")
    .evaluate((trigger) => ({
      className: trigger.getAttribute("class"),
      controls: trigger.getAttribute("aria-controls"),
      expanded: trigger.getAttribute("aria-expanded"),
      hasAsChildWrapper:
        trigger.parentElement instanceof HTMLElement &&
        getComputedStyle(trigger.parentElement).display === "contents",
      hasDataSlot: trigger.getAttribute("data-slot") === "collapsible-trigger",
      hasTriggerAttribute: trigger.hasAttribute("data-sw-collapsible-trigger"),
      tagName: trigger.tagName,
    }));
  await page.getByRole("button", { name: "As child notes" }).click();
  const collapsibleAsChildOpen = await page.evaluate(() => {
    const trigger = document.querySelector("#runtime-collapsible-as-child-trigger");
    const content = document.querySelector("#runtime-collapsible-as-child-content");

    return {
      contentHidden: content instanceof HTMLElement ? content.hidden : null,
      contentState: content?.getAttribute("data-state"),
      expanded: trigger?.getAttribute("aria-expanded"),
    };
  });
  if (
    collapsibleAsChildInitial.tagName !== "BUTTON" ||
    collapsibleAsChildInitial.hasTriggerAttribute !== true ||
    collapsibleAsChildInitial.hasDataSlot !== true ||
    collapsibleAsChildInitial.hasAsChildWrapper !== true ||
    collapsibleAsChildInitial.expanded !== "false" ||
    !collapsibleAsChildInitial.controls ||
    collapsibleAsChildOpen.expanded !== "true" ||
    collapsibleAsChildOpen.contentState !== "open" ||
    collapsibleAsChildOpen.contentHidden !== false
  ) {
    throw new Error(
      `Expected Astro Collapsible asChild trigger to transfer runtime attributes and open, got ${JSON.stringify(
        { collapsibleAsChildInitial, collapsibleAsChildOpen },
      )}.`,
    );
  }

  const shippingContent = page
    .locator('[data-sw-accordion-item][data-value="shipping"] [data-sw-accordion-content]')
    .first();
  const initialAccordionState = await shippingContent.evaluate((content) => ({
    animations: content instanceof HTMLElement ? content.getAnimations().length : null,
    hidden: content instanceof HTMLElement ? content.hidden : null,
    inlineAnimationName: content instanceof HTMLElement ? content.style.animationName : null,
    state: content.getAttribute("data-state"),
  }));
  if (
    initialAccordionState.state !== "open" ||
    initialAccordionState.hidden !== false ||
    initialAccordionState.inlineAnimationName !== "none" ||
    initialAccordionState.animations !== 0
  ) {
    throw new Error(
      `Expected default Astro accordion panel to open without an initial animation, got ${JSON.stringify(
        initialAccordionState,
      )}.`,
    );
  }

  await page.getByRole("button", { name: "Billing" }).click();
  const closingAccordionState = await shippingContent.evaluate((content) => ({
    hidden: content instanceof HTMLElement ? content.hidden : null,
    inlineAnimationName: content instanceof HTMLElement ? content.style.animationName : null,
    state: content.getAttribute("data-state"),
  }));
  if (
    closingAccordionState.state !== "closed" ||
    closingAccordionState.hidden !== false ||
    closingAccordionState.inlineAnimationName !== ""
  ) {
    throw new Error(
      `Expected closing Astro accordion panel to remain visible with animations restored, got ${JSON.stringify(
        closingAccordionState,
      )}.`,
    );
  }
  await page.waitForFunction(() => {
    const content = document.querySelector(
      '[data-sw-accordion-item][data-value="shipping"] [data-sw-accordion-content]',
    );
    return content instanceof HTMLElement && content.hidden;
  });

  const billingContent = page
    .locator('[data-sw-accordion-item][data-value="billing"] [data-sw-accordion-content]')
    .first();
  await page.getByRole("button", { name: "Billing" }).click();
  await page.waitForFunction(() => {
    const content = document.querySelector(
      '[data-sw-accordion-item][data-value="billing"] [data-sw-accordion-content]',
    );
    return content instanceof HTMLElement && content.hidden;
  });
  if ((await billingContent.getAttribute("data-state")) !== "closed") {
    throw new Error("Expected the default Astro accordion to close its last open item.");
  }

  const requiredOpenAccordion = page.locator("#runtime-required-open-accordion");
  const requiredOpenTrigger = requiredOpenAccordion.getByRole("button", {
    name: "Runtime behavior",
  });
  await requiredOpenTrigger.click();
  if ((await requiredOpenTrigger.getAttribute("aria-expanded")) !== "true") {
    throw new Error("Expected collapsible={false} to retain the open Astro accordion item.");
  }

  await page.getByRole("button", { name: "Discard draft" }).click();
  await page.getByRole("heading", { name: "Discard draft?" }).waitFor();

  const defaultAlertDialogState = await page
    .locator('[data-slot="alert-dialog-content"]')
    .first()
    .evaluate((content) => ({
      describedBy: content.getAttribute("aria-describedby"),
      labelledBy: content.getAttribute("aria-labelledby"),
      open: content instanceof HTMLDialogElement ? content.open : null,
      role: content.getAttribute("role"),
      state: content.getAttribute("data-state"),
    }));
  if (
    defaultAlertDialogState.open !== true ||
    defaultAlertDialogState.role !== "alertdialog" ||
    defaultAlertDialogState.state !== "open" ||
    !defaultAlertDialogState.labelledBy ||
    !defaultAlertDialogState.describedBy
  ) {
    throw new Error(
      `Expected Astro Alert Dialog to open with alertdialog semantics, got ${JSON.stringify(
        defaultAlertDialogState,
      )}.`,
    );
  }

  await page.mouse.click(20, 20);
  const defaultAlertStillOpen = await page
    .locator('[data-slot="alert-dialog-content"][open]')
    .count();
  if (defaultAlertStillOpen !== 1) {
    throw new Error("Expected default Astro Alert Dialog to ignore outside clicks.");
  }

  await page.getByLabel("Discard draft?").getByRole("button", { name: "Cancel" }).click();
  const closingAlertDialog = await page
    .locator('[data-slot="alert-dialog-content"][data-state="closed"][open]')
    .count();
  const closingAlertBackdropState = await page
    .locator('[data-slot="alert-dialog-backdrop"]')
    .first()
    .evaluate((backdrop) => ({
      display: backdrop instanceof HTMLElement ? getComputedStyle(backdrop).display : null,
      hidden: backdrop instanceof HTMLElement ? backdrop.hidden : null,
      state: backdrop.getAttribute("data-state"),
    }));
  if (
    closingAlertDialog !== 1 ||
    closingAlertBackdropState.display === "none" ||
    closingAlertBackdropState.state !== "closed" ||
    closingAlertBackdropState.hidden !== false
  ) {
    throw new Error(
      `Expected Astro Alert Dialog to keep content/backdrop visible during close animation, got ${JSON.stringify(
        {
          closingAlertDialog,
          closingAlertBackdropState,
        },
      )}.`,
    );
  }
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);

  await page.getByRole("button", { name: "Open dismissible alert" }).click();
  await page.getByRole("heading", { name: "Dismissible alert dialog" }).waitFor();
  await page.mouse.click(20, 20);
  const dismissibleClosingAlert = await page
    .locator(
      '#runtime-alert-dialog-outside [data-slot="alert-dialog-content"][data-state="closed"][open]',
    )
    .count();
  if (dismissibleClosingAlert !== 1) {
    throw new Error("Expected opt-in Astro Alert Dialog outside click to begin closing.");
  }
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);

  await verifyDialogEntryAnimationGestures({
    backdrop: '#runtime-sheet-default [data-slot="sheet-backdrop"]',
    content: page.locator('#runtime-sheet-default [data-slot="sheet-content"]'),
    expectedDuration: 500,
    label: "Astro Sheet",
    page,
    trigger: page.getByRole("button", { exact: true, name: "Open sheet" }),
  });

  await page.getByRole("button", { exact: true, name: "Open sheet" }).click();
  await page.getByRole("heading", { name: "Runtime sheet" }).waitFor();

  const openSheetState = await page
    .locator('#runtime-sheet-default [data-slot="sheet-content"]')
    .evaluate((content) => ({
      className: content.getAttribute("class"),
      dataSide: content.getAttribute("data-side"),
      dataSlot: content.getAttribute("data-slot"),
      describedBy: content.getAttribute("aria-describedby"),
      labelledBy: content.getAttribute("aria-labelledby"),
      open: content instanceof HTMLDialogElement ? content.open : null,
      role: content.getAttribute("role"),
      state: content.getAttribute("data-state"),
    }));
  const sheetCloseState = await page
    .locator('#runtime-sheet-default [data-slot="sheet-content"]')
    .evaluate((content) => {
      const closeButtons = Array.from(content.querySelectorAll('[data-slot="sheet-close"]'));
      const defaultClose = closeButtons[0];
      const label = defaultClose?.querySelector("span");

      return {
        closeCount: closeButtons.length,
        defaultCloseAriaHidden: defaultClose?.getAttribute("aria-hidden"),
        defaultCloseName: defaultClose?.textContent?.replace(/\s+/g, " ").trim(),
        labelClassName: label?.getAttribute("class"),
        labelText: label?.textContent?.trim(),
      };
    });
  if (
    openSheetState.open !== true ||
    openSheetState.role !== "dialog" ||
    openSheetState.state !== "open" ||
    openSheetState.dataSide !== "right" ||
    !openSheetState.labelledBy ||
    !openSheetState.describedBy ||
    openSheetState.dataSlot !== "sheet-content" ||
    openSheetState.className?.includes("slide-in-from-right") !== true ||
    openSheetState.className?.includes("runtime-sheet-custom") !== true
  ) {
    throw new Error(
      `Expected Astro Sheet to open with Sheet styling and dialog semantics, got ${JSON.stringify(
        openSheetState,
      )}.`,
    );
  }
  if (
    sheetCloseState.closeCount !== 1 ||
    sheetCloseState.defaultCloseAriaHidden !== null ||
    sheetCloseState.defaultCloseName !== "Close sheet" ||
    sheetCloseState.labelText !== "Close sheet" ||
    sheetCloseState.labelClassName?.includes("sr-only") !== true
  ) {
    throw new Error(
      `Expected Astro Sheet to expose one icon close button with a visually hidden label, got ${JSON.stringify(
        sheetCloseState,
      )}.`,
    );
  }

  await page.mouse.click(20, 20);
  const closingSheet = await page
    .locator('#runtime-sheet-default [data-slot="sheet-content"][data-state="closed"][open]')
    .count();
  const closingSheetBackdropState = await page
    .locator('#runtime-sheet-default [data-slot="sheet-backdrop"]')
    .evaluate((backdrop) => ({
      display: backdrop instanceof HTMLElement ? getComputedStyle(backdrop).display : null,
      hidden: backdrop instanceof HTMLElement ? backdrop.hidden : null,
      state: backdrop.getAttribute("data-state"),
    }));
  if (
    closingSheet !== 1 ||
    closingSheetBackdropState.display === "none" ||
    closingSheetBackdropState.state !== "closed" ||
    closingSheetBackdropState.hidden !== false
  ) {
    throw new Error(
      `Expected outside click to close Astro sheet with exit animation, got ${JSON.stringify({
        closingSheet,
        closingSheetBackdropState,
      })}.`,
    );
  }
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);

  const sheetDirectionCases = [
    {
      closeId: "runtime-sheet-side-top-close",
      closeName: "Close top sheet",
      description: "This sheet opens from the top of the screen.",
      heading: "Top sheet direction",
      inputId: "runtime-sheet-side-top-name",
      rootId: "runtime-sheet-side-top",
      side: "top",
      slideClass: "slide-in-from-top",
      triggerId: "runtime-sheet-side-top-trigger",
      triggerName: "Open top sheet",
      usernameId: "runtime-sheet-side-top-username",
    },
    {
      closeId: "runtime-sheet-side-right-close",
      closeName: "Close right sheet",
      description: "This sheet opens from the right side of the screen.",
      heading: "Right sheet direction",
      inputId: "runtime-sheet-side-right-name",
      rootId: "runtime-sheet-side-right",
      side: "right",
      slideClass: "slide-in-from-right",
      triggerId: "runtime-sheet-side-right-trigger",
      triggerName: "Open right sheet",
      usernameId: "runtime-sheet-side-right-username",
    },
    {
      closeId: "runtime-sheet-side-bottom-close",
      closeName: "Close bottom sheet",
      description: "This sheet opens from the bottom of the screen.",
      heading: "Bottom sheet direction",
      inputId: "runtime-sheet-side-bottom-name",
      rootId: "runtime-sheet-side-bottom",
      side: "bottom",
      slideClass: "slide-in-from-bottom",
      triggerId: "runtime-sheet-side-bottom-trigger",
      triggerName: "Open bottom sheet",
      usernameId: "runtime-sheet-side-bottom-username",
    },
    {
      closeId: "runtime-sheet-side-left-close",
      closeName: "Close left sheet",
      description: "This sheet opens from the left side of the screen.",
      heading: "Left sheet direction",
      inputId: "runtime-sheet-side-left-name",
      rootId: "runtime-sheet-side-left",
      side: "left",
      slideClass: "slide-in-from-left",
      triggerId: "runtime-sheet-side-left-trigger",
      triggerName: "Open left sheet",
      usernameId: "runtime-sheet-side-left-username",
    },
  ];

  for (const direction of sheetDirectionCases) {
    await page.locator(`#${direction.triggerId}`).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog", { name: direction.heading }).waitFor();
    const directionOpenState = await page
      .locator(`#${direction.rootId} [data-slot="sheet-content"]`)
      .evaluate((content, expected) => {
        const close = document.querySelector(`#${expected.closeId}`);
        const input = document.querySelector(`#${expected.inputId}`);
        const usernameInput = document.querySelector(`#${expected.usernameId}`);
        const label = document.querySelector(`label[for='${expected.inputId}']`);
        const usernameLabel = document.querySelector(`label[for='${expected.usernameId}']`);
        const trigger = document.querySelector(`#${expected.triggerId}`);
        const labelledBy = content.getAttribute("aria-labelledby");
        const describedBy = content.getAttribute("aria-describedby");
        const styles = content instanceof HTMLElement ? getComputedStyle(content) : null;
        const hasEdgeAnchor =
          expected.side === "top"
            ? styles?.top === "0px" && styles?.left === "0px" && styles?.right === "0px"
            : expected.side === "right"
              ? styles?.top === "0px" && styles?.right === "0px" && styles?.bottom === "0px"
              : expected.side === "bottom"
                ? styles?.right === "0px" && styles?.bottom === "0px" && styles?.left === "0px"
                : styles?.top === "0px" && styles?.bottom === "0px" && styles?.left === "0px";

        return {
          className: content.getAttribute("class"),
          closeClassName: close instanceof HTMLElement ? close.className : null,
          closeDataSlot: close?.getAttribute("data-slot"),
          closeHasSheetAttribute: close?.hasAttribute("data-sw-drawer-close") ?? null,
          dataSlot: content.getAttribute("data-slot"),
          dataSide: content.getAttribute("data-side"),
          descriptionText: describedBy
            ? document.getElementById(describedBy)?.textContent?.replace(/\s+/g, " ").trim()
            : null,
          describedBy,
          edgeAnchor: hasEdgeAnchor,
          hidden: content instanceof HTMLElement ? content.hidden : null,
          inputLabel: label?.textContent?.replace(/\s+/g, " ").trim(),
          inputValue: input instanceof HTMLInputElement ? input.value : null,
          labelledBy,
          open: content instanceof HTMLDialogElement ? content.open : null,
          position: styles?.position,
          role: content.getAttribute("role"),
          state: content.getAttribute("data-state"),
          titleText: labelledBy
            ? document.getElementById(labelledBy)?.textContent?.replace(/\s+/g, " ").trim()
            : null,
          triggerClassName: trigger instanceof HTMLElement ? trigger.className : null,
          triggerDataSlot: trigger?.getAttribute("data-slot"),
          triggerHasSheetAttribute: trigger?.hasAttribute("data-sw-drawer-trigger"),
          usernameLabel: usernameLabel?.textContent?.replace(/\s+/g, " ").trim(),
          usernameValue: usernameInput instanceof HTMLInputElement ? usernameInput.value : null,
        };
      }, direction);
    if (
      directionOpenState.open !== true ||
      directionOpenState.hidden !== false ||
      directionOpenState.role !== "dialog" ||
      directionOpenState.state !== "open" ||
      directionOpenState.dataSide !== direction.side ||
      !directionOpenState.labelledBy ||
      !directionOpenState.describedBy ||
      directionOpenState.titleText !== direction.heading ||
      directionOpenState.descriptionText !== direction.description ||
      directionOpenState.inputValue !== "Pedro Duarte" ||
      directionOpenState.inputLabel !== "Name" ||
      directionOpenState.usernameValue !== "@peduarte" ||
      directionOpenState.usernameLabel !== "Username" ||
      directionOpenState.position !== "fixed" ||
      directionOpenState.edgeAnchor !== true ||
      directionOpenState.dataSlot !== "sheet-content" ||
      directionOpenState.className?.includes(direction.slideClass) !== true ||
      directionOpenState.triggerDataSlot !== "button" ||
      directionOpenState.triggerHasSheetAttribute !== true ||
      directionOpenState.closeDataSlot !== "button" ||
      directionOpenState.closeHasSheetAttribute !== true
    ) {
      throw new Error(
        `Expected Astro ${direction.side} Sheet direction example to open correctly, got ${JSON.stringify(
          directionOpenState,
        )}.`,
      );
    }

    await page.locator(`#${direction.closeId}`).focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);
    const directionClosedState = await page
      .locator(`#${direction.rootId} [data-slot="sheet-content"]`)
      .evaluate(
        (content, expected) => ({
          activeElementId:
            document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
          hidden: content instanceof HTMLElement ? content.hidden : null,
          open: content instanceof HTMLDialogElement ? content.open : null,
          state: content.getAttribute("data-state"),
          triggerExpanded: document
            .querySelector(`#${expected.triggerId}`)
            ?.getAttribute("aria-expanded"),
        }),
        direction,
      );
    if (
      directionClosedState.activeElementId !== direction.triggerId ||
      directionClosedState.hidden !== true ||
      directionClosedState.open !== false ||
      directionClosedState.state !== "closed" ||
      directionClosedState.triggerExpanded !== "false"
    ) {
      throw new Error(
        `Expected Astro ${direction.side} Sheet direction example to close and return focus, got ${JSON.stringify(
          directionClosedState,
        )}.`,
      );
    }
  }

  await page.getByRole("button", { name: "Open sheet menu" }).click();
  await page.getByRole("heading", { name: "Sheet dropdown portal" }).waitFor();
  await page.getByRole("button", { name: "Open sheet dropdown" }).click();
  await page.locator("#runtime-sheet-dropdown-content").waitFor({ state: "visible" });
}

async function verifyAstroImageCases({ page, serverMode }) {
  const images = page.locator("#runtime-image-demo img[data-slot='image']");
  await images.first().waitFor({ state: "visible" });
  await images.last().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const images = Array.from(
      document.querySelectorAll("#runtime-image-demo img[data-slot='image']"),
    );

    return (
      images.length === 2 &&
      images.every(
        (image) =>
          image instanceof HTMLImageElement &&
          image.complete &&
          image.naturalWidth > 0 &&
          image.naturalHeight > 0,
      )
    );
  });

  const imageStates = await images.evaluateAll((items) =>
    items.map((image) => {
      const rect = image.getBoundingClientRect();

      return {
        alt: image.getAttribute("alt"),
        className: image.getAttribute("class"),
        complete: image instanceof HTMLImageElement ? image.complete : null,
        hasWidthAttribute: image.hasAttribute("width"),
        heightAttribute: image.getAttribute("height"),
        naturalHeight: image instanceof HTMLImageElement ? image.naturalHeight : null,
        naturalWidth: image instanceof HTMLImageElement ? image.naturalWidth : null,
        renderedHeight: rect.height,
        renderedWidth: rect.width,
        slot: image.getAttribute("data-slot"),
        src: image.getAttribute("src"),
        widthAttribute: image.getAttribute("width"),
      };
    }),
  );
  const importedImageState = imageStates.find((image) => image.alt === "Runtime image fixture");
  const remoteImageState = imageStates.find(
    (image) => image.alt === "Workspace with desks and large windows",
  );
  const hasExpectedImportedSource = hasOptimizedImageSource(importedImageState?.src, serverMode);
  const hasExpectedRemoteSource = hasOptimizedImageSource(remoteImageState?.src, serverMode);

  if (
    imageStates.length !== 2 ||
    importedImageState?.slot !== "image" ||
    importedImageState.className?.includes("runtime-image-custom") !== true ||
    importedImageState.hasWidthAttribute !== true ||
    Number(importedImageState.widthAttribute) <= 0 ||
    Number(importedImageState.heightAttribute) <= 0 ||
    importedImageState.complete !== true ||
    Number(importedImageState.naturalWidth) <= 0 ||
    Number(importedImageState.naturalHeight) <= 0 ||
    importedImageState.renderedWidth <= 0 ||
    importedImageState.renderedHeight <= 0 ||
    hasExpectedImportedSource !== true ||
    remoteImageState?.slot !== "image" ||
    remoteImageState.hasWidthAttribute !== true ||
    remoteImageState.complete !== true ||
    Number(remoteImageState.naturalWidth) <= 0 ||
    Number(remoteImageState.naturalHeight) <= 0 ||
    remoteImageState.renderedWidth <= 0 ||
    remoteImageState.renderedHeight <= 0 ||
    hasExpectedRemoteSource !== true
  ) {
    throw new Error(
      `Expected Astro Image demo to render optimized imported and remote Astro image output with dimensions and Starwind styling, got ${JSON.stringify(
        imageStates,
      )}.`,
    );
  }
}

function hasOptimizedImageSource(src, serverMode) {
  if (!src) {
    return false;
  }

  if (serverMode === "dev") {
    return src.includes("/_image");
  }

  if (serverMode === "external") {
    return src.includes("/_astro/") || src.includes("/_image");
  }

  return src.includes("/_astro/");
}
