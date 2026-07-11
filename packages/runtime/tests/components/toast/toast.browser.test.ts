import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createToastManager, toast } from "../../../src/components/toast/toast";

type ToastModule = typeof import("../../../src/components/toast/toast");

describe("createToastManager", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    toast.dismiss();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("renders, updates, and dismisses toasts from templates", async () => {
    const viewport = renderToaster();
    const manager = createToastManager(viewport);
    const onAction = vi.fn();
    const onClose = vi.fn();
    const onRemove = vi.fn();

    const id = manager.add({
      action: { label: "Undo", onClick: onAction },
      description: "Saved to disk",
      duration: 0,
      onClose,
      onRemove,
      title: "Saved",
      variant: "success",
    });

    const item = getToast(id);
    expect(viewport.getAttribute("role")).toBe("region");
    expect(viewport.getAttribute("aria-live")).toBe("polite");
    expect(item?.getAttribute("data-state")).toBe("open");
    expect(item?.getAttribute("data-variant")).toBe("success");
    expect(getPart(item, "data-sw-toast-title-text")?.textContent).toBe("Saved");
    expect(getPart(item, "data-sw-toast-description")?.textContent).toBe("Saved to disk");

    getPart(item, "data-sw-toast-action")?.click();
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(200);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(getToast(id)).toBeNull();

    const updatedId = manager.add({ duration: 0, title: "Working", variant: "loading" });
    manager.update(updatedId, {
      description: "All done",
      title: "Done",
      variant: "success",
    });

    const updated = getToast(updatedId);
    expect(updated?.getAttribute("data-variant")).toBe("success");
    expect(getPart(updated, "data-sw-toast-title-text")?.textContent).toBe("Done");
    expect(getPart(updated, "data-sw-toast-description")?.textContent).toBe("All done");

    manager.closeAll();
    await vi.advanceTimersByTimeAsync(200);
    expect(viewport.querySelector("[data-sw-toast-root]")).toBeNull();
  });

  it("cancels pending removal callbacks when the manager is destroyed", async () => {
    const manager = createToastManager(renderToaster());
    const onRemove = vi.fn();
    const id = manager.add({ duration: 0, onRemove, title: "Closing" });

    manager.close(id);
    manager.destroy();
    await vi.advanceTimersByTimeAsync(200);

    expect(onRemove).not.toHaveBeenCalled();
    expect(manager.getToasts()).toEqual([]);
  });

  it("exposes the global toast shortcuts and promise helper", async () => {
    renderToaster();
    createToastManager(document.querySelector<HTMLElement>("[data-sw-toast-viewport]")!);

    const successId = toast.success("Saved", { description: "Shortcut", duration: 0 });
    expect(getToast(successId)?.getAttribute("data-variant")).toBe("success");
    expect(getPart(getToast(successId), "data-sw-toast-description")?.textContent).toBe("Shortcut");

    const promise = toast.promise(Promise.resolve("result"), {
      error: "Failed",
      loading: "Loading",
      success: (value) => ({ title: `Loaded ${value}` }),
    });
    await promise;

    const loadingToast = Array.from(
      document.querySelectorAll<HTMLElement>("[data-sw-toast-root]"),
    ).find((candidate) => candidate.textContent?.includes("Loaded result"));
    expect(loadingToast?.getAttribute("data-variant")).toBe("success");
  });

  it("lets duplicate toast module instances find the installed manager", async () => {
    const viewport = renderToaster();
    createToastManager(viewport);
    const duplicatedModule = (await import(
      // @ts-expect-error Vite query imports intentionally create a separate module instance.
      "../../../src/components/toast/toast.ts?duplicated"
    )) as ToastModule;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const id = duplicatedModule.toast("From duplicated module", { duration: 0 });

    expect(warn).not.toHaveBeenCalled();
    expect(id).not.toBe("");
    expect(getToastByText("From duplicated module")).not.toBeNull();

    warn.mockRestore();
  });

  it("does not let legacy Starwind toast globals steal the runtime manager", () => {
    const viewport = renderToaster();
    createToastManager(viewport);
    const legacyAdd = vi.fn(() => "legacy-toast");
    (
      window as unknown as {
        __starwind__?: { toast?: Pick<ReturnType<typeof createToastManager>, "add"> };
      }
    ).__starwind__ = { toast: { add: legacyAdd } };

    const id = toast("Runtime namespaced toast", { duration: 0 });

    expect(legacyAdd).not.toHaveBeenCalled();
    expect(id).toBe("toast-1");
    expect(getToastByText("Runtime namespaced toast")).not.toBeNull();
  });

  it("keeps variant updates visible when the toast is re-rendered", () => {
    const viewport = renderToaster();
    const manager = createToastManager(viewport);

    const id = manager.add({
      description: "The toast starts as loading.",
      duration: 0,
      title: "Loading",
      variant: "loading",
    });

    expect(getToast(id)?.hasAttribute("data-starting-style")).toBe(true);

    manager.update(id, {
      description: "The same toast is now success.",
      duration: 0,
      title: "Updated",
      variant: "success",
    });

    const updated = getToast(id);
    expect(updated?.getAttribute("data-variant")).toBe("success");
    expect(updated?.hasAttribute("data-starting-style")).toBe(false);
    expect(getPart(updated, "data-sw-toast-title-text")?.textContent).toBe("Updated");
    expect(getPart(updated, "data-sw-toast-description")?.textContent).toBe(
      "The same toast is now success.",
    );
  });

  it("wires toast root labels and descriptions from visible title and description parts", () => {
    const viewport = renderToaster();
    const manager = createToastManager(viewport);

    const id = manager.add({
      description: "Saved to disk",
      duration: 0,
      title: "Saved",
    });
    const item = getToast(id);
    const title = getPart(item, "data-sw-toast-title");
    const description = getPart(item, "data-sw-toast-description");

    expect(title?.id).not.toBe("");
    expect(description?.id).not.toBe("");
    expect(item?.getAttribute("aria-labelledby")).toBe(title?.id);
    expect(item?.getAttribute("aria-describedby")).toBe(description?.id);
  });

  it("preserves explicit toast root aria labels and descriptions", () => {
    const viewport = renderToaster({
      rootAttributes: 'aria-label="Custom notification" aria-describedby="custom-description"',
    });
    const manager = createToastManager(viewport);

    const id = manager.add({
      description: "Generated description",
      duration: 0,
      title: "Generated title",
    });
    const item = getToast(id);

    expect(item?.getAttribute("aria-label")).toBe("Custom notification");
    expect(item?.hasAttribute("aria-labelledby")).toBe(false);
    expect(item?.getAttribute("aria-describedby")).toBe("custom-description");
  });

  it("preserves explicit toast root aria-labelledby", () => {
    const viewport = renderToaster({
      rootAttributes: 'aria-labelledby="custom-title"',
    });
    const manager = createToastManager(viewport);

    const id = manager.add({
      description: "Generated description",
      duration: 0,
      title: "Generated title",
    });
    const item = getToast(id);

    expect(item?.getAttribute("aria-labelledby")).toBe("custom-title");
  });

  it("removes managed toast root aria references when title and description are cleared", () => {
    const viewport = renderToaster();
    const manager = createToastManager(viewport);

    const id = manager.add({
      description: "Initial description",
      duration: 0,
      title: "Initial title",
    });
    const item = getToast(id);

    expect(item?.hasAttribute("aria-labelledby")).toBe(true);
    expect(item?.hasAttribute("aria-describedby")).toBe(true);

    manager.update(id, { description: "", title: "" });

    expect(item?.hasAttribute("aria-labelledby")).toBe(false);
    expect(item?.hasAttribute("aria-describedby")).toBe(false);
  });

  it("renders promise loading and settled states on the same visible toast", async () => {
    renderToaster();
    createToastManager(document.querySelector<HTMLElement>("[data-sw-toast-viewport]")!);

    let resolvePromise!: (value: string) => void;
    const pending = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });

    const result = toast.promise(pending, {
      error: "Failed",
      loading: { description: "Promise has not settled.", title: "Loading promise" },
      success: (value) => ({
        description: "Promise resolved in place.",
        duration: 0,
        title: `Loaded ${value}`,
      }),
    });

    const loadingToast = getToastByText("Loading promise");
    expect(loadingToast?.getAttribute("data-variant")).toBe("loading");

    resolvePromise("result");
    await result;

    const settledToast = getToastByText("Loaded result");
    expect(settledToast?.getAttribute("data-toast-id")).toBe(
      loadingToast?.getAttribute("data-toast-id"),
    );
    expect(document.querySelectorAll("[data-sw-toast-root]")).toHaveLength(1);
    expect(settledToast?.getAttribute("data-variant")).toBe("success");
    expect(settledToast?.hasAttribute("data-starting-style")).toBe(false);
    expect(getPart(settledToast, "data-sw-toast-description")?.textContent).toBe(
      "Promise resolved in place.",
    );
  });

  it("auto-dismisses simple toasts after the configured duration", async () => {
    const viewport = renderToaster({ duration: 75 });
    const manager = createToastManager(viewport);

    const id = manager.add({ title: "Timed toast" });

    await vi.advanceTimersByTimeAsync(74);
    expect(getToast(id)?.getAttribute("data-state")).toBe("open");

    await vi.advanceTimersByTimeAsync(1);
    expect(getToast(id)?.getAttribute("data-state")).toBe("closed");

    await vi.advanceTimersByTimeAsync(200);
    expect(getToast(id)).toBeNull();
  });

  it("keeps loading toasts untimed by default", async () => {
    const viewport = renderToaster({ duration: 50 });
    const manager = createToastManager(viewport);

    const id = manager.add({ title: "Loading", variant: "loading" });

    await vi.advanceTimersByTimeAsync(250);

    expect(getToast(id)?.getAttribute("data-state")).toBe("open");
  });

  it("does not reset the timer for plain content updates", async () => {
    const viewport = renderToaster({ duration: 100 });
    const manager = createToastManager(viewport);

    const id = manager.add({ title: "Step 1" });

    await vi.advanceTimersByTimeAsync(75);
    manager.update(id, { title: "Step 2" });

    await vi.advanceTimersByTimeAsync(24);
    expect(getToast(id)?.getAttribute("data-state")).toBe("open");

    await vi.advanceTimersByTimeAsync(1);
    expect(getToast(id)?.getAttribute("data-state")).toBe("closed");
  });

  it("resumes auto-dismiss timers with the remaining time after hover pause", async () => {
    const viewport = renderToaster({ duration: 100 });
    const manager = createToastManager(viewport);

    const id = manager.add({ title: "Paused toast" });

    await vi.advanceTimersByTimeAsync(75);
    viewport.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(500);

    expect(getToast(id)?.getAttribute("data-state")).toBe("open");

    viewport.dispatchEvent(
      new MouseEvent("mouseleave", { bubbles: true, clientX: -1, clientY: -1 }),
    );

    await vi.advanceTimersByTimeAsync(24);
    expect(getToast(id)?.getAttribute("data-state")).toBe("open");

    await vi.advanceTimersByTimeAsync(1);
    expect(getToast(id)?.getAttribute("data-state")).toBe("closed");
  });

  it("resets the timer for explicit duration updates", async () => {
    const viewport = renderToaster({ duration: 500 });
    const manager = createToastManager(viewport);

    const id = manager.add({ duration: 0, title: "Manual toast" });

    manager.update(id, { duration: 100 });
    await vi.advanceTimersByTimeAsync(75);
    manager.update(id, { duration: 100, title: "Still working" });

    await vi.advanceTimersByTimeAsync(99);
    expect(getToast(id)?.getAttribute("data-state")).toBe("open");

    await vi.advanceTimersByTimeAsync(1);
    expect(getToast(id)?.getAttribute("data-state")).toBe("closed");
  });

  it("starts the default timer when a loading toast updates to a settled variant", async () => {
    const viewport = renderToaster({ duration: 90 });
    const manager = createToastManager(viewport);

    const id = manager.add({ duration: 0, title: "Working", variant: "loading" });

    await vi.advanceTimersByTimeAsync(120);
    expect(getToast(id)?.getAttribute("data-state")).toBe("open");

    manager.update(id, { title: "Complete", variant: "success" });

    await vi.advanceTimersByTimeAsync(89);
    expect(getToast(id)?.getAttribute("data-state")).toBe("open");

    await vi.advanceTimersByTimeAsync(1);
    expect(getToast(id)?.getAttribute("data-state")).toBe("closed");

    await vi.advanceTimersByTimeAsync(200);
    expect(getToast(id)).toBeNull();
  });

  it("removes the timer when an active toast updates to loading", async () => {
    const viewport = renderToaster({ duration: 100 });
    const manager = createToastManager(viewport);

    const id = manager.add({ title: "Queued" });

    await vi.advanceTimersByTimeAsync(50);
    manager.update(id, { title: "Working", variant: "loading" });
    await vi.advanceTimersByTimeAsync(200);

    expect(getToast(id)?.getAttribute("data-state")).toBe("open");
  });

  it("does not resume paused timers after a toast becomes untimed", async () => {
    const viewport = renderToaster({ duration: 100 });
    const manager = createToastManager(viewport);

    const loadingId = manager.add({ title: "Will become loading" });
    const persistentId = manager.add({ title: "Will become persistent" });

    await vi.advanceTimersByTimeAsync(60);
    viewport.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

    manager.update(loadingId, { title: "Loading now", variant: "loading" });
    manager.update(persistentId, { duration: 0, title: "Persistent now" });

    viewport.dispatchEvent(
      new MouseEvent("mouseleave", { bubbles: true, clientX: -1, clientY: -1 }),
    );

    await vi.advanceTimersByTimeAsync(500);

    expect(getToast(loadingId)?.getAttribute("data-state")).toBe("open");
    expect(getToast(persistentId)?.getAttribute("data-state")).toBe("open");
  });

  it("keeps paused loading toasts untimed even when they carry a positive duration", async () => {
    const viewport = renderToaster({ duration: 100 });
    const manager = createToastManager(viewport);

    const id = manager.add({ title: "Will become loading" });

    await vi.advanceTimersByTimeAsync(60);
    viewport.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

    manager.update(id, { duration: 100, title: "Still loading", variant: "loading" });

    viewport.dispatchEvent(
      new MouseEvent("mouseleave", { bubbles: true, clientX: -1, clientY: -1 }),
    );
    await vi.advanceTimersByTimeAsync(500);

    expect(getToast(id)?.getAttribute("data-state")).toBe("open");
  });

  it("upserts duplicate toast ids instead of rendering duplicate records", async () => {
    const viewport = renderToaster({ duration: 100 });
    const manager = createToastManager(viewport);

    const firstId = manager.add({ id: "same", title: "First" });

    await vi.advanceTimersByTimeAsync(75);
    const secondId = manager.add({ id: "same", title: "Second" });

    expect(secondId).toBe(firstId);
    expect(document.querySelectorAll('[data-toast-id="same"]')).toHaveLength(1);
    expect(manager.getToasts()).toHaveLength(1);
    expect(getPart(getToast("same"), "data-sw-toast-title-text")?.textContent).toBe("Second");

    await vi.advanceTimersByTimeAsync(99);
    expect(getToast("same")?.getAttribute("data-state")).toBe("open");

    await vi.advanceTimersByTimeAsync(1);
    expect(getToast("same")?.getAttribute("data-state")).toBe("closed");
  });

  it("auto-dismisses promise success toasts with the viewport duration by default", async () => {
    renderToaster({ duration: 80 });
    createToastManager(document.querySelector<HTMLElement>("[data-sw-toast-viewport]")!);

    await toast.promise(Promise.resolve("default"), {
      error: "Failed",
      loading: "Loading promise",
      success: (value) => `Loaded ${value}`,
    });

    const settledToast = getToastByText("Loaded default");
    expect(settledToast?.getAttribute("data-state")).toBe("open");

    await vi.advanceTimersByTimeAsync(79);
    expect(settledToast?.getAttribute("data-state")).toBe("open");

    await vi.advanceTimersByTimeAsync(1);
    expect(settledToast?.getAttribute("data-state")).toBe("closed");

    await vi.advanceTimersByTimeAsync(200);
    expect(getToastByText("Loaded default")).toBeNull();
  });

  it("honors explicit positive duration for settled promise toasts", async () => {
    renderToaster({ duration: 500 });
    createToastManager(document.querySelector<HTMLElement>("[data-sw-toast-viewport]")!);

    await toast.promise(Promise.resolve("short"), {
      error: "Failed",
      loading: "Loading promise",
      success: (value) => ({ duration: 40, title: `Loaded ${value}` }),
    });

    const settledToast = getToastByText("Loaded short");

    await vi.advanceTimersByTimeAsync(39);
    expect(settledToast?.getAttribute("data-state")).toBe("open");

    await vi.advanceTimersByTimeAsync(1);
    expect(settledToast?.getAttribute("data-state")).toBe("closed");
  });

  it("auto-dismisses promise error toasts with the viewport duration by default", async () => {
    renderToaster({ duration: 80 });
    createToastManager(document.querySelector<HTMLElement>("[data-sw-toast-viewport]")!);

    await expect(
      toast.promise(Promise.reject(new Error("offline")), {
        error: (error) => `Failed: ${error.message}`,
        loading: "Loading promise",
        success: "Loaded",
      }),
    ).rejects.toThrow("offline");

    const settledToast = getToastByText("Failed: offline");
    expect(settledToast?.getAttribute("data-state")).toBe("open");
    expect(settledToast?.getAttribute("data-variant")).toBe("error");

    await vi.advanceTimersByTimeAsync(80);
    expect(settledToast?.getAttribute("data-state")).toBe("closed");
  });

  it("honors an explicit zero duration for settled promise toasts", async () => {
    renderToaster({ duration: 60 });
    createToastManager(document.querySelector<HTMLElement>("[data-sw-toast-viewport]")!);

    await toast.promise(Promise.resolve("persistent"), {
      error: "Failed",
      loading: "Loading promise",
      success: (value) => ({ duration: 0, title: `Loaded ${value}` }),
    });

    await vi.advanceTimersByTimeAsync(260);

    const settledToast = getToastByText("Loaded persistent");
    expect(settledToast?.getAttribute("data-state")).toBe("open");
  });

  it("does not reopen a dismissed promise toast when it settles", async () => {
    renderToaster({ duration: 80 });
    createToastManager(document.querySelector<HTMLElement>("[data-sw-toast-viewport]")!);

    let resolvePromise!: (value: string) => void;
    const pending = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });

    const result = toast.promise(pending, {
      error: "Failed",
      loading: "Loading promise",
      success: (value) => `Loaded ${value}`,
    });

    const loadingToast = getToastByText("Loading promise");
    toast.dismiss(loadingToast?.getAttribute("data-toast-id") ?? undefined);
    resolvePromise("dismissed");

    await result;
    await vi.advanceTimersByTimeAsync(200);

    expect(getToastByText("Loaded dismissed")).toBeNull();
    expect(getToastByText("Loading promise")).toBeNull();
  });

  it("does not mutate visible toast state when updating to a missing variant template", () => {
    const viewport = renderToaster({ variants: ["default"] });
    const manager = createToastManager(viewport);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const id = manager.add({ duration: 0, title: "Visible" });
    manager.update(id, { title: "Missing", variant: "loading" });

    const visibleToast = getToast(id);
    expect(error).toHaveBeenCalledWith('Toast template for variant "loading" not found');
    expect(visibleToast?.getAttribute("data-variant")).toBe("default");
    expect(getPart(visibleToast, "data-sw-toast-title-text")?.textContent).toBe("Visible");
    expect(manager.getToasts()[0]?.variant).toBeUndefined();

    error.mockRestore();
  });

  it("does not add invisible records when a variant template is missing", () => {
    const viewport = renderToaster({ variants: ["default"] });
    const manager = createToastManager(viewport);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const visibleId = manager.add({ duration: 0, title: "Visible" });
    const missingId = manager.add({ duration: 0, title: "Missing", variant: "loading" });

    const visibleToast = getToast(visibleId);
    expect(error).toHaveBeenCalledWith('Toast template for variant "loading" not found');
    expect(getToast(missingId)).toBeNull();
    expect(manager.getToasts()).toHaveLength(1);
    expect(visibleToast?.style.getPropertyValue("--toast-index")).toBe("0");
    expect(getPart(visibleToast, "data-sw-toast-content")?.hasAttribute("data-behind")).toBe(false);

    error.mockRestore();
  });

  it("makes over-limit toasts inert until they become visible again", async () => {
    const viewport = renderToaster({ limit: 1 });
    const manager = createToastManager(viewport);

    const olderId = manager.add({
      action: { label: "Undo", onClick: vi.fn() },
      duration: 0,
      title: "Older",
    });
    const frontId = manager.add({ duration: 0, title: "Front" });
    const olderToast = getToast(olderId);
    const olderAction = getPart(olderToast, "data-sw-toast-action");

    expect(olderToast?.hasAttribute("data-limited")).toBe(true);
    expect(olderToast?.hasAttribute("inert")).toBe(true);

    olderAction?.focus();
    expect(document.activeElement).not.toBe(olderAction);

    manager.close(frontId);
    await vi.advanceTimersByTimeAsync(200);

    expect(olderToast?.hasAttribute("data-limited")).toBe(false);
    expect(olderToast?.hasAttribute("inert")).toBe(false);

    olderAction?.focus();
    expect(document.activeElement).toBe(olderAction);
  });

  it("syncs live limit changes from the viewport attributes", async () => {
    const viewport = renderToaster({ limit: 2 });
    const manager = createToastManager(viewport);

    const olderId = manager.add({ duration: 0, title: "Older" });
    manager.add({ duration: 0, title: "Front" });
    const olderToast = getToast(olderId);

    expect(olderToast?.hasAttribute("data-limited")).toBe(false);
    expect(olderToast?.hasAttribute("inert")).toBe(false);

    viewport.setAttribute("data-limit", "1");
    await waitForMutationObserver();

    expect(olderToast?.hasAttribute("data-limited")).toBe(true);
    expect(olderToast?.hasAttribute("inert")).toBe(true);

    viewport.setAttribute("data-limit", "2");
    await waitForMutationObserver();

    expect(olderToast?.hasAttribute("data-limited")).toBe(false);
    expect(olderToast?.hasAttribute("inert")).toBe(false);
  });

  it("syncs live duration changes for future default timers only", async () => {
    const viewport = renderToaster({ duration: 100 });
    const manager = createToastManager(viewport);

    const existingId = manager.add({ title: "Existing default" });
    await vi.advanceTimersByTimeAsync(40);

    viewport.setAttribute("data-duration", "30");
    await waitForMutationObserver();

    const futureId = manager.add({ title: "Future default" });

    await vi.advanceTimersByTimeAsync(29);
    expect(getToast(futureId)?.getAttribute("data-state")).toBe("open");
    expect(getToast(existingId)?.getAttribute("data-state")).toBe("open");

    await vi.advanceTimersByTimeAsync(1);
    expect(getToast(futureId)?.getAttribute("data-state")).toBe("closed");
    expect(getToast(existingId)?.getAttribute("data-state")).toBe("open");
  });

  it("syncs live position changes into swipe dismissal direction", async () => {
    const viewport = renderToaster();
    const manager = createToastManager(viewport);

    const id = manager.add({ duration: 0, title: "Swipe up" });
    const item = getToast(id);

    viewport.setAttribute("data-position", "top-left");
    await waitForMutationObserver();

    item?.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: 0,
        clientY: 100,
        pointerId: 1,
      }),
    );
    item?.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 0,
        clientY: 20,
        pointerId: 1,
      }),
    );
    item?.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        clientX: 0,
        clientY: 20,
        pointerId: 1,
      }),
    );

    expect(item?.getAttribute("data-state")).toBe("closed");
    expect(item?.getAttribute("data-swipe-direction")).toBe("up");
  });
});

