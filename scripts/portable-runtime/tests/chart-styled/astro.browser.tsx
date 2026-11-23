// Browser behavior of the generated Astro chart Primitive and Styled parts. The global setup renders
// the Astro fixtures on the server; each test adopts that HTML as the lifecycle script would.
import { createChart, getChartController, startCharts } from "@starwind-ui/runtime/chart";
import { afterEach, describe, expect, inject, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { chartAttributes } from "../../../../packages/astro/src/chart/ChartMarkup";
import { visitorDefinition } from "./astro/fixture-modules";
import type { AstroChartFixtureResult } from "./astro/render-fixtures";

const fixtures = (await (await fetch(inject("astroChartFixturesUrl"))).json()) as Record<
  string,
  AstroChartFixtureResult
>;

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function html(name: string): string {
  const result = fixtures[name];
  if (!result) throw new Error(`Missing Astro chart fixture "${name}".`);
  if ("error" in result) throw new Error(`Astro chart fixture "${name}" failed: ${result.error}`);
  return result.html;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

/** Puts server HTML on the page. Inline scripts do not run, so tests start charts themselves. */
function mount(name: string): HTMLDivElement {
  const element = document.createElement("div");
  element.style.width = "600px";
  element.innerHTML = html(name);
  document.body.append(element);
  return element;
}

/** Starts the charts as the Astro lifecycle script does. The fixture module is registered. */
async function start(name: string): Promise<HTMLDivElement> {
  const element = mount(name);
  startCharts();
  await nextFrame();
  return element;
}

function chartRoot(element: ParentNode): HTMLElement {
  return element.querySelector<HTMLElement>('[data-slot="chart"]')!;
}

function barCount(element: ParentNode): number {
  return element.querySelectorAll('rect[data-ts-key^="visitors:"]').length;
}

function status(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".ts-chart-tooltip[role=status]");
}

function legendButton(element: ParentNode, key: string): HTMLElement {
  return element.querySelector<HTMLElement>(`[data-slot="chart-legend-item"][data-key="${key}"]`)!;
}

async function focusFirstPoint(element: ParentNode): Promise<void> {
  element.querySelector<SVGElement>("svg[tabindex]")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await vi.waitFor(() => expect(status()).not.toBeNull());
}

function legendShape(element: ParentNode) {
  return [...element.querySelectorAll<HTMLElement>('[data-slot="chart-legend-item"]')].map(
    (item) => ({
      tag: item.tagName,
      key: item.dataset.key,
      className: item.className,
      parts: [...item.querySelectorAll<HTMLElement>("[data-slot]")].map((part) => [
        part.dataset.slot,
        part.className,
      ]),
      text: item.textContent?.trim(),
    }),
  );
}

describe("Astro chart Primitive", () => {
  it("starts the authored docs example when its client module registers", async () => {
    const element = mount("docs");
    const root = chartRoot(element);
    expect(root.dataset.state).toBe("pending");
    startCharts();
    await nextFrame();
    expect(root.dataset.state).toBe("pending");

    await import(/* @vite-ignore */ inject("astroDocsChartModuleUrl"));
    await vi.waitFor(() => expect(root.dataset.state).toBe("active"));
    expect(getChartController(root)?.getScene()?.points.length).toBeGreaterThan(0);
  });

  it("adopts the server SVG without a second SVG", async () => {
    const element = mount("primitive");
    const serverSvg = element.querySelector("svg");
    expect(chartRoot(element).dataset.state).toBe("pending");

    startCharts();
    await nextFrame();

    expect(element.querySelectorAll("svg")).toHaveLength(1);
    expect(element.querySelector("svg")).toBe(serverSvg);
    expect(chartRoot(element).dataset.state).toBe("active");
    expect(getChartController(chartRoot(element))?.getScene()?.points).toHaveLength(6);
  });

  it("renders the chart, payload and lifecycle script only for an interactive chart", () => {
    const interactive = new DOMParser().parseFromString(html("primitive"), "text/html");
    const root = chartRoot(interactive);
    expect(root.dataset.chart).toBe("visitors");
    expect(root.dataset.chartModule).toBe("astro-visitors");
    expect(root.hasAttribute("data-sw-chart")).toBe(true);
    expect(interactive.querySelectorAll("script[data-sw-chart-input]")).toHaveLength(1);
    expect(
      interactive.querySelectorAll('script[type="module"][src*="ChartLifecycle.astro"]'),
    ).toHaveLength(1);
    expect(interactive.querySelector("[data-slot=chart-style]")?.textContent).toContain(
      '[data-chart="visitors"]{--sw-chart-color-desktop:rgb(37, 99, 235)',
    );
    expect(
      interactive.querySelector<HTMLElement>("[data-slot=chart-surface]")?.getAttribute("style"),
    ).toBe("height:340px");

    const fixed = new DOMParser().parseFromString(html("static"), "text/html");
    const staticRoot = chartRoot(fixed);
    expect(staticRoot.hasAttribute("data-sw-chart")).toBe(false);
    expect(staticRoot.dataset.state).toBe("static");
    expect(fixed.querySelectorAll("script")).toHaveLength(0);
    expect(fixed.querySelectorAll("template[data-sw-chart-legend-template]")).toHaveLength(0);
    expect(fixed.querySelectorAll("svg.ts-chart")).toHaveLength(1);
    expect(
      [...fixed.querySelectorAll('[data-slot="chart-legend-item"]')].map((item) => item.tagName),
    ).toEqual(["SPAN", "SPAN"]);
  });

  it("keeps a static chart static in the browser", async () => {
    const element = await start("static");
    expect(chartRoot(element).dataset.state).toBe("static");
    expect(getChartController(chartRoot(element))).toBeUndefined();
  });

  it("generates a valid, unique id for each chart without id", async () => {
    const element = await start("ids");
    const roots = [...element.querySelectorAll<HTMLElement>('[data-slot="chart"]')];
    const ids = roots.map((root) => root.dataset.chart);

    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(id).toMatch(/^chart-[a-zA-Z0-9_-]+$/);
    for (const root of roots) {
      expect(root.querySelector("[data-slot=chart-style]")?.textContent).toContain(
        `[data-chart="${root.dataset.chart}"]`,
      );
      expect(getChartController(root)?.root).toBe(root);
    }
  });

  it("toggles series from legend buttons and dispatches the visible-change event", async () => {
    const element = await start("primitive");
    const events: string[][] = [];
    chartRoot(element).addEventListener("starwind-chart:visible-change", (event) =>
      events.push((event as CustomEvent<{ visible: string[] }>).detail.visible),
    );

    legendButton(element, "desktop").click();
    await nextFrame();

    expect(events).toEqual([["mobile"]]);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("false");
    expect(legendButton(element, "desktop").dataset.state).toBe("off");
    expect(barCount(element)).toBe(3);
  });

  it("cancels the toggle from a click listener or the cancelable event", async () => {
    const element = await start("primitive");
    legendButton(element, "desktop").addEventListener("click", (event) => event.preventDefault());
    legendButton(element, "desktop").click();
    await nextFrame();
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("true");
    expect(barCount(element)).toBe(6);

    chartRoot(element).addEventListener("starwind-chart:visible-change", (event) =>
      event.preventDefault(),
    );
    legendButton(element, "mobile").click();
    await nextFrame();
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("true");
    expect(barCount(element)).toBe(6);
  });

  it("starts with the visible prop and follows controller updates", async () => {
    const element = await start("visible");
    expect(barCount(element)).toBe(3);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("false");
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("true");

    getChartController(chartRoot(element))!.update({ visible: ["desktop", "mobile"] });
    await nextFrame();
    expect(barCount(element)).toBe(6);
    expect(legendButton(element, "desktop").getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps the server legend markup when the controller starts", async () => {
    const element = mount("plain");
    const before = legendShape(element);
    startCharts();
    await nextFrame();
    expect(legendShape(element)).toEqual(before);
  });

  it("shows the registered tooltip from the keyboard and syncs the accessible label", async () => {
    const element = await start("visible");
    await focusFirstPoint(element);

    const tooltip = status()!;
    await vi.waitFor(() =>
      expect(tooltip.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
    );
    const content = tooltip.querySelector<HTMLElement>("[data-slot=chart-tooltip-content]")!;
    expect(content.className).toBe("content");
    expect(content.dataset.chart).toBe("visible");
    expect(content.dataset.indicator).toBe("line");
    expect(content.dataset.nested).toBe("true");
    const rows = content.querySelectorAll<HTMLElement>("[data-slot=chart-tooltip-item]");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.className).toBe("row");
    expect(rows[0]!.dataset.key).toBe("mobile");
    expect(rows[0]!.getAttribute("aria-hidden")).toBe("true");
    const name = content.querySelector("[data-slot=chart-tooltip-name]")!;
    const heading = name.querySelector("[data-slot=chart-tooltip-label]")!;
    expect(heading.className).toBe("label");
    expect(["January", "February", "March"]).toContain(heading.textContent);
    expect(name.querySelector("strong")?.textContent).toBe("Mobile");
    const value = content.querySelector("[data-slot=chart-tooltip-value]")!.textContent;
    await vi.waitFor(() =>
      expect(tooltip.getAttribute("aria-label")).toBe(
        `${heading.textContent} Mobile ${value}\n${heading.textContent}\nMobile: ${value}`,
      ),
    );
  });

  it("gives the nested heading the TooltipName labelClass", async () => {
    const element = await start("labelClass");
    await focusFirstPoint(element);

    await vi.waitFor(() =>
      expect(status()!.querySelector("[data-slot=chart-tooltip-name]")).not.toBeNull(),
    );
    const name = status()!.querySelector<HTMLElement>("[data-slot=chart-tooltip-name]")!;
    expect(name.querySelector("[data-slot=chart-tooltip-label]")!.className).toBe("name-label");
    expect(name.hasAttribute("data-sw-chart-label-class")).toBe(false);
    // The server markup carries the class only inside the tooltip template.
    expect(element.querySelector("template[data-sw-chart-tooltip]")!.innerHTML).toContain(
      'data-sw-chart-label-class="name-label"',
    );
  });

  it("shows a config-key heading from config text when the config label is empty", async () => {
    const element = await start("emptyLabelText");
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
    );
    const heading = status()!.querySelector<HTMLElement>(
      ".content > [data-slot=chart-tooltip-label]",
    );
    expect(heading?.textContent).toBe("Revenue");
  });

  it("shows a config-key heading from its label slot when the wire text is empty", async () => {
    const element = await start("emptyLabelSlot");
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
    );
    const heading = status()!.querySelector<HTMLElement>(
      ".content > [data-slot=chart-tooltip-label]",
    );
    expect(heading?.querySelector("[data-rich-heading]")?.textContent?.trim()).toBe("Rich");
  });

  it("uses the first Tooltip in source order and removes the others", async () => {
    const element = await start("order");
    expect(element.querySelectorAll("template[data-sw-chart-tooltip]")).toHaveLength(1);
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector("[data-slot=chart-tooltip-content]")?.className).toBe("first"),
    );
    expect(document.querySelector(".second")).toBeNull();
  });

  it("renders portable icons and rich labels in the tooltip and legend", async () => {
    const element = await start("icons");
    const desktop = legendButton(element, "desktop");
    expect(
      desktop.querySelector('[data-slot="chart-legend-icon"] svg path')?.getAttribute("d"),
    ).toBe("M4 4h16v16H4z");
    expect(desktop.querySelector('[data-slot="chart-legend-swatch"]')).toBeNull();
    const mobile = legendButton(element, "mobile");
    expect(mobile.querySelector('[data-slot="chart-legend-swatch"]')).not.toBeNull();
    expect(mobile.getAttribute("aria-label")).toBe("Mobile");
    expect(mobile.querySelector("strong")?.textContent).toBe("Mobile");

    await focusFirstPoint(element);
    const tooltip = status()!;
    await vi.waitFor(() =>
      expect(tooltip.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(2),
    );
    const icon = tooltip.querySelector<HTMLElement>(
      '[data-key="desktop"] [data-slot="chart-tooltip-icon"]',
    );
    expect(icon?.className).toBe("icon");
    expect(icon?.querySelector("svg")).not.toBeNull();
    expect(
      tooltip.querySelector('[data-key="desktop"] [data-slot="chart-tooltip-indicator"]'),
    ).toBeNull();
    expect(tooltip.querySelector('[data-key="mobile"] strong')?.textContent).toBe("Mobile");
  });

  it("renders a native definition with a passive legend", async () => {
    const element = mount("definition");
    const root = chartRoot(element);
    expect(root.hasAttribute("data-sw-chart")).toBe(false);
    expect(element.querySelector('script[type="module"]')).toBeNull();
    const items = element.querySelectorAll<HTMLElement>('[data-slot="chart-legend-item"]');
    expect([...items].map((item) => item.tagName)).toEqual(["SPAN", "SPAN", "SPAN"]);

    createChart(root, { definition: visitorDefinition });
    await nextFrame();
    expect(element.querySelectorAll("svg")).toHaveLength(1);
    expect(root.dataset.state).toBe("active");
    items[0]!.click();
    expect(barCount(element)).toBe(6);
  });

  it("rejects visibility props with a native definition", () => {
    expect(fixtures.definitionVisible).toEqual({
      error: expect.stringMatching(/own their visibility/),
    });
  });

  it("renders a legend from its own config outside a chart Root", () => {
    const element = mount("bareLegend");
    const desktop = legendButton(element, "desktop");
    expect(desktop.tagName).toBe("BUTTON");
    expect(desktop.getAttribute("aria-pressed")).toBe("false");
    expect(desktop.querySelector('[data-slot="chart-legend-icon"] svg')).not.toBeNull();
    expect(legendButton(element, "mobile").getAttribute("aria-pressed")).toBe("true");
    expect(
      legendButton(element, "mobile").querySelector('[data-slot="chart-legend-swatch"]'),
    ).not.toBeNull();
  });

  it("renders nothing for a Tooltip outside a chart Root", () => {
    const element = mount("outside");
    expect(element.querySelector(".outside")).toBeNull();
    expect(element.textContent?.trim()).toBe("");
  });
});

