import { expectText } from "../../shared/text.mjs";

export async function verifyReactToggleCases({ page }) {
  const initialToggleState = await page.evaluate(() => {
    const readToggle = (id) => {
      const root = document.querySelector(`#${id}[data-sw-toggle]`);
      const style = root instanceof HTMLElement ? getComputedStyle(root) : null;

      return {
        ariaPressed: root?.getAttribute("aria-pressed"),
        className: root?.getAttribute("class"),
        dataSlot: root?.getAttribute("data-slot"),
        dataState: root?.getAttribute("data-state"),
        defaultPressedAttribute: root?.getAttribute("data-default-pressed"),
        disabled: root instanceof HTMLButtonElement ? root.disabled : undefined,
        hasDataSw: root?.hasAttribute("data-sw-toggle"),
        hasDisabled: root?.hasAttribute("data-disabled"),
        hasPressed: root?.hasAttribute("data-pressed"),
        hasUnpressed: root?.hasAttribute("data-unpressed"),
        opacity: style?.opacity,
        role: root?.getAttribute("role"),
        syncGroup: root?.getAttribute("data-sync-group"),
        tabIndex: root instanceof HTMLElement ? root.tabIndex : undefined,
        tagName: root?.tagName,
        value: root instanceof HTMLButtonElement ? root.value : undefined,
      };
    };

    return {
      controlled: readToggle("react-runtime-toggle-controlled"),
      default: readToggle("react-runtime-toggle-default"),
      disabled: readToggle("react-runtime-toggle-disabled"),
      large: readToggle("react-runtime-toggle-large"),
      nonNative: readToggle("react-runtime-toggle-non-native"),
      pressed: readToggle("react-runtime-toggle-pressed"),
      rootCount: document.querySelectorAll(
        '#react-runtime-toggle-demo [data-slot="toggle"][data-sw-toggle]',
      ).length,
      syncPrimary: readToggle("react-runtime-toggle-sync-primary"),
      syncSecondary: readToggle("react-runtime-toggle-sync-secondary"),
    };
  });
  await page.locator("#react-runtime-toggle-default").click();
  await expectText(page.locator("[data-runtime-toggle-controlled]"), "Toggle value: off");
  await expectText(page.locator("[data-runtime-toggle-count]"), "Toggle changes: 0");
  await page.locator("#react-runtime-toggle-controlled").click();
  await expectText(page.locator("[data-runtime-toggle-controlled]"), "Toggle value: on");
  await expectText(page.locator("[data-runtime-toggle-count]"), "Toggle changes: 1");
  await page.evaluate(() => {
    document
      .querySelector("#react-runtime-toggle-disabled")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    document
      .querySelector("#react-runtime-toggle-non-native")
      ?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    document
      .querySelector("#react-runtime-toggle-sync-primary")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await expectText(page.locator("[data-runtime-toggle-ref]"), "toggle");
  const updatedToggleState = await page.evaluate(() => {
    const readToggle = (id) => {
      const root = document.querySelector(`#${id}[data-sw-toggle]`);

      return {
        ariaPressed: root?.getAttribute("aria-pressed"),
        dataState: root?.getAttribute("data-state"),
        hasPressed: root?.hasAttribute("data-pressed"),
      };
    };

    return {
      controlled: readToggle("react-runtime-toggle-controlled"),
      default: readToggle("react-runtime-toggle-default"),
      disabled: readToggle("react-runtime-toggle-disabled"),
      nonNative: readToggle("react-runtime-toggle-non-native"),
      syncPrimary: readToggle("react-runtime-toggle-sync-primary"),
      syncSecondary: readToggle("react-runtime-toggle-sync-secondary"),
    };
  });
  if (
    initialToggleState.rootCount !== 14 ||
    initialToggleState.default.hasDataSw !== true ||
    initialToggleState.default.dataSlot !== "toggle" ||
    initialToggleState.default.hasPressed !== false ||
    initialToggleState.default.hasUnpressed !== true ||
    initialToggleState.default.dataState !== "off" ||
    initialToggleState.default.ariaPressed !== "false" ||
    initialToggleState.default.className?.includes("runtime-toggle-custom") !== true ||
    initialToggleState.default.className?.includes("inline-flex") !== true ||
    initialToggleState.default.className?.includes("h-11") !== true ||
    initialToggleState.pressed.hasPressed !== true ||
    initialToggleState.pressed.dataState !== "on" ||
    initialToggleState.disabled.disabled !== true ||
    initialToggleState.disabled.hasDisabled !== true ||
    Number(initialToggleState.disabled.opacity) > 0.8 ||
    initialToggleState.large.className?.includes("h-12") !== true ||
    initialToggleState.controlled.hasPressed !== false ||
    initialToggleState.controlled.defaultPressedAttribute !== null ||
    initialToggleState.controlled.value !== "controlled-toggle" ||
    initialToggleState.nonNative.tagName !== "SPAN" ||
    initialToggleState.nonNative.role !== "button" ||
    initialToggleState.nonNative.tabIndex !== 0 ||
    initialToggleState.nonNative.dataState !== "off" ||
    initialToggleState.syncPrimary.syncGroup !== "react-runtime-toggle-sync-demo" ||
    initialToggleState.syncPrimary.hasPressed !== false ||
    initialToggleState.syncSecondary.syncGroup !== "react-runtime-toggle-sync-demo" ||
    initialToggleState.syncSecondary.hasPressed !== false ||
    updatedToggleState.default.hasPressed !== true ||
    updatedToggleState.default.dataState !== "on" ||
    updatedToggleState.controlled.hasPressed !== true ||
    updatedToggleState.controlled.dataState !== "on" ||
    updatedToggleState.disabled.hasPressed !== false ||
    updatedToggleState.disabled.dataState !== "off" ||
    updatedToggleState.nonNative.hasPressed !== true ||
    updatedToggleState.nonNative.dataState !== "on" ||
    updatedToggleState.syncPrimary.hasPressed !== true ||
    updatedToggleState.syncPrimary.dataState !== "on" ||
    updatedToggleState.syncSecondary.hasPressed !== true ||
    updatedToggleState.syncSecondary.dataState !== "on"
  ) {
    throw new Error(
      `Expected React Toggle runtime states, controlled updates, and Starwind classes, got ${JSON.stringify(
        { initialToggleState, updatedToggleState },
      )}.`,
    );
  }

  const initialToggleGroupState = await page.evaluate(() => {
    const readToggle = (root, value) => {
      const toggle = root?.querySelector(`[data-sw-toggle][data-value="${value}"]`);

      return {
        ariaPressed: toggle?.getAttribute("aria-pressed"),
        className: toggle?.getAttribute("class"),
        dataSlot: toggle?.getAttribute("data-slot"),
        hasPressed: toggle?.hasAttribute("data-pressed"),
        tabIndex: toggle instanceof HTMLElement ? toggle.tabIndex : undefined,
      };
    };
    const defaultGroup = document.querySelector("[data-runtime-toggle-group-default]");
    const multipleGroup = document.querySelector("[data-runtime-toggle-group-multiple]");
    const controlledGroup = document.querySelector("[data-runtime-toggle-group-controlled]");
    const cancelledGroup = document.querySelector("[data-runtime-toggle-group-cancelled]");
    const liveMultipleGroup = document.querySelector("[data-runtime-toggle-group-live-multiple]");

    return {
      bold: readToggle(defaultGroup, "bold"),
      cancelledGroupValue: cancelledGroup?.getAttribute("data-value"),
      cancelledKeep: readToggle(cancelledGroup, "keep"),
      cancelledReject: readToggle(cancelledGroup, "reject"),
      center: readToggle(multipleGroup, "center"),
      controlledBold: readToggle(controlledGroup, "bold"),
      controlledGroupValue: controlledGroup?.getAttribute("data-value"),
      defaultClassName: defaultGroup?.getAttribute("class"),
      defaultRole: defaultGroup?.getAttribute("role"),
      defaultSize: defaultGroup?.getAttribute("data-size"),
      defaultSpacing: defaultGroup?.getAttribute("data-spacing"),
      defaultVariant: defaultGroup?.getAttribute("data-variant"),
      defaultValue: defaultGroup?.getAttribute("data-value"),
      hasDefaultDataSw: defaultGroup?.hasAttribute("data-sw-toggle-group"),
      hasMultiple: multipleGroup?.hasAttribute("data-multiple"),
      liveCenter: readToggle(liveMultipleGroup, "center"),
      liveHasMultiple: liveMultipleGroup?.hasAttribute("data-multiple"),
      liveLeft: readToggle(liveMultipleGroup, "left"),
      liveValue: liveMultipleGroup?.getAttribute("data-value"),
      left: readToggle(multipleGroup, "left"),
      multipleClassName: multipleGroup?.getAttribute("class"),
      multipleOrientation: multipleGroup?.getAttribute("data-orientation"),
      multipleValue: multipleGroup?.getAttribute("data-value"),
      rootCount: document.querySelectorAll("[data-sw-toggle-group]").length,
    };
  });
  await page.evaluate(() => {
    const defaultGroup = document.querySelector("[data-runtime-toggle-group-default]");
    const bold = defaultGroup?.querySelector('[data-sw-toggle][data-value="bold"]');
    bold?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
  });
  const focusedToggleGroupValue = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-value"),
  );
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  const secondFocusedToggleGroupValue = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-value"),
  );
  await page.keyboard.press("Space");
  await page.locator('[data-runtime-toggle-group-multiple] [data-value="center"]').click();
  await page.locator('[data-runtime-toggle-group-multiple] [data-value="left"]').click();
  await expectText(page.locator("[data-runtime-toggle-group-value]"), "Toggle group value: bold");
  await page.locator('[data-runtime-toggle-group-controlled] [data-value="italic"]').click();
  await expectText(page.locator("[data-runtime-toggle-group-value]"), "Toggle group value: italic");
  await expectText(page.locator("[data-runtime-toggle-group-count]"), "Toggle group changes: 1");
  await expectText(page.locator("[data-runtime-toggle-group-ref]"), "toggle-group");
  await page.locator('[data-runtime-toggle-group-cancelled] [data-value="reject"]').click();
  await page.locator("[data-runtime-toggle-group-live-single]").click();
  await page.locator("[data-runtime-toggle-group-live-multiple-enable]").click();
  await page.locator("[data-runtime-toggle-group-live-rerender]").click();
  const updatedToggleGroupState = await page.evaluate(() => {
    const readToggle = (root, value) => {
      const toggle = root?.querySelector(`[data-sw-toggle][data-value="${value}"]`);

      return {
        ariaPressed: toggle?.getAttribute("aria-pressed"),
        hasPressed: toggle?.hasAttribute("data-pressed"),
      };
    };
    const defaultGroup = document.querySelector("[data-runtime-toggle-group-default]");
    const multipleGroup = document.querySelector("[data-runtime-toggle-group-multiple]");
    const controlledGroup = document.querySelector("[data-runtime-toggle-group-controlled]");
    const cancelledGroup = document.querySelector("[data-runtime-toggle-group-cancelled]");
    const liveMultipleGroup = document.querySelector("[data-runtime-toggle-group-live-multiple]");

    return {
      bold: readToggle(defaultGroup, "bold"),
      cancelledGroupValue: cancelledGroup?.getAttribute("data-value"),
      cancelledKeep: readToggle(cancelledGroup, "keep"),
      cancelledReject: readToggle(cancelledGroup, "reject"),
      center: readToggle(multipleGroup, "center"),
      controlledBold: readToggle(controlledGroup, "bold"),
      controlledGroupValue: controlledGroup?.getAttribute("data-value"),
      controlledItalic: readToggle(controlledGroup, "italic"),
      defaultValue: defaultGroup?.getAttribute("data-value"),
      italic: readToggle(defaultGroup, "italic"),
      liveCenter: readToggle(liveMultipleGroup, "center"),
      liveHasMultiple: liveMultipleGroup?.hasAttribute("data-multiple"),
      liveLeft: readToggle(liveMultipleGroup, "left"),
      liveRerenderCount: liveMultipleGroup?.getAttribute("data-rerender-count"),
      liveValue: liveMultipleGroup?.getAttribute("data-value"),
      left: readToggle(multipleGroup, "left"),
      multipleValue: multipleGroup?.getAttribute("data-value"),
      underline: readToggle(defaultGroup, "underline"),
    };
  });
  if (
    initialToggleGroupState.rootCount !== 5 ||
    initialToggleGroupState.defaultRole !== "group" ||
    initialToggleGroupState.hasDefaultDataSw !== true ||
    initialToggleGroupState.defaultValue !== '["bold"]' ||
    initialToggleGroupState.defaultClassName?.includes("starwind-toggle-group") === true ||
    initialToggleGroupState.defaultClassName?.includes("group/toggle-group") !== true ||
    initialToggleGroupState.defaultClassName?.includes("runtime-toggle-group-custom") !== true ||
    initialToggleGroupState.defaultVariant !== "default" ||
    initialToggleGroupState.defaultSize !== "md" ||
    initialToggleGroupState.defaultSpacing !== "2" ||
    initialToggleGroupState.bold.hasPressed !== true ||
    initialToggleGroupState.bold.ariaPressed !== "true" ||
    initialToggleGroupState.bold.dataSlot !== "toggle-group-item" ||
    initialToggleGroupState.bold.className?.includes("starwind-toggle-group-item") === true ||
    initialToggleGroupState.bold.className?.includes("inline-flex") !== true ||
    initialToggleGroupState.bold.tabIndex !== 0 ||
    initialToggleGroupState.hasMultiple !== true ||
    initialToggleGroupState.liveHasMultiple !== true ||
    initialToggleGroupState.liveValue !== '["left","center"]' ||
    initialToggleGroupState.liveLeft.hasPressed !== true ||
    initialToggleGroupState.liveCenter.hasPressed !== true ||
    initialToggleGroupState.multipleOrientation !== "vertical" ||
    initialToggleGroupState.multipleValue !== '["left"]' ||
    initialToggleGroupState.multipleClassName?.includes("flex-col") !== true ||
    initialToggleGroupState.left.hasPressed !== true ||
    initialToggleGroupState.center.hasPressed !== false ||
    initialToggleGroupState.controlledGroupValue !== '["bold"]' ||
    initialToggleGroupState.controlledBold.hasPressed !== true ||
    initialToggleGroupState.cancelledGroupValue !== '["keep"]' ||
    initialToggleGroupState.cancelledKeep.hasPressed !== true ||
    initialToggleGroupState.cancelledReject.hasPressed !== false ||
    focusedToggleGroupValue !== "italic" ||
    secondFocusedToggleGroupValue !== "underline" ||
    updatedToggleGroupState.defaultValue !== '["underline"]' ||
    updatedToggleGroupState.bold.hasPressed !== false ||
    updatedToggleGroupState.italic.hasPressed !== false ||
    updatedToggleGroupState.liveHasMultiple !== true ||
    updatedToggleGroupState.liveValue !== '["left"]' ||
    updatedToggleGroupState.liveLeft.hasPressed !== true ||
    updatedToggleGroupState.liveCenter.hasPressed !== false ||
    updatedToggleGroupState.liveRerenderCount !== "1" ||
    updatedToggleGroupState.underline.hasPressed !== true ||
    updatedToggleGroupState.multipleValue !== '["center"]' ||
    updatedToggleGroupState.left.hasPressed !== false ||
    updatedToggleGroupState.center.hasPressed !== true ||
    updatedToggleGroupState.controlledGroupValue !== '["italic"]' ||
    updatedToggleGroupState.controlledBold.hasPressed !== false ||
    updatedToggleGroupState.controlledItalic.hasPressed !== true ||
    updatedToggleGroupState.cancelledGroupValue !== '["keep"]' ||
    updatedToggleGroupState.cancelledKeep.hasPressed !== true ||
    updatedToggleGroupState.cancelledReject.hasPressed !== false
  ) {
    throw new Error(
      `Expected React ToggleGroup values, controlled updates, roving focus, and Starwind classes, got ${JSON.stringify(
        {
          focusedToggleGroupValue,
          initialToggleGroupState,
          secondFocusedToggleGroupValue,
          updatedToggleGroupState,
        },
      )}.`,
    );
  }
}
