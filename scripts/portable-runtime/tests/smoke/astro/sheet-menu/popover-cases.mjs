import { dispatchOutsidePointerDown } from "../../shared/pointer.mjs";

export async function verifyAstroPopoverCases({ page }) {
  await page.getByRole("button", { name: "Open popover" }).click();
  await page.getByRole("heading", { name: "Runtime popover" }).waitFor();

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
    openPopoverState.className?.includes("runtime-popover-custom") !== true
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
      className: trigger.getAttribute("class"),
      controls: trigger.getAttribute("aria-controls"),
      expanded: trigger.getAttribute("aria-expanded"),
      hasAsChildWrapper:
        trigger.parentElement instanceof HTMLElement &&
        getComputedStyle(trigger.parentElement).display === "contents",
      hasDataSlot: trigger.getAttribute("data-slot") === "popover-trigger",
      hasTriggerAttribute: trigger.hasAttribute("data-sw-popover-trigger"),
      tagName: trigger.tagName,
    }));
  await page.getByRole("button", { name: "As child popover" }).click();
  await page.locator("#runtime-popover-as-child-content").waitFor({ state: "visible" });
  const popoverAsChildOpen = await page.evaluate(() => {
    const trigger = document.querySelector("#runtime-popover-as-child-trigger");
    const content = document.querySelector("#runtime-popover-as-child-content");

    return {
      contentHidden: content instanceof HTMLElement ? content.hidden : null,
      contentRole: content?.getAttribute("role"),
      contentState: content?.getAttribute("data-state"),
      expanded: trigger?.getAttribute("aria-expanded"),
      parentTagName: content?.parentElement?.tagName,
    };
  });
  if (
    popoverAsChildInitial.tagName !== "BUTTON" ||
    popoverAsChildInitial.hasTriggerAttribute !== true ||
    popoverAsChildInitial.hasDataSlot !== true ||
    popoverAsChildInitial.hasAsChildWrapper !== true ||
    popoverAsChildInitial.expanded !== "false" ||
    !popoverAsChildInitial.controls ||
    popoverAsChildOpen.expanded !== "true" ||
    popoverAsChildOpen.contentHidden !== false ||
    popoverAsChildOpen.contentRole !== "dialog" ||
    popoverAsChildOpen.contentState !== "open" ||
    popoverAsChildOpen.parentTagName !== "BODY"
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
}
