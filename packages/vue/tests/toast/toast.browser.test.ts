import { ToastTemplate, toast } from "@starwind-ui/vue/toast";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "vue/server-renderer";

import Toaster from "../../../../apps/vue-demo/src/components/starwind-runtime/toast/Toaster.vue";

import { toastProvider } from "./tree.js";

const cleanups: Array<() => void> = [];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  toast.dismiss();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("Vue Toast public behavior", () => {
  it.each([
    { props: { gap: "2rem", peek: "3rem" }, gap: "2rem", peek: "3rem", gapRem: 2, peekRem: 3 },
    { props: {}, gap: "0.5rem", peek: "1rem", gapRem: 0.5, peekRem: 1 },
  ])(
    "uses Styled Toaster spacing $gap / $peek in computed layout",
    async ({ props, gap, peek, gapRem, peekRem }) => {
      const host = document.createElement("div");
      document.body.append(host);
      const app = createApp({
        render: () =>
          h(
            Toaster,
            {
              ...props,
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "var(--gap)",
                "--gap": "9rem",
                "--peek": "8rem",
              },
            },
            {
              default: () => [
                h("div", { id: "spacing-first", style: { height: "10px" } }),
                h("div", {
                  id: "spacing-second",
                  style: { height: "10px", paddingTop: "var(--peek)" },
                }),
              ],
            },
          ),
      });
      app.mount(host);
      cleanups.push(() => app.unmount());
      await nextTick();
      const viewport = host.querySelector<HTMLElement>("[data-sw-toast-viewport]")!;
      const computed = getComputedStyle(viewport);
      expect(computed.getPropertyValue("--gap")).toBe(gap);
      expect(computed.getPropertyValue("--peek")).toBe(peek);
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const first = host.querySelector<HTMLElement>("#spacing-first")!;
      const second = host.querySelector<HTMLElement>("#spacing-second")!;
      expect(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom).toBeCloseTo(
        gapRem * rem,
      );
      expect(parseFloat(getComputedStyle(second).paddingTop)).toBeCloseTo(peekRem * rem);
    },
  );

  it("removes forwarded template attributes after a reactive update", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const proofAttribute = ref<string | undefined>("present");
    const app = createApp({
      render: () =>
        h(
          ToastTemplate,
          { "data-proof-attribute": proofAttribute.value },
          { default: () => h("div", "Template") },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    const template = host.querySelector<HTMLTemplateElement>("template[data-sw-toast-template]")!;
    expect(template.getAttribute("data-proof-attribute")).toBe("present");

    proofAttribute.value = undefined;
    await nextTick();

    expect(template.hasAttribute("data-proof-attribute")).toBe(false);
  });

  it("creates, updates, acts on, dismisses, and announces variant templates", async () => {
    const host = mountProvider();
    const action = vi.fn();
    const onClose = vi.fn();
    const onRemove = vi.fn();

    const id = toast.success("Saved", {
      action: { label: "Undo", onClick: action },
      description: "Saved to disk",
      duration: 0,
      onClose,
      onRemove,
    });
    let item = getToast(host, id);
    expect(item?.dataset.variant).toBe("success");
    expect(item?.getAttribute("role")).toBe("dialog");
    expect(part(item, "title-text")?.textContent).toBe("Saved");
    expect(part(item, "description")?.textContent).toBe("Saved to disk");
    expect(item?.getAttribute("aria-labelledby")).toBe(part(item, "title")?.id);
    expect(host.querySelector("[data-sw-toast-viewport]")?.getAttribute("aria-live")).toBe(
      "polite",
    );
    expect(host.querySelector("[data-sw-toast-viewport]")?.getAttribute("aria-label")).toBe(
      "Notifications",
    );
    const close = part(item, "close")!;
    expect(close).toMatchObject({ tagName: "BUTTON", type: "button" });
    expect(close.getAttribute("aria-label")).toBe("Close notification");
    close.focus();
    expect(document.activeElement).toBe(close);

    toast.update(id, { description: "Complete", title: "Done", variant: "warning" });
    item = getToast(host, id);
    expect(item?.dataset.variant).toBe("warning");
    expect(part(item, "title-text")?.textContent).toBe("Done");
    expect(part(item, "description")?.textContent).toBe("Complete");

    part(item, "action")?.click();
    expect(action).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(200);
    expect(onRemove).toHaveBeenCalledOnce();
    expect(getToast(host, id)).toBeNull();
  });

  it("lets consumer labels replace semantic defaults while protected button behavior remains", () => {
    const host = mountProvider({
      "aria-label": "Activity feed",
      closeAriaLabel: "Dismiss saved message",
    });
    const id = toast("Saved", { duration: 0 });
    const viewport = host.querySelector<HTMLElement>("[data-sw-toast-viewport]")!;
    const close = part(getToast(host, id), "close") as HTMLButtonElement;

    expect(viewport.getAttribute("aria-label")).toBe("Activity feed");
    expect(close.getAttribute("aria-label")).toBe("Dismiss saved message");
    expect(close.type).toBe("button");
  });

  it("hydrates one manager without warnings and remains service-driven", async () => {
    const root = () => toastProvider({ id: "hydrated-provider" });
    const host = document.createElement("div");
    document.body.append(host);
    host.innerHTML = await renderToString(createSSRApp({ render: root }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createSSRApp({ render: root });

    app.mount(host);
    cleanups.push(() => app.unmount());
    const id = toast("Hydrated", { duration: 0 });

    expect(host.querySelectorAll("#hydrated-provider")).toHaveLength(1);
    expect(host.querySelectorAll("template[data-sw-toast-template]")).toHaveLength(6);
    expect(getToast(host, id)).not.toBeNull();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("keeps limit, timers, pause and focus behavior in the Runtime manager", async () => {
    const host = mountProvider({ duration: 100, limit: 1 });
    const first = toast("First");
    const second = toast("Second");
    const viewport = host.querySelector<HTMLElement>("[data-sw-toast-viewport]")!;

    expect(getToast(host, first)?.hasAttribute("inert")).toBe(true);
    expect(getToast(host, second)?.hasAttribute("inert")).toBe(false);
    viewport.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    expect(viewport.hasAttribute("data-expanded")).toBe(true);
    await vi.advanceTimersByTimeAsync(150);
    expect(getToast(host, second)?.dataset.state).toBe("open");

    viewport.dispatchEvent(
      new MouseEvent("mouseleave", { bubbles: true, clientX: -10, clientY: -10 }),
    );
    await vi.advanceTimersByTimeAsync(100);
    expect(getToast(host, second)?.dataset.state).toBe("closed");
    await vi.advanceTimersByTimeAsync(200);
    expect(getToast(host, second)).toBeNull();

    const focused = toast("Focused", { duration: 100 });
    getToast(host, focused)?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(150);
    expect(getToast(host, focused)?.dataset.state).toBe("open");
  });

  it("settles promises on one record and supports swipe dismissal", async () => {
    const host = mountProvider({ position: "bottom-right" });
    let resolve!: (value: string) => void;
    const pending = new Promise<string>((done) => (resolve = done));
    const result = toast.promise(pending, {
      error: "Failed",
      loading: "Loading",
      success: (value) => `Loaded ${value}`,
    });
    const loading = host.querySelector<HTMLElement>('[data-variant="loading"]')!;
    const id = loading.dataset.toastId!;

    resolve("data");
    await expect(result).resolves.toBe("data");
    expect(getToast(host, id)?.dataset.variant).toBe("success");
    expect(part(getToast(host, id), "title-text")?.textContent).toBe("Loaded data");

    const item = getToast(host, id)!;
    item.setPointerCapture = vi.fn();
    item.releasePointerCapture = vi.fn();
    item.dispatchEvent(pointer("pointerdown", 0, 0));
    item.dispatchEvent(pointer("pointermove", 60, 0));
    item.dispatchEvent(pointer("pointerup", 60, 0));
    expect(item.dataset.swipeDirection).toBe("right");
    expect(item.dataset.state).toBe("closed");
  });

  it("routes through the newest provider, restores the older one, and cleans up remounts", async () => {
    const first = mountProvider({ id: "first-provider" });
    const second = mountProvider({ id: "second-provider" });
    const latest = toast("Latest", { duration: 0 });
    expect(getToast(second, latest)).not.toBeNull();
    expect(getToast(first, latest)).toBeNull();

    cleanups.pop()?.();
    expect(first.querySelector("[data-sw-toast-root]")).toBeNull();
    const restored = toast("Restored", { duration: 0 });
    expect(getToast(first, restored)).not.toBeNull();

    cleanups.pop()?.();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(toast("Missing", { duration: 0 })).toBe("");
    expect(warn).toHaveBeenCalledOnce();

    const remounted = mountProvider({ id: "remounted-provider" });
    await nextTick();
    const fresh = toast("Fresh", { duration: 0 });
    expect(getToast(remounted, fresh)).not.toBeNull();
  });
});

function mountProvider(props: Record<string, unknown> = {}): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({ render: () => toastProvider(props) });
  app.mount(host);
  cleanups.push(() => app.unmount());
  return host;
}

function getToast(host: ParentNode, id: string): HTMLElement | null {
  return host.querySelector<HTMLElement>(`[data-toast-id="${id}"]`);
}

function part(root: ParentNode | null, name: string): HTMLElement | null {
  return root?.querySelector<HTMLElement>(`[data-sw-toast-${name}]`) ?? null;
}

function pointer(type: string, clientX: number, clientY: number): PointerEvent {
  return new PointerEvent(type, { bubbles: true, button: 0, clientX, clientY, pointerId: 1 });
}
