import { createTabs, type TabsValue, type TabsValueChangeDetails } from "@starwind-ui/runtime/tabs";
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTab } from "@starwind-ui/vue/tabs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import {
  type ComponentPublicInstance,
  createApp,
  createSSRApp,
  h,
  nextTick,
  reactive,
  ref,
} from "vue";
import { renderToString } from "vue/server-renderer";
import {
  Tabs as StyledTabs,
  TabsContent as StyledTabsContent,
  TabsList as StyledTabsList,
  TabsTrigger as StyledTabsTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/tabs";
import { testAcceptedModelPublication } from "../accepted-model-publication.js";

type ElementExpose = ComponentPublicInstance & { element: HTMLElement | null };
const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("Vue Tabs public behavior", () => {
  it("preserves hydrated panel transitions through controlled rerenders", async () => {
    const value = ref("account");
    const tree = () => h(TabsRoot, { modelValue: value.value }, () => tabsTree());
    const host = appendHost();
    host.innerHTML = await renderToString(createSSRApp({ render: tree }));
    const initialPanel = getPanel(host, "account");
    const style = document.createElement("style");
    style.textContent = `[data-sw-tabs-panel] { opacity: 1; transition: opacity 180ms linear; }
      [data-starting-style], [data-ending-style] { opacity: 0; }`;
    host.before(style);
    const warnings: string[] = [];
    const app = createSSRApp({ render: tree });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();
    expect(getPanel(host, "account")).toBe(initialPanel);
    expect(initialPanel.hasAttribute("data-starting-style")).toBe(false);
    expect(getComputedStyle(initialPanel).opacity).toBe("1");
    value.value = "password";
    await settle();
    expect(initialPanel.hidden).toBe(false);
    expect(initialPanel.inert).toBe(true);
    expect(getPanel(host, "password").hidden).toBe(false);
    expect(getTab(host, "password").tabIndex).toBe(0);
    await expect.poll(() => initialPanel.hidden).toBe(true);
    getTab(host, "account").focus();
    value.value = "account";
    await settle();
    value.value = "password";
    await settle();
    expect(document.activeElement).toBe(getTab(host, "account"));
    expect(getTab(host, "account").tabIndex).toBe(0);
    expect(getTab(host, "password").tabIndex).toBe(-1);
    expect(warnings).toEqual([]);
  });

  it.each([undefined, "mount-key"])(
    "freezes syncKey %s through changes and unrelated reconstruction",
    async (initialKey) => {
      localStorage.setItem("starwind-tabs-mount-key", "c");
      localStorage.setItem("starwind-tabs-next-key", "b");
      const state = reactive({
        syncKey: initialKey as string | undefined,
        value: undefined as TabsValue | undefined,
        orientation: "horizontal" as "horizontal" | "vertical",
        parts: 0,
        lifetime: 0,
      });
      const host = appendHost();
      const parts = () => [
        h(TabsList, { key: state.parts }, () =>
          ["a", "b", "c"].map((value) =>
            h(TabsTab, { value, "data-test-tab": value }, () => value),
          ),
        ),
        ...["a", "b", "c"].map((value) => h(TabsPanel, { value }, () => value)),
      ];
      const app = createApp({
        render: () =>
          h("div", [
            h(
              TabsRoot,
              {
                key: state.lifetime,
                "data-owner": "",
                defaultValue: "a",
                syncKey: state.syncKey,
                modelValue: state.value,
                orientation: state.orientation,
              },
              parts,
            ),
            h(TabsRoot, { "data-peer": "", defaultValue: "a", syncKey: "mount-key" }, parts),
          ]),
      });
      app.mount(host);
      cleanups.push(() => app.unmount());
      await settle();
      const root = () => host.querySelector<HTMLElement>("[data-owner]")!;
      const peer = createTabs(host.querySelector<HTMLElement>("[data-peer]")!);
      const click = (value: string) =>
        root().querySelector<HTMLButtonElement>(`[data-test-tab="${value}"]`)!.click();
      const initial = createTabs(root());
      expect(initial.getValue()).toBe(initialKey ? "c" : "a");
      state.syncKey = "next-key";
      await settle();
      expect(createTabs(root())).toBe(initial);
      expect(root().getAttribute("data-sync-key")).toBe(initialKey ?? null);
      click("b");
      await settle();
      expect(initial.getValue()).toBe("b");
      expect(peer.getValue()).toBe(initialKey ? "b" : "c");
      state.orientation = "vertical";
      state.parts++;
      await settleMutation();
      expect(createTabs(root())).toBe(initial);
      expect(root().getAttribute("data-sync-key")).toBe(initialKey ?? null);
      state.value = "c";
      await settle();
      expect(createTabs(root())).toBe(initial);
      expect(createTabs(root()).getValue()).toBe("c");
      expect(root().getAttribute("data-sync-key")).toBe(initialKey ?? null);
      state.value = undefined;
      await settle();
      click("a");
      await settle();
      expect(peer.getValue()).toBe(initialKey ? "a" : "c");
      expect(localStorage.getItem("starwind-tabs-next-key")).toBe("b");
      const retired = root();
      state.lifetime++;
      await settle();
      expect(root()).not.toBe(retired);
      expect(root().getAttribute("data-sync-key")).toBe("next-key");
      expect(createTabs(root()).getValue()).toBe("b");
      click("c");
      await settle();
      expect(localStorage.getItem("starwind-tabs-next-key")).toBe("c");
    },
  );

  it("keeps controlled and canceled proposals parent-owned and preserves event order", async () => {
    const state = reactive({ cancel: true, value: "account" as TabsValue });
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          TabsRoot,
          {
            modelValue: state.value,
            onValueChange: (value: TabsValue, detail: TabsValueChangeDetails) => {
              events.push(`detail:${String(value)}`);
              if (state.cancel) detail.cancel();
            },
            "onUpdate:modelValue": (value: TabsValue) => events.push(`update:${String(value)}`),
          },
          () => tabsTree(),
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    getTab(host, "password").click();
    await settle();
    expect(events).toEqual(["detail:password"]);
    expect(getTab(host, "account").getAttribute("aria-selected")).toBe("true");

    state.cancel = false;
    getTab(host, "password").click();
    await settle();
    expect(events).toEqual(["detail:password", "detail:password", "update:password"]);
    expect(getTab(host, "account").getAttribute("aria-selected")).toBe("true");

    state.value = "password";
    await settle();
    expect(getTab(host, "password").getAttribute("aria-selected")).toBe("true");
  });

  it("delegates manual, automatic, horizontal, and vertical keyboard activation to Runtime", async () => {
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("div", null, [
          h(TabsRoot, { defaultValue: "account" }, () => tabsTree(false)),
          h(TabsRoot, { defaultValue: "account", orientation: "vertical" }, () => tabsTree(true)),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();
    const roots = host.querySelectorAll<HTMLElement>("[data-sw-tabs]");

    const manualAccount = getTab(roots[0]!, "account");
    const manualPassword = getTab(roots[0]!, "password");
    manualAccount.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(manualPassword);
    expect(manualPassword.getAttribute("aria-selected")).toBe("false");
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(manualPassword.getAttribute("aria-selected")).toBe("true");

    const automaticAccount = getTab(roots[1]!, "account");
    const automaticPassword = getTab(roots[1]!, "password");
    automaticAccount.focus();
    await userEvent.keyboard("{ArrowDown}");
    await settle();
    expect(document.activeElement).toBe(automaticPassword);
    expect(automaticPassword.getAttribute("aria-selected")).toBe("true");
  });

  it("refreshes dynamic tabs and publishes noncancelable Runtime fallback details", async () => {
    const values = ref(["account", "password", "security"]);
    const updates: TabsValue[] = [];
    const details: TabsValueChangeDetails[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          TabsRoot,
          {
            defaultValue: "password",
            onValueChange: (_value: TabsValue, detail: TabsValueChangeDetails) =>
              details.push(detail),
            "onUpdate:modelValue": (value: TabsValue) => updates.push(value),
          },
          () => [
            h(TabsList, null, () =>
              values.value.map((value) => h(TabsTab, { value }, () => value)),
            ),
            ...values.value.map((value) => h(TabsPanel, { value }, () => `${value} panel`)),
          ],
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    values.value.splice(1, 1);
    await settleMutation();
    expect(updates).toEqual(["account"]);
    expect(details.at(-1)).toMatchObject({
      isCanceled: false,
      previousValue: "password",
      reason: "missing",
      value: "account",
    });
    details.at(-1)?.cancel();
    expect(details.at(-1)?.isCanceled).toBe(false);
    expect(getPanel(host, "account").hidden).toBe(false);
  });

  it("keeps presence, sync storage, indicator geometry, multiple instances, and cleanup Runtime-owned", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const host = appendHost();
    const root = (id: string) =>
      h(TabsRoot, { defaultValue: "account", id, syncKey: "settings" }, () => [
        h(TabsList, { style: "position:relative;width:240px;height:40px" }, () => [
          h(
            TabsTab,
            { style: "display:inline-block;width:100px;height:32px", value: "account" },
            () => "Account",
          ),
          h(
            TabsTab,
            { style: "display:inline-block;width:100px;height:32px", value: "password" },
            () => "Password",
          ),
          h(TabsIndicator),
        ]),
        h(TabsPanel, { value: "account" }, () => "Account panel"),
        h(TabsPanel, { keepMounted: true, value: "password" }, () => "Password panel"),
      ]);
    const app = createApp({
      render: () => h("div", null, [root("first-tabs"), root("second-tabs")]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settleMutation();

    const roots = host.querySelectorAll<HTMLElement>("[data-sw-tabs]");
    getTab(roots[0]!, "password").click();
    await settle();
    expect(getPanel(roots[0]!, "password").hidden).toBe(false);
    expect(getPanel(roots[1]!, "password").hidden).toBe(false);
    expect(getPanel(roots[0]!, "password").hasAttribute("data-keep-mounted")).toBe(true);
    expect(localStorage.getItem("starwind-tabs-settings")).toBe("password");
    const indicator = roots[0]!.querySelector<HTMLElement>("[data-sw-tabs-indicator]")!;
    expect(indicator.hidden).toBe(false);
    expect(indicator.style.getPropertyValue("--active-tab-width")).not.toBe("");

    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(2);
  });

  it("forwards attrs and refs and hydrates Styled output without warnings", async () => {
    const rootRef = ref<ElementExpose | null>(null);
    const value = ref<TabsValue>("account");
    const root = () =>
      h(
        StyledTabs,
        {
          class: "consumer-root",
          "data-consumer": "yes",
          modelValue: value.value,
          "onUpdate:modelValue": (next: TabsValue) => (value.value = next),
          ref: rootRef,
        },
        () => [
          h(StyledTabsList, null, () => [
            h(StyledTabsTrigger, { "data-testid": "account", value: "account" }, () => "Account"),
            h(
              StyledTabsTrigger,
              { "data-testid": "password", value: "password" },
              () => "Password",
            ),
          ]),
          h(StyledTabsContent, { value: "account" }, () => "Account content"),
          h(StyledTabsContent, { value: "password" }, () => "Password content"),
        ],
      );
    const html = await renderToString(createSSRApp({ render: root }));
    const host = appendHost();
    host.innerHTML = html;
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    expect(warnings).toEqual([]);
    expect(rootRef.value?.element).toBe(host.querySelector("[data-sw-tabs]"));
    expect(rootRef.value?.element?.getAttribute("data-consumer")).toBe("yes");
    getTab(host, "password").click();
    await settle();
    expect(value.value).toBe("password");
  });
});

function tabsTree(activateOnFocus = false) {
  return [
    h(TabsList, { activateOnFocus }, () => [
      h(TabsTab, { value: "account" }, () => "Account"),
      h(TabsTab, { value: "password" }, () => "Password"),
    ]),
    h(TabsPanel, { value: "account" }, () => "Account panel"),
    h(TabsPanel, { value: "password" }, () => "Password panel"),
  ];
}

function getTab(root: ParentNode, value: string): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>(`[data-sw-tabs-tab][data-value="${value}"]`)!;
}

function getPanel(root: ParentNode, value: string): HTMLElement {
  return root.querySelector<HTMLElement>(`[data-sw-tabs-panel][data-value="${value}"]`)!;
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await nextTick();
}

async function settleMutation(): Promise<void> {
  await settle();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await settle();
}

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

testAcceptedModelPublication({
  name: "TabsRoot",
  model: "modelValue",
  proposal: "onValueChange",
  domEvent: "starwind:value-change",
  initial: "account",
  accepted: "password",
  tree: () => h(TabsRoot, { defaultValue: "account" }, () => tabsTree()),
  root: "[data-sw-tabs]",
  act: (root) =>
    root.querySelector<HTMLButtonElement>('[data-sw-tabs-tab][data-value="password"]')!.click(),
  read: (root) =>
    root.querySelector('[data-sw-tabs-tab][aria-selected="true"]')?.getAttribute("data-value"),
});
