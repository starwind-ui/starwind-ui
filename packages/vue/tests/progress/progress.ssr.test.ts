import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  ProgressIndicator,
  ProgressLabel,
  ProgressRoot,
  ProgressTrack,
  ProgressValue,
} from "@starwind-ui/vue/progress";

describe("Vue Progress SSR", () => {
  it("server-renders all semantic parts deterministically without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(
        createSSRApp({
          render: () => progressTree({ max: 200, min: 20, value: 80 }),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain(
      '<div class="progress-root" data-review="server" data-sw-progress data-value="80" data-min="20" data-max="200" role="progressbar">',
    );
    expect(first).toContain(
      '<span class="progress-label" data-sw-progress-label role="presentation">',
    );
    expect(first).toContain("Export files");
    expect(first).toContain('<div class="progress-track" data-sw-progress-track>');
    expect(first).toContain('<div class="progress-indicator" data-sw-progress-indicator>');
    expect(first).toMatch(
      /<span class="progress-value" data-sw-progress-value aria-hidden="true">[\s\S]*<\/span>/,
    );
  });

  it("preserves indeterminate and caller-owned value text markup", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            ProgressRoot,
            { "aria-label": "Upload progress", value: null },
            {
              default: () => h(ProgressValue, { id: "custom-value" }, { default: () => "Waiting" }),
            },
          ),
      }),
    );

    expect(html).toMatch(/data-sw-progress[^>]+data-indeterminate(?:="")?(?:\s|>)/);
    expect(html).not.toContain("data-value=");
    expect(html).toContain('aria-label="Upload progress"');
    expect(html).toMatch(
      /<span id="custom-value" data-sw-progress-value data-preserve-text(?:="")? aria-hidden="true">[\s\S]*Waiting[\s\S]*<\/span>/,
    );
  });
});

function progressTree({ max, min, value }: { max: number; min: number; value: number | null }) {
  return h(
    ProgressRoot,
    { class: "progress-root", "data-review": "server", max, min, value },
    {
      default: () => [
        h(ProgressLabel, { class: "progress-label" }, { default: () => "Export files" }),
        h(
          ProgressTrack,
          { class: "progress-track" },
          {
            default: () =>
              h(
                ProgressIndicator,
                { class: "progress-indicator" },
                { default: () => h("i", "indicator slot") },
              ),
          },
        ),
        h(ProgressValue, { class: "progress-value" }),
      ],
    },
  );
}
