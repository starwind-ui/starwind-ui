import { createApp, h, nextTick, reactive, ref } from "vue";
import { afterEach, describe, expect, it } from "vitest";

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

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  document.body.innerHTML = "";
  document.body.removeAttribute("data-sw-scroll-locked");
});

describe("Vue Popover browser contract", () => {
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

  it("teleports directly to the nearest ancestor floating root on first placement", async () => {
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
              { container: overlays, id: "nested-parent-portal" },
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
    const childPositioner = childPortal.querySelector<HTMLElement>("[data-sw-popover-positioner]")!;
    expect(childPortal.parentElement).toBe(parentPortal);
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
  });

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
