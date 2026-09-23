import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import StyledSidebar from "../../../apps/react-demo/src/components/starwind-runtime/sidebar/Sidebar";
import StyledProvider from "../../../apps/react-demo/src/components/starwind-runtime/sidebar/SidebarProvider";
import StyledTrigger from "../../../apps/react-demo/src/components/starwind-runtime/sidebar/SidebarTrigger";
import { Sidebar, useSidebarContext } from "../src/sidebar";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
afterEach(async () => {
  await act(() => root?.unmount());
  root = undefined;
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("React Sidebar ownership", () => {
  for (const strict of [false, true]) {
    it(`keeps each Styled mobile Sheet with its accepted Provider (${strict ? "Strict Mode" : "normal"})`, async () => {
      const notifications: boolean[] = [];
      function Probe() {
        const context = useSidebarContext();
        return <output data-outer-model>{String(context?.mobileOpen)}</output>;
      }
      const tree = () => {
        const providers = (
          <StyledProvider
            mobileQuery="(min-width: 0px)"
            data-owner="outer"
            onMobileOpenChange={(open) => notifications.push(open)}
          >
            <StyledProvider mobileQuery="(min-width: 0px)" data-owner="inner">
              <StyledSidebar>Inner</StyledSidebar>
              <StyledTrigger data-inner-trigger />
            </StyledProvider>
            <StyledSidebar>Outer</StyledSidebar>
            <StyledTrigger data-outer-trigger />
            <Probe />
          </StyledProvider>
        );
        return strict ? <React.StrictMode>{providers}</React.StrictMode> : providers;
      };
      const host = document.createElement("div");
      document.body.append(host);
      root = createRoot(host);
      await act(() => root!.render(tree()));
      const provider = host.querySelector<HTMLElement>('[data-owner="outer"]')!;
      const inner = host.querySelector<HTMLElement>('[data-owner="inner"]')!;
      const sheets = [...provider.querySelectorAll<HTMLElement>('[data-sidebar="mobile"]')];
      const sheet = sheets[1]!;
      const popup = sheet.querySelector<HTMLDialogElement>("dialog")!;
      const trigger = provider.querySelector<HTMLElement>("[data-outer-trigger]")!;
      const settle = async (run: () => void) =>
        act(async () => {
          run();
          await Promise.resolve();
        });
      const veto = (event: Event) => {
        if (event.target === sheet) event.preventDefault();
      };
      document.addEventListener("starwind:open-change", veto);
      await settle(() => trigger.click());
      expect(popup.open).toBe(false);
      expect(host.querySelector("output")?.textContent).toBe("false");
      expect(notifications).toEqual([]);
      document.removeEventListener("starwind:open-change", veto);
      await settle(() => trigger.click());
      expect(popup.open).toBe(true);
      expect(inner.dataset.mobileOpen).toBe("false");
      expect(sheets[0]!.querySelector<HTMLDialogElement>("dialog")!.open).toBe(false);
      document.addEventListener("starwind:open-change", veto);
      await settle(() => sheet.dispatchEvent(new CustomEvent("dialog:close")));
      expect(popup.open).toBe(true);
      expect(host.querySelector("output")?.textContent).toBe("true");
      expect(notifications).toEqual([true]);
      document.removeEventListener("starwind:open-change", veto);
      document.addEventListener(
        "starwind:open-change",
        () => provider.dispatchEvent(new CustomEvent("sidebar:open-mobile")),
        { once: true },
      );
      await settle(() => sheet.dispatchEvent(new CustomEvent("dialog:close")));
      expect(popup.open).toBe(true);
      expect(host.querySelector("output")?.textContent).toBe("true");
      await settle(() => sheet.dispatchEvent(new CustomEvent("dialog:close")));
      expect(host.querySelector("output")?.textContent).toBe("false");
      await settle(() => trigger.click());
      await settle(() => popup.dispatchEvent(new Event("transitionend")));
      expect(popup.open).toBe(true);
      await act(async () => {
        sheet.dispatchEvent(new CustomEvent("dialog:close"));
        root!.render(null);
        await Promise.resolve();
      });
      const count = notifications.length;
      await settle(() => sheet.dispatchEvent(new CustomEvent("dialog:open")));
      expect(notifications).toHaveLength(count);
      await act(() => root!.render(tree()));
      expect(host.querySelector("output")?.textContent).toBe("false");
    });
  }
  for (const strict of [false, true]) {
    it(`reads persistence into context before later controls mount (${strict ? "Strict Mode" : "normal"})`, async () => {
      localStorage.setItem("sidebar-context-test", "false");
      const notify = vi.fn();
      function ContextState() {
        const context = useSidebarContext();
        return <output>{String(context?.open)}</output>;
      }
      const tree = (showTrigger: boolean, key: string) => {
        const provider = (
          <Sidebar.Provider
            persistOpen
            persistenceKey="sidebar-context-test"
            mobileQuery="(max-width: 0px)"
            keyboardShortcut={key}
            onOpenChange={notify}
          >
            <ContextState />
            {showTrigger && <Sidebar.Trigger>Toggle</Sidebar.Trigger>}
          </Sidebar.Provider>
        );
        return strict ? <React.StrictMode>{provider}</React.StrictMode> : provider;
      };
      const host = document.createElement("div");
      document.body.append(host);
      root = createRoot(host);
      await act(() => root!.render(tree(false, "b")));
      expect(host.querySelector("output")?.textContent).toBe("false");
      await act(() => root!.render(tree(true, "b")));
      expect(host.querySelector("button")).toHaveAttribute("aria-expanded", "false");
      expect(host.querySelector("[data-sw-sidebar-provider]")).toHaveAttribute(
        "data-state",
        "collapsed",
      );
      localStorage.setItem("sidebar-context-test", "true");
      await act(() => root!.render(tree(true, "j")));
      expect(host.querySelector("output")?.textContent).toBe("true");
      expect(host.querySelector("button")).toHaveAttribute("aria-expanded", "true");
      expect(notify).not.toHaveBeenCalled();
    });
  }
});
