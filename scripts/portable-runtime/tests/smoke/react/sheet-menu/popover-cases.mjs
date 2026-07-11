import { expectText } from "../../shared/text.mjs";

export async function verifyReactPopoverCases({ page }) {
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
      className: trigger.getAttribute("class"),
      controls: trigger.getAttribute("aria-controls"),
      expanded: trigger.getAttribute("aria-expanded"),
      hasDataSlot: trigger.getAttribute("data-slot") === "popover-trigger",
      hasTriggerAttribute: trigger.hasAttribute("data-sw-popover-trigger"),
      tagName: trigger.tagName,
    }));
  await page.getByRole("button", { name: "As child popover" }).click();
  await page.locator("#react-runtime-popover-as-child-content").waitFor({ state: "visible" });
  const popoverAsChildOpen = await page.evaluate(() => {
    const trigger = document.querySelector("#react-runtime-popover-as-child-trigger");
    const content = document.querySelector("#react-runtime-popover-as-child-content");

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
    popoverAsChildInitial.expanded !== "false" ||
    !popoverAsChildInitial.controls ||
    popoverAsChildOpen.expanded !== "true" ||
    popoverAsChildOpen.contentHidden !== false ||
    popoverAsChildOpen.contentRole !== "dialog" ||
    popoverAsChildOpen.contentState !== "open" ||
    popoverAsChildOpen.parentTagName !== "BODY"
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
}
