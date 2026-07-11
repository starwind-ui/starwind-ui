export async function verifyReactSelectComboboxCases({ page }) {
  const selectState = await page.evaluate(async () => {
    const waitFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const readSelect = (selector, popupSelector) => {
      const root = document.querySelector(selector);
      const trigger = root?.querySelector("[data-sw-select-trigger]");
      const value = root?.querySelector("[data-sw-select-value]");
      const input = root?.querySelector("[data-sw-select-input]");
      const popup = popupSelector
        ? document.querySelector(popupSelector)
        : selector.includes("density")
          ? document.querySelector("#react-runtime-select-density-content")
          : selector.includes("controlled")
            ? document.querySelector("#react-runtime-select-controlled-content")
            : document.querySelector("#react-runtime-select-theme-content");

      return {
        hasDataSwSelect: root?.hasAttribute("data-sw-select") ?? null,
        inputAutoComplete: input?.getAttribute("autocomplete"),
        inputForm: input?.getAttribute("form"),
        inputName: input?.getAttribute("name"),
        inputRequired: input instanceof HTMLInputElement ? input.required : null,
        inputType: input instanceof HTMLInputElement ? input.type : null,
        inputValue: input instanceof HTMLInputElement ? input.value : null,
        popupHidden: popup instanceof HTMLElement ? popup.hidden : null,
        popupRole: popup?.getAttribute("role"),
        rootReadOnly: root?.hasAttribute("data-readonly") ?? null,
        rootValue: root?.getAttribute("data-value"),
        triggerAriaExpanded: trigger?.getAttribute("aria-expanded"),
        triggerAriaHaspopup: trigger?.getAttribute("aria-haspopup"),
        triggerAriaReadonly: trigger?.getAttribute("aria-readonly"),
        triggerClassName: trigger?.getAttribute("class"),
        triggerReadOnly: trigger?.hasAttribute("data-readonly") ?? null,
        triggerRole: trigger?.getAttribute("role"),
        valueText: value?.textContent?.trim(),
      };
    };

    const themeRoot = document.querySelector("#react-runtime-select-theme");
    const themeTrigger = document.querySelector("#react-runtime-select-theme-trigger");
    const themePopup = document.querySelector("#react-runtime-select-theme-content");
    const controlledTrigger = document.querySelector("#react-runtime-select-controlled-trigger");
    const densityTrigger = document.querySelector("#react-runtime-select-density-trigger");
    const readonlyTrigger = document.querySelector("#react-runtime-select-readonly-trigger");
    const noHoverTrigger = document.querySelector("#react-runtime-select-no-hover-trigger");
    const initial = {
      ...readSelect("#react-runtime-select-theme"),
      densityTriggerHasDataSw: densityTrigger?.hasAttribute("data-sw-select-trigger") ?? null,
      densityTriggerRole: densityTrigger?.getAttribute("role"),
    };

    themeTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    const disabledItem = document.querySelector("#react-runtime-select-theme-contrast");
    const afterOpen = readSelect("#react-runtime-select-theme");
    const afterOpenDisabledItemAriaDisabled = disabledItem?.getAttribute("aria-disabled");
    disabledItem?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const afterDisabledClick = readSelect("#react-runtime-select-theme");
    themePopup?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "d" }));
    themePopup?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    const afterKeyboardSelection = readSelect("#react-runtime-select-theme");

    controlledTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    document
      .querySelector("#react-runtime-select-controlled-dark")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    const afterControlledSelection = readSelect("#react-runtime-select-controlled");

    densityTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    document
      .querySelector("#react-runtime-select-density-compact")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const afterAsChildSelection = readSelect("#react-runtime-select-density");

    readonlyTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    document
      .querySelector("#react-runtime-select-readonly-light")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    const afterReadOnlyClick = readSelect(
      "#react-runtime-select-readonly",
      "#react-runtime-select-readonly-content",
    );

    document
      .querySelector("#react-runtime-select-readonly-content")
      ?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    noHoverTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    const noHoverSpacious = document.querySelector("#react-runtime-select-no-hover-spacious");
    noHoverSpacious?.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    const afterNoHoverOpen = readSelect(
      "#react-runtime-select-no-hover",
      "#react-runtime-select-no-hover-content",
    );

    return {
      afterAsChildSelection,
      afterControlledSelection,
      afterDisabledClick,
      afterKeyboardSelection,
      afterNoHoverOpen,
      afterOpen,
      afterOpenDisabledItemAriaDisabled,
      afterReadOnlyClick,
      controlledCount: document.querySelector("[data-runtime-select-count]")?.textContent?.trim(),
      controlledValue: document.querySelector("[data-runtime-select-value]")?.textContent?.trim(),
      initial,
      noHoverHighlighted: noHoverSpacious?.hasAttribute("data-highlighted") ?? null,
      themeRootHasPlaceholder: themeRoot?.hasAttribute("data-placeholder") ?? null,
    };
  });
  if (
    selectState.initial.hasDataSwSelect !== true ||
    selectState.initial.triggerRole !== "combobox" ||
    selectState.initial.triggerAriaHaspopup !== "listbox" ||
    selectState.initial.inputType !== "hidden" ||
    selectState.initial.inputName !== "reactRuntimeTheme" ||
    selectState.initial.inputRequired !== true ||
    selectState.initial.inputValue !== "system" ||
    selectState.initial.valueText !== "System" ||
    selectState.initial.rootValue !== "system" ||
    selectState.themeRootHasPlaceholder !== false ||
    selectState.afterOpen.triggerAriaExpanded !== "true" ||
    selectState.afterOpen.popupHidden !== false ||
    selectState.afterOpen.popupRole !== "listbox" ||
    selectState.afterOpenDisabledItemAriaDisabled !== "true" ||
    selectState.afterDisabledClick.inputValue !== "system" ||
    selectState.afterKeyboardSelection.inputValue !== "dark" ||
    selectState.afterKeyboardSelection.valueText !== "Dark" ||
    selectState.afterKeyboardSelection.rootValue !== "dark" ||
    selectState.afterControlledSelection.inputValue !== "dark" ||
    selectState.afterControlledSelection.valueText !== "Dark" ||
    selectState.controlledValue !== "Select value: dark" ||
    selectState.controlledCount !== "Select changes: 1" ||
    selectState.afterAsChildSelection.inputValue !== "compact" ||
    selectState.afterAsChildSelection.valueText !== "Compact" ||
    selectState.afterReadOnlyClick.inputName !== "reactRuntimeReadonlyTheme" ||
    selectState.afterReadOnlyClick.inputForm !== "react-runtime-settings-form" ||
    selectState.afterReadOnlyClick.inputAutoComplete !== "organization" ||
    selectState.afterReadOnlyClick.rootReadOnly !== true ||
    selectState.afterReadOnlyClick.triggerAriaReadonly !== "true" ||
    selectState.afterReadOnlyClick.triggerReadOnly !== true ||
    selectState.afterReadOnlyClick.inputValue !== "dark" ||
    selectState.afterReadOnlyClick.valueText !== "Dark" ||
    selectState.afterReadOnlyClick.rootValue !== "dark" ||
    selectState.afterNoHoverOpen.popupHidden !== false ||
    selectState.noHoverHighlighted !== false ||
    selectState.initial.densityTriggerHasDataSw !== true ||
    selectState.initial.densityTriggerRole !== "combobox"
  ) {
    throw new Error(
      `Expected React Select uncontrolled, controlled, keyboard, disabled, hidden input, and asChild behavior, got ${JSON.stringify(
        selectState,
      )}.`,
    );
  }

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-select-no-hover-content");
    return content instanceof HTMLElement && content.hidden;
  });
  await page.locator("#react-runtime-select-theme-trigger").focus();
  await page.keyboard.press("Enter");
  await page.locator("#react-runtime-select-theme-content").waitFor({ state: "visible" });
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-select-theme-content");
    return content instanceof HTMLElement && content.hidden;
  });
  const selectKeyboardFocusAfterClose = await page.evaluate(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
  );
  if (selectKeyboardFocusAfterClose !== "react-runtime-select-theme-trigger") {
    throw new Error(
      `Expected React Select keyboard item selection to return focus to trigger, got ${JSON.stringify(
        selectKeyboardFocusAfterClose,
      )}.`,
    );
  }

  await page.locator("#react-runtime-select-density-trigger").click();
  await page.locator("#react-runtime-select-density-content").waitFor({ state: "visible" });
  await page.locator("#react-runtime-select-density-spacious").click();
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-select-density-content");
    return content instanceof HTMLElement && content.hidden;
  });
  const selectPointerFocusAfterClose = await page.evaluate(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
  );
  if (selectPointerFocusAfterClose !== "react-runtime-select-density-trigger") {
    throw new Error(
      `Expected React Select pointer item selection to return focus to trigger, got ${JSON.stringify(
        selectPointerFocusAfterClose,
      )}.`,
    );
  }

  const selectAlignmentState = await page.evaluate(async () => {
    const waitFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const clickWithMousePointer = (selector) => {
      const trigger = document.querySelector(selector);
      trigger?.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }),
      );
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    };
    const readPopupState = (contentSelector) => {
      const popup = document.querySelector(contentSelector);
      const positioner = popup?.parentElement;
      const popupStyle = popup instanceof HTMLElement ? getComputedStyle(popup) : null;

      return {
        alignItemWithTrigger: popup?.getAttribute("data-align-item-with-trigger"),
        alignTrigger: popup?.getAttribute("data-align-trigger"),
        animationName: popupStyle?.animationName,
        className: popup?.getAttribute("class"),
        hidden: popup instanceof HTMLElement ? popup.hidden : null,
        popupSide: popup?.getAttribute("data-side"),
        positionerAlignItemWithTrigger: positioner?.getAttribute("data-align-item-with-trigger"),
        positionerSide: positioner?.getAttribute("data-side"),
        styleLeft: positioner instanceof HTMLElement ? positioner.style.left : null,
        styleTop: positioner instanceof HTMLElement ? positioner.style.top : null,
      };
    };
    const readAlignedGeometry = () => {
      const value = document.querySelector(
        "#react-runtime-select-aligned-trigger [data-sw-select-value]",
      );
      const selectedText = document.querySelector(
        "#react-runtime-select-aligned-editor [data-sw-select-item-text]",
      );
      const valueRect = value instanceof HTMLElement ? value.getBoundingClientRect() : null;
      const selectedTextRect =
        selectedText instanceof HTMLElement ? selectedText.getBoundingClientRect() : null;

      return {
        horizontalDelta:
          valueRect && selectedTextRect ? Math.abs(valueRect.left - selectedTextRect.left) : null,
        verticalCenterDelta:
          valueRect && selectedTextRect
            ? Math.abs(
                valueRect.top +
                  valueRect.height / 2 -
                  (selectedTextRect.top + selectedTextRect.height / 2),
              )
            : null,
      };
    };

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await waitFrame();
    document.querySelector("#react-runtime-select-aligned")?.scrollIntoView({ block: "center" });
    await waitFrame();
    clickWithMousePointer("#react-runtime-select-aligned-trigger");
    await waitFrame();
    const aligned = readPopupState("#react-runtime-select-aligned-content");
    const alignedGeometry = readAlignedGeometry();

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    const alignedAfterEscape = readPopupState("#react-runtime-select-aligned-content");
    await waitFrame();
    document.querySelector("#react-runtime-select-aligned-trigger")?.focus();
    document
      .querySelector("#react-runtime-select-aligned-trigger")
      ?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    await waitFrame();
    const alignedKeyboard = readPopupState("#react-runtime-select-aligned-content");

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await waitFrame();
    document.querySelector("#react-runtime-select-standard")?.scrollIntoView({ block: "center" });
    await waitFrame();
    clickWithMousePointer("#react-runtime-select-standard-trigger");
    await waitFrame();
    const standard = readPopupState("#react-runtime-select-standard-content");

    return { aligned, alignedAfterEscape, alignedGeometry, alignedKeyboard, standard };
  });
  if (
    selectAlignmentState.aligned.alignItemWithTrigger !== "true" ||
    selectAlignmentState.aligned.positionerAlignItemWithTrigger !== "true" ||
    selectAlignmentState.aligned.alignTrigger !== "true" ||
    selectAlignmentState.aligned.animationName !== "none" ||
    selectAlignmentState.aligned.popupSide !== "none" ||
    selectAlignmentState.aligned.positionerSide !== "none" ||
    !selectAlignmentState.aligned.className?.includes("data-[align-trigger=true]:!animate-none") ||
    selectAlignmentState.aligned.styleLeft === "" ||
    selectAlignmentState.aligned.styleTop === "" ||
    (selectAlignmentState.alignedGeometry.horizontalDelta ?? Number.POSITIVE_INFINITY) > 1 ||
    (selectAlignmentState.alignedGeometry.verticalCenterDelta ?? Number.POSITIVE_INFINITY) > 1 ||
    selectAlignmentState.alignedAfterEscape.hidden !== true ||
    selectAlignmentState.alignedAfterEscape.animationName !== "none" ||
    selectAlignmentState.alignedKeyboard.popupSide !== "none" ||
    selectAlignmentState.alignedKeyboard.positionerSide !== "none" ||
    selectAlignmentState.alignedKeyboard.styleLeft === "" ||
    selectAlignmentState.alignedKeyboard.styleTop === "" ||
    selectAlignmentState.standard.alignItemWithTrigger !== "false" ||
    selectAlignmentState.standard.positionerAlignItemWithTrigger !== "false" ||
    selectAlignmentState.standard.alignTrigger !== "false" ||
    selectAlignmentState.standard.popupSide === "none" ||
    selectAlignmentState.standard.positionerSide === "none"
  ) {
    throw new Error(
      `Expected React Select alignItemWithTrigger demo to align selected item and allow standard placement, got ${JSON.stringify(
        selectAlignmentState,
      )}.`,
    );
  }

  const scrollableSelectState = await page.evaluate(async () => {
    const waitFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await waitFrame();
    document
      .querySelector("#react-runtime-select-scroll-trigger")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();

    const root = document.querySelector("#react-runtime-select-scroll");
    const popup = document.querySelector("#react-runtime-select-scroll-content");
    const list = popup?.querySelector("[data-sw-select-list]");
    const items = Array.from(popup?.querySelectorAll("[data-sw-select-item]") ?? []);

    return {
      itemCount: items.length,
      listCanScroll: list instanceof HTMLElement ? list.scrollHeight > list.clientHeight : null,
      listOverflowY: list instanceof HTMLElement ? getComputedStyle(list).overflowY : null,
      popupHidden: popup instanceof HTMLElement ? popup.hidden : null,
      valueText: root?.querySelector("[data-sw-select-value]")?.textContent?.trim(),
    };
  });
  if (
    scrollableSelectState.itemCount !== 64 ||
    scrollableSelectState.valueText !== "Item 01" ||
    scrollableSelectState.popupHidden !== false ||
    scrollableSelectState.listCanScroll !== true ||
    !["auto", "scroll"].includes(scrollableSelectState.listOverflowY ?? "")
  ) {
    throw new Error(
      `Expected React Select scrollable demo to render overflowing content, got ${JSON.stringify(
        scrollableSelectState,
      )}.`,
    );
  }

  const comboboxState = await page.evaluate(async () => {
    const waitFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const waitReact = async () => {
      await waitFrame();
      await waitFrame();
    };
    const readCombobox = (selector, popupSelector) => {
      const root = document.querySelector(selector);
      const input = root?.querySelector("[data-sw-combobox-input]");
      const hiddenInput = root?.querySelector("[data-sw-combobox-hidden-input]");
      const popup = document.querySelector(popupSelector);

      return {
        hasDataSwCombobox: root?.hasAttribute("data-sw-combobox") ?? null,
        hasClear: root?.querySelector("[data-sw-combobox-clear]") !== null,
        hiddenInputForm: hiddenInput?.getAttribute("form"),
        hiddenInputName: hiddenInput?.getAttribute("name"),
        hiddenInputRequired: hiddenInput instanceof HTMLInputElement ? hiddenInput.required : null,
        hiddenInputType: hiddenInput instanceof HTMLInputElement ? hiddenInput.type : null,
        hiddenInputValue: hiddenInput instanceof HTMLInputElement ? hiddenInput.value : null,
        inputAriaActiveDescendant: input?.getAttribute("aria-activedescendant"),
        inputAriaExpanded: input?.getAttribute("aria-expanded"),
        inputAriaLabelledBy: input?.getAttribute("aria-labelledby"),
        inputAriaReadonly: input?.getAttribute("aria-readonly"),
        inputAutoComplete: input?.getAttribute("autocomplete"),
        inputClassName: input?.getAttribute("class"),
        inputReadOnly: input instanceof HTMLInputElement ? input.readOnly : null,
        inputRole: input?.getAttribute("role"),
        inputValue: input instanceof HTMLInputElement ? input.value : null,
        popupHidden: popup instanceof HTMLElement ? popup.hidden : null,
        popupRole: popup?.getAttribute("role"),
        rootReadOnly: root?.hasAttribute("data-readonly") ?? null,
        rootValue: root?.getAttribute("data-value"),
      };
    };
    const readVisibleComboboxItemValues = (popupSelector) =>
      Array.from(document.querySelectorAll(`${popupSelector} [data-sw-combobox-item]`))
        .filter((item) => item instanceof HTMLElement && !item.hidden)
        .map((item) => item.getAttribute("data-value") ?? item.textContent?.trim() ?? "");
    const readComboboxItem = (popupSelector, value) =>
      document.querySelector(`${popupSelector} [data-sw-combobox-item][data-value="${value}"]`);
    const readComboboxItemState = (popupSelector, value) => {
      const item = readComboboxItem(popupSelector, value);

      return {
        ariaSelected: item?.getAttribute("aria-selected") ?? null,
        hidden: item instanceof HTMLElement ? item.hidden : null,
        highlighted: item?.hasAttribute("data-highlighted") ?? null,
      };
    };

    await waitReact();

    const fruitInput = document.querySelector("#react-runtime-combobox-fruit-input");
    const controlledInput = document.querySelector("#react-runtime-combobox-controlled-input");
    const cityTrigger = document.querySelector("#react-runtime-combobox-city-trigger");
    const readonlyInput = document.querySelector("#react-runtime-combobox-readonly-input");
    const startsWithInput = document.querySelector("#react-runtime-combobox-starts-with-input");
    const initial = {
      ...readCombobox("#react-runtime-combobox-fruit", "#react-runtime-combobox-fruit-content"),
      selectedBanana: readComboboxItemState("#react-runtime-combobox-fruit-content", "banana")
        .ariaSelected,
    };

    fruitInput?.focus();
    fruitInput?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    await waitReact();
    const firstOpen = {
      ...readCombobox("#react-runtime-combobox-fruit", "#react-runtime-combobox-fruit-content"),
      selectedBanana: readComboboxItemState("#react-runtime-combobox-fruit-content", "banana")
        .ariaSelected,
      visibleValues: readVisibleComboboxItemValues("#react-runtime-combobox-fruit-content"),
    };

    if (fruitInput instanceof HTMLInputElement) {
      fruitInput.value = "ap";
      fruitInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await waitReact();
    fruitInput?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    const fruitAppleState = readComboboxItemState("#react-runtime-combobox-fruit-content", "apple");
    const fruitApricotState = readComboboxItemState(
      "#react-runtime-combobox-fruit-content",
      "apricot",
    );
    const fruitBananaState = readComboboxItemState(
      "#react-runtime-combobox-fruit-content",
      "banana",
    );
    const afterFilter = {
      ...readCombobox("#react-runtime-combobox-fruit", "#react-runtime-combobox-fruit-content"),
      appleHidden: fruitAppleState.hidden,
      appleHighlighted: fruitAppleState.highlighted,
      apricotHidden: fruitApricotState.hidden,
      bananaHidden: fruitBananaState.hidden,
      emptyHidden:
        document.querySelector(
          "#react-runtime-combobox-fruit-content [data-sw-combobox-empty]",
        ) instanceof HTMLElement
          ? document.querySelector("#react-runtime-combobox-fruit-content [data-sw-combobox-empty]")
              .hidden
          : null,
      inputIsActive: document.activeElement === fruitInput,
      visibleValues: readVisibleComboboxItemValues("#react-runtime-combobox-fruit-content"),
    };

    const apricotItem = readComboboxItem("#react-runtime-combobox-fruit-content", "apricot");
    apricotItem?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const afterSelectionBeforeCloseAnimation = {
      ...readCombobox("#react-runtime-combobox-fruit", "#react-runtime-combobox-fruit-content"),
      visibleValues: readVisibleComboboxItemValues("#react-runtime-combobox-fruit-content"),
    };
    await waitReact();
    const afterSelection = readCombobox(
      "#react-runtime-combobox-fruit",
      "#react-runtime-combobox-fruit-content",
    );

    controlledInput?.focus();
    if (controlledInput instanceof HTMLInputElement) {
      controlledInput.value = "ap";
      controlledInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await waitReact();
    const afterControlledInput = readCombobox(
      "#react-runtime-combobox-controlled",
      "#react-runtime-combobox-controlled-content",
    );
    document
      .querySelector("#react-runtime-combobox-controlled-apricot")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitReact();
    const afterControlledSelection = readCombobox(
      "#react-runtime-combobox-controlled",
      "#react-runtime-combobox-controlled-content",
    );

    cityTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitReact();
    document
      .querySelector("#react-runtime-combobox-city-lisbon")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitReact();
    const afterAsChildSelection = {
      ...readCombobox("#react-runtime-combobox-city", "#react-runtime-combobox-city-content"),
      triggerClassName: cityTrigger?.getAttribute("class"),
      triggerHasDataSw: cityTrigger?.hasAttribute("data-sw-combobox-trigger") ?? null,
      triggerTagName: cityTrigger?.tagName,
    };

    readonlyInput?.focus();
    if (readonlyInput instanceof HTMLInputElement) {
      readonlyInput.value = "lis";
      readonlyInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    readComboboxItem("#react-runtime-combobox-readonly-content", "lisbon")?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await waitReact();
    const afterReadOnlyInput = readCombobox(
      "#react-runtime-combobox-readonly",
      "#react-runtime-combobox-readonly-content",
    );

    startsWithInput?.focus();
    if (startsWithInput instanceof HTMLInputElement) {
      startsWithInput.value = "na";
      startsWithInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await waitReact();
    const startsWithEmpty = document.querySelector(
      "#react-runtime-combobox-starts-with-content [data-sw-combobox-empty]",
    );
    const afterStartsWithNa = {
      ...readCombobox(
        "#react-runtime-combobox-starts-with",
        "#react-runtime-combobox-starts-with-content",
      ),
      bananaHidden: readComboboxItemState(
        "#react-runtime-combobox-starts-with-content",
        "banana-split",
      ).hidden,
      emptyHidden: startsWithEmpty instanceof HTMLElement ? startsWithEmpty.hidden : null,
    };

    if (startsWithInput instanceof HTMLInputElement) {
      startsWithInput.value = "ap";
      startsWithInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await waitReact();
    readComboboxItem("#react-runtime-combobox-starts-with-content", "apple-tart")?.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    const startsWithAppleState = readComboboxItemState(
      "#react-runtime-combobox-starts-with-content",
      "apple-tart",
    );
    const startsWithBananaAfterApState = readComboboxItemState(
      "#react-runtime-combobox-starts-with-content",
      "banana-split",
    );
    const afterStartsWithAp = {
      ...readCombobox(
        "#react-runtime-combobox-starts-with",
        "#react-runtime-combobox-starts-with-content",
      ),
      appleHidden: startsWithAppleState.hidden,
      appleHighlighted: startsWithAppleState.highlighted,
      bananaHidden: startsWithBananaAfterApState.hidden,
      emptyHidden: startsWithEmpty instanceof HTMLElement ? startsWithEmpty.hidden : null,
    };

    if (startsWithInput instanceof HTMLInputElement) {
      startsWithInput.value = "caf";
      startsWithInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await waitReact();
    const startsWithAppleAfterCafeState = readComboboxItemState(
      "#react-runtime-combobox-starts-with-content",
      "apple-tart",
    );
    const startsWithCafeState = readComboboxItemState(
      "#react-runtime-combobox-starts-with-content",
      "coffee-shop",
    );
    const afterStartsWithCafe = {
      ...readCombobox(
        "#react-runtime-combobox-starts-with",
        "#react-runtime-combobox-starts-with-content",
      ),
      appleHidden: startsWithAppleAfterCafeState.hidden,
      cafeHidden: startsWithCafeState.hidden,
      emptyHidden: startsWithEmpty instanceof HTMLElement ? startsWithEmpty.hidden : null,
    };

    return {
      afterAsChildSelection,
      afterControlledInput,
      afterControlledSelection,
      afterFilter,
      afterReadOnlyInput,
      afterSelection,
      afterSelectionBeforeCloseAnimation,
      afterStartsWithAp,
      afterStartsWithCafe,
      afterStartsWithNa,
      controlledCount: document.querySelector("[data-runtime-combobox-count]")?.textContent?.trim(),
      controlledInputText: document
        .querySelector("[data-runtime-combobox-input-value]")
        ?.textContent?.replace(/\s+/g, " ")
        .trim(),
      controlledValueText: document
        .querySelector("[data-runtime-combobox-value]")
        ?.textContent?.trim(),
      firstOpen,
      initial,
    };
  });
  if (
    comboboxState.initial.hasDataSwCombobox !== true ||
    comboboxState.initial.hiddenInputType !== "hidden" ||
    comboboxState.initial.hiddenInputName !== "reactRuntimeFruit" ||
    comboboxState.initial.hiddenInputRequired !== true ||
    comboboxState.initial.hiddenInputValue !== "banana" ||
    comboboxState.initial.hasClear !== false ||
    comboboxState.initial.inputRole !== "combobox" ||
    comboboxState.initial.inputValue !== "Banana" ||
    comboboxState.initial.inputClassName?.includes("border-0") !== true ||
    comboboxState.initial.inputClassName?.includes("shadow-none") !== true ||
    comboboxState.initial.popupRole !== "listbox" ||
    comboboxState.firstOpen.inputAriaExpanded !== "true" ||
    !comboboxState.firstOpen.inputAriaLabelledBy ||
    comboboxState.firstOpen.popupHidden !== false ||
    comboboxState.firstOpen.rootValue !== "banana" ||
    comboboxState.firstOpen.selectedBanana !== "true" ||
    comboboxState.firstOpen.visibleValues.length !== 5 ||
    !comboboxState.firstOpen.visibleValues.includes("apple") ||
    !comboboxState.firstOpen.visibleValues.includes("apricot") ||
    !comboboxState.firstOpen.visibleValues.includes("banana") ||
    !comboboxState.firstOpen.visibleValues.includes("dragonfruit") ||
    !comboboxState.firstOpen.visibleValues.includes("pear") ||
    comboboxState.afterFilter.inputAriaExpanded !== "true" ||
    comboboxState.afterFilter.popupHidden !== false ||
    comboboxState.afterFilter.appleHidden !== false ||
    comboboxState.afterFilter.apricotHidden !== false ||
    comboboxState.afterFilter.bananaHidden !== true ||
    comboboxState.afterFilter.emptyHidden !== true ||
    comboboxState.afterFilter.inputIsActive !== true ||
    comboboxState.afterFilter.visibleValues.length !== 2 ||
    !comboboxState.afterFilter.visibleValues.includes("apple") ||
    !comboboxState.afterFilter.visibleValues.includes("apricot") ||
    !comboboxState.afterFilter.inputAriaActiveDescendant ||
    comboboxState.afterSelectionBeforeCloseAnimation.inputAriaExpanded !== "false" ||
    comboboxState.afterSelectionBeforeCloseAnimation.popupHidden !== false ||
    comboboxState.afterSelectionBeforeCloseAnimation.visibleValues.length !== 2 ||
    !comboboxState.afterSelectionBeforeCloseAnimation.visibleValues.includes("apple") ||
    !comboboxState.afterSelectionBeforeCloseAnimation.visibleValues.includes("apricot") ||
    comboboxState.afterSelection.hiddenInputValue !== "apricot" ||
    comboboxState.afterSelection.inputValue !== "Apricot" ||
    comboboxState.afterSelection.rootValue !== "apricot" ||
    comboboxState.afterSelection.inputAriaExpanded !== "false" ||
    comboboxState.afterControlledInput.inputValue !== "ap" ||
    comboboxState.afterControlledSelection.hiddenInputValue !== "apricot" ||
    comboboxState.afterControlledSelection.inputValue !== "Apricot" ||
    comboboxState.afterControlledSelection.rootValue !== "apricot" ||
    comboboxState.controlledValueText !== "Combobox value: apricot" ||
    comboboxState.controlledInputText !== "Combobox input: Apricot" ||
    comboboxState.controlledCount !== "Combobox changes: 1" ||
    comboboxState.afterReadOnlyInput.hiddenInputName !== "reactRuntimeReadonlyCity" ||
    comboboxState.afterReadOnlyInput.hiddenInputForm !== "react-runtime-settings-form" ||
    comboboxState.afterReadOnlyInput.hiddenInputValue !== "kyoto" ||
    comboboxState.afterReadOnlyInput.inputAutoComplete !== "address-level2" ||
    comboboxState.afterReadOnlyInput.inputAriaReadonly !== "true" ||
    comboboxState.afterReadOnlyInput.inputReadOnly !== true ||
    comboboxState.afterReadOnlyInput.inputValue !== "Kyoto" ||
    comboboxState.afterReadOnlyInput.rootReadOnly !== true ||
    comboboxState.afterReadOnlyInput.rootValue !== "kyoto" ||
    comboboxState.afterStartsWithNa.inputAriaExpanded !== "true" ||
    comboboxState.afterStartsWithNa.bananaHidden !== true ||
    comboboxState.afterStartsWithNa.emptyHidden !== false ||
    comboboxState.afterStartsWithAp.appleHidden !== false ||
    comboboxState.afterStartsWithAp.bananaHidden !== true ||
    comboboxState.afterStartsWithAp.emptyHidden !== true ||
    comboboxState.afterStartsWithAp.appleHighlighted !== false ||
    comboboxState.afterStartsWithCafe.cafeHidden !== false ||
    comboboxState.afterStartsWithCafe.appleHidden !== true ||
    comboboxState.afterStartsWithCafe.emptyHidden !== true ||
    comboboxState.afterAsChildSelection.hiddenInputValue !== "lisbon" ||
    comboboxState.afterAsChildSelection.inputValue !== "Lisbon" ||
    comboboxState.afterAsChildSelection.rootValue !== "lisbon" ||
    comboboxState.afterAsChildSelection.triggerTagName !== "BUTTON" ||
    comboboxState.afterAsChildSelection.triggerHasDataSw !== true
  ) {
    throw new Error(
      `Expected React Combobox uncontrolled, controlled, filtering, mouse close, hidden input, unstyled input, and asChild behavior, got ${JSON.stringify(
        comboboxState,
      )}.`,
    );
  }

  await page.locator("#react-runtime-combobox-fruit-input").fill("ap");
  await page.locator("#react-runtime-combobox-fruit-content").waitFor({ state: "visible" });
  const reactComboboxAppleBox = await page
    .locator("#react-runtime-combobox-fruit-apple")
    .boundingBox();
  if (!reactComboboxAppleBox) {
    throw new Error("Expected React Combobox apple item to have a bounding box.");
  }
  await page.mouse.move(
    reactComboboxAppleBox.x + reactComboboxAppleBox.width / 2,
    reactComboboxAppleBox.y + reactComboboxAppleBox.height / 2,
  );
  await page.mouse.down();
  const comboboxFocusAfterPointerDown = await page.evaluate(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
  );
  await page.mouse.up();
  await page.locator("#react-runtime-combobox-fruit-content").waitFor({ state: "hidden" });
  await page.waitForFunction(() => {
    const popup = document.querySelector("#react-runtime-combobox-fruit-content");
    return popup instanceof HTMLElement && popup.hidden;
  });
  const comboboxAfterPointerSelection = await page.evaluate(() => {
    const root = document.querySelector("#react-runtime-combobox-fruit");
    const input = document.querySelector("#react-runtime-combobox-fruit-input");
    const hiddenInput = root?.querySelector('input[type="hidden"]');

    return {
      activeElementId:
        document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
      hiddenInputValue: hiddenInput instanceof HTMLInputElement ? hiddenInput.value : null,
      inputAriaExpanded: input?.getAttribute("aria-expanded"),
      inputValue: input instanceof HTMLInputElement ? input.value : null,
      rootValue: root?.getAttribute("data-value"),
    };
  });
  if (comboboxFocusAfterPointerDown !== "react-runtime-combobox-fruit-input") {
    throw new Error(
      `Expected React Combobox item pointerdown to keep focus on input, got ${JSON.stringify(
        comboboxFocusAfterPointerDown,
      )}.`,
    );
  }
  if (
    comboboxAfterPointerSelection.activeElementId !== "react-runtime-combobox-fruit-input" ||
    comboboxAfterPointerSelection.hiddenInputValue !== "apple" ||
    comboboxAfterPointerSelection.inputAriaExpanded !== "false" ||
    comboboxAfterPointerSelection.inputValue !== "Apple" ||
    comboboxAfterPointerSelection.rootValue !== "apple"
  ) {
    throw new Error(
      `Expected React Combobox mouseup to select apple and close after preserved focus, got ${JSON.stringify(
        comboboxAfterPointerSelection,
      )}.`,
    );
  }

  await page.locator("#react-runtime-combobox-fruit-input").fill("zz");
  await page.locator("#react-runtime-combobox-fruit-content").waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const popup = document.querySelector("#react-runtime-combobox-fruit-content");
    return popup instanceof HTMLElement && popup.hidden;
  });
  const selectedComboboxAfterEscapeRollback = await page.evaluate(() => {
    const root = document.querySelector("#react-runtime-combobox-fruit");
    const input = document.querySelector("#react-runtime-combobox-fruit-input");
    const hiddenInput = root?.querySelector('input[type="hidden"]');

    return {
      hiddenInputValue: hiddenInput instanceof HTMLInputElement ? hiddenInput.value : null,
      inputAriaExpanded: input?.getAttribute("aria-expanded"),
      inputValue: input instanceof HTMLInputElement ? input.value : null,
      rootValue: root?.getAttribute("data-value"),
    };
  });
  if (
    selectedComboboxAfterEscapeRollback.hiddenInputValue !== "apple" ||
    selectedComboboxAfterEscapeRollback.inputAriaExpanded !== "false" ||
    selectedComboboxAfterEscapeRollback.inputValue !== "Apple" ||
    selectedComboboxAfterEscapeRollback.rootValue !== "apple"
  ) {
    throw new Error(
      `Expected React Combobox Escape close to restore selected text after uncommitted search, got ${JSON.stringify(
        selectedComboboxAfterEscapeRollback,
      )}.`,
    );
  }

  await page.locator("#react-runtime-combobox-starts-with-input").fill("caf");
  await page.locator("#react-runtime-combobox-starts-with-content").waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const popup = document.querySelector("#react-runtime-combobox-starts-with-content");
    return popup instanceof HTMLElement && popup.hidden;
  });
  const emptyComboboxAfterEscapeRollback = await page.evaluate(() => {
    const root = document.querySelector("#react-runtime-combobox-starts-with");
    const input = document.querySelector("#react-runtime-combobox-starts-with-input");
    const hiddenInput = root?.querySelector('input[type="hidden"]');

    return {
      hiddenInputValue: hiddenInput instanceof HTMLInputElement ? hiddenInput.value : null,
      inputAriaExpanded: input?.getAttribute("aria-expanded"),
      inputValue: input instanceof HTMLInputElement ? input.value : null,
      rootValue: root?.getAttribute("data-value"),
    };
  });
  if (
    emptyComboboxAfterEscapeRollback.hiddenInputValue !== "" ||
    emptyComboboxAfterEscapeRollback.inputAriaExpanded !== "false" ||
    emptyComboboxAfterEscapeRollback.inputValue !== "" ||
    emptyComboboxAfterEscapeRollback.rootValue !== null
  ) {
    throw new Error(
      `Expected React Combobox Escape close to restore empty text after uncommitted search, got ${JSON.stringify(
        emptyComboboxAfterEscapeRollback,
      )}.`,
    );
  }

  const comboboxUrlBeforeClosedEnter = page.url();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  if (page.url() !== comboboxUrlBeforeClosedEnter) {
    throw new Error(
      `Expected React Combobox demo to prevent accidental Enter submission after selection, URL changed from ${comboboxUrlBeforeClosedEnter} to ${page.url()}.`,
    );
  }

  await page.getByRole("button", { name: 'Programmatically select "astro"' }).click();
  await page.waitForFunction(() => {
    const root = document.querySelector("#react-runtime-project-framework-combobox");
    const input = document.querySelector("#react-runtime-project-framework");
    const hiddenInput = root?.querySelector('input[type="hidden"]');

    return (
      root?.getAttribute("data-value") === "astro" &&
      input instanceof HTMLInputElement &&
      input.value === "Astro" &&
      hiddenInput instanceof HTMLInputElement &&
      hiddenInput.value === "astro"
    );
  });
  const programmaticProjectComboboxAfterClick = await page.evaluate(() => {
    const form = document.querySelector("#react-runtime-create-project-form");
    const root = document.querySelector("#react-runtime-project-framework-combobox");
    const input = document.querySelector("#react-runtime-project-framework");
    const hiddenInput = root?.querySelector('input[type="hidden"]');

    return {
      formFrameworkValue:
        form instanceof HTMLFormElement ? new FormData(form).get("framework") : null,
      hiddenInputValue: hiddenInput instanceof HTMLInputElement ? hiddenInput.value : null,
      inputAriaExpanded: input?.getAttribute("aria-expanded"),
      inputValue: input instanceof HTMLInputElement ? input.value : null,
      rootValue: root?.getAttribute("data-value"),
    };
  });
  if (
    programmaticProjectComboboxAfterClick.formFrameworkValue !== "astro" ||
    programmaticProjectComboboxAfterClick.hiddenInputValue !== "astro" ||
    programmaticProjectComboboxAfterClick.inputAriaExpanded !== "false" ||
    programmaticProjectComboboxAfterClick.inputValue !== "Astro" ||
    programmaticProjectComboboxAfterClick.rootValue !== "astro"
  ) {
    throw new Error(
      `Expected React Create project Combobox button to programmatically select Astro while closed, got ${JSON.stringify(
        programmaticProjectComboboxAfterClick,
      )}.`,
    );
  }

  await page.locator("#react-runtime-project-framework").focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(() => {
    const input = document.querySelector("#react-runtime-project-framework");
    const popupId = input?.getAttribute("aria-controls");
    const popup = popupId ? document.getElementById(popupId) : null;
    return popup instanceof HTMLElement && !popup.hidden;
  });
  const programmaticProjectComboboxAfterOpen = await page.evaluate(() => {
    const input = document.querySelector("#react-runtime-project-framework");
    const popupId = input?.getAttribute("aria-controls");
    const popup = popupId ? document.getElementById(popupId) : null;
    const astroItem = popup?.querySelector('[data-sw-combobox-item][data-value="astro"]');

    return {
      astroAriaSelected: astroItem?.getAttribute("aria-selected"),
      astroDataSelected: astroItem?.hasAttribute("data-selected") ?? null,
      inputAriaExpanded: input?.getAttribute("aria-expanded"),
      popupHidden: popup instanceof HTMLElement ? popup.hidden : null,
    };
  });
  if (
    programmaticProjectComboboxAfterOpen.astroAriaSelected !== "true" ||
    programmaticProjectComboboxAfterOpen.astroDataSelected !== true ||
    programmaticProjectComboboxAfterOpen.inputAriaExpanded !== "true" ||
    programmaticProjectComboboxAfterOpen.popupHidden !== false
  ) {
    throw new Error(
      `Expected React Create project Combobox to show Astro selected after opening, got ${JSON.stringify(
        programmaticProjectComboboxAfterOpen,
      )}.`,
    );
  }

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const input = document.querySelector("#react-runtime-project-framework");
    const popupId = input?.getAttribute("aria-controls");
    const popup = popupId ? document.getElementById(popupId) : null;
    return popup instanceof HTMLElement && popup.hidden;
  });

  await page.evaluate(() => {
    document.querySelector("#react-runtime-project-framework-combobox")?.dispatchEvent(
      new CustomEvent("starwind:set-value", {
        detail: { value: "svelte" },
      }),
    );
  });
  await page.waitForFunction(() => {
    const root = document.querySelector("#react-runtime-project-framework-combobox");
    const input = document.querySelector("#react-runtime-project-framework");
    const hiddenInput = root?.querySelector('input[type="hidden"]');

    return (
      root?.getAttribute("data-value") === "svelte" &&
      input instanceof HTMLInputElement &&
      input.value === "SvelteKit" &&
      hiddenInput instanceof HTMLInputElement &&
      hiddenInput.value === "svelte"
    );
  });

  await page.getByRole("button", { name: 'Programmatically select "astro"' }).click();
  await page.waitForFunction(() => {
    const root = document.querySelector("#react-runtime-project-framework-combobox");
    const input = document.querySelector("#react-runtime-project-framework");
    const hiddenInput = root?.querySelector('input[type="hidden"]');

    return (
      root?.getAttribute("data-value") === "astro" &&
      input instanceof HTMLInputElement &&
      input.value === "Astro" &&
      hiddenInput instanceof HTMLInputElement &&
      hiddenInput.value === "astro"
    );
  });

  await page.evaluate(() => {
    document.querySelector("#react-runtime-project-framework-combobox")?.dispatchEvent(
      new CustomEvent("starwind:set-value", {
        detail: { value: "" },
      }),
    );
  });
  await page.waitForFunction(() => {
    const root = document.querySelector("#react-runtime-project-framework-combobox");
    const input = document.querySelector("#react-runtime-project-framework");
    const hiddenInput = root?.querySelector('input[type="hidden"]');

    return (
      root?.getAttribute("data-value") === null &&
      input instanceof HTMLInputElement &&
      input.value === "" &&
      hiddenInput instanceof HTMLInputElement &&
      hiddenInput.value === ""
    );
  });
  const programmaticProjectComboboxAfterClear = await page.evaluate(() => {
    const form = document.querySelector("#react-runtime-create-project-form");
    const root = document.querySelector("#react-runtime-project-framework-combobox");
    const input = document.querySelector("#react-runtime-project-framework");
    const hiddenInput = root?.querySelector('input[type="hidden"]');

    return {
      formFrameworkValue:
        form instanceof HTMLFormElement ? new FormData(form).get("framework") : null,
      hiddenInputValue: hiddenInput instanceof HTMLInputElement ? hiddenInput.value : null,
      inputValue: input instanceof HTMLInputElement ? input.value : null,
      rootValue: root?.getAttribute("data-value"),
    };
  });
  if (
    programmaticProjectComboboxAfterClear.formFrameworkValue !== "" ||
    programmaticProjectComboboxAfterClear.hiddenInputValue !== "" ||
    programmaticProjectComboboxAfterClear.inputValue !== "" ||
    programmaticProjectComboboxAfterClear.rootValue !== null
  ) {
    throw new Error(
      `Expected React Create project Combobox empty string command to clear selection, got ${JSON.stringify(
        programmaticProjectComboboxAfterClear,
      )}.`,
    );
  }
}
