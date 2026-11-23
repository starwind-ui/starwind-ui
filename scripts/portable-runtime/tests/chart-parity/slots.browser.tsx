// One data-slot and attribute set across frameworks (SPEC-AC-04, SPEC-AC-05). Every case renders
// in all four frameworks. The suite compares the server markup, the markup after start, the open
// tooltip and the markup after a legend toggle with React's.
import * as ReactPrimitive from "@starwind-ui/react/chart";
import * as SveltePrimitive from "@starwind-ui/svelte/chart";
import * as VuePrimitive from "@starwind-ui/vue/chart";
import { describe, expect, it, vi } from "vitest";

import * as ReactStyled from "../../../../apps/react-demo/src/components/starwind-runtime/chart";
import * as SvelteStyled from "../../../../apps/svelte-demo/src/lib/starwind-runtime/chart";
import * as VueStyled from "../../../../apps/vue-demo/src/components/starwind-runtime/chart";
import { EXTRA_CASES, PARITY_MODES, type ParityCase } from "./fixtures/cases";
import {
  astroExports,
  astroStyledExports,
  cleanup,
  FRAMEWORKS,
  type Framework,
  legends,
  parseServer,
  press,
  serverHtml,
  settle,
  slotShape,
  start,
  status,
} from "./harness";

type Shape = ReturnType<typeof slotShape>;
type Phase = "server" | "started" | "tooltip" | "toggled" | "toggledTooltip";

interface Difference {
  mode: ParityCase;
  framework: Framework;
  phase: Phase;
  slot: string;
  attribute: string;
  react: string | undefined;
  other: string | undefined;
}

/**
 * Differences the suite expects until a product fix lands. Each entry names the owner ticket and
 * the exact places it occurs, so a full or partial fix fails the last test until the entry changes.
 */
const KNOWN_MISMATCHES = [
  {
    id: "astro-legend-aria-label",
    occurrences: [
      "custom:started:chart-legend-item",
      "custom:toggled:chart-legend-item",
      "default:started:chart-legend-item",
      "default:toggled:chart-legend-item",
      "formatter:started:chart-legend-item",
      "formatter:toggled:chart-legend-item",
      "ids:started:chart-legend-item",
      "indicator:started:chart-legend-item",
      "indicator:toggled:chart-legend-item",
      "legends:started:chart-legend-item",
      "legends:toggled:chart-legend-item",
      "model:started:chart-legend-item",
      "native-format:started:chart-legend-item",
      "native-format:toggled:chart-legend-item",
      "native:started:chart-legend-item",
      "native:toggled:chart-legend-item",
      "one-way:started:chart-legend-item",
      "parts-nested:started:chart-legend-item",
      "parts-nested:toggled:chart-legend-item",
      "parts:started:chart-legend-item",
      "parts:toggled:chart-legend-item",
      "preset:started:chart-legend-item",
      "preset:toggled:chart-legend-item",
    ],
    owner:
      "Runtime syncLegends (packages/runtime/src/components/chart/controller.ts), ticket 01/05",
    reason:
      "After start, Astro gives a plain-label legend item aria-label equal to its text. React, Vue and Svelte set aria-label only for a rich label.",
    test: (d: Difference) =>
      d.framework === "astro" &&
      d.slot === "chart-legend-item" &&
      d.attribute === "aria-label" &&
      d.react === undefined &&
      d.other === "Mobile",
  },
] as const;

/** Each known mismatch's occurrences as `mode:phase:slot`. */
const observed = new Map<string, Set<string>>();

/** Attributes the spec names as framework-specific, which the comparison leaves out. */
function ignored(framework: Framework, phase: Phase, slot: string, name: string): boolean {
  // data-sw-* attributes are Runtime discovery hooks. React roots omit data-sw-chart, because the
  // lifecycle never starts React roots (ticket 03).
  if (name.startsWith("data-sw-")) return true;
  // Astro names the browser module that starts its chart (SPEC-AC-14).
  if (name === "data-chart-module") return true;
  // Astro server markup carries the lifecycle state ("pending" or "static"). Every framework
  // shows "active" after start, which the comparison checks.
  return framework === "astro" && phase === "server" && slot === "chart" && name === "data-state";
}

