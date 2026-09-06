import { beforeEach, describe, expect, it, vi } from "vitest";

import { initStarwind } from "../../../src/init-starwind";
import { createTabs, type TabsValueChangeDetails } from "../../../src/components/tabs/tabs";

describe("createTabs", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("initializes default state and activates a tab from a click", () => {
    const root = renderTabs({ defaultValue: "account", withIndicator: true });
    const onValueChange = vi.fn();
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);

    const tabs = createTabs(root, { onValueChange });

    expect(tabs.getValue()).toBe("account");
    expect(root.getAttribute("data-value")).toBe("account");
    expect(root.getAttribute("data-orientation")).toBe("horizontal");
    expect(getList(root).getAttribute("role")).toBe("tablist");
    expect(getTab(root, "account").getAttribute("aria-selected")).toBe("true");
    expect(getTab(root, "account").getAttribute("data-state")).toBe("active");
    expect(getPanel(root, "account").hidden).toBe(false);
    expect(getPanel(root, "account").getAttribute("data-state")).toBe("active");
    expect(getPanel(root, "password").hidden).toBe(true);

    getTab(root, "password").click();

    expect(tabs.getValue()).toBe("password");
    expect(root.getAttribute("data-value")).toBe("password");
    expect(getTab(root, "account").getAttribute("aria-selected")).toBe("false");
    expect(getTab(root, "password").getAttribute("aria-selected")).toBe("true");
    expect(getPanel(root, "account").hidden).toBe(true);
    expect(getPanel(root, "password").hidden).toBe(false);
    expect(root.getAttribute("data-activation-direction")).toBe("right");
    expect(getList(root).getAttribute("data-activation-direction")).toBe("right");
    expect(getTab(root, "account").getAttribute("data-activation-direction")).toBe("right");
    expect(getTab(root, "password").getAttribute("data-activation-direction")).toBe("right");
    expect(getPanel(root, "account").getAttribute("data-activation-direction")).toBe("right");
    expect(getPanel(root, "password").getAttribute("data-activation-direction")).toBe("right");
    expect(getIndicator(root).getAttribute("data-activation-direction")).toBe("right");
    expect(onValueChange).toHaveBeenCalledWith(
      "password",
      expect.objectContaining({
        activationDirection: "right",
        previousValue: "account",
        reason: "none",
        trigger: getTab(root, "password"),
        value: "password",
      }),
    );
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          activationDirection: "right",
          previousValue: "account",
          value: "password",
        }),
      }),
    );
  });

  it("treats an explicit empty tab value as a real value and syncs it", () => {
    localStorage.setItem("starwind-tabs-settings", "");
    const firstRoot = renderTabs({ defaultValue: "account", syncKey: "settings" });
    const secondRoot = renderTabs({ defaultValue: "account", syncKey: "settings" });
    prependTabsPart(firstRoot, "Empty");
    prependTabsPart(secondRoot, "Empty");

    const firstTabs = createTabs(firstRoot);
    const secondTabs = createTabs(secondRoot);

    expect(firstTabs.getValue()).toBe("");
    expect(secondTabs.getValue()).toBe("");
    expect(firstRoot.getAttribute("data-value")).toBe("");
    expect(getTab(firstRoot, "").getAttribute("aria-selected")).toBe("true");
    expect(getPanel(firstRoot, "").hidden).toBe(false);

    getTab(firstRoot, "password").click();

    expect(firstTabs.getValue()).toBe("password");
    expect(secondTabs.getValue()).toBe("password");
    expect(localStorage.getItem("starwind-tabs-settings")).toBe("password");

    getTab(firstRoot, "").click();

    expect(firstTabs.getValue()).toBe("");
    expect(secondTabs.getValue()).toBe("");
    expect(localStorage.getItem("starwind-tabs-settings")).toBe("");
    expect(getPanel(secondRoot, "").hidden).toBe(false);
  });

  it('reserves literal "null" as the nullable tabs value marker', () => {
    const root = renderTabs({ defaultValue: "null" });
    prependTabsPart(root, "Reserved", "null");

    const tabs = createTabs(root);

    expect(tabs.getValue()).toBe("0");
    expect(root.getAttribute("data-value")).toBe("0");
    expect(getTab(root, "0").textContent).toBe("Reserved");
    expect(getPanel(root, "0").hidden).toBe(false);
    expect(root.querySelector('[data-sw-tabs-tab][data-value="null"]')).toBeNull();
  });

  it("moves focus manually with arrow keys and activates with Enter", () => {
    const root = renderTabs({ defaultValue: "account" });
    const account = getTab(root, "account");
    const password = getTab(root, "password");

    const tabs = createTabs(root);

    expect(account.tabIndex).toBe(0);
    expect(password.tabIndex).toBe(-1);

    account.focus();
    account.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(document.activeElement).toBe(password);
    expect(password.tabIndex).toBe(0);
    expect(tabs.getValue()).toBe("account");

    password.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(tabs.getValue()).toBe("password");
    expect(getPanel(root, "password").hidden).toBe(false);
  });

  it("does not wrap focus when loop focus is disabled", () => {
    const root = renderTabs({
      defaultValue: "account",
      listAttributes: 'data-loop-focus="false"',
    });
    const account = getTab(root, "account");
    const password = getTab(root, "password");

    createTabs(root);

    account.focus();
    account.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));

    expect(document.activeElement).toBe(account);
    expect(account.tabIndex).toBe(0);

    password.focus();
    password.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(document.activeElement).toBe(password);
    expect(password.tabIndex).toBe(0);
  });

  it("can activate tabs automatically when focus moves", () => {
    const root = renderTabs({
      defaultValue: "account",
      listAttributes: "data-activate-on-focus",
    });
    const account = getTab(root, "account");
    const password = getTab(root, "password");

    const tabs = createTabs(root);

    account.focus();
    account.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(document.activeElement).toBe(password);
    expect(tabs.getValue()).toBe("password");
    expect(getPanel(root, "password").hidden).toBe(false);
  });

  it("skips disabled tabs and falls back to the first enabled tab", () => {
    const root = renderTabs({ defaultValue: "disabled" });
    const account = getTab(root, "account");
    const disabled = getTab(root, "disabled");
    const password = getTab(root, "password");

    const tabs = createTabs(root);

    expect(tabs.getValue()).toBe("account");
    expect(disabled.getAttribute("aria-selected")).toBe("false");
    expect(disabled.hasAttribute("data-disabled")).toBe(true);

    account.focus();
    account.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));

    expect(document.activeElement).toBe(password);

    disabled.click();

    expect(tabs.getValue()).toBe("account");
    expect(getPanel(root, "account").hidden).toBe(false);
  });

  it("emits a non-cancelable initial fallback when uncontrolled value is missing", () => {
    const root = renderTabs({ defaultValue: undefined });
    const onValueChange = vi.fn((_value, details) => details.cancel());
    const listener = vi.fn((event: Event) => {
      event.preventDefault();
      (event as CustomEvent<{ cancel(): void }>).detail.cancel();
    });
    root.addEventListener("starwind:value-change", listener);

    const tabs = createTabs(root, { onValueChange });

    expect(tabs.getValue()).toBe("account");
    expect(getTab(root, "account").getAttribute("aria-selected")).toBe("true");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        cancelable: false,
        detail: expect.objectContaining({
          activationDirection: "none",
          isCanceled: false,
          previousValue: null,
          reason: "initial",
          value: "account",
        }),
      }),
    );
    expect(onValueChange).toHaveBeenCalledWith(
      "account",
      expect.objectContaining({
        activationDirection: "none",
        isCanceled: false,
        previousValue: null,
        reason: "initial",
        value: "account",
      }),
    );
  });

  it("emits non-cancelable disabled and missing fallback reasons during refresh", () => {
    const root = renderTabs({ defaultValue: "account" });
    const onValueChange = vi.fn((_value, details) => details.cancel());
    const listener = vi.fn((event: Event) => {
      event.preventDefault();
      (event as CustomEvent<{ cancel(): void }>).detail.cancel();
    });
    root.addEventListener("starwind:value-change", listener);
    const tabs = createTabs(root, { onValueChange });
    const subscriber = vi.fn();
    tabs.subscribe("valueChange", subscriber);

    const account = getTab(root, "account");
    account.disabled = true;
    account.setAttribute("data-disabled", "");
    tabs.refresh();

    expect(tabs.getValue()).toBe("password");
    expect(getPanel(root, "password").hidden).toBe(false);
    expect(root.getAttribute("data-activation-direction")).toBe("none");
    expect(getList(root).getAttribute("data-activation-direction")).toBe("none");
    expect(getTab(root, "password").getAttribute("data-activation-direction")).toBe("none");
    expect(getPanel(root, "password").getAttribute("data-activation-direction")).toBe("none");
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cancelable: false,
        detail: expect.objectContaining({
          isCanceled: false,
          previousValue: "account",
          reason: "disabled",
          value: "password",
        }),
      }),
    );
    expect(onValueChange).toHaveBeenLastCalledWith(
      "password",
      expect.objectContaining({
        isCanceled: false,
        previousValue: "account",
        reason: "disabled",
        value: "password",
      }),
    );
    expect(subscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isCanceled: false,
        previousValue: "account",
        reason: "disabled",
        value: "password",
      }),
    );

    listener.mockClear();
    onValueChange.mockClear();
    subscriber.mockClear();
    account.disabled = false;
    account.removeAttribute("data-disabled");
    getTab(root, "password").remove();
    getPanel(root, "password").remove();
    tabs.refresh();

    expect(tabs.getValue()).toBe("account");
    expect(getPanel(root, "account").hidden).toBe(false);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        cancelable: false,
        detail: expect.objectContaining({
          activationDirection: "none",
          isCanceled: false,
          previousValue: "password",
          reason: "missing",
          value: "account",
        }),
      }),
    );
    expect(onValueChange).toHaveBeenCalledWith(
      "account",
      expect.objectContaining({
        activationDirection: "none",
        isCanceled: false,
        previousValue: "password",
        reason: "missing",
        value: "account",
      }),
    );
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        activationDirection: "none",
        isCanceled: false,
        previousValue: "password",
        reason: "missing",
        value: "account",
      }),
    );

    listener.mockClear();
    onValueChange.mockClear();
    subscriber.mockClear();
    getTab(root, "account").remove();
    getPanel(root, "account").remove();
    tabs.refresh();

    expect(tabs.getValue()).toBeNull();
    expect(root.getAttribute("data-value")).toBe("null");
    expect(root.getAttribute("data-activation-direction")).toBe("none");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        cancelable: false,
        detail: expect.objectContaining({
          activationDirection: "none",
          isCanceled: false,
          previousValue: "account",
          reason: "missing",
          value: null,
        }),
      }),
    );
    expect(onValueChange).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        activationDirection: "none",
        isCanceled: false,
        previousValue: "account",
        reason: "missing",
        value: null,
      }),
    );
  });

  it("lets controlled callers observe changes and sync value imperatively", () => {
    const root = renderTabs({ defaultValue: "account" });
    const onValueChange = vi.fn();

    const tabs = createTabs(root, { onValueChange, value: "account" });

    getTab(root, "password").click();

    expect(onValueChange).toHaveBeenCalledWith(
      "password",
      expect.objectContaining({
        previousValue: "account",
        reason: "none",
        value: "password",
      }),
    );
    expect(tabs.getValue()).toBe("account");
    expect(getPanel(root, "account").hidden).toBe(false);

    tabs.setValue("password", { emit: false });

    expect(tabs.getValue()).toBe("password");
    expect(root.getAttribute("data-activation-direction")).toBe("right");
    expect(getPanel(root, "password").hidden).toBe(false);

    tabs.setValue(null, { emit: false });

    expect(tabs.getValue()).toBeNull();
    expect(root.getAttribute("data-value")).toBe("null");
    expect(root.getAttribute("data-activation-direction")).toBe("none");
    expect(getTab(root, "password").getAttribute("aria-selected")).toBe("false");
    expect(getPanel(root, "account").hidden).toBe(true);
    expect(getPanel(root, "password").hidden).toBe(true);
  });

  it("keeps the previous value when a value change is canceled", () => {
    const root = renderTabs({ defaultValue: "account" });
    root.addEventListener("starwind:value-change", (event) => {
      (event as CustomEvent<{ cancel(): void }>).detail.cancel();
    });

    const tabs = createTabs(root);

    getTab(root, "password").click();

    expect(tabs.getValue()).toBe("account");
    expect(getTab(root, "password").getAttribute("aria-selected")).toBe("false");
  });

  it("lets programmatic value changes be canceled before state commits", () => {
    const root = renderTabs({ defaultValue: "account" });
    const onValueChange = vi.fn();
    const listener = vi.fn((event: Event) => {
      expect(event.cancelable).toBe(true);
      event.preventDefault();
    });
    root.addEventListener("starwind:value-change", listener);

    const tabs = createTabs(root, { onValueChange });

    tabs.setValue("password");

    expect(tabs.getValue()).toBe("account");
    expect(root.getAttribute("data-value")).toBe("account");
    expect(getTab(root, "password").getAttribute("aria-selected")).toBe("false");
    expect(getPanel(root, "account").hidden).toBe(false);
    expect(getPanel(root, "password").hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          activationDirection: "right",
          event: undefined,
          isCanceled: true,
          previousValue: "account",
          reason: "imperative-action",
          trigger: undefined,
          value: "password",
        }),
      }),
    );
    expect(onValueChange).toHaveBeenCalledWith(
      "password",
      expect.objectContaining({
        activationDirection: "right",
        isCanceled: true,
        previousValue: "account",
        reason: "imperative-action",
        value: "password",
      } satisfies Partial<TabsValueChangeDetails>),
    );
  });

  it("does not commit programmatic value when value change details are canceled", () => {
    const root = renderTabs({ defaultValue: "account" });
    const onValueChange = vi.fn((_value, details: TabsValueChangeDetails) => {
      details.cancel();
    });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);

    const tabs = createTabs(root, { onValueChange });

    tabs.setValue("password");

    expect(tabs.getValue()).toBe("account");
    expect(root.getAttribute("data-value")).toBe("account");
    expect(getTab(root, "password").getAttribute("aria-selected")).toBe("false");
    expect(getPanel(root, "account").hidden).toBe(false);
    expect(getPanel(root, "password").hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        cancelable: true,
        detail: expect.objectContaining({
          isCanceled: true,
          previousValue: "account",
          reason: "imperative-action",
          value: "password",
        }),
      }),
    );
    expect(onValueChange).toHaveBeenCalledWith(
      "password",
      expect.objectContaining({
        isCanceled: true,
        previousValue: "account",
        reason: "imperative-action",
        value: "password",
      } satisfies Partial<TabsValueChangeDetails>),
    );
  });

  it("does not persist or sync canceled programmatic value changes", () => {
    const firstRoot = renderTabs({ defaultValue: "account", syncKey: "settings" });
    const secondRoot = renderTabs({ defaultValue: "account", syncKey: "settings" });
    const onValueChange = vi.fn((_value, details: TabsValueChangeDetails) => {
      details.cancel();
    });
    const secondListener = vi.fn();
    secondRoot.addEventListener("starwind:value-change", secondListener);

    const firstTabs = createTabs(firstRoot, { onValueChange });
    const secondTabs = createTabs(secondRoot);

    firstTabs.setValue("password");

    expect(firstTabs.getValue()).toBe("account");
    expect(secondTabs.getValue()).toBe("account");
    expect(localStorage.getItem("starwind-tabs-settings")).toBeNull();
    expect(getPanel(firstRoot, "account").hidden).toBe(false);
    expect(getPanel(secondRoot, "account").hidden).toBe(false);
    expect(secondListener).not.toHaveBeenCalled();
  });

  it("initializes from syncKey storage and syncs matching tab groups", () => {
    localStorage.setItem("starwind-tabs-settings", "password");
    const firstRoot = renderTabs({ defaultValue: "account", syncKey: "settings" });
    const secondRoot = renderTabs({ defaultValue: "account", syncKey: "settings" });

    const firstTabs = createTabs(firstRoot);
    const secondTabs = createTabs(secondRoot);

    expect(firstTabs.getValue()).toBe("password");
    expect(secondTabs.getValue()).toBe("password");
    expect(getPanel(firstRoot, "password").hidden).toBe(false);
    expect(getPanel(secondRoot, "password").hidden).toBe(false);

    getTab(firstRoot, "account").click();

    expect(firstTabs.getValue()).toBe("account");
    expect(secondTabs.getValue()).toBe("account");
    expect(localStorage.getItem("starwind-tabs-settings")).toBe("account");
    expect(firstRoot.getAttribute("data-activation-direction")).toBe("left");
    expect(secondRoot.getAttribute("data-activation-direction")).toBe("left");
    expect(getPanel(secondRoot, "account").hidden).toBe(false);
  });

  it("can broadcast controlled syncKey value updates without re-emitting value changes", () => {
    const controlledRoot = renderTabs({ defaultValue: "account", syncKey: "settings" });
    const uncontrolledRoot = renderTabs({ defaultValue: "account", syncKey: "settings" });
    const onValueChange = vi.fn();

    const controlledTabs = createTabs(controlledRoot, {
      onValueChange,
      value: "account",
    });
    const uncontrolledTabs = createTabs(uncontrolledRoot);

    controlledTabs.setValue("password", { emit: false, sync: true });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(controlledTabs.getValue()).toBe("password");
    expect(uncontrolledTabs.getValue()).toBe("password");
    expect(localStorage.getItem("starwind-tabs-settings")).toBe("password");
    expect(getPanel(uncontrolledRoot, "password").hidden).toBe(false);
  });

  it("lets synced tab roots cancel incoming value changes independently", () => {
    const firstRoot = renderTabs({ defaultValue: "account", syncKey: "settings" });
    const secondRoot = renderTabs({ defaultValue: "account", syncKey: "settings" });
    const listener = vi.fn((event: Event) => {
      (event as CustomEvent<TabsValueChangeDetails>).detail.cancel();
    });
    secondRoot.addEventListener("starwind:value-change", listener);

    const firstTabs = createTabs(firstRoot);
    const secondTabs = createTabs(secondRoot);

    getTab(firstRoot, "password").click();

    expect(firstTabs.getValue()).toBe("password");
    expect(secondTabs.getValue()).toBe("account");
    expect(getPanel(firstRoot, "password").hidden).toBe(false);
    expect(getPanel(secondRoot, "account").hidden).toBe(false);
    expect(localStorage.getItem("starwind-tabs-settings")).toBe("password");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          activationDirection: "right",
          isCanceled: true,
          previousValue: "account",
          reason: "none",
          value: "password",
        }),
      }),
    );
  });

  it("initializes nested tabs when their parent panel becomes active", () => {
    const root = renderTabs({ defaultValue: "account" });
    getPanel(root, "password").innerHTML = `
      <div id="nested-tabs" data-sw-tabs data-default-value="nested-a">
        <div data-sw-tabs-list>
          <button data-sw-tabs-tab data-value="nested-a">Nested A</button>
          <button data-sw-tabs-tab data-value="nested-b">Nested B</button>
        </div>
        <div data-sw-tabs-panel data-value="nested-a">Nested A panel</div>
        <div data-sw-tabs-panel data-value="nested-b">Nested B panel</div>
      </div>
    `;

    createTabs(root);

    const nestedRoot = document.querySelector<HTMLElement>("#nested-tabs")!;
    const nestedTab = getTab(nestedRoot, "nested-a");
    expect(nestedTab.getAttribute("role")).toBeNull();

    getTab(root, "password").click();

    expect(nestedRoot.getAttribute("data-value")).toBe("nested-a");
    expect(nestedTab.getAttribute("role")).toBe("tab");
    expect(getPanel(nestedRoot, "nested-a").hidden).toBe(false);
  });

  it("refreshes already-initialized nested tabs when their parent panel becomes active", () => {
    const root = renderTabs({ defaultValue: "account" });
    getPanel(root, "password").innerHTML = `
      <div id="nested-tabs" data-sw-tabs data-default-value="nested-a">
        <div data-sw-tabs-list>
          <button data-sw-tabs-tab data-value="nested-a">Nested A</button>
          <button data-sw-tabs-tab data-value="nested-b">Nested B</button>
        </div>
        <div data-sw-tabs-panel data-value="nested-a">Nested A panel</div>
        <div data-sw-tabs-panel data-value="nested-b">Nested B panel</div>
      </div>
    `;

    createTabs(root);

    const nestedRoot = document.querySelector<HTMLElement>("#nested-tabs")!;
    createTabs(nestedRoot);

    const list = getList(nestedRoot);
    list.insertAdjacentHTML(
      "beforeend",
      '<button data-sw-tabs-tab data-value="nested-c">Nested C</button>',
    );
    nestedRoot.insertAdjacentHTML(
      "beforeend",
      '<div data-sw-tabs-panel data-value="nested-c">Nested C panel</div>',
    );

    const nestedTab = getTab(nestedRoot, "nested-c");
    expect(nestedTab.getAttribute("role")).toBeNull();

    getTab(root, "password").click();

    expect(nestedTab.getAttribute("role")).toBe("tab");
    expect(getPanel(nestedRoot, "nested-c").getAttribute("role")).toBe("tabpanel");
  });

  it.each([
    ["ordinary", "", false],
    ["scaled", "translate(19px, 13px) scale(1.6, 0.75)", false],
    ["vertical", "scale(0.8, 1.4)", true],
  ])("aligns real fractional, bordered and scrolled %s layout", (_, transform, vertical) => {
    const root = renderGeometryTabs(vertical);
    root.style.transform = transform;
    const list = getList(root);
    const wrapper = list.querySelector<HTMLElement>(".geometry-wrapper")!;
    list.scrollLeft = 17;
    list.scrollTop = 9;
    wrapper.scrollLeft = 11;
    wrapper.scrollTop = 7;
    const tabs = createTabs(root);
    expectIndicatorAlignment(root, "account", 1);
    getTab(root, "password").click();
    expectIndicatorAlignment(root, "password", 1);
    expect(getPanel(root, "password").hidden).toBe(false);
    tabs.destroy();
  });

  it.each([
    ["ordinary", "", 1],
    ["shared scale", "scale(1.5, 0.8)", 1],
    ["shared rotation", "rotate(18deg)", 2],
  ])(
    "preserves the slot through six fractional offset parents under %s",
    (_, transform, tolerance) => {
      const root = renderTabs({ defaultValue: "account", withIndicator: true });
      root.style.transform = transform;
      const list = getList(root);
      list.style.cssText = "position:relative;width:400px;height:100px;";
      let parent = list;
      for (let depth = 0; depth < 6; depth++) {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position:relative;margin-left:10.375px;";
        parent.append(wrapper);
        parent = wrapper;
      }
      const account = getTab(root, "account");
      account.style.cssText = "display:block;box-sizing:border-box;width:80px;height:30px;";
      parent.append(account);
      const tabs = createTabs(root);
      expect(
        Math.abs(
          Number.parseFloat(getIndicator(root).style.getPropertyValue("--active-tab-left")) - 62.25,
        ),
      ).toBeLessThanOrEqual(tolerance);
      tabs.destroy();
    },
  );

  it("keeps precise offsets when the list is not an offset parent", () => {
    const root = renderGeometryTabs(false);
    const list = getList(root);
    list.style.position = "static";
    const tabs = createTabs(root);
    const indicator = getIndicator(root);
    const tab = getTab(root, "account");
    const expected =
      tab.getBoundingClientRect().left - list.getBoundingClientRect().left - list.clientLeft;
    expect(
      Math.abs(Number.parseFloat(indicator.style.getPropertyValue("--active-tab-left")) - expected),
    ).toBeLessThan(0.01);
    tabs.destroy();
  });

  it("measures content-box sizes and refreshes geometry at focus boundaries", () => {
    const root = renderGeometryTabs(false);
    const account = getTab(root, "account");
    account.style.boxSizing = "content-box";
    account.style.width = "71.375px";
    account.style.height = "24.625px";
    const tabs = createTabs(root);
    root.style.scale = "1.5 0.8";
    root.style.translate = "10px 6px";
    account.focus();
    expectIndicatorAlignment(root, "account", 1);
    expect(tabs.getValue()).toBe("account");
    expect(getPanel(root, "account").hidden).toBe(false);
    tabs.destroy();
  });

  it("keeps a translated tab's untransformed slot", () => {
    const root = renderGeometryTabs(false);
    const account = getTab(root, "account");
    account.style.translate = "12px 9px";
    const tabs = createTabs(root);
    account.style.translate = "";
    expectIndicatorAlignment(root, "account", 2);
    tabs.destroy();
  });

  it.each([
    "rotate(18deg)",
    "skew(15deg, 8deg)",
    "perspective(400px) rotateY(25deg)",
    "scale(-1, 1)",
    "scale(0)",
  ])("uses finite layout slots under %s", (transform) => {
    const root = renderGeometryTabs(false);
    root.style.transform = transform;
    const tabs = createTabs(root);
    root.style.transform = "";
    expectIndicatorAlignment(root, "account", 2);
    tabs.destroy();
  });

  it("uses the layout slot for tab-local transforms and recovers after hidden refresh", () => {
    const root = renderGeometryTabs(false);
    const account = getTab(root, "account");
    account.style.translate = "0.75px 0.5px";
    account.style.transform = "scale(1.2)";
    const tabs = createTabs(root);
    account.style.translate = "";
    account.style.transform = "";
    expectIndicatorAlignment(root, "account", 2);
    root.style.display = "none";
    tabs.refresh();
    for (const name of ["left", "right", "top", "bottom", "width", "height"]) {
      expect(
        Number.isFinite(
          Number.parseFloat(getIndicator(root).style.getPropertyValue(`--active-tab-${name}`)),
        ),
      ).toBe(true);
    }
    root.style.display = "";
    tabs.refresh();
    expectIndicatorAlignment(root, "account", 1);
    tabs.setValue(null);
    expect(getIndicator(root).hidden).toBe(true);
    tabs.destroy();
  });

  it("keeps inactive panels mounted while preserving keep-mounted markers", () => {
    const root = renderTabs({ defaultValue: "account" });
    const accountPanel = getPanel(root, "account");
    const passwordPanel = getPanel(root, "password");
    passwordPanel.setAttribute("data-keep-mounted", "");

    createTabs(root);

    expect(accountPanel.hidden).toBe(false);
    expect(accountPanel.getAttribute("data-state")).toBe("active");
    expect(passwordPanel.hidden).toBe(true);
    expect(passwordPanel.getAttribute("data-state")).toBe("inactive");
    expect(passwordPanel.hasAttribute("data-keep-mounted")).toBe(true);

    getTab(root, "password").click();

    expect(accountPanel.hidden).toBe(true);
    expect(accountPanel.getAttribute("data-state")).toBe("inactive");
    expect(passwordPanel.hidden).toBe(false);
    expect(passwordPanel.getAttribute("data-state")).toBe("active");
    expect(passwordPanel.hasAttribute("data-keep-mounted")).toBe(true);
  });

  it("refreshes orientation from the root attributes", () => {
    const root = renderTabs({ defaultValue: "account" });
    const account = getTab(root, "account");
    const password = getTab(root, "password");

    const tabs = createTabs(root);

    root.setAttribute("data-orientation", "vertical");
    tabs.refresh();
    account.focus();
    account.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(root.getAttribute("data-orientation")).toBe("vertical");
    expect(getList(root).getAttribute("aria-orientation")).toBe("vertical");
    expect(document.activeElement).toBe(password);
  });

  it("initializes raw HTML tabs through initStarwind", () => {
    const root = renderTabs({ defaultValue: "account" });

    const cleanup = initStarwind();

    getTab(root, "password").click();

    expect(root.getAttribute("data-value")).toBe("password");
    expect(getPanel(root, "password").hidden).toBe(false);

    cleanup.destroy();
  });
});

