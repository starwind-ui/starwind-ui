// Renders the Astro chart fixtures on the server with Astro's own compiler and container API, so
// the browser suite can adopt real server output.
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../../../../../", import.meta.url));
const here = path.join(root, "scripts/portable-runtime/tests/chart-styled/astro");

/** Each fixture is a component file and its props. */
export const ASTRO_CHART_FIXTURES = {
  primitive: ["PrimitiveChart.astro", { id: "visitors" }],
  static: ["PrimitiveChart.astro", { id: "static", interactive: false }],
  visible: ["PrimitiveChart.astro", { id: "visible", visible: ["mobile"] }],
  labelClass: [
    "PrimitiveChart.astro",
    { id: "label-class", visible: ["mobile"], nameLabelClass: "name-label" },
  ],
  plain: ["PrimitiveChart.astro", { id: "plain", richLabel: false }],
  icons: ["PrimitiveChart.astro", { id: "icons", icons: true }],
  ids: ["PrimitiveCases.astro", { mode: "ids" }],
  order: ["PrimitiveCases.astro", { mode: "order" }],
  definition: ["PrimitiveCases.astro", { mode: "definition" }],
  definitionVisible: ["PrimitiveCases.astro", { mode: "definition-visible" }],
  bareLegend: ["PrimitiveCases.astro", { mode: "bare-legend" }],
  propEmptySlot: ["PrimitiveCases.astro", { mode: "prop-empty-slot" }],
  outside: ["PrimitiveCases.astro", { mode: "outside" }],
  emptyLabelText: ["PrimitiveCases.astro", { mode: "empty-label", kind: "text" }],
  emptyLabelSlot: ["PrimitiveCases.astro", { mode: "empty-label", kind: "slot" }],
  configLegendDefinition: ["PrimitiveCases.astro", { mode: "config-legend", kind: "definition" }],
  configLegendStatic: ["PrimitiveCases.astro", { mode: "config-legend", kind: "static" }],
  configLegendSource: ["PrimitiveCases.astro", { mode: "config-legend", kind: "source" }],
  styledDefault: ["StyledChart.astro", { mode: "default" }],
  styledOff: ["StyledChart.astro", { mode: "off" }],
  styledNative: ["StyledChart.astro", { mode: "native" }],
  styledChild: ["StyledChart.astro", { mode: "child" }],
  styledSlot: ["StyledChart.astro", { mode: "slot" }],
  styledWrapped: ["StyledChart.astro", { mode: "wrapped" }],
  styledRich: ["StyledChart.astro", { mode: "rich" }],
  styledPlainTooltip: ["StyledChart.astro", { mode: "plain-tooltip" }],
  styledPlainChild: ["StyledChart.astro", { mode: "plain-child" }],
  styledNestedTooltip: ["StyledChart.astro", { mode: "nested-tooltip" }],
  styledMixedTooltip: ["StyledChart.astro", { mode: "mixed-tooltip" }],
  specPartsBar: ["SpecChart.astro", { kind: "bar" }],
  specModuleBar: ["SpecChart.astro", { kind: "bar", mode: "module" }],
  specPartsArea: ["SpecChart.astro", { kind: "area" }],
  specModuleArea: ["SpecChart.astro", { kind: "area", mode: "module" }],
  specPartsLine: ["SpecChart.astro", { kind: "line" }],
  specModuleLine: ["SpecChart.astro", { kind: "line", mode: "module" }],
  specPartsDonut: ["SpecChart.astro", { kind: "donut" }],
  specModuleDonut: ["SpecChart.astro", { kind: "donut", mode: "module" }],
  specPartsRadar: ["SpecChart.astro", { kind: "radar" }],
  specModuleRadar: ["SpecChart.astro", { kind: "radar", mode: "module" }],
  specPartsRadial: ["SpecChart.astro", { kind: "radial" }],
  specModuleRadial: ["SpecChart.astro", { kind: "radial", mode: "module" }],
  specCombined: ["SpecCases.astro", { mode: "combined" }],
  specTickFunction: ["SpecCases.astro", { mode: "tick-function" }],
  specLabelFunction: ["SpecCases.astro", { mode: "label-function" }],
  specTooltipFunction: ["SpecCases.astro", { mode: "tooltip-function" }],
  specFormat: ["SpecCases.astro", { mode: "format" }],
  specDefaultName: ["SpecCases.astro", { mode: "default-name" }],
  specEmpty: ["SpecCases.astro", { mode: "empty" }],
  specDates: ["SpecCases.astro", { mode: "dates" }],
  specOptions: ["SpecCases.astro", { mode: "options" }],
  specPieText: ["SpecCases.astro", { mode: "pie-text" }],
  specTooltipKeys: ["SpecCases.astro", { mode: "tooltip-keys" }],
  specCursorUnsetFirst: ["SpecCases.astro", { mode: "cursor-unset-first" }],
  specCursorFalseFirst: ["SpecCases.astro", { mode: "cursor-false-first" }],
  specCursorNested: ["SpecCases.astro", { mode: "cursor-nested" }],
  specGradient: ["SpecCases.astro", { mode: "gradient" }],
  specLabels: ["SpecCases.astro", { mode: "labels" }],
} as const satisfies Record<string, readonly [string, Record<string, unknown>]>;

