import { dispatchOutsidePointerDown } from "../../shared/pointer.mjs";
import { assertPublicPortalTopology } from "../../shared/public-portal-topology.mjs";

export async function verifyAstroPopoverCases({ page }) {
  const nativeRecipeClasses = [
    "inline-flex",
    "items-center",
    "justify-center",
    "focus-visible:ring-outline/50",
    "transition-[color,box-shadow]",
    "outline-none",
    "focus-visible:ring-3",
    "disabled:pointer-events-none",
  ];
  const nativeTriggerInitial = await page
    .locator("#runtime-popover-native-trigger")
    .evaluate((trigger) => ({
      classes: Array.from(trigger.classList),
      controls: trigger.getAttribute("aria-controls"),
      cursor: trigger instanceof HTMLElement ? getComputedStyle(trigger).cursor : null,
      expanded: trigger.getAttribute("aria-expanded"),
      hasTriggerAttribute: trigger.hasAttribute("data-sw-popover-trigger"),
      slot: trigger.getAttribute("data-slot"),
      tagName: trigger.tagName,
    }));
  if (
    !nativeRecipeClasses.every((className) => nativeTriggerInitial.classes.includes(className)) ||
    nativeTriggerInitial.classes.includes("cursor-help") !== true ||
    nativeTriggerInitial.cursor !== "help" ||
    nativeTriggerInitial.expanded !== "false" ||
    !nativeTriggerInitial.controls ||
    nativeTriggerInitial.hasTriggerAttribute !== true ||
    nativeTriggerInitial.slot !== "popover-trigger" ||
    nativeTriggerInitial.tagName !== "BUTTON"
  ) {
    throw new Error(
      `Expected native Astro Popover trigger to retain its recipe, consumer class, and runtime contract, got ${JSON.stringify(
        nativeTriggerInitial,
      )}.`,
    );
  }

  await page.getByRole("button", { name: "Open popover" }).click();
  await page.getByRole("heading", { name: "Runtime popover" }).waitFor();
  await assertPublicPortalTopology(page.locator("#runtime-popover-content"), {
    portalSlot: "popover-portal",
  });

  const openPopoverState = await page.locator("#runtime-popover-content").evaluate((content) => ({
    className: content.getAttribute("class"),
    dataAlign: content.getAttribute("data-align"),
    dataSide: content.getAttribute("data-side"),
    dataSlot: content.getAttribute("data-slot"),
    describedBy: content.getAttribute("aria-describedby"),
    hidden: content instanceof HTMLElement ? content.hidden : null,
    labelledBy: content.getAttribute("aria-labelledby"),
    parentTagName: content.parentElement?.tagName,
    position: content instanceof HTMLElement ? getComputedStyle(content).position : null,
    role: content.getAttribute("role"),
    rootContains: document.querySelector("#runtime-popover-default")?.contains(content) ?? null,
    state: content.getAttribute("data-state"),
    styleLeft: content instanceof HTMLElement ? content.style.left : null,
    styleTop: content instanceof HTMLElement ? content.style.top : null,
    triggerExpanded: document
      .querySelector("#runtime-popover-native-trigger")
      ?.getAttribute("aria-expanded"),
    triggerState: document
      .querySelector("#runtime-popover-native-trigger")
      ?.getAttribute("data-state"),
  }));
  if (
    openPopoverState.hidden !== false ||
    openPopoverState.role !== "dialog" ||
    openPopoverState.state !== "open" ||
    !["bottom", "top"].includes(openPopoverState.dataSide ?? "") ||
    openPopoverState.dataAlign !== "start" ||
    openPopoverState.parentTagName !== "DIV" ||
    openPopoverState.rootContains !== false ||
    openPopoverState.position !== "fixed" ||
    openPopoverState.styleLeft === "" ||
    openPopoverState.styleTop === "" ||
    !openPopoverState.labelledBy ||
    !openPopoverState.describedBy ||
    openPopoverState.dataSlot !== "popover-content" ||
    openPopoverState.className?.includes("runtime-popover-custom") !== true ||
    openPopoverState.triggerExpanded !== "true" ||
    openPopoverState.triggerState !== "open"
  ) {
    throw new Error(
      `Expected Astro Popover to open as a portaled positioned dialog, got ${JSON.stringify(
        openPopoverState,
      )}.`,
    );
  }

  await dispatchOutsidePointerDown(page);
  const closingPopoverState = await page
    .locator("#runtime-popover-content")
    .evaluate((content) => ({
      hidden: content instanceof HTMLElement ? content.hidden : null,
      contentInsidePortal:
        content.closest('[data-slot="popover-portal"]')?.contains(content) ?? false,
      portalParentTagName: content.closest('[data-slot="popover-portal"]')?.parentElement?.tagName,
      state: content.getAttribute("data-state"),
    }));
  const isClosingInPortal =
    closingPopoverState.state === "closed" &&
    closingPopoverState.hidden === false &&
    closingPopoverState.contentInsidePortal === true &&
    closingPopoverState.portalParentTagName === "BODY";
  const isClosedInRoot =
    closingPopoverState.state === "closed" &&
    closingPopoverState.hidden === true &&
    closingPopoverState.portalParentTagName !== "BODY";
  if (!isClosingInPortal && !isClosedInRoot) {
    throw new Error(
      `Expected outside click to close Astro Popover with either exit-animation presence or final hidden state, got ${JSON.stringify(
        closingPopoverState,
      )}.`,
    );
  }
  await page.waitForFunction(() => {
    const content = document.querySelector("#runtime-popover-content");
    const root = document.querySelector("#runtime-popover-default");

    return (
      content instanceof HTMLElement &&
      root instanceof HTMLElement &&
      content.hidden &&
      root.contains(content)
    );
  });

  const popoverAsChildInitial = await page
    .locator("#runtime-popover-as-child-trigger")
    .evaluate((trigger) => ({
      classes: Array.from(trigger.classList),
      controls: trigger.getAttribute("aria-controls"),
      expanded: trigger.getAttribute("aria-expanded"),
      hasAsChildWrapper:
        trigger.parentElement instanceof HTMLElement &&
        getComputedStyle(trigger.parentElement).display === "contents",
      hasDataSlot: trigger.getAttribute("data-slot") === "popover-trigger",
      hasTriggerAttribute: trigger.hasAttribute("data-sw-popover-trigger"),
      letterSpacing:
        trigger instanceof HTMLElement ? getComputedStyle(trigger).letterSpacing : null,
      slot: trigger.getAttribute("data-slot"),
      tagName: trigger.tagName,
      textTransform:
        trigger instanceof HTMLElement ? getComputedStyle(trigger).textTransform : null,
      wordSpacing: trigger instanceof HTMLElement ? getComputedStyle(trigger).wordSpacing : null,
    }));
  await page.locator("#runtime-popover-as-child-trigger").click();
  await page.locator("#runtime-popover-as-child-content").waitFor({ state: "visible" });
  await assertPublicPortalTopology(page.locator("#runtime-popover-as-child-content"), {
    portalSlot: "popover-portal",
  });
  const popoverAsChildOpen = await page.evaluate(() => {
    const trigger = document.querySelector("#runtime-popover-as-child-trigger");
    const content = document.querySelector("#runtime-popover-as-child-content");

    return {
      contentHidden: content instanceof HTMLElement ? content.hidden : null,
      contentRole: content?.getAttribute("role"),
      contentState: content?.getAttribute("data-state"),
      expanded: trigger?.getAttribute("aria-expanded"),
      listenerCount: trigger?.getAttribute("data-listener-count"),
      listenerText: document.querySelector("#runtime-popover-as-child-listener-count")?.textContent,
      parentTagName: content?.parentElement?.tagName,
      text: content?.textContent?.trim(),
    };
  });
  if (
    popoverAsChildInitial.tagName !== "A" ||
    popoverAsChildInitial.hasTriggerAttribute !== true ||
    popoverAsChildInitial.hasDataSlot !== true ||
    popoverAsChildInitial.hasAsChildWrapper !== true ||
    nativeRecipeClasses.some((className) => popoverAsChildInitial.classes.includes(className)) ||
    popoverAsChildInitial.classes.includes("tracking-[0.123px]") !== true ||
    popoverAsChildInitial.classes.includes("uppercase") !== true ||
    popoverAsChildInitial.letterSpacing !== "0.123px" ||
    popoverAsChildInitial.textTransform !== "uppercase" ||
    popoverAsChildInitial.wordSpacing !== "1.234px" ||
    popoverAsChildInitial.slot !== "popover-trigger" ||
    popoverAsChildInitial.expanded !== "false" ||
    !popoverAsChildInitial.controls ||
    popoverAsChildOpen.expanded !== "true" ||
    popoverAsChildOpen.contentHidden !== false ||
    popoverAsChildOpen.contentRole !== "dialog" ||
    popoverAsChildOpen.contentState !== "open" ||
    popoverAsChildOpen.parentTagName !== "DIV" ||
    popoverAsChildOpen.listenerCount !== "1" ||
    popoverAsChildOpen.listenerText !== "1" ||
    popoverAsChildOpen.text?.includes("As child popover") !== true
  ) {
    throw new Error(
      `Expected Astro Popover asChild trigger to transfer attributes and open, got ${JSON.stringify(
        { popoverAsChildInitial, popoverAsChildOpen },
      )}.`,
    );
  }
  await dispatchOutsidePointerDown(page);
  await page.waitForFunction(() => {
    const content = document.querySelector("#runtime-popover-as-child-content");
    const root = document.querySelector("#runtime-popover-as-child");

    return content instanceof HTMLElement && root instanceof HTMLElement && content.hidden;
  });

  const styledTriggerInitial = await page
    .locator("#runtime-popover-styled-child-trigger")
    .evaluate((trigger) => ({
      classes: Array.from(trigger.classList),
      controls: trigger.getAttribute("aria-controls"),
      expanded: trigger.getAttribute("aria-expanded"),
      hasTriggerAttribute: trigger.hasAttribute("data-sw-popover-trigger"),
      letterSpacing:
        trigger instanceof HTMLElement ? getComputedStyle(trigger).letterSpacing : null,
      slot: trigger.getAttribute("data-slot"),
      tagName: trigger.tagName,
      textTransform:
        trigger instanceof HTMLElement ? getComputedStyle(trigger).textTransform : null,
    }));
  await page.locator("#runtime-popover-styled-child-trigger").click();
  await page.locator("#runtime-popover-styled-child-content").waitFor({ state: "visible" });
  await assertPublicPortalTopology(page.locator("#runtime-popover-styled-child-content"), {
    portalSlot: "popover-portal",
  });
  const styledContentOpen = await page
    .locator("#runtime-popover-styled-child-content")
    .evaluate((content) => ({
      hidden: content instanceof HTMLElement ? content.hidden : null,
      parentTagName: content.parentElement?.tagName,
      role: content.getAttribute("role"),
      state: content.getAttribute("data-state"),
      text: content.textContent?.trim(),
    }));
  if (
    styledTriggerInitial.tagName !== "BUTTON" ||
    styledTriggerInitial.hasTriggerAttribute !== true ||
    styledTriggerInitial.slot !== "button" ||
    styledTriggerInitial.expanded !== "false" ||
    !styledTriggerInitial.controls ||
    styledTriggerInitial.classes.includes("tracking-[0.234px]") !== true ||
    styledTriggerInitial.classes.includes("uppercase") !== true ||
    styledTriggerInitial.letterSpacing !== "0.234px" ||
    styledTriggerInitial.textTransform !== "uppercase" ||
    styledContentOpen.hidden !== false ||
    styledContentOpen.parentTagName !== "DIV" ||
    styledContentOpen.role !== "dialog" ||
    styledContentOpen.state !== "open" ||
    styledContentOpen.text !== "Styled child content"
  ) {
    throw new Error(
      `Expected styled-child Astro Popover to preserve child appearance and open portaled content, got ${JSON.stringify(
        { styledContentOpen, styledTriggerInitial },
      )}.`,
    );
  }
  await dispatchOutsidePointerDown(page);
  await page.waitForFunction(() => {
    const content = document.querySelector("#runtime-popover-styled-child-content");
    return content instanceof HTMLElement && content.hidden;
  });
}
