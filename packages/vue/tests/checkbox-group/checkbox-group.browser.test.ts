import { createApp, h, nextTick, reactive, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CheckboxGroupValueChangeDetails } from "@starwind-ui/runtime/checkbox-group";
import { CheckboxGroupRoot } from "@starwind-ui/vue/checkbox-group";
import { CheckboxRoot } from "@starwind-ui/vue/checkbox";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Checkbox Group public behavior", () => {
  it("bridges array models in detail-first order and cancels group and child commits", async () => {
    const events: string[] = [];
    const cancelNext = ref(false);
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          CheckboxGroupRoot,
          {
            defaultValue: ["alpha"],
            onValueChange: (_value: string[], detail: CheckboxGroupValueChangeDetails) => {
              events.push("group-detail");
              if (cancelNext.value) detail.cancel();
            },
            "onUpdate:modelValue": () => events.push("group-update"),
          },
          {
            default: () => [
              h(CheckboxRoot, {
                onCheckedChange: () => events.push("child-detail"),
                "onUpdate:checked": () => events.push("child-update"),
                value: "alpha",
              }),
              h(CheckboxRoot, { value: "beta" }),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const group = host.querySelector<HTMLElement>("[data-sw-checkbox-group]")!;
    const children = host.querySelectorAll<HTMLElement>("[data-sw-checkbox]");

    expect(children[0]?.getAttribute("aria-checked")).toBe("true");
    children[0]?.click();
    await nextTick();
    expect(events).toEqual(["group-detail", "group-update", "child-detail", "child-update"]);
    expect(group.getAttribute("data-value")).toBe("[]");

    cancelNext.value = true;
    const eventCountBeforeCancellation = events.length;
    children[1]?.click();
    await nextTick();
    expect(events.slice(eventCountBeforeCancellation)).toEqual(["group-detail"]);
    expect(group.getAttribute("data-value")).toBe("[]");
    expect(children[1]?.getAttribute("aria-checked")).toBe("false");
  });

  it("keeps controlled values parent-owned and supports dynamic Runtime membership", async () => {
    const state = reactive({ showBeta: false, value: ["alpha"] as string[] });
    const proposals: string[][] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          CheckboxGroupRoot,
          {
            modelValue: state.value,
            "onUpdate:modelValue": (value: string[]) => proposals.push(value),
          },
          {
            default: () => [
              h(CheckboxRoot, { value: "alpha" }),
              ...(state.showBeta ? [h(CheckboxRoot, { value: "beta" })] : []),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    host.querySelector<HTMLElement>("[data-sw-checkbox]")?.click();
    await nextTick();
    expect(proposals).toEqual([[]]);
    expect(host.querySelector("[data-sw-checkbox-group]")?.getAttribute("data-value")).toBe(
      '["alpha"]',
    );

    state.showBeta = true;
    await nextTick();
    await mutationTurn();
    expect(host.querySelectorAll("[data-sw-checkbox]")).toHaveLength(2);
    state.value = ["beta"];
    await nextTick();
    const children = host.querySelectorAll<HTMLElement>("[data-sw-checkbox]");
    expect(children[0]?.getAttribute("aria-checked")).toBe("false");
    expect(children[1]?.getAttribute("aria-checked")).toBe("true");
  });

  it("owns disabled propagation, native form serialization/reset, and exact cleanup", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const disabled = ref(true);
    const host = appendHost();
    const form = document.createElement("form");
    form.id = "choices";
    document.body.append(form);
    const app = createApp({
      render: () =>
        h(
          CheckboxGroupRoot,
          { defaultValue: ["alpha"], disabled: disabled.value },
          {
            default: () => [
              h(CheckboxRoot, { form: "choices", name: "choice", value: "alpha" }),
              h(CheckboxRoot, { form: "choices", name: "choice", value: "beta" }),
            ],
          },
        ),
    });
    app.mount(host);
    const children = host.querySelectorAll<HTMLElement>("[data-sw-checkbox]");
    expect(Array.from(children).every((child) => child.hasAttribute("data-disabled"))).toBe(true);

    disabled.value = false;
    await nextTick();
    children[1]?.click();
    await nextTick();
    expect(new FormData(form).getAll("choice")).toEqual(["alpha", "beta"]);

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    expect(new FormData(form).getAll("choice")).toEqual(["alpha"]);

    app.unmount();
    expect(abort).toHaveBeenCalledTimes(3);
    expect(host.children).toHaveLength(0);
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