/** Browsers serialize the same inline style with different spacing and a final semicolon. */
function normalizeStyle(value: string): string {
  return value
    .split(";")
    .map((rule) => rule.trim().replace(/\s*:\s*/, ":"))
    .filter(Boolean)
    .join(";");
}

/** Chart ids in document order. */
function chartIds(scope: ParentNode): string[] {
  return [...scope.querySelectorAll<HTMLElement>('[data-slot="chart"]')].map(
    (root) => root.dataset.chart!,
  );
}

/** Generated ids differ per framework (SPEC-AC-06), so they are numbered in document order. */
function normalize(shape: Shape, framework: Framework, phase: Phase, ids: readonly string[]) {
  const replaceIds = (value: string) =>
    ids.reduce((text, id, index) => text.replaceAll(id, `chart-${index + 1}`), value);
  return shape.map((node) => {
    const slot = node.attributes["data-slot"]!;
    const attributes: Record<string, string> = {};
    for (const [name, value] of Object.entries(node.attributes)) {
      if (ignored(framework, phase, slot, name)) continue;
      attributes[name] = replaceIds(name === "style" ? normalizeStyle(value) : value);
    }
    return { tag: node.tag, attributes, text: node.text && replaceIds(node.text) };
  });
}

function differences(
  mode: ParityCase,
  framework: Framework,
  phase: Phase,
  react: Shape,
  other: Shape,
): Difference[] {
  const base = { mode, framework, phase };
  const slots = (shape: Shape) => shape.map((node) => node.attributes["data-slot"]).join(",");
  if (react.length !== other.length)
    return [{ ...base, slot: "*", attribute: "slots", react: slots(react), other: slots(other) }];
  const result: Difference[] = [];
  react.forEach((a, index) => {
    const b = other[index]!;
    const slot = a.attributes["data-slot"]!;
    if (a.tag !== b.tag)
      result.push({ ...base, slot, attribute: "tag", react: a.tag, other: b.tag });
    if (a.text !== b.text)
      result.push({ ...base, slot, attribute: "text", react: a.text, other: b.text });
    for (const name of new Set([...Object.keys(a.attributes), ...Object.keys(b.attributes)]))
      if (a.attributes[name] !== b.attributes[name])
        result.push({
          ...base,
          slot,
          attribute: name,
          react: a.attributes[name],
          other: b.attributes[name],
        });
  });
  return result;
}

/** Cases whose legend has no toggle, or whose toggle a parent model decides. */
const NO_TOGGLE = new Set<ParityCase>([
  "off",
  "definition",
  "model",
  "one-way",
  "plain-body",
  "mixed-body",
  "nested-tooltip",
  "order",
  "ids",
  "live-body",
  "precedence",
  "off-child",
  "options",
  "keys",
]);

/** Cases whose chart shows no tooltip. */
const NO_TOOLTIP = new Set<ParityCase>(["off", "off-child"]);

/**
 * The open tooltip: the status element's accessible label (SPEC-AC-13) as a first record, then
 * every data-slot part inside it.
 */
function statusShape(): Shape {
  const tooltip = status()!;
  return [
    {
      tag: "status",
      attributes: { "data-slot": "status", "aria-label": tooltip.getAttribute("aria-label") ?? "" },
      text: undefined,
    },
    ...slotShape(tooltip),
  ];
}

