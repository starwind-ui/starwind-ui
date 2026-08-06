import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, h, nextTick, reactive } from "vue";

import type { ContextMenuOpenChangeDetails } from "@starwind-ui/runtime/context-menu";
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuPortal,
  ContextMenuPositioner,
  ContextMenuRoot,
  ContextMenuSubmenuRoot,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
} from "@starwind-ui/vue/context-menu";

const cleanups: Array<() => void> = [];

describe("Vue Context Menu", () => {
  afterEach(() => {
    cleanups
      .splice(0)
      .reverse()
      .forEach((cleanup) => cleanup());
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("anchors accepted context requests at Runtime-owned pointer coordinates", async () => {
    const events: string[] = [];
    const state = reactive({ cancelOpen: true });
    const { host, trigger } = mountContextMenu({
      onOpenChange: (_open, detail) => {
        events.push("open-detail");
        if (state.cancelOpen) detail.cancel();
      },
      onOpenUpdate: () => events.push("open-update"),
    });

    dispatchContextMenu(trigger, 120, 140);
    await frame();
    expect(events).toEqual(["open-detail"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector<HTMLElement>("[data-sw-menu-popup]")?.hidden).toBe(true);
    expect(readAnchorPosition()).toEqual({ left: "120px", top: "140px" });

    state.cancelOpen = false;
    dispatchContextMenu(trigger, 220, 240);
    await frame();
    expect(events.slice(-2)).toEqual(["open-detail", "open-update"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector<HTMLElement>("[data-sw-menu-popup]")?.hidden).toBe(false);
    expect(readAnchorPosition()).toEqual({ left: "220px", top: "240px" });
  });

  it("opens from the keyboard and restores focus through Runtime", async () => {
    const { trigger } = mountContextMenu();
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ContextMenu" }));
    await frame();

    const popup = document.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
    expect(document.activeElement?.textContent).toContain("Rename");
    popup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await frame();
    expect(popup.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps nested portal ownership and removes each Runtime resource", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const { app, trigger } = mountContextMenu();
    await frame();

    expect(document.body.querySelectorAll(":scope > [data-sw-menu-portal]")).toHaveLength(1);
    expect(document.body.querySelectorAll("[data-sw-menu-portal]")).toHaveLength(2);
    expect(document.querySelectorAll("[data-sw-context-menu-anchor]")).toHaveLength(1);

    dispatchContextMenu(trigger, 80, 90);
    await frame();
    const submenuTrigger = document.querySelector<HTMLElement>("[data-sw-menu-submenu-trigger]")!;
    submenuTrigger.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );
    await frame();
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelectorAll("[data-sw-menu-popup]:not([hidden])")).toHaveLength(2);

    app.unmount();
    expect(abort).toHaveBeenCalledTimes(3);
    expect(document.querySelector("[data-sw-context-menu-anchor]")).toBeNull();
    expect(document.querySelector("[data-sw-menu-portal]")).toBeNull();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });
});

type RenderOptions = {
  onOpenChange?: (open: boolean, detail: ContextMenuOpenChangeDetails) => void;
  onOpenUpdate?: (open: boolean) => void;
};

function mountContextMenu(options: RenderOptions = {}) {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({ render: () => renderContextMenu(options) });
  app.mount(host);
  cleanups.push(() => app.unmount());
  return {
    app,
    host,
    trigger: host.querySelector<HTMLElement>("[data-sw-context-menu-trigger]")!,
  };
}

function renderContextMenu(options: RenderOptions) {
  return h(
    ContextMenuRoot,
    {
      onOpenChange: options.onOpenChange,
      "onUpdate:open": options.onOpenUpdate,
    },
    {
      default: () => [
        h(ContextMenuTrigger, { id: "context-target" }, { default: () => "Canvas" }),
        h(ContextMenuPortal, null, {
          default: () =>
            h(ContextMenuPositioner, null, {
              default: () =>
                h(ContextMenuPopup, null, {
                  default: () => [
                    h(ContextMenuItem, null, { default: () => "Rename" }),
                    h(ContextMenuSubmenuRoot, null, {
                      default: () => [
                        h(ContextMenuSubmenuTrigger, null, { default: () => "More" }),
                        h(ContextMenuPortal, null, {
                          default: () =>
                            h(
                              ContextMenuPositioner,
                              { side: "right" },
                              {
                                default: () =>
                                  h(ContextMenuPopup, null, {
                                    default: () =>
                                      h(ContextMenuItem, null, { default: () => "Duplicate" }),
                                  }),
                              },
                            ),
                        }),
                      ],
                    }),
                  ],
                }),
            }),
        }),
      ],
    },
  );
}

function dispatchContextMenu(trigger: HTMLElement, clientX: number, clientY: number): void {
  trigger.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
    }),
  );
}

function readAnchorPosition(): { left: string; top: string } {
  const anchor = document.querySelector<HTMLElement>("[data-sw-context-menu-anchor]")!;
  return { left: anchor.style.left, top: anchor.style.top };
}

async function frame(): Promise<void> {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  await nextTick();
}
