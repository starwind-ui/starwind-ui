import type { DialogInstance } from "@starwind-ui/runtime/dialog";
import { expect, it, vi } from "vitest";
import { type Component, createApp, h, nextTick, reactive } from "vue";

export function testControlRefresh(
  parts: {
    Root: Component;
    Trigger: Component;
    Close: Component;
    Popup: Component;
    Title: Component;
    Portal?: Component;
  },
  create: (root: HTMLElement) => DialogInstance,
  cleanups: Array<() => void>,
) {
  it("refreshes late controls without replacing the popup or controller", async () => {
    const state = reactive({ trigger: 0, close: 0, title: "first" });
    const changed = vi.fn();
    const completed = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    const content = () =>
      h(
        parts.Popup,
        { "data-refresh-popup": "" },
        {
          default: () => [
            h(parts.Title, null, { default: () => "Dialog" }),
            h("input", { "data-refresh-input": "" }),
            state.close
              ? h(
                  parts.Close,
                  { key: state.close, "data-refresh-close": "" },
                  { default: () => "Close" },
                )
              : null,
          ],
        },
      );
    const app = createApp({
      render: () =>
        h(
          parts.Root,
          {
            "data-refresh-root": "",
            title: state.title,
            onOpenChange: changed,
            onCloseComplete: completed,
          },
          {
            default: () => [
              state.trigger
                ? h(
                    parts.Trigger,
                    { key: state.trigger, "data-refresh-trigger": "" },
                    { default: () => "Open" },
                  )
                : null,
              parts.Portal ? h(parts.Portal, null, { default: content }) : content(),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const settle = async () => {
      await nextTick();
      await Promise.resolve();
      await nextTick();
    };
    await settle();
    const root = host.querySelector<HTMLElement>("[data-refresh-root]")!;
    const instance = create(root);
    const popup = document.querySelector<HTMLDialogElement>("[data-refresh-popup]")!;
    const refresh = vi.spyOn(instance, "refresh");
    state.trigger = 1;
    await settle();
    const trigger = host.querySelector<HTMLButtonElement>("[data-refresh-trigger]")!;
    expect(trigger.getAttribute("aria-controls")).toBe(popup.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    trigger.focus();
    trigger.click();
    await settle();
    expect(popup.open).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    const focused = document.activeElement;
    state.close = 1;
    await settle();
    expect(create(root)).toBe(instance);
    expect(document.querySelector("[data-refresh-popup]")).toBe(popup);
    expect(document.activeElement).toBe(focused);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    const oldClose = document.querySelector<HTMLButtonElement>("[data-refresh-close]")!;
    state.close = 2;
    await settle();
    oldClose.click();
    await settle();
    expect(popup.open).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    refresh.mockClear();
    state.title = "second";
    await settle();
    expect(refresh).not.toHaveBeenCalled();
    document.querySelector<HTMLButtonElement>("[data-refresh-close]")!.click();
    await vi.waitFor(() => expect(popup.open).toBe(false));
    expect(completed).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
    state.trigger = 2;
    await settle();
    trigger.click();
    await settle();
    expect(popup.open).toBe(false);
    host.querySelector<HTMLButtonElement>("[data-refresh-trigger]")!.click();
    await settle();
    expect(popup.open).toBe(true);
    refresh.mockRestore();
    app.unmount();
    cleanups.pop();
    await settle();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });
}
