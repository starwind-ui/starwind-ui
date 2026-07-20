import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import Progress from "../../../../apps/vue-demo/src/components/starwind-runtime/progress/Progress.vue";

describe("generated Vue Styled Progress SSR", () => {
  it("renders deterministic Primitive-backed range, attrs, variants, and transform", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(Progress, {
            "aria-describedby": "upload-description",
            class: "consumer-progress",
            label: "Upload progress",
            max: 80,
            min: 20,
            value: 50,
            variant: "success",
          }),
      }),
    );

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Upload progress"');
    expect(html).toContain('aria-describedby="upload-description"');
    expect(html).toContain('data-min="20"');
    expect(html).toContain('data-max="80"');
    expect(html).toContain('data-value="50"');
    expect(html).toContain('data-slot="progress"');
    expect(html).toContain('data-slot="progress-track"');
    expect(html).toContain('data-slot="progress-indicator"');
    expect(html).toContain("consumer-progress");
    expect(html).toContain("bg-success");
    expect(html).toContain("translateX(-50%)");
  });

  it("renders the established indeterminate presentation without determinate ARIA", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(Progress, {
            "aria-label": "Waiting for server",
            value: null,
            variant: "warning",
          }),
      }),
    );

    expect(html).toContain('aria-label="Waiting for server"');
    expect(html).toContain("relative");
    expect(html).toContain("absolute inset-y-0 start-0 w-3/4");
    expect(html).toContain("bg-warning");
    expect(html).not.toContain("aria-valuenow");
    expect(html).not.toContain("translateX(");
  });

  it.each([
    [
      "ordered",
      { max: 80, min: 20, value: 50 },
      'data-min="20"',
      'data-max="80"',
      "50",
      "translateX(-50%)",
    ],
    [
      "reversed",
      { max: 0, min: 100, value: 25 },
      'data-min="0"',
      'data-max="100"',
      "25",
      "translateX(-75%)",
    ],
    [
      "equal complete",
      { max: 10, min: 10, value: 10 },
      'data-min="10"',
      'data-max="10"',
      "10",
      "translateX(-0%)",
    ],
    [
      "equal progressing",
      { max: 10, min: 10, value: 9 },
      'data-min="10"',
      'data-max="10"',
      "10",
      "translateX(-0%)",
    ],
    [
      "invalid bounds",
      { max: Number.POSITIVE_INFINITY, min: Number.NaN, value: 25 },
      'data-min="0"',
      'data-max="100"',
      "25",
      "translateX(-75%)",
    ],
  ])(
    "normalizes %s inputs before server rendering",
    async (_name, props, min, max, value, transform) => {
      const html = await renderProgress(props);

      expect(html).toContain(min);
      expect(html).toContain(max);
      expect(html).toContain(`data-value="${value}"`);
      expect(html).toContain(transform);
    },
  );

  it.each([
    ["NaN", Number.NaN],
    ["positive infinity", Number.POSITIVE_INFINITY],
    ["negative infinity", Number.NEGATIVE_INFINITY],
  ])("server-renders %s as indeterminate", async (_name, value) => {
    const html = await renderProgress({ value });

    expect(html).toContain("relative");
    expect(html).toContain("absolute inset-y-0 start-0 w-3/4");
    expect(html).not.toContain("data-value=");
    expect(html).not.toContain("translateX(");
  });
});

function renderProgress(props: { max?: number; min?: number; value?: number | null }) {
  return renderToString(
    createSSRApp({
      render: () => h(Progress, { "aria-label": "Normalization case", ...props }),
    }),
  );
}
