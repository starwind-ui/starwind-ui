import { createTabs } from "@starwind-ui/runtime/tabs";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
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
