import { expectText } from "../shared/text.mjs";
import { verifyTooltipPlacements, verifyTooltipPropExamples } from "../shared/tooltip.mjs";
import { verifyHoverCardCases } from "../shared/hover-card.mjs";
import { verifyVideoCases } from "../shared/video.mjs";
import { verifyDialogEntryAnimationGestures } from "../shared/dialog-entry-animation.mjs";

export async function verifyReactMediaOverlayCases({ page, messages }) {
  await verifyVideoCases({
    page,
    ids: {
      demo: "react-runtime-video-demo",
      native: "react-runtime-video-native",
      shorts: "react-runtime-video-shorts",
      youtube: "react-runtime-video-youtube",
    },
    label: "React",
  });
  await verifyHoverCardCases({
    page,
    ids: {
      asChildAlign: "end",
      asChildContent: "react-runtime-hover-card-as-child-content",
      asChildHref: "#react-runtime-hover-card-as-child",
      asChildSide: "left",
      asChildTrigger: "react-runtime-hover-card-as-child-trigger",
      alignedContent: "react-runtime-hover-card-aligned-content",
      alignedTrigger: "react-runtime-hover-card-aligned-trigger",
      controlledContent: "react-runtime-hover-card-controlled-content",
      controlledRoot: "react-runtime-hover-card-controlled",
      controlledTrigger: "react-runtime-hover-card-controlled-trigger",
      demo: "react-runtime-hover-card-demo",
      expectedRootCount: 8,
      hoverableContent: "react-runtime-hover-card-aligned-content",
      hoverableTrigger: "react-runtime-hover-card-aligned-trigger",
      nonHoverableContent: "react-runtime-hover-card-no-hoverable-content",
      nonHoverableTrigger: "react-runtime-hover-card-no-hoverable-trigger",
      sideContent: (side) => `react-runtime-hover-card-side-${side}-content`,
      sideTrigger: (side) => `react-runtime-hover-card-side-${side}-trigger`,
    },
    label: "React",
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
    const loadedRoot = document.querySelector("#react-runtime-avatar-loaded");
    const loadedImage = loadedRoot?.querySelector('[data-slot="avatar-image"]');
    const loadedFallback = loadedRoot?.querySelector('[data-slot="avatar-fallback"]');
    const errorRoot = document.querySelector("#react-runtime-avatar-error");
    const errorImage = errorRoot?.querySelector('[data-slot="avatar-image"]');
    const errorFallback = errorRoot?.querySelector('[data-slot="avatar-fallback"]');
    const delayedRoot = document.querySelector("#react-runtime-avatar-delayed");
    const delayedFallback = delayedRoot?.querySelector('[data-slot="avatar-fallback"]');

    loadedImage?.dispatchEvent(new Event("load"));
    errorImage?.dispatchEvent(new Event("error"));

    const readRootGeometry = (root) => {
      if (!(root instanceof HTMLElement)) return null;
      const rect = root.getBoundingClientRect();
      return {
        display: getComputedStyle(root).display,
        height: rect.height,
        width: rect.width,
      };
    };
    const readVisuals = () => {
      if (!(errorRoot instanceof HTMLElement) || !(errorFallback instanceof HTMLElement)) {
        return null;
      }
      const rootRect = errorRoot.getBoundingClientRect();
      const fallbackRect = errorFallback.getBoundingClientRect();
      const rootStyle = getComputedStyle(errorRoot);
      const fallbackStyle = getComputedStyle(errorFallback);
      return {
        centerDelta: Math.hypot(
          rootRect.left + rootRect.width / 2 - (fallbackRect.left + fallbackRect.width / 2),
          rootRect.top + rootRect.height / 2 - (fallbackRect.top + fallbackRect.height / 2),
        ),
        fallbackAlignItems: fallbackStyle.alignItems,
        fallbackColor: fallbackStyle.color,
        fallbackDisplay: fallbackStyle.display,
        fallbackJustifyContent: fallbackStyle.justifyContent,
        rootBackground: rootStyle.backgroundColor,
        rootColor: rootStyle.color,
      };
    };
    const hadDarkClass = document.documentElement.classList.contains("dark");
    document.documentElement.classList.remove("dark");
    const lightVisuals = readVisuals();
    document.documentElement.classList.add("dark");
    const darkVisuals = readVisuals();
    document.documentElement.classList.toggle("dark", hadDarkClass);

    return {
      darkVisuals,
      delayedFallbackDelay: delayedFallback?.getAttribute("data-delay"),
      delayedFallbackHidden:
        delayedFallback instanceof HTMLElement ? delayedFallback.hidden : undefined,
      delayedGeometry: readRootGeometry(delayedRoot),
      delayedRootClassName: delayedRoot?.getAttribute("class"),
      errorFallbackClassName: errorFallback?.getAttribute("class"),
      errorFallbackHidden: errorFallback instanceof HTMLElement ? errorFallback.hidden : undefined,
      errorGeometry: readRootGeometry(errorRoot),
      errorImageHidden: errorImage instanceof HTMLImageElement ? errorImage.hidden : undefined,
      errorImageVisibility:
        errorImage instanceof HTMLElement ? errorImage.style.visibility : undefined,
      errorRootClassName: errorRoot?.getAttribute("class"),
      errorStatus: errorRoot?.getAttribute("data-image-loading-status"),
      lightVisuals,
      loadedFallbackClassName: loadedFallback?.getAttribute("class"),
      loadedFallbackHidden:
        loadedFallback instanceof HTMLElement ? loadedFallback.hidden : undefined,
      loadedGeometry: readRootGeometry(loadedRoot),
      loadedImageAlt: loadedImage?.getAttribute("alt"),
      loadedImageClassName: loadedImage?.getAttribute("class"),
      loadedImageHidden: loadedImage instanceof HTMLImageElement ? loadedImage.hidden : undefined,
      loadedImageVisibleState: readVisibleImageState(loadedImage),
      loadedRootClassName: loadedRoot?.getAttribute("class"),
      loadedRootDataSlot: loadedRoot?.getAttribute("data-slot"),
      loadedRootHasDataSw: loadedRoot?.hasAttribute("data-sw-avatar"),
      loadedRootTagName: loadedRoot?.tagName,
      loadedStatus: loadedRoot?.getAttribute("data-image-loading-status"),
      rootCount: document.querySelectorAll('[data-slot="avatar"][data-sw-avatar]').length,
    };
  });
  await expectText(page.locator("[data-runtime-avatar-ref]"), "avatar");
  await expectText(page.locator("[data-runtime-avatar-status]"), "loaded");

  const avatarAfterStatusState = await page.evaluate(() => {
    const loadedRoot = document.querySelector("#react-runtime-avatar-loaded");
    const loadedImage = loadedRoot?.querySelector('[data-slot="avatar-image"]');
    const loadedFallback = loadedRoot?.querySelector('[data-slot="avatar-fallback"]');

    return {
      loadedFallbackHidden:
        loadedFallback instanceof HTMLElement ? loadedFallback.hidden : undefined,
      loadedImageHidden: loadedImage instanceof HTMLImageElement ? loadedImage.hidden : undefined,
      loadedStatus: loadedRoot?.getAttribute("data-image-loading-status"),
    };
  });

  if (
    avatarState.rootCount !== 3 ||
    avatarState.loadedRootTagName !== "SPAN" ||
    avatarState.loadedRootDataSlot !== "avatar" ||
    avatarState.loadedRootHasDataSw !== true ||
    avatarState.loadedStatus !== "loaded" ||
    avatarState.loadedRootClassName?.includes("runtime-avatar-custom") !== true ||
    avatarState.loadedRootClassName?.includes("border-primary") !== true ||
    avatarState.loadedRootClassName?.includes("h-12") !== true ||
    avatarState.loadedRootClassName?.includes("inline-flex") !== true ||
    !["flex", "inline-flex"].includes(avatarState.loadedGeometry?.display) ||
    avatarState.loadedGeometry?.height !== 48 ||
    avatarState.loadedGeometry?.width !== 48 ||
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
    avatarState.errorRootClassName?.includes("bg-muted") !== true ||
    avatarState.errorRootClassName?.includes("text-foreground") !== true ||
    avatarState.errorRootClassName?.includes("inline-flex") !== true ||
    !["flex", "inline-flex"].includes(avatarState.errorGeometry?.display) ||
    avatarState.errorGeometry?.height !== 40 ||
    avatarState.errorGeometry?.width !== 40 ||
    avatarState.errorImageHidden !== false ||
    avatarState.errorImageVisibility !== "hidden" ||
    avatarState.errorFallbackHidden !== false ||
    avatarState.errorFallbackClassName?.includes("font-medium") !== true ||
    avatarState.delayedRootClassName?.includes("inline-flex") !== true ||
    !["flex", "inline-flex"].includes(avatarState.delayedGeometry?.display) ||
    avatarState.delayedGeometry?.height !== 32 ||
    avatarState.delayedGeometry?.width !== 32 ||
    avatarState.delayedFallbackDelay !== "1000" ||
    avatarState.delayedFallbackHidden !== true ||
    avatarState.lightVisuals?.fallbackDisplay !== "flex" ||
    avatarState.lightVisuals?.fallbackAlignItems !== "center" ||
    avatarState.lightVisuals?.fallbackJustifyContent !== "center" ||
    avatarState.lightVisuals?.fallbackColor !== avatarState.lightVisuals?.rootColor ||
    avatarState.lightVisuals?.centerDelta > 0.5 ||
    avatarState.darkVisuals?.fallbackColor !== avatarState.darkVisuals?.rootColor ||
    avatarState.darkVisuals?.rootBackground === avatarState.lightVisuals?.rootBackground ||
    avatarState.darkVisuals?.rootColor === avatarState.lightVisuals?.rootColor
  ) {
    throw new Error(
      `Expected React Avatar runtime transitions and Starwind classes, got ${JSON.stringify(
        avatarState,
      )}.`,
    );
  }

  if (
    avatarAfterStatusState.loadedStatus !== "loaded" ||
    avatarAfterStatusState.loadedImageHidden !== false ||
    avatarAfterStatusState.loadedFallbackHidden !== true
  ) {
    throw new Error(
      `Expected React Avatar visibility to remain runtime-owned after status rerender, got ${JSON.stringify(
        avatarAfterStatusState,
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
      `Expected React Kbd roots and group with Starwind classes, got ${JSON.stringify({
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
  await page.locator("#react-runtime-tooltip-content").waitFor({ state: "visible" });
  const openTooltipState = await page
    .locator("#react-runtime-tooltip-content")
    .evaluate((content) => {
      const positioner = content.parentElement;

      return {
        className: content.getAttribute("class"),
        dataAlign: content.getAttribute("data-align"),
        dataSide: content.getAttribute("data-side"),
        dataSlot: content.getAttribute("data-slot"),
        describedBy: document
          .querySelector("#react-runtime-tooltip-default [data-sw-tooltip-trigger]")
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
        rootContains:
          document.querySelector("#react-runtime-tooltip-default")?.contains(content) ?? null,
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
    openTooltipState.describedBy !== "react-runtime-tooltip-content" ||
    openTooltipState.tabIndexAttribute !== null ||
    openTooltipState.interactiveDescendantCount !== 0 ||
    openTooltipState.dataSlot !== "tooltip-content"
  ) {
    throw new Error(
      `Expected React Tooltip to open as a portaled positioned tooltip, got ${JSON.stringify(
        openTooltipState,
      )}.`,
    );
  }
  await page.mouse.move(20, 20);
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-tooltip-content");
    const root = document.querySelector("#react-runtime-tooltip-default");

    return (
      content instanceof HTMLElement &&
      root instanceof HTMLElement &&
      content.hidden &&
      root.contains(content)
    );
  });

  await verifyTooltipPropExamples(page, "react-runtime", { react: true });
  await verifyTooltipPlacements(page, "react-runtime");

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
      adversarial: Object.fromEntries(
        [
          "reversed",
          "equal-complete",
          "equal-progressing",
          "invalid-bounds",
          "nan",
          "positive-infinity",
          "negative-infinity",
        ].map((name) => [name, readProgress(`react-runtime-progress-${name}`)]),
      ),
      default: readProgress("react-runtime-progress-default"),
      indeterminate: readProgress("react-runtime-progress-indeterminate"),
      rootCount: document.querySelectorAll('[data-slot="progress"][data-sw-progress]').length,
      updating: readProgress("react-runtime-progress-updating"),
    };

    document.querySelector("#react-runtime-progress-updating")?.setAttribute("data-value", "75");
    await Promise.resolve();
    await Promise.resolve();

    return {
      initial,
      updated: readProgress("react-runtime-progress-updating"),
    };
  });
  if (
    progressState.initial.rootCount !== 17 ||
    progressState.initial.default.role !== "progressbar" ||
    progressState.initial.default.ariaMin !== "0" ||
    progressState.initial.default.ariaMax !== "100" ||
    progressState.initial.default.ariaNow !== "40" ||
    progressState.initial.default.ariaLabel !== "React upload progress" ||
    progressState.initial.default.ariaText !== "40%" ||
    progressState.initial.default.dataValue !== "40" ||
    progressState.initial.default.dataProgressing !== true ||
    progressState.initial.default.dataSlot !== "progress" ||
    progressState.initial.default.indicatorSlot !== "progress-indicator" ||
    progressState.initial.default.trackSlot !== "progress-track" ||
    progressState.initial.default.indicatorTransform !== "translateX(-60%)" ||
    progressState.initial.indeterminate.dataIndeterminate !== true ||
    progressState.initial.indeterminate.ariaLabel !== "React sync progress" ||
    progressState.initial.indeterminate.ariaNow !== null ||
    progressState.initial.indeterminate.indicatorTransform !== "" ||
    progressState.initial.indeterminate.className?.includes("relative") !== true ||
    progressState.initial.indeterminate.indicatorClassName?.includes("absolute") !== true ||
    progressState.initial.updating.ariaNow !== "25" ||
    progressState.initial.updating.ariaLabel !== "React processing progress" ||
    progressState.updated.ariaNow !== "75" ||
    progressState.updated.ariaText !== "75%" ||
    progressState.updated.indicatorTransform !== "translateX(-25%)"
  ) {
    throw new Error(
      `Expected React Progress runtime styling, ARIA, and data-value updates, got ${JSON.stringify(
        progressState,
      )}.`,
    );
  }
  const expectedAdversarialProgress = {
    "equal-complete": ["10", "10", "10", "complete", "translateX(0%)"],
    "equal-progressing": ["10", "10", "10", "complete", "translateX(0%)"],
    "invalid-bounds": ["0", "100", "25", "progressing", "translateX(-75%)"],
    reversed: ["0", "100", "25", "progressing", "translateX(-75%)"],
  };
  for (const [name, expected] of Object.entries(expectedAdversarialProgress)) {
    const actual = progressState.initial.adversarial[name];
    const received = [
      actual.ariaMin,
      actual.ariaMax,
      actual.ariaNow,
      actual.dataStatus,
      actual.indicatorTransform,
    ];
    if (JSON.stringify(received) !== JSON.stringify(expected)) {
      throw new Error(`Expected normalized React Progress ${name}, got ${JSON.stringify(actual)}.`);
    }
  }
  for (const name of ["nan", "positive-infinity", "negative-infinity"]) {
    const actual = progressState.initial.adversarial[name];
    if (
      actual.dataIndeterminate !== true ||
      actual.ariaNow !== null ||
      actual.dataValue !== null ||
      actual.dataStatus !== "indeterminate" ||
      actual.indicatorTransform !== ""
    ) {
      throw new Error(
        `Expected indeterminate React Progress ${name}, got ${JSON.stringify(actual)}.`,
      );
    }
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
      `Expected default collapsible panel to open without animation styling, got ${JSON.stringify(
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
      `Expected closing React collapsible panel to enter closed state without inline animation styling, got ${JSON.stringify(
        closingCollapsibleState,
      )}.`,
    );
  }
  await page.waitForFunction(() => {
    const content = document.querySelector('[data-slot="collapsible-content"]');
    return content instanceof HTMLElement && content.hidden;
  });

  const collapsibleAsChildInitial = await page
    .locator("#react-runtime-collapsible-as-child-trigger")
    .evaluate((trigger) => ({
      className: trigger.getAttribute("class"),
      controls: trigger.getAttribute("aria-controls"),
      expanded: trigger.getAttribute("aria-expanded"),
      hasDataSlot: trigger.getAttribute("data-slot") === "collapsible-trigger",
      hasTriggerAttribute: trigger.hasAttribute("data-sw-collapsible-trigger"),
      tagName: trigger.tagName,
    }));
  await page.getByRole("button", { name: "As child notes" }).click();
  const collapsibleAsChildOpen = await page.evaluate(() => {
    const trigger = document.querySelector("#react-runtime-collapsible-as-child-trigger");
    const content = document.querySelector("#react-runtime-collapsible-as-child-content");

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
    collapsibleAsChildInitial.expanded !== "false" ||
    !collapsibleAsChildInitial.controls ||
    collapsibleAsChildOpen.expanded !== "true" ||
    collapsibleAsChildOpen.contentState !== "open" ||
    collapsibleAsChildOpen.contentHidden !== false
  ) {
    throw new Error(
      `Expected React Collapsible asChild trigger to clone runtime attributes and open, got ${JSON.stringify(
        { collapsibleAsChildInitial, collapsibleAsChildOpen },
      )}.`,
    );
  }

  const controlledCollapsibleCount = page.locator("[data-runtime-controlled-collapsible-count]");
  await expectText(controlledCollapsibleCount, "Collapsible changes: 0");
  await page.getByRole("button", { name: "Parent opens controlled collapsible" }).click();
  await page.getByText("Controlled collapsible content").waitFor();
  await expectText(controlledCollapsibleCount, "Collapsible changes: 0");
  await page.getByRole("button", { name: "Controlled collapsible trigger" }).click();
  await expectText(controlledCollapsibleCount, "Collapsible changes: 1");

  const controlledAccordionCount = page.locator("[data-runtime-controlled-accordion-count]");
  await expectText(controlledAccordionCount, "Accordion changes: 0");
  await page.getByRole("button", { name: "Parent sets controlled accordion" }).click();
  await page.getByText("Controlled billing content").waitFor();
  await expectText(controlledAccordionCount, "Accordion changes: 0");
  await page.getByRole("button", { name: "Controlled shipping" }).click();
  await page.getByText("Controlled shipping content").waitFor();
  await expectText(controlledAccordionCount, "Accordion changes: 1");

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
      `Expected default accordion panel to open without an initial animation, got ${JSON.stringify(
        initialAccordionState,
      )}.`,
    );
  }

  await page.getByRole("button", { name: "Returns" }).click();
  const closingAccordionState = await shippingContent.evaluate((content) => ({
    hidden: content instanceof HTMLElement ? content.hidden : null,
    state: content.getAttribute("data-state"),
  }));
  if (closingAccordionState.state !== "closed" || closingAccordionState.hidden !== false) {
    throw new Error(
      `Expected closing accordion panel to remain visible during exit animation, got ${JSON.stringify(
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

  try {
    await page.getByText("Trigger, panel, keyboard navigation").waitFor({ timeout: 2000 });
  } catch (error) {
    const diagnostics = await page.locator("[data-sw-accordion-item]").evaluateAll((items) =>
      items.map((item) => {
        const trigger = item.querySelector("[data-sw-accordion-trigger]");
        const content = item.querySelector("[data-sw-accordion-content]");

        return {
          itemState: item.getAttribute("data-state"),
          value: item.getAttribute("data-value"),
          disabled: item.getAttribute("data-disabled"),
          triggerState: trigger?.getAttribute("data-state"),
          triggerExpanded: trigger?.getAttribute("aria-expanded"),
          triggerDisabled: trigger instanceof HTMLButtonElement ? trigger.disabled : null,
          contentState: content?.getAttribute("data-state"),
          contentHidden: content instanceof HTMLElement ? content.hidden : null,
        };
      }),
    );
    const rootDiagnostics = await page.locator("[data-sw-accordion]").evaluateAll((roots) =>
      roots.map((root) => ({
        rootState: root.getAttribute("data-state"),
        type: root.getAttribute("data-type"),
        defaultValue: root.getAttribute("data-default-value"),
        collapsible: root.getAttribute("data-collapsible"),
        itemCount: root.querySelectorAll("[data-sw-accordion-item]").length,
      })),
    );

    throw new Error(
      `Accordion did not open the second item.\nroots: ${JSON.stringify(
        rootDiagnostics,
        null,
        2,
      )}\nitems: ${JSON.stringify(diagnostics, null, 2)}\nmessages: ${JSON.stringify(
        messages,
        null,
        2,
      )}\n${String(error)}`,
    );
  }

  const returnsContent = page
    .locator('[data-sw-accordion-item][data-value="returns"] [data-sw-accordion-content]')
    .first();
  await page.getByRole("button", { name: "Returns" }).click();
  await page.waitForFunction(() => {
    const content = document.querySelector(
      '[data-sw-accordion-item][data-value="returns"] [data-sw-accordion-content]',
    );
    return content instanceof HTMLElement && content.hidden;
  });
  if ((await returnsContent.getAttribute("data-state")) !== "closed") {
    throw new Error("Expected the default React accordion to close its last open item.");
  }

  const requiredOpenAccordion = page.locator("#react-runtime-required-open-accordion");
  const requiredOpenTrigger = requiredOpenAccordion.getByRole("button", {
    name: "Runtime behavior",
  });
  await requiredOpenTrigger.click();
  if ((await requiredOpenTrigger.getAttribute("aria-expanded")) !== "true") {
    throw new Error("Expected collapsible={false} to retain the open React accordion item.");
  }

  await verifyDialogEntryAnimationGestures({
    backdrop: '#react-runtime-alert-dialog-default [data-slot="alert-dialog-backdrop"]',
    content: page.locator('#react-runtime-alert-dialog-default [data-slot="alert-dialog-content"]'),
    expectedDuration: 200,
    label: "React Alert Dialog",
    page,
    trigger: page.getByRole("button", { name: "Discard React draft", exact: true }),
  });

  await page.getByRole("button", { name: "Discard React draft" }).click();
  await page.getByRole("heading", { name: "Discard React draft?" }).waitFor();

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
      `Expected React Alert Dialog to open with alertdialog semantics, got ${JSON.stringify(
        defaultAlertDialogState,
      )}.`,
    );
  }

  await page.mouse.click(20, 96);
  const defaultAlertStillOpen = await page
    .locator('[data-slot="alert-dialog-content"][open]')
    .count();
  if (defaultAlertStillOpen !== 1) {
    throw new Error("Expected default React Alert Dialog to ignore outside clicks.");
  }

  await page
    .getByLabel("Discard React draft?")
    .getByRole("button", { exact: true, name: "Cancel" })
    .click();
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
      `Expected React Alert Dialog to keep content/backdrop visible during close animation, got ${JSON.stringify(
        {
          closingAlertDialog,
          closingAlertBackdropState,
        },
      )}.`,
    );
  }
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);

  await page.getByRole("button", { name: "Open controlled alert" }).click();
  await page.getByRole("heading", { name: "Controlled alert dialog" }).waitFor();
  await expectText(page.locator("#react-alert-dialog-count"), "1");
  await page.getByRole("button", { name: "Continue" }).click();
  await expectText(page.locator("#react-alert-dialog-count"), "2");
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);

  await verifyDialogEntryAnimationGestures({
    backdrop: '#react-runtime-sheet-default [data-slot="sheet-backdrop"]',
    content: page.locator('#react-runtime-sheet-default [data-slot="sheet-content"]'),
    expectedDuration: 500,
    label: "React Sheet",
    page,
    trigger: page.getByRole("button", { exact: true, name: "Open React sheet" }),
  });

  await page.getByRole("button", { exact: true, name: "Open React sheet" }).click();
  await page.getByRole("heading", { name: "React runtime sheet" }).waitFor();

  const openSheetState = await page
    .locator('#react-runtime-sheet-default [data-slot="sheet-content"]')
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
    .locator('#react-runtime-sheet-default [data-slot="sheet-content"]')
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
      `Expected React Sheet to open with Sheet styling and dialog semantics, got ${JSON.stringify(
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
      `Expected React Sheet to expose one icon close button with a visually hidden label, got ${JSON.stringify(
        sheetCloseState,
      )}.`,
    );
  }

  await page.mouse.click(20, 96);
  const closingSheet = await page
    .locator('#react-runtime-sheet-default [data-slot="sheet-content"][data-state="closed"][open]')
    .count();
  const closingSheetBackdropState = await page
    .locator('#react-runtime-sheet-default [data-slot="sheet-backdrop"]')
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
      `Expected outside click to close React sheet with exit animation, got ${JSON.stringify({
        closingSheet,
        closingSheetBackdropState,
      })}.`,
    );
  }
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);

  const sheetDirectionCases = [
    {
      closeId: "react-runtime-sheet-side-top-close",
      closeName: "Close React top sheet",
      description: "This sheet opens from the top of the screen.",
      heading: "React top sheet direction",
      inputId: "react-runtime-sheet-side-top-name",
      rootId: "react-runtime-sheet-side-top",
      side: "top",
      slideClass: "slide-in-from-top",
      triggerId: "react-runtime-sheet-side-top-trigger",
      triggerName: "Open React top sheet",
      usernameId: "react-runtime-sheet-side-top-username",
    },
    {
      closeId: "react-runtime-sheet-side-right-close",
      closeName: "Close React right sheet",
      description: "This sheet opens from the right side of the screen.",
      heading: "React right sheet direction",
      inputId: "react-runtime-sheet-side-right-name",
      rootId: "react-runtime-sheet-side-right",
      side: "right",
      slideClass: "slide-in-from-right",
      triggerId: "react-runtime-sheet-side-right-trigger",
      triggerName: "Open React right sheet",
      usernameId: "react-runtime-sheet-side-right-username",
    },
    {
      closeId: "react-runtime-sheet-side-bottom-close",
      closeName: "Close React bottom sheet",
      description: "This sheet opens from the bottom of the screen.",
      heading: "React bottom sheet direction",
      inputId: "react-runtime-sheet-side-bottom-name",
      rootId: "react-runtime-sheet-side-bottom",
      side: "bottom",
      slideClass: "slide-in-from-bottom",
      triggerId: "react-runtime-sheet-side-bottom-trigger",
      triggerName: "Open React bottom sheet",
      usernameId: "react-runtime-sheet-side-bottom-username",
    },
    {
      closeId: "react-runtime-sheet-side-left-close",
      closeName: "Close React left sheet",
      description: "This sheet opens from the left side of the screen.",
      heading: "React left sheet direction",
      inputId: "react-runtime-sheet-side-left-name",
      rootId: "react-runtime-sheet-side-left",
      side: "left",
      slideClass: "slide-in-from-left",
      triggerId: "react-runtime-sheet-side-left-trigger",
      triggerName: "Open React left sheet",
      usernameId: "react-runtime-sheet-side-left-username",
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
        `Expected React ${direction.side} Sheet direction example to open correctly, got ${JSON.stringify(
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
        `Expected React ${direction.side} Sheet direction example to close and return focus, got ${JSON.stringify(
          directionClosedState,
        )}.`,
      );
    }
  }

  await page.getByRole("button", { name: "Open controlled sheet" }).click();
  await page.getByRole("heading", { name: "Controlled sheet" }).waitFor();
  await expectText(page.locator("#react-sheet-count"), "1");
  const controlledSheetState = await page
    .locator('#react-runtime-sheet-controlled [data-slot="sheet-content"]')
    .evaluate((content) => ({
      dataSide: content.getAttribute("data-side"),
      open: content instanceof HTMLDialogElement ? content.open : null,
      state: content.getAttribute("data-state"),
    }));
  if (
    controlledSheetState.open !== true ||
    controlledSheetState.state !== "open" ||
    controlledSheetState.dataSide !== "left"
  ) {
    throw new Error(
      `Expected controlled React Sheet to open from controlled state, got ${JSON.stringify(
        controlledSheetState,
      )}.`,
    );
  }
  await page.getByRole("button", { name: "Close controlled sheet" }).click();
  await expectText(page.locator("#react-sheet-count"), "2");
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);

  await page.getByRole("button", { name: "Open canceled sheet" }).click();
  await expectText(page.locator("#react-sheet-canceled-count"), "1");
  const canceledSheetState = await page
    .locator('#react-runtime-sheet-canceled [data-slot="sheet-content"]')
    .evaluate((content) => ({
      hidden: content instanceof HTMLElement ? content.hidden : null,
      open: content instanceof HTMLDialogElement ? content.open : null,
      rootState: content.closest("[data-sw-drawer]")?.getAttribute("data-state"),
      state: content.getAttribute("data-state"),
    }));
  if (
    canceledSheetState.open !== false ||
    canceledSheetState.hidden !== true ||
    canceledSheetState.state !== "closed" ||
    canceledSheetState.rootState !== "closed"
  ) {
    throw new Error(
      `Expected React Sheet onOpenChange cancellation to prevent opening, got ${JSON.stringify(
        canceledSheetState,
      )}.`,
    );
  }

  await page.getByRole("button", { name: "Open React sheet menu" }).click();
  await page.getByRole("heading", { name: "React sheet dropdown portal" }).waitFor();
  await page.getByRole("button", { name: "Open React sheet dropdown" }).click();
  await page.locator("#react-runtime-sheet-dropdown-content").waitFor({ state: "visible" });
}
