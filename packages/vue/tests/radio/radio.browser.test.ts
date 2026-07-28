import { createApp, h, nextTick, reactive, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createRadio, type RadioCheckedChangeDetails } from "@starwind-ui/runtime/radio";
import { RadioRoot } from "@starwind-ui/vue/radio";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Radio public behavior", () => {
  it("publishes detail first and commits its model only after acceptance", async () => {
    const events: string[] = [];
    let cancel = true;
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(RadioRoot, {
          defaultChecked: false,
          onCheckedChange: (_checked: boolean, detail: RadioCheckedChangeDetails) => {
            events.push("detail");
            if (cancel) detail.cancel();
          },
          "onUpdate:checked": () => events.push("update"),
          value: "alpha",
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const radio = host.querySelector<HTMLElement>("[data-sw-radio]")!;

    radio.click();
    await nextTick();
    expect(events).toEqual(["detail"]);
    expect(radio.getAttribute("aria-checked")).toBe("false");

    cancel = false;
    radio.click();
    await nextTick();
    expect(events).toEqual(["detail", "detail", "update"]);
    expect(radio.getAttribute("aria-checked")).toBe("true");
  });

  it("keeps controlled checked state parent-owned", async () => {
    const state = reactive({ checked: false });
    const proposals: boolean[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(RadioRoot, {
          checked: state.checked,
          "onUpdate:checked": (checked: boolean) => proposals.push(checked),
          value: "alpha",
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const radio = host.querySelector<HTMLElement>("[data-sw-radio]")!;

    radio.click();
    await nextTick();
    expect(proposals).toEqual([true]);
    expect(radio.getAttribute("aria-checked")).toBe("false");

    state.checked = true;
    await nextTick();
    expect(radio.getAttribute("aria-checked")).toBe("true");
  });

  it("owns native form serialization, reset synchronization, and exact cleanup", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const form = document.createElement("form");
    form.id = "standalone-radio-form";
    document.body.append(form);
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(RadioRoot, {
          defaultChecked: true,
          form: "standalone-radio-form",
          name: "choice",
          value: "alpha",
        }),
    });
    app.mount(host);
    const radio = host.querySelector<HTMLElement>("[data-sw-radio]")!;

    expect(new FormData(form).get("choice")).toBe("alpha");
    radio.click();
    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    expect(radio.getAttribute("aria-checked")).toBe("true");

    app.unmount();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(host.children).toHaveLength(0);
  });

  it("preserves current state across controlledness, identity, native-button, and form recreation", async () => {
    const firstForm = document.createElement("form");
    firstForm.id = "radio-first-form";
    const secondForm = document.createElement("form");
    secondForm.id = "radio-second-form";
    document.body.append(firstForm, secondForm);
    const state = reactive({
      checked: undefined as boolean | undefined,
      form: firstForm.id,
      id: "recreated-radio",
      nativeButton: false,
    });
    const exposed = ref<{ element: HTMLElement | null; input: HTMLInputElement | null }>();
    const updates: boolean[] = [];
    let nativeClicks = 0;
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          RadioRoot,
          {
            ref: exposed,
            checked: state.checked,
            "data-forwarded": "radio-attrs",
            form: state.form,
            id: state.id,
            name: "recreated-choice",
            nativeButton: state.nativeButton,
            onClick: () => (nativeClicks += 1),
            "onUpdate:checked": (checked: boolean) => updates.push(checked),
            value: "alpha",
          },
          { default: () => h("strong", { "data-slot-probe": "" }, "Alpha") },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    expect(exposed.value?.element).toBe(host.querySelector("[data-sw-radio]"));
    expect(exposed.value?.input).toBe(host.querySelector("[data-sw-radio-input]"));
    expect(host.querySelector("[data-forwarded=radio-attrs]")).not.toBeNull();
    expect(host.querySelector("[data-slot-probe]")?.textContent).toBe("Alpha");

    const runtime = createRadio(exposed.value!.element!);
    runtime.setChecked(true);
    await nextTick();
    expect(updates).toEqual([true]);
    expect(exposed.value?.element?.getAttribute("aria-checked")).toBe("true");

    state.id = "recreated-radio-next";
    await nextTick();
    expect(exposed.value?.element?.getAttribute("aria-checked")).toBe("true");

    state.checked = false;
    await nextTick();
    expect(exposed.value?.element?.getAttribute("aria-checked")).toBe("false");
    state.checked = undefined;
    await nextTick();
    expect(exposed.value?.element?.getAttribute("aria-checked")).toBe("false");
    createRadio(exposed.value!.element!).setChecked(true);
    await nextTick();
    expect(exposed.value?.element?.getAttribute("aria-checked")).toBe("true");

    state.nativeButton = true;
    await nextTick();
    expect(exposed.value?.element?.tagName).toBe("BUTTON");
    expect(exposed.value?.element?.getAttribute("aria-checked")).toBe("true");
    expect(exposed.value?.input?.parentElement).toBe(host);
    exposed.value?.element?.click();
    expect(nativeClicks).toBe(1);

    expect(new FormData(firstForm).get("recreated-choice")).toBe("alpha");
    state.form = secondForm.id;
    await nextTick();
    await mutationTurn();
    expect(new FormData(firstForm).get("recreated-choice")).toBeNull();
    expect(new FormData(secondForm).get("recreated-choice")).toBe("alpha");
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
