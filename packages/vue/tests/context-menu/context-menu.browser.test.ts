import {
  type ContextMenuOpenChangeDetails,
  createContextMenu,
} from "@starwind-ui/runtime/context-menu";
import {
  ContextMenuCheckboxItem,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuPortal,
  ContextMenuPositioner,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRoot,
  ContextMenuSubmenuRoot,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
} from "@starwind-ui/vue/context-menu";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, h, nextTick, reactive } from "vue";
import { testAcceptedModelPublication } from "../accepted-model-publication.js";

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

  it.each(["closeDelay", "modal", "disabled"])(
    "keeps the open invocation point when %s recreates Runtime on the same root",
    async (option) => {
      const rootProps = reactive({ closeDelay: 200, modal: false, disabled: false });
      const onOpenChange = vi.fn();
      const onOpenUpdate = vi.fn();
      const { app, host, trigger } = mountContextMenu({ rootProps, onOpenChange, onOpenUpdate });
      await frame();
      const root = host.querySelector<HTMLElement>("[data-sw-context-menu]")!;
      const original = createContextMenu(root);
      dispatchContextMenu(trigger, 300, 240);
      await frame();
      const popup = document.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
      const before = popup.getBoundingClientRect();
      const oldAnchor = document.querySelector<HTMLElement>("[data-sw-context-menu-anchor]")!;
      expect(original.getOpen()).toBe(true);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenUpdate).toHaveBeenCalledTimes(1);

      if (option === "closeDelay") rootProps.closeDelay = 340;
      else if (option === "modal") rootProps.modal = true;
      else rootProps.disabled = true;
      await frame();
      await frame();
      const recreated = createContextMenu(root);
      const anchor = document.querySelector<HTMLElement>("[data-sw-context-menu-anchor]")!;
      expect(host.querySelector("[data-sw-context-menu]")).toBe(root);
      expect(recreated).not.toBe(original);
      expect(recreated.getOpen()).toBe(true);
      expect(oldAnchor.isConnected).toBe(false);
      expect(anchor).not.toBe(oldAnchor);
      expect(document.querySelectorAll("[data-sw-context-menu-anchor]")).toHaveLength(1);
      expect([
        anchor.style.left,
        anchor.style.top,
        anchor.style.width,
        anchor.style.height,
      ]).toEqual(["300px", "240px", "0px", "0px"]);
      expect(popup.hidden).toBe(false);
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(popup.getBoundingClientRect().left).toBeCloseTo(before.left);
      expect(popup.getBoundingClientRect().top).toBeCloseTo(before.top);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenUpdate).toHaveBeenCalledTimes(1);

      app.unmount();
      expect(anchor.isConnected).toBe(false);
      expect(document.querySelector("[data-sw-context-menu-anchor]")).toBeNull();
      expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    },
  );

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
  rootProps?: { closeDelay: number; modal: boolean; disabled: boolean };
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
      ...options.rootProps,
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

testAcceptedModelPublication({
  name: "context-menu",
  model: "open",
  proposal: "onOpenChange",
  domEvent: "starwind:open-change",
  initial: false,
  accepted: true,
  tree: () => renderContextMenu({}),
  root: "[data-sw-context-menu]",
  act: (root) =>
    dispatchContextMenu(root.querySelector<HTMLElement>("[data-sw-context-menu-trigger]")!, 30, 40),
  read: (root) => root.getAttribute("data-state") === "open",
});