function renderToaster(
  options: { duration?: number; limit?: number; rootAttributes?: string; variants?: string[] } = {},
): HTMLElement {
  const {
    duration = 5000,
    limit = 2,
    rootAttributes = "",
    variants = ["default", "success", "error", "warning", "info", "loading"],
  } = options;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-toast-viewport
      data-position="bottom-right"
      data-limit="${limit}"
      data-duration="${duration}"
      style="--gap: 8px; --peek: 16px;"
    >
      ${variants.map((variant) => renderTemplate(variant, rootAttributes)).join("")}
    </div>
  `;

  const viewport = wrapper.firstElementChild as HTMLElement;
  document.body.append(viewport);
  return viewport;
}

function renderTemplate(variant: string, rootAttributes = ""): string {
  const itemVariant = variant === "loading" ? "default" : variant;

  return `
    <template data-sw-toast-template="${variant}">
      <div
        data-sw-toast-root
        data-slot="toast"
      data-state="open"
      data-variant="${itemVariant}"
      role="dialog"
      aria-modal="false"
      ${rootAttributes}
    >
        <div data-sw-toast-content data-slot="toast-content">
          <div data-sw-toast-title data-slot="toast-title">
            <span data-sw-toast-title-text>Title</span>
          </div>
          <div data-sw-toast-description data-slot="toast-description">Description</div>
          <button data-sw-toast-action data-slot="toast-action" type="button">Action</button>
        </div>
        <button data-sw-toast-close data-slot="toast-close" type="button">Close</button>
      </div>
    </template>
  `;
}

function getToast(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-toast-id="${id}"]`);
}

function getToastByText(text: string): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>("[data-sw-toast-root]")).find((candidate) =>
      candidate.textContent?.includes(text),
    ) ?? null
  );
}

function getPart(root: HTMLElement | null, attribute: string): HTMLElement | null {
  return root?.querySelector<HTMLElement>(`[${attribute}]`) ?? null;
}

async function waitForMutationObserver(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
