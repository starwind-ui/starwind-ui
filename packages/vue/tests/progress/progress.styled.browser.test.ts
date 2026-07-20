import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import Progress from "../../../../apps/vue-demo/src/components/starwind-runtime/progress/Progress.vue";

const cases: ReadonlyArray<{
  id: string;
  max?: number;
  min?: number;
  transform: string;
  value: number;
}> = [
  { id: "ordered", max: 80, min: 20, transform: "translateX(-50%)", value: 50 },
  { id: "reversed", max: 0, min: 100, transform: "translateX(-75%)", value: 25 },
  { id: "equal-complete", max: 10, min: 10, transform: "translateX(0%)", value: 10 },
  { id: "equal-progressing", max: 10, min: 10, transform: "translateX(0%)", value: 9 },
  {
    id: "invalid-bounds",
    max: Number.POSITIVE_INFINITY,
    min: Number.NaN,
    transform: "translateX(-75%)",
    value: 25,
  },
  { id: "nan", transform: "", value: Number.NaN },
  { id: "positive-infinity", transform: "", value: Number.POSITIVE_INFINITY },
  { id: "negative-infinity", transform: "", value: Number.NEGATIVE_INFINITY },
];

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("generated Vue Styled Progress hydration", () => {
  it("preserves normalized presentation through Runtime mount for adversarial inputs", async () => {
    const tree = () =>
      h(
        "main",
        null,
        cases.map(({ id, max, min, value }) =>
          h(Progress, { "aria-label": id, id, max, min, value }),
        ),
      );
    const html = await renderToString(createSSRApp({ render: tree }));
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const serverPresentation = readPresentation(host);
    const warnings: string[] = [];
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const app = createSSRApp({ render: tree });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    await Promise.resolve();
    await Promise.resolve();

    expect(warnings).toEqual([]);
    expect(readPresentation(host)).toEqual(serverPresentation);
    for (const testCase of cases) {
      const root = host.querySelector<HTMLElement>(`#${testCase.id}`)!;
      const indicator = root.querySelector<HTMLElement>("[data-slot='progress-indicator']")!;
      const indeterminate = !Number.isFinite(testCase.value);

      expect(indicator.style.transform).toBe(testCase.transform);
      expect(root.hasAttribute("data-indeterminate")).toBe(indeterminate);
      expect(root.getAttribute("data-status")).toBe(
        indeterminate
          ? "indeterminate"
          : testCase.id.startsWith("equal-")
            ? "complete"
            : "progressing",
      );
    }

    app.unmount();
    expect(disconnect).toHaveBeenCalledTimes(cases.length);
    expect(host.children).toHaveLength(0);
  });
});

function readPresentation(host: HTMLElement) {
  return cases.map(({ id }) => {
    const root = host.querySelector<HTMLElement>(`#${id}`)!;
    const indicator = root.querySelector<HTMLElement>("[data-slot='progress-indicator']")!;
    return {
      determinate: root.hasAttribute("data-value"),
      id,
      max: root.getAttribute("data-max"),
      min: root.getAttribute("data-min"),
      transform: indicator.style.transform,
    };
  });
}
