import { expectText } from "../../shared/text.mjs";

export async function verifyReactPopoverCases({ page }) {
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
    .locator("#react-runtime-popover-native-trigger")
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
      `Expected native React Popover trigger to retain its recipe, consumer class, and runtime contract, got ${JSON.stringify(
        nativeTriggerInitial,
      )}.`,
    );
  }

  await page.getByRole("button", { name: "Open React popover" }).click();
  await page.getByRole("heading", { name: "React runtime popover" }).waitFor();

  const openPopoverState = await page
    .locator("#react-runtime-popover-content")
    .evaluate((content) => ({
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
      rootContains:
        document.querySelector("#react-runtime-popover-default")?.contains(content) ?? null,
      state: content.getAttribute("data-state"),
      styleLeft: content instanceof HTMLElement ? content.style.left : null,
      styleTop: content instanceof HTMLElement ? content.style.top : null,
      triggerExpanded: document
        .querySelector("#react-runtime-popover-native-trigger")
        ?.getAttribute("aria-expanded"),
      triggerState: document
        .querySelector("#react-runtime-popover-native-trigger")
        ?.getAttribute("data-state"),
    }));
  if (
    openPopoverState.hidden !== false ||
    openPopoverState.role !== "dialog" ||
    openPopoverState.state !== "open" ||
    !["bottom", "top"].includes(openPopoverState.dataSide ?? "") ||
    openPopoverState.dataAlign !== "start" ||
    openPopoverState.parentTagName !== "BODY" ||
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
      `Expected React Popover to open as a portaled positioned dialog, got ${JSON.stringify(
        openPopoverState,
      )}.`,
    );
  }

  await page.mouse.click(20, 96);
  const closingPopoverState = await page
    .locator("#react-runtime-popover-content")
    .evaluate((content) => ({
      hidden: content instanceof HTMLElement ? content.hidden : null,
      parentTagName: content.parentElement?.tagName,
      state: content.getAttribute("data-state"),
    }));
  const isClosingInPortal =
    closingPopoverState.state === "closed" &&
    closingPopoverState.hidden === false &&
    closingPopoverState.parentTagName === "BODY";
  const isClosedInRoot =
    closingPopoverState.state === "closed" &&
    closingPopoverState.hidden === true &&
    closingPopoverState.parentTagName !== "BODY";
  if (!isClosingInPortal && !isClosedInRoot) {
    throw new Error(
      `Expected outside click to close React Popover with either exit-animation presence or final hidden state, got ${JSON.stringify(
        closingPopoverState,
      )}.`,
    );
  }
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-popover-content");
    const root = document.querySelector("#react-runtime-popover-default");

    return (
      content instanceof HTMLElement &&
      root instanceof HTMLElement &&
      content.hidden &&
      root.contains(content)
    );
  });

  await expectText(page.locator("#react-popover-count"), "0");
  await page.getByRole("button", { name: "Open controlled popover" }).click();
  await page.getByRole("heading", { name: "Controlled popover" }).waitFor();
  await expectText(page.locator("#react-popover-count"), "1");
  const controlledPopoverState = await page
    .locator("#react-runtime-popover-controlled-content")
    .evaluate((content) => ({
      dataAlign: content.getAttribute("data-align"),
      dataSide: content.getAttribute("data-side"),
      hidden: content instanceof HTMLElement ? content.hidden : null,
      state: content.getAttribute("data-state"),
    }));
  if (
    controlledPopoverState.hidden !== false ||
    controlledPopoverState.state !== "open" ||
    controlledPopoverState.dataAlign !== "end" ||
    !["top", "bottom"].includes(controlledPopoverState.dataSide ?? "")
  ) {
    throw new Error(
      `Expected controlled React Popover to open from controlled state, got ${JSON.stringify(
        controlledPopoverState,
      )}.`,
    );
  }
  await page.mouse.click(20, 96);
  await expectText(page.locator("#react-popover-count"), "2");
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-popover-controlled-content");
    const root = document.querySelector("#react-runtime-popover-controlled");

    return (
      content instanceof HTMLElement &&
      root instanceof HTMLElement &&
      content.hidden &&
      root.contains(content)
    );
  });

  await page.getByRole("button", { name: "Open canceled popover" }).click();
  await expectText(page.locator("#react-popover-canceled-count"), "1");
  const canceledPopoverState = await page
    .locator("#react-runtime-popover-canceled-content")
    .evaluate((content) => ({
      hidden: content instanceof HTMLElement ? content.hidden : null,
      rootState: content.closest("[data-sw-popover]")?.getAttribute("data-state"),
      state: content.getAttribute("data-state"),
    }));
  if (
    canceledPopoverState.hidden !== true ||
    canceledPopoverState.state !== "closed" ||
    canceledPopoverState.rootState !== "closed"
  ) {
    throw new Error(
      `Expected React Popover onOpenChange cancellation to prevent opening, got ${JSON.stringify(
        canceledPopoverState,
      )}.`,
    );
  }

  const popoverAsChildInitial = await page
    .locator("#react-runtime-popover-as-child-trigger")
    .evaluate((trigger) => ({
      classes: Array.from(trigger.classList),
      controls: trigger.getAttribute("aria-controls"),
      expanded: trigger.getAttribute("aria-expanded"),
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
  await page.locator("#react-runtime-popover-as-child-trigger").click();
  await page.locator("#react-runtime-popover-as-child-content").waitFor({ state: "visible" });
  const popoverAsChildOpen = await page.evaluate(() => {
    const trigger = document.querySelector("#react-runtime-popover-as-child-trigger");
    const content = document.querySelector("#react-runtime-popover-as-child-content");

    return {
      contentHidden: content instanceof HTMLElement ? content.hidden : null,
      contentRole: content?.getAttribute("role"),
      contentState: content?.getAttribute("data-state"),
      expanded: trigger?.getAttribute("aria-expanded"),
      listenerCount: trigger?.getAttribute("data-listener-count"),
      listenerText: document.querySelector("#react-runtime-popover-as-child-listener-count")
        ?.textContent,
      parentTagName: content?.parentElement?.tagName,
      text: content?.textContent?.trim(),
    };
  });
  if (
    popoverAsChildInitial.tagName !== "A" ||
    popoverAsChildInitial.hasTriggerAttribute !== true ||
    popoverAsChildInitial.hasDataSlot !== true ||
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
    popoverAsChildOpen.parentTagName !== "BODY" ||
    popoverAsChildOpen.listenerCount !== "1" ||
    popoverAsChildOpen.listenerText !== "1" ||
    popoverAsChildOpen.text?.includes("As child popover") !== true
  ) {
    throw new Error(
      `Expected React Popover asChild trigger to clone attributes and open, got ${JSON.stringify({
        popoverAsChildInitial,
        popoverAsChildOpen,
      })}.`,
    );
  }
  await page.mouse.click(20, 96);
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-popover-as-child-content");
    const root = document.querySelector("#react-runtime-popover-as-child");

    return content instanceof HTMLElement && root instanceof HTMLElement && content.hidden;
  });

  const styledTriggerInitial = await page
    .locator("#react-runtime-popover-styled-child-trigger")
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
  await page.locator("#react-runtime-popover-styled-child-trigger").click();
  await page.locator("#react-runtime-popover-styled-child-content").waitFor({ state: "visible" });
  const styledContentOpen = await page
    .locator("#react-runtime-popover-styled-child-content")
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
    styledTriggerInitial.slot !== "popover-trigger" ||
    styledTriggerInitial.expanded !== "false" ||
    !styledTriggerInitial.controls ||
    styledTriggerInitial.classes.includes("tracking-[0.234px]") !== true ||
    styledTriggerInitial.classes.includes("uppercase") !== true ||
    styledTriggerInitial.letterSpacing !== "0.234px" ||
    styledTriggerInitial.textTransform !== "uppercase" ||
    styledContentOpen.hidden !== false ||
    styledContentOpen.parentTagName !== "BODY" ||
    styledContentOpen.role !== "dialog" ||
    styledContentOpen.state !== "open" ||
    styledContentOpen.text !== "Styled child content"
  ) {
    throw new Error(
      `Expected styled-child React Popover to preserve child appearance and open portaled content, got ${JSON.stringify(
        { styledContentOpen, styledTriggerInitial },
      )}.`,
    );
  }
  await page.mouse.click(20, 96);
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-popover-styled-child-content");
    return content instanceof HTMLElement && content.hidden;
  });
}
