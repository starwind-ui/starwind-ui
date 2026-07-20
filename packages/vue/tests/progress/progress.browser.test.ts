import {
  createApp,
  createSSRApp,
  defineComponent,
  h,
  nextTick,
  ref,
  type ComponentPublicInstance,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ProgressIndicator,
  ProgressLabel,
  ProgressRoot,
  ProgressTrack,
  ProgressValue,
} from "@starwind-ui/vue/progress";

type ExposedElement<T extends HTMLElement> = ComponentPublicInstance & { element: T | null };

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Progress public behavior", () => {
  it("forwards all semantic parts and synchronizes range and format props without recreation", async () => {
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const value = ref<number | null>(25);
    const min = ref(0);
    const max = ref(100);
    const locale = ref<Intl.LocalesArgument>("en-US");
    const format = ref<Intl.NumberFormatOptions | undefined>();
    const getAriaValueText = ref<
      ((formattedValue: string | null, value: number | null) => string) | undefined
    >();
    const ariaValueText = ref<string | undefined>();
    const refs = createPartRefs();
    const host = mount(
      defineComponent({
        setup() {
          return () =>
            progressTree({
              ariaValueText: ariaValueText.value,
              format: format.value,
              getAriaValueText: getAriaValueText.value,
              locale: locale.value,
              max: max.value,
              min: min.value,
              refs,
              value: value.value,
            });
        },
      }),
    );

    const root = host.querySelector<HTMLElement>("[data-sw-progress]")!;
    const track = host.querySelector<HTMLElement>("[data-sw-progress-track]")!;
    const indicator = host.querySelector<HTMLElement>("[data-sw-progress-indicator]")!;
    const valuePart = host.querySelector<HTMLElement>("[data-sw-progress-value]")!;
    const label = host.querySelector<HTMLElement>("[data-sw-progress-label]")!;
    expect([
      root.tagName,
      track.tagName,
      indicator.tagName,
      valuePart.tagName,
      label.tagName,
    ]).toEqual(["DIV", "DIV", "DIV", "SPAN", "SPAN"]);
    expect(refs.root.value?.element).toBe(root);
    expect(refs.track.value?.element).toBe(track);
    expect(refs.indicator.value?.element).toBe(indicator);
    expect(refs.value.value?.element).toBe(valuePart);
    expect(refs.label.value?.element).toBe(label);
    expect(refs.root.value).not.toHaveProperty("instance");
    expect(root.className).toBe("progress-root");
    expect(root.dataset.consumer).toBe("root");
    expect(track.querySelector("b")?.textContent).toBe("track slot");
    expect(indicator.querySelector("i")?.textContent).toBe("indicator slot");
    expect(label.textContent).toBe("Upload files");
    expect(root.getAttribute("aria-labelledby")).toBe(label.id);
    expect(root).toHaveAttribute("aria-valuenow", "25");
    expect(root).toHaveAttribute("aria-valuetext", "25%");
    expect(indicator.style.transform).toBe("translateX(-75%)");
    expect(valuePart.textContent).toBe("25%");
    expect(observe).toHaveBeenCalledTimes(1);

    value.value = 75;
    min.value = 25;
    max.value = 125;
    await settleRuntime();
    expect(root).toHaveAttribute("data-value", "75");
    expect(root).toHaveAttribute("aria-valuemin", "25");
    expect(root).toHaveAttribute("aria-valuemax", "125");
    expect(indicator.style.transform).toBe("translateX(-50%)");
    expect(observe).toHaveBeenCalledTimes(1);

    format.value = { currency: "USD", style: "currency" };
    await settleRuntime();
    expect(valuePart.textContent).toBe("$75.00");
    expect(root).toHaveAttribute("aria-valuetext", "$75.00");

    locale.value = "de-DE";
    await settleRuntime();
    expect(valuePart.textContent).toContain("75,00");

    locale.value = "en-US";
    await settleRuntime();

    getAriaValueText.value = (formattedValue, rawValue) => `${formattedValue}:${rawValue}`;
    await settleRuntime();
    expect(root).toHaveAttribute("aria-valuetext", "$75.00:75");

    ariaValueText.value = "Three quarters complete";
    await settleRuntime();
    expect(root).toHaveAttribute("aria-valuetext", "Three quarters complete");
    expect(valuePart.textContent).toBe("$75.00");

    value.value = null;
    await settleRuntime();
    expect(root).toHaveAttribute("data-indeterminate", "");
    expect(root).not.toHaveAttribute("aria-valuenow");
    expect(indicator.style.transform).toBe("");
    expect(observe).toHaveBeenCalledTimes(1);

    cleanups.pop()?.();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(Object.values(refs).every((partRef) => partRef.value === null)).toBe(true);
  });

  it("normalizes reversed ranges, preserves explicit text, and isolates multiple roots", async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const firstValue = ref<number | null>(150);
    const secondValue = ref<number | null>(null);
    const host = mount(
      defineComponent({
        setup() {
          return () =>
            h("main", null, [
              h(
                ProgressRoot,
                { id: "first", max: 0, min: 100, value: firstValue.value },
                {
                  default: () => [
                    h(ProgressIndicator),
                    h(ProgressValue, null, { default: () => "Caller text" }),
                  ],
                },
              ),
              h(
                ProgressRoot,
                { "aria-label": "Background task", id: "second", value: secondValue.value },
                {
                  default: () => [h(ProgressIndicator), h(ProgressValue)],
                },
              ),
            ]);
        },
      }),
    );
    const first = host.querySelector<HTMLElement>("#first")!;
    const second = host.querySelector<HTMLElement>("#second")!;
    expect(first).toHaveAttribute("data-min", "0");
    expect(first).toHaveAttribute("data-max", "100");
    expect(first).toHaveAttribute("data-value", "100");
    expect(first).toHaveAttribute("data-complete", "");
    expect(first.querySelector("[data-sw-progress-value]")?.textContent).toBe("Caller text");
    expect(second).toHaveAttribute("data-indeterminate", "");
    expect(second).toHaveAttribute("aria-label", "Background task");
    expect(second).not.toHaveAttribute("aria-labelledby");

    firstValue.value = 25;
    secondValue.value = 40;
    await settleRuntime();
    expect(first).toHaveAttribute("data-value", "25");
    expect(second).toHaveAttribute("data-value", "40");
    expect(first.querySelector<HTMLElement>("[data-sw-progress-indicator]")?.style.transform).toBe(
      "translateX(-75%)",
    );
    expect(second.querySelector<HTMLElement>("[data-sw-progress-indicator]")?.style.transform).toBe(
      "translateX(-60%)",
    );

    cleanups.pop()?.();
    expect(disconnect).toHaveBeenCalledTimes(2);
  });

  it("hydrates deterministic determinate markup without warnings and cleans up once", async () => {
    const value = ref<number | null>(20);
    const tree = () =>
      h(
        ProgressRoot,
        { id: "hydrated-progress", value: value.value },
        {
          default: () => [
            h(ProgressLabel, null, { default: () => "Hydrated task" }),
            h(ProgressTrack, null, { default: () => h(ProgressIndicator) }),
            h(ProgressValue),
          ],
        },
      );
    const html = await renderToString(createSSRApp({ render: tree }));
    expect(html).toContain('data-value="20"');
    expect(html).not.toContain("aria-valuenow");

    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const warnings: string[] = [];
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const app = createSSRApp({ render: tree });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settleRuntime();

    const root = host.querySelector<HTMLElement>("#hydrated-progress")!;
    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("#hydrated-progress")).toHaveLength(1);
    expect(root).toHaveAttribute("aria-valuenow", "20");

    value.value = 80;
    await settleRuntime();
    expect(root).toHaveAttribute("aria-valuenow", "80");
    expect(root.querySelector<HTMLElement>("[data-sw-progress-indicator]")?.style.transform).toBe(
      "translateX(-20%)",
    );

    app.unmount();
    cleanups.pop();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});

