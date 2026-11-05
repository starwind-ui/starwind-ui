import { ButtonRoot } from "@starwind-ui/vue/button";
import { expect, it, vi } from "vitest";
import { type Component, createApp, h, nextTick, reactive } from "vue";

/** Ordinary Starwind Button composition must work through the native overlay Trigger. */
export function testComponentTrigger(
  parts: { Root: Component; Trigger: Component; Popup: Component; Title: Component },
  cleanups: Array<() => void>,
) {
  it("uses a Starwind Button component as Trigger across parent updates and native replacement", async () => {
    const state = reactive({ revision: 0, title: "first" });
    const clicked = vi.fn();
    const errors = vi.fn();
    const childRefs: Array<HTMLElement | null> = [];
    const childRef = (value: unknown) => {
      const component = value as { element?: HTMLElement; $el?: HTMLElement } | null;
      childRefs.push(component?.element ?? component?.$el ?? null);
    };
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h(parts.Root, { title: state.title }, () => [
          h(parts.Trigger, { asChild: true }, () =>
            h(
              ButtonRoot,
              { key: state.revision, id: "component-trigger", onClick: clicked, ref: childRef },
              () => "Open",
            ),
          ),
          h(parts.Popup, { id: "component-popup" }, () => [
            h(parts.Title, {}, () => "Title"),
            h("input"),
          ]),
        ]),
    });
    app.config.errorHandler = errors;
    app.mount(host);
    const dispose = () => app.unmount();
    cleanups.push(dispose);
    const settle = async () => {
      await nextTick();
      await Promise.resolve();
      await nextTick();
    };
    await settle();
    const first = host.querySelector<HTMLButtonElement>("#component-trigger")!;
    const popup = host.querySelector<HTMLDialogElement>("#component-popup")!;
    expect(first.tagName).toBe("BUTTON");
    expect(childRefs.at(-1)).toBe(first);
    expect(first.getAttribute("aria-controls")).toBe(popup.id);
    state.title = "updated";
    await settle();
    expect(host.querySelectorAll("#component-trigger")).toHaveLength(1);
    first.click();
    await settle();
    expect(popup.open).toBe(true);
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(popup.contains(document.activeElement)).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await settle();
    await expect.poll(() => popup.open).toBe(false);
    state.revision += 1;
    await settle();
    const second = host.querySelector<HTMLButtonElement>("#component-trigger")!;
    expect(second).not.toBe(first);
    expect(childRefs).toContain(null);
    expect(childRefs.at(-1)).toBe(second);
    first.click();
    await settle();
    expect(popup.open).toBe(false);
    second.click();
    await settle();
    expect(popup.open).toBe(true);
    expect(errors).not.toHaveBeenCalled();
    dispose();
    cleanups.splice(cleanups.indexOf(dispose), 1);
    await settle();
    expect(childRefs.at(-1)).toBeNull();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    second.click();
    await settle();
    expect(popup.open).toBe(false);
  });
}

/** A Close part accepts the same component child as its Trigger. */
export function testComponentClose(
  parts: { Root: Component; Popup: Component; Title: Component; Close: Component },
  cleanups: Array<() => void>,
) {
  it("closes through a Starwind Button component as the Close child", async () => {
    const clicked = vi.fn();
    const errors = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h(parts.Root, { defaultOpen: true }, () =>
          h(parts.Popup, { id: "component-close-popup" }, () => [
            h(parts.Title, {}, () => "Title"),
            h(parts.Close, { asChild: true, class: "from-close" }, () =>
              h(ButtonRoot, { id: "component-close", onClick: clicked }, () => "Done"),
            ),
          ]),
        ),
    });
    app.config.errorHandler = errors;
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();
    await nextTick();
    const popup = host.querySelector<HTMLDialogElement>("#component-close-popup")!;
    const close = host.querySelector<HTMLButtonElement>("#component-close")!;
    expect(close.tagName).toBe("BUTTON");
    expect(close.classList.contains("from-close")).toBe(true);
    expect(popup.open).toBe(true);

    close.click();

    await expect.poll(() => popup.open).toBe(false);
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(errors).not.toHaveBeenCalled();
  });
}

export function testInitialPortalFocus(
  parts: { Root: Component; Popup: Component; Title: Component; Portal: Component },
  cleanups: Array<() => void>,
) {
  it.each([{ open: true }, { defaultOpen: true }])(
    "focuses an initially open native popup after portal placement (%j)",
    async (initial) => {
      const changed = vi.fn();
      const host = document.createElement("div");
      document.body.append(host);
      const app = createApp({
        render: () =>
          h(parts.Root, { ...initial, onOpenChange: changed }, () =>
            h(parts.Portal, { id: "initial-portal" }, () =>
              h(parts.Popup, { id: "initial-popup" }, () => [
                h(parts.Title, {}, () => "Title"),
                h("input", { id: "initial-focus-input" }),
              ]),
            ),
          ),
      });
      app.mount(host);
      const dispose = () => app.unmount();
      cleanups.push(dispose);
      await expect.poll(() => document.activeElement?.id).toBe("initial-focus-input");
      const popup = document.getElementById("initial-popup") as HTMLDialogElement;
      expect(popup.open).toBe(true);
      expect(document.getElementById("initial-portal")?.parentElement).toBe(document.body);
      expect(changed).not.toHaveBeenCalled();
      dispose();
      cleanups.splice(cleanups.indexOf(dispose), 1);
      await nextTick();
      expect(document.getElementById("initial-portal")).toBeNull();
      expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    },
  );
}
