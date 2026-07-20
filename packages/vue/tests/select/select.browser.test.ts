import {
  createApp,
  createSSRApp,
  h,
  nextTick,
  reactive,
  ref,
  type ComponentPublicInstance,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  SelectOpenChangeDetails,
  SelectValueChangeDetails,
} from "@starwind-ui/runtime/select";
import {
  SelectGroup,
  SelectGroupLabel,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectScrollDownArrow,
  SelectScrollUpArrow,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@starwind-ui/vue/select";

type SelectExposed = ComponentPublicInstance & {
  close(): void;
  element: HTMLElement | null;
  open(): void;
  updatePosition(): void;
};

type SelectItemValue = { disabled?: boolean; label: string; value: string };
const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Select public behavior", () => {
  it("forwards public surface and accepts or cancels both models in detail-first order", async () => {
    const exposed = ref<SelectExposed | null>(null);
    const events: string[] = [];
    let cancelValue = false;
    let cancelOpen = false;
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderSelect(
          {
            "aria-label": "Fruit",
            class: "fruit",
            defaultValue: "apple",
            onOpenChange: (_open: boolean, detail: SelectOpenChangeDetails) => {
              events.push("open-detail");
              if (cancelOpen) detail.cancel();
            },
            onValueChange: (_value: string | null, detail: SelectValueChangeDetails) => {
              events.push("value-detail");
              if (cancelValue) detail.cancel();
            },
            "onUpdate:modelValue": () => events.push("value-update"),
            "onUpdate:open": () => events.push("open-update"),
            ref: exposed,
            style: { color: "rgb(255, 0, 0)" },
          },
          [
            { label: "Apple", value: "apple" },
            { label: "Banana", value: "banana" },
          ],
          { disabled: true },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    const root = host.querySelector<HTMLElement>("[data-sw-select]")!;
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!;
    expect(root.className).toBe("fruit");
    expect(root.style.color).toBe("rgb(255, 0, 0)");
    expect(root.getAttribute("aria-label")).toBe("Fruit");
    expect(exposed.value?.element).toBe(root);
    expect(exposed.value).not.toHaveProperty("instance");
    expect(host.querySelector("[data-sw-select-value]")?.textContent).toContain("Apple");

    trigger.click();
    await frame();
    expect(events).toEqual(["open-detail", "open-update"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    cancelValue = true;
    host.querySelector<HTMLElement>('[data-sw-select-item][data-value="banana"]')!.click();
    await nextTick();
    expect(events).toEqual(["open-detail", "open-update", "value-detail"]);
    expect(root.getAttribute("data-value")).toBe("apple");

    cancelValue = false;
    host.querySelector<HTMLElement>('[data-sw-select-item][data-value="banana"]')!.click();
    await frame();
    expect(events.slice(-4)).toEqual([
      "value-detail",
      "value-update",
      "open-detail",
      "open-update",
    ]);
    expect(root.getAttribute("data-value")).toBe("banana");

    cancelOpen = true;
    trigger.click();
    await nextTick();
    expect(events.at(-1)).toBe("open-detail");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps controlled models parent-owned and synchronizes without duplicate emits", async () => {
    const state = reactive<{ open: boolean | undefined; value: string | null | undefined }>({
      open: false,
      value: "apple",
    });
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderSelect(
          {
            modelValue: state.value,
            open: state.open,
            onOpenChange: () => events.push("open-detail"),
            onValueChange: () => events.push("value-detail"),
            "onUpdate:modelValue": () => events.push("value-update"),
            "onUpdate:open": () => events.push("open-update"),
          },
          [
            { label: "Apple", value: "apple" },
            { label: "Banana", value: "banana" },
          ],
          { container: document.body },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!;

    trigger.click();
    await nextTick();
    expect(events).toEqual(["open-detail", "open-update"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    state.open = true;
    await frame();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(events).toEqual(["open-detail", "open-update"]);

    document.querySelector<HTMLElement>('[data-sw-select-item][data-value="banana"]')!.click();
    await nextTick();
    expect(events.slice(-4)).toEqual([
      "value-detail",
      "value-update",
      "open-detail",
      "open-update",
    ]);
    expect(host.querySelector("[data-sw-select]")?.getAttribute("data-value")).toBe("apple");

    state.value = "banana";
    await nextTick();
    expect(host.querySelector("[data-sw-select]")?.getAttribute("data-value")).toBe("banana");
    expect(host.querySelector("[data-sw-select-value]")?.textContent).toContain("Banana");
    expect(events.filter((event) => event === "value-update")).toHaveLength(1);

    state.value = undefined;
    await frame();
    document.querySelector<HTMLElement>('[data-sw-select-item][data-value="apple"]')!.click();
    await frame();
    expect(host.querySelector("[data-sw-select]")?.getAttribute("data-value")).toBe("apple");

    state.open = undefined;
    await frame();
    trigger.click();
    await frame();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("reconciles disabled open state without inventing model events", async () => {
    const uncontrolled = reactive({ disabled: false });
    const uncontrolledEvents: string[] = [];
    const uncontrolledHost = appendHost();
    const uncontrolledApp = createApp({
      render: () =>
        renderSelect(
          {
            defaultOpen: true,
            disabled: uncontrolled.disabled,
            onOpenChange: () => uncontrolledEvents.push("detail"),
            "onUpdate:open": () => uncontrolledEvents.push("update"),
          },
          [{ label: "Apple", value: "apple" }],
          { disabled: true },
        ),
    });
    uncontrolledApp.mount(uncontrolledHost);
    cleanups.push(() => uncontrolledApp.unmount());
    const uncontrolledRoot = uncontrolledHost.querySelector<HTMLElement>("[data-sw-select]")!;
    const uncontrolledTrigger = uncontrolledHost.querySelector<HTMLButtonElement>(
      "[data-sw-select-trigger]",
    )!;
    const uncontrolledPopup =
      uncontrolledHost.querySelector<HTMLElement>("[data-sw-select-popup]")!;

    expectSelectOpenState(uncontrolledRoot, uncontrolledTrigger, uncontrolledPopup, true);
    uncontrolled.disabled = true;
    await frame();
    expectSelectOpenState(uncontrolledRoot, uncontrolledTrigger, uncontrolledPopup, false);
    expect(uncontrolledEvents).toEqual([]);

    uncontrolled.disabled = false;
    await frame();
    expectSelectOpenState(uncontrolledRoot, uncontrolledTrigger, uncontrolledPopup, false);
    uncontrolledTrigger.click();
    await frame();
    expectSelectOpenState(uncontrolledRoot, uncontrolledTrigger, uncontrolledPopup, true);
    expect(uncontrolledEvents).toEqual(["detail", "update"]);

    const controlled = reactive({ disabled: false, open: true });
    const controlledEvents: string[] = [];
    const controlledHost = appendHost();
    const controlledApp = createApp({
      render: () =>
        renderSelect(
          {
            disabled: controlled.disabled,
            open: controlled.open,
            onOpenChange: () => controlledEvents.push("detail"),
            "onUpdate:open": () => controlledEvents.push("update"),
          },
          [{ label: "Apple", value: "apple" }],
          { disabled: true },
        ),
    });
    controlledApp.mount(controlledHost);
    cleanups.push(() => controlledApp.unmount());
    const controlledRoot = controlledHost.querySelector<HTMLElement>("[data-sw-select]")!;
    const controlledTrigger = controlledHost.querySelector<HTMLButtonElement>(
      "[data-sw-select-trigger]",
    )!;
    const controlledPopup = controlledHost.querySelector<HTMLElement>("[data-sw-select-popup]")!;

    expectSelectOpenState(controlledRoot, controlledTrigger, controlledPopup, true);
    controlled.disabled = true;
    await frame();
    expectSelectOpenState(controlledRoot, controlledTrigger, controlledPopup, false);
    expect(controlledEvents).toEqual([]);

    controlled.disabled = false;
    await frame();
    expectSelectOpenState(controlledRoot, controlledTrigger, controlledPopup, true);
    expect(controlledEvents).toEqual([]);
  });

  it("recreates ownership modes through an active Teleport without stale portals or controllers", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const overlays = document.createElement("div");
    overlays.id = "transition-overlays";
    document.body.append(overlays);
    const host = appendHost();
    const models = reactive<{
      open: boolean | undefined;
      value: string | null | undefined;
    }>({ open: true, value: "apple" });
    const portal = reactive({ disabled: false });
    const events: string[] = [];
    const app = createApp({
      render: () =>
        renderSelect(
          {
            modelValue: models.value,
            open: models.open,
            onOpenChange: () => events.push("open-detail"),
            onValueChange: () => events.push("value-detail"),
            "onUpdate:modelValue": () => events.push("value-update"),
            "onUpdate:open": () => events.push("open-update"),
          },
          [
            { label: "Apple", value: "apple" },
            { label: "Banana", value: "banana" },
          ],
          { container: overlays, disabled: portal.disabled },
        ),
    });
    let mounted = true;
    app.mount(host);

    try {
      await frame();
      expectOwnedPortal(host, overlays, "remote");
      const root = host.querySelector<HTMLElement>("[data-sw-select]")!;
      const trigger = host.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!;
      let popup = overlays.querySelector<HTMLElement>("[data-sw-select-popup]")!;
      expectSelectOpenState(root, trigger, popup, true);
      expect(abort).toHaveBeenCalledTimes(0);

      overlays.querySelector<HTMLElement>('[data-sw-select-item][data-value="apple"]')!.click();
      await frame();
      expect(events).toEqual(["value-detail", "value-update", "open-detail", "open-update"]);
      expect(root.getAttribute("data-value")).toBe("apple");
      expect(abort).toHaveBeenCalledTimes(0);

      models.value = undefined;
      await frame();
      expect(abort).toHaveBeenCalledTimes(1);
      expectOwnedPortal(host, overlays, "remote");
      overlays.querySelector<HTMLElement>('[data-sw-select-item][data-value="banana"]')!.click();
      await frame();
      expect(root.getAttribute("data-value")).toBe("banana");

      models.value = "apple";
      await frame();
      expect(abort).toHaveBeenCalledTimes(2);
      expectOwnedPortal(host, overlays, "remote");
      expect(root.getAttribute("data-value")).toBe("apple");

      models.open = undefined;
      await frame();
      expect(abort).toHaveBeenCalledTimes(3);
      expectOwnedPortal(host, overlays, "remote");
      popup = overlays.querySelector<HTMLElement>("[data-sw-select-popup]")!;
      expectSelectOpenState(root, trigger, popup, true);

      models.open = false;
      await frame();
      expect(abort).toHaveBeenCalledTimes(4);
      expectOwnedPortal(host, overlays, "remote");
      popup = overlays.querySelector<HTMLElement>("[data-sw-select-popup]")!;
      expectSelectOpenState(root, trigger, popup, false);

      portal.disabled = true;
      await frame();
      expect(abort).toHaveBeenCalledTimes(4);
      expectOwnedPortal(host, overlays, "local");
      models.open = true;
      await frame();
      popup = host.querySelector<HTMLElement>("[data-sw-select-popup]")!;
      expectSelectOpenState(root, trigger, popup, true);

      portal.disabled = false;
      await frame();
      expect(abort).toHaveBeenCalledTimes(4);
      expectOwnedPortal(host, overlays, "remote");
      popup = overlays.querySelector<HTMLElement>("[data-sw-select-popup]")!;
      expectSelectOpenState(root, trigger, popup, true);

      models.value = undefined;
      await nextTick();
      expect(abort).toHaveBeenCalledTimes(4);
      expectOwnedPortal(host, overlays, "local");
      app.unmount();
      mounted = false;
      await nextTick();
      expect(abort).toHaveBeenCalledTimes(5);
      expect(document.querySelectorAll("[data-sw-select-portal]")).toHaveLength(0);
      expect(overlays.children).toHaveLength(0);
      expect(host.children).toHaveLength(0);
    } finally {
      if (mounted) app.unmount();
    }
  });

  it("delegates dynamic collections, keyboard/pointer, forms, presence and positioning to Runtime", async () => {
    const items = ref<SelectItemValue[]>([
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
    ]);
    const form = document.createElement("form");
    form.id = "fruit-form";
    document.body.append(form);
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderSelect({ defaultValue: "apple", form: "fruit-form", name: "fruit" }, items.value, {
          disabled: true,
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    await frame();
    const popup = host.querySelector<HTMLElement>("[data-sw-select-popup]")!;
    expect(popup.hidden).toBe(false);
    expect(popup.getAttribute("data-state")).toBe("open");
    expect(
      host.querySelector("[data-sw-select-positioner]")?.getAttribute("data-side"),
    ).toBeTruthy();

    items.value.push({ label: "Cherry", value: "cherry" });
    await nextTick();
    await frame();
    expect(host.querySelectorAll("[data-sw-select-item]")).toHaveLength(3);
    popup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));
    await frame();
    const cherry = host.querySelector<HTMLElement>('[data-sw-select-item][data-value="cherry"]')!;
    expect(cherry.hasAttribute("data-highlighted")).toBe(true);
    cherry.click();
    await frame();
    expect(host.querySelector("[data-sw-select]")?.getAttribute("data-value")).toBe("cherry");
    expect(Object.fromEntries(new FormData(form))).toEqual({ fruit: "cherry" });

    items.value = items.value.filter((item) => item.value !== "banana");
    await nextTick();
    expect(host.querySelectorAll("[data-sw-select-item]")).toHaveLength(2);

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    expect(Object.fromEntries(new FormData(form))).toEqual({ fruit: "apple" });
    expect(host.querySelector("[data-sw-select]")?.getAttribute("data-value")).toBe("apple");
  });

  it("moves only owned portals, isolates instances, and destroys exact controllers across remount", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const overlays = document.createElement("div");
    overlays.id = "overlays";
    document.body.append(overlays);
    const host = appendHost();

    const renderPair = () =>
      h("div", null, [
        renderSelect({ defaultValue: "one" }, [{ label: "One", value: "one" }], {
          container: "#overlays",
        }),
        renderSelect({ defaultValue: "two" }, [{ label: "Two", value: "two" }], {
          container: overlays,
        }),
      ]);

    for (let cycle = 1; cycle <= 2; cycle += 1) {
      const app = createApp({ render: renderPair });
      app.mount(host);
      await nextTick();
      expect(overlays.querySelectorAll(":scope > [data-sw-select-portal]")).toHaveLength(2);
      const triggers = host.querySelectorAll<HTMLButtonElement>("[data-sw-select-trigger]");
      triggers[0]!.click();
      await frame();
      expect(triggers[0]!.getAttribute("aria-expanded")).toBe("true");
      expect(triggers[1]!.getAttribute("aria-expanded")).toBe("false");
      app.unmount();
      expect(overlays.children).toHaveLength(0);
      expect(host.children).toHaveLength(0);
    }
    expect(abort).toHaveBeenCalledTimes(4);
  });

  it("hydrates with local portal markup, then Teleports without warnings or leaks", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const overlays = document.createElement("div");
    overlays.id = "hydrate-overlays";
    document.body.append(overlays);
    const root = () =>
      renderSelect(
        { defaultValue: "apple", name: "hydrated-fruit" },
        [{ label: "Apple", value: "apple" }],
        { container: "#hydrate-overlays" },
      );
    const html = await renderToString(createSSRApp({ render: root }));
    const host = appendHost();
    host.innerHTML = html;
    expect(host.querySelectorAll("[data-sw-select-portal]")).toHaveLength(1);
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    await nextTick();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("[data-sw-select]")).toHaveLength(1);
    expect(host.querySelectorAll("[data-sw-select-input]")).toHaveLength(1);
    expect(overlays.querySelectorAll("[data-sw-select-portal]")).toHaveLength(1);

    app.unmount();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(overlays.children).toHaveLength(0);
  });
});

function renderSelect(
  rootProps: Record<string, unknown>,
  items: SelectItemValue[],
  portalProps: { container?: string | HTMLElement; disabled?: boolean },
) {
  return h(SelectRoot, rootProps, {
    default: () => [
      h(SelectLabel, null, { default: () => "Fruit" }),
      h(SelectTrigger, null, {
        default: () => [
          h(SelectValue, { placeholder: "Pick fruit" }),
          h(SelectIcon, null, { default: () => "⌄" }),
        ],
      }),
      h(SelectPortal, portalProps, {
        default: () =>
          h(
            SelectPositioner,
            { alignItemWithTrigger: false },
            {
              default: () =>
                h(SelectPopup, null, {
                  default: () => [
                    h(SelectScrollUpArrow),
                    h(SelectList, null, {
                      default: () => [
                        h(SelectGroup, null, {
                          default: () => [
                            h(SelectGroupLabel, null, { default: () => "Available" }),
                            ...items.map((item) =>
                              h(
                                SelectItem,
                                { disabled: item.disabled, key: item.value, value: item.value },
                                {
                                  default: () => [
                                    h(SelectItemText, null, { default: () => item.label }),
                                    h(SelectItemIndicator, null, { default: () => "✓" }),
                                  ],
                                },
                              ),
                            ),
                          ],
                        }),
                        h(SelectSeparator),
                      ],
                    }),
                    h(SelectScrollDownArrow),
                  ],
                }),
            },
          ),
      }),
    ],
  });
}

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

async function frame(): Promise<void> {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  await nextTick();
}

function expectSelectOpenState(
  root: HTMLElement,
  trigger: HTMLButtonElement,
  popup: HTMLElement,
  open: boolean,
): void {
  expect(root.getAttribute("data-state")).toBe(open ? "open" : "closed");
  expect(trigger.getAttribute("aria-expanded")).toBe(String(open));
  expect(trigger.getAttribute("data-state")).toBe(open ? "open" : "closed");
  expect(popup.getAttribute("data-state")).toBe(open ? "open" : "closed");
  expect(popup.hidden).toBe(!open);
}

function expectOwnedPortal(
  host: HTMLElement,
  overlays: HTMLElement,
  location: "local" | "remote",
): void {
  expect(document.querySelectorAll("[data-sw-select-portal]")).toHaveLength(1);
  expect(host.querySelectorAll("[data-sw-select-portal]")).toHaveLength(
    location === "local" ? 1 : 0,
  );
  expect(overlays.querySelectorAll(":scope > [data-sw-select-portal]")).toHaveLength(
    location === "remote" ? 1 : 0,
  );
}
