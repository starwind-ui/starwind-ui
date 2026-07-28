import { createApp, createSSRApp, h, nextTick, ref, type ComponentPublicInstance } from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { InputOtpValueChangeDetails } from "@starwind-ui/runtime/input-otp";
import { FieldRoot } from "@starwind-ui/vue/field";
import {
  InputOtpGroup,
  InputOtpRoot,
  InputOtpSeparator,
  InputOtpSlot,
} from "@starwind-ui/vue/input-otp";
import {
  InputOtp as StyledInputOtp,
  InputOtpGroup as StyledInputOtpGroup,
  InputOtpSeparator as StyledInputOtpSeparator,
  InputOtpSlot as StyledInputOtpSlot,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/input-otp";

type ElementExpose = ComponentPublicInstance & { element: HTMLDivElement | null };
const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Vue Input OTP public behavior", () => {
  it("orders cancelable changes before updates and reconciles a rejected controlled proposal", async () => {
    const model = ref("12");
    const cancelNext = ref(true);
    const events: string[] = [];
    const host = mountOtp({
      modelValue: model.value,
      onValueChange: (value: string, detail: InputOtpValueChangeDetails) => {
        events.push(`change:${value}:${detail.reason}`);
        if (cancelNext.value) detail.cancel();
      },
      "onUpdate:modelValue": (value: string) => events.push(`update:${value}`),
    });
    const root = host.querySelector<HTMLElement>("[data-sw-input-otp]")!;
    const input = host.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!;

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "3" }));
    await settle();
    expect(events).toEqual(["change:123:keyboard"]);
    expect(input.value).toBe("12");

    cancelNext.value = false;
    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "3" }));
    await settle();
    expect(events).toEqual(["change:123:keyboard", "change:123:keyboard", "update:123"]);
    expect(model.value).toBe("12");
    expect(input.value).toBe("12");
    expect(root).toHaveAttribute("data-value", "12");
  });

  it("delegates navigation, deletion, paste filtering, and full-length reasons to Runtime", async () => {
    const details: InputOtpValueChangeDetails[] = [];
    const host = mountOtp({
      defaultValue: "12",
      onValueChange: (_value: string, detail: InputOtpValueChangeDetails) => details.push(detail),
    });
    const root = host.querySelector<HTMLElement>("[data-sw-input-otp]")!;
    const input = host.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!;

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Backspace" }));
    await settle();
    expect(root).toHaveAttribute("data-value", "1");
    expect(details.at(-1)?.reason).toBe("delete");
    expect(details.at(-1)?.value).toBe("1");
    expect(input.value).toBe("1");

    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", {
      value: { getData: () => "a23456z" },
    });
    root.dispatchEvent(paste);
    await settle();
    expect(input.value).toBe("123456");
    expect(details.at(-1)).toEqual(expect.objectContaining({ reason: "paste", value: "123456" }));
    expect(host.querySelectorAll("[data-sw-input-otp-char]")).toHaveLength(6);
    expect(
      [...host.querySelectorAll<HTMLElement>("[data-sw-input-otp-char]")].map(
        (slot) => slot.textContent,
      ),
    ).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("uses one native input for form/reset and Field-owned name, disabled, and validity state", async () => {
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("form", null, [
          h(FieldRoot, { disabled: false, name: "verification" }, () =>
            otpTree(InputOtpRoot, InputOtpGroup, InputOtpSlot, {
              defaultValue: "12",
              required: true,
            }),
          ),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    const form = host.querySelector("form")!;
    const root = host.querySelector<HTMLElement>("[data-sw-input-otp]")!;
    const inputs = host.querySelectorAll<HTMLInputElement>("[data-sw-input-otp-input]");
    expect(inputs).toHaveLength(1);
    const input = inputs[0]!;
    expect(input.name).toBe("verification");
    expect(input.required).toBe(true);
    expect(input.validity.valueMissing).toBe(false);
    expect(new FormData(form).get("verification")).toBe("12");

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "3" }));
    await settle();
    expect(new FormData(form).get("verification")).toBe("123");

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await settle();
    expect(input.value).toBe("12");
    expect(new FormData(form).get("verification")).toBe("12");
  });

  it("reaches a macrotask after a named Field adopts Input OTP", async () => {
    const getMutationDeliveries = installMutationDeliveryLimit();
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(FieldRoot, { name: "verification" }, () =>
          h(InputOtpRoot, { modelValue: "1" }, () => h(InputOtpSlot, { index: 0 })),
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(getMutationDeliveries()).toBeLessThanOrEqual(100);
  });

  it("keeps post-mount native input options Runtime-owned", async () => {
    const disabled = ref(false);
    const form = ref<string>();
    const name = ref<string>();
    const readOnly = ref(false);
    const required = ref(false);
    const externalForm = document.createElement("form");
    externalForm.id = "verification-form";
    document.body.append(externalForm);
    const host = appendHost();
    const app = createApp({
      render: () =>
        otpTree(InputOtpRoot, InputOtpGroup, InputOtpSlot, {
          defaultValue: "12",
          disabled: disabled.value,
          form: form.value,
          name: name.value,
          readOnly: readOnly.value,
          required: required.value,
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    const input = host.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!;
    disabled.value = true;
    form.value = externalForm.id;
    name.value = "verification";
    readOnly.value = true;
    required.value = true;
    await settle();

    expect(input.disabled).toBe(true);
    expect(input.form).toBe(externalForm);
    expect(input.name).toBe("verification");
    expect(input.readOnly).toBe(true);
    expect(input.required).toBe(true);

    disabled.value = false;
    form.value = undefined;
    name.value = undefined;
    readOnly.value = false;
    required.value = false;
    await settle();

    expect(input.disabled).toBe(false);
    expect(input.form).toBeNull();
    expect(input.name).toBe("");
    expect(input.readOnly).toBe(false);
    expect(input.required).toBe(false);
  });

  it("forwards attrs, listeners, indexed caret slots, semantic refs, and cleans multiple mounts", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const showSecond = ref(true);
    const rootRef = ref<ElementExpose | null>(null);
    const groupRef = ref<ElementExpose | null>(null);
    const slotRef = ref<ElementExpose | null>(null);
    const separatorRef = ref<ElementExpose | null>(null);
    const clicks = vi.fn();
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("main", null, [
          h(
            InputOtpRoot,
            {
              "aria-label": "Verification code",
              class: "consumer-otp",
              onClick: clicks,
              ref: rootRef,
            },
            () =>
              h(InputOtpGroup, { ref: groupRef }, () => [
                h(
                  InputOtpSlot,
                  { index: 0, ref: slotRef },
                  { caret: () => h("i", { "data-testid": "custom-caret" }) },
                ),
                h(InputOtpSeparator, { ref: separatorRef }),
                ...Array.from({ length: 5 }, (_, offset) =>
                  h(InputOtpSlot, { index: offset + 1, key: offset + 1 }),
                ),
              ]),
          ),
          showSecond.value ? otpTree(InputOtpRoot, InputOtpGroup, InputOtpSlot) : null,
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    const roots = host.querySelectorAll<HTMLElement>("[data-sw-input-otp]");
    expect(roots).toHaveLength(2);
    expect(rootRef.value?.element).toBe(roots[0]);
    expect(groupRef.value?.element).toBe(host.querySelector("[data-sw-input-otp-group]"));
    expect(slotRef.value?.element).toBe(host.querySelector("[data-sw-input-otp-slot]"));
    expect(separatorRef.value?.element).toBe(host.querySelector("[data-sw-input-otp-separator]"));
    expect(roots[0]).toHaveClass("consumer-otp");
    expect(roots[0]).toHaveAttribute("aria-label", "Verification code");
    expect(host.querySelector("[data-testid=custom-caret]")).toBeTruthy();
    roots[0]!.click();
    expect(clicks).toHaveBeenCalledTimes(1);

    showSecond.value = false;
    await settle();
    expect(host.querySelectorAll("[data-sw-input-otp]")).toHaveLength(1);
    expect(abort).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("hydrates Styled fidelity without warnings or duplicate hidden inputs", async () => {
    const model = ref("123");
    const rootRef = ref<ElementExpose | null>(null);
    const root = () =>
      h(
        StyledInputOtp,
        {
          class: "styled-consumer",
          modelValue: model.value,
          "onUpdate:modelValue": (value: string) => (model.value = value),
          ref: rootRef,
        },
        () =>
          h(StyledInputOtpGroup, null, () => [
            ...Array.from({ length: 3 }, (_, index) =>
              h(StyledInputOtpSlot, { index, key: index, size: "lg" }),
            ),
            h(StyledInputOtpSeparator),
            ...Array.from({ length: 3 }, (_, offset) =>
              h(StyledInputOtpSlot, { index: offset + 3, key: offset + 3, size: "lg" }),
            ),
          ]),
      );
    const host = appendHost();
    host.innerHTML = await renderToString(createSSRApp({ render: root }));
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("[data-sw-input-otp-input]")).toHaveLength(1);
    expect(host.querySelectorAll("[data-slot=input-otp-slot]")).toHaveLength(6);
    expect(host.querySelector("[data-slot=input-otp]")).toHaveClass("styled-consumer");
    expect(rootRef.value?.element).toBe(host.querySelector("[data-slot=input-otp]"));
  });
});

function otpTree(
  Root: typeof InputOtpRoot,
  Group: typeof InputOtpGroup,
  Slot: typeof InputOtpSlot,
  props: Record<string, unknown> = {},
) {
  return h(Root, props, () =>
    h(Group, null, () => Array.from({ length: 6 }, (_, index) => h(Slot, { index, key: index }))),
  );
}

function mountOtp(props: Record<string, unknown>): HTMLDivElement {
  const host = appendHost();
  const app = createApp({
    render: () => otpTree(InputOtpRoot, InputOtpGroup, InputOtpSlot, props),
  });
  app.mount(host);
  cleanups.push(() => app.unmount());
  return host;
}

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await nextTick();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await nextTick();
}

function installMutationDeliveryLimit(): () => number {
  const NativeMutationObserver = window.MutationObserver;
  let mutationDeliveries = 0;
  class BoundedMutationObserver extends NativeMutationObserver {
    constructor(callback: MutationCallback) {
      super((records, observer) => {
        mutationDeliveries += 1;
        if (mutationDeliveries > 100) {
          throw new Error(
            "Input OTP exceeded 100 MutationObserver deliveries before Field adoption settled",
          );
        }
        callback(records, observer);
      });
    }
  }
  vi.stubGlobal("MutationObserver", BoundedMutationObserver);
  return () => mutationDeliveries;
}