describe("Astro chart Styled parts", () => {
  it("shows the default dot tooltip and a legend placed without config", async () => {
    const element = await start("styledDefault");
    const legend = element.querySelector<HTMLElement>(".styled-legend")!;
    expect(legend.dataset.slot).toBe("chart-legend");
    expect(legend.querySelectorAll("button[data-slot=chart-legend-item]")).toHaveLength(2);
    expect(legend.querySelectorAll("[data-slot=chart-legend-icon]")).toHaveLength(0);

    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
    );
    const content = status()!.querySelector<HTMLElement>("[data-slot=chart-tooltip-content]")!;
    expect(content.dataset.indicator).toBe("dot");
    expect(content.className).toContain("bg-popover");
    expect(content.querySelectorAll("[data-slot=chart-tooltip-indicator]")).toHaveLength(2);
  });

  it("renders no tooltip with tooltip={false}", async () => {
    const element = await start("styledOff");
    element.querySelector<SVGElement>("svg[tabindex]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await nextFrame();
    expect(document.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
    expect(status()?.textContent ?? "").toBe("");
  });

  it('uses the native TanStack body with tooltip="native"', async () => {
    const element = await start("styledNative");
    expect(element.querySelectorAll("template[data-sw-chart-tooltip]")).toHaveLength(0);
    await focusFirstPoint(element);
    expect(status()!.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
    await vi.waitFor(() => expect(status()!.textContent).toMatch(/Desktop\d+Mobile\d+/));
  });

  it("lets a ChartTooltip replace the default body", async () => {
    const element = await start("styledChild");
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector("[data-slot=chart-tooltip-content]")?.className).toContain(
        "child",
      ),
    );
    expect(
      status()!.querySelector<HTMLElement>("[data-slot=chart-tooltip-content]")!.dataset.indicator,
    ).toBe("line");
  });

  it("lets the tooltip slot win over a ChartTooltip", async () => {
    const element = await start("styledSlot");
    expect(element.querySelectorAll("template[data-sw-chart-tooltip]")).toHaveLength(1);
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector("[data-slot=chart-tooltip-content]")?.className).toContain(
        "slot",
      ),
    );
    expect(document.querySelector(".child")).toBeNull();
  });

  it("renders a wrapped ChartLegend where it is placed", async () => {
    const element = await start("styledWrapped");
    const legend = element.querySelector("[data-wrapper] [data-slot=chart-legend]")!;
    expect(legend.querySelectorAll("button[data-slot=chart-legend-item]")).toHaveLength(2);
    legendButton(legend, "mobile").click();
    await nextFrame();
    expect(barCount(element)).toBe(3);
  });

  it("keeps a labels prop when the matching conditional slot renders nothing", async () => {
    const element = mount("propEmptySlot");
    expect(legendButton(element, "mobile").querySelector("[data-prop-label]")).not.toBeNull();
    expect(element.querySelector("[data-slot-label]")).toBeNull();
    startCharts();
    await nextFrame();
    expect(legendButton(element, "mobile").querySelector("[data-prop-label]")).not.toBeNull();
  });

  it("passes rich label slots from ChartContainer to the legend and the tooltip", async () => {
    const element = await start("styledRich");
    const mobile = legendButton(element, "mobile");
    // A slot wins over the labels prop; the prop fills keys that have no slot.
    expect(mobile.querySelector("[data-rich]")?.textContent?.trim()).toBe("Mobile");
    expect(legendButton(element, "desktop").querySelector("[data-prop-label]")).not.toBeNull();
    expect(mobile.getAttribute("aria-label")).toBe("Mobile");
    expect(element.querySelector('template[data-sw-chart-label="mobile"]')).not.toBeNull();

    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector('[data-key="mobile"] [data-rich]')).not.toBeNull(),
    );
  });

  it("renders plain tooltip slot content in the tooltip", async () => {
    const element = await start("styledPlainTooltip");
    expect(element.querySelector(".plain-tooltip")).toBeNull();
    expect(element.querySelectorAll("template[data-sw-chart-tooltip-static]")).toHaveLength(1);
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector(".plain-tooltip")?.textContent?.trim()).toBe("plain"),
    );
    expect(status()!.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
  });

  it("renders plain content from a ChartTooltip in the tooltip", async () => {
    const element = await start("styledPlainChild");
    expect(element.querySelectorAll("template[data-sw-chart-tooltip]")).toHaveLength(1);
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector(".plain-child")?.textContent?.trim()).toBe("child"),
    );
    expect(status()!.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
  });

  it("renders a ChartTooltip inside a tooltip body in place", async () => {
    const element = await start("styledNestedTooltip");
    expect(element.querySelectorAll("template[data-sw-chart-tooltip]")).toHaveLength(1);
    expect(element.querySelector("template[data-sw-chart-tooltip-registration]")).toBeNull();
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector(".outer .inner")?.textContent?.trim()).toBe("inner"),
    );
  });

  function expectRootRichParts(legend: HTMLElement) {
    expect(legendButtonOrSpan(legend, "mobile").querySelector("[data-rich]")).not.toBeNull();
    expect(
      legendButtonOrSpan(legend, "desktop").querySelector(
        '[data-slot="chart-legend-icon"] [data-rich-icon]',
      ),
    ).not.toBeNull();
  }

  function legendButtonOrSpan(legend: ParentNode, key: string): HTMLElement {
    return legend.querySelector<HTMLElement>(`[data-slot="chart-legend-item"][data-key="${key}"]`)!;
  }

  function legendItemsHtml(legend: HTMLElement): string[] {
    return [...legend.querySelectorAll('[data-slot="chart-legend-item"]')].map((n) => n.outerHTML);
  }

  for (const [name, fixture] of [
    ["a native definition", "configLegendDefinition"],
    ["an interactive={false}", "configLegendStatic"],
  ] as const) {
    it(`renders a ChartLegend with config passive inside ${name} Root, with the Root's rich parts`, () => {
      const element = mount(fixture);
      const configLegend = element.querySelector<HTMLElement>(".config-legend")!;
      const rootLegend = element.querySelector<HTMLElement>(".root-legend")!;
      expect(configLegend.querySelectorAll("button")).toHaveLength(0);
      expect(
        [...configLegend.querySelectorAll('[data-slot="chart-legend-item"]')].map((n) => n.tagName),
      ).toEqual(["SPAN", "SPAN"]);
      expectRootRichParts(configLegend);
      expect(configLegend.innerHTML).toBe(rootLegend.innerHTML);
    });
  }

  it("toggles from a ChartLegend with config inside an interactive source Root, with the Root's rich parts", async () => {
    // Server markup matches; the Runtime then syncs only the template legend of the Root config.
    const element = mount("configLegendSource");
    const configLegend = element.querySelector<HTMLElement>(".config-legend")!;
    const rootLegend = element.querySelector<HTMLElement>(".root-legend")!;
    expect(configLegend.querySelectorAll("button[data-slot=chart-legend-item]")).toHaveLength(2);
    expectRootRichParts(configLegend);
    expect(legendItemsHtml(configLegend)).toEqual(legendItemsHtml(rootLegend));
    startCharts();
    await nextFrame();
    legendButton(configLegend, "mobile").click();
    await nextFrame();
    expect(barCount(element)).toBe(3);
    for (const legend of [configLegend, rootLegend]) {
      expect(legendButton(legend, "mobile").getAttribute("aria-pressed")).toBe("false");
      expect(legendButton(legend, "mobile").dataset.state).toBe("off");
      expect(legendButton(legend, "desktop").getAttribute("aria-pressed")).toBe("true");
      expect(legendButton(legend, "desktop").dataset.state).toBe("on");
    }
  });

  it("renders plain markup and a ChartTooltipContent from one body inside the tooltip", async () => {
    const element = await start("styledMixedTooltip");
    expect(element.querySelector(".mixed-heading")).toBeNull();
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(status()!.querySelector(".mixed-heading")?.textContent?.trim()).toBe("Heading"),
    );
    const content = status()!.querySelector<HTMLElement>("[data-slot=chart-tooltip-content]")!;
    expect(content.className).toContain("mixed-content");
    expect(content.querySelectorAll("[data-slot=chart-tooltip-item]").length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".mixed-heading")).toHaveLength(1);
    const values = [...content.querySelectorAll("[data-slot=chart-tooltip-value]")].map(
      (node) => node.textContent ?? "",
    );
    await vi.waitFor(() => {
      const label = status()!.getAttribute("aria-label") ?? "";
      expect(label.startsWith("Heading ")).toBe(true);
      for (const value of values) expect(label).toContain(value);
    });
  });

  it("serializes part attributes as Astro 7 does", () => {
    expect(
      chartAttributes({
        "aria-hidden": false,
        "data-open": true,
        "data-off": false,
        disabled: true,
        hidden: false,
        title: undefined,
        "data-empty": "",
      }),
    ).toBe(' aria-hidden="false" data-open="true" data-off="false" disabled data-empty=""');
    expect(chartAttributes({ title: '"<b>"', 'bad"name': "x" })).toBe(
      ' title="&quot;&lt;b&gt;&quot;"',
    );
  });
});
