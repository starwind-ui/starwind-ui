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

import { CheckboxIndicator, CheckboxRoot } from "@starwind-ui/vue/checkbox";
import {
  FieldControl,
  FieldDescription,
  FieldError,
  FieldItem,
  FieldLabel,
  FieldRoot,
  FieldValidity,
} from "@starwind-ui/vue/field";
import { FormRoot } from "@starwind-ui/vue/form";
import {
  Field as StyledField,
  FieldControl as StyledFieldControl,
  FieldDescription as StyledFieldDescription,
  FieldError as StyledFieldError,
  FieldLabel as StyledFieldLabel,
  FieldValidity as StyledFieldValidity,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/field";

type ElementExpose<T extends HTMLElement> = ComponentPublicInstance & { element: T | null };
const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Field public behavior", () => {
  it("links semantic parts, forwards attrs/listeners/slots/refs, and synchronizes root setters", async () => {
    const state = reactive<{
      dirty?: boolean;
      disabled: boolean;
      invalid?: boolean;
      name?: string;
      touched?: boolean;
    }>({
      dirty: undefined,
      disabled: false,
      invalid: undefined,
      name: "profile",
      touched: undefined,
    });
    const fieldRef = ref<ElementExpose<HTMLDivElement> | null>(null);
    const controlRef = ref<ElementExpose<HTMLInputElement> | null>(null);
    const nativeInputs = vi.fn();
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          FieldRoot,
          {
            class: "consumer-field",
            dirty: state.dirty,
            disabled: state.disabled,
            invalid: state.invalid,
            name: state.name,
            ref: fieldRef,
            touched: state.touched,
          },
          {
            default: () => [
              h(FieldLabel, null, () => "Profile"),
              h(FieldControl, {
                "aria-label": "Profile input",
                class: "consumer-control",
                onInput: nativeInputs,
                ref: controlRef,
                required: true,
              }),
              h(FieldDescription, null, () => "Visible publicly"),
              h(FieldItem, null, () => "Input row"),
              h(FieldError, { match: "valueMissing" }, () => "Profile is required"),
              h(FieldValidity, { match: "valid" }, () => "Profile is ready"),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settleMutation();

    const field = host.querySelector<HTMLElement>("[data-sw-field]")!;
    const label = host.querySelector<HTMLLabelElement>("[data-sw-field-label]")!;
    const input = host.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const description = host.querySelector<HTMLElement>("[data-sw-field-description]")!;
    const error = host.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const validity = host.querySelector<HTMLElement>("[data-sw-field-validity]")!;

    expect(fieldRef.value?.element).toBe(field);
    expect(controlRef.value?.element).toBe(input);
    expect(input.className).toContain("consumer-control");
    expect(input.getAttribute("aria-label")).toBe("Profile input");
    expect(input).toHaveAttribute("data-sw-input");
    expect(input.name).toBe("profile");
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute("aria-describedby")?.split(/\s+/)).toEqual(
      expect.arrayContaining([description.id, error.id]),
    );
    expect(error.hidden).toBe(false);
    expect(validity.hidden).toBe(true);

    input.value = "Ada";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitFor(() => {
      expect(field).toHaveAttribute("data-filled");
      expect(field).toHaveAttribute("data-dirty");
      expect(error.hidden).toBe(true);
      expect(validity.hidden).toBe(false);
    });
    expect(nativeInputs).toHaveBeenCalledTimes(1);

    state.dirty = false;
    state.touched = true;
    state.invalid = true;
    state.disabled = true;
    state.name = "displayName";
    await settleMutation();
    expect(field).not.toHaveAttribute("data-dirty");
    expect(field).toHaveAttribute("data-touched");
    expect(field).toHaveAttribute("data-invalid");
    expect(input.disabled).toBe(true);
    expect(input.name).toBe("displayName");
  });

  it("delegates Form timing, native validation, submission, reset, and dynamic messages to Runtime", async () => {
    const showDynamic = ref(false);
    const submits = vi.fn((event: SubmitEvent) => event.preventDefault());
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          FormRoot,
          {
            errorVisibility: "submit",
            onSubmit: submits,
            validationTiming: "submit",
          },
          () => [
            h(FieldRoot, { name: "email" }, () => [
              h(FieldLabel, null, () => "Email"),
              h(FieldControl, { defaultValue: "", required: true, type: "email" }),
              h(
                FieldError,
                { match: "valueMissing", messageSource: "validation" },
                () => "Email is required",
              ),
              showDynamic.value
                ? h(FieldError, { match: "typeMismatch" }, () => "Use a valid email")
                : null,
            ]),
            h("button", { type: "submit" }, "Submit"),
            h("button", { type: "reset" }, "Reset"),
          ],
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settleMutation();

    const form = host.querySelector("form")!;
    const field = host.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = host.querySelector<HTMLInputElement>("input")!;
    const requiredError = host.querySelector<HTMLElement>("[data-sw-field-error]")!;
    expect(requiredError.hidden).toBe(true);

    form.requestSubmit();
    await settleMutation();
    expect(submits).not.toHaveBeenCalled();
    expect(field).toHaveAttribute("data-invalid");
    expect(requiredError.hidden).toBe(false);
    expect(requiredError.textContent?.trim().length).toBeGreaterThan(0);

    showDynamic.value = true;
    await waitFor(() => {
      const errors = host.querySelectorAll<HTMLElement>("[data-sw-field-error]");
      expect(errors).toHaveLength(2);
      expect(errors[1]!.hidden).toBe(true);
    });

    input.value = "invalid";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    form.requestSubmit();
    await waitFor(() => {
      const dynamicError = host.querySelectorAll<HTMLElement>("[data-sw-field-error]")[1]!;
      expect(dynamicError.hidden).toBe(false);
      expect(dynamicError.id).not.toBe("");
      expect(input.getAttribute("aria-describedby")).toContain(dynamicError.id);
    });

    input.value = "reader@example.com";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await settleMutation();
    form.requestSubmit();
    await settleMutation();
    expect(submits).toHaveBeenCalledTimes(1);
    expect(new FormData(form).get("email")).toBe("reader@example.com");

    form.reset();
    await settleMutation();
    expect(input.value).toBe("");
    expect(requiredError.hidden).toBe(true);
  });

  it("composes registered controls, propagates state, isolates instances, and cleans up once", async () => {
    const showCheckbox = ref(true);
    const checkboxDisabled = ref(false);
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("form", null, [
          h(FieldRoot, { name: "nickname" }, () => [
            h(FieldLabel, null, () => "Nickname"),
            h(FieldControl, { defaultValue: "Ada" }),
          ]),
          showCheckbox.value
            ? h(FieldRoot, { disabled: checkboxDisabled.value, name: "terms" }, () => [
                h(FieldLabel, null, () => "Terms"),
                h(CheckboxRoot, { required: true, value: "accepted" }, () => h(CheckboxIndicator)),
                h(FieldError, { match: "valueMissing" }, () => "Accept the terms"),
              ])
            : null,
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settleMutation();

    const form = host.querySelector("form")!;
    const fields = () => host.querySelectorAll<HTMLElement>("[data-sw-field]");
    const checkbox = host.querySelector<HTMLElement>("[data-sw-checkbox]")!;
    const checkboxInput = host.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!;
    expect(fields()).toHaveLength(2);
    expect(checkboxInput.name).toBe("terms");
    expect(Object.fromEntries(new FormData(form))).toEqual({ nickname: "Ada" });

    checkbox.click();
    await waitFor(() => {
      expect(fields()[1]).toHaveAttribute("data-filled");
      expect(fields()[1]).toHaveAttribute("data-dirty");
    });
    expect(new FormData(form).get("terms")).toBe("accepted");
    expect(fields()[0]).not.toHaveAttribute("data-dirty");

    checkboxDisabled.value = true;
    await settleMutation();
    expect(checkboxInput.disabled).toBe(true);
    expect(new FormData(form).get("terms")).toBeNull();

    showCheckbox.value = false;
    await waitFor(() => {
      expect(fields()).toHaveLength(1);
      expect(disconnect).toHaveBeenCalledTimes(1);
    });

    app.unmount();
    cleanups.pop();
    expect(disconnect).toHaveBeenCalledTimes(2);
  });

  it("hydrates Styled Field with attrs, slots, semantic refs, and one Runtime owner", async () => {
    const fieldRef = ref<ElementExpose<HTMLDivElement> | null>(null);
    const controlRef = ref<ElementExpose<HTMLInputElement> | null>(null);
    const model = ref("initial");
    const root = () =>
      h(
        StyledField,
        {
          class: "styled-consumer",
          "data-consumer": "yes",
          name: "styledEmail",
          ref: fieldRef,
        },
        () => [
          h(StyledFieldLabel, null, () => "Styled email"),
          h(StyledFieldControl, {
            modelValue: model.value,
            "onUpdate:modelValue": (value: string) => (model.value = value),
            ref: controlRef,
            required: true,
            type: "email",
          }),
          h(StyledFieldDescription, null, () => "Hydrated description"),
          h(StyledFieldError, { match: "typeMismatch" }, () => "Invalid email"),
          h(StyledFieldValidity, { match: "valid" }, () => "Email is ready"),
        ],
      );
    const host = appendHost();
    host.innerHTML = await renderToString(createSSRApp({ render: root }));
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settleMutation();

    const field = host.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = host.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("[data-sw-field]")).toHaveLength(1);
    expect(host.querySelectorAll("[data-sw-input]")).toHaveLength(1);
    expect(fieldRef.value?.element).toBe(field);
    expect(controlRef.value?.element).toBe(input);
    expect(field.getAttribute("data-consumer")).toBe("yes");
    expect(field).toHaveAttribute("data-slot", "field");
    expect(input).toHaveAttribute("data-slot", "field-control");

    input.value = "next@example.com";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await settleMutation();
    expect(model.value).toBe("next@example.com");
  });
});

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

async function settleMutation(): Promise<void> {
  await Promise.resolve();
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
}

async function waitFor(assertion: () => void): Promise<void> {
  let lastError: unknown;
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 10));
      await nextTick();
    }
  }
  throw lastError;
}
