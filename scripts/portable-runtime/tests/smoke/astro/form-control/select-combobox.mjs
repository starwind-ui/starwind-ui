export async function verifyAstroSelectComboboxCases({ page }) {
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
          ? document.querySelector("#runtime-select-density-content")
          : document.querySelector("#runtime-select-theme-content");

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

    const themeRoot = document.querySelector("#runtime-select-theme");
    const themeTrigger = document.querySelector("#runtime-select-theme-trigger");
    const themePopup = document.querySelector("#runtime-select-theme-content");
    const disabledItem = document.querySelector("#runtime-select-theme-contrast");
    const densityTrigger = document.querySelector("#runtime-select-density-trigger");
    const readonlyTrigger = document.querySelector("#runtime-select-readonly-trigger");
    const noHoverTrigger = document.querySelector("#runtime-select-no-hover-trigger");
    const initial = {
      ...readSelect("#runtime-select-theme"),
      disabledItemAriaDisabled: disabledItem?.getAttribute("aria-disabled"),
      densityTriggerHasDataSw: densityTrigger?.hasAttribute("data-sw-select-trigger") ?? null,
      densityTriggerRole: densityTrigger?.getAttribute("role"),
    };

    themeTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    const afterOpen = readSelect("#runtime-select-theme");
    disabledItem?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const afterDisabledClick = readSelect("#runtime-select-theme");
    themePopup?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "d" }));
    themePopup?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    const afterKeyboardSelection = readSelect("#runtime-select-theme");

    densityTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    document
      .querySelector("#runtime-select-density-compact")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const afterAsChildSelection = readSelect("#runtime-select-density");

    readonlyTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    document
      .querySelector("#runtime-select-readonly-light")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const afterReadOnlyClick = readSelect(
      "#runtime-select-readonly",
      "#runtime-select-readonly-content",
    );

    document
      .querySelector("#runtime-select-readonly-content")
      ?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    noHoverTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    const noHoverSpacious = document.querySelector("#runtime-select-no-hover-spacious");
    noHoverSpacious?.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    const afterNoHoverOpen = readSelect(
      "#runtime-select-no-hover",
      "#runtime-select-no-hover-content",
    );

    return {
      afterAsChildSelection,
      afterDisabledClick,
      afterKeyboardSelection,
      afterNoHoverOpen,
      afterOpen,
      afterReadOnlyClick,
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
    selectState.initial.inputName !== "runtimeTheme" ||
    selectState.initial.inputRequired !== true ||
    selectState.initial.inputValue !== "system" ||
    selectState.initial.valueText !== "System" ||
    selectState.initial.rootValue !== "system" ||
    selectState.initial.disabledItemAriaDisabled !== "true" ||
    selectState.themeRootHasPlaceholder !== false ||
    selectState.afterOpen.triggerAriaExpanded !== "true" ||
    selectState.afterOpen.popupHidden !== false ||
    selectState.afterOpen.popupRole !== "listbox" ||
    selectState.afterDisabledClick.inputValue !== "system" ||
    selectState.afterKeyboardSelection.inputValue !== "dark" ||
    selectState.afterKeyboardSelection.valueText !== "Dark" ||
    selectState.afterKeyboardSelection.rootValue !== "dark" ||
    selectState.afterAsChildSelection.inputValue !== "compact" ||
    selectState.afterAsChildSelection.valueText !== "Compact" ||
    selectState.afterReadOnlyClick.inputName !== "runtimeReadonlyTheme" ||
    selectState.afterReadOnlyClick.inputForm !== "runtime-settings-form" ||
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
      `Expected Astro Select default, keyboard, disabled, hidden input, and asChild behavior, got ${JSON.stringify(
        selectState,
      )}.`,
    );
  }

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const content = document.querySelector("#runtime-select-no-hover-content");
    return content instanceof HTMLElement && content.hidden;
  });
  await page.locator("#runtime-select-theme-trigger").focus();
  await page.keyboard.press("Enter");
  await page.locator("#runtime-select-theme-content").waitFor({ state: "visible" });
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => {
    const content = document.querySelector("#runtime-select-theme-content");
    return content instanceof HTMLElement && content.hidden;
  });
  const selectKeyboardFocusAfterClose = await page.evaluate(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
  );
  if (selectKeyboardFocusAfterClose !== "runtime-select-theme-trigger") {
    throw new Error(
      `Expected Astro Select keyboard item selection to return focus to trigger, got ${JSON.stringify(
        selectKeyboardFocusAfterClose,
      )}.`,
    );
  }

  await page.locator("#runtime-select-density-trigger").click();
  await page.locator("#runtime-select-density-content").waitFor({ state: "visible" });
  await page.locator("#runtime-select-density-spacious").click();
  await page.waitForFunction(() => {
    const content = document.querySelector("#runtime-select-density-content");
    return content instanceof HTMLElement && content.hidden;
  });
  const selectPointerFocusAfterClose = await page.evaluate(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
  );
  if (selectPointerFocusAfterClose !== "runtime-select-density-trigger") {
    throw new Error(
      `Expected Astro Select pointer item selection to return focus to trigger, got ${JSON.stringify(
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
        "#runtime-select-aligned-trigger [data-sw-select-value]",
      );
      const selectedText = document.querySelector(
        "#runtime-select-aligned-editor [data-sw-select-item-text]",
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
    document.querySelector("#runtime-select-aligned")?.scrollIntoView({ block: "center" });
    await waitFrame();
    clickWithMousePointer("#runtime-select-aligned-trigger");
    await waitFrame();
    const aligned = readPopupState("#runtime-select-aligned-content");
    const alignedGeometry = readAlignedGeometry();

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    const alignedAfterEscape = readPopupState("#runtime-select-aligned-content");
    await waitFrame();
    document.querySelector("#runtime-select-aligned-trigger")?.focus();
    document
      .querySelector("#runtime-select-aligned-trigger")
      ?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    await waitFrame();
    const alignedKeyboard = readPopupState("#runtime-select-aligned-content");

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await waitFrame();
    document.querySelector("#runtime-select-standard")?.scrollIntoView({ block: "center" });
    await waitFrame();
    clickWithMousePointer("#runtime-select-standard-trigger");
    await waitFrame();
    const standard = readPopupState("#runtime-select-standard-content");

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
      `Expected Astro Select alignItemWithTrigger demo to align selected item and allow standard placement, got ${JSON.stringify(
        selectAlignmentState,
      )}.`,
    );
  }

  const scrollableSelectState = await page.evaluate(async () => {
    const waitFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await waitFrame();
    document
      .querySelector("#runtime-select-scroll-trigger")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();

    const root = document.querySelector("#runtime-select-scroll");
    const popup = document.querySelector("#runtime-select-scroll-content");
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
      `Expected Astro Select scrollable demo to render overflowing content, got ${JSON.stringify(
        scrollableSelectState,
      )}.`,
    );
  }

  await closeAstroSelectPopups(page);

  const comboboxState = await page.evaluate(async () => {
    const waitFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
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

    const fruitInput = document.querySelector("#runtime-combobox-fruit-input");
    const appleItem = document.querySelector("#runtime-combobox-fruit-apple");
    const apricotItem = document.querySelector("#runtime-combobox-fruit-apricot");
    const bananaItem = document.querySelector("#runtime-combobox-fruit-banana");
    const cityTrigger = document.querySelector("#runtime-combobox-city-trigger");
    const cityLisbon = document.querySelector("#runtime-combobox-city-lisbon");
    const readonlyInput = document.querySelector("#runtime-combobox-readonly-input");
    const readonlyLisbon = document.querySelector("#runtime-combobox-readonly-lisbon");
    const startsWithInput = document.querySelector("#runtime-combobox-starts-with-input");
    const startsWithApple = document.querySelector("#runtime-combobox-starts-with-apple-tart");
    const startsWithBanana = document.querySelector("#runtime-combobox-starts-with-banana-split");
    const startsWithCafe = document.querySelector("#runtime-combobox-starts-with-coffee-shop");
    const initial = {
      ...readCombobox("#runtime-combobox-fruit", "#runtime-combobox-fruit-content"),
      selectedBanana: bananaItem?.getAttribute("aria-selected"),
    };

    fruitInput?.focus();
    if (fruitInput instanceof HTMLInputElement) {
      fruitInput.value = "ap";
      fruitInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await waitFrame();
    fruitInput?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    const afterFilter = {
      ...readCombobox("#runtime-combobox-fruit", "#runtime-combobox-fruit-content"),
      appleHidden: appleItem instanceof HTMLElement ? appleItem.hidden : null,
      appleHighlighted: appleItem?.hasAttribute("data-highlighted") ?? null,
      apricotHidden: apricotItem instanceof HTMLElement ? apricotItem.hidden : null,
      bananaHidden: bananaItem instanceof HTMLElement ? bananaItem.hidden : null,
      emptyHidden:
        document.querySelector(
          "#runtime-combobox-fruit-content [data-sw-combobox-empty]",
        ) instanceof HTMLElement
          ? document.querySelector("#runtime-combobox-fruit-content [data-sw-combobox-empty]")
              .hidden
          : null,
      inputIsActive: document.activeElement === fruitInput,
    };

    apricotItem?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    const afterSelection = readCombobox(
      "#runtime-combobox-fruit",
      "#runtime-combobox-fruit-content",
    );

    cityTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    cityLisbon?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const afterAsChildSelection = {
      ...readCombobox("#runtime-combobox-city", "#runtime-combobox-city-content"),
      triggerClassName: cityTrigger?.getAttribute("class"),
      triggerHasDataSw: cityTrigger?.hasAttribute("data-sw-combobox-trigger") ?? null,
      triggerTagName: cityTrigger?.tagName,
    };

    readonlyInput?.focus();
    if (readonlyInput instanceof HTMLInputElement) {
      readonlyInput.value = "lis";
      readonlyInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    readonlyLisbon?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await waitFrame();
    const afterReadOnlyInput = readCombobox(
      "#runtime-combobox-readonly",
      "#runtime-combobox-readonly-content",
    );

    startsWithInput?.focus();
    if (startsWithInput instanceof HTMLInputElement) {
      startsWithInput.value = "na";
      startsWithInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await waitFrame();
    const startsWithEmpty = document.querySelector(
      "#runtime-combobox-starts-with-content [data-sw-combobox-empty]",
    );
    const afterStartsWithNa = {
      ...readCombobox("#runtime-combobox-starts-with", "#runtime-combobox-starts-with-content"),
      bananaHidden: startsWithBanana instanceof HTMLElement ? startsWithBanana.hidden : null,
      emptyHidden: startsWithEmpty instanceof HTMLElement ? startsWithEmpty.hidden : null,
    };

    if (startsWithInput instanceof HTMLInputElement) {
      startsWithInput.value = "ap";
      startsWithInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await waitFrame();
    startsWithApple?.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    const afterStartsWithAp = {
      ...readCombobox("#runtime-combobox-starts-with", "#runtime-combobox-starts-with-content"),
      appleHidden: startsWithApple instanceof HTMLElement ? startsWithApple.hidden : null,
      appleHighlighted: startsWithApple?.hasAttribute("data-highlighted") ?? null,
      bananaHidden: startsWithBanana instanceof HTMLElement ? startsWithBanana.hidden : null,
      emptyHidden: startsWithEmpty instanceof HTMLElement ? startsWithEmpty.hidden : null,
    };

    if (startsWithInput instanceof HTMLInputElement) {
      startsWithInput.value = "caf";
      startsWithInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    await waitFrame();
    const afterStartsWithCafe = {
      ...readCombobox("#runtime-combobox-starts-with", "#runtime-combobox-starts-with-content"),
      appleHidden: startsWithApple instanceof HTMLElement ? startsWithApple.hidden : null,
      cafeHidden: startsWithCafe instanceof HTMLElement ? startsWithCafe.hidden : null,
      emptyHidden: startsWithEmpty instanceof HTMLElement ? startsWithEmpty.hidden : null,
    };

    return {
      afterAsChildSelection,
      afterFilter,
      afterReadOnlyInput,
      afterSelection,
      afterStartsWithAp,
      afterStartsWithCafe,
      afterStartsWithNa,
      initial,
    };
  });
  if (
    comboboxState.initial.hasDataSwCombobox !== true ||
    comboboxState.initial.hiddenInputType !== "hidden" ||
    comboboxState.initial.hiddenInputName !== "runtimeFruit" ||
    comboboxState.initial.hiddenInputRequired !== true ||
    comboboxState.initial.hiddenInputValue !== "banana" ||
    comboboxState.initial.hasClear !== false ||
    comboboxState.initial.inputRole !== "combobox" ||
    comboboxState.initial.inputValue !== "Banana" ||
    comboboxState.initial.inputClassName?.includes("border-0") !== true ||
    comboboxState.initial.inputClassName?.includes("shadow-none") !== true ||
    !comboboxState.initial.inputAriaLabelledBy ||
    comboboxState.initial.popupRole !== "listbox" ||
    comboboxState.initial.rootValue !== "banana" ||
    comboboxState.initial.selectedBanana !== "true" ||
    comboboxState.afterFilter.inputAriaExpanded !== "true" ||
    comboboxState.afterFilter.popupHidden !== false ||
    comboboxState.afterFilter.appleHidden !== false ||
    comboboxState.afterFilter.apricotHidden !== false ||
    comboboxState.afterFilter.bananaHidden !== true ||
    comboboxState.afterFilter.emptyHidden !== true ||
    comboboxState.afterFilter.inputIsActive !== true ||
    !comboboxState.afterFilter.inputAriaActiveDescendant ||
    comboboxState.afterSelection.hiddenInputValue !== "apricot" ||
    comboboxState.afterSelection.inputValue !== "Apricot" ||
    comboboxState.afterSelection.rootValue !== "apricot" ||
    comboboxState.afterSelection.inputAriaExpanded !== "false" ||
    comboboxState.afterReadOnlyInput.hiddenInputName !== "runtimeReadonlyCity" ||
    comboboxState.afterReadOnlyInput.hiddenInputForm !== "runtime-settings-form" ||
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
      `Expected Astro Combobox default, filtering, mouse close, hidden input, unstyled input, and asChild behavior, got ${JSON.stringify(
        comboboxState,
      )}.`,
    );
  }

  await page.locator("#runtime-combobox-fruit-input").fill("ap");
  await page.locator("#runtime-combobox-fruit-content").waitFor({ state: "visible" });
  const astroComboboxAppleBox = await page.locator("#runtime-combobox-fruit-apple").boundingBox();
  if (!astroComboboxAppleBox) {
    throw new Error("Expected Astro Combobox apple item to have a bounding box.");
  }
  await page.mouse.move(
    astroComboboxAppleBox.x + astroComboboxAppleBox.width / 2,
    astroComboboxAppleBox.y + astroComboboxAppleBox.height / 2,
  );
  await page.mouse.down();
  const comboboxFocusAfterPointerDown = await page.evaluate(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
  );
  await page.mouse.up();
  await page.locator("#runtime-combobox-fruit-content").waitFor({ state: "hidden" });
  await page.waitForFunction(() => {
    const popup = document.querySelector("#runtime-combobox-fruit-content");
    return popup instanceof HTMLElement && popup.hidden;
  });
  const comboboxAfterPointerSelection = await page.evaluate(() => {
    const root = document.querySelector("#runtime-combobox-fruit");
    const input = document.querySelector("#runtime-combobox-fruit-input");
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
  if (comboboxFocusAfterPointerDown !== "runtime-combobox-fruit-input") {
    throw new Error(
      `Expected Astro Combobox item pointerdown to keep focus on input, got ${JSON.stringify(
        comboboxFocusAfterPointerDown,
      )}.`,
    );
  }
  if (
    comboboxAfterPointerSelection.activeElementId !== "runtime-combobox-fruit-input" ||
    comboboxAfterPointerSelection.hiddenInputValue !== "apple" ||
    comboboxAfterPointerSelection.inputAriaExpanded !== "false" ||
    comboboxAfterPointerSelection.inputValue !== "Apple" ||
    comboboxAfterPointerSelection.rootValue !== "apple"
  ) {
    throw new Error(
      `Expected Astro Combobox mouseup to select apple and close after preserved focus, got ${JSON.stringify(
        comboboxAfterPointerSelection,
      )}.`,
    );
  }

  await page.locator("#runtime-combobox-fruit-input").fill("zz");
  await page.locator("#runtime-combobox-fruit-content").waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const popup = document.querySelector("#runtime-combobox-fruit-content");
    return popup instanceof HTMLElement && popup.hidden;
  });
  const selectedComboboxAfterEscapeRollback = await page.evaluate(() => {
    const root = document.querySelector("#runtime-combobox-fruit");
    const input = document.querySelector("#runtime-combobox-fruit-input");
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
      `Expected Astro Combobox Escape close to restore selected text after uncommitted search, got ${JSON.stringify(
        selectedComboboxAfterEscapeRollback,
      )}.`,
    );
  }

  await page.locator("#runtime-combobox-starts-with-input").fill("caf");
  await page.locator("#runtime-combobox-starts-with-content").waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const popup = document.querySelector("#runtime-combobox-starts-with-content");
    return popup instanceof HTMLElement && popup.hidden;
  });
  const emptyComboboxAfterEscapeRollback = await page.evaluate(() => {
    const root = document.querySelector("#runtime-combobox-starts-with");
    const input = document.querySelector("#runtime-combobox-starts-with-input");
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
      `Expected Astro Combobox Escape close to restore empty text after uncommitted search, got ${JSON.stringify(
        emptyComboboxAfterEscapeRollback,
      )}.`,
    );
  }

  const comboboxUrlBeforeClosedEnter = page.url();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  if (page.url() !== comboboxUrlBeforeClosedEnter) {
    throw new Error(
      `Expected Astro Combobox demo to prevent accidental Enter submission after selection, URL changed from ${comboboxUrlBeforeClosedEnter} to ${page.url()}.`,
    );
  }
}

async function closeAstroSelectPopups(page) {
  await page.evaluate(async () => {
    const waitFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

    for (let index = 0; index < 3; index += 1) {
      document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
      await waitFrame();
    }
  });
  await page.waitForFunction(() => {
    const selectors = [
      "#runtime-select-aligned-content",
      "#runtime-select-standard-content",
      "#runtime-select-scroll-content",
    ];

    return selectors.every((selector) => {
      const content = document.querySelector(selector);

      return !(content instanceof HTMLElement) || content.hidden;
    });
  });
}