export type AstroChartFixtureName = keyof typeof ASTRO_CHART_FIXTURES | "docs";
/** Server HTML, or the error message when the render throws. */
export type AstroChartFixtureResult = { html: string } | { error: string };

export async function renderAstroChartFixtures(): Promise<
  Record<AstroChartFixtureName, AstroChartFixtureResult>
> {
  const astroRequire = createRequire(
    realpathSync(path.join(root, "apps/demo/node_modules/astro/package.json")),
  );
  const { transform } = astroRequire("@astrojs/compiler-rs") as {
    transform(source: string, options: Record<string, unknown>): { code: string };
  };
  const server = await createServer({
    root,
    configFile: false,
    logLevel: "error",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, watch: null, ws: false },
    optimizeDeps: { noDiscovery: true, entries: [] },
    ssr: { noExternal: true },
    esbuild: { loader: "ts", include: /\.(tsx?|astro)$/ },
    plugins: [
      {
        name: "astro-chart-fixtures",
        enforce: "pre",
        transform(source, id) {
          const file = id.split("?")[0]!;
          if (!file.endsWith(".astro")) return;
          const result = transform(source, {
            filename: file,
            internalURL: "astro/compiler-runtime",
            sourcemap: "external",
          });
          return { code: result.code, map: null };
        },
      },
    ],
    resolve: {
      alias: [
        {
          find: /^astro\/compiler-runtime$/,
          replacement: path.join(
            root,
            "scripts/portable-runtime/tests/conformance/emission/astro-compiler-runtime.ts",
          ),
        },
        {
          find: /^@starwind-ui\/runtime\/(.+)$/,
          replacement: path.join(root, "packages/runtime/src/components/$1/index.ts"),
        },
        {
          find: /^@starwind-ui\/astro\/([^/]+)$/,
          replacement: path.join(root, "packages/astro/src/$1/index.ts"),
        },
        {
          find: "tailwind-variants",
          replacement: path.join(root, "apps/demo/node_modules/tailwind-variants/dist/index.js"),
        },
      ],
    },
  });
  try {
    const { experimental_AstroContainer: Container } = (await import(
      /* @vite-ignore */ path.join(root, "apps/demo/node_modules/astro/dist/container/index.js")
    )) as {
      experimental_AstroContainer: {
        create(): Promise<{
          renderToString(component: unknown, options: { props: object }): Promise<string>;
        }>;
      };
    };
    const container = await Container.create();
    const results = {} as Record<AstroChartFixtureName, AstroChartFixtureResult>;
    for (const [name, [file, props]] of Object.entries(ASTRO_CHART_FIXTURES)) {
      const module = (await server.ssrLoadModule(path.join(here, file))) as { default: unknown };
      try {
        results[name as AstroChartFixtureName] = {
          html: await container.renderToString(module.default, { props }),
        };
      } catch (error) {
        results[name as AstroChartFixtureName] = {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
    const docsPath = process.argv[2];
    if (!docsPath) throw new Error("Missing generated Astro docs example");
    const docsModule = (await server.ssrLoadModule(docsPath)) as { default: unknown };
    results.docs = { html: await container.renderToString(docsModule.default, { props: {} }) };
    return results;
  } finally {
    await server.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.stdout.write(JSON.stringify(await renderAstroChartFixtures()));
}
