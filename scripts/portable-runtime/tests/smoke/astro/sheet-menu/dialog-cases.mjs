import { verifyDialogEntryAnimationGestures } from "../../shared/dialog-entry-animation.mjs";
import { verifyDialogFloatingOverlays } from "../../shared/dialog-floating-overlays.mjs";

export async function verifyAstroDialogCases({ page }) {
  await verifyDialogEntryAnimationGestures({
    backdrop: '#runtime-dialog-default > [data-slot="dialog-backdrop"]',
    content: page.locator('#runtime-dialog-default [data-slot="dialog-content"]'),
    expectedDuration: 200,
    label: "Astro Dialog",
    page,
    trigger: page.getByRole("button", { name: "Open dialog", exact: true }),
  });

  await page.getByRole("button", { name: "Open dialog", exact: true }).click();
  await page.getByRole("heading", { name: "Runtime dialog" }).waitFor();

  const openDialogs = await page.locator("dialog[open]").count();
  if (openDialogs !== 1) {
    throw new Error(`Expected one open Astro dialog, found ${openDialogs}.`);
  }

  await page.mouse.click(20, 20);
  const closingDialog = await page.locator('dialog[data-state="closed"][open]').count();
  const closingBackdropState = await page
    .locator('#runtime-dialog-default > [data-slot="dialog-backdrop"]')
    .evaluate((backdrop) => ({
      display: backdrop instanceof HTMLElement ? getComputedStyle(backdrop).display : null,
      hidden: backdrop instanceof HTMLElement ? backdrop.hidden : null,
      state: backdrop.getAttribute("data-state"),
    }));
  if (
    closingDialog !== 1 ||
    closingBackdropState.display === "none" ||
    closingBackdropState.state !== "closed" ||
    closingBackdropState.hidden !== false
  ) {
    throw new Error(
      `Expected outside click to close Astro dialog with exit animation, got ${JSON.stringify({
        closingDialog,
        closingBackdropState,
      })}.`,
    );
  }
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);

  await page.getByRole("button", { name: "Open nested parent" }).click();
  await page.getByRole("heading", { name: "Runtime nested parent" }).waitFor();
  await page.getByRole("button", { name: "Open nested level 1" }).click();
  await page.getByRole("heading", { name: "Runtime nested level 1" }).waitFor();
  await page.getByRole("button", { name: "Open nested level 2" }).click();
  await page.getByRole("heading", { name: "Runtime nested level 2" }).waitFor();
  await page.waitForTimeout(250);

  const nestedDialogStack = await page.evaluate(() => {
    const readScale = (content) => {
      if (!(content instanceof HTMLElement)) return null;

      const computedStyle = getComputedStyle(content);
      const scale = computedStyle.scale;

      if (scale && scale !== "none") {
        const scaleValue = Number.parseFloat(scale.split(" ")[0]);
        if (Number.isFinite(scaleValue)) return scaleValue;
      }

      const transform = computedStyle.transform;
      if (transform && transform !== "none") {
        const matrix = new DOMMatrixReadOnly(transform);
        const scaleValue = Math.hypot(matrix.a, matrix.b);
        if (Number.isFinite(scaleValue)) return scaleValue;
      }

      return 1;
    };
    const readDialog = (selector) => {
      const root = document.querySelector(selector);
      const content = root?.querySelector('[data-slot="dialog-content"]');
      const overlay = root?.querySelector('[data-slot="dialog-backdrop"]');
      const computedStyle = content instanceof HTMLElement ? getComputedStyle(content) : null;

      return {
        className: content instanceof HTMLElement ? content.className : null,
        computedScale: readScale(content),
        contentState: content?.getAttribute("data-state"),
        nestedOffset: computedStyle?.getPropertyValue("--nested-offset").trim() ?? null,
        nestedCount:
          content instanceof HTMLElement
            ? content.style.getPropertyValue("--nested-dialogs")
            : null,
        nestedOpen:
          content instanceof HTMLElement ? content.hasAttribute("data-nested-dialog-open") : null,
        nestedScaleStep: computedStyle?.getPropertyValue("--nested-scale").trim() ?? null,
        open: content instanceof HTMLDialogElement ? content.open : null,
        overlayHidden: overlay instanceof HTMLElement ? overlay.hidden : null,
        rootState: root?.getAttribute("data-state"),
      };
    };
    const readControl = (selector, attribute) => {
      const control = document.querySelector(selector);

      return {
        className: control instanceof HTMLElement ? control.className : null,
        dataSlot: control?.getAttribute("data-slot"),
        hasAttribute: control?.hasAttribute(attribute) ?? null,
        tagName: control?.tagName,
      };
    };

    return {
      levelOne: readDialog("#runtime-nested-dialog-level-one"),
      levelOneClose: readControl("#runtime-nested-dialog-level-one-close", "data-sw-dialog-close"),
      levelOneTrigger: readControl(
        "#runtime-nested-dialog-level-one-trigger",
        "data-sw-dialog-trigger",
      ),
      levelTwo: readDialog("#runtime-nested-dialog-level-two"),
      levelTwoClose: readControl("#runtime-nested-dialog-level-two-close", "data-sw-dialog-close"),
      levelTwoTrigger: readControl(
        "#runtime-nested-dialog-level-two-trigger",
        "data-sw-dialog-trigger",
      ),
      openCount: document.querySelectorAll("dialog[open]").length,
      parent: readDialog("#runtime-nested-dialog-parent"),
      parentClose: readControl("#runtime-nested-dialog-parent-close", "data-sw-dialog-close"),
      parentTrigger: readControl("#runtime-nested-dialog-parent-trigger", "data-sw-dialog-trigger"),
    };
  });
  const parentNestedScaleStep = Number.parseFloat(nestedDialogStack.parent.nestedScaleStep ?? "");
  const levelOneNestedScaleStep = Number.parseFloat(
    nestedDialogStack.levelOne.nestedScaleStep ?? "",
  );
  if (
    nestedDialogStack.openCount !== 3 ||
    nestedDialogStack.parent.open !== true ||
    nestedDialogStack.levelOne.open !== true ||
    nestedDialogStack.levelTwo.open !== true ||
    nestedDialogStack.parent.rootState !== "open" ||
    nestedDialogStack.levelOne.rootState !== "open" ||
    nestedDialogStack.levelTwo.rootState !== "open" ||
    nestedDialogStack.parent.nestedOpen !== true ||
    nestedDialogStack.parent.nestedCount !== "2" ||
    nestedDialogStack.parent.nestedOffset !== "1rem" ||
    parentNestedScaleStep !== 0.05 ||
    nestedDialogStack.parent.computedScale >= nestedDialogStack.levelOne.computedScale ||
    nestedDialogStack.parent.className?.includes("data-nested-dialog-open:scale-") !== true ||
    nestedDialogStack.parent.overlayHidden !== false ||
    nestedDialogStack.levelOne.nestedOpen !== true ||
    nestedDialogStack.levelOne.nestedCount !== "1" ||
    nestedDialogStack.levelOne.nestedOffset !== "1rem" ||
    levelOneNestedScaleStep !== 0.05 ||
    nestedDialogStack.levelOne.computedScale >= 0.99 ||
    nestedDialogStack.levelTwo.computedScale < 0.99 ||
    nestedDialogStack.levelOne.overlayHidden !== true ||
    nestedDialogStack.levelTwo.overlayHidden !== true ||
    nestedDialogStack.parentTrigger.tagName !== "BUTTON" ||
    nestedDialogStack.parentTrigger.hasAttribute !== true ||
    nestedDialogStack.parentTrigger.dataSlot !== "button" ||
    nestedDialogStack.levelOneTrigger.tagName !== "BUTTON" ||
    nestedDialogStack.levelOneTrigger.hasAttribute !== true ||
    nestedDialogStack.levelOneTrigger.dataSlot !== "button" ||
    nestedDialogStack.levelTwoTrigger.tagName !== "BUTTON" ||
    nestedDialogStack.levelTwoTrigger.hasAttribute !== true ||
    nestedDialogStack.levelTwoTrigger.dataSlot !== "button" ||
    nestedDialogStack.parentClose.tagName !== "BUTTON" ||
    nestedDialogStack.parentClose.hasAttribute !== true ||
    nestedDialogStack.parentClose.dataSlot !== "button" ||
    nestedDialogStack.levelOneClose.tagName !== "BUTTON" ||
    nestedDialogStack.levelOneClose.hasAttribute !== true ||
    nestedDialogStack.levelOneClose.dataSlot !== "button" ||
    nestedDialogStack.levelTwoClose.tagName !== "BUTTON" ||
    nestedDialogStack.levelTwoClose.hasAttribute !== true ||
    nestedDialogStack.levelTwoClose.dataSlot !== "button"
  ) {
    throw new Error(
      `Expected Astro nested dialogs to keep all three layers open, got ${JSON.stringify(
        nestedDialogStack,
      )}.`,
    );
  }

  await page.locator("#runtime-nested-dialog-level-one-close").evaluate((button) => {
    if (button instanceof HTMLButtonElement) button.click();
  });
  const nestedDialogAfterAncestorCloseAttempt = await page.evaluate(() => {
    const readDialog = (selector) => {
      const root = document.querySelector(selector);
      const content = root?.querySelector("[data-slot='dialog-content']");

      return {
        contentState: content?.getAttribute("data-state"),
        nestedCount:
          content instanceof HTMLElement
            ? content.style.getPropertyValue("--nested-dialogs")
            : null,
        open: content instanceof HTMLDialogElement ? content.open : null,
        rootState: root?.getAttribute("data-state"),
      };
    };

    return {
      levelOne: readDialog("#runtime-nested-dialog-level-one"),
      levelTwo: readDialog("#runtime-nested-dialog-level-two"),
      openCount: document.querySelectorAll("dialog[open]").length,
      parent: readDialog("#runtime-nested-dialog-parent"),
    };
  });
  if (
    nestedDialogAfterAncestorCloseAttempt.openCount !== 3 ||
    nestedDialogAfterAncestorCloseAttempt.parent.open !== true ||
    nestedDialogAfterAncestorCloseAttempt.parent.rootState !== "open" ||
    nestedDialogAfterAncestorCloseAttempt.parent.contentState !== "open" ||
    nestedDialogAfterAncestorCloseAttempt.parent.nestedCount !== "2" ||
    nestedDialogAfterAncestorCloseAttempt.levelOne.open !== true ||
    nestedDialogAfterAncestorCloseAttempt.levelOne.rootState !== "open" ||
    nestedDialogAfterAncestorCloseAttempt.levelOne.contentState !== "open" ||
    nestedDialogAfterAncestorCloseAttempt.levelOne.nestedCount !== "1" ||
    nestedDialogAfterAncestorCloseAttempt.levelTwo.open !== true ||
    nestedDialogAfterAncestorCloseAttempt.levelTwo.rootState !== "open" ||
    nestedDialogAfterAncestorCloseAttempt.levelTwo.contentState !== "open"
  ) {
    throw new Error(
      `Expected Astro ancestor close to be ignored while level 2 is topmost, got ${JSON.stringify(
        nestedDialogAfterAncestorCloseAttempt,
      )}.`,
    );
  }

  await page.keyboard.press("Escape");
  const nestedDialogImmediatelyAfterLevelTwoClose = await page.evaluate(() => {
    const readDialog = (selector) => {
      const root = document.querySelector(selector);
      const content = root?.querySelector("[data-slot='dialog-content']");

      return {
        contentState: content?.getAttribute("data-state"),
        nestedCount:
          content instanceof HTMLElement
            ? content.style.getPropertyValue("--nested-dialogs")
            : null,
        nestedOpen:
          content instanceof HTMLElement ? content.hasAttribute("data-nested-dialog-open") : null,
        open: content instanceof HTMLDialogElement ? content.open : null,
        rootState: root?.getAttribute("data-state"),
      };
    };

    return {
      levelOne: readDialog("#runtime-nested-dialog-level-one"),
      levelTwo: readDialog("#runtime-nested-dialog-level-two"),
      openCount: document.querySelectorAll("dialog[open]").length,
      parent: readDialog("#runtime-nested-dialog-parent"),
    };
  });
  if (
    nestedDialogImmediatelyAfterLevelTwoClose.openCount !== 3 ||
    nestedDialogImmediatelyAfterLevelTwoClose.parent.open !== true ||
    nestedDialogImmediatelyAfterLevelTwoClose.parent.nestedOpen !== true ||
    nestedDialogImmediatelyAfterLevelTwoClose.parent.nestedCount !== "1" ||
    nestedDialogImmediatelyAfterLevelTwoClose.levelOne.open !== true ||
    nestedDialogImmediatelyAfterLevelTwoClose.levelOne.nestedOpen !== false ||
    nestedDialogImmediatelyAfterLevelTwoClose.levelOne.nestedCount !== "" ||
    nestedDialogImmediatelyAfterLevelTwoClose.levelTwo.open !== true ||
    nestedDialogImmediatelyAfterLevelTwoClose.levelTwo.contentState !== "closed"
  ) {
    throw new Error(
      `Expected Astro nested dialog sizing to update immediately while level 2 exits, got ${JSON.stringify(
        nestedDialogImmediatelyAfterLevelTwoClose,
      )}.`,
    );
  }

  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 2);
  const nestedDialogAfterLevelTwoClose = await page.evaluate(() => {
    const readOpen = (selector) => {
      const content = document.querySelector(`${selector} [data-slot='dialog-content']`);

      return content instanceof HTMLDialogElement ? content.open : null;
    };

    return {
      levelOneOpen: readOpen("#runtime-nested-dialog-level-one"),
      levelTwoOpen: readOpen("#runtime-nested-dialog-level-two"),
      openCount: document.querySelectorAll("dialog[open]").length,
      parentNestedCount:
        document
          .querySelector("#runtime-nested-dialog-parent [data-slot='dialog-content']")
          ?.style.getPropertyValue("--nested-dialogs") ?? null,
      parentOpen: readOpen("#runtime-nested-dialog-parent"),
      restoredFocusId:
        document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
    };
  });
  if (
    nestedDialogAfterLevelTwoClose.openCount !== 2 ||
    nestedDialogAfterLevelTwoClose.parentOpen !== true ||
    nestedDialogAfterLevelTwoClose.levelOneOpen !== true ||
    nestedDialogAfterLevelTwoClose.levelTwoOpen !== false ||
    nestedDialogAfterLevelTwoClose.parentNestedCount !== "1" ||
    nestedDialogAfterLevelTwoClose.restoredFocusId !== "runtime-nested-dialog-level-two-trigger"
  ) {
    throw new Error(
      `Expected Escape to close only Astro level 2 and restore focus, got ${JSON.stringify(
        nestedDialogAfterLevelTwoClose,
      )}.`,
    );
  }

  await page.locator("#runtime-nested-dialog-level-one-close").click();
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 1);
  await page.locator("#runtime-nested-dialog-parent-close").click();
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 0);

  await verifyDialogFloatingOverlays({
    page,
    label: "Astro",
    ids: {
      comboboxContent: "runtime-dialog-combobox-content",
      comboboxInput: "runtime-dialog-combobox-input",
      comboboxOption: "runtime-dialog-combobox-apricot",
      dropdownContent: "runtime-dialog-dropdown-content",
      dropdownItem: "runtime-dialog-dropdown-duplicate",
      dropdownTrigger: "runtime-dialog-dropdown-trigger",
      lab: "runtime-dialog-overlay-lab",
      labClose: "runtime-dialog-overlay-lab-close",
      labContent: "runtime-dialog-overlay-lab-content",
      labTrigger: "runtime-dialog-overlay-lab-trigger",
      nestedClose: "runtime-dialog-overlay-nested-close",
      nestedContent: "runtime-dialog-overlay-nested-content",
      nestedPopoverAction: "runtime-dialog-overlay-nested-popover-action",
      nestedPopoverContent: "runtime-dialog-overlay-nested-popover-content",
      nestedPopoverTrigger: "runtime-dialog-overlay-nested-popover-trigger",
      nestedTrigger: "runtime-dialog-overlay-nested-trigger",
      popoverContent: "runtime-dialog-popover-content",
      popoverAction: "runtime-dialog-popover-action",
      popoverTrigger: "runtime-dialog-popover-trigger",
      select: "runtime-dialog-select",
      selectContent: "runtime-dialog-select-content",
      selectOption: "runtime-dialog-select-light",
      selectTrigger: "runtime-dialog-select-trigger",
    },
  });
}
