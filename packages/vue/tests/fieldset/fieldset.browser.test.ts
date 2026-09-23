import { FieldsetLegend, FieldsetRoot } from "@starwind-ui/vue/fieldset";
import { InputRoot } from "@starwind-ui/vue/input";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "vue/server-renderer";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Fieldset public behavior", () => {
  it("tracks reactive legend IDs through the single Runtime observer and preserves explicit labels", async () => {
    const id = ref("first");
    const label = ref<string | undefined>();
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          FieldsetRoot,
          { "aria-label": label.value },
          {
            default: () => h(FieldsetLegend, { id: id.value }, () => "Settings"),
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector("fieldset")!;
    expect(observe.mock.calls.filter(([target]) => target === root)).toHaveLength(1);
    expect(root.getAttribute("aria-labelledby")).toBe("first");
    id.value = "second";
    await nextTick();
    await macrotask();
    expect(root.getAttribute("aria-labelledby")).toBe("second");
    label.value = "Explicit";
    id.value = "third";
    await nextTick();
    await macrotask();
    expect(root.getAttribute("aria-label")).toBe("Explicit");
    expect(root.hasAttribute("aria-labelledby")).toBe(false);
  });

  it("owns native disabled submission, dynamic discovery, legend state, and cleanup", async () => {
    const disabled = ref(true);
    const showSecond = ref(false);
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
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
    const fieldsetObservers = observe.mock.calls.flatMap(([target], index) =>
      target === fieldset ? [observe.mock.contexts[index]] : [],
    );
    expect(fieldsetObservers).toHaveLength(1);

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
    expect(disconnect.mock.contexts.filter((owner) => owner === fieldsetObservers[0])).toHaveLength(
      1,
    );
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
