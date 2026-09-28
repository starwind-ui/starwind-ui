import type { CheckboxCheckedChangeDetails } from "@starwind-ui/runtime/checkbox";
import { CheckboxIndicator, CheckboxRoot } from "@starwind-ui/vue/checkbox";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type ComponentPublicInstance,
  createApp,
  createSSRApp,
  h,
  nextTick,
  reactive,
  ref,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { testAcceptedModelPublication } from "../accepted-model-publication.js";

type CheckboxExposed = ComponentPublicInstance & { element: HTMLElement | null };

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Checkbox public behavior", () => {
  it("forwards attrs, listeners, slots, refs and accepts or cancels model changes in order", async () => {
    const exposed = ref<CheckboxExposed | null>(null);
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          CheckboxRoot,
          {
            "aria-label": "Accept",
            class: "terms",
            defaultChecked: false,
            name: "terms",
            onCheckedChange: (_checked: boolean, detail: CheckboxCheckedChangeDetails) => {
              events.push("detail");
              if (events.includes("cancel-next")) detail.cancel();
            },
            "onUpdate:checked": () => events.push("update"),
            ref: exposed,
            style: { color: "rgb(255, 0, 0)" },
            uncheckedValue: "no",
            value: "yes",
          },
          {
            default: () => [h(CheckboxIndicator, null, { default: () => "✓" }), "Accept"],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    const root = host.querySelector<HTMLElement>("[data-sw-checkbox]")!;
    expect(root.className).toBe("terms");
    expect(root.style.color).toBe("rgb(255, 0, 0)");
    expect(root.getAttribute("aria-label")).toBe("Accept");
    expect(root.textContent).toContain("Accept");
    expect(exposed.value?.element).toBe(root);
    expect(exposed.value).not.toHaveProperty("instance");

    root.click();
    await nextTick();
    expect(events).toEqual(["detail", "update"]);
    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(host.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")?.checked).toBe(true);
    expect(host.querySelector<HTMLElement>("[data-sw-checkbox-indicator]")?.hidden).toBe(false);

    events.push("cancel-next");
    root.click();
    await nextTick();
    expect(events).toEqual(["detail", "update", "cancel-next", "detail"]);
    expect(root.getAttribute("aria-checked")).toBe("true");
  });

  it("keeps controlled state parent-owned and synchronizes accepted parent changes without emits", async () => {
    const props = reactive({ checked: false });
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(CheckboxRoot, {
          checked: props.checked,
          onCheckedChange: () => events.push("detail"),
          "onUpdate:checked": () => events.push("update"),
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector<HTMLElement>("[data-sw-checkbox]")!;

    root.click();
    await nextTick();
    expect(events).toEqual(["detail", "update"]);
    expect(root.getAttribute("aria-checked")).toBe("false");

    props.checked = true;
    await nextTick();
    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(events).toEqual(["detail", "update"]);

    props.checked = true;
    await nextTick();
    expect(events).toEqual(["detail", "update"]);
  });

  it("seeds defaults once, preserves form reset/serialization, presence, and instance isolation", async () => {
    const defaultChecked = ref(true);
    const host = appendHost();
    const form = document.createElement("form");
    form.id = "settings";
    document.body.append(form);
    const app = createApp({
      render: () =>
        h(
          "div",
          null,
          ["alpha", "beta"].map((name) =>
            h(
              CheckboxRoot,
              {
                defaultChecked: name === "alpha" ? defaultChecked.value : false,
                form: "settings",
                name,
                uncheckedValue: "no",
                value: "yes",
              },
              { default: () => h(CheckboxIndicator) },
            ),
          ),
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const roots = host.querySelectorAll<HTMLElement>("[data-sw-checkbox]");

    defaultChecked.value = false;
    await nextTick();
    expect(roots[0]?.getAttribute("aria-checked")).toBe("true");
    expect(roots[1]?.getAttribute("aria-checked")).toBe("false");

    roots[0]?.click();
    await nextTick();
    expect(roots[0]?.getAttribute("aria-checked")).toBe("false");
    expect(roots[1]?.getAttribute("aria-checked")).toBe("false");
    expect(Object.fromEntries(new FormData(form))).toEqual({ alpha: "no", beta: "no" });

    roots[1]?.click();
    await nextTick();
    expect(Object.fromEntries(new FormData(form))).toEqual({ alpha: "no", beta: "yes" });

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    expect(roots[0]?.getAttribute("aria-checked")).toBe("true");
    expect(roots[1]?.getAttribute("aria-checked")).toBe("false");
  });

  it("destroys exact instances and removes Runtime-owned native unchecked inputs on remount", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const host = appendHost();

    for (let cycle = 1; cycle <= 2; cycle += 1) {
      const app = createApp({
        render: () =>
          h(CheckboxRoot, {
            defaultChecked: false,
            name: `native-${cycle}`,
            nativeButton: true,
            uncheckedValue: "no",
          }),
      });
      app.mount(host);
      expect(host.querySelectorAll("[data-sw-checkbox-unchecked-input]")).toHaveLength(1);
      app.unmount();
      expect(host.querySelectorAll("[data-sw-checkbox-unchecked-input]")).toHaveLength(0);
      expect(host.children).toHaveLength(0);
    }

    expect(abort).toHaveBeenCalledTimes(2);
  });

  it("hydrates without warnings, duplicate initialization, or leaked cleanup", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const props = { defaultChecked: true, id: "hydrated-checkbox", name: "hydrated" };
    const root = () =>
      h(CheckboxRoot, props, { default: () => h(CheckboxIndicator, null, { default: () => "✓" }) });
    const html = await renderToString(createSSRApp({ render: root }));
    const host = appendHost();
    host.innerHTML = html;
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    await nextTick();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("#hydrated-checkbox")).toHaveLength(1);
    expect(host.querySelectorAll("[data-sw-checkbox-input]")).toHaveLength(1);
    expect(host.querySelectorAll("[data-sw-checkbox-indicator]")).toHaveLength(1);

    app.unmount();
    expect(abort).toHaveBeenCalledTimes(1);
  });
});

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

testAcceptedModelPublication({
  name: "Checkbox",
  model: "checked",
  proposal: "onCheckedChange",
  domEvent: "starwind:checked-change",
  initial: false,
  accepted: true,
  tree: () => h(CheckboxRoot, { defaultChecked: false }),
  root: "[data-sw-checkbox]",
  act: (root) => root.click(),
  read: (root) => {
    const checked = root.getAttribute("aria-checked") === "true";
    expect(root.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")?.checked).toBe(checked);
    return checked;
  },
});

describe("Vue Checkbox reset baseline", () => {
  for (const option of ["id", "nativeButton", "readOnly"] as const) {
    for (const initial of [false, true]) {
      it(`preserves ${initial} reset after ${option} recreation`, async () => {
        const changed = ref(false);
        const host = appendHost();
        const app = createApp({
          render: () =>
            h("form", null, [
              h(CheckboxRoot, {
                defaultChecked: changed.value ? !initial : initial,
                name: "setting",
                value: "yes",
                uncheckedValue: "no",
                id: option === "id" && changed.value ? "replacement" : "original",
                nativeButton: option === "nativeButton" && changed.value,
                readOnly: option === "readOnly" && changed.value,
              }),
            ]),
        });
        app.mount(host);
        cleanups.push(() => app.unmount());
        host.querySelector<HTMLElement>("[data-sw-checkbox]")!.click();
        await nextTick();
        changed.value = true;
        await nextTick();
        expect(host.querySelector("[data-sw-checkbox]")).toHaveAttribute(
          "aria-checked",
          String(!initial),
        );
        const form = host.querySelector("form")!;
        expect(new FormData(form).get("setting")).toBe(initial ? "no" : "yes");
        form.reset();
        await new Promise((resolve) => setTimeout(resolve, 15));
        await nextTick();
        expect(host.querySelector("[data-sw-checkbox]")).toHaveAttribute(
          "aria-checked",
          String(initial),
        );
        expect(
          host.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.defaultChecked,
        ).toBe(initial);
        expect(new FormData(form).get("setting")).toBe(initial ? "yes" : "no");
      });
    }
  }
});

describe("Vue Checkbox reset lifecycle", () => {
  it("keeps canceled reset state and ignores pending reset work after replacement and unmount", async () => {
    const checked = ref<boolean | undefined>(undefined);
    const id = ref("first");
    const changes: boolean[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("form", {}, [
          h(CheckboxRoot, {
            checked: checked.value,
            id: id.value,
            defaultChecked: false,
            name: "setting",
            "onUpdate:checked": (value: boolean) => changes.push(value),
          }),
        ]),
    });
    app.mount(host);
    let mounted = true;
    cleanups.push(() => {
      if (mounted) app.unmount();
    });
    host.querySelector<HTMLElement>("[data-sw-checkbox]")!.click();
    await nextTick();
    const form = host.querySelector<HTMLFormElement>("form")!;
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 15));
    await nextTick();
    expect(host.querySelector("[data-sw-checkbox]")).toHaveAttribute("aria-checked", "true");
    expect(host.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.checked).toBe(true);
    form.reset();
    checked.value = true;
    id.value = "second";
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(host.querySelector("[data-sw-checkbox]")).toHaveAttribute("aria-checked", "true");
    checked.value = false;
    await nextTick();
    expect(host.querySelector("[data-sw-checkbox]")).toHaveAttribute("aria-checked", "false");
    form.reset();
    app.unmount();
    mounted = false;
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(host.childElementCount).toBe(0);
    expect(changes).toEqual([true]);
  });
});

it("retains an indeterminate Checkbox through recreation and a canceled reset", async () => {
  const id = ref("first");
  const host = appendHost();
  const app = createApp({
    render: () => h("form", {}, [h(CheckboxRoot, { id: id.value, indeterminate: true })]),
  });
  app.mount(host);
  cleanups.push(() => app.unmount());
  id.value = "replacement";
  await nextTick();
  expect(host.querySelector("[data-sw-checkbox]")).toHaveAttribute("aria-checked", "mixed");
  expect(host.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.indeterminate).toBe(
    true,
  );
  const form = host.querySelector<HTMLFormElement>("form")!;
  form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
  form.reset();
  await new Promise((resolve) => setTimeout(resolve, 15));
  await nextTick();
  expect(host.querySelector("[data-sw-checkbox]")).toHaveAttribute("aria-checked", "mixed");
  expect(host.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.indeterminate).toBe(
    true,
  );
});