function renderTabs({
  defaultValue,
  listAttributes = "",
  syncKey,
  withIndicator = false,
}: {
  defaultValue: string | undefined;
  listAttributes?: string;
  syncKey?: string;
  withIndicator?: boolean;
}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-tabs ${defaultValue === undefined ? "" : `data-default-value="${defaultValue}"`} ${
      syncKey ? `data-sync-key="${syncKey}"` : ""
    } data-orientation="horizontal">
      <div data-sw-tabs-list ${listAttributes}>
        <button data-sw-tabs-tab data-value="account">Account</button>
        <button data-sw-tabs-tab data-value="disabled" data-disabled disabled>Disabled</button>
        <button data-sw-tabs-tab data-value="password">Password</button>
        ${withIndicator ? "<span data-sw-tabs-indicator></span>" : ""}
      </div>
      <div data-sw-tabs-panel data-value="account">Account panel</div>
      <div data-sw-tabs-panel data-value="disabled">Disabled panel</div>
      <div data-sw-tabs-panel data-value="password">Password panel</div>
    </div>
  `;
  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function prependTabsPart(root: HTMLElement, label: string, value = ""): void {
  getList(root).insertAdjacentHTML(
    "afterbegin",
    `<button data-sw-tabs-tab data-value="${value}">${label}</button>`,
  );
  getList(root).insertAdjacentHTML(
    "afterend",
    `<div data-sw-tabs-panel data-value="${value}">${label} panel</div>`,
  );
}

function getList(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-tabs-list]")!;
}

function getTab(root: HTMLElement, value: string): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>(`[data-sw-tabs-tab][data-value="${value}"]`)!;
}

function getPanel(root: HTMLElement, value: string): HTMLElement {
  return root.querySelector<HTMLElement>(`[data-sw-tabs-panel][data-value="${value}"]`)!;
}

function getIndicator(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-tabs-indicator]")!;
}

function renderGeometryTabs(vertical: boolean): HTMLElement {
  const root = renderTabs({ defaultValue: "account", withIndicator: true });
  root.style.cssText = "position:relative; margin:40px; transform-origin:0 0";
  root.setAttribute("data-orientation", vertical ? "vertical" : "horizontal");
  const list = getList(root);
  list.style.cssText =
    "position:relative; box-sizing:border-box; width:260.5px; height:145.75px; border:3px solid; overflow:scroll;";
  const wrapper = document.createElement("div");
  wrapper.className = "geometry-wrapper";
  wrapper.style.cssText =
    "position:relative; margin:13.25px 0 0 21.375px; border:2px solid; width:330px; height:190px; overflow:scroll";
  const inner = document.createElement("div");
  inner.style.cssText =
    "position:relative; width:500px; height:300px; padding:9.375px 0 0 12.25px; display:flex; gap:7.375px;";
  if (vertical) inner.style.flexDirection = "column";
  for (const value of ["account", "password"]) {
    const tab = getTab(root, value);
    tab.style.cssText =
      "box-sizing:border-box; flex:none; width:81.375px; height:34.625px; border:2px solid; padding:3px;";
    inner.append(tab);
  }
  wrapper.append(inner);
  list.prepend(wrapper);
  getIndicator(root).style.cssText =
    "position:absolute; pointer-events:none; left:var(--active-tab-left); top:var(--active-tab-top); width:var(--active-tab-width); height:var(--active-tab-height);";
  return root;
}

function expectIndicatorAlignment(root: HTMLElement, value: string, tolerance: number): void {
  const indicator = getIndicator(root);
  const tab = getTab(root, value);
  expect(indicator.hidden).toBe(false);
  for (const [name, expected] of [
    ["width", 81.375],
    ["height", 34.625],
  ] as const) {
    expect(
      Math.abs(
        Number.parseFloat(indicator.style.getPropertyValue(`--active-tab-${name}`)) - expected,
      ),
    ).toBeLessThanOrEqual(tolerance);
  }
  const actual = indicator.getBoundingClientRect();
  const expected = tab.getBoundingClientRect();
  for (const key of ["left", "top", "width", "height"] as const) {
    expect(Math.abs(actual[key] - expected[key]), key).toBeLessThanOrEqual(tolerance);
  }
}