function createPartRefs() {
  return {
    indicator: ref<ExposedElement<HTMLDivElement> | null>(null),
    label: ref<ExposedElement<HTMLSpanElement> | null>(null),
    root: ref<ExposedElement<HTMLDivElement> | null>(null),
    track: ref<ExposedElement<HTMLDivElement> | null>(null),
    value: ref<ExposedElement<HTMLSpanElement> | null>(null),
  };
}

function progressTree(options: {
  ariaValueText?: string;
  format?: Intl.NumberFormatOptions;
  getAriaValueText?: (formattedValue: string | null, value: number | null) => string;
  locale?: Intl.LocalesArgument;
  max: number;
  min: number;
  refs: ReturnType<typeof createPartRefs>;
  value: number | null;
}) {
  return h(
    ProgressRoot,
    {
      "aria-valuetext": options.ariaValueText,
      class: "progress-root",
      "data-consumer": "root",
      format: options.format,
      getAriaValueText: options.getAriaValueText,
      locale: options.locale,
      max: options.max,
      min: options.min,
      ref: options.refs.root,
      value: options.value,
    },
    {
      default: () => [
        h(ProgressLabel, { ref: options.refs.label }, { default: () => "Upload files" }),
        h(
          ProgressTrack,
          { ref: options.refs.track },
          {
            default: () => [
              h("b", "track slot"),
              h(
                ProgressIndicator,
                { ref: options.refs.indicator },
                { default: () => h("i", "indicator slot") },
              ),
            ],
          },
        ),
        h(ProgressValue, { ref: options.refs.value }),
      ],
    },
  );
}

function mount(component: ReturnType<typeof defineComponent>): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp(component);
  app.mount(host);
  cleanups.push(() => app.unmount());
  return host;
}

async function settleRuntime(): Promise<void> {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
}
