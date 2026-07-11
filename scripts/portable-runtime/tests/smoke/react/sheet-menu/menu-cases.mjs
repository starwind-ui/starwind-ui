import { expectText } from "../../shared/text.mjs";

export async function verifyReactMenuCases({ page }) {
  await page.locator("#react-runtime-dropdown-trigger").focus();
  await page.keyboard.press("Enter");
  await page.locator("#react-runtime-dropdown-content").waitFor({ state: "visible" });
  const keyboardDropdownFocusState = await page.evaluate(() => ({
    activeId: document.activeElement?.id,
    activeTabIndex: document.activeElement?.getAttribute("tabindex"),
  }));
  if (
    keyboardDropdownFocusState.activeId !== "react-runtime-dropdown-account" ||
    keyboardDropdownFocusState.activeTabIndex !== "0"
  ) {
    throw new Error(
      `Expected React Dropdown Enter open to focus the first item, got ${JSON.stringify(
        keyboardDropdownFocusState,
      )}.`,
    );
  }
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-dropdown-content");
    const root = document.querySelector("#react-runtime-dropdown-default");

    return content instanceof HTMLElement && root instanceof HTMLElement && content.hidden;
  });
  const dropdownFocusAfterEscape = await page.evaluate(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
  );
  if (dropdownFocusAfterEscape !== "react-runtime-dropdown-trigger") {
    throw new Error(
      `Expected React Dropdown Escape close to return focus to trigger, got ${JSON.stringify(
        dropdownFocusAfterEscape,
      )}.`,
    );
  }

  await page.getByRole("button", { name: "Open React menu" }).click();
  await page.locator("#react-runtime-dropdown-content").waitFor({ state: "visible" });
  const openDropdownState = await page
    .locator("#react-runtime-dropdown-content")
    .evaluate((content) => ({
      className: content.getAttribute("class"),
      dataAlign: content.getAttribute("data-align"),
      dataSide: content.getAttribute("data-side"),
      dataSlot: content.getAttribute("data-slot"),
      hidden: content instanceof HTMLElement ? content.hidden : null,
      parentTagName: content.parentElement?.tagName,
      position: content instanceof HTMLElement ? getComputedStyle(content).position : null,
      role: content.getAttribute("role"),
      rootContains:
        document.querySelector("#react-runtime-dropdown-default")?.contains(content) ?? null,
      state: content.getAttribute("data-state"),
      styleLeft: content instanceof HTMLElement ? content.style.left : null,
      styleTop: content instanceof HTMLElement ? content.style.top : null,
    }));
  if (
    openDropdownState.hidden !== false ||
    openDropdownState.role !== "menu" ||
    openDropdownState.state !== "open" ||
    !["bottom", "top"].includes(openDropdownState.dataSide ?? "") ||
    openDropdownState.dataAlign !== "start" ||
    openDropdownState.parentTagName !== "BODY" ||
    openDropdownState.rootContains !== false ||
    openDropdownState.position !== "fixed" ||
    openDropdownState.styleLeft === "" ||
    openDropdownState.styleTop === "" ||
    openDropdownState.dataSlot !== "dropdown-content" ||
    openDropdownState.className?.includes("runtime-dropdown-custom") !== true
  ) {
    throw new Error(
      `Expected React Dropdown to open as a portaled positioned menu, got ${JSON.stringify(
        openDropdownState,
      )}.`,
    );
  }

  await page.locator("#react-runtime-dropdown-checkbox").click();
  const toggledDropdownCheckboxState = await page
    .locator("#react-runtime-dropdown-checkbox")
    .evaluate((item) => ({
      ariaChecked: item.getAttribute("aria-checked"),
      hasChecked: item.hasAttribute("data-checked"),
      hasUnchecked: item.hasAttribute("data-unchecked"),
      indicatorHidden: item
        .querySelector('[data-slot="dropdown-checkbox-item-indicator"]')
        ?.hasAttribute("data-hidden"),
      indicatorId: item.querySelector('[data-slot="dropdown-checkbox-item-indicator"]')?.id,
      indicatorState: item
        .querySelector('[data-slot="dropdown-checkbox-item-indicator"]')
        ?.getAttribute("data-state"),
      indicatorText: item
        .querySelector('[data-slot="dropdown-checkbox-item-indicator"]')
        ?.textContent?.trim(),
      indicatorVisible: item
        .querySelector('[data-slot="dropdown-checkbox-item-indicator"]')
        ?.hasAttribute("data-visible"),
      menuHidden:
        document.querySelector("#react-runtime-dropdown-content") instanceof HTMLElement
          ? document.querySelector("#react-runtime-dropdown-content").hidden
          : null,
    }));
  if (
    toggledDropdownCheckboxState.ariaChecked !== "false" ||
    toggledDropdownCheckboxState.hasChecked !== false ||
    toggledDropdownCheckboxState.hasUnchecked !== true ||
    toggledDropdownCheckboxState.indicatorHidden !== true ||
    toggledDropdownCheckboxState.indicatorId !==
      "react-runtime-dropdown-checkbox-exported-indicator" ||
    toggledDropdownCheckboxState.indicatorState !== "unchecked" ||
    toggledDropdownCheckboxState.indicatorText !== "on" ||
    toggledDropdownCheckboxState.indicatorVisible !== false ||
    toggledDropdownCheckboxState.menuHidden !== false
  ) {
    throw new Error(
      `Expected React Dropdown checkbox item to toggle without closing, got ${JSON.stringify(
        toggledDropdownCheckboxState,
      )}.`,
    );
  }

  await page.locator("#react-runtime-dropdown-radio-spacious").click();
  const selectedDropdownRadioState = await page
    .locator("#react-runtime-dropdown-radio-group")
    .evaluate((group) => {
      const readItem = (selector) => {
        const item = document.querySelector(selector);
        const indicator = item?.querySelector('[data-slot="dropdown-radio-item-indicator"]');

        return {
          ariaChecked: item?.getAttribute("aria-checked"),
          hasChecked: item?.hasAttribute("data-checked"),
          hasUnchecked: item?.hasAttribute("data-unchecked"),
          indicatorHidden: indicator?.hasAttribute("data-hidden"),
          indicatorId: indicator?.id,
          indicatorState: indicator?.getAttribute("data-state"),
          indicatorVisible: indicator?.hasAttribute("data-visible"),
          role: item?.getAttribute("role"),
        };
      };

      return {
        compact: readItem("#react-runtime-dropdown-radio-compact"),
        menuHidden:
          document.querySelector("#react-runtime-dropdown-content") instanceof HTMLElement
            ? document.querySelector("#react-runtime-dropdown-content").hidden
            : null,
        role: group.getAttribute("role"),
        spacious: readItem("#react-runtime-dropdown-radio-spacious"),
        value: group.getAttribute("data-value"),
      };
    });
  if (
    selectedDropdownRadioState.role !== "group" ||
    selectedDropdownRadioState.value !== "spacious" ||
    selectedDropdownRadioState.compact.ariaChecked !== "false" ||
    selectedDropdownRadioState.compact.hasUnchecked !== true ||
    selectedDropdownRadioState.compact.indicatorHidden !== true ||
    selectedDropdownRadioState.compact.indicatorId !==
      "react-runtime-dropdown-radio-compact-exported-indicator" ||
    selectedDropdownRadioState.spacious.ariaChecked !== "true" ||
    selectedDropdownRadioState.spacious.hasChecked !== true ||
    selectedDropdownRadioState.spacious.indicatorState !== "checked" ||
    selectedDropdownRadioState.spacious.indicatorVisible !== true ||
    selectedDropdownRadioState.spacious.role !== "menuitemradio" ||
    selectedDropdownRadioState.menuHidden !== false
  ) {
    throw new Error(
      `Expected React Dropdown radio item to select without closing, got ${JSON.stringify(
        selectedDropdownRadioState,
      )}.`,
    );
  }

  await page.locator("#react-runtime-checkbox-controlled").evaluate((checkbox) => {
    if (checkbox instanceof HTMLElement) {
      checkbox.click();
    }
  });
  const dropdownRadioAfterParentRerender = await page
    .locator("#react-runtime-dropdown-radio-group")
    .evaluate((group) => ({
      compactChecked: document
        .querySelector("#react-runtime-dropdown-radio-compact")
        ?.getAttribute("aria-checked"),
      compactIndicatorState: document
        .querySelector("#react-runtime-dropdown-radio-compact-exported-indicator")
        ?.getAttribute("data-state"),
      spaciousChecked: document
        .querySelector("#react-runtime-dropdown-radio-spacious")
        ?.getAttribute("aria-checked"),
      value: group.getAttribute("data-value"),
    }));
  if (
    dropdownRadioAfterParentRerender.value !== "spacious" ||
    dropdownRadioAfterParentRerender.compactChecked !== "false" ||
    dropdownRadioAfterParentRerender.compactIndicatorState !== "unchecked" ||
    dropdownRadioAfterParentRerender.spaciousChecked !== "true"
  ) {
    throw new Error(
      `Expected uncontrolled React Dropdown radio value to survive a parent rerender, got ${JSON.stringify(
        dropdownRadioAfterParentRerender,
      )}.`,
    );
  }

  await page.locator("#react-runtime-dropdown-sub-trigger").evaluate((trigger) => {
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
  });
  await page.locator("#react-runtime-dropdown-sub-content").waitFor({ state: "visible" });
  const openDropdownSubmenuState = await page
    .locator("#react-runtime-dropdown-sub-content")
    .evaluate((content) => ({
      hidden: content instanceof HTMLElement ? content.hidden : null,
      parentTagName: content.parentElement?.tagName,
      position: content instanceof HTMLElement ? getComputedStyle(content).position : null,
      state: content.getAttribute("data-state"),
      triggerExpanded: document
        .querySelector("#react-runtime-dropdown-sub-trigger")
        ?.getAttribute("aria-expanded"),
    }));
  if (
    openDropdownSubmenuState.hidden !== false ||
    openDropdownSubmenuState.parentTagName !== "BODY" ||
    openDropdownSubmenuState.position !== "fixed" ||
    openDropdownSubmenuState.state !== "open" ||
    openDropdownSubmenuState.triggerExpanded !== "true"
  ) {
    throw new Error(
      `Expected React Dropdown submenu to open from ArrowRight, got ${JSON.stringify(
        openDropdownSubmenuState,
      )}.`,
    );
  }

  await page.mouse.click(20, 96);
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-dropdown-content");
    const submenu = document.querySelector("#react-runtime-dropdown-sub-content");
    const root = document.querySelector("#react-runtime-dropdown-default");

    return (
      content instanceof HTMLElement &&
      submenu instanceof HTMLElement &&
      root instanceof HTMLElement &&
      content.hidden &&
      submenu.hidden &&
      root.contains(content) &&
      root.contains(submenu)
    );
  });

  await expectText(page.locator("#react-dropdown-count"), "0");
  await page.getByRole("button", { name: "Open controlled menu" }).click();
  await page.locator("#react-runtime-dropdown-controlled-content").waitFor({ state: "visible" });
  await expectText(page.locator("#react-dropdown-count"), "1");
  const controlledDropdownState = await page
    .locator("#react-runtime-dropdown-controlled-content")
    .evaluate((content) => ({
      hidden: content instanceof HTMLElement ? content.hidden : null,
      state: content.getAttribute("data-state"),
    }));
  if (controlledDropdownState.hidden !== false || controlledDropdownState.state !== "open") {
    throw new Error(
      `Expected controlled React Dropdown to open from controlled state, got ${JSON.stringify(
        controlledDropdownState,
      )}.`,
    );
  }
  await page.mouse.click(20, 96);
  await expectText(page.locator("#react-dropdown-count"), "2");
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-dropdown-controlled-content");
    const root = document.querySelector("#react-runtime-dropdown-controlled");

    return (
      content instanceof HTMLElement &&
      root instanceof HTMLElement &&
      content.hidden &&
      root.contains(content)
    );
  });

  const dropdownAsChildInitial = await page
    .locator("#react-runtime-dropdown-as-child-trigger")
    .evaluate((trigger) => ({
      className: trigger.getAttribute("class"),
      controls: trigger.getAttribute("aria-controls"),
      expanded: trigger.getAttribute("aria-expanded"),
      hasDataSlot: trigger.getAttribute("data-slot") === "dropdown-trigger",
      hasTriggerAttribute: trigger.hasAttribute("data-sw-menu-trigger"),
      tagName: trigger.tagName,
    }));
  await page.getByRole("button", { name: "As child menu" }).click();
  await page.locator("#react-runtime-dropdown-as-child-content").waitFor({ state: "visible" });
  const dropdownAsChildOpen = await page.evaluate(() => {
    const trigger = document.querySelector("#react-runtime-dropdown-as-child-trigger");
    const content = document.querySelector("#react-runtime-dropdown-as-child-content");

    return {
      contentHidden: content instanceof HTMLElement ? content.hidden : null,
      contentRole: content?.getAttribute("role"),
      contentState: content?.getAttribute("data-state"),
      expanded: trigger?.getAttribute("aria-expanded"),
      parentTagName: content?.parentElement?.tagName,
    };
  });
  if (
    dropdownAsChildInitial.tagName !== "BUTTON" ||
    dropdownAsChildInitial.hasTriggerAttribute !== true ||
    dropdownAsChildInitial.hasDataSlot !== true ||
    dropdownAsChildInitial.expanded !== "false" ||
    !dropdownAsChildInitial.controls ||
    dropdownAsChildOpen.expanded !== "true" ||
    dropdownAsChildOpen.contentHidden !== false ||
    dropdownAsChildOpen.contentRole !== "menu" ||
    dropdownAsChildOpen.contentState !== "open" ||
    dropdownAsChildOpen.parentTagName !== "BODY"
  ) {
    throw new Error(
      `Expected React Dropdown asChild trigger to clone attributes and open, got ${JSON.stringify({
        dropdownAsChildInitial,
        dropdownAsChildOpen,
      })}.`,
    );
  }
  await page.mouse.click(20, 96);
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-dropdown-as-child-content");
    const root = document.querySelector("#react-runtime-dropdown-as-child");

    return content instanceof HTMLElement && root instanceof HTMLElement && content.hidden;
  });

  await page.locator("#react-runtime-context-menu-trigger").click();
  const closedContextMenuAfterClick = await page
    .locator("#react-runtime-context-menu-content")
    .evaluate((content) => (content instanceof HTMLElement ? content.hidden : null));
  if (closedContextMenuAfterClick !== true) {
    throw new Error("Expected React ContextMenu to ignore normal left click on its trigger.");
  }

  await page.locator("#react-runtime-context-menu-trigger").focus();
  await page.keyboard.press("Shift+F10");
  await page.locator("#react-runtime-context-menu-content").waitFor({ state: "visible" });
  const keyboardContextMenuFocusState = await page.evaluate(() => ({
    activeId: document.activeElement?.id,
    activeTabIndex: document.activeElement?.getAttribute("tabindex"),
  }));
  if (
    keyboardContextMenuFocusState.activeId !== "react-runtime-context-menu-rename" ||
    keyboardContextMenuFocusState.activeTabIndex !== "0"
  ) {
    throw new Error(
      `Expected React ContextMenu keyboard open to focus the first item, got ${JSON.stringify(
        keyboardContextMenuFocusState,
      )}.`,
    );
  }
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-context-menu-content");
    const root = document.querySelector("#react-runtime-context-menu-default");

    return content instanceof HTMLElement && root instanceof HTMLElement && content.hidden;
  });

  await page.locator("#react-runtime-context-menu-trigger").click({
    button: "right",
    position: { x: 140, y: 60 },
  });
  await page.locator("#react-runtime-context-menu-content").waitFor({ state: "visible" });
  const openContextMenuState = await page
    .locator("#react-runtime-context-menu-content")
    .evaluate((content) => ({
      className: content.getAttribute("class"),
      dataAlign: content.getAttribute("data-align"),
      dataSide: content.getAttribute("data-side"),
      dataSlot: content.getAttribute("data-slot"),
      hidden: content instanceof HTMLElement ? content.hidden : null,
      parentTagName: content.parentElement?.tagName,
      position: content instanceof HTMLElement ? getComputedStyle(content).position : null,
      role: content.getAttribute("role"),
      rootContains:
        document.querySelector("#react-runtime-context-menu-default")?.contains(content) ?? null,
      state: content.getAttribute("data-state"),
      styleLeft: content instanceof HTMLElement ? content.style.left : null,
      styleTop: content instanceof HTMLElement ? content.style.top : null,
      triggerExpanded: document
        .querySelector("#react-runtime-context-menu-trigger")
        ?.getAttribute("aria-expanded"),
    }));
  if (
    openContextMenuState.hidden !== false ||
    openContextMenuState.role !== "menu" ||
    openContextMenuState.state !== "open" ||
    !["bottom", "top"].includes(openContextMenuState.dataSide ?? "") ||
    openContextMenuState.dataAlign !== "start" ||
    openContextMenuState.parentTagName !== "BODY" ||
    openContextMenuState.rootContains !== false ||
    openContextMenuState.position !== "fixed" ||
    openContextMenuState.styleLeft === "" ||
    openContextMenuState.styleTop === "" ||
    openContextMenuState.triggerExpanded !== "true" ||
    openContextMenuState.dataSlot !== "context-menu-content" ||
    openContextMenuState.className?.includes("runtime-context-menu-custom") !== true
  ) {
    throw new Error(
      `Expected React ContextMenu to open as a right-click anchored portaled menu, got ${JSON.stringify(
        openContextMenuState,
      )}.`,
    );
  }

  await page.locator("#react-runtime-context-menu-checkbox").click();
  const toggledContextCheckboxState = await page
    .locator("#react-runtime-context-menu-checkbox")
    .evaluate((item) => ({
      ariaChecked: item.getAttribute("aria-checked"),
      hasChecked: item.hasAttribute("data-checked"),
      hasUnchecked: item.hasAttribute("data-unchecked"),
      indicatorHidden: item
        .querySelector('[data-slot="context-menu-checkbox-item-indicator"]')
        ?.hasAttribute("data-hidden"),
      indicatorId: item.querySelector('[data-slot="context-menu-checkbox-item-indicator"]')?.id,
      indicatorState: item
        .querySelector('[data-slot="context-menu-checkbox-item-indicator"]')
        ?.getAttribute("data-state"),
      indicatorText: item
        .querySelector('[data-slot="context-menu-checkbox-item-indicator"]')
        ?.textContent?.trim(),
      indicatorVisible: item
        .querySelector('[data-slot="context-menu-checkbox-item-indicator"]')
        ?.hasAttribute("data-visible"),
      menuHidden:
        document.querySelector("#react-runtime-context-menu-content") instanceof HTMLElement
          ? document.querySelector("#react-runtime-context-menu-content").hidden
          : null,
    }));
  if (
    toggledContextCheckboxState.ariaChecked !== "false" ||
    toggledContextCheckboxState.hasChecked !== false ||
    toggledContextCheckboxState.hasUnchecked !== true ||
    toggledContextCheckboxState.indicatorHidden !== true ||
    toggledContextCheckboxState.indicatorId !==
      "react-runtime-context-menu-checkbox-exported-indicator" ||
    toggledContextCheckboxState.indicatorState !== "unchecked" ||
    toggledContextCheckboxState.indicatorText !== "on" ||
    toggledContextCheckboxState.indicatorVisible !== false ||
    toggledContextCheckboxState.menuHidden !== false
  ) {
    throw new Error(
      `Expected React ContextMenu checkbox item to toggle without closing, got ${JSON.stringify(
        toggledContextCheckboxState,
      )}.`,
    );
  }

  await page.locator("#react-runtime-context-menu-radio-freeform").click();
  const selectedContextRadioState = await page
    .locator("#react-runtime-context-menu-radio-group")
    .evaluate((group) => {
      const readItem = (selector) => {
        const item = document.querySelector(selector);
        const indicator = item?.querySelector('[data-slot="context-menu-radio-item-indicator"]');

        return {
          ariaChecked: item?.getAttribute("aria-checked"),
          hasChecked: item?.hasAttribute("data-checked"),
          hasUnchecked: item?.hasAttribute("data-unchecked"),
          indicatorHidden: indicator?.hasAttribute("data-hidden"),
          indicatorId: indicator?.id,
          indicatorState: indicator?.getAttribute("data-state"),
          indicatorVisible: indicator?.hasAttribute("data-visible"),
          role: item?.getAttribute("role"),
        };
      };

      return {
        freeform: readItem("#react-runtime-context-menu-radio-freeform"),
        grid: readItem("#react-runtime-context-menu-radio-grid"),
        menuHidden:
          document.querySelector("#react-runtime-context-menu-content") instanceof HTMLElement
            ? document.querySelector("#react-runtime-context-menu-content").hidden
            : null,
        role: group.getAttribute("role"),
        value: group.getAttribute("data-value"),
      };
    });
  if (
    selectedContextRadioState.role !== "group" ||
    selectedContextRadioState.value !== "freeform" ||
    selectedContextRadioState.grid.ariaChecked !== "false" ||
    selectedContextRadioState.grid.hasUnchecked !== true ||
    selectedContextRadioState.grid.indicatorHidden !== true ||
    selectedContextRadioState.grid.indicatorId !==
      "react-runtime-context-menu-radio-grid-exported-indicator" ||
    selectedContextRadioState.freeform.ariaChecked !== "true" ||
    selectedContextRadioState.freeform.hasChecked !== true ||
    selectedContextRadioState.freeform.indicatorState !== "checked" ||
    selectedContextRadioState.freeform.indicatorVisible !== true ||
    selectedContextRadioState.freeform.role !== "menuitemradio" ||
    selectedContextRadioState.menuHidden !== false
  ) {
    throw new Error(
      `Expected React ContextMenu radio item to select without closing, got ${JSON.stringify(
        selectedContextRadioState,
      )}.`,
    );
  }

  await page.locator("#react-runtime-context-menu-sub-trigger").evaluate((trigger) => {
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
  });
  await page.locator("#react-runtime-context-menu-sub-content").waitFor({ state: "visible" });
  const openContextSubmenuState = await page
    .locator("#react-runtime-context-menu-sub-content")
    .evaluate((content) => ({
      hidden: content instanceof HTMLElement ? content.hidden : null,
      parentTagName: content.parentElement?.tagName,
      position: content instanceof HTMLElement ? getComputedStyle(content).position : null,
      state: content.getAttribute("data-state"),
      triggerExpanded: document
        .querySelector("#react-runtime-context-menu-sub-trigger")
        ?.getAttribute("aria-expanded"),
    }));
  if (
    openContextSubmenuState.hidden !== false ||
    openContextSubmenuState.parentTagName !== "BODY" ||
    openContextSubmenuState.position !== "fixed" ||
    openContextSubmenuState.state !== "open" ||
    openContextSubmenuState.triggerExpanded !== "true"
  ) {
    throw new Error(
      `Expected React ContextMenu submenu to open from ArrowRight, got ${JSON.stringify(
        openContextSubmenuState,
      )}.`,
    );
  }

  await page.mouse.click(20, 96);
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-context-menu-content");
    const submenu = document.querySelector("#react-runtime-context-menu-sub-content");
    const root = document.querySelector("#react-runtime-context-menu-default");

    return (
      content instanceof HTMLElement &&
      submenu instanceof HTMLElement &&
      root instanceof HTMLElement &&
      content.hidden &&
      submenu.hidden &&
      root.contains(content) &&
      root.contains(submenu)
    );
  });

  await expectText(page.locator("#react-context-menu-count"), "0");
  await page.locator("#react-runtime-context-menu-controlled-trigger").click({
    button: "right",
    position: { x: 80, y: 20 },
  });
  await page
    .locator("#react-runtime-context-menu-controlled-content")
    .waitFor({ state: "visible" });
  await expectText(page.locator("#react-context-menu-count"), "1");
  const controlledContextMenuState = await page
    .locator("#react-runtime-context-menu-controlled-content")
    .evaluate((content) => ({
      hidden: content instanceof HTMLElement ? content.hidden : null,
      state: content.getAttribute("data-state"),
    }));
  if (controlledContextMenuState.hidden !== false || controlledContextMenuState.state !== "open") {
    throw new Error(
      `Expected controlled React ContextMenu to open from controlled state, got ${JSON.stringify(
        controlledContextMenuState,
      )}.`,
    );
  }
  await page.mouse.click(20, 96);
  await expectText(page.locator("#react-context-menu-count"), "2");
  await page.waitForFunction(() => {
    const content = document.querySelector("#react-runtime-context-menu-controlled-content");
    const root = document.querySelector("#react-runtime-context-menu-controlled");

    return (
      content instanceof HTMLElement &&
      root instanceof HTMLElement &&
      content.hidden &&
      root.contains(content)
    );
  });
}
