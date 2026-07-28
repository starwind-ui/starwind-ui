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

import type { InputValueChangeDetails } from "@starwind-ui/runtime/input";
import { InputRoot } from "@starwind-ui/vue/input";

type InputExposed = ComponentPublicInstance & { element: HTMLInputElement | null };
const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Input public behavior", () => {
  it("forwards native attrs/listeners/ref and updates the default model in event order", async () => {
    const model = ref("initial");
    const exposed = ref<InputExposed | null>(null);
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(InputRoot, {
          "aria-label": "Name",
          class: "name-input",
          modelValue: model.value,
          "onUpdate:modelValue": (value: string) => {
            events.push("model");
            model.value = value;
          },
          onInput: () => events.push("native"),
          onValueChange: (_value: string, _detail: InputValueChangeDetails) =>
            events.push("detail"),
          ref: exposed,
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const input = host.querySelector("input")!;

    expect(input.className).toBe("name-input");
    expect(input.getAttribute("aria-label")).toBe("Name");
    expect(exposed.value?.element).toBe(input);
    input.value = "next";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();

    expect(events).toEqual(["native", "detail", "model"]);
    expect(model.value).toBe("next");
    expect(input.value).toBe("next");
  });

  it("reads defaultValue once and lets Runtime own native form reset", async () => {
    const state = reactive({ defaultValue: "alpha" });
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          "form",
          null,
          h(InputRoot, { defaultValue: state.defaultValue, name: "query", required: true }),
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const form = host.querySelector("form")!;
    const input = host.querySelector("input")!;

    state.defaultValue = "changed-default";
    await nextTick();
    expect(input.value).toBe("alpha");
    expect(input.defaultValue).toBe("alpha");
    expect(input.form).toBe(form);
    input.value = "edited";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(input.defaultValue).toBe("alpha");
    expect(new FormData(form).get("query")).toBe("edited");

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    expect(input.value).toBe("alpha");
  });

  it("synchronizes controlled parent changes without emitting and destroys exactly once", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const model = ref("one");
    const onValueChange = vi.fn();
    const onUpdate = vi.fn();
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          "form",
          null,
          h(InputRoot, {
            modelValue: model.value,
            name: "controlled",
            onValueChange,
            "onUpdate:modelValue": onUpdate,
          }),
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const form = host.querySelector("form")!;
    const input = host.querySelector("input")!;

    input.value = "rejected";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(input.value).toBe("one");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledTimes(1);

    onValueChange.mockClear();
    onUpdate.mockClear();
    model.value = "two";
    await nextTick();
    expect(input.value).toBe("two");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    expect(model.value).toBe("two");
    expect(input.value).toBe("two");
    expect(new FormData(form).get("controlled")).toBe("two");
    expect(input.hasAttribute("data-dirty")).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();

    form.reset();
    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("isolates two Input instances across edits, resets, and lifecycle cleanup", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const showSecond = ref(true);
    const firstChanges = vi.fn();
    const secondChanges = vi.fn();
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("form", null, [
          h(InputRoot, {
            defaultValue: "alpha",
            name: "first",
            onValueChange: firstChanges,
          }),
          showSecond.value
            ? h(InputRoot, {
                defaultValue: "beta",
                name: "second",
                onValueChange: secondChanges,
              })
            : null,
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const form = host.querySelector("form")!;
    const inputs = () => [...host.querySelectorAll("input")];

    inputs()[0]!.value = "edited-alpha";
    inputs()[0]!.dispatchEvent(new Event("input", { bubbles: true }));
    expect(inputs()[0]!.value).toBe("edited-alpha");
    expect(inputs()[1]!.value).toBe("beta");
    expect(firstChanges).toHaveBeenCalledTimes(1);
    expect(secondChanges).not.toHaveBeenCalled();

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    expect(inputs().map((input) => input.value)).toEqual(["alpha", "beta"]);
    expect(Object.fromEntries(new FormData(form))).toEqual({
      first: "alpha",
      second: "beta",
    });

    showSecond.value = false;
    await nextTick();
    expect(inputs().map((input) => input.value)).toEqual(["alpha"]);
    expect(abort).toHaveBeenCalledTimes(1);

    inputs()[0]!.value = "again";
    inputs()[0]!.dispatchEvent(new Event("input", { bubbles: true }));
    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    expect(inputs()[0]!.value).toBe("alpha");
    expect(firstChanges).toHaveBeenCalledTimes(2);
    expect(secondChanges).not.toHaveBeenCalled();

    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(2);
  });

  it("hydrates once without warnings or duplicate semantic inputs", async () => {
    const props = { defaultValue: "hydrated", id: "hydrated-input", name: "hydrated" };
    const root = () => h(InputRoot, props);
    const host = appendHost();
    host.innerHTML = await renderToString(createSSRApp({ render: root }));
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("#hydrated-input")).toHaveLength(1);
  });
});

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}
