import type { CheckboxGroupValueChangeDetails } from "@starwind-ui/runtime/checkbox-group";
import { CheckboxRoot } from "@starwind-ui/vue/checkbox";
import { CheckboxGroupRoot } from "@starwind-ui/vue/checkbox-group";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, createSSRApp, h, nextTick, reactive, ref } from "vue";
import { renderToString } from "vue/server-renderer";

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
    expect(events).toEqual(["child-detail", "group-detail", "group-update"]);
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

describe("Vue Checkbox conflicting group children", () => {
  for (const controlled of [false, true]) {
    it(`keeps membership authoritative in a ${controlled ? "controlled" : "default"} group`, async () => {
      const value = ref(["alpha"]);
      const childChecked = ref(false);
      const details: boolean[] = [];
      const childModels: boolean[] = [];
      const groupModels: string[][] = [];
      const host = appendHost();
      const app = createApp({
        render: () =>
          h("form", {}, [
            h(
              CheckboxGroupRoot,
              {
                ...(controlled ? { modelValue: value.value } : { defaultValue: ["alpha"] }),
                "onUpdate:modelValue": (next: string[]) => groupModels.push(next),
              },
              {
                default: () => [
                  h(CheckboxRoot, {
                    checked: childChecked.value,
                    defaultChecked: false,
                    name: "choice",
                    value: "alpha",
                    onCheckedChange: (next: boolean) => details.push(next),
                    "onUpdate:checked": (next: boolean) => childModels.push(next),
                  }),
                  h(CheckboxRoot, {
                    checked: !childChecked.value,
                    defaultChecked: true,
                    name: "choice",
                    value: "beta",
                    "onUpdate:checked": (next: boolean) => childModels.push(next),
                  }),
                ],
              },
            ),
          ]),
      });
      app.mount(host);
      cleanups.push(() => app.unmount());
      const form = host.querySelector<HTMLFormElement>("form")!;
      const check = (expected: string[]) => {
        expect(
          Array.from(host.querySelectorAll("[data-sw-checkbox]")).map((root) =>
            root.getAttribute("aria-checked"),
          ),
        ).toEqual([String(expected.includes("alpha")), String(expected.includes("beta"))]);
        expect(new FormData(form).getAll("choice")).toEqual(expected);
      };
      check(["alpha"]);
      host.querySelector<HTMLElement>('[data-sw-checkbox][data-value="alpha"]')!.click();
      await nextTick();
      expect(details).toEqual([false]);
      expect(groupModels).toEqual([[]]);
      expect(childModels).toEqual([]);
      check(controlled ? ["alpha"] : []);
      childChecked.value = true;
      value.value = ["beta"];
      await nextTick();
      check(controlled ? ["beta"] : []);
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 15));
      await nextTick();
      check(controlled ? ["beta"] : ["alpha"]);
      expect(childModels).toEqual([]);
    });
  }

  it("hydrates group selection over conflicting child props", async () => {
    const root = {
      render: () =>
        h(
          CheckboxGroupRoot,
          { defaultValue: ["alpha"] },
          {
            default: () => [
              h(CheckboxRoot, { checked: false, value: "alpha" }),
              h(CheckboxRoot, { checked: true, value: "beta" }),
            ],
          },
        ),
    };
    const host = appendHost();
    host.innerHTML = await renderToString(createSSRApp(root));
    const states = () =>
      Array.from(host.querySelectorAll("[data-sw-checkbox]")).map((element) =>
        element.getAttribute("aria-checked"),
      );
    expect(states()).toEqual(["true", "false"]);
    expect(
      Array.from(host.querySelectorAll<HTMLInputElement>("[data-sw-checkbox-input]")).map(
        (input) => input.checked,
      ),
    ).toEqual([true, false]);
    const warnings: string[] = [];
    const app = createSSRApp(root);
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();
    expect(states()).toEqual(["true", "false"]);
    expect(
      Array.from(host.querySelectorAll<HTMLInputElement>("[data-sw-checkbox-input]")).map(
        (input) => input.checked,
      ),
    ).toEqual([true, false]);
    expect(warnings).toEqual([]);
  });
});
