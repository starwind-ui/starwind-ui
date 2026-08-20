import { createApp, h, nextTick, reactive, ref } from "vue";
import { afterEach, describe, expect, it } from "vitest";

import {
  DrawerBackdrop,
  DrawerClose,
  DrawerDescription,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
} from "@starwind-ui/vue/drawer";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  document.body.innerHTML = "";
  document.body.removeAttribute("data-sw-scroll-locked");
});

describe("Vue Drawer browser contract", () => {
  it("supports default, controlled, and canceled state without stealing model ownership", async () => {
    const controlled = ref(false);
    const events: string[] = [];
    let cancel = true;
    const host = mount(
      tree({
        open: controlled.value,
        onOpenChange(open: boolean, detail: { cancel(): void }) {
          events.push(`detail:${open}`);
          if (cancel) {
            cancel = false;
            detail.cancel();
          }
        },
        "onUpdate:open": (open: boolean) => events.push(`update:${open}`),
      }),
    );
    host.querySelector<HTMLButtonElement>("[data-sw-drawer-trigger]")!.click();
    await nextTick();
    expect(events).toEqual(["detail:true"]);
    expect(document.body.querySelector<HTMLDialogElement>("dialog")!.open).toBe(false);
    host.querySelector<HTMLButtonElement>("[data-sw-drawer-trigger]")!.click();
    await nextTick();
    expect(events).toEqual(["detail:true", "detail:true", "update:true"]);

    mount(tree({ defaultOpen: true }));
    await nextTick();
    const dialogs = document.body.querySelectorAll<HTMLDialogElement>("dialog");
    expect(dialogs[dialogs.length - 1]!.open).toBe(true);
  });

  it.each(["top", "right", "bottom", "left"] as const)(
    "projects the %s side and Runtime-owned presence",
    async (side) => {
      const host = mount(tree({}, { disabled: true, side }));
      const popup = host.querySelector<HTMLDialogElement>("[data-sw-drawer-popup]")!;
      const backdrop = host.querySelector<HTMLElement>("[data-sw-drawer-backdrop]")!;
      expect(popup.dataset.side).toBe(side);
      expect(popup.hidden).toBe(true);
      host.querySelector<HTMLButtonElement>("[data-sw-drawer-trigger]")!.click();
      await nextTick();
      expect(popup.open).toBe(true);
      expect(popup.hidden).toBe(false);
      expect(backdrop.hidden).toBe(false);
      host.querySelector<HTMLButtonElement>("[data-sw-drawer-close]")!.click();
      await nextTick();
      await waitForDialogClosed(popup);
      expect(popup.open).toBe(false);
      expect(popup.hidden).toBe(true);
    },
  );

  it("honors modal and nonmodal dismissal, focus, and scroll locks", async () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();
    const modalHost = mount(tree());
    modalHost.querySelector<HTMLButtonElement>("[data-sw-drawer-trigger]")!.click();
    await nextTick();
    const modalPopup = document.body.querySelector<HTMLDialogElement>("dialog")!;
    expect(modalPopup.open).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    document.body.querySelector<HTMLElement>("[data-sw-drawer-backdrop]")!.click();
    await nextTick();
    await waitForDialogClosed(modalPopup);
    expect(modalPopup.open).toBe(false);
    expect(document.activeElement).toBe(outside);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    const nonmodalHost = mount(tree({ modal: false }));
    nonmodalHost.querySelector<HTMLButtonElement>("[data-sw-drawer-trigger]")!.click();
    await nextTick();
    const popups = document.body.querySelectorAll<HTMLDialogElement>("dialog");
    expect(popups[popups.length - 1]!.getAttribute("aria-modal")).toBe("false");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("teleports to custom targets, remains inline when disabled, and cleans remount owners", async () => {
    const target = document.createElement("section");
    document.body.append(target);
    const show = ref(true);
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () => (show.value ? tree({}, { container: target }) : null),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();
    const remotePortal = target.querySelector<HTMLElement>("[data-sw-drawer-portal]")!;
    expect(remotePortal.dataset.placement).toBe("ready");
    expect(remotePortal.hasAttribute("data-floating-root")).toBe(true);
    expect(remotePortal.contains(remotePortal.querySelector("[data-sw-drawer-popup]"))).toBe(true);
    show.value = false;
    await nextTick();
    expect(target.querySelector("[data-sw-drawer-portal]")).toBeNull();
    show.value = true;
    await nextTick();
    expect(target.querySelector("[data-sw-drawer-portal]")).not.toBeNull();

    const inlineHost = mount(tree({}, { disabled: true }));
    await nextTick();
    expect(
      inlineHost.querySelector<HTMLElement>("[data-sw-drawer-portal]")!.dataset.placement,
    ).toBe("ready");
  });

  it("isolates multiple owners and closes only the nested topmost Drawer", async () => {
    const parent = h(DrawerRoot, null, {
      default: () => [
        h(DrawerTrigger, { id: "parent-trigger" }, { default: () => "Parent" }),
        h(DrawerPortal, null, {
          default: () =>
            h(DrawerViewport, null, {
              default: () => [
                h(DrawerBackdrop),
                h(
                  DrawerPopup,
                  { id: "parent-popup" },
                  {
                    default: () => [
                      h(DrawerTitle, null, { default: () => "Parent" }),
                      h(DrawerRoot, null, {
                        default: () => [
                          h(DrawerTrigger, { id: "child-trigger" }, { default: () => "Child" }),
                          h(DrawerPortal, null, {
                            default: () =>
                              h(DrawerViewport, null, {
                                default: () => [
                                  h(DrawerBackdrop),
                                  h(
                                    DrawerPopup,
                                    { id: "child-popup" },
                                    {
                                      default: () =>
                                        h(DrawerTitle, null, { default: () => "Child" }),
                                    },
                                  ),
                                ],
                              }),
                          }),
                        ],
                      }),
                    ],
                  },
                ),
              ],
            }),
        }),
      ],
    });
    const host = mount(parent);
    host.querySelector<HTMLButtonElement>("#parent-trigger")!.click();
    await nextTick();
    document.body.querySelector<HTMLButtonElement>("#child-trigger")!.click();
    await nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await nextTick();
    expect(document.body.querySelector<HTMLDialogElement>("#parent-popup")!.open).toBe(true);
    const childPopup = document.body.querySelector<HTMLDialogElement>("#child-popup")!;
    await waitForDialogClosed(childPopup);
    expect(childPopup.open).toBe(false);
  });

  it("recreates changed options while open and cleans locks without proposals", async () => {
    const state = reactive({ modal: true, show: true });
    const proposals: boolean[] = [];
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        state.show
          ? tree({ modal: state.modal, onOpenChange: (open: boolean) => proposals.push(open) })
          : null,
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    host.querySelector<HTMLButtonElement>("[data-sw-drawer-trigger]")!.click();
    await nextTick();
    proposals.length = 0;
    state.modal = false;
    await nextTick();
    await nextTick();
    await nextTick();
    expect(document.body.querySelector<HTMLDialogElement>("dialog")!.open).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(proposals).toEqual([]);
    state.show = false;
    await nextTick();
    expect(document.body.querySelector("[data-sw-drawer]")).toBeNull();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });
});

function tree(
  root: Record<string, unknown> = {},
  portal: {
    container?: HTMLElement;
    disabled?: boolean;
    side?: "top" | "right" | "bottom" | "left";
  } = {},
) {
  return h(DrawerRoot, root, {
    default: () => [
      h(DrawerTrigger, null, { default: () => "Open" }),
      h(
        DrawerPortal,
        { container: portal.container, disabled: portal.disabled },
        {
          default: () =>
            h(DrawerViewport, null, {
              default: () => [
                h(DrawerBackdrop),
                h(
                  DrawerPopup,
                  { side: portal.side },
                  {
                    default: () => [
                      h(DrawerTitle, null, { default: () => "Drawer" }),
                      h(DrawerDescription, null, { default: () => "Details" }),
                      h("button", { autofocus: true }, "First"),
                      h(DrawerClose, null, { default: () => "Close" }),
                    ],
                  },
                ),
              ],
            }),
        },
      ),
    ],
  });
}

function mount(vnode: ReturnType<typeof h>): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({ render: () => vnode });
  app.mount(host);
  cleanups.push(() => app.unmount());
  return host;
}

async function waitForDialogClosed(dialog: HTMLDialogElement): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (!dialog.open) return;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  throw new Error("Drawer did not reach its closed native state.");
}