describe("accepted item models", () => {
  for (const kind of ["checkbox", "radio"] as const) {
    for (const bound of [false, true]) {
      for (const veto of ["callback", "ancestor"] as const) {
        it(`${kind} ${bound ? "bound" : "unbound"} waits for ${veto} acceptance`, async () => {
          const state = reactive({ checked: false, value: "a", cancel: true });
          const updates: unknown[] = [];
          const snapshots: number[] = [];
          const host = document.createElement("div");
          document.body.append(host);
          const proposal = (_value: unknown, detail: { cancel(): void }) => {
            if (state.cancel && veto === "callback") detail.cancel();
          };
          const app = createApp({
            render: () =>
              h(ContextMenuRoot, { defaultOpen: true }, () => [
                h(ContextMenuTrigger, null, () => "Actions"),
                h(ContextMenuPortal, { disabled: true }, () =>
                  h(ContextMenuPositioner, null, () =>
                    h(ContextMenuPopup, null, () =>
                      kind === "checkbox"
                        ? h(
                            ContextMenuCheckboxItem,
                            {
                              ...(bound ? { checked: state.checked } : {}),
                              onCheckedChange: proposal,
                              "onUpdate:checked": (next: boolean) => {
                                updates.push(next);
                                if (bound) state.checked = next;
                              },
                            },
                            () => "Check",
                          )
                        : h(
                            ContextMenuRadioGroup,
                            {
                              defaultValue: "a",
                              ...(bound ? { modelValue: state.value } : {}),
                              onValueChange: proposal,
                              "onUpdate:modelValue": (next: string) => {
                                updates.push(next);
                                if (bound) state.value = next;
                              },
                            },
                            () => [
                              h(
                                ContextMenuRadioItem,
                                { value: "a", closeOnClick: false },
                                () => "A",
                              ),
                              h(
                                ContextMenuRadioItem,
                                { value: "b", closeOnClick: false },
                                () => "B",
                              ),
                            ],
                          ),
                    ),
                  ),
                ),
              ]),
          });
          app.mount(host);
          try {
            await frame();
            const eventName =
              kind === "checkbox" ? "starwind:checked-change" : "starwind:value-change";
            host.addEventListener(eventName, (event) => {
              snapshots.push(updates.length);
              if (state.cancel && veto === "ancestor") event.preventDefault();
            });
            const item = host.querySelector<HTMLElement>(
              kind === "checkbox"
                ? "[data-sw-menu-checkbox-item]"
                : '[data-sw-menu-radio-item][data-value="b"]',
            )!;
            item.click();
            await frame();
            expect(updates).toEqual([]);
            expect(item.getAttribute("aria-checked")).toBe("false");
            state.cancel = false;
            item.click();
            state.cancel = true;
            const second =
              kind === "checkbox"
                ? item
                : host.querySelector<HTMLElement>('[data-sw-menu-radio-item][data-value="a"]')!;
            second.click();
            await frame();
            expect(updates).toEqual([kind === "checkbox" ? true : "b"]);
            expect(snapshots).toEqual([0, 0, 0]);
            expect(item.getAttribute("aria-checked")).toBe("true");
          } finally {
            app.unmount();
            host.remove();
          }
        });
      }
    }
    for (const action of ["parent", "remove", "replace"] as const) {
      it(`${kind} drops settlement after ${action}`, async () => {
        const state = reactive({
          shown: true,
          key: 0,
          checked: undefined as boolean | undefined,
          value: undefined as string | undefined,
        });
        const updates: unknown[] = [];
        const host = document.createElement("div");
        document.body.append(host);
        const app = createApp({
          render: () =>
            h(ContextMenuRoot, { defaultOpen: true }, () => [
              h(ContextMenuTrigger, null, () => "Actions"),
              h(ContextMenuPortal, { disabled: true }, () =>
                h(ContextMenuPositioner, null, () =>
                  h(ContextMenuPopup, null, () =>
                    !state.shown
                      ? []
                      : kind === "checkbox"
                        ? h(
                            ContextMenuCheckboxItem,
                            {
                              key: state.key,
                              checked: state.checked,
                              "onUpdate:checked": (next: boolean) => updates.push(next),
                            },
                            () => "Check",
                          )
                        : h(
                            ContextMenuRadioGroup,
                            {
                              key: state.key,
                              defaultValue: "a",
                              modelValue: state.value,
                              "onUpdate:modelValue": (next: string) => updates.push(next),
                            },
                            () => [
                              h(
                                ContextMenuRadioItem,
                                { value: "a", closeOnClick: false },
                                () => "A",
                              ),
                              h(
                                ContextMenuRadioItem,
                                { value: "b", closeOnClick: false },
                                () => "B",
                              ),
                              h(
                                ContextMenuRadioItem,
                                { value: "c", closeOnClick: false },
                                () => "C",
                              ),
                            ],
                          ),
                  ),
                ),
              ),
            ]),
        });
        app.mount(host);
        try {
          await frame();
          host.addEventListener(
            kind === "checkbox" ? "starwind:checked-change" : "starwind:value-change",
            () => {
              if (action === "parent") {
                state.checked = false;
                state.value = "c";
              } else if (action === "remove") state.shown = false;
              else state.key += 1;
            },
          );
          const selector =
            kind === "checkbox"
              ? "[data-sw-menu-checkbox-item]"
              : '[data-sw-menu-radio-item][data-value="b"]';
          const old = host.querySelector<HTMLElement>(selector)!;
          old.click();
          await frame();
          expect(updates).toEqual([]);
          if (action === "parent") {
            expect(old.getAttribute("aria-checked")).toBe("false");
            if (kind === "radio")
              expect(
                host
                  .querySelector('[data-value="c"][role="menuitemradio"]')
                  ?.getAttribute("aria-checked"),
              ).toBe("true");
          } else expect(old.isConnected).toBe(false);
        } finally {
          app.unmount();
          host.remove();
        }
      });
    }
  }
});
