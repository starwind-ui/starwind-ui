import { createPopover } from "@starwind-ui/runtime/popover";
import {
  PopoverBackdrop,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@starwind-ui/vue/popover";
import {
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipRoot,
  TooltipTrigger,
} from "@starwind-ui/vue/tooltip";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, h, nextTick, reactive, ref } from "vue";
import { testAcceptedModelPublication } from "../accepted-model-publication.js";
import { testOverlayCommandAuthority } from "../popover/command-authority.js";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  document.body.innerHTML = "";
  document.body.removeAttribute("data-sw-scroll-locked");
  vi.restoreAllMocks();
});

describe("Vue Popover browser contract", () => {
  it("shares document observation across portal families and releases unused subscriptions", async () => {
    const observers = trackPortalDocumentObservers();
    const state = reactive({ count: 3, disabled: false, tooltip: true });
    mount(
      h({
        render: () =>
          h("div", [
            ...Array.from({ length: state.count }, (_, key) =>
              tree({ key }, { container: "#shared-vue-target", disabled: state.disabled }),
            ),
            state.tooltip
              ? h(TooltipRoot, null, {
                  default: () => [
                    h(TooltipTrigger, null, { default: () => "Tooltip" }),
                    h(
                      TooltipPortal,
                      { container: "#shared-vue-target" },
                      {
                        default: () =>
                          h(TooltipPositioner, null, {
                            default: () => h(TooltipPopup, null, { default: () => "Details" }),
                          }),
                      },
                    ),
                  ],
                })
              : null,
          ]),
      }),
    );
    await waitForFloating();
    expect(document.querySelectorAll('[data-sw-portal-placement="framework"]')).toHaveLength(4);
    const shared = observers.pair(document);

    state.count = 1;
    await waitForFloating();
    expect(observers.pair(document)).toEqual(shared);

    const target = document.createElement("section");
    target.id = "shared-vue-target";
    document.body.append(target);
    await waitForFloating();
    expect(target.querySelectorAll('[data-sw-portal-placement="framework"]')).toHaveLength(2);
    expect(observers.pair(document)).toEqual(shared);

    target.remove();
    await waitForFloating();
    expect(
      document.body.querySelectorAll(':scope > [data-sw-portal-placement="framework"]'),
    ).toHaveLength(2);

    state.disabled = true;
    state.tooltip = false;
    await waitForFloating();
    expect(observers.active.size).toBe(0);

    state.disabled = false;
    await waitForFloating();
    observers.pair(document);
    state.count = 0;
    await waitForFloating();
    expect(observers.active.size).toBe(0);
  });

  it.each(["detached", "iframe"])(
    "keeps shared portal observation separate for each owner document (%s)",
    async (kind) => {
      const observers = trackPortalDocumentObservers();
      const showFirst = ref(true);
      mount(h({ render: () => (showFirst.value ? tree() : null) }));

      const frame = document.createElement("iframe");
      document.body.append(frame);
      cleanups.push(() => frame.remove());
      const otherDocument =
        kind === "iframe"
          ? frame.contentDocument!
          : document.implementation.createHTMLDocument("Vue portal owner");
      const otherObservers = trackPortalDocumentObservers(
        (frame.contentWindow as Window & typeof globalThis).MutationObserver,
      );
      const otherHost = otherDocument.createElement("div");
      otherDocument.body.append(otherHost);
      const showOther = ref(true);
      const otherApp = createApp({
        render: () => (showOther.value ? tree({}, { container: "#other-vue-target" }) : null),
      });
      otherApp.mount(otherHost);
      cleanups.push(() => otherApp.unmount());
      await waitForFloating();
      const primary = observers.pair(document);
      const foreign = observers.pair(otherDocument, otherObservers.active);
      expect(primary[0]).not.toBe(foreign[0]);

      showFirst.value = false;
      await waitForFloating();
      expect(observers.active.size + otherObservers.active.size).toBe(1);
      expect(observers.pair(otherDocument, otherObservers.active)).toEqual(foreign);

      const target = otherDocument.createElement("section");
      target.id = "other-vue-target";
      otherDocument.body.append(target);
      await waitForFloating();
      expect(target.querySelector("[data-sw-popover-portal]")).not.toBeNull();
      showOther.value = false;
      await waitForFloating();
      expect(observers.active.size + otherObservers.active.size).toBe(0);
    },
  );

  it("orders cancelable details before the named model and supports default open", async () => {
    const events: string[] = [];
    let cancel = true;
    const host = mount(
      tree({
        open: false,
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
    host.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!.click();
    await nextTick();
    expect(events).toEqual(["detail:true"]);
    expect(document.body.querySelector<HTMLElement>("[data-sw-popover-popup]")!.hidden).toBe(true);

    host.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!.click();
    await nextTick();
    expect(events).toEqual(["detail:true", "detail:true", "update:true"]);

    mount(tree({ defaultOpen: true }));
    await waitForFloating();
    const popups = document.body.querySelectorAll<HTMLElement>("[data-sw-popover-popup]");
    expect(popups[popups.length - 1]!.hidden).toBe(false);
  });

  it("delegates side, align, offsets, collisions, and fixed placement to Runtime", async () => {
    const host = mount(
      tree(
        {},
        {
          align: "end",
          avoidCollisions: false,
          collisionStrategy: "best-fit",
          side: "right",
          sideOffset: 12,
        },
      ),
    );
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!;
    trigger.style.cssText = "position:fixed;left:100px;top:100px;width:80px;height:32px";
    trigger.click();
    await waitForFloating();
    const popup = document.body.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
    const positioner = document.body.querySelector<HTMLElement>("[data-sw-popover-positioner]")!;
    expect(popup.dataset.side).toBe("right");
    expect(popup.dataset.align).toBe("end");
    expect(popup.dataset.sideOffset).toBe("12");
    expect(popup.dataset.avoidCollisions).toBe("false");
    expect(popup.dataset.collisionStrategy).toBe("best-fit");
    expect(positioner.style.position).toBe("fixed");
    expect(positioner.style.left).not.toBe("");
    expect(positioner.style.top).not.toBe("");
  });

  it("keeps default and hover opens non-locking while modal click opens lock", async () => {
    const plain = mount(tree());
    plain.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!.click();
    await nextTick();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    const modal = mount(tree({ modal: true }));
    modal.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!.click();
    await nextTick();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    const closeButtons =
      document.body.querySelectorAll<HTMLButtonElement>("[data-sw-popover-close]");
    closeButtons[closeButtons.length - 1]!.click();
    await nextTick();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    const hover = mount(tree({ modal: true, openOnHover: true }));
    hover
      .querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!
      .dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    await waitForFloating();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("teleports to custom targets, stays inline when disabled, and cleans owner remounts", async () => {
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
    expect(target.querySelector("[data-sw-popover-portal]")).not.toBeNull();
    show.value = false;
    await nextTick();
    expect(target.querySelector("[data-sw-popover-portal]")).toBeNull();
    show.value = true;
    await nextTick();
    expect(target.querySelector("[data-sw-popover-portal]")).not.toBeNull();

    const inlineHost = mount(tree({}, { disabled: true }));
    expect(inlineHost.querySelector("[data-sw-popover-portal]")).not.toBeNull();
  });

  it("keeps the public wrapper as the sole placement owner across live targets", async () => {
    const first = document.createElement("section");
    const second = document.createElement("section");
    document.body.append(first, second);
    const portal = reactive<{ container: string | HTMLElement; disabled: boolean }>({
      container: first,
      disabled: false,
    });
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () => tree({ defaultOpen: true }, portal),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    await waitForFloating();
    const wrapper = () => document.querySelector<HTMLElement>("[data-sw-popover-portal]")!;
    const positioner = () => document.querySelector<HTMLElement>("[data-sw-popover-positioner]")!;
    expect(wrapper().parentElement).toBe(first);
    expect(wrapper().contains(positioner())).toBe(true);
    expect(wrapper().dataset.swPortalPlacement).toBe("framework");
    expect(wrapper().dataset.placement).toBe("ready");

    portal.container = second;
    await waitForFloating();
    expect(wrapper().parentElement).toBe(second);
    expect(wrapper().contains(positioner())).toBe(true);

    portal.container = "[invalid";
    await waitForFloating();
    expect(wrapper().parentElement).toBe(document.body);
    expect(wrapper().contains(positioner())).toBe(true);

    portal.container = "#late-portal-target";
    await waitForFloating();
    expect(wrapper().parentElement).toBe(document.body);
    const lateTarget = document.createElement("section");
    lateTarget.id = "late-portal-target";
    document.body.append(lateTarget);
    await waitForFloating();
    expect(wrapper().parentElement).toBe(lateTarget);
    lateTarget.remove();
    await waitForFloating();
    expect(wrapper().parentElement).toBe(document.body);

    portal.disabled = true;
    await waitForFloating();
    expect(host.querySelector("[data-sw-popover-portal]")).toBe(wrapper());
    expect(wrapper().contains(positioner())).toBe(true);
  });

  it.each([false, true])(
    "uses only explicit ancestor floating roots (host=%s)",
    async (explicitHost) => {
      const overlays = document.createElement("section");
      document.body.append(overlays);
      const host = mount(
        h(
          PopoverRoot,
          { defaultOpen: true },
          {
            default: () => [
              h(PopoverTrigger, { id: "nested-parent-trigger" }, { default: () => "Parent" }),
              h(
                PopoverPortal,
                {
                  container: overlays,
                  id: "nested-parent-portal",
                  "data-floating-root": explicitHost ? "" : undefined,
                },
                {
                  default: () =>
                    h(PopoverPositioner, null, {
                      default: () =>
                        h(
                          PopoverPopup,
                          { id: "nested-parent-popup" },
                          {
                            default: () =>
                              h(PopoverRoot, null, {
                                default: () => [
                                  h(
                                    PopoverTrigger,
                                    { id: "nested-child-trigger" },
                                    { default: () => "Child" },
                                  ),
                                  h(
                                    PopoverPortal,
                                    { id: "nested-child-portal" },
                                    {
                                      default: () =>
                                        h(PopoverPositioner, null, {
                                          default: () =>
                                            h(PopoverPopup, { id: "nested-child-popup" }),
                                        }),
                                    },
                                  ),
                                ],
                              }),
                          },
                        ),
                    }),
                },
              ),
            ],
          },
        ),
      );
      await waitForFloating();

      const parentPortal = overlays.querySelector<HTMLElement>("#nested-parent-portal")!;
      const childPortal = document.querySelector<HTMLElement>("#nested-child-portal")!;
      const childPositioner = childPortal.querySelector<HTMLElement>(
        "[data-sw-popover-positioner]",
      )!;
      expect(childPortal.parentElement).toBe(explicitHost ? parentPortal : document.body);
      expect(childPortal.dataset.container).toBeUndefined();
      expect(childPortal.dataset.placement).toBe("ready");
      expect(childPortal.contains(childPositioner)).toBe(true);

      host.ownerDocument.querySelector<HTMLButtonElement>("#nested-child-trigger")!.click();
      await waitForFloating();
      expect(childPositioner.style.left).not.toBe("");
      expect(childPositioner.style.top).not.toBe("");

      document.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      );
      await nextTick();
      expect(document.querySelector<HTMLElement>("#nested-child-popup")!.hidden).toBe(true);
      expect(overlays.querySelector<HTMLElement>("#nested-parent-popup")!.hidden).toBe(false);
    },
  );

  it("completes inline readiness and resumes placement across live disabled toggles", async () => {
    const state = reactive({ disabled: false });
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () => tree({ defaultOpen: true }, { disabled: state.disabled }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await waitForFloating();

    const wrapper = () => document.querySelector<HTMLElement>("[data-sw-popover-portal]")!;
    const popup = () => document.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
    const positioner = () => document.querySelector<HTMLElement>("[data-sw-popover-positioner]")!;
    expect(wrapper().dataset.placement).toBe("ready");
    expect(wrapper().parentElement).toBe(document.body);
    expect(positioner().style.left).not.toBe("");

    state.disabled = true;
    await waitForFloating();
    expect(wrapper().dataset.placement).toBe("ready");
    expect(host.contains(wrapper())).toBe(true);
    expect(wrapper().contains(positioner())).toBe(true);
    expect(positioner().style.left).not.toBe("");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );
    await nextTick();
    expect(popup().hidden).toBe(true);
    host.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!.click();
    await waitForFloating();
    expect(popup().hidden).toBe(false);
    expect(wrapper().dataset.placement).toBe("ready");

    state.disabled = false;
    await waitForFloating();
    expect(wrapper().parentElement).toBe(document.body);
    expect(wrapper().dataset.placement).toBe("ready");
    expect(positioner().style.left).not.toBe("");
  });

  it("strict Trigger asChild preserves one native semantic element, attrs, listeners, and refs", async () => {
    const triggerRef = ref<{ element: HTMLElement | null } | null>(null);
    let clicks = 0;
    const host = mount(
      h(PopoverRoot, null, {
        default: () => [
          h(
            PopoverTrigger,
            { asChild: true, class: "wrapper", ref: triggerRef },
            {
              default: () =>
                h("button", { class: "child", onClick: () => clicks++ }, "Composed trigger"),
            },
          ),
          h(PopoverPopup),
        ],
      }),
    );
    const buttons = host.querySelectorAll("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.classList.contains("wrapper")).toBe(true);
    expect(buttons[0]!.classList.contains("child")).toBe(true);
    expect(triggerRef.value?.element).toBe(buttons[0]);
    buttons[0]!.click();
    await nextTick();
    expect(clicks).toBe(1);
    expect(buttons[0]!.getAttribute("aria-expanded")).toBe("true");
  });

  it("honors Escape, outside dismissal, focus return, and presence cleanup", async () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    const host = mount(tree());
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!;
    trigger.focus();
    trigger.click();
    await waitForFloating();
    const popup = document.body.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
    expect(popup.hidden).toBe(false);
    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );
    await nextTick();
    expect(popup.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    await nextTick();
    outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await nextTick();
    expect(popup.hidden).toBe(true);
  });

  it.each([
    ["mounts after the root inside a Portal", true, [true]],
    ["mounts after the root without a Portal", false, [true]],
    ["is hidden and shown again inside a Portal", true, [true, false, true]],
    ["is hidden and shown again inside a mounted Portal", "mounted", [true, false, true]],
    ["is hidden and shown again without a Portal", false, [true, false, true]],
    ["is replaced inside a mounted Portal", "mounted", [true, "replace"]],
    ["is replaced without a Portal", false, [true, "replace"]],
  ] as const)("opens and closes a Popup that %s", async (_name, portal, sequence) => {
    const { show, key, trigger, popup } = mountTogglePopover(portal);
    await waitForFloating();
    expect(popup()).toBeNull();
    for (const value of sequence) {
      if (value === "replace") key.value++;
      else show.value = value;
      await waitForFloating();
    }
    expect(popup()!.hidden).toBe(true);

    trigger().focus();
    trigger().click();
    await waitForFloating();
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(popup()!.hidden).toBe(false);

    await pressEscape();
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(popup()!.hidden).toBe(true);
  });

  it.each([
    ["inside a Portal", true],
    ["without a Portal", false],
  ])("recovers when an open Popup unmounts and mounts again %s", async (_name, withPortal) => {
    const { show, trigger, popup, root, proposals } = mountTogglePopover(withPortal, true);
    show.value = true;
    await waitForFloating();
    trigger().click();
    await waitForFloating();
    expect(popup()!.hidden).toBe(false);
    proposals.length = 0;

    show.value = false;
    await waitForFloating();
    expect(root().getAttribute("data-state")).toBe("closed");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    show.value = true;
    await waitForFloating();
    expect(root().getAttribute("data-state")).toBe("open");
    expect(popup()!.hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(proposals).toEqual([]);

    await pressEscape();
    expect(root().getAttribute("data-state")).toBe("closed");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(popup()!.hidden).toBe(true);

    trigger().click();
    await waitForFloating();
    expect(root().getAttribute("data-state")).toBe("open");
    expect(popup()!.hidden).toBe(false);
  });

  it.each([
    ["inside a Portal", true],
    ["without a Portal", false],
  ])("keeps an open Popup open when its placement changes %s", async (_name, withPortal) => {
    const side = ref<"bottom" | "top">("bottom");
    const proposals: boolean[] = [];
    const popup = () =>
      h(PopoverPopup, { id: "side-popup", side: side.value }, { default: () => h("input") });
    const host = mount(
      h({
        render: () =>
          h(
            PopoverRoot,
            { modal: true, onOpenChange: (open: boolean) => proposals.push(open) },
            {
              default: () => [
                h(PopoverTrigger, { id: "side-trigger" }, { default: () => "Open" }),
                withPortal ? h(PopoverPortal, null, { default: popup }) : popup(),
              ],
            },
          ),
      }),
    );
    await waitForFloating();
    host.querySelector<HTMLButtonElement>("#side-trigger")!.click();
    await waitForFloating();
    const input = document.body.querySelector<HTMLInputElement>("#side-popup input")!;
    input.focus();
    proposals.length = 0;

    side.value = "top";
    await waitForFloating();
    expect(document.body.querySelector<HTMLElement>("#side-popup")!.hidden).toBe(false);
    expect(document.activeElement).toBe(input);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(proposals).toEqual([]);
  });

  it("removes a hidden open Positioner subtree and positions the new one", async () => {
    const show = ref(true);
    const host = mount(
      h({
        render: () =>
          h(PopoverRoot, null, {
            default: () => [
              h(PopoverTrigger, { id: "positioned-trigger" }, { default: () => "Open" }),
              show.value
                ? h(
                    PopoverPositioner,
                    { id: "positioned-positioner" },
                    { default: () => h(PopoverPopup, { id: "positioned-popup" }) },
                  )
                : null,
            ],
          }),
      }),
    );
    await waitForFloating();
    const trigger = host.querySelector<HTMLButtonElement>("#positioned-trigger")!;
    trigger.click();
    await waitForFloating();
    const oldPositioner = document.querySelector<HTMLElement>("#positioned-positioner")!;
    expect(document.querySelector<HTMLElement>("#positioned-popup")!.hidden).toBe(false);

    show.value = false;
    await waitForFloating();
    expect(document.querySelector("#positioned-positioner")).toBeNull();
    expect(document.querySelector("#positioned-popup")).toBeNull();
    expect(oldPositioner.isConnected).toBe(false);

    show.value = true;
    await waitForFloating();
    const positioner = document.querySelector<HTMLElement>("#positioned-positioner")!;
    const popup = document.querySelector<HTMLElement>("#positioned-popup")!;
    expect(document.querySelectorAll("#positioned-positioner")).toHaveLength(1);
    expect(positioner).not.toBe(oldPositioner);
    expect(popup.hidden).toBe(false);
    expect(positioner.style.transform || positioner.style.left || positioner.style.top).not.toBe(
      "",
    );

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );
    await waitForFloating();
    expect(popup.hidden).toBe(true);
    trigger.click();
    await waitForFloating();
    expect(popup.hidden).toBe(false);
  });

  it.each([
    ["inside a Portal", true],
    ["without a Portal", false],
  ])("opens a default-open Popover on mount %s", async (_name, withPortal) => {
    const errors = vi.spyOn(console, "error");
    const warnings = vi.spyOn(console, "warn");
    const popup = () => h(PopoverPopup, { id: "default-popup" }, { default: () => "Details" });
    const host = mount(
      h(
        PopoverRoot,
        { defaultOpen: true },
        {
          default: () => [
            h(PopoverTrigger, { id: "default-trigger" }, { default: () => "Open" }),
            withPortal ? h(PopoverPortal, null, { default: popup }) : popup(),
          ],
        },
      ),
    );
    await waitForFloating();
    const trigger = host.querySelector<HTMLButtonElement>("#default-trigger")!;
    expect(document.querySelector<HTMLElement>("#default-popup")!.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await pressEscape();
    expect(document.querySelector<HTMLElement>("#default-popup")!.hidden).toBe(true);
    trigger.click();
    await waitForFloating();
    expect(document.querySelector<HTMLElement>("#default-popup")!.hidden).toBe(false);
    expect(errors).not.toHaveBeenCalled();
    expect(warnings).not.toHaveBeenCalled();
  });

  it("closes only the nested topmost Popover on Escape", async () => {
    const host = mount(
      h(PopoverRoot, null, {
        default: () => [
          h(PopoverTrigger, { id: "parent-trigger" }, { default: () => "Parent" }),
          h(PopoverPortal, null, {
            default: () =>
              h(
                PopoverPopup,
                { id: "parent-popup" },
                {
                  default: () =>
                    h(PopoverRoot, null, {
                      default: () => [
                        h(PopoverTrigger, { id: "child-trigger" }, { default: () => "Child" }),
                        h(PopoverPortal, null, {
                          default: () => h(PopoverPopup, { id: "child-popup" }),
                        }),
                      ],
                    }),
                },
              ),
          }),
        ],
      }),
    );
    host.querySelector<HTMLButtonElement>("#parent-trigger")!.click();
    await waitForFloating();
    document.body.querySelector<HTMLButtonElement>("#child-trigger")!.click();
    await waitForFloating();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );
    await nextTick();
    expect(document.body.querySelector<HTMLElement>("#parent-popup")!.hidden).toBe(false);
    expect(document.body.querySelector<HTMLElement>("#child-popup")!.hidden).toBe(true);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );
    await nextTick();
    expect(document.body.querySelector<HTMLElement>("#parent-popup")!.hidden).toBe(true);
  });

  it("recreates constructor options while open without proposals and cleans locks", async () => {
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
    host.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!.click();
    await nextTick();
    proposals.length = 0;
    state.modal = false;
    await nextTick();
    await nextTick();
    expect(document.body.querySelector<HTMLElement>("[data-sw-popover-popup]")!.hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(proposals).toEqual([]);
    state.show = false;
    await nextTick();
    expect(document.body.querySelector("[data-sw-popover]")).toBeNull();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });
});

function tree(
  root: Record<string, unknown> = {},
  portal: {
    align?: "start" | "center" | "end";
    avoidCollisions?: boolean;
    collisionStrategy?: "initial-placement" | "best-fit";
    container?: string | HTMLElement;
    disabled?: boolean;
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
  } = {},
) {
  const floatingProps = {
    align: portal.align,
    avoidCollisions: portal.avoidCollisions,
    collisionStrategy: portal.collisionStrategy,
    side: portal.side,
    sideOffset: portal.sideOffset,
  };
  return h(PopoverRoot, root, {
    default: () => [
      h(PopoverTrigger, null, { default: () => "Open" }),
      h(
        PopoverPortal,
        { container: portal.container, disabled: portal.disabled },
        {
          default: () => [
            h(PopoverBackdrop),
            h(PopoverPositioner, floatingProps, {
              default: () =>
                h(PopoverPopup, floatingProps, {
                  default: () => [
                    h(PopoverTitle, null, { default: () => "Popover" }),
                    h(PopoverDescription, null, { default: () => "Details" }),
                    h("button", { autofocus: true }, "First"),
                    h(PopoverClose, null, { default: () => "Close" }),
                  ],
                }),
            }),
          ],
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

async function waitForFloating(): Promise<void> {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
}

function trackPortalDocumentObservers(Observer = MutationObserver) {
  const observers = new Map<MutationObserver, { owner: Document; purpose: string }>();
  const nativeObserve = Observer.prototype.observe;
  const nativeDisconnect = Observer.prototype.disconnect;
  vi.spyOn(Observer.prototype, "observe").mockImplementation(function (
    this: MutationObserver,
    target,
    options,
  ) {
    if (target.nodeType === Node.DOCUMENT_NODE) {
      // Runtime reads direction without a document observer; only placement observes.
      expect(options).toEqual({ childList: true, subtree: true });
      observers.set(this, { owner: target as Document, purpose: "placement" });
    }
    nativeObserve.call(this, target, options);
  });
  vi.spyOn(Observer.prototype, "disconnect").mockImplementation(function (this: MutationObserver) {
    observers.delete(this);
    nativeDisconnect.call(this);
  });
  return {
    active: observers,
    pair(
      owner: Document,
      foreign = new Map<MutationObserver, { owner: Document; purpose: string }>(),
    ) {
      return ["placement"].map((purpose) => {
        const matching = [...observers, ...foreign].filter(
          ([, entry]) => entry.owner === owner && entry.purpose === purpose,
        );
        expect(
          matching,
          purpose +
            " in " +
            owner.URL +
            ": " +
            [...observers.values(), ...foreign.values()]
              .map((entry) => entry.purpose + "@" + entry.owner.URL)
              .join(","),
        ).toHaveLength(1);
        return matching[0]![0];
      });
    },
  };
}

testAcceptedModelPublication({
  name: "popover",
  model: "open",
  proposal: "onOpenChange",
  domEvent: "starwind:open-change",
  initial: false,
  accepted: true,
  tree: () => tree({}, { disabled: true }),
  root: "[data-sw-popover]",
  act: (root) => root.querySelector<HTMLElement>("[data-sw-popover-trigger]")!.click(),
  read: (root) => root.getAttribute("data-state") === "open",
});

testOverlayCommandAuthority({ name: "popover", tree: tree, controller: createPopover, cleanups });

function mountTogglePopover(portal: boolean | "mounted", modal = false) {
  const show = ref(false);
  const key = ref(0);
  const proposals: boolean[] = [];
  const latePopup = () =>
    show.value
      ? h(PopoverPopup, { id: "late-popup", key: key.value }, { default: () => "Late" })
      : null;
  const host = mount(
    h({
      render: () =>
        h(
          PopoverRoot,
          { modal, onOpenChange: (open: boolean) => proposals.push(open) },
          {
            default: () => [
              h(PopoverTrigger, { id: "late-trigger" }, { default: () => "Open" }),
              portal === "mounted" || (portal && show.value)
                ? h(PopoverPortal, null, { default: latePopup })
                : latePopup(),
            ],
          },
        ),
    }),
  );
  return {
    show,
    key,
    proposals,
    root: () => host.querySelector<HTMLElement>("[data-sw-popover]")!,
    trigger: () => host.querySelector<HTMLButtonElement>("#late-trigger")!,
    popup: () => document.body.querySelector<HTMLElement>("#late-popup"),
  };
}

async function pressEscape(): Promise<void> {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
  );
  await waitForFloating();
}
