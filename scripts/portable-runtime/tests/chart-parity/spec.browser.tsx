// Chart spec parts in React, Vue and Svelte. Each framework renders the six docs charts from parts
// on the server, with the same SVG as the reference chart modules, and hydrates them with no
// warning. One live bar chart toggles its legend, opens its tooltip, changes a part prop and
// removes a part, after hydration and after a client-only mount.
import { getChartController } from "@starwind-ui/runtime/chart";
import VueChart from "@starwind-ui/vue/chart";
import { lazy, memo, type ReactNode, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString as renderReact } from "react-dom/server.browser";
import { mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createApp, createSSRApp, defineComponent, h } from "vue";
import { renderToString as renderVue } from "vue/server-renderer";
import {
  ChartBar,
  ChartContainer,
  ChartXAxis,
} from "../../../../apps/react-demo/src/components/starwind-runtime/chart";
import { SPEC_CHARTS, type SpecCase } from "./fixtures/cases";
import type { ParityControls } from "./fixtures/controls";
import SpecReact from "./fixtures/SpecReact";
import SpecSvelte from "./fixtures/SpecSvelte.svelte";
import { specChart } from "./fixtures/spec-charts";
import SpecVue from "./fixtures/spec-vue";
import { cleanup, parseServer, serverHtml, settle, start } from "./harness";

type Framework = "react" | "vue" | "svelte";

const clientMounts: (() => unknown)[] = [];

/** Mounts a case in the browser with no server markup, as a client-only app does. */
async function mountClient(
  framework: Framework,
  mode: SpecCase,
): Promise<{ element: HTMLDivElement; controls: ParityControls; warnings: string[] }> {
  const element = document.createElement("div");
  element.style.width = "600px";
  document.body.append(element);
  const controls: ParityControls = {};
  const warnings: string[] = [];
  const record = (...args: unknown[]) => warnings.push(args.map(String).join(" "));
  const error = vi.spyOn(console, "error").mockImplementation(record);
  const warn = vi.spyOn(console, "warn").mockImplementation(record);
  try {
    if (framework === "react") {
      const root = createRoot(element);
      root.render(<SpecReact mode={mode} controls={controls} />);
      clientMounts.push(() => root.unmount());
    } else if (framework === "vue") {
      const app = createApp({ render: () => h(SpecVue, { mode, controls }) });
      app.config.warnHandler = (message) => record(message);
      app.mount(element);
      clientMounts.push(() => app.unmount());
    } else {
      const instance = mount(SpecSvelte, { target: element, props: { mode, controls } });
      clientMounts.push(() => unmount(instance));
    }
    await settle();
    await settle();
  } finally {
    error.mockRestore();
    warn.mockRestore();
  }
  return { element, controls, warnings };
}

afterEach(async () => {
  for (const destroy of clientMounts.splice(0)) await destroy();
});

const FRAMEWORKS = ["react", "vue", "svelte"] as const;

afterEach(cleanup);

function surfaceSvg(html: string): string {
  const svg = parseServer(html).querySelector("[data-slot=chart-surface] svg.ts-chart");
  if (!svg) throw new Error("The server markup has no chart SVG.");
  return svg.outerHTML;
}

function tooltipContent(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    ".ts-chart-tooltip[role=status] [data-slot=chart-tooltip-content]",
  );
}

const BAR = '[data-ts-key^="bars:"]';
const HOVER_BAND = '[data-ts-key^="category-hover"]';

/** The series keys of the drawn bars, in draw order. */
function barKeys(scope: ParentNode): string[] {
  return [
    ...new Set(
      [...scope.querySelectorAll<SVGElement>(BAR)].map((bar) => bar.dataset.tsKey!.split(":")[3]!),
    ),
  ];
}

