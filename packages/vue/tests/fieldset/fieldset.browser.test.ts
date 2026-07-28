import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FieldsetLegend, FieldsetRoot } from "@starwind-ui/vue/fieldset";
import { InputRoot } from "@starwind-ui/vue/input";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Fieldset public behavior", () => {
  it("owns native disabled submission, dynamic discovery, legend state, and cleanup", async () => {
    const disabled = ref(true);
    const showSecond = ref(false);
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("form", null, [
          h(
            FieldsetRoot,
            { disabled: disabled.value },
            {
              default: () => [
                h(FieldsetLegend, null, () => "Shipping"),
                field("city", "Bangkok"),
                showSecond.value ? field("country", "Thailand") : null,
              ],
            },
          ),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const form = host.querySelector("form")!;
    const fieldset = host.querySelector("fieldset")!;
    const legend = host.querySelector<HTMLElement>("[data-sw-fieldset-legend]")!;

    expect(fieldset.disabled).toBe(true);
    expect(legend).toHaveAttribute("data-disabled");
    expect(Object.fromEntries(new FormData(form))).toEqual({});

    showSecond.value = true;
    await nextTick();
    await macrotask();
    const fields = [...host.querySelectorAll<HTMLElement>("[data-sw-field]")];
    expect(fields).toHaveLength(2);
    expect(fields.every((item) => item.hasAttribute("data-disabled"))).toBe(true);

    disabled.value = false;
    await nextTick();
    await macrotask();
    expect(fieldset.disabled).toBe(false);
    expect(legend).not.toHaveAttribute("data-disabled");
    expect(Object.fromEntries(new FormData(form))).toEqual({
      city: "Bangkok",
      country: "Thailand",
    });

    app.unmount();
    cleanups.pop();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("hydrates one isolated native fieldset without warnings", async () => {
    const root = () =>
      h(
        FieldsetRoot,
        { disabled: true, id: "hydrated-fieldset" },
        { default: () => h(FieldsetLegend, null, () => "Hydrated") },
      );
    const host = appendHost();
    host.innerHTML = await renderToString(createSSRApp({ render: root }));
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("#hydrated-fieldset")).toHaveLength(1);
    expect(host.querySelector("fieldset")?.disabled).toBe(true);
  });
});

function field(name: string, value: string) {
  return h("div", { "data-name": name, "data-sw-field": "" }, [
    h(InputRoot, {
      "data-sw-field-control": "",
      defaultValue: value,
      name,
    }),
  ]);
}

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

function macrotask(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}