async function collect(framework: Framework, mode: ParityCase) {
  const shapes = {} as Record<Phase, Shape>;
  const server = parseServer(await serverHtml(framework, mode));
  shapes.server = normalize(slotShape(server), framework, "server", chartIds(server));
  const { element, warnings } = await start(framework, mode);
  expect(warnings).toEqual([]);
  const ids = chartIds(element);
  shapes.started = normalize(slotShape(element), framework, "started", ids);
  if (!NO_TOOLTIP.has(mode)) {
    await press(element, "Home");
    await vi.waitFor(() => expect(status()?.textContent?.trim()).toBeTruthy());
    await settle();
    shapes.tooltip = normalize(statusShape(), framework, "tooltip", ids);
  } else {
    shapes.tooltip = [];
  }
  if (!NO_TOGGLE.has(mode)) {
    legends(element)[0]!
      .querySelector<HTMLElement>('[data-slot="chart-legend-item"][data-key="mobile"]')!
      .click();
    await settle();
    shapes.toggled = normalize(slotShape(element), framework, "toggled", ids);
    // The open tooltip after the toggle: one row, so line and dashed bodies nest the heading.
    await press(element, "Home");
    await vi.waitFor(() => expect(status()?.textContent).toMatch(/^(?!.*Mobile).*186/s));
    await settle();
    shapes.toggledTooltip = normalize(statusShape(), framework, "toggledTooltip", ids);
  } else {
    shapes.toggled = [];
    shapes.toggledTooltip = [];
  }
  await cleanup();
  return shapes;
}

/**
 * After start, only the root lifecycle state and the surface position may change in each
 * framework. TanStack's renderer sets `position: relative` on the host when it mounts.
 */
function startChanges(mode: ParityCase, framework: Framework, server: Shape, started: Shape) {
  const withoutStart = (shape: Shape) =>
    shape.map((node) => {
      const slot = node.attributes["data-slot"];
      if (slot === "chart") {
        const { "data-state": _state, ...attributes } = node.attributes;
        return { ...node, attributes };
      }
      if (slot === "chart-surface") {
        const { style: _style, ...attributes } = node.attributes;
        return { ...node, attributes };
      }
      return node;
    });
  return differences(mode, framework, "started", withoutStart(server), withoutStart(started));
}

describe("one data-slot and attribute set across frameworks", () => {
  for (const mode of [...PARITY_MODES, ...EXTRA_CASES]) {
    it(`${mode}`, async () => {
      const shapes = {} as Record<Framework, Record<Phase, Shape>>;
      for (const framework of FRAMEWORKS) shapes[framework] = await collect(framework, mode);

      const found: Difference[] = [];
      for (const framework of FRAMEWORKS) {
        for (const phase of [
          "server",
          "started",
          "tooltip",
          "toggled",
          "toggledTooltip",
        ] as const) {
          if (framework !== "react")
            found.push(
              ...differences(mode, framework, phase, shapes.react[phase], shapes[framework][phase]),
            );
        }
        found.push(
          ...startChanges(mode, framework, shapes[framework].server, shapes[framework].started),
        );
        expect(
          shapes[framework].started.find((node) => node.attributes["data-slot"] === "chart")
            ?.attributes["data-state"],
        ).toBe("active");
      }
      const unknown = found.filter((difference) => {
        const known = KNOWN_MISMATCHES.find((entry) => entry.test(difference));
        if (known) {
          const occurrences = observed.get(known.id) ?? new Set<string>();
          occurrences.add(`${difference.mode}:${difference.phase}:${difference.slot}`);
          observed.set(known.id, occurrences);
        }
        return !known;
      });
      expect(unknown).toEqual([]);
    });
  }

  // Every known mismatch must occur in exactly its recorded cases, phases and slots. A partial
  // fix fails here, and the fix then removes its occurrences.
  it("observes every known mismatch in exactly its recorded places", () => {
    expect(
      Object.fromEntries([...observed].map(([id, places]) => [id, [...places].sort()])),
    ).toEqual(
      Object.fromEntries(
        KNOWN_MISMATCHES.map((entry) => [entry.id, [...entry.occurrences].sort()]),
      ),
    );
  });
});

