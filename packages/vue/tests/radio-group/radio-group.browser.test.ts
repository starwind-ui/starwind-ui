import { createApp, h, nextTick, reactive, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createRadioGroup,
  type RadioGroupValueChangeDetails,
} from "@starwind-ui/runtime/radio-group";
import { RadioGroupRoot } from "@starwind-ui/vue/radio-group";
import { RadioRoot } from "@starwind-ui/vue/radio";
import { RadioGroup as StyledRadioGroup } from "../../../../apps/vue-demo/src/components/starwind-runtime/radio-group";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Radio Group public behavior", () => {
  it("keeps Styled consumer aria-label precedence with absent and present legends", () => {
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("main", null, [
          h(StyledRadioGroup, { "aria-label": "Consumer only", id: "consumer-only" }),
          h(StyledRadioGroup, { id: "legend-only", legend: "Legend only" }),
          h(StyledRadioGroup, {
            "aria-label": "Consumer override",
            id: "consumer-override",
            legend: "Legend fallback",
          }),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    expect(host.querySelector("#consumer-only")?.getAttribute("aria-label")).toBe("Consumer only");
    expect(host.querySelector("#legend-only")?.getAttribute("aria-label")).toBe("Legend only");
    expect(host.querySelector("#consumer-override")?.getAttribute("aria-label")).toBe(
      "Consumer override",
    );
  });

  it("commits group and child models atomically only after group acceptance", async () => {
    const events: string[] = [];
    const cancelNext = ref(true);
    const conflictingAlpha = ref(false);
    const conflictingBeta = ref(true);
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          RadioGroupRoot,
          {
            defaultValue: "alpha",
            onValueChange: (_value: string, detail: RadioGroupValueChangeDetails) => {
              events.push("group-detail");
              if (cancelNext.value) detail.cancel();
            },
            "onUpdate:modelValue": () => events.push("group-update"),
          },
          {
            default: () => [
              h(RadioRoot, { checked: conflictingAlpha.value, value: "alpha" }),
              h(RadioRoot, {
                checked: conflictingBeta.value,
                defaultChecked: true,
                onCheckedChange: () => events.push("child-detail"),
                "onUpdate:checked": () => events.push("child-update"),
                value: "beta",
              }),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const group = host.querySelector<HTMLElement>("[data-sw-radio-group]")!;
    const radios = host.querySelectorAll<HTMLElement>("[data-sw-radio]");

    expect(radios[0]?.getAttribute("aria-checked")).toBe("true");
    expect(radios[1]?.getAttribute("aria-checked")).toBe("false");
    radios[1]?.click();
    await nextTick();
    expect(events).toEqual(["child-detail", "group-detail"]);
    expect(group.getAttribute("data-value")).toBe("alpha");
    expect(radios[0]?.getAttribute("aria-checked")).toBe("true");
    expect(radios[1]?.getAttribute("aria-checked")).toBe("false");

    cancelNext.value = false;
    radios[1]?.click();
    await nextTick();
    expect(events).toEqual([
      "child-detail",
      "group-detail",
      "child-detail",
      "group-detail",
      "group-update",
      "child-update",
    ]);
    expect(group.getAttribute("data-value")).toBe("beta");
    expect(radios[1]?.getAttribute("aria-checked")).toBe("true");

    conflictingAlpha.value = true;
    conflictingBeta.value = false;
    await nextTick();
    expect(radios[0]?.getAttribute("aria-checked")).toBe("false");
    expect(radios[1]?.getAttribute("aria-checked")).toBe("true");

    const eventCountBeforeImperative = events.length;
    cancelNext.value = true;
    createRadioGroup(group).setValue("alpha");
    await nextTick();
    expect(events.slice(eventCountBeforeImperative)).toEqual(["group-detail"]);
    expect(group.getAttribute("data-value")).toBe("beta");

    cancelNext.value = false;
    createRadioGroup(group).setValue("alpha");
    await nextTick();
    expect(events.slice(eventCountBeforeImperative)).toEqual([
      "group-detail",
      "group-detail",
      "group-update",
    ]);
    expect(group.getAttribute("data-value")).toBe("alpha");
  });

  it("keeps controlled values parent-owned and supports dynamic Runtime membership", async () => {
    const state = reactive({
      entries: ["alpha"] as string[],
      value: "alpha" as string | undefined,
    });
    const proposals: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          RadioGroupRoot,
          {
            modelValue: state.value,
            "onUpdate:modelValue": (value: string) => proposals.push(value),
          },
          {
            default: () => [
              ...state.entries.map((value, index) =>
                h(RadioRoot, { key: `${value}-${index}`, value }),
              ),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    state.entries = ["alpha", "beta"];
    await nextTick();
    await mutationTurn();
    const radios = host.querySelectorAll<HTMLElement>("[data-sw-radio]");
    expect(radios).toHaveLength(2);
    radios[1]?.click();
    await nextTick();
    expect(proposals).toEqual(["beta"]);
    expect(host.querySelector("[data-sw-radio-group]")?.getAttribute("data-value")).toBe("alpha");

    state.value = "beta";
    await nextTick();
    expect(radios[0]?.getAttribute("aria-checked")).toBe("false");
    expect(radios[1]?.getAttribute("aria-checked")).toBe("true");

    state.value = undefined;
    await nextTick();
    expect(host.querySelector("[data-sw-radio-group]")?.getAttribute("data-value")).toBe("beta");
    state.value = "alpha";
    await nextTick();
    expect(host.querySelector("[data-sw-radio-group]")?.getAttribute("data-value")).toBe("alpha");
    state.value = undefined;
    await nextTick();
    expect(host.querySelector("[data-sw-radio-group]")?.getAttribute("data-value")).toBe("alpha");
    createRadioGroup(host.querySelector<HTMLElement>("[data-sw-radio-group]")!).setValue("alpha");
    await nextTick();
    expect(host.querySelector("[data-sw-radio-group]")?.getAttribute("data-value")).toBe("alpha");

    state.entries = ["beta", "alpha", "alpha"];
    await nextTick();
    await mutationTurn();
    const reordered = host.querySelectorAll<HTMLElement>("[data-sw-radio]");
    expect(reordered).toHaveLength(3);
    expect(reordered[1]?.getAttribute("aria-checked")).toBe("true");
    expect(reordered[2]?.getAttribute("aria-checked")).toBe("true");

    state.entries = ["beta"];
    await nextTick();
    await mutationTurn();
    expect(host.querySelectorAll("[data-sw-radio]")).toHaveLength(1);
  });

  it("moves controlled keyboard focus before the Vue model prop reconciles", async () => {
    const state = reactive({ value: "alpha" });
    const proposals: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          RadioGroupRoot,
          {
            modelValue: state.value,
            "onUpdate:modelValue": (value: string) => {
              proposals.push(value);
              state.value = value;
            },
          },
          {
            default: () => [h(RadioRoot, { value: "alpha" }), h(RadioRoot, { value: "beta" })],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const group = host.querySelector<HTMLElement>("[data-sw-radio-group]")!;
    const radios = host.querySelectorAll<HTMLElement>("[data-sw-radio]");
    radios[0]?.focus();

    radios[0]?.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "ArrowDown",
      }),
    );

    expect(document.activeElement).toBe(radios[1]);
    expect(group.getAttribute("data-value")).toBe("alpha");

    await nextTick();

    expect(proposals).toEqual(["beta"]);
    expect(state.value).toBe("beta");
    expect(group.getAttribute("data-value")).toBe("beta");
    expect(radios[1]?.getAttribute("aria-checked")).toBe("true");
  });

  it("owns keyboard roving, merged form props, reset synchronization, and cleanup", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const form = document.createElement("form");
    form.id = "radio-group-form";
    document.body.append(form);
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          RadioGroupRoot,
          {
            defaultValue: "alpha",
            form: "radio-group-form",
            name: "choice",
            orientation: "horizontal",
          },
          {
            default: () => [h(RadioRoot, { value: "alpha" }), h(RadioRoot, { value: "beta" })],
          },
        ),
    });
    app.mount(host);
    const radios = host.querySelectorAll<HTMLElement>("[data-sw-radio]");

    radios[0]?.focus();
    radios[0]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    await nextTick();
    expect(document.activeElement).toBe(radios[1]);
    expect(new FormData(form).get("choice")).toBe("beta");

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    expect(new FormData(form).get("choice")).toBe("alpha");
    expect(radios[0]?.getAttribute("aria-checked")).toBe("true");

    app.unmount();
    expect(abort).toHaveBeenCalledTimes(3);
    expect(host.children).toHaveLength(0);
  });

  it("isolates multiple groups and merges disabled, read-only, required, and orientation behavior", async () => {
    const form = document.createElement("form");
    form.id = "required-radio-form";
    document.body.append(form);
    const state = reactive({
      disabled: true,
      itemDisabled: false,
      orientation: "vertical" as "horizontal" | "vertical",
      readOnly: false,
    });
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("div", null, [
          h(
            RadioGroupRoot,
            {
              defaultValue: "alpha",
              disabled: state.disabled,
              id: "first-radio-group",
              orientation: state.orientation,
              readOnly: state.readOnly,
            },
            {
              default: () => [
                h(RadioRoot, { value: "alpha" }),
                h(RadioRoot, { disabled: state.itemDisabled, value: "beta" }),
              ],
            },
          ),
          h(
            RadioGroupRoot,
            { defaultValue: "one", id: "second-radio-group" },
            {
              default: () => [h(RadioRoot, { value: "one" }), h(RadioRoot, { value: "two" })],
            },
          ),
          h(
            RadioGroupRoot,
            {
              form: form.id,
              id: "required-radio-group",
              name: "required-choice",
              required: true,
            },
            {
              default: () => [
                h(RadioRoot, { value: "required-alpha" }),
                h(RadioRoot, { value: "required-beta" }),
              ],
            },
          ),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const first = host.querySelector<HTMLElement>("#first-radio-group")!;
    const firstRadios = first.querySelectorAll<HTMLElement>("[data-sw-radio]");
    const second = host.querySelector<HTMLElement>("#second-radio-group")!;
    const required = host.querySelector<HTMLElement>("#required-radio-group")!;

    expect(Array.from(firstRadios).every((radio) => radio.hasAttribute("data-disabled"))).toBe(
      true,
    );
    firstRadios[1]?.click();
    expect(first.getAttribute("data-value")).toBe("alpha");

    state.disabled = false;
    state.readOnly = true;
    await nextTick();
    expect(Array.from(firstRadios).every((radio) => radio.hasAttribute("data-readonly"))).toBe(
      true,
    );
    firstRadios[1]?.click();
    expect(first.getAttribute("data-value")).toBe("alpha");

    state.readOnly = false;
    state.itemDisabled = true;
    await nextTick();
    firstRadios[0]?.focus();
    press(firstRadios[0]!, "ArrowDown");
    await nextTick();
    expect(first.getAttribute("data-value")).toBe("alpha");

    state.itemDisabled = false;
    await nextTick();
    press(firstRadios[0]!, "ArrowDown");
    await nextTick();
    expect(document.activeElement).toBe(firstRadios[1]);
    expect(first.getAttribute("data-value")).toBe("beta");
    press(firstRadios[1]!, "ArrowUp");
    await nextTick();
    expect(first.getAttribute("data-value")).toBe("alpha");

    state.orientation = "horizontal";
    await nextTick();
    press(firstRadios[0]!, "ArrowRight");
    await nextTick();
    expect(first.getAttribute("data-value")).toBe("beta");
    press(firstRadios[1]!, "ArrowLeft");
    await nextTick();
    expect(first.getAttribute("data-value")).toBe("alpha");

    second.querySelectorAll<HTMLElement>("[data-sw-radio]")[1]?.click();
    await nextTick();
    expect(second.getAttribute("data-value")).toBe("two");
    expect(first.getAttribute("data-value")).toBe("alpha");

    expect(form.checkValidity()).toBe(false);
    expect(new FormData(form).get("required-choice")).toBeNull();
    required.querySelector<HTMLElement>('[data-value="required-beta"]')?.click();
    await nextTick();
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).get("required-choice")).toBe("required-beta");
  });
});

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

async function mutationTurn(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await nextTick();
}

function press(element: HTMLElement, key: string): void {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
}
