export async function verifyAstroTabsCases({ page }) {
  const tabsState = await page.evaluate(() => {
    const readTabs = (id) => {
      const root = document.querySelector(`#${id}[data-sw-tabs]`);
      const list = root?.querySelector("[data-sw-tabs-list]");
      const tabs = Array.from(root?.querySelectorAll("[data-sw-tabs-tab]") ?? []);
      const panels = Array.from(root?.querySelectorAll("[data-sw-tabs-panel]") ?? []);
      const readTab = (value) => {
        const tab = root?.querySelector(`[data-sw-tabs-tab][data-value="${value}"]`);

        return {
          ariaSelected: tab?.getAttribute("aria-selected"),
          dataSlot: tab?.getAttribute("data-slot"),
          disabled: tab instanceof HTMLButtonElement ? tab.disabled : undefined,
          hasDisabled: tab?.hasAttribute("data-disabled"),
          state: tab?.getAttribute("data-state"),
          tabIndex: tab instanceof HTMLElement ? tab.tabIndex : undefined,
        };
      };
      const readPanel = (value) => {
        const panel = root?.querySelector(`[data-sw-tabs-panel][data-value="${value}"]`);

        return {
          dataSlot: panel?.getAttribute("data-slot"),
          hidden: panel instanceof HTMLElement ? panel.hidden : undefined,
          state: panel?.getAttribute("data-state"),
          text: panel?.textContent?.trim(),
        };
      };

      return {
        className: root?.getAttribute("class"),
        dataSlot: root?.getAttribute("data-slot"),
        hasDataSw: root?.hasAttribute("data-sw-tabs"),
        listRole: list?.getAttribute("role"),
        listSlot: list?.getAttribute("data-slot"),
        orientation: root?.getAttribute("data-orientation"),
        panelCount: panels.length,
        rootValue: root?.getAttribute("data-value"),
        syncKey: root?.getAttribute("data-sync-key"),
        tabCount: tabs.length,
        tabValues: tabs.map((tab) => tab.getAttribute("data-value")),
        account: readTab("account"),
        security: readTab("security"),
        disabled: readTab("disabled"),
        one: readTab("one"),
        two: readTab("two"),
        overview: readTab("overview"),
        activity: readTab("activity"),
        accountPanel: readPanel("account"),
        securityPanel: readPanel("security"),
        onePanel: readPanel("one"),
        twoPanel: readPanel("two"),
        overviewPanel: readPanel("overview"),
        activityPanel: readPanel("activity"),
      };
    };
    const readOwnedTabs = (id, values) => {
      const root = document.querySelector(`#${id}[data-sw-tabs]`);
      const getOwned = (selector) =>
        Array.from(root?.querySelectorAll(selector) ?? []).filter(
          (element) => element.closest("[data-sw-tabs]") === root,
        );
      const tabs = getOwned("[data-sw-tabs-tab]");
      const panels = getOwned("[data-sw-tabs-panel]");
      const readTab = (value) => {
        const tab = tabs.find((candidate) => candidate.getAttribute("data-value") === value);

        return {
          ariaSelected: tab?.getAttribute("aria-selected"),
          state: tab?.getAttribute("data-state"),
          tabIndex: tab instanceof HTMLElement ? tab.tabIndex : undefined,
        };
      };
      const readPanel = (value) => {
        const panel = panels.find((candidate) => candidate.getAttribute("data-value") === value);

        return {
          hidden: panel instanceof HTMLElement ? panel.hidden : undefined,
          state: panel?.getAttribute("data-state"),
          text: panel?.textContent?.trim(),
        };
      };

      return {
        hasDataSw: root?.hasAttribute("data-sw-tabs"),
        panelCount: panels.length,
        panels: Object.fromEntries(values.map((value) => [value, readPanel(value)])),
        rootValue: root?.getAttribute("data-value"),
        tabCount: tabs.length,
        tabs: Object.fromEntries(values.map((value) => [value, readTab(value)])),
      };
    };

    const defaultRoot = document.querySelector("#runtime-tabs-default");
    const accountTab = defaultRoot?.querySelector('[data-sw-tabs-tab][data-value="account"]');
    const securityTab = defaultRoot?.querySelector('[data-sw-tabs-tab][data-value="security"]');
    const initialDefault = readTabs("runtime-tabs-default");
    accountTab?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
    );
    const afterArrow = {
      activeElementText: document.activeElement?.textContent?.trim(),
      rootValue: defaultRoot?.getAttribute("data-value"),
      securityTabIndex: securityTab instanceof HTMLElement ? securityTab.tabIndex : undefined,
    };
    securityTab?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }),
    );

    const automaticRoot = document.querySelector("#runtime-tabs-automatic");
    const automaticOne = automaticRoot?.querySelector('[data-sw-tabs-tab][data-value="one"]');
    automaticOne?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );
    document
      .querySelector("#runtime-tabs-sync-b-activity")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    document
      .querySelector("#runtime-tabs-nested-parent-two")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const nestedAfterParentTwo = {
      child: readOwnedTabs("runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("runtime-tabs-nested-parent", [
        "parent-one",
        "parent-two",
        "parent-three",
      ]),
    };
    const childA = document.querySelector("#runtime-tabs-nested-child-a");
    childA?.focus();
    childA?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
    );
    const nestedAfterChildArrow = {
      activeElementId:
        document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
      child: readOwnedTabs("runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("runtime-tabs-nested-parent", [
        "parent-one",
        "parent-two",
        "parent-three",
      ]),
    };
    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }),
    );
    const nestedAfterChildKeyboard = {
      activeElementId:
        document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
      child: readOwnedTabs("runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("runtime-tabs-nested-parent", [
        "parent-one",
        "parent-two",
        "parent-three",
      ]),
    };
    document
      .querySelector("#runtime-tabs-nested-child-b")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const nestedAfterChildB = {
      child: readOwnedTabs("runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("runtime-tabs-nested-parent", [
        "parent-one",
        "parent-two",
        "parent-three",
      ]),
    };
    document
      .querySelector("#runtime-tabs-nested-parent-three")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const nestedAfterParentThree = {
      child: readOwnedTabs("runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("runtime-tabs-nested-parent", [
        "parent-one",
        "parent-two",
        "parent-three",
      ]),
    };
    document
      .querySelector("#runtime-tabs-nested-parent-two")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const nestedAfterReturn = {
      child: readOwnedTabs("runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("runtime-tabs-nested-parent", [
        "parent-one",
        "parent-two",
        "parent-three",
      ]),
    };

    return {
      afterAutomaticArrow: readTabs("runtime-tabs-automatic"),
      afterEnter: readTabs("runtime-tabs-default"),
      afterArrow,
      afterSync: {
        a: readTabs("runtime-tabs-sync-a"),
        b: readTabs("runtime-tabs-sync-b"),
      },
      initial: initialDefault,
      nested: {
        afterChildB: nestedAfterChildB,
        afterChildArrow: nestedAfterChildArrow,
        afterChildKeyboard: nestedAfterChildKeyboard,
        afterParentThree: nestedAfterParentThree,
        afterParentTwo: nestedAfterParentTwo,
        afterReturn: nestedAfterReturn,
      },
      rootCount: document.querySelectorAll('[data-slot="tabs"][data-sw-tabs]').length,
    };
  });
  if (
    tabsState.rootCount !== 6 ||
    tabsState.initial.hasDataSw !== true ||
    tabsState.initial.dataSlot !== "tabs" ||
    tabsState.initial.className?.includes("starwind-tabs") === true ||
    tabsState.initial.className?.includes("runtime-tabs-custom") !== true ||
    tabsState.initial.listRole !== "tablist" ||
    tabsState.initial.listSlot !== "tabs-list" ||
    tabsState.initial.orientation !== "horizontal" ||
    tabsState.initial.rootValue !== "account" ||
    tabsState.initial.tabCount !== 3 ||
    tabsState.initial.panelCount !== 3 ||
    tabsState.initial.account.ariaSelected !== "true" ||
    tabsState.initial.account.state !== "active" ||
    tabsState.initial.account.tabIndex !== 0 ||
    tabsState.initial.security.ariaSelected !== "false" ||
    tabsState.initial.accountPanel.hidden !== false ||
    tabsState.initial.securityPanel.hidden !== true ||
    tabsState.initial.disabled.disabled !== true ||
    tabsState.initial.disabled.hasDisabled !== true ||
    tabsState.afterArrow.rootValue !== "account" ||
    tabsState.afterArrow.activeElementText !== "Security" ||
    tabsState.afterArrow.securityTabIndex !== 0 ||
    tabsState.afterEnter.rootValue !== "security" ||
    tabsState.afterEnter.security.ariaSelected !== "true" ||
    tabsState.afterEnter.accountPanel.hidden !== true ||
    tabsState.afterEnter.securityPanel.hidden !== false ||
    tabsState.afterAutomaticArrow.orientation !== "vertical" ||
    tabsState.afterAutomaticArrow.rootValue !== "two" ||
    tabsState.afterAutomaticArrow.two.ariaSelected !== "true" ||
    tabsState.afterAutomaticArrow.onePanel.hidden !== true ||
    tabsState.afterAutomaticArrow.twoPanel.hidden !== false ||
    tabsState.afterSync.a.syncKey !== "runtime-tabs-sync-demo" ||
    tabsState.afterSync.b.syncKey !== "runtime-tabs-sync-demo" ||
    tabsState.afterSync.a.rootValue !== "activity" ||
    tabsState.afterSync.b.rootValue !== "activity" ||
    tabsState.afterSync.a.activity.ariaSelected !== "true" ||
    tabsState.afterSync.b.activity.ariaSelected !== "true" ||
    tabsState.afterSync.a.overviewPanel.hidden !== true ||
    tabsState.afterSync.b.activityPanel.hidden !== false ||
    tabsState.nested.afterParentTwo.parent.rootValue !== "parent-two" ||
    tabsState.nested.afterParentTwo.parent.tabCount !== 3 ||
    tabsState.nested.afterParentTwo.parent.panelCount !== 3 ||
    tabsState.nested.afterParentTwo.parent.tabs["parent-two"]?.ariaSelected !== "true" ||
    tabsState.nested.afterParentTwo.parent.panels["parent-two"]?.hidden !== false ||
    tabsState.nested.afterParentTwo.child.hasDataSw !== true ||
    tabsState.nested.afterParentTwo.child.rootValue !== "child-a" ||
    tabsState.nested.afterParentTwo.child.tabCount !== 2 ||
    tabsState.nested.afterParentTwo.child.panelCount !== 2 ||
    tabsState.nested.afterParentTwo.child.tabs["child-a"]?.ariaSelected !== "true" ||
    tabsState.nested.afterParentTwo.child.panels["child-a"]?.hidden !== false ||
    tabsState.nested.afterChildArrow.activeElementId !== "runtime-tabs-nested-child-b" ||
    tabsState.nested.afterChildArrow.parent.rootValue !== "parent-two" ||
    tabsState.nested.afterChildArrow.child.rootValue !== "child-a" ||
    tabsState.nested.afterChildArrow.child.tabs["child-b"]?.tabIndex !== 0 ||
    tabsState.nested.afterChildKeyboard.activeElementId !== "runtime-tabs-nested-child-b" ||
    tabsState.nested.afterChildKeyboard.parent.rootValue !== "parent-two" ||
    tabsState.nested.afterChildKeyboard.parent.panels["parent-two"]?.hidden !== false ||
    tabsState.nested.afterChildKeyboard.child.rootValue !== "child-b" ||
    tabsState.nested.afterChildKeyboard.child.tabs["child-b"]?.ariaSelected !== "true" ||
    tabsState.nested.afterChildKeyboard.child.panels["child-b"]?.hidden !== false ||
    tabsState.nested.afterChildB.parent.rootValue !== "parent-two" ||
    tabsState.nested.afterChildB.parent.panels["parent-two"]?.hidden !== false ||
    tabsState.nested.afterChildB.child.rootValue !== "child-b" ||
    tabsState.nested.afterChildB.child.tabs["child-b"]?.ariaSelected !== "true" ||
    tabsState.nested.afterChildB.child.panels["child-a"]?.hidden !== true ||
    tabsState.nested.afterChildB.child.panels["child-b"]?.hidden !== false ||
    tabsState.nested.afterParentThree.parent.rootValue !== "parent-three" ||
    tabsState.nested.afterParentThree.parent.panels["parent-two"]?.hidden !== true ||
    tabsState.nested.afterParentThree.parent.panels["parent-three"]?.hidden !== false ||
    tabsState.nested.afterParentThree.child.rootValue !== "child-b" ||
    tabsState.nested.afterReturn.parent.rootValue !== "parent-two" ||
    tabsState.nested.afterReturn.parent.panels["parent-two"]?.hidden !== false ||
    tabsState.nested.afterReturn.child.rootValue !== "child-b" ||
    tabsState.nested.afterReturn.child.panels["child-b"]?.hidden !== false
  ) {
    throw new Error(
      `Expected Astro Tabs default, keyboard, disabled, and automatic behavior, got ${JSON.stringify(
        tabsState,
      )}.`,
    );
  }
}
