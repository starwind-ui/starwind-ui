import type {
  SelectOpenChangeDetails,
  SelectValueChangeDetails,
} from "@starwind-ui/runtime/select";
import { createPortalBinding } from "@starwind-ui/runtime/select";
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
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type ComponentPublicInstance,
  createApp,
  createSSRApp,
  h,
  nextTick,
  reactive,
  ref,
  type VNode,
} from "vue";
import { renderToString } from "vue/server-renderer";
import {
  Select as StyledSelect,
  SelectContent as StyledSelectContent,
  SelectTrigger as StyledSelectTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/select";
import { testAcceptedModelPublication } from "../accepted-model-publication.js";

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

  it("preserves an explicitly empty item label and its selected-value association", async () => {
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderSelect(
          { defaultValue: "apple" },
          [
            { label: "Apple", value: "apple" },
            { label: "", value: "empty" },
          ],
          { disabled: true },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    host.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!.click();
    await frame();
    const emptyItem = host.querySelector<HTMLElement>('[data-sw-select-item][data-value="empty"]')!;
    emptyItem.click();
    await frame();

    const root = host.querySelector<HTMLElement>("[data-sw-select]")!;
    const value = host.querySelector<HTMLElement>("[data-sw-select-value]")!;
    expect(root.getAttribute("data-value")).toBe("empty");
    expect(root.getAttribute("data-selected-value")).toBe("empty");
    expect(root.hasAttribute("data-selected-label")).toBe(true);
    expect(root.getAttribute("data-selected-label")).toBe("");
    expect(emptyItem.getAttribute("aria-selected")).toBe("true");
    expect(value.textContent).toBe("");
    expect(value.textContent).not.toContain("Pick fruit");
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

  it("rebinds a direct Primitive composed trigger after native child replacement", async () => {
    type ExposedElement = ComponentPublicInstance & { element: HTMLElement | null };
    const replacement = ref(false);
    const exposed = ref<ExposedElement | null>(null);
    const sequence: Array<Element | null> = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderSelect({}, [], { disabled: true }, () =>
          h(
            SelectTrigger,
            { asChild: true, ref: exposed },
            {
              default: () =>
                h(
                  replacement.value ? "a" : "button",
                  {
                    href: replacement.value ? "#select" : undefined,
                    key: replacement.value ? "new" : "old",
                    ref: (value: Element | null) => sequence.push(value),
                  },
                  "Choose",
                ),
            },
          ),
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    const oldTrigger = host.querySelector<HTMLElement>("[data-sw-select-trigger]")!;
    oldTrigger.click();
    await frame();
    expect(oldTrigger.getAttribute("aria-expanded")).toBe("true");

    replacement.value = true;
    await nextTick();
    await nextTick();
    const newTrigger = host.querySelector<HTMLElement>("[data-sw-select-trigger]")!;
    expect(newTrigger.tagName).toBe("A");
    expect(exposed.value!.element).toBe(newTrigger);
    expect(sequence).toEqual([oldTrigger, oldTrigger, null, newTrigger]);
    expect(newTrigger.getAttribute("aria-expanded")).toBe("true");
    newTrigger.click();
    await frame();
    expect(newTrigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("delegates Styled SelectTrigger composition and clears its exposed element", async () => {
    type ExposedElement = ComponentPublicInstance & { element: HTMLElement | null };
    const show = ref(true);
    const showContent = ref(true);
    const replacement = ref(false);
    const exposed = ref<ExposedElement | null>(null);
    let child: Element | null = null;
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(StyledSelect, null, {
          default: () =>
            show.value
              ? [
                  h(
                    StyledSelectTrigger,
                    { asChild: true, class: "styled-trigger", ref: exposed },
                    {
                      default: () =>
                        h(
                          replacement.value ? "a" : "button",
                          {
                            class: "native-trigger",
                            href: replacement.value ? "#select" : undefined,
                            key: replacement.value ? "new" : "old",
                            ref: (value: Element | null) => (child = value),
                          },
                          "Choose",
                        ),
                    },
                  ),
                  showContent.value ? h(StyledSelectContent) : null,
                ]
              : [],
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    const trigger = host.querySelector<HTMLElement>("[data-sw-select-trigger]")!;
    expect(trigger.classList.contains("styled-trigger")).toBe(true);
    expect(trigger.classList.contains("native-trigger")).toBe(true);
    expect(trigger).toBe(child);
    expect(exposed.value!.element).toBe(trigger);
    const retained = exposed.value!;

    replacement.value = true;
    await nextTick();
    await nextTick();
    const replaced = host.querySelector<HTMLElement>("[data-sw-select-trigger]")!;
    expect(replaced.tagName).toBe("A");
    expect(replaced).toBe(child);
    expect(retained.element).toBe(replaced);

    const root = host.querySelector<HTMLElement>("[data-sw-select]")!;
    const replacementBinding = createPortalBinding(root);
    showContent.value = false;
    await nextTick();
    const bindingAfterPortalRemoval = createPortalBinding(root);
    expect(bindingAfterPortalRemoval).not.toBe(replacementBinding);
    bindingAfterPortalRemoval.destroy();

    show.value = false;
    await nextTick();
    expect(child).toBeNull();
    expect(retained.element).toBeNull();
  });

  it("keeps native disabled off a composed anchor while retaining disabled state", async () => {
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderSelect({ disabled: true }, [], { disabled: true }, () =>
          h(
            SelectTrigger,
            { asChild: true },
            { default: () => h("a", { href: "#select" }, "Choose") },
          ),
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    const anchor = host.querySelector<HTMLAnchorElement>("[data-sw-select-trigger]")!;
    expect(anchor.tagName).toBe("A");
    expect(anchor.hasAttribute("disabled")).toBe(false);
    expect(anchor.getAttribute("aria-disabled")).toBe("true");
    expect(anchor.hasAttribute("data-disabled")).toBe(true);
  });

  it("does not use a nested Select trigger when the outer trigger is removed", async () => {
    const showOuterTrigger = ref(true);
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderSelect(
          {},
          [],
          { disabled: true },
          () =>
            showOuterTrigger.value ? h(SelectTrigger, null, { default: () => "Outer" }) : null,
          [renderSelect({}, [], { disabled: true })],
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(host.querySelectorAll("[data-sw-select-trigger]")).toHaveLength(2);
    showOuterTrigger.value = false;
    await nextTick();
    await Promise.resolve();

    const nestedTrigger = host.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!;
    expect(host.querySelectorAll("[data-sw-select-trigger]")).toHaveLength(1);
    nestedTrigger.click();
    await frame();
    expect(nestedTrigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("finds the owned trigger when a nested Select trigger precedes it", async () => {
    const replacement = ref(false);
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderSelect(
          {},
          [],
          { disabled: true },
          () =>
            h(
              SelectTrigger,
              { asChild: true },
              {
                default: () =>
                  h(
                    replacement.value ? "a" : "button",
                    {
                      href: replacement.value ? "#outer-select" : undefined,
                      key: replacement.value ? "new" : "old",
                    },
                    "Outer",
                  ),
              },
            ),
          [],
          [renderSelect({}, [], { disabled: true })],
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    replacement.value = true;
    await nextTick();
    await nextTick();
    const roots = host.querySelectorAll<HTMLElement>("[data-sw-select]");
    const outerTrigger = roots[0]!.querySelector<HTMLAnchorElement>(
      ":scope > [data-sw-select-trigger]",
    )!;
    expect(outerTrigger.tagName).toBe("A");
    outerTrigger.click();
    await frame();
    expect(outerTrigger.getAttribute("aria-expanded")).toBe("true");
  });
});

function renderSelect(
  rootProps: Record<string, unknown>,
  items: SelectItemValue[],
  portalProps: { container?: string | HTMLElement; disabled?: boolean },
  trigger?: () => VNode | null,
  extraChildren: VNode[] = [],
  beforeTriggerChildren: VNode[] = [],
) {
  return h(SelectRoot, rootProps, {
    default: () => [
      h(SelectLabel, null, { default: () => "Fruit" }),
      ...beforeTriggerChildren,
      trigger
        ? trigger()
        : h(SelectTrigger, null, {
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
      ...extraChildren,
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
  const portal = document.querySelector<HTMLElement>("[data-sw-select-portal]")!;
  expect(portal.dataset.placement).toBe("ready");
  expect(portal.hasAttribute("data-floating-root")).toBe(true);
  expect(portal.contains(document.querySelector("[data-sw-select-positioner]"))).toBe(true);
  expect(host.querySelectorAll("[data-sw-select-portal]")).toHaveLength(
    location === "local" ? 1 : 0,
  );
  expect(overlays.querySelectorAll(":scope > [data-sw-select-portal]")).toHaveLength(
    location === "remote" ? 1 : 0,
  );
}

const acceptanceItems = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
];
testAcceptedModelPublication({
  name: "Select open",
  model: "open",
  proposal: "onOpenChange",
  domEvent: "starwind:open-change",
  initial: false,
  accepted: true,
  tree: () => renderSelect({}, acceptanceItems, { disabled: true }),
  root: "[data-sw-select]",
  act: (root) => root.querySelector<HTMLElement>("[data-sw-select-trigger]")!.click(),
  read: (root) => root.getAttribute("data-state") === "open",
});
testAcceptedModelPublication({
  name: "Select value",
  model: "modelValue",
  proposal: "onValueChange",
  domEvent: "starwind:value-change",
  initial: "apple",
  accepted: "banana",
  tree: () =>
    renderSelect({ defaultValue: "apple", defaultOpen: true }, acceptanceItems, { disabled: true }),
  root: "[data-sw-select]",
  act: (root) =>
    root.querySelector<HTMLElement>('[data-sw-select-item][data-value="banana"]')!.click(),
  read: (root) => {
    const value = root.querySelector<HTMLInputElement>("[data-sw-select-input]")!.value;
    expect(root.getAttribute("data-selected-label")).toBe(value === "apple" ? "Apple" : "Banana");
    return value;
  },
});
