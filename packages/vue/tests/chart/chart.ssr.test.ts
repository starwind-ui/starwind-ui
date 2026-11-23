import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ChartPrimitive, { type ChartConfig } from "@starwind-ui/vue/chart";
import { describe, expect, it } from "vitest";
import { type Component, createSSRApp, h, type VNodeChild } from "vue";
import { renderToString } from "vue/server-renderer";
import { ChartContainer } from "../../../../apps/vue-demo/src/components/starwind-runtime/chart";
import {
  visitorBars,
  visitorConfig,
  visitorData,
} from "../../../runtime/tests/components/chart/fixtures";

const config = visitorConfig as ChartConfig;

function render(node: () => VNodeChild): Promise<string> {
  return renderToString(createSSRApp({ render: node }));
}

function chart(props: Record<string, unknown> = {}, children: () => VNodeChild = () => null) {
  return h(
    ChartPrimitive.Root,
    { chart: visitorBars, data: visitorData(), config, ...props },
    () => [h(ChartPrimitive.Style), h(ChartPrimitive.Surface), children()],
  );
}

function nativeDefinition() {
  return visitorBars({
    data: visitorData(),
    config: visitorConfig,
    keys: ["desktop", "mobile"],
    visible: ["desktop", "mobile"],
    params: {},
    isVisible: () => true,
    label: (key) => key,
    color: { domain: ["desktop", "mobile"], range: ["red", "blue"] },
    theme: { foreground: "black", muted: "gray", grid: "gray", background: "white" },
    tooltip: () => ({}) as never,
  });
}

describe("Vue chart Primitive server render", () => {
  it("renders the chart SVG, the config styles and the reserved surface size", async () => {
    const html = await render(() => chart({ id: "visitors" }));

    expect(html).toContain('data-slot="chart" data-chart="visitors"');
    expect(html).toContain('data-slot="chart-style"');
    expect(html).toContain('[data-chart="visitors"]{--sw-chart-color-desktop:rgb(37, 99, 235)');
    expect(html).toMatch(
      /<div style="height:340px;?" data-sw-chart-surface data-slot="chart-surface"><svg/,
    );
    expect(html).toContain("<rect");
    expect(await render(() => chart({ id: "visitors" }))).toBe(html);
  });

  it("generates a valid chart id from useId when id is omitted", async () => {
    const html = await render(() => [chart(), chart()]);
    const ids = [...html.matchAll(/data-slot="chart" data-chart="([^"]+)"/g)].map((m) => m[1]);

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(id).toMatch(/^chart-[a-zA-Z0-9_-]+$/);
  });

  it("renders legend items per config key with visibility state", async () => {
    const html = await render(() =>
      h(
        ChartPrimitive.Root,
        {
          id: "legend",
          chart: visitorBars,
          data: visitorData(),
          config,
          defaultVisible: ["mobile"],
        },
        () =>
          h(ChartPrimitive.Legend, null, () =>
            h(ChartPrimitive.LegendItems, null, () =>
              h(ChartPrimitive.LegendItem, null, () => [
                h(ChartPrimitive.LegendSwatch),
                h(ChartPrimitive.LegendLabel),
              ]),
            ),
          ),
      ),
    );

    expect(html).toContain('role="group" aria-label="Chart series" data-slot="chart-legend"');
    expect(html).toContain(
      '<button type="button" aria-pressed="false" data-state="off" data-key="desktop" data-slot="chart-legend-item">',
    );
    expect(html).toContain('aria-pressed="true" data-state="on" data-key="mobile"');
    expect(html).toContain(
      '<span style="background:var(--sw-chart-color-desktop);" data-slot="chart-legend-swatch" aria-hidden="true"></span>',
    );
    expect(html).toContain('<span data-slot="chart-legend-label">Mobile</span>');
    expect(html).not.toContain("data-sw-chart-legend-item");
    expect(html).not.toContain("data-sw-chart=");
  });

  it("renders a passive legend and rejects visibility props for a native definition", async () => {
    const definition = nativeDefinition();
    const html = await render(() =>
      h(ChartPrimitive.Root, { id: "native", definition, config }, () =>
        h(ChartPrimitive.LegendItem, { value: "desktop" }, () => "Desktop"),
      ),
    );
    expect(html).toContain('<span data-key="desktop" data-slot="chart-legend-item">');
    expect(html).toContain("Desktop");
    expect(html).not.toContain("<button");

    await expect(
      render(() => h(ChartPrimitive.Root, { id: "native", definition, config, visible: [] })),
    ).rejects.toThrow(/own their visibility/);
    await expect(
      render(() =>
        h(ChartPrimitive.Root, { id: "native", definition, config, defaultVisible: [] }),
      ),
    ).rejects.toThrow(/own their visibility/);
    // A visibleChange listener is rejected too, as onVisibleChange is in React and Svelte. A
    // template \`@visible-change\` shorthand compiles to this onVisibleChange vnode prop. vue-tsc
    // does not reject the shorthand on a definition, so this setup error is its guard.
    await expect(
      render(() =>
        h(ChartPrimitive.Root, { id: "native", definition, config, onVisibleChange: () => {} }),
      ),
    ).rejects.toThrow(/own their visibility/);
  });

  // A template compiles each spelling to a different vnode key. Every spelling that the template
  // type check accepts on a definition must reach the Root setup error, also through the Styled
  // ChartContainer, which forwards listeners as attributes.
  const LISTENER_SPELLINGS = [
    '@visible-change="handler"',
    '@visible-change.once="handler"',
    ':on-visible-change="handler"',
    ':onVisibleChange="handler"',
    '@update:visible="handler"',
    ':on-update:visible="handler"',
    ':onUpdate:visible="handler"',
  ];
  for (const [surface, component] of [
    ["Chart.Root", ChartPrimitive.Root],
    ["ChartContainer", ChartContainer],
  ] as const)
    for (const spelling of LISTENER_SPELLINGS)
      it(`rejects ${spelling} on a ${surface} definition at setup`, async () => {
        const definition = nativeDefinition();
        const app = createSSRApp({
          components: { Surface: component as Component },
          setup: () => ({ definition, config, handler: () => {} }),
          template: `<Surface id="native" :definition="definition" :config="config" ${spelling} />`,
        });
        await expect(renderToString(app)).rejects.toThrow(/own their visibility/);
      });

  it("renders a definition without listeners through ChartContainer", async () => {
    const definition = nativeDefinition();
    const html = await renderToString(
      createSSRApp({
        components: { Surface: ChartContainer as Component },
        setup: () => ({ definition, config }),
        template: `<Surface id="native" :definition="definition" :config="config" />`,
      }),
    );
    expect(html).toContain('data-slot="chart"');
  });

  it("renders a Tooltip outside a tooltip body as nothing", async () => {
    const html = await render(() => [
      h(ChartPrimitive.Tooltip, null, () => "outside"),
      chart({ id: "tip" }, () => h(ChartPrimitive.Tooltip, null, () => "inside")),
    ]);
    expect(html).not.toContain("outside");
    expect(html).not.toContain("inside");
  });

  it("imports only the Runtime chart subpath and Vue", () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/chart");
    const sources = readdirSync(root).map((file) => readFileSync(path.join(root, file), "utf8"));
    const imports = sources.flatMap((source) =>
      [...source.matchAll(/from "([^"]+)"/g)].map((match) => match[1]!),
    );
    const external = new Set(imports.filter((source) => !source.startsWith(".")));

    expect([...external].sort()).toEqual(["@starwind-ui/runtime/chart", "vue"]);
  });
});