const PARTS = [
  "Root",
  "Style",
  "Surface",
  "Tooltip",
  "TooltipContent",
  "TooltipLabel",
  "TooltipItems",
  "TooltipItem",
  "TooltipIndicator",
  "TooltipIcon",
  "TooltipName",
  "TooltipValue",
  "Legend",
  "LegendItems",
  "LegendItem",
  "LegendSwatch",
  "LegendIcon",
  "LegendLabel",
];
const PART_EXPORTS = ["Chart", "ChartPrimitive", "default", ...PARTS.map((part) => `Chart${part}`)];

function extraExports(names: readonly string[], parts: readonly string[]): string[] {
  return names.filter((name) => !parts.includes(name)).sort();
}

describe("chart exports across frameworks", () => {
  const primitive = {
    astro: astroExports,
    react: Object.keys(ReactPrimitive),
    vue: Object.keys(VuePrimitive),
    svelte: Object.keys(SveltePrimitive),
  };

  it("exports the same Primitive parts and namespace in every framework", () => {
    for (const module of [ReactPrimitive, VuePrimitive, SveltePrimitive]) {
      expect(Object.keys(module.ChartPrimitive)).toEqual(PARTS);
      expect(module.default).toBe(module.ChartPrimitive);
      expect(module.Chart).toBe(module.ChartPrimitive);
    }
    for (const names of Object.values(primitive))
      expect(names.filter((name) => PART_EXPORTS.includes(name)).sort()).toEqual(
        [...PART_EXPORTS].sort(),
      );
  });

  it("declares update:visible and the detailed visibleChange event on the Vue Root", () => {
    // v-model:visible is the Vue visibility model (SPEC-AC-11). The Runtime callback becomes the
    // detailed visibleChange emit (ADR 0011).
    const root = VuePrimitive.ChartRoot as unknown as { emits: Record<string, unknown> };
    expect(Object.keys(root.emits)).toEqual(["update:visible", "visibleChange"]);
  });

  it("keeps framework-only Primitive helpers to the spec's rules", () => {
    const shared = ["defineChartModule", "isChartIcon", "tooltipView"];
    // React, Vue and Svelte read the chart context with hooks in each framework's form: React
    // returns the body or null, Vue a ComputedRef or null, and Svelte `{ body }` or null.
    for (const framework of ["react", "vue", "svelte"] as const)
      expect(extraExports(primitive[framework], PART_EXPORTS)).toEqual(
        [...shared, "useChartRoot", "useChartTooltipBody"].sort(),
      );
    // Astro has no client component tree. It adds the Raw HTML helpers that a page script needs
    // (SPEC: Styled index re-exports, Astro also createChart, getChartController,
    // registerChartModules, chartStyle and serializeInput), and the rich label and icon slot
    // collector that the Root and a wrapper share.
    expect(extraExports(primitive.astro, PART_EXPORTS)).toEqual(
      [
        ...shared,
        "chartStyle",
        "collectChartViews",
        "createChart",
        "getChartController",
        "registerChartModules",
        "serializeInput",
      ].sort(),
    );
  });

  it("exports the same Styled parts and helpers, with the Astro page helpers", () => {
    const styled = ["ChartContainer", "ChartLegend", "ChartLegendContent", "ChartTooltip"];
    const common = [
      ...styled,
      "ChartTooltipContent",
      "ChartVariants",
      "default",
      "defineChartModule",
      "isChartIcon",
    ].sort();
    for (const module of [ReactStyled, VueStyled, SvelteStyled]) {
      expect(Object.keys(module).sort()).toEqual(common);
      expect(Object.keys(module.default)).toEqual([
        "Container",
        "Tooltip",
        "TooltipContent",
        "Legend",
        "LegendContent",
      ]);
      expect(Object.keys(module.ChartVariants).sort()).toEqual(
        Object.keys(ReactStyled.ChartVariants).sort(),
      );
    }
    expect(astroStyledExports).toEqual(
      [
        ...common,
        "chartStyle",
        "createChart",
        "getChartController",
        "registerChartModules",
        "serializeInput",
      ].sort(),
    );
  });
});
