import { createApp, h, nextTick, reactive } from "vue";
import { afterEach, describe, expect, it } from "vitest";

import {
  PreviewCardArrow,
  PreviewCardBackdrop,
  PreviewCardPopup,
  PreviewCardPortal,
  PreviewCardPositioner,
  PreviewCardRoot,
  PreviewCardTrigger,
  PreviewCardViewport,
} from "@starwind-ui/vue/preview-card";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  document.body.innerHTML = "";
});

describe("Vue Preview Card browser contract", () => {
  it("honors hover delay, focus, transit, presence, placement, and cleanup", async () => {
    const changes: boolean[] = [];
    const host = mount(
      tree(
        { closeDelay: 80, openDelay: 150, onOpenChange: (open: boolean) => changes.push(open) },
        { align: "start", avoidCollisions: false, side: "top" },
      ),
    );
    const trigger = host.querySelector<HTMLElement>("[data-sw-preview-card-trigger]")!;
    pointer(trigger, "pointerenter");
    await wait(30);
    expect(changes).toEqual([]);
    await wait(150);
    expect(changes).toEqual([true]);
    expect(popup().hidden).toBe(false);
    expect(popup().dataset.side).toBe("top");
    expect(popup().dataset.align).toBe("start");
    pointer(trigger, "pointerleave");
    pointer(popup(), "pointerenter");
    await wait(100);
    expect(popup().hidden).toBe(false);
    pointer(popup(), "pointerleave");
    await wait(100);
    expect(changes).toEqual([true, false]);

    trigger.focus();
    await wait(160);
    expect(changes).toEqual([true, false, true]);
    expect(popup().hidden).toBe(false);
    cleanups.pop()?.();
    await nextTick();
    expect(document.body.querySelector("[data-sw-preview-card-portal]")).toBeNull();
  });

  it("orders cancelable detailed events before accepted model updates", async () => {
    const events: string[] = [];
    let cancel = true;
    const host = mount(
      tree({
        openDelay: 0,
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
    const trigger = host.querySelector<HTMLElement>("[data-sw-preview-card-trigger]")!;
    pointer(trigger, "pointerenter");
    await nextTick();
    expect(events).toEqual(["detail:true"]);
    pointer(trigger, "pointerleave");
    pointer(trigger, "pointerenter");
    await nextTick();
    expect(events).toEqual(["detail:true", "detail:true", "update:true"]);
  });

  it("projects disabled anchor behavior and isolates multiple instances", async () => {
    const disabled = mount(tree({}, {}, { disabled: true, href: "#profile" }));
    const link = disabled.querySelector<HTMLAnchorElement>("[data-sw-preview-card-trigger]")!;
    expect(link.hasAttribute("href")).toBe(false);
    expect(link.tabIndex).toBe(-1);

    const firstEvents: boolean[] = [];
    const secondEvents: boolean[] = [];
    const first = mount(
      tree({ openDelay: 0, onOpenChange: (open: boolean) => firstEvents.push(open) }),
    );
    mount(
      tree({ open: false, openDelay: 0, onOpenChange: (open: boolean) => secondEvents.push(open) }),
    );
    pointer(first.querySelector("[data-sw-preview-card-trigger]")!, "pointerenter");
    await nextTick();
    const popups = document.body.querySelectorAll<HTMLElement>("[data-sw-preview-card-popup]");
    expect(popups).toHaveLength(3);
    expect(firstEvents).toEqual([true]);
    expect(secondEvents).toEqual([]);
  });

  it("recreates constructor options against inline portal DOM and keeps one live controller", async () => {
    const state = reactive({ openDelay: 0 });
    const events: boolean[] = [];
    const errors: unknown[] = [];
    const host = mountRender(
      () =>
        tree({
          closeDelay: 10,
          openDelay: state.openDelay,
          onOpenChange: (open: boolean) => events.push(open),
        }),
      errors,
    );
    const trigger = host.querySelector<HTMLElement>("[data-sw-preview-card-trigger]")!;
    pointer(trigger, "pointerenter");
    await nextTick();
    expect(events).toEqual([true]);

    state.openDelay = 20;
    await nextTick();
    await nextTick();
    expect(errors).toEqual([]);
    pointer(trigger, "pointerleave");
    await wait(20);
    expect(events).toEqual([true, false]);
    trigger.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    await wait(30);
    expect(events).toEqual([true, false, true]);

    cleanups.pop()?.();
    await nextTick();
    expect(document.body.querySelector("[data-sw-preview-card-portal]")).toBeNull();
  });
});

function tree(
  root: Record<string, unknown> = {},
  floating: Record<string, unknown> = {},
  trigger: Record<string, unknown> = { href: "#profile" },
) {
  return h(PreviewCardRoot, root, {
    default: () => [
      h(PreviewCardTrigger, trigger, { default: () => "Profile" }),
      h(PreviewCardPortal, null, {
        default: () => [
          h(PreviewCardBackdrop),
          h(PreviewCardPositioner, floating, {
            default: () =>
              h(PreviewCardViewport, null, {
                default: () =>
                  h(PreviewCardPopup, floating, {
                    default: () => ["Profile details", h(PreviewCardArrow)],
                  }),
              }),
          }),
        ],
      }),
    ],
  });
}

function mount(vnode: ReturnType<typeof h>): HTMLElement {
  return mountRender(() => vnode);
}

function mountRender(render: () => ReturnType<typeof h>, errors: unknown[] = []): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({ render });
  app.config.errorHandler = (error) => errors.push(error);
  app.mount(host);
  cleanups.push(() => app.unmount());
  return host;
}

function popup(): HTMLElement {
  return document.body.querySelector<HTMLElement>("[data-sw-preview-card-popup]")!;
}

function pointer(element: Element, type: string): void {
  element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" }));
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
  await nextTick();
}