describe.each(FRAMEWORKS)("%s chart spec parts", (framework) => {
  it.each(SPEC_CHARTS)("renders the %s chart from parts with the module SVG", async (kind) => {
    const parts = await serverHtml(framework, `spec-${kind}`);
    const module = await serverHtml(framework, `spec-module-${kind}`);
    expect(surfaceSvg(parts)).toBe(surfaceSvg(module));
  });

  it.each(SPEC_CHARTS)("hydrates the %s parts chart without a warning", async (kind) => {
    const mounted = await start(framework, `spec-${kind}`);
    expect(mounted.warnings).toEqual([]);
    // The controller adopts the server SVG, so the element stays the same.
    expect(mounted.serverSvg).not.toBeNull();
    expect(mounted.element.querySelector("svg.ts-chart")).toBe(mounted.serverSvg);
    expect(mounted.element.querySelector("template")).toBeNull();
    expect(mounted.element.querySelectorAll("svg.ts-chart")).toHaveLength(1);
  });

  it("toggles the legend, opens the tooltip, follows a prop change and removes a part", async () => {
    const mounted = await start(framework, "spec-live");
    expect(mounted.warnings).toEqual([]);
    const { element, controls } = mounted;
    const surface = element.querySelector<HTMLElement>("[data-slot=chart-surface]")!;
    expect(barKeys(surface)).toEqual(["desktop", "mobile"]);
    // The function tick formatter draws three-letter months.
    expect(
      [...surface.querySelectorAll("text")].map((text) => text.textContent).slice(0, 2),
    ).toContain("Jan");

    // A parent render draws the chart once for each new inline formatter function, as Recharts
    // does. The Svelte fixture passes stable functions, so its chart stays as it is.
    const controller = getChartController(element.querySelector<HTMLElement>("[data-chart]")!)!;
    const update = vi.spyOn(controller, "update");
    const setOptions = vi.spyOn(controller, "setOptions");
    controls.rerender!();
    await settle();
    expect(element.querySelector("[data-chart]")!.getAttribute("data-renders")).toBe("1");
    expect(update).toHaveBeenCalledTimes(framework === "svelte" ? 0 : 1);
    expect(setOptions).not.toHaveBeenCalled();
    update.mockRestore();
    setOptions.mockRestore();

    // A formatter that reads new state draws the new tick text.
    const ticks = () => [...surface.querySelectorAll("text")].map((text) => text.textContent);
    expect(ticks()).toContain("$100");
    controls.toggleCurrency!();
    await settle();
    expect(ticks()).toContain("€100");
    expect(ticks()).not.toContain("$100");

    // Legend toggle.
    const mobile = element.querySelector<HTMLButtonElement>(
      '[data-slot="chart-legend-item"][data-key="mobile"]',
    )!;
    mobile.click();
    await settle();
    expect(barKeys(surface)).toEqual(["desktop"]);
    mobile.click();
    await settle();
    expect(barKeys(surface)).toEqual(["desktop", "mobile"]);

    // Tooltip with the object formatter. A ChartTooltip without cursor keeps the bar hover band.
    surface.querySelector<SVGElement>("svg[tabindex]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await vi.waitFor(() => expect(tooltipContent()?.textContent).toContain("visits"));
    expect(surface.querySelectorAll(HOVER_BAND).length).toBeGreaterThan(0);

    // A prop change redraws the bars with the new radius.
    const before = surface.querySelector(BAR)!.outerHTML;
    controls.setRadius!(0);
    await settle();
    expect(surface.querySelector(BAR)!.outerHTML).not.toBe(before);

    // Removing a part removes its bars.
    controls.toggleMobile!();
    await settle();
    expect(barKeys(surface)).toEqual(["desktop"]);
    controls.toggleMobile!();
    await settle();
    expect(barKeys(surface)).toEqual(["desktop", "mobile"]);
  });

  it("stacks to 100% with stackOffset and follows the ChartTooltip cursor", async () => {
    // The expanded value axis ends at 1 in the server SVG.
    const ticks = [
      ...parseServer(await serverHtml(framework, "spec-options")).querySelectorAll(
        '[data-ts-key^="y-tick-label:"]',
      ),
    ].map((tick) => tick.textContent);
    expect(Number(ticks.at(-1))).toBe(1);

    const mounted = await start(framework, "spec-options");
    expect(mounted.warnings).toEqual([]);
    const surface = mounted.element.querySelector<HTMLElement>("[data-slot=chart-surface]")!;
    const focus = async () => {
      surface.querySelector<SVGElement>("svg[tabindex]")!.focus();
      await userEvent.keyboard("{ArrowRight}");
      await vi.waitFor(() => expect(tooltipContent()).not.toBeNull());
    };
    await focus();
    expect(surface.querySelectorAll(HOVER_BAND)).toHaveLength(0);
    // The tooltip shows the raw February values, not their share of the stack.
    expect(tooltipContent()!.textContent).toContain("305");
    expect(tooltipContent()!.textContent).toContain("200");
    mounted.controls.toggleCursor!();
    await settle();
    await focus();
    await vi.waitFor(() => expect(surface.querySelectorAll(HOVER_BAND).length).toBeGreaterThan(0));
  });

  it("takes the cursor from the first chart-level ChartTooltip, which supplies the body", async () => {
    const mounted = await start(framework, "spec-cursor-order");
    expect(mounted.warnings).toEqual([]);
    const surface = mounted.element.querySelector<HTMLElement>("[data-slot=chart-surface]")!;
    const bands = async () => {
      await settle();
      surface.querySelector<SVGElement>("svg[tabindex]")!.focus();
      await userEvent.keyboard("{ArrowRight}");
      await vi.waitFor(() => expect(tooltipContent()).not.toBeNull());
      return surface.querySelectorAll(HOVER_BAND).length;
    };
    // An unset first cursor keeps the band, and the second Tooltip's false does not remove it.
    expect(await bands()).toBeGreaterThan(0);
    // A false first cursor removes the band.
    mounted.controls.setCursors!(false, undefined);
    expect(await bands()).toBe(0);
    // After the first Tooltip goes, the second one decides.
    mounted.controls.setCursors!(undefined, false);
    mounted.controls.removeFirst!();
    expect(await bands()).toBe(0);
  });

  it("lists only the drawn slices in the legend and draws two center lines, as shadcn", async () => {
    const legendLabels = (scope: ParentNode) =>
      [...scope.querySelectorAll("[data-slot=chart-legend-item]")].map((item) =>
        item.textContent?.trim(),
      );
    const drawn = ["Chrome", "Safari", "Firefox", "Edge", "Other"];
    // The server legend skips the colorless `visitors` config key.
    const server = parseServer(await serverHtml(framework, "spec-pie-text"));
    expect(legendLabels(server)).toEqual(drawn);
    const lines = [...server.querySelectorAll('[data-ts-key^="visible-total"] text')];
    expect(lines.map((line) => line.getAttribute("y"))).toEqual(["0", "24"]);
    expect(lines[1]!.textContent).toBe("Visitors");
    expect(lines[1]!.getAttribute("fill")).toBe("var(--muted-foreground)");
    // The total sets fontWeight, as shadcn `font-bold`. The caption writes no weight.
    expect(lines.map((line) => line.getAttribute("font-weight"))).toEqual(["700", null]);
    expect(server.querySelector('[data-ts-key^="slices:"]')!.getAttribute("stroke")).toBe("none");
    // Hydration keeps the same legend.
    const mounted = await start(framework, "spec-pie-text");
    expect(mounted.warnings).toEqual([]);
    expect(legendLabels(mounted.element)).toEqual(drawn);
    // Each item keeps the swatch color of its own key.
    const swatches = [...mounted.element.querySelectorAll("[data-slot=chart-legend-item]")].map(
      (item) => item.querySelector<HTMLElement>("[style*=background]")?.style.background,
    );
    expect(swatches).toEqual(drawn.map((label) => `var(--sw-chart-color-${label.toLowerCase()})`));
    // A label without fontWeight keeps today's weight, the contract default of 400.
    const drawnLines = [
      ...mounted.element.querySelectorAll<SVGTextElement>('[data-ts-key^="visible-total"] text'),
    ];
    expect(drawnLines.map((line) => getComputedStyle(line).fontWeight)).toEqual(["700", "400"]);
  });

  it("draws mark labels inside each chart, as shadcn bar-label, line-label-custom and pie-label", async () => {
    const texts = (scope: ParentNode, id: string, prefix: string) =>
      [...scope.querySelectorAll(`[data-chart="${id}"] [data-ts-key^="${prefix}:"]`)].map(
        (text) => text.textContent,
      );
    const server = parseServer(await serverHtml(framework, "spec-labels"));
    expect(texts(server, "spec-labels-bar", "bar-labels")).toEqual([
      "$186",
      "$305",
      "$237",
      "$73",
      "$209",
      "$214",
    ]);
    const names = ["Chrome", "Safari", "Firefox", "Edge", "Other"];
    expect(texts(server, "spec-labels-line", "line-labels")).toEqual(names);
    expect(texts(server, "spec-labels-pie", "slice-labels")).toEqual([
      "275",
      "200",
      "187",
      "173",
      "90",
    ]);

    const mounted = await start(framework, "spec-labels");
    expect(mounted.warnings).toEqual([]);
    const { element, controls } = mounted;
    // Every label lies inside its chart surface.
    for (const surface of element.querySelectorAll<HTMLElement>("[data-slot=chart-surface]")) {
      const box = surface.getBoundingClientRect();
      const labels = surface.querySelectorAll('[data-ts-key*="labels:"]');
      expect(labels.length).toBeGreaterThan(0);
      for (const label of labels) {
        const rect = label.getBoundingClientRect();
        expect(rect.top, label.textContent ?? "").toBeGreaterThanOrEqual(box.top - 1);
        expect(rect.bottom).toBeLessThanOrEqual(box.bottom + 1);
        expect(rect.left, label.textContent ?? "").toBeGreaterThanOrEqual(box.left - 1);
        expect(rect.right, label.textContent ?? "").toBeLessThanOrEqual(box.right + 1);
      }
    }
    expect(element.querySelectorAll('[data-ts-key^="slice-label-lines:"]')).toHaveLength(5);

    // Without a parent render, the chart does not draw again.
    const bar = element.querySelector<HTMLElement>('[data-chart="spec-labels-bar"]')!;
    const update = vi.spyOn(getChartController(bar)!, "update");
    await settle();
    expect(update).not.toHaveBeenCalled();
    update.mockRestore();
    // The labels are decorative: the tooltip lists one row for the one bar series.
    bar.querySelector<SVGElement>("svg[tabindex]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await vi.waitFor(() =>
      expect(tooltipContent()?.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(1),
    );
    // A label formatter that reads new state draws the new text.
    controls.toggleCurrency!();
    await settle();
    expect(texts(element, "spec-labels-bar", "bar-labels")[0]).toBe("€186");
  });

  it("scopes the same gradient id in two charts on one page, as shadcn area-gradient", async () => {
    const check = (scope: ParentNode) => {
      const charts = [...scope.querySelectorAll<HTMLElement>("[data-slot=chart]")];
      expect(charts).toHaveLength(2);
      const ids = charts.map((chart, index) => {
        const key = index === 0 ? "desktop" : "mobile";
        const area = chart.querySelector('[data-ts-key^="areas"][data-ts-key*="segment"]')!;
        const id = /^url\(#(.+)\)$/.exec(area.getAttribute("fill") ?? "")?.[1];
        expect(id).toBeDefined();
        // The fill names a gradient in the same chart, with that chart's color.
        const gradient = [...chart.querySelectorAll("linearGradient")].find(
          (element) => element.id === id,
        )!;
        expect(gradient.getAttribute("y2")).toBe("100%");
        expect(gradient.querySelector("stop")!.getAttribute("stop-color")).toBe(
          `var(--color-${key})`,
        );
        expect(area.getAttribute("fill-opacity")).toBe("0.6");
        return id;
      });
      expect(ids[0]).not.toBe(ids[1]);
    };
    check(parseServer(await serverHtml(framework, "spec-gradient")));
    const mounted = await start(framework, "spec-gradient");
    expect(mounted.warnings).toEqual([]);
    check(mounted.element);
    // The tooltip indicator keeps the config color, not the gradient.
    mounted.element.querySelector<SVGElement>("svg[tabindex]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await vi.waitFor(() =>
      expect(
        tooltipContent()
          ?.querySelector<HTMLElement>("[data-slot=chart-tooltip-indicator]")
          ?.style.getPropertyValue("--sw-chart-indicator-color"),
      ).toBe("var(--sw-chart-color-desktop)"),
    );
  });

  it("draws a label prefix and a gradient stop that the parent edits in place", async () => {
    // The gradient id "fill-nested" holds a hyphen, so its SVG id takes the encoded form.
    const named = (scope: ParentNode) => {
      const chart = scope.querySelector('[data-chart="spec-nested"]')!;
      const id = /^url\(#(.+)\)$/.exec(
        chart.querySelector('[data-ts-key^="bars:"]')!.getAttribute("fill") ?? "",
      )?.[1];
      expect(id).toBe("spec-nested-fill_hnested");
      expect([...chart.querySelectorAll("linearGradient")].map((element) => element.id)).toEqual([
        id,
      ]);
    };
    named(parseServer(await serverHtml(framework, "spec-nested")));
    const mounted = await start(framework, "spec-nested");
    named(mounted.element);
    expect(mounted.warnings).toEqual([]);
    const label = () => mounted.element.querySelector('[data-ts-key^="bar-labels:"]')?.textContent;
    const stop = () =>
      mounted.element.querySelector("linearGradient stop")?.getAttribute("stop-color");
    expect(label()).toBe("$186");
    expect(stop()).toBe("red");
    mounted.controls.editNested!();
    await settle();
    await vi.waitFor(() => expect(label()).toBe("€186"));
    expect(stop()).toBe("blue");
  });

  const legendItems = (scope: ParentNode) => [
    ...scope.querySelectorAll<HTMLElement>("[data-slot=chart-legend-item]"),
  ];
  const legendText = (scope: ParentNode) =>
    legendItems(scope).map((item) => `${item.dataset.key}:${item.textContent?.trim()}`);

  it("keeps each server legend button on its own key when the legend comes first", async () => {
    // The chart has a second legend after its bars.
    const drawn = ["desktop:Desktop", "mobile:Mobile", "desktop:Desktop", "mobile:Mobile"];
    expect(legendText(parseServer(await serverHtml(framework, "spec-legend-first")))).toEqual(
      drawn,
    );
    let serverItems: HTMLElement[] = [];
    const mounted = await start(framework, "spec-legend-first", (element) => {
      serverItems = legendItems(element);
    });
    expect(serverItems).toHaveLength(4);
    await settle();
    expect(mounted.warnings).toEqual([]);
    expect(legendText(mounted.element)).toEqual(drawn);
    // Hydration keeps each server button for the same key.
    expect(legendItems(mounted.element)).toEqual(serverItems);
    // A later registration change reaches the legend.
    mounted.controls.toggleMobile!();
    await settle();
    await vi.waitFor(() =>
      expect(legendText(mounted.element)).toEqual(["desktop:Desktop", "desktop:Desktop"]),
    );
  });

  // A bar inside a React component is not in the React server seed, an accepted limit.
  it.skipIf(framework === "react")(
    "lists a bar inside another component in the server legend",
    async () => {
      const drawn = ["desktop:Desktop", "mobile:Mobile"];
      expect(legendText(parseServer(await serverHtml(framework, "spec-legend-wrapped")))).toEqual(
        drawn,
      );
      const mounted = await start(framework, "spec-legend-wrapped");
      await settle();
      expect(mounted.warnings).toEqual([]);
      expect(legendText(mounted.element)).toEqual(drawn);
    },
  );

  it("passes the polar grid and dot props, with a bare dot as true", async () => {
    const mounted = await start(framework, "spec-radar-grid");
    expect(mounted.warnings).toEqual([]);
    const surface = mounted.element.querySelector<HTMLElement>("[data-slot=chart-surface]")!;
    const rings = surface.querySelectorAll('[data-ts-key^="ring:"]');
    expect(rings).toHaveLength(1);
    expect(rings[0]!.getAttribute("d")).toMatch(/^M0,-90L/);
    expect(rings[0]!.getAttribute("fill-opacity")).toBe("0.2");
    expect(rings[0]!.getAttribute("stroke-width")).toBe("2");
    for (const spoke of surface.querySelectorAll('[data-ts-key^="spoke:"]'))
      expect(spoke.getAttribute("stroke")).toBe("none");
    expect(surface.querySelectorAll('[data-ts-key^="radar-dots:"]')).toHaveLength(6);
    // The activeDot object sets the focused dot radius.
    surface.querySelector<SVGElement>("svg[tabindex]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await vi.waitFor(() =>
      expect(surface.querySelector('[data-ts-key^="active-values:"]')?.getAttribute("r")).toBe("6"),
    );
  });

  it("names tooltip rows and the heading from config keys the rows lack, as shadcn", async () => {
    const mounted = await start(framework, "spec-tooltip-keys");
    expect(mounted.warnings).toEqual([]);
    const surface = mounted.element.querySelector<HTMLElement>("[data-slot=chart-surface]")!;
    surface.querySelector<SVGElement>("svg[tabindex]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await vi.waitFor(() => expect(tooltipContent()).not.toBeNull());
    const content = tooltipContent()!;
    expect(content.querySelector("[data-slot=chart-tooltip-label]")!.textContent).toBe(
      "Activities",
    );
    const items = [...content.querySelectorAll<HTMLElement>("[data-slot=chart-tooltip-item]")];
    expect(items.map((item) => item.dataset.key)).toEqual(["desktop", "mobile"]);
    for (const item of items)
      expect(item.querySelector("[data-slot=chart-tooltip-name]")!.textContent).toBe("Page Views");
  });

  it("draws a live parts chart after a client-only mount", async () => {
    const { element, controls, warnings } = await mountClient(framework, "spec-live");
    expect(warnings).toEqual([]);
    const surface = element.querySelector<HTMLElement>("[data-slot=chart-surface]")!;
    expect(surface.querySelectorAll("svg.ts-chart")).toHaveLength(1);
    // The surface takes its size from the registered parts.
    expect(surface.style.height || surface.style.aspectRatio).not.toBe("");
    expect(barKeys(surface)).toEqual(["desktop", "mobile"]);
    element
      .querySelector<HTMLButtonElement>('[data-slot="chart-legend-item"][data-key="mobile"]')!
      .click();
    await settle();
    expect(barKeys(surface)).toEqual(["desktop"]);
    controls.setRadius!(0);
    await settle();
    expect(barKeys(surface)).toEqual(["desktop"]);
  });

  it("fails during the server render for parts with a chart module", async () => {
    await expect(serverHtml(framework, "spec-combined")).rejects.toThrow(
      "Chart parts cannot be combined with chart or definition.",
    );
  });

  it("draws bars with no ChartXAxis on the server, in hydration and after a client mount", async () => {
    const server = parseServer(await serverHtml(framework, "spec-no-axis"));
    expect(server.querySelectorAll(BAR)).toHaveLength(12);
    const mounted = await start(framework, "spec-no-axis");
    expect(mounted.warnings).toEqual([]);
    expect(mounted.element.querySelector("svg.ts-chart")).toBe(mounted.serverSvg);
    expect(barKeys(mounted.element)).toEqual(["desktop", "mobile"]);
    // The chart draws no x-axis, so no month label shows.
    const labels = [...mounted.element.querySelectorAll("text")].map((text) => text.textContent);
    expect(labels.some((label) => label?.startsWith("Jan"))).toBe(false);
    const client = await mountClient(framework, "spec-no-axis");
    expect(client.warnings).toEqual([]);
    expect(client.element.querySelectorAll(BAR)).toHaveLength(12);
  });

  it("renders nothing without parts and warns once", async () => {
    const mounted = await start(framework, "spec-empty");
    expect(mounted.element.querySelector("svg.ts-chart")).toBeNull();
    expect(mounted.warnings).toEqual([
      expect.stringContaining(`"spec-empty-${framework}" renders nothing`),
    ]);
  });
});

it("keeps the Svelte client markup of a module chart equal to the server markup", async () => {
  // The Surface ignores a changed server SVG during hydration. A module chart draws the same SVG in
  // the browser, so the ignore only covers parts charts.
  const server = surfaceSvg(await serverHtml("svelte", "spec-module-bar"));
  const element = document.createElement("div");
  document.body.append(element);
  const instance = mount(SpecSvelte, { target: element, props: { mode: "spec-module-bar" } });
  clientMounts.push(() => unmount(instance));
  expect(element.querySelector("[data-slot=chart-surface] svg.ts-chart")!.outerHTML).toBe(server);
});

describe("React chart spec parts", () => {
  /** Mounts a React element in the browser and records console warnings and errors. */
  async function mountReact(node: ReactNode) {
    const element = document.createElement("div");
    element.style.width = "600px";
    document.body.append(element);
    const warnings: string[] = [];
    const record = (...args: unknown[]) => warnings.push(args.map(String).join(" "));
    vi.spyOn(console, "error").mockImplementation(record);
    vi.spyOn(console, "warn").mockImplementation(record);
    const root = createRoot(element);
    root.render(node);
    clientMounts.push(() => root.unmount());
    await settle();
    await settle();
    return { element, warnings };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("switches between chart parts and a chart module in one render", async () => {
    const { module, data, config } = specChart("bar");
    const controls: { toggle?: () => void } = {};
    function Switching() {
      const [parts, setParts] = useState(true);
      controls.toggle = () => setParts((value) => !value);
      return parts ? (
        <ChartContainer id="spec-switch" data={data} config={config}>
          <ChartXAxis dataKey="month" />
          <ChartBar dataKey="desktop" />
        </ChartContainer>
      ) : (
        <ChartContainer id="spec-switch" chart={module} data={data} config={config} />
      );
    }
    const { element, warnings } = await mountReact(<Switching />);
    const root = () => element.querySelector<HTMLElement>("[data-chart]")!;
    expect(root().querySelectorAll(BAR)).toHaveLength(6);

    controls.toggle!();
    await settle();
    expect(getChartController(root())?.getInput().spec).toBeUndefined();
    expect(getChartController(root())?.getOptions().ariaLabel).toBe(module.ariaLabel);
    expect(root().querySelectorAll("svg.ts-chart")).toHaveLength(1);

    controls.toggle!();
    await settle();
    expect(getChartController(root())?.getInput().spec).toBeDefined();
    expect(root().querySelectorAll(BAR)).toHaveLength(6);
    expect(warnings).toEqual([]);
  });

  it("draws a bar from a wrapper component after mount, with an empty server surface", async () => {
    const { data, config } = specChart("bar");
    function DesktopBar() {
      return <ChartBar dataKey="desktop" />;
    }
    const chart = (
      <ChartContainer id="spec-wrapper" data={data} config={config}>
        <ChartXAxis dataKey="month" />
        <DesktopBar />
      </ChartContainer>
    );
    // The server scan finds only the axis, so the server surface stays empty.
    const server = parseServer(renderReact(chart));
    expect(server.querySelector("[data-slot=chart-surface]")).not.toBeNull();
    expect(server.querySelector("svg.ts-chart")).toBeNull();
    const { element, warnings } = await mountReact(chart);
    expect(element.querySelectorAll(BAR)).toHaveLength(6);
    expect(warnings).toEqual([]);
  });
});

describe("React chart spec parts in hydration", () => {
  it("draws a wrapped bar next to the server bars after hydration", async () => {
    const { data, config } = specChart("bar");
    function MobileBar() {
      return <ChartBar dataKey="mobile" />;
    }
    const chart = (
      <ChartContainer id="spec-partial" data={data} config={config}>
        <ChartXAxis dataKey="month" />
        <ChartBar dataKey="desktop" />
        <MobileBar />
      </ChartContainer>
    );
    // The server scan finds the axis and the desktop bar, so the server SVG draws desktop only.
    const html = renderReact(chart);
    expect(barKeys(parseServer(html))).toEqual(["desktop"]);
    const element = document.createElement("div");
    element.style.width = "600px";
    element.innerHTML = html;
    document.body.append(element);
    const warnings: string[] = [];
    const record = (...args: unknown[]) => warnings.push(args.map(String).join(" "));
    vi.spyOn(console, "error").mockImplementation(record);
    vi.spyOn(console, "warn").mockImplementation(record);
    const root = hydrateRoot(element, chart);
    clientMounts.push(() => root.unmount());
    await settle();
    await settle();
    vi.restoreAllMocks();
    expect(warnings).toEqual([]);
    expect(barKeys(element)).toEqual(["desktop", "mobile"]);
  });
});

describe("React chart spec part types", () => {
  it("finds lazy and memo parts in the server scan", async () => {
    const { data, config } = specChart("bar");
    // A Server Component gets client components as lazy references. This one has loaded.
    const LazyBar = lazy(() => Promise.resolve({ default: ChartBar }));
    const lazyType = LazyBar as unknown as { _init(payload: unknown): unknown; _payload: unknown };
    try {
      lazyType._init(lazyType._payload);
    } catch (pending) {
      await pending;
    }
    const MemoBar = memo(ChartBar);
    const html = renderReact(
      <ChartContainer id="spec-wrapped-types" data={data} config={config}>
        <ChartXAxis dataKey="month" />
        <LazyBar dataKey="desktop" />
        <MemoBar dataKey="mobile" />
      </ChartContainer>,
    );
    const surface = parseServer(html).querySelector("[data-slot=chart-surface]")!;
    expect(barKeys(surface)).toEqual(["desktop", "mobile"]);
  });
});

describe("Vue chart spec parts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("draws an axis before the Surface and a bar after it, on the server and in hydration", async () => {
    const { data, config } = specChart("bar");
    const Split = defineComponent({
      setup: () => () =>
        h(VueChart.Root, { id: "spec-split", data, config }, () => [
          h(VueChart.XAxis, { dataKey: "month" }),
          h(VueChart.Surface),
          h(VueChart.Bar, { dataKey: "desktop" }),
        ]),
    });
    // The server render waits for the bar after the Surface, so the server SVG draws it.
    const html = await renderVue(createSSRApp({ render: () => h(Split) }));
    expect(parseServer(html).querySelectorAll(BAR)).toHaveLength(6);

    const element = document.createElement("div");
    element.style.width = "600px";
    element.innerHTML = html;
    document.body.append(element);
    const serverSvg = element.querySelector("svg.ts-chart");
    const warnings: string[] = [];
    const record = (...args: unknown[]) => warnings.push(args.map(String).join(" "));
    vi.spyOn(console, "error").mockImplementation(record);
    vi.spyOn(console, "warn").mockImplementation(record);
    const app = createSSRApp({ render: () => h(Split) });
    app.config.warnHandler = (message) => record(message);
    app.mount(element);
    clientMounts.push(() => app.unmount());
    await settle();
    await settle();
    expect(warnings).toEqual([]);
    expect(element.querySelector("svg.ts-chart")).toBe(serverSvg);
    expect(element.querySelectorAll(BAR)).toHaveLength(6);
  });
});
