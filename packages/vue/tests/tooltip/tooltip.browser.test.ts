import {
  createApp,
  defineComponent,
  h,
  nextTick,
  reactive,
  ref,
  type ComponentPublicInstance,
  type VNode,
} from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TooltipArrow,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipRoot,
  TooltipTrigger,
} from "@starwind-ui/vue/tooltip";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Tooltip browser contract", () => {
  it.each([false, true])(
    "applies a newer parent %s command during nextTick recreation",
    async (command) => {
      const state = reactive({ open: !command, delay: 0 });
      const changes: boolean[] = [];
      mountRender(() =>
        tree({
          open: state.open,
          openDelay: state.delay,
          onOpenChange: (open: boolean) => changes.push(open),
        }),
      );
      await wait(40);
      expect(popup().hidden).toBe(command);
      state.delay = 20;
      void nextTick(() => {
        state.open = command;
      });
      await wait(40);
      expect(popup().hidden).toBe(!command);
      expect(changes).toEqual([]);
    },
  );

  for (const controlled of [false, true]) {
    it(`retains accepted second-trigger geometry during recreation (${controlled ? "controlled" : "uncontrolled"})`, async () => {
      const state = reactive({
        open: false,
        delay: 0,
        cancel: false,
        revision: 0,
        showSecond: true,
        foreign: false,
        callback: 0,
      });
      const changes: boolean[] = [];
      const host = mountRender(() =>
        h(
          TooltipRoot,
          {
            ...(controlled ? { open: state.open } : {}),
            openDelay: state.delay,
            closeDelay: 0,
            onOpenChange: ((_revision: number) => (open: boolean, detail: { cancel(): void }) => {
              changes.push(open);
              if (state.cancel) detail.cancel();
            })(state.callback),
            "onUpdate:open": (open: boolean) => {
              if (controlled) state.open = open;
            },
          },
          {
            default: () => [
              ...["a", ...(state.showSecond ? ["b"] : [])].map((id, index) =>
                h("div", { "data-sw-tooltip": id === "b" && state.foreign ? "" : undefined }, [
                  h(
                    TooltipTrigger,
                    { asChild: true },
                    {
                      default: () =>
                        h(
                          "button",
                          {
                            key: id === "a" ? state.revision : 0,
                            "data-anchor": id,
                            ref: ((_revision: number) => (_node: unknown) => {})(state.callback),
                            style: `position:fixed;left:${100 + index * 300}px;top:100px;width:60px;height:30px`,
                          },
                          id,
                        ),
                    },
                  ),
                ]),
              ),
              h(TooltipPortal, null, {
                default: () =>
                  h(
                    TooltipPositioner,
                    { side: "bottom", align: "start", avoidCollisions: false },
                    {
                      default: () =>
                        h(
                          TooltipPopup,
                          { style: "width:80px;height:30px" },
                          { default: () => "Details" },
                        ),
                    },
                  ),
              }),
            ],
          },
        ),
      );
      const [a, b] = [...host.querySelectorAll<HTMLElement>("[data-anchor]")];
      const at = (anchor: HTMLElement) =>
        expect(
          Math.abs(popup().getBoundingClientRect().left - anchor.getBoundingClientRect().left),
        ).toBeLessThan(2);
      pointer(a!, "pointerenter");
      await wait(40);
      at(a!);
      pointer(b!, "pointerenter");
      await wait(40);
      at(b!);
      const count = changes.length;
      state.delay = 1;
      await wait(40);
      at(b!);
      expect(changes).toHaveLength(count);
      state.revision++;
      await wait(40);
      at(b!);
      expect(changes).toHaveLength(count);
      const currentA = host.querySelector<HTMLElement>('[data-anchor="a"]')!;
      pointer(b!, "pointerleave");
      await wait(40);
      pointer(currentA, "pointerenter");
      await wait(40);
      at(currentA);
      state.cancel = true;
      pointer(b!, "pointerenter");
      await wait(40);
      state.delay = 2;
      await wait(40);
      at(currentA);
      state.cancel = false;
      host
        .querySelector("[data-sw-tooltip]")!
        .addEventListener("starwind:open-change", (event) => event.preventDefault(), {
          once: true,
        });
      pointer(b!, "pointerenter");
      await wait(40);
      state.delay = 5;
      await wait(40);
      at(currentA);
      pointer(b!, "pointerenter");
      await wait(40);
      at(b!);
      state.foreign = true;
      state.delay = 3;
      await wait(40);
      at(currentA);
      state.showSecond = false;
      state.delay = 4;
      await wait(40);
      at(currentA);
      pointer(currentA, "pointerleave");
      await wait(40);
      state.delay = 120;
      await wait(40);
      pointer(currentA, "pointerenter");
      await wait(25);
      expect(popup().hidden).toBe(true);
      const timerCount = changes.length;
      state.callback++;
      await wait(130);
      at(currentA);
      expect(changes).toHaveLength(timerCount + 1);
      if (controlled) {
        state.delay = 3;
        void nextTick(() => {
          state.open = false;
        });
        await wait(40);
        expect(popup().hidden).toBe(true);
      }
    });
  }

  it("preserves a declared false Boolean prop on a component-rooted trigger", async () => {
    const host = mount(
      tree(
        {},
        {},
        h(
          TooltipTrigger,
          { asChild: true, disabled: false },
          {
            default: () =>
              h(DeclaredDisabledRoot, { disabled: false }, { default: () => "Declared Boolean" }),
          },
        ),
      ),
    );
    await nextTick();

    const trigger = host.querySelector<HTMLElement>("[data-sw-tooltip-trigger]")!;
    expect(trigger.getAttribute("data-declared-disabled")).toBe("false");
    expect(trigger.hasAttribute("disabled")).toBe(false);
  });

  it("composes a component-rooted trigger through its exposed native element", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const primitiveRef = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
    const childRef = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
    const state = reactive({ as: "button" as "button" | "div", disabled: false });
    const calls: string[] = [];
    const errors: unknown[] = [];
    const host = mountRender(
      () =>
        tree(
          { closeDelay: 0, openDelay: 0 },
          {},
          h(
            TooltipTrigger,
            {
              asChild: true,
              class: "wrapper",
              disabled: state.disabled,
              onClick: () => calls.push("wrapper"),
              ref: primitiveRef,
            },
            {
              default: () =>
                h(
                  ExposedButton,
                  {
                    as: state.as,
                    class: "child",
                    onClick: () => calls.push("child"),
                    ref: childRef,
                  },
                  { default: () => "Help" },
                ),
            },
          ),
        ),
      errors,
    );
    await nextTick();

    const button = host.querySelector<HTMLElement>("[data-sw-tooltip-trigger]")!;
    expect(button.className).toContain("child");
    expect(button.className).toContain("wrapper");
    expect(primitiveRef.value?.element).toBe(button);
    expect(childRef.value?.element).toBe(button);
    button.click();
    expect(calls).toEqual(["child", "wrapper"]);

    pointer(button, "pointerenter");
    await wait(5);
    expect(popup().hidden).toBe(false);
    pointer(button, "pointerleave");
    await wait(5);
    expect(popup().hidden).toBe(true);

    const detachedButton = button;
    state.as = "div";
    await wait(20);
    const replacement = host.querySelector<HTMLElement>("[data-sw-tooltip-trigger]")!;
    expect(replacement.tagName).toBe("DIV");
    expect(replacement).not.toBe(detachedButton);
    expect(primitiveRef.value?.element).toBe(replacement);
    expect(childRef.value?.element).toBe(replacement);
    expect(abort).toHaveBeenCalledTimes(1);
    expect(replacement.hasAttribute("aria-describedby")).toBe(true);
    expect(replacement.hasAttribute("disabled")).toBe(false);
    expect(replacement.hasAttribute("data-disabled")).toBe(false);

    pointer(detachedButton, "pointerenter");
    await wait(5);
    expect(popup().hidden).toBe(true);
    pointer(replacement, "pointerenter");
    await wait(5);
    expect(errors).toEqual([]);
    expect(popup().hidden).toBe(false);
    pointer(replacement, "pointerleave");
    await wait(5);
    expect(popup().hidden).toBe(true);

    state.disabled = true;
    await nextTick();
    expect(replacement.hasAttribute("disabled")).toBe(true);
    pointer(replacement, "pointerenter");
    await wait(5);
    expect(popup().hidden).toBe(true);
  });

  it("honors hover delay, pointer transit, placement, presence, and cleanup", async () => {
    const changes: boolean[] = [];
    const host = mount(
      tree(
        { closeDelay: 80, openDelay: 150, onOpenChange: (open: boolean) => changes.push(open) },
        { align: "end", side: "right" },
      ),
    );
    const trigger = host.querySelector<HTMLElement>("[data-sw-tooltip-trigger]")!;
    pointer(trigger, "pointerenter");
    await wait(30);
    expect(changes).toEqual([]);
    await wait(150);
    expect(changes).toEqual([true]);
    expect(popup().hidden).toBe(false);
    expect(popup().dataset.side).toBe("right");
    expect(popup().dataset.align).toBe("end");
    const portal = document.body.querySelector<HTMLElement>("[data-sw-tooltip-portal]")!;
    expect(portal.dataset.placement).toBe("ready");
    expect(portal.hasAttribute("data-floating-root")).toBe(true);
    expect(portal.contains(popup())).toBe(true);
    expect(portal.contains(document.body.querySelector("[data-sw-tooltip-positioner]"))).toBe(true);

    pointer(trigger, "pointerleave");
    pointer(popup(), "pointerenter");
    await wait(100);
    expect(popup().hidden).toBe(false);
    pointer(popup(), "pointerleave");
    await wait(100);
    expect(changes).toEqual([true, false]);

    cleanups.pop()?.();
    await nextTick();
    expect(document.body.querySelector("[data-sw-tooltip-portal]")).toBeNull();
  });

  it("opens from focus and emits detailed cancellation before the model event", async () => {
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
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-tooltip-trigger]")!;
    trigger.focus();
    await nextTick();
    expect(events).toEqual(["detail:true"]);
    trigger.blur();
    trigger.focus();
    await nextTick();
    expect(events[0]).toBe("detail:true");
    expect(events.slice(-2)).toEqual(["detail:true", "update:true"]);
    expect(popup().hidden).toBe(false);
  });

  it("keeps multiple instances isolated", async () => {
    const firstEvents: boolean[] = [];
    const secondEvents: boolean[] = [];
    const first = mount(
      tree({ openDelay: 0, onOpenChange: (open: boolean) => firstEvents.push(open) }),
    );
    const second = mount(
      tree({ open: false, openDelay: 0, onOpenChange: (open: boolean) => secondEvents.push(open) }),
    );
    pointer(first.querySelector("[data-sw-tooltip-trigger]")!, "pointerenter");
    await nextTick();
    const popups = document.body.querySelectorAll<HTMLElement>("[data-sw-tooltip-popup]");
    expect(popups).toHaveLength(2);
    expect(firstEvents).toEqual([true]);
    expect(secondEvents).toEqual([]);
    expect(second.querySelector("[data-sw-tooltip-trigger]")?.getAttribute("data-state")).toBe(
      "closed",
    );
  });

  it("recreates constructor options against inline portal DOM and keeps one live controller", async () => {
    const state = reactive({ closeDelay: 80 });
    const events: boolean[] = [];
    const errors: unknown[] = [];
    const host = mountRender(
      () =>
        tree({
          closeDelay: state.closeDelay,
          openDelay: 0,
          onOpenChange: (open: boolean) => events.push(open),
        }),
      errors,
    );
    const trigger = host.querySelector<HTMLElement>("[data-sw-tooltip-trigger]")!;
    pointer(trigger, "pointerenter");
    await nextTick();
    expect(events).toEqual([true]);

    state.closeDelay = 10;
    await nextTick();
    await nextTick();
    expect(errors).toEqual([]);
    pointer(trigger, "pointerleave");
    await wait(20);
    expect(events).toEqual([true, false]);
    pointer(trigger, "pointerenter");
    await nextTick();
    expect(events).toEqual([true, false, true]);

    cleanups.pop()?.();
    await nextTick();
    expect(document.body.querySelector("[data-sw-tooltip-portal]")).toBeNull();
  });
});

