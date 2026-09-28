import { createTabs } from "@starwind-ui/runtime/tabs";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { TabsList, TabsPanel, TabsRoot, TabsTab } from "../src/tabs";

const owners: Root[] = [];
afterEach(() => {
  for (const owner of owners.splice(0)) flushSync(() => owner.unmount());
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("React Tabs fixed syncKey", () => {
  it.each([undefined, "mount-key"])(
    "retains initial key %s and adopts a new key on remount",
    (initialKey) => {
      localStorage.setItem("starwind-tabs-mount-key", "c");
      localStorage.setItem("starwind-tabs-next-key", "b");
      const host = document.createElement("div");
      document.body.append(host);
      const owner = createRoot(host);
      owners.push(owner);
      const parts = (key: number) => (
        <>
          <TabsList key={key}>
            {["a", "b", "c"].map((value) => (
              <TabsTab key={value} value={value} data-test-tab={value}>
                {value}
              </TabsTab>
            ))}
          </TabsList>
          {["a", "b", "c"].map((value) => (
            <TabsPanel key={value} value={value}>
              {value}
            </TabsPanel>
          ))}
        </>
      );
      const render = (
        syncKey: string | undefined,
        options: {
          version?: number;
          lifetime?: number;
          value?: string;
          orientation?: "horizontal" | "vertical";
        } = {},
      ) =>
        flushSync(() =>
          owner.render(
            <React.StrictMode>
              <TabsRoot
                key={options.lifetime ?? 0}
                data-owner
                defaultValue="a"
                syncKey={syncKey}
                value={options.value}
                orientation={options.orientation}
              >
                {parts(options.version ?? 0)}
              </TabsRoot>
              <TabsRoot data-peer defaultValue="a" syncKey="mount-key">
                {parts(0)}
              </TabsRoot>
            </React.StrictMode>,
          ),
        );
      const root = () => host.querySelector<HTMLElement>("[data-owner]")!;
      const click = (value: string) =>
        flushSync(() =>
          root().querySelector<HTMLButtonElement>(`[data-test-tab="${value}"]`)!.click(),
        );
      render(initialKey);
      const initial = createTabs(root()),
        peer = createTabs(host.querySelector<HTMLElement>("[data-peer]")!);
      expect(initial.getValue()).toBe(initialKey ? "c" : "a");
      render("next-key");
      expect(root().getAttribute("data-sync-key")).toBe(initialKey ?? null);
      expect(createTabs(root())).toBe(initial);
      click("b");
      expect(initial.getValue()).toBe("b");
      expect(peer.getValue()).toBe(initialKey ? "b" : "c");
      render("next-key", { version: 1, orientation: "vertical", value: "c" });
      expect(initial.getValue()).toBe("c");
      expect(createTabs(root())).toBe(initial);
      expect(root().getAttribute("data-sync-key")).toBe(initialKey ?? null);
      expect(localStorage.getItem("starwind-tabs-next-key")).toBe("b");
      const retired = root();
      render("next-key", { lifetime: 1 });
      expect(root()).not.toBe(retired);
      expect(root().getAttribute("data-sync-key")).toBe("next-key");
      expect(createTabs(root()).getValue()).toBe("b");
      click("c");
      expect(localStorage.getItem("starwind-tabs-next-key")).toBe("c");
    },
  );
});

it.each([false, true])(
  "preserves hydrated panel motion and keyboard position (controlled: %s)",
  async (controlled) => {
    const host = document.createElement("div");
    document.body.append(host);
    const style = document.createElement("style");
    style.textContent = `[data-sw-tabs-panel] { opacity: 1; transition: opacity 180ms linear; }
    [data-starting-style], [data-ending-style] { opacity: 0; }`;
    host.before(style);
    const errors: unknown[] = [];
    const tree = (value: string) => (
      <TabsRoot defaultValue="a" value={controlled ? value : undefined}>
        <TabsList>
          <TabsTab value="a">A</TabsTab>
          <TabsTab value="b">B</TabsTab>
        </TabsList>
        <TabsPanel value="a">Account content</TabsPanel>
        <TabsPanel value="b" keepMounted>
          Password content
        </TabsPanel>
      </TabsRoot>
    );
    host.innerHTML = renderToString(tree("a"));
    const original = host.querySelector("[data-sw-tabs-panel]");
    const owner = hydrateRoot(host, tree("a"), {
      onRecoverableError: (error) => errors.push(error),
    });
    owners.push(owner);
    await expect
      .poll(() => host.querySelector("[data-sw-tabs-tab]")?.getAttribute("aria-controls"))
      .toBeTruthy();
    expect(host.querySelector("[data-sw-tabs-panel]")).toBe(original);
    const root = host.querySelector<HTMLElement>("[data-sw-tabs]")!;
    const a = root.querySelector<HTMLElement>('[data-sw-tabs-panel][data-value="a"]')!;
    const b = root.querySelector<HTMLElement>('[data-sw-tabs-panel][data-value="b"]')!;
    const tabA = root.querySelector<HTMLButtonElement>('[data-sw-tabs-tab][data-value="a"]')!;
    const tabB = root.querySelector<HTMLButtonElement>('[data-sw-tabs-tab][data-value="b"]')!;
    expect(a.hasAttribute("data-starting-style")).toBe(false);
    expect(b.hidden).toBe(true);
    expect(getComputedStyle(a).opacity).toBe("1");
    const select = (value: string) =>
      flushSync(() => (controlled ? owner.render(tree(value)) : createTabs(root).setValue(value)));
    select("b");
    expect(a.hidden).toBe(false);
    expect(a.inert).toBe(true);
    expect(b.hidden).toBe(false);
    expect(tabB.tabIndex).toBe(0);
    flushSync(() => owner.render(tree("b")));
    expect(a.hidden).toBe(false);
    await expect.poll(() => a.hidden).toBe(true);
    tabA.focus();
    select("a");
    select("b");
    expect(document.activeElement).toBe(tabA);
    expect(tabA.tabIndex).toBe(0);
    expect(tabB.tabIndex).toBe(-1);
    expect(errors).toEqual([]);
  },
);
