export async function verifyAstroToggleCases({ page }) {
  const toggleState = await page.evaluate(async () => {
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
      };
    };

    const initial = {
      controlledOff: readToggle("runtime-toggle-controlled-off"),
      default: readToggle("runtime-toggle-default"),
      disabled: readToggle("runtime-toggle-disabled"),
      large: readToggle("runtime-toggle-large"),
      nonNative: readToggle("runtime-toggle-non-native"),
      pressed: readToggle("runtime-toggle-pressed"),
      rootCount: document.querySelectorAll(
        '#runtime-toggle-demo [data-slot="toggle"][data-sw-toggle]',
      ).length,
      small: readToggle("runtime-toggle-small"),
      syncPrimary: readToggle("runtime-toggle-sync-primary"),
      syncSecondary: readToggle("runtime-toggle-sync-secondary"),
    };

    document
      .querySelector("#runtime-toggle-default")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    document
      .querySelector("#runtime-toggle-disabled")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    document
      .querySelector("#runtime-toggle-non-native")
      ?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    document
      .querySelector("#runtime-toggle-sync-primary")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    return {
      afterToggle: {
        default: readToggle("runtime-toggle-default"),
        disabled: readToggle("runtime-toggle-disabled"),
        nonNative: readToggle("runtime-toggle-non-native"),
        syncPrimary: readToggle("runtime-toggle-sync-primary"),
        syncSecondary: readToggle("runtime-toggle-sync-secondary"),
      },
      initial,
    };
  });
  if (
    toggleState.initial.rootCount !== 15 ||
    toggleState.initial.default.hasDataSw !== true ||
    toggleState.initial.default.dataSlot !== "toggle" ||
    toggleState.initial.default.hasPressed !== false ||
    toggleState.initial.default.hasUnpressed !== true ||
    toggleState.initial.default.dataState !== "off" ||
    toggleState.initial.default.ariaPressed !== "false" ||
    toggleState.initial.default.className?.includes("runtime-toggle-custom") !== true ||
    toggleState.initial.default.className?.includes("inline-flex") !== true ||
    toggleState.initial.default.className?.includes("h-11") !== true ||
    toggleState.initial.pressed.hasPressed !== true ||
    toggleState.initial.pressed.dataState !== "on" ||
    toggleState.initial.disabled.disabled !== true ||
    toggleState.initial.disabled.hasDisabled !== true ||
    Number(toggleState.initial.disabled.opacity) > 0.8 ||
    toggleState.initial.controlledOff.hasPressed !== false ||
    toggleState.initial.controlledOff.dataState !== "off" ||
    toggleState.initial.controlledOff.defaultPressedAttribute !== null ||
    toggleState.initial.nonNative.tagName !== "SPAN" ||
    toggleState.initial.nonNative.role !== "button" ||
    toggleState.initial.nonNative.tabIndex !== 0 ||
    toggleState.initial.nonNative.dataState !== "off" ||
    toggleState.initial.small.className?.includes("h-9") !== true ||
    toggleState.initial.large.className?.includes("h-12") !== true ||
    toggleState.initial.syncPrimary.syncGroup !== "runtime-toggle-sync-demo" ||
    toggleState.initial.syncPrimary.hasPressed !== false ||
    toggleState.initial.syncSecondary.syncGroup !== "runtime-toggle-sync-demo" ||
    toggleState.initial.syncSecondary.hasPressed !== false ||
    toggleState.afterToggle.default.hasPressed !== true ||
    toggleState.afterToggle.default.dataState !== "on" ||
    toggleState.afterToggle.disabled.hasPressed !== false ||
    toggleState.afterToggle.disabled.dataState !== "off" ||
    toggleState.afterToggle.nonNative.hasPressed !== true ||
    toggleState.afterToggle.nonNative.dataState !== "on" ||
    toggleState.afterToggle.syncPrimary.hasPressed !== true ||
    toggleState.afterToggle.syncPrimary.dataState !== "on" ||
    toggleState.afterToggle.syncSecondary.hasPressed !== true ||
    toggleState.afterToggle.syncSecondary.dataState !== "on"
  ) {
    throw new Error(
      `Expected Astro Toggle runtime states and Starwind classes, got ${JSON.stringify(
        toggleState,
      )}.`,
    );
  }

  const toggleGroupState = await page.evaluate(() => {
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
    const bold = defaultGroup?.querySelector('[data-sw-toggle][data-value="bold"]');
    const italic = defaultGroup?.querySelector('[data-sw-toggle][data-value="italic"]');
    const left = multipleGroup?.querySelector('[data-sw-toggle][data-value="left"]');
    const center = multipleGroup?.querySelector('[data-sw-toggle][data-value="center"]');

    const initial = {
      bold: readToggle(defaultGroup, "bold"),
      center: readToggle(multipleGroup, "center"),
      defaultClassName: defaultGroup?.getAttribute("class"),
      defaultSize: defaultGroup?.getAttribute("data-size"),
      defaultSpacing: defaultGroup?.getAttribute("data-spacing"),
      defaultVariant: defaultGroup?.getAttribute("data-variant"),
      defaultRole: defaultGroup?.getAttribute("role"),
      defaultValue: defaultGroup?.getAttribute("data-value"),
      hasDefaultDataSw: defaultGroup?.hasAttribute("data-sw-toggle-group"),
      hasMultiple: multipleGroup?.hasAttribute("data-multiple"),
      left: readToggle(multipleGroup, "left"),
      multipleClassName: multipleGroup?.getAttribute("class"),
      multipleOrientation: multipleGroup?.getAttribute("data-orientation"),
      multipleValue: multipleGroup?.getAttribute("data-value"),
      rootCount: document.querySelectorAll("[data-sw-toggle-group]").length,
    };

    bold?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    const focusedAfterArrowRight = document.activeElement?.getAttribute("data-value");
    italic?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    center?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    left?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    return {
      afterToggle: {
        bold: readToggle(defaultGroup, "bold"),
        center: readToggle(multipleGroup, "center"),
        defaultValue: defaultGroup?.getAttribute("data-value"),
        focusedAfterArrowRight,
        italic: readToggle(defaultGroup, "italic"),
        left: readToggle(multipleGroup, "left"),
        multipleValue: multipleGroup?.getAttribute("data-value"),
      },
      initial,
    };
  });
  await page.keyboard.press("ArrowRight");
  const toggleGroupFocusedBeforeSpace = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-value"),
  );
  await page.keyboard.press("Space");
  const toggleGroupKeyboardState = {
    ...(await page.evaluate(() => {
      const defaultGroup = document.querySelector("[data-runtime-toggle-group-default]");
      const readToggle = (value) => {
        const toggle = defaultGroup?.querySelector(`[data-sw-toggle][data-value="${value}"]`);

        return {
          ariaPressed: toggle?.getAttribute("aria-pressed"),
          hasPressed: toggle?.hasAttribute("data-pressed"),
        };
      };

      return {
        bold: readToggle("bold"),
        defaultValue: defaultGroup?.getAttribute("data-value"),
        focusedBeforeSpace: document.activeElement?.getAttribute("data-value"),
        italic: readToggle("italic"),
        underline: readToggle("underline"),
      };
    })),
    focusedFromArrow: toggleGroupFocusedBeforeSpace,
  };
  if (
    toggleGroupState.initial.rootCount !== 2 ||
    toggleGroupState.initial.defaultRole !== "group" ||
    toggleGroupState.initial.hasDefaultDataSw !== true ||
    toggleGroupState.initial.defaultValue !== '["bold"]' ||
    toggleGroupState.initial.defaultClassName?.includes("starwind-toggle-group") === true ||
    toggleGroupState.initial.defaultClassName?.includes("group/toggle-group") !== true ||
    toggleGroupState.initial.defaultClassName?.includes("runtime-toggle-group-custom") !== true ||
    toggleGroupState.initial.defaultVariant !== "default" ||
    toggleGroupState.initial.defaultSize !== "md" ||
    toggleGroupState.initial.defaultSpacing !== "2" ||
    toggleGroupState.initial.bold.hasPressed !== true ||
    toggleGroupState.initial.bold.ariaPressed !== "true" ||
    toggleGroupState.initial.bold.dataSlot !== "toggle-group-item" ||
    toggleGroupState.initial.bold.className?.includes("starwind-toggle-group-item") === true ||
    toggleGroupState.initial.bold.className?.includes("inline-flex") !== true ||
    toggleGroupState.initial.bold.tabIndex !== 0 ||
    toggleGroupState.initial.hasMultiple !== true ||
    toggleGroupState.initial.multipleOrientation !== "vertical" ||
    toggleGroupState.initial.multipleValue !== '["left"]' ||
    toggleGroupState.initial.multipleClassName?.includes("flex-col") !== true ||
    toggleGroupState.initial.left.hasPressed !== true ||
    toggleGroupState.initial.center.hasPressed !== false ||
    toggleGroupState.afterToggle.focusedAfterArrowRight !== "italic" ||
    toggleGroupState.afterToggle.defaultValue !== '["italic"]' ||
    toggleGroupState.afterToggle.bold.hasPressed !== false ||
    toggleGroupState.afterToggle.italic.hasPressed !== true ||
    toggleGroupState.afterToggle.multipleValue !== '["center"]' ||
    toggleGroupState.afterToggle.left.hasPressed !== false ||
    toggleGroupState.afterToggle.center.hasPressed !== true ||
    toggleGroupKeyboardState.focusedFromArrow !== "underline" ||
    toggleGroupKeyboardState.focusedBeforeSpace !== "underline" ||
    toggleGroupKeyboardState.defaultValue !== '["underline"]' ||
    toggleGroupKeyboardState.bold.hasPressed !== false ||
    toggleGroupKeyboardState.bold.ariaPressed !== "false" ||
    toggleGroupKeyboardState.italic.hasPressed !== false ||
    toggleGroupKeyboardState.italic.ariaPressed !== "false" ||
    toggleGroupKeyboardState.underline.hasPressed !== true ||
    toggleGroupKeyboardState.underline.ariaPressed !== "true"
  ) {
    throw new Error(
      `Expected Astro ToggleGroup values, roving focus, and Starwind classes, got ${JSON.stringify({
        toggleGroupKeyboardState,
        toggleGroupState,
      })}.`,
    );
  }
}