function tree(
  root: Record<string, unknown> = {},
  floating: Record<string, unknown> = {},
  trigger: VNode = h(TooltipTrigger, null, { default: () => "Help" }),
) {
  return h(TooltipRoot, root, {
    default: () => [
      trigger,
      h(TooltipPortal, null, {
        default: () =>
          h(TooltipPositioner, floating, {
            default: () =>
              h(TooltipPopup, floating, {
                default: () => ["Helpful details", h(TooltipArrow)],
              }),
          }),
      }),
    ],
  });
}

const ExposedButton = defineComponent({
  inheritAttrs: false,
  props: { as: { default: "button", type: String } },
  setup(props, { attrs, expose, slots }) {
    const element = ref<HTMLElement | null>(null);
    expose({ element });
    return () => h(props.as, { ...attrs, ref: element }, slots.default?.());
  },
});

const DeclaredDisabledRoot = defineComponent({
  inheritAttrs: false,
  props: { disabled: { default: true, type: Boolean } },
  setup(props, { attrs, slots }) {
    return () =>
      h("div", { ...attrs, "data-declared-disabled": String(props.disabled) }, slots.default?.());
  },
});

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
  return document.body.querySelector<HTMLElement>("[data-sw-tooltip-popup]")!;
}

function pointer(element: Element, type: string): void {
  element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" }));
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
  await nextTick();
}
