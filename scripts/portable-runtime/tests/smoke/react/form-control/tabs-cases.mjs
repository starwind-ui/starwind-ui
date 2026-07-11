import { expectText } from "../../shared/text.mjs";

export async function verifyReactTabsCases({ page }) {
  const initialTabsState = await page.evaluate(() => {
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
        account: readTab("account"),
        security: readTab("security"),
        disabled: readTab("disabled"),
        overview: readTab("overview"),
        activity: readTab("activity"),
        accountPanel: readPanel("account"),
        securityPanel: readPanel("security"),
        overviewPanel: readPanel("overview"),
        activityPanel: readPanel("activity"),
        profile: readTab("profile"),
        billing: readTab("billing"),
        profilePanel: readPanel("profile"),
        billingPanel: readPanel("billing"),
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

    const defaultRoot = document.querySelector("#react-runtime-tabs-default");
    const accountTab = defaultRoot?.querySelector('[data-sw-tabs-tab][data-value="account"]');
    const securityTab = defaultRoot?.querySelector('[data-sw-tabs-tab][data-value="security"]');
    const initialDefault = readTabs("react-runtime-tabs-default");
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
    document
      .querySelector("#react-runtime-tabs-sync-b-activity")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    document
      .querySelector("#react-runtime-tabs-nested-parent-two")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const nestedAfterParentTwo = {
      child: readOwnedTabs("react-runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("react-runtime-tabs-nested-parent", [
        "parent-one",
        "parent-two",
        "parent-three",
      ]),
    };
    const childA = document.querySelector("#react-runtime-tabs-nested-child-a");
    childA?.focus();
    childA?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
    );
    const nestedAfterChildArrow = {
      activeElementId:
        document.activeElement instanceof HTMLElement ? document.activeElement.id : null,
      child: readOwnedTabs("react-runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("react-runtime-tabs-nested-parent", [
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
      child: readOwnedTabs("react-runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("react-runtime-tabs-nested-parent", [
        "parent-one",
        "parent-two",
        "parent-three",
      ]),
    };
    document
      .querySelector("#react-runtime-tabs-nested-child-b")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const nestedAfterChildB = {
      child: readOwnedTabs("react-runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("react-runtime-tabs-nested-parent", [
        "parent-one",
        "parent-two",
        "parent-three",
      ]),
    };
    document
      .querySelector("#react-runtime-tabs-nested-parent-three")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const nestedAfterParentThree = {
      child: readOwnedTabs("react-runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("react-runtime-tabs-nested-parent", [
        "parent-one",
        "parent-two",
        "parent-three",
      ]),
    };
    document
      .querySelector("#react-runtime-tabs-nested-parent-two")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    const nestedAfterReturn = {
      child: readOwnedTabs("react-runtime-tabs-nested-child", ["child-a", "child-b"]),
      parent: readOwnedTabs("react-runtime-tabs-nested-parent", [
        "parent-one",
        "parent-two",
        "parent-three",
      ]),
    };

    return {
      afterEnter: readTabs("react-runtime-tabs-default"),
      afterArrow,
      afterSync: {
        a: readTabs("react-runtime-tabs-sync-a"),
        b: readTabs("react-runtime-tabs-sync-b"),
      },
      controlled: readTabs("react-runtime-tabs-controlled"),
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
    initialTabsState.rootCount !== 7 ||
    initialTabsState.initial.hasDataSw !== true ||
    initialTabsState.initial.dataSlot !== "tabs" ||
    initialTabsState.initial.className?.includes("starwind-tabs") === true ||
    initialTabsState.initial.className?.includes("runtime-tabs-custom") !== true ||
    initialTabsState.initial.listRole !== "tablist" ||
    initialTabsState.initial.listSlot !== "tabs-list" ||
    initialTabsState.initial.rootValue !== "account" ||
    initialTabsState.initial.account.ariaSelected !== "true" ||
    initialTabsState.initial.account.tabIndex !== 0 ||
    initialTabsState.initial.accountPanel.hidden !== false ||
    initialTabsState.initial.securityPanel.hidden !== true ||
    initialTabsState.initial.disabled.disabled !== true ||
    initialTabsState.initial.disabled.hasDisabled !== true ||
    initialTabsState.afterArrow.rootValue !== "account" ||
    initialTabsState.afterArrow.activeElementText !== "Security" ||
    initialTabsState.afterArrow.securityTabIndex !== 0 ||
    initialTabsState.afterEnter.rootValue !== "security" ||
    initialTabsState.afterEnter.security.ariaSelected !== "true" ||
    initialTabsState.afterEnter.accountPanel.hidden !== true ||
    initialTabsState.afterEnter.securityPanel.hidden !== false ||
    initialTabsState.afterSync.a.syncKey !== "react-runtime-tabs-sync-demo" ||
    initialTabsState.afterSync.b.syncKey !== "react-runtime-tabs-sync-demo" ||
    initialTabsState.afterSync.a.rootValue !== "activity" ||
    initialTabsState.afterSync.b.rootValue !== "activity" ||
    initialTabsState.afterSync.a.activity.ariaSelected !== "true" ||
    initialTabsState.afterSync.b.activity.ariaSelected !== "true" ||
    initialTabsState.afterSync.a.overviewPanel.hidden !== true ||
    initialTabsState.afterSync.b.activityPanel.hidden !== false ||
    initialTabsState.controlled.rootValue !== "profile" ||
    initialTabsState.controlled.profile.ariaSelected !== "true" ||
    initialTabsState.controlled.profilePanel.hidden !== false ||
    initialTabsState.controlled.billingPanel.hidden !== true ||
    initialTabsState.nested.afterParentTwo.parent.rootValue !== "parent-two" ||
    initialTabsState.nested.afterParentTwo.parent.tabCount !== 3 ||
    initialTabsState.nested.afterParentTwo.parent.panelCount !== 3 ||
    initialTabsState.nested.afterParentTwo.parent.tabs["parent-two"]?.ariaSelected !== "true" ||
    initialTabsState.nested.afterParentTwo.parent.panels["parent-two"]?.hidden !== false ||
    initialTabsState.nested.afterParentTwo.child.hasDataSw !== true ||
    initialTabsState.nested.afterParentTwo.child.rootValue !== "child-a" ||
    initialTabsState.nested.afterParentTwo.child.tabCount !== 2 ||
    initialTabsState.nested.afterParentTwo.child.panelCount !== 2 ||
    initialTabsState.nested.afterParentTwo.child.tabs["child-a"]?.ariaSelected !== "true" ||
    initialTabsState.nested.afterParentTwo.child.panels["child-a"]?.hidden !== false ||
    initialTabsState.nested.afterChildArrow.activeElementId !==
      "react-runtime-tabs-nested-child-b" ||
    initialTabsState.nested.afterChildArrow.parent.rootValue !== "parent-two" ||
    initialTabsState.nested.afterChildArrow.child.rootValue !== "child-a" ||
    initialTabsState.nested.afterChildArrow.child.tabs["child-b"]?.tabIndex !== 0 ||
    initialTabsState.nested.afterChildKeyboard.activeElementId !==
      "react-runtime-tabs-nested-child-b" ||
    initialTabsState.nested.afterChildKeyboard.parent.rootValue !== "parent-two" ||
    initialTabsState.nested.afterChildKeyboard.parent.panels["parent-two"]?.hidden !== false ||
    initialTabsState.nested.afterChildKeyboard.child.rootValue !== "child-b" ||
    initialTabsState.nested.afterChildKeyboard.child.tabs["child-b"]?.ariaSelected !== "true" ||
    initialTabsState.nested.afterChildKeyboard.child.panels["child-b"]?.hidden !== false ||
    initialTabsState.nested.afterChildB.parent.rootValue !== "parent-two" ||
    initialTabsState.nested.afterChildB.parent.panels["parent-two"]?.hidden !== false ||
    initialTabsState.nested.afterChildB.child.rootValue !== "child-b" ||
    initialTabsState.nested.afterChildB.child.tabs["child-b"]?.ariaSelected !== "true" ||
    initialTabsState.nested.afterChildB.child.panels["child-a"]?.hidden !== true ||
    initialTabsState.nested.afterChildB.child.panels["child-b"]?.hidden !== false ||
    initialTabsState.nested.afterParentThree.parent.rootValue !== "parent-three" ||
    initialTabsState.nested.afterParentThree.parent.panels["parent-two"]?.hidden !== true ||
    initialTabsState.nested.afterParentThree.parent.panels["parent-three"]?.hidden !== false ||
    initialTabsState.nested.afterParentThree.child.rootValue !== "child-b" ||
    initialTabsState.nested.afterReturn.parent.rootValue !== "parent-two" ||
    initialTabsState.nested.afterReturn.parent.panels["parent-two"]?.hidden !== false ||
    initialTabsState.nested.afterReturn.child.rootValue !== "child-b" ||
    initialTabsState.nested.afterReturn.child.panels["child-b"]?.hidden !== false
  ) {
    throw new Error(
      `Expected React Tabs default, keyboard, disabled, and controlled initial behavior, got ${JSON.stringify(
        initialTabsState,
      )}.`,
    );
  }

  await expectText(page.locator("[data-runtime-tabs-value]"), "Tabs value: profile");
  await expectText(page.locator("[data-runtime-tabs-count]"), "Tabs changes: 0");
  await page.getByRole("button", { name: "Parent sets controlled tabs" }).click();
  await expectText(page.locator("[data-runtime-tabs-value]"), "Tabs value: billing");
  await expectText(page.locator("[data-runtime-tabs-count]"), "Tabs changes: 0");
  await page.getByRole("tab", { name: "Controlled profile" }).click();
  await expectText(page.locator("[data-runtime-tabs-value]"), "Tabs value: profile");
  await expectText(page.locator("[data-runtime-tabs-count]"), "Tabs changes: 1");
  const controlledTabsState = await page.evaluate(() => {
    const eventRoot = document.querySelector("#react-runtime-tabs-controlled-events");
    const profileTab = eventRoot?.querySelector('[data-sw-tabs-tab][data-value="profile"]');
    const billingPanel = eventRoot?.querySelector('[data-sw-tabs-panel][data-value="billing"]');
    const profilePanel = eventRoot?.querySelector('[data-sw-tabs-panel][data-value="profile"]');

    return {
      billingPanelHidden: billingPanel instanceof HTMLElement ? billingPanel.hidden : undefined,
      profilePanelHidden: profilePanel instanceof HTMLElement ? profilePanel.hidden : undefined,
      profileSelected: profileTab?.getAttribute("aria-selected"),
      rootValue: eventRoot?.getAttribute("data-value"),
    };
  });
  if (
    controlledTabsState.rootValue !== "profile" ||
    controlledTabsState.profileSelected !== "true" ||
    controlledTabsState.profilePanelHidden !== false ||
    controlledTabsState.billingPanelHidden !== true
  ) {
    throw new Error(
      `Expected React controlled Tabs to sync through onValueChange, got ${JSON.stringify(
        controlledTabsState,
      )}.`,
    );
  }

  await page.getByRole("button", { name: "Parent clears controlled tabs" }).click();
  await expectText(page.locator("[data-runtime-tabs-value]"), "Tabs value: none");
  await expectText(page.locator("[data-runtime-tabs-count]"), "Tabs changes: 1");
  const emptyControlledTabsState = await page.evaluate(() => {
    const readRoot = (id) => {
      const root = document.querySelector(`#${id}`);
      const profileTab = root?.querySelector('[data-sw-tabs-tab][data-value="profile"]');
      const billingTab = root?.querySelector('[data-sw-tabs-tab][data-value="billing"]');
      const profilePanel = root?.querySelector('[data-sw-tabs-panel][data-value="profile"]');
      const billingPanel = root?.querySelector('[data-sw-tabs-panel][data-value="billing"]');

      return {
        billingPanelHidden: billingPanel instanceof HTMLElement ? billingPanel.hidden : undefined,
        billingSelected: billingTab?.getAttribute("aria-selected"),
        profilePanelHidden: profilePanel instanceof HTMLElement ? profilePanel.hidden : undefined,
        profileSelected: profileTab?.getAttribute("aria-selected"),
        rootValue: root?.getAttribute("data-value"),
      };
    };

    return {
      controlled: readRoot("react-runtime-tabs-controlled"),
      events: readRoot("react-runtime-tabs-controlled-events"),
    };
  });
  if (
    emptyControlledTabsState.controlled.rootValue !== "null" ||
    emptyControlledTabsState.controlled.profileSelected !== "false" ||
    emptyControlledTabsState.controlled.billingSelected !== "false" ||
    emptyControlledTabsState.controlled.profilePanelHidden !== true ||
    emptyControlledTabsState.controlled.billingPanelHidden !== true ||
    emptyControlledTabsState.events.rootValue !== "null" ||
    emptyControlledTabsState.events.profileSelected !== "false" ||
    emptyControlledTabsState.events.billingSelected !== "false" ||
    emptyControlledTabsState.events.profilePanelHidden !== true ||
    emptyControlledTabsState.events.billingPanelHidden !== true
  ) {
    throw new Error(
      `Expected React controlled Tabs value={null} to clear active tabs, got ${JSON.stringify(
        emptyControlledTabsState,
      )}.`,
    );
  }
}
