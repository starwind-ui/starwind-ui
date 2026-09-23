import type { SwitchCheckedChangeDetails } from "@starwind-ui/runtime/switch";
import { SwitchRoot, SwitchThumb } from "@starwind-ui/vue/switch";
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

type SwitchExposed = ComponentPublicInstance & {
  element: HTMLElement | null;
  input: HTMLInputElement | null;
};

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Switch public behavior", () => {
  it.each([true, false])(
    "hydrates controlled %s with consistent native state and FormData",
    async (checked) => {
      const changes = vi.fn();
      const component = {
        render: () =>
          h("form", null, [
            h(SwitchRoot, {
              checked,
              defaultChecked: !checked,
              name: "setting",
              value: "yes",
              onCheckedChange: changes,
            }),
          ]),
      };
      const host = appendHost();
      host.innerHTML = await renderToString(createSSRApp(component));
      const form = host.querySelector("form")!;
      const root = host.querySelector<HTMLElement>("[data-sw-switch]")!;
      const input = host.querySelector<HTMLInputElement>("[data-sw-switch-input]")!;
      expect(input.checked).toBe(checked);
      expect(new FormData(form).get("setting")).toBe(checked ? "yes" : null);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const app = createSSRApp(component);
      app.mount(host);
      cleanups.push(() => app.unmount());
      await nextTick();
      expect(host.querySelector("[data-sw-switch]")).toBe(root);
      expect(host.querySelector("[data-sw-switch-input]")).toBe(input);
      expect(host.querySelectorAll("[data-sw-switch-input]")).toHaveLength(1);
      expect(input.checked).toBe(checked);
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 15));
      await nextTick();
      expect(input.checked).toBe(checked);
      expect(new FormData(form).get("setting")).toBe(checked ? "yes" : null);
      expect(changes).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    },
  );
  it("forwards attrs, slots and refs, and accepts or cancels changes in order", async () => {
    const exposed = ref<SwitchExposed | null>(null);
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          SwitchRoot,
          {
            "aria-label": "Notifications",
            class: "notifications",
            defaultChecked: false,
            onCheckedChange: (_checked: boolean, detail: SwitchCheckedChangeDetails) => {
              events.push("detail");
              if (events.includes("cancel-next")) detail.cancel();
            },
            "onUpdate:checked": () => events.push("update"),
            ref: exposed,
          },
          { default: () => h(SwitchThumb, null, { default: () => "toggle" }) },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    const root = host.querySelector<HTMLElement>("[data-sw-switch]")!;
    const input = host.querySelector<HTMLInputElement>("[data-sw-switch-input]")!;
    expect(root.className).toBe("notifications");
    expect(root.textContent).toBe("toggle");
    expect(exposed.value?.element).toBe(root);
    expect(exposed.value?.input).toBe(input);

    root.click();
    await nextTick();
    expect(events).toEqual(["detail", "update"]);
    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(input.checked).toBe(true);

    events.push("cancel-next");
    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
    await nextTick();
    expect(events).toEqual(["detail", "update", "cancel-next", "detail"]);
    expect(root.getAttribute("aria-checked")).toBe("true");
  });

  it("keeps controlled state parent-owned and applies parent changes without loops", async () => {
    const props = reactive({ checked: false, disabled: false });
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(SwitchRoot, {
          checked: props.checked,
          disabled: props.disabled,
          onCheckedChange: () => events.push("detail"),
          "onUpdate:checked": () => events.push("update"),
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector<HTMLElement>("[data-sw-switch]")!;

    root.click();
    await nextTick();
    expect(events).toEqual(["detail", "update"]);
    expect(root.getAttribute("aria-checked")).toBe("false");

    props.checked = true;
    await nextTick();
    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(events).toEqual(["detail", "update"]);

    props.disabled = true;
    await nextTick();
    root.click();
    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(events).toEqual(["detail", "update"]);
  });

  it("preserves native form serialization, reactive options, reset, and instance isolation", async () => {
    const options = reactive({ name: "alpha", required: true, value: "yes" });
    const host = appendHost();
    const form = document.createElement("form");
    form.id = "switch-settings";
    document.body.append(form);
    const app = createApp({
      render: () =>
        h("div", null, [
          h(SwitchRoot, {
            defaultChecked: true,
            form: "switch-settings",
            name: options.name,
            required: options.required,
            uncheckedValue: "no",
            value: options.value,
          }),
          h(SwitchRoot, {
            defaultChecked: false,
            form: "switch-settings",
            name: "beta",
            uncheckedValue: "no",
            value: "yes",
          }),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const roots = host.querySelectorAll<HTMLElement>("[data-sw-switch]");

    expect(Object.fromEntries(new FormData(form))).toEqual({ alpha: "yes", beta: "no" });
    roots[0]?.click();
    roots[1]?.click();
    await nextTick();
    expect(Object.fromEntries(new FormData(form))).toEqual({ alpha: "no", beta: "yes" });

    options.name = "renamed";
    options.required = false;
    options.value = "enabled";
    await nextTick();
    expect(Object.fromEntries(new FormData(form))).toEqual({ renamed: "no", beta: "yes" });

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    expect(roots[0]?.getAttribute("aria-checked")).toBe("true");
    expect(roots[1]?.getAttribute("aria-checked")).toBe("false");
  });

  it("destroys exact instances, removes unchecked inputs, and hydrates without duplication", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const root = () =>
      h(
        SwitchRoot,
        { defaultChecked: false, id: "hydrated-switch", name: "hydrated", uncheckedValue: "no" },
        { default: () => h(SwitchThumb) },
      );
    const html = await renderToString(createSSRApp({ render: root }));
    const host = appendHost();
    host.innerHTML = html;
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    await nextTick();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("[data-sw-switch]")).toHaveLength(1);
    expect(host.querySelectorAll("[data-sw-switch-input]")).toHaveLength(1);
    expect(host.querySelectorAll("[data-sw-switch-unchecked-input]")).toHaveLength(1);

    app.unmount();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(host.querySelectorAll("[data-sw-switch-unchecked-input]")).toHaveLength(0);
  });
});

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

testAcceptedModelPublication({
  name: "Switch",
  model: "checked",
  proposal: "onCheckedChange",
  domEvent: "starwind:checked-change",
  initial: false,
  accepted: true,
  tree: () => h(SwitchRoot, { defaultChecked: false }),
  root: "[data-sw-switch]",
  act: (root) => root.click(),
  read: (root) => {
    const checked = root.getAttribute("aria-checked") === "true";
    expect(
      root.parentElement!.querySelector<HTMLInputElement>("[data-sw-switch-input]")?.checked,
    ).toBe(checked);
    return checked;
  },
});

describe("Vue Switch reset baseline", () => {
  for (const option of ["id", "nativeButton", "readOnly"] as const) {
    for (const initial of [false, true]) {
      it(`preserves ${initial} reset after ${option} recreation`, async () => {
        const changed = ref(false);
        const host = appendHost();
        const app = createApp({
          render: () =>
            h("form", null, [
              h(SwitchRoot, {
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
        host.querySelector<HTMLElement>("[data-sw-switch]")!.click();
        await nextTick();
        changed.value = true;
        await nextTick();
        expect(host.querySelector("[data-sw-switch]")).toHaveAttribute(
          "aria-checked",
          String(!initial),
        );
        const form = host.querySelector("form")!;
        expect(new FormData(form).get("setting")).toBe(initial ? "no" : "yes");
        form.reset();
        await new Promise((resolve) => setTimeout(resolve, 15));
        await nextTick();
        expect(host.querySelector("[data-sw-switch]")).toHaveAttribute(
          "aria-checked",
          String(initial),
        );
        expect(host.querySelector<HTMLInputElement>("[data-sw-switch-input]")!.defaultChecked).toBe(
          initial,
        );
        expect(new FormData(form).get("setting")).toBe(initial ? "yes" : "no");
      });
    }
  }
});

describe("Vue Switch reset lifecycle", () => {
  it("keeps canceled reset state and ignores pending reset work after replacement and unmount", async () => {
    const checked = ref<boolean | undefined>(undefined);
    const id = ref("first");
    const changes: boolean[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("form", {}, [
          h(SwitchRoot, {
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
    host.querySelector<HTMLElement>("[data-sw-switch]")!.click();
    await nextTick();
    const form = host.querySelector<HTMLFormElement>("form")!;
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 15));
    await nextTick();
    expect(host.querySelector("[data-sw-switch]")).toHaveAttribute("aria-checked", "true");
    expect(host.querySelector<HTMLInputElement>("[data-sw-switch-input]")!.checked).toBe(true);
    form.reset();
    checked.value = true;
    id.value = "second";
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(host.querySelector("[data-sw-switch]")).toHaveAttribute("aria-checked", "true");
    checked.value = false;
    await nextTick();
    expect(host.querySelector("[data-sw-switch]")).toHaveAttribute("aria-checked", "false");
    form.reset();
    app.unmount();
    mounted = false;
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(host.childElementCount).toBe(0);
    expect(changes).toEqual([true]);
  });
});
