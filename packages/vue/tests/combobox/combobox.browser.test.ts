import {
  Comment,
  Fragment,
  Text,
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

import type {
  ComboboxInputValueChangeDetails,
  ComboboxValueChangeDetails,
} from "@starwind-ui/runtime/combobox";
import { createDialog } from "@starwind-ui/runtime/dialog";
import {
  ComboboxClear,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxIcon,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemText,
  ComboboxLabel,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxRoot,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from "@starwind-ui/vue/combobox";
import StyledButton from "../../../../apps/vue-demo/src/components/starwind-runtime/button/Button.vue";

const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Combobox public behavior", () => {
  it("delegates filtering, active descendant, selection, form reset, floating and cleanup", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const form = document.createElement("form");
    form.id = "fruit-form";
    document.body.append(form);
    const overlays = document.createElement("div");
    overlays.id = "overlays";
    document.body.append(overlays);
    const host = document.createElement("div");
    document.body.append(host);
    const events: string[] = [];
    const app = createApp({
      render: () =>
        renderCombobox({
          defaultInputValue: "Apple",
          defaultValue: "apple",
          form: "fruit-form",
          name: "fruit",
          onInputValueChange: () => events.push("input-detail"),
          onValueChange: () => events.push("value-detail"),
          "onUpdate:inputValue": () => events.push("input-update"),
          "onUpdate:modelValue": () => events.push("value-update"),
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await frame();

    const input = host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
    const root = host.querySelector<HTMLElement>("[data-sw-combobox]")!;
    expect(overlays.querySelector("[data-sw-combobox-portal]")).not.toBeNull();
    expect(input.value).toBe("Apple");
    input.focus();
    input.value = "ban";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await frame();
    expect(events.slice(0, 2)).toEqual(["input-detail", "input-update"]);
    expect(item("apple").hidden).toBe(true);
    expect(item("banana").hidden).toBe(false);

    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(input.getAttribute("aria-activedescendant")).toBe(item("banana").id);
    expect(item("banana").hasAttribute("data-highlighted")).toBe(true);
    item("banana").click();
    await frame();
    expect(events).toContain("value-detail");
    expect(events).toContain("value-update");
    expect(root.getAttribute("data-value")).toBe("banana");
    expect(Object.fromEntries(new FormData(form))).toEqual({ fruit: "banana" });
    expect(overlays.querySelector("[data-side]")).not.toBeNull();

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    expect(root.getAttribute("data-value")).toBe("apple");
    expect(input.value).toBe("Apple");
    expect(host.querySelector("[data-sw-combobox-value]")?.textContent?.trim()).toBe("Apple");

    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(overlays.children).toHaveLength(0);
  });

  it("keeps all controlled models parent-owned and accepts updates only after detail cancellation", async () => {
    const overlays = document.createElement("div");
    overlays.id = "overlays";
    document.body.append(overlays);
    const state = reactive({ inputValue: "", open: false, value: "apple" as string | null });
    const events: string[] = [];
    let cancelInput = true;
    let cancelValue = true;
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        renderCombobox({
          inputValue: state.inputValue,
          modelValue: state.value,
          open: state.open,
          onInputValueChange: (_value: string, detail: ComboboxInputValueChangeDetails) => {
            events.push("input-detail");
            if (cancelInput) detail.cancel();
          },
          onValueChange: (_value: string | null, detail: ComboboxValueChangeDetails) => {
            events.push("value-detail");
            if (cancelValue) detail.cancel();
          },
          "onUpdate:inputValue": () => events.push("input-update"),
          "onUpdate:modelValue": () => events.push("value-update"),
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const input = host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;

    input.value = "ban";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await nextTick();
    expect(events).toEqual(["input-detail"]);
    expect(host.querySelector("[data-sw-combobox]")?.hasAttribute("data-input-value")).toBe(false);

    cancelInput = false;
    input.value = "ban";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await frame();
    expect(events.slice(-2)).toEqual(["input-detail", "input-update"]);
    expect(host.querySelector("[data-sw-combobox]")?.hasAttribute("data-input-value")).toBe(false);

    state.inputValue = "ban";
    state.open = true;
    await frame();
    item("banana").click();
    await nextTick();
    expect(events.at(-1)).toBe("value-detail");
    expect(host.querySelector("[data-sw-combobox]")?.getAttribute("data-value")).toBe("apple");

    cancelValue = false;
    item("banana").click();
    await frame();
    expect(events.slice(-4)).toEqual([
      "value-detail",
      "value-update",
      "input-detail",
      "input-update",
    ]);
  });

  it("recreates constructor options with preserved state and exact cleanup", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const options = reactive({
      filterMode: "contains" as "contains" | "startsWith",
      readOnly: false,
    });
    let acceptedInputValue = "";
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderCombobox({
          defaultOpen: true,
          filterMode: options.filterMode,
          readOnly: options.readOnly,
          "onUpdate:inputValue": (value: string) => {
            acceptedInputValue = value;
          },
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const input = host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;

    input.value = "ana";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await frame();
    expect(item("banana").hidden).toBe(false);
    expect(acceptedInputValue).toBe("ana");

    options.filterMode = "startsWith";
    await frame();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(host.querySelector("[data-sw-combobox]")?.getAttribute("data-input-value")).toBe("ana");
    expect(host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!.value).toBe("ana");
    expect(item("banana").hidden).toBe(true);

    options.readOnly = true;
    await frame();
    expect(abort).toHaveBeenCalledTimes(2);
    input.value = "ban";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!.value).toBe("ana");

    options.readOnly = false;
    await frame();
    expect(abort).toHaveBeenCalledTimes(3);
    input.value = "ban";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await frame();
    expect(host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!.value).toBe("ban");

    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(4);
  });

  it("composes Trigger and Clear asChild with merged attrs, listeners and refs", async () => {
    const triggerRef = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
    const clearRef = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
    const asChildState = reactive({ triggerTag: "button" as "a" | "button" });
    const calls: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderCombobox(
          { defaultValue: "apple" },
          {
            clearChild: h(
              "a",
              { class: "clear-child", href: "#clear", onClick: () => calls.push("clear-child") },
              "Clear",
            ),
            clearProps: {
              asChild: true,
              class: "clear-wrapper",
              onClick: () => calls.push("clear-wrapper"),
              ref: clearRef,
            },
            triggerChild: h(
              asChildState.triggerTag,
              {
                class: "trigger-child",
                href: asChildState.triggerTag === "a" ? "#open" : undefined,
                onClick: () => calls.push("trigger-child"),
              },
              "Open",
            ),
            triggerProps: {
              asChild: true,
              class: "trigger-wrapper",
              onClick: () => calls.push("trigger-wrapper"),
              ref: triggerRef,
            },
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    const trigger = host.querySelector<HTMLElement>("[data-sw-combobox-trigger]")!;
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.className).toContain("trigger-child");
    expect(trigger.className).toContain("trigger-wrapper");
    expect(triggerRef.value?.element).toBe(trigger);
    trigger.click();
    await frame();
    expect(calls).toEqual(["trigger-child", "trigger-wrapper"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    const clear = host.querySelector<HTMLElement>("[data-sw-combobox-clear]")!;
    expect(clear.tagName).toBe("A");
    expect(clear.className).toContain("clear-child");
    expect(clear.className).toContain("clear-wrapper");
    expect(clearRef.value?.element).toBe(clear);
    clear.click();
    await frame();
    expect(calls.slice(-2)).toEqual(["clear-child", "clear-wrapper"]);
    expect(host.querySelector("[data-sw-combobox]")?.hasAttribute("data-value")).toBe(false);

    const firstTrigger = trigger;
    asChildState.triggerTag = "a";
    await frame();
    const replacementTrigger = host.querySelector<HTMLElement>("[data-sw-combobox-trigger]")!;
    expect(replacementTrigger.tagName).toBe("A");
    expect(replacementTrigger).not.toBe(firstTrigger);
    expect(triggerRef.value?.element).toBe(replacementTrigger);

    const triggerHandle = triggerRef.value!;
    const clearHandle = clearRef.value!;
    app.unmount();
    cleanups.pop();
    expect(triggerHandle.element).toBeNull();
    expect(clearHandle.element).toBeNull();
  });

  it("composes generated Styled Button component roots and a single-child Fragment boundary", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const triggerRef = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
    const clearRef = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
    const triggerChildRef = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
    const clearChildRef = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
    const state = reactive({
      clearAs: "button" as "a" | "button",
      triggerAs: "button" as "a" | "button",
    });
    const calls: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderCombobox(
          { defaultValue: "apple" },
          {
            clearChild: h(
              Fragment,
              null,
              h(
                StyledButton,
                {
                  as: state.clearAs,
                  class: "clear-child",
                  href: state.clearAs === "a" ? "#clear" : undefined,
                  onClick: () => calls.push("clear-child"),
                  ref: clearChildRef,
                },
                { default: () => "Clear" },
              ),
            ),
            clearProps: {
              asChild: true,
              class: "clear-wrapper",
              onClick: () => calls.push("clear-wrapper"),
              ref: clearRef,
            },
            triggerChild: h(
              StyledButton,
              {
                as: state.triggerAs,
                class: "trigger-child",
                href: state.triggerAs === "a" ? "#open" : undefined,
                onClick: () => calls.push("trigger-child"),
                ref: triggerChildRef,
              },
              { default: () => "Open" },
            ),
            triggerProps: {
              asChild: true,
              class: "trigger-wrapper",
              "data-state": "consumer-state",
              onClick: () => calls.push("trigger-wrapper"),
              ref: triggerRef,
            },
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await frame();

    const trigger = host.querySelector<HTMLElement>("[data-sw-combobox-trigger]")!;
    const clear = host.querySelector<HTMLElement>("[data-sw-combobox-clear]")!;
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.className).toContain("trigger-child");
    expect(trigger.className).toContain("trigger-wrapper");
    expect(trigger.getAttribute("data-state")).toBe("closed");
    expect(triggerRef.value?.element).toBe(trigger);
    expect(triggerChildRef.value?.element).toBe(trigger);
    expect(clearRef.value?.element).toBe(clear);
    expect(clearChildRef.value?.element).toBe(clear);

    trigger.click();
    await frame();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    trigger.click();
    await frame();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(calls).toEqual(["trigger-child", "trigger-wrapper", "trigger-child", "trigger-wrapper"]);
    expect(abort).not.toHaveBeenCalled();

    const firstTrigger = trigger;
    const firstClear = clear;
    state.triggerAs = "a";
    state.clearAs = "a";
    await frame();
    const replacementTrigger = host.querySelector<HTMLElement>("[data-sw-combobox-trigger]")!;
    const replacementClear = host.querySelector<HTMLElement>("[data-sw-combobox-clear]")!;
    expect(replacementTrigger.tagName).toBe("A");
    expect(replacementClear.tagName).toBe("A");
    expect(replacementTrigger).not.toBe(firstTrigger);
    expect(replacementClear).not.toBe(firstClear);
    expect(triggerRef.value?.element).toBe(replacementTrigger);
    expect(triggerChildRef.value?.element).toBe(replacementTrigger);
    expect(clearRef.value?.element).toBe(replacementClear);
    expect(clearChildRef.value?.element).toBe(replacementClear);

    const root = host.querySelector<HTMLElement>("[data-sw-combobox]")!;
    const popup = document.querySelector<HTMLElement>("[data-sw-combobox-popup]")!;
    calls.length = 0;
    firstTrigger.click();
    firstClear.click();
    await frame();
    expect(popup.hidden).toBe(true);
    expect(root.getAttribute("data-value")).toBe("apple");

    calls.length = 0;
    replacementTrigger.click();
    await frame();
    expect(popup.hidden).toBe(false);
    replacementClear.click();
    await frame();
    expect(root.hasAttribute("data-value")).toBe(false);
    expect(calls).toEqual(["trigger-child", "trigger-wrapper", "clear-child", "clear-wrapper"]);
    expect(abort).toHaveBeenCalledTimes(1);

    const triggerHandle = triggerRef.value!;
    const clearHandle = clearRef.value!;
    const triggerChildHandle = triggerChildRef.value!;
    const clearChildHandle = clearChildRef.value!;
    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(2);
    expect(triggerHandle.element).toBeNull();
    expect(clearHandle.element).toBeNull();
    expect(triggerChildHandle.element).toBeNull();
    expect(clearChildHandle.element).toBeNull();
  });

  it.each([
    ["Text Trigger", { triggerProps: { asChild: true }, triggerChild: h(Text, null, "text") }],
    ["Comment Clear", { clearProps: { asChild: true }, clearChild: h(Comment) }],
    [
      "multiple-child Trigger",
      {
        triggerProps: { asChild: true },
        triggerChild: h(Fragment, null, [h("button"), h("span")]),
      },
    ],
    [
      "multiple-root Clear",
      {
        clearProps: { asChild: true },
        clearChild: h(defineComponent({ render: () => [h("button"), h("span")] })),
      },
    ],
    [
      "rootless Trigger",
      {
        triggerProps: { asChild: true },
        triggerChild: h(defineComponent({ render: () => null })),
      },
    ],
  ] as const)("rejects invalid %s asChild slots with an actionable error", (_part, options) => {
    const host = appendHost();
    const app = createApp({ render: () => renderCombobox({}, options) });
    app.config.warnHandler = () => {};
    expect(() => app.mount(host)).toThrow(/asChild .*(native|Fragment|root)/);
  });

  it("refreshes initial-open Runtime ownership across reactive Teleport targets", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const first = document.createElement("div");
    first.id = "first-overlays";
    const second = document.createElement("div");
    second.id = "second-overlays";
    document.body.append(first, second);
    const portal = reactive<{ container: string | HTMLElement; disabled: boolean }>({
      container: "#first-overlays",
      disabled: false,
    });
    const model = reactive({ open: true });
    const host = appendHost();
    const app = createApp({
      render: () => renderCombobox({ open: model.open }, { portalProps: portal }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await frame();
    expect(document.querySelector("[data-sw-combobox-portal]")?.parentElement?.id).toBe(
      "first-overlays",
    );
    expect(first.querySelector<HTMLElement>("[data-sw-combobox-popup]")!.hidden).toBe(false);

    portal.container = second;
    await frame();
    expect(second.querySelector("[data-sw-combobox-popup]")).not.toBeNull();
    expect(second.querySelector<HTMLElement>("[data-sw-combobox-popup]")!.hidden).toBe(false);
    portal.disabled = true;
    await frame();
    expect(host.querySelector<HTMLElement>("[data-sw-combobox-popup]")!.hidden).toBe(false);
    portal.disabled = false;
    await frame();
    expect(second.querySelector<HTMLElement>("[data-sw-combobox-popup]")!.hidden).toBe(false);

    model.open = false;
    await frame();
    expect(second.querySelector<HTMLElement>("[data-sw-combobox-popup]")!.hidden).toBe(true);
    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(first.children).toHaveLength(0);
    expect(second.children).toHaveLength(0);
  });

  it("reapplies controlled open after disabled and honors native open cancellation", async () => {
    const state = reactive({ disabled: false, open: true });
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderCombobox({
          disabled: state.disabled,
          open: state.open,
          onOpenChange: () => events.push("open-detail"),
          onValueChange: () => events.push("value-detail"),
          "onUpdate:open": () => events.push("open-update"),
          "onUpdate:modelValue": () => events.push("value-update"),
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector<HTMLElement>("[data-sw-combobox]")!;
    const input = host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
    state.disabled = true;
    await frame();
    state.disabled = false;
    await frame();
    expect(document.querySelector<HTMLElement>("[data-sw-combobox-popup]")!.hidden).toBe(false);
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(input.getAttribute("aria-activedescendant")).toBe(item("apple").id);
    item("banana").click();
    await frame();
    expect(events).toContain("value-detail");
    expect(events).toContain("value-update");

    state.open = false;
    await frame();
    root.addEventListener("starwind:open-change", (event) => event.preventDefault(), {
      once: true,
    });
    host.querySelector<HTMLElement>("[data-sw-combobox-trigger]")!.click();
    await nextTick();
    expect(events.at(-1)).toBe("open-detail");
    expect(events.at(-1)).not.toBe("open-update");
    expect(document.querySelector<HTMLElement>("[data-sw-combobox-popup]")!.hidden).toBe(true);
  });

  it("tracks Runtime-owned selected text and dynamic collection changes", async () => {
    const items = reactive<Array<[string, string]>>([
      ["apple", "Apple"],
      ["banana", "Banana"],
    ]);
    const host = appendHost();
    const app = createApp({ render: () => renderCombobox({ defaultValue: "banana" }, { items }) });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await frame();
    expect(host.querySelector("[data-sw-combobox-value]")?.textContent).toContain("Banana");

    items.push(["cherry", "Cherry"]);
    await nextTick();
    host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!.value = "cher";
    host
      .querySelector<HTMLInputElement>("[data-sw-combobox-input]")!
      .dispatchEvent(new InputEvent("input", { bubbles: true }));
    await frame();
    expect(item("cherry").hidden).toBe(false);
    item("cherry").click();
    await frame();
    expect(host.querySelector("[data-sw-combobox-value]")?.textContent).toContain("Cherry");
    items.splice(
      items.findIndex(([value]) => value === "cherry"),
      1,
    );
    await frame();
    expect(document.querySelector('[data-sw-combobox-item][data-value="cherry"]')).toBeNull();

    host.querySelector<HTMLElement>("[data-sw-combobox-trigger]")!.click();
    await frame();
    const reopenedInput = host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
    reopenedInput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(reopenedInput.getAttribute("aria-activedescendant")).toBe(item("apple").id);
    reopenedInput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    await frame();
    expect(host.querySelector("[data-sw-combobox]")?.getAttribute("data-value")).toBe("apple");
    expect(host.querySelector("[data-sw-combobox-value]")?.textContent?.trim()).toBe("Apple");
  });

  it("reads back Runtime input text after a controlled value prop update", async () => {
    const state = reactive({
      filterMode: "contains" as "contains" | "startsWith",
      value: "apple" as string | null,
    });
    const host = appendHost();
    const app = createApp({
      render: () => renderCombobox({ filterMode: state.filterMode, modelValue: state.value }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await frame();

    state.value = "banana";
    await frame();
    expect(host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!.value).toBe("Banana");
    expect(host.querySelector("[data-sw-combobox]")?.getAttribute("data-input-value")).toBe(
      "Banana",
    );
    expect(host.querySelector("[data-sw-combobox]")?.getAttribute("data-value")).toBe("banana");
    expect(host.querySelector("[data-sw-combobox-value]")?.textContent?.trim()).toBe("Banana");

    state.filterMode = "startsWith";
    await frame();

    expect(host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!.value).toBe("Banana");
    expect(host.querySelector("[data-sw-combobox]")?.getAttribute("data-input-value")).toBe(
      "Banana",
    );
    expect(host.querySelector("[data-sw-combobox]")?.getAttribute("data-value")).toBe("banana");
    expect(host.querySelector("[data-sw-combobox-value]")?.textContent).toContain("Banana");

    host.querySelector<HTMLElement>("[data-sw-combobox-trigger]")!.click();
    await frame();
    expect(item("apple").hidden).toBe(false);
  });

  it("keeps selected item text independent from controlled and typed input queries", async () => {
    const state = reactive({ inputValue: "", value: "apple" as string | null });
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderCombobox({
          inputValue: state.inputValue,
          modelValue: state.value,
          "onUpdate:inputValue": (value: string) => {
            state.inputValue = value;
          },
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await frame();
    expect(host.querySelector("[data-sw-combobox-value]")?.textContent).toContain("Apple");

    state.value = "banana";
    state.inputValue = "";
    await frame();
    const input = host.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
    input.value = "ap";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await frame();

    expect(state.inputValue).toBe("ap");
    expect(host.querySelector("[data-sw-combobox-value]")?.textContent).toContain("Banana");
  });

  it("preserves explicit Value slot content across Runtime updates", async () => {
    const state = reactive({ inputValue: "", value: "apple" as string | null });
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderCombobox(
          {
            inputValue: state.inputValue,
            modelValue: state.value,
          },
          { valueChild: h("strong", null, "Custom value") },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await frame();

    const value = host.querySelector<HTMLElement>('[data-sw-part="value"]')!;
    expect(value.hasAttribute("data-sw-combobox-value")).toBe(false);
    expect(value.textContent?.trim()).toBe("Custom value");

    state.value = "banana";
    state.inputValue = "ap";
    await frame();
    expect(value.textContent?.trim()).toBe("Custom value");
  });

  it("keeps an initially open popup owned by its dialog after Teleport activation", async () => {
    const dialogRoot = document.createElement("div");
    dialogRoot.setAttribute("data-sw-dialog", "");
    dialogRoot.innerHTML = `<button data-sw-dialog-trigger>Open</button><dialog data-sw-dialog-content data-slot="dialog-content"></dialog>`;
    document.body.append(dialogRoot);
    const dialogContent = dialogRoot.querySelector<HTMLDialogElement>("dialog")!;
    const dialog = createDialog(dialogRoot);
    dialog.open();
    const host = document.createElement("div");
    dialogContent.append(host);
    const app = createApp({
      render: () => renderCombobox({ defaultOpen: true }, { portalProps: {} }),
    });
    app.mount(host);
    cleanups.push(() => {
      app.unmount();
      dialog.destroy();
    });
    await frame();

    expect(dialogContent.querySelector("[data-sw-combobox-positioner]")).not.toBeNull();
    dialog.close();
    await frame();
    expect(document.querySelector<HTMLElement>("[data-sw-combobox-popup]")!.hidden).toBe(true);
  });
});

function item(value: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-sw-combobox-item][data-value="${value}"]`)!;
}

type RenderOptions = {
  clearChild?: VNode | string;
  clearProps?: Record<string, unknown>;
  items?: Array<[string, string]>;
  portalProps?: Record<string, unknown>;
  triggerChild?: VNode | string;
  triggerProps?: Record<string, unknown>;
  valueChild?: VNode | string;
};

function renderCombobox(rootProps: Record<string, unknown>, options: RenderOptions = {}) {
  const items = options.items ?? [
    ["apple", "Apple"],
    ["banana", "Banana"],
  ];
  return h(ComboboxRoot, rootProps, {
    default: () => [
      h(ComboboxLabel, null, { default: () => "Fruit" }),
      h(ComboboxInputGroup, null, {
        default: () => [
          h(ComboboxInput),
          h(ComboboxTrigger, options.triggerProps, {
            default: () => options.triggerChild ?? h(ComboboxIcon, null, { default: () => "v" }),
          }),
          h(ComboboxClear, options.clearProps, { default: () => options.clearChild ?? "Clear" }),
          h(
            ComboboxValue,
            { placeholder: "Pick fruit" },
            options.valueChild === undefined
              ? undefined
              : { default: () => options.valueChild as VNode | string },
          ),
        ],
      }),
      h(ComboboxPortal, options.portalProps ?? { container: "#overlays" }, {
        default: () =>
          h(ComboboxPositioner, null, {
            default: () =>
              h(ComboboxPopup, null, {
                default: () => [
                  h(ComboboxEmpty, null, { default: () => "Empty" }),
                  h(ComboboxList, null, {
                    default: () =>
                      h(ComboboxGroup, null, {
                        default: () => [
                          h(ComboboxGroupLabel, null, { default: () => "Available" }),
                          ...items.map(([value, label]) =>
                            h(
                              ComboboxItem,
                              { value },
                              {
                                default: () => [
                                  h(ComboboxItemText, null, { default: () => label }),
                                  h(ComboboxItemIndicator),
                                ],
                              },
                            ),
                          ),
                          h(ComboboxSeparator),
                        ],
                      }),
                  }),
                ],
              }),
          }),
      }),
    ],
  });
}

async function frame(): Promise<void> {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  await nextTick();
}

function appendHost(): HTMLDivElement {
  if (!document.querySelector("#overlays")) {
    const overlays = document.createElement("div");
    overlays.id = "overlays";
    document.body.append(overlays);
  }
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}
