import { createApp, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SliderValueChangeDetails } from "@starwind-ui/runtime/slider";
import {
  SliderControl,
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from "@starwind-ui/vue/slider";
import { FieldRoot } from "@starwind-ui/vue/field";
import { Slider as StyledSlider } from "../../../../apps/vue-demo/src/components/starwind-runtime/slider";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Slider public behavior", () => {
  it("orders cancelable live changes before model updates and keeps commits separate", async () => {
    const canceled = ref(true);
    const events: string[] = [];
    const host = mountSlider({
      defaultValue: 25,
      onValueChange: (value: unknown, detail: SliderValueChangeDetails) => {
        events.push(`change:${String(value)}`);
        if (canceled.value) detail.cancel();
      },
      onValueCommitted: (value: unknown) => events.push(`commit:${String(value)}`),
      "onUpdate:modelValue": (value: unknown) => events.push(`update:${String(value)}`),
    });
    const thumb = host.querySelector<HTMLElement>("[data-sw-slider-thumb]")!;

    thumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    await nextTick();
    expect(events).toEqual(["change:26"]);
    expect(thumb.getAttribute("aria-valuenow")).toBe("25");

    canceled.value = false;
    thumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    await nextTick();
    expect(events).toEqual(["change:26", "change:26", "update:26", "commit:26"]);
    expect(thumb.getAttribute("aria-valuenow")).toBe("26");
  });

  it("uses real control geometry for pointer input and submits scalar and array values", async () => {
    const form = document.createElement("form");
    form.id = "slider-form";
    document.body.append(form);
    const commits: unknown[] = [];
    const host = mountSlider(
      {
        defaultValue: [20, 80],
        form: "slider-form",
        name: "price",
        onValueCommitted: (value: unknown) => commits.push(value),
      },
      2,
    );
    const control = host.querySelector<HTMLElement>("[data-sw-slider-control]")!;
    Object.assign(control.style, {
      display: "block",
      height: "20px",
      position: "relative",
      width: "200px",
    });
    const rect = control.getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(100);

    control.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        buttons: 1,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        pointerId: 7,
      }),
    );
    document.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        pointerId: 7,
      }),
    );
    await nextTick();

    expect(commits).toEqual([[20, 50]]);
    expect(new FormData(form).get("price[0]")).toBe("20");
    expect(new FormData(form).get("price[1]")).toBe("50");
  });

  it("refreshes after dynamic thumb DOM flush and preserves controlled arrays", async () => {
    const value = ref<number | number[]>([20, 80]);
    const host = mountSlider(
      () => ({
        modelValue: value.value,
        name: "range",
        "onUpdate:modelValue": (next: number | number[]) => (value.value = next),
      }),
      value,
    );
    value.value = [20, 50, 80];
    await nextTick();
    await nextTick();

    const thumbs = host.querySelectorAll<HTMLElement>("[data-sw-slider-thumb]");
    const inputs = host.querySelectorAll<HTMLInputElement>("[data-sw-slider-input]");
    expect(thumbs).toHaveLength(3);
    expect([...inputs].map((input) => input.name)).toEqual(["range[0]", "range[1]", "range[2]"]);
    expect([...inputs].map((input) => input.value)).toEqual(["20", "50", "80"]);
  });

  it("uses Runtime Field registration for inherited disabled and name state", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h(FieldRoot, { disabled: true, name: "field-range" }, () =>
          h(SliderRoot, { defaultValue: 30 }, () =>
            h(SliderControl, null, () => [h(SliderTrack), h(SliderThumb, { index: 0 })]),
          ),
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    const thumb = host.querySelector<HTMLElement>("[data-sw-slider-thumb]")!;
    const input = host.querySelector<HTMLInputElement>("[data-sw-slider-input]")!;
    expect(thumb.getAttribute("aria-disabled")).toBe("true");
    expect(input.name).toBe("field-range");
    expect(input.disabled).toBe(true);
  });

  it("preserves Styled slots, orientation, attrs, refs, and cleanup", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h(StyledSlider, {
          class: "consumer-slider",
          defaultValue: 40,
          orientation: "vertical",
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(host.querySelector("[data-slot=slider]")).toHaveClass("consumer-slider");
    expect(host.querySelector("[data-slot=slider-range]")).toBeTruthy();
    expect(host.querySelector("[data-slot=slider-thumb]")?.getAttribute("data-orientation")).toBe(
      "vertical",
    );

    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalled();
  });
});

function mountSlider(
  props: Record<string, unknown> | (() => Record<string, unknown>),
  count: number | { value: number | number[] } = 1,
): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    render: () => {
      const thumbCount =
        typeof count === "number" ? count : Array.isArray(count.value) ? count.value.length : 1;
      return h(SliderRoot, typeof props === "function" ? props() : props, () =>
        h(SliderControl, null, () => [
          h(SliderTrack, null, () => h(SliderIndicator)),
          ...Array.from({ length: thumbCount }, (_, index) =>
            h(SliderThumb, { index, key: index }),
          ),
        ]),
      );
    },
  });
  app.mount(host);
  cleanups.push(() => app.unmount());
  return host;
}
