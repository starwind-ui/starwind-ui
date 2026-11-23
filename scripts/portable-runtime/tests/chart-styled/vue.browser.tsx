import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { type App, createApp, createSSRApp, h, nextTick, ref, type VNodeChild } from "vue";
import { renderToString } from "vue/server-renderer";

import {
  type ChartConfig,
  ChartContainer,
  type ChartContext,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/chart";
import {
  type VisitorRow,
  visitorBars,
  visitorConfig,
  visitorData,
} from "../../../../packages/runtime/tests/components/chart/fixtures";

const config = visitorConfig as ChartConfig;
const apps: App[] = [];

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.innerHTML = "";
});

async function settle(): Promise<void> {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  await nextTick();
}

async function render(node: () => VNodeChild): Promise<HTMLDivElement> {
  const element = document.createElement("div");
  element.style.width = "600px";
  document.body.append(element);
  const app = createApp({ render: node });
  const warnings: string[] = [];
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount(element);
  apps.push(app);
  await settle();
  expect(warnings).toEqual([]);
  return element;
}

function tooltipHost(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".ts-chart-tooltip[role=status]");
}

async function focusFirstPoint(element: ParentNode): Promise<void> {
  element.querySelector<SVGElement>("svg[tabindex]")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await vi.waitFor(() => expect(tooltipHost()).not.toBeNull());
}

async function tooltipContent(): Promise<HTMLElement> {
  await vi.waitFor(() =>
    expect(tooltipHost()?.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
  );
  return tooltipHost()!.querySelector<HTMLElement>("[data-slot=chart-tooltip-content]")!;
}

function chart(props: Record<string, unknown> = {}, slots: Record<string, () => VNodeChild> = {}) {
  return h(ChartContainer, { chart: visitorBars, data: visitorData(), config, ...props }, slots);
}

function barCount(element: ParentNode): number {
  return element.querySelectorAll('rect[data-ts-key^="visitors:"]').length;
}

describe("Vue Styled chart", () => {
  it("renders the container, style and surface with no legend and no component CSS", async () => {
    const element = await render(() => chart({ id: "parts", class: "extra" }));
    const root = element.querySelector<HTMLElement>('[data-slot="chart"]')!;

    expect(root.dataset.chart).toBe("parts");
    expect(root.className).toContain("flex w-full min-w-0 flex-col text-xs");
    expect(root.className).toContain("extra");
    expect([...root.children].map((child) => child.getAttribute("data-slot"))).toEqual([
      "chart-style",
      "chart-surface",
    ]);
    expect(element.querySelector('[data-slot="chart-legend"]')).toBeNull();
    const styles = element.querySelectorAll("style");
    expect(styles).toHaveLength(1);
    for (const rule of styles[0]!.textContent!.split("}").filter((text) => text.includes("{"))) {
      expect(rule.trim()).toMatch(/^(\.dark )?\[data-chart="parts"\]\{/);
    }
  });

  it("passes the Starwind scene theme under a user theme", async () => {
    const themes: ChartContext<VisitorRow>["theme"][] = [];
    const source = (ctx: ChartContext<VisitorRow>) => {
      themes.push(ctx.theme);
      return visitorBars(ctx);
    };
    await render(() => chart({ id: "theme", chart: source, theme: { grid: "red" } }));

    expect(themes.at(-1)).toMatchObject({
      foreground: "var(--muted-foreground)",
      muted: "var(--muted-foreground)",
      grid: "red",
      background: "transparent",
    });
  });

  it("shows the default dot tooltip with the Starwind classes", async () => {
    const element = await render(() => chart({ id: "default" }));
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.dataset.indicator).toBe("dot");
    expect(content.dataset.nested).toBe("false");
    expect(content.className).toContain("bg-popover text-popover-foreground");
    const label = content.querySelector<HTMLElement>(":scope > [data-slot=chart-tooltip-label]")!;
    expect(label.tagName).toBe("DIV");
    expect(label.className).toBe("font-medium");
    const rows = content.querySelectorAll<HTMLElement>("[data-slot=chart-tooltip-item]");
    expect(rows).toHaveLength(2);
    expect(rows[0]!.className).toContain("flex w-full items-center gap-2");
    expect(rows[0]!.querySelector("[data-slot=chart-tooltip-indicator]")!.className).toContain(
      "group-data-[indicator=dot]/chart-tooltip:size-2.5",
    );
    expect(rows[0]!.querySelector("[data-slot=chart-tooltip-value]")!.className).toContain(
      "font-mono",
    );
  });

  it("shows no tooltip with tooltip false", async () => {
    const element = await render(() => chart({ id: "off", tooltip: false }));
    element.querySelector<SVGElement>("svg[tabindex]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await settle();

    expect(document.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
    expect(tooltipHost()?.textContent ?? "").toBe("");
  });

  it('keeps the TanStack body with tooltip="native"', async () => {
    const element = await render(() =>
      chart({ id: "native", tooltip: "native" }, { default: () => h(ChartTooltip) }),
    );
    await focusFirstPoint(element);
    await vi.waitFor(() => expect(tooltipHost()!.textContent).not.toBe(""));

    expect(document.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
  });

  it("lets the first ChartTooltip replace the default body, with or without content", async () => {
    const element = await render(() =>
      chart(
        { id: "replace" },
        {
          default: () => [
            h("div", null, [
              h(ChartTooltip, null, {
                content: () => h(ChartTooltipContent, { indicator: "line" }),
              }),
            ]),
            h(ChartTooltip, null, { content: () => h("span", { "data-testid": "second" }) }),
          ],
        },
      ),
    );
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.dataset.indicator).toBe("line");
    expect(document.querySelector('[data-testid="second"]')).toBeNull();
  });

  it("renders the default content from a ChartTooltip without content", async () => {
    const element = await render(() =>
      chart({ id: "tooltip-default" }, { default: () => h(ChartTooltip) }),
    );
    await focusFirstPoint(element);

    expect((await tooltipContent()).dataset.indicator).toBe("dot");
  });

  it("lets the container tooltip slot win over a ChartTooltip", async () => {
    const element = await render(() =>
      chart(
        { id: "precedence" },
        {
          tooltip: () => h("span", { "data-testid": "slot" }, "slot"),
          default: () =>
            h(ChartTooltip, null, { content: () => h("span", { "data-testid": "child" }) }),
        },
      ),
    );
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(tooltipHost()!.querySelector('[data-testid="slot"]')).not.toBeNull(),
    );

    expect(document.querySelector('[data-testid="child"]')).toBeNull();
  });

  it("nests the heading in the name for one line or dashed row", async () => {
    const element = await render(() =>
      chart(
        { id: "nested", defaultVisible: ["mobile"] },
        {
          tooltip: () =>
            h(ChartTooltipContent, { indicator: "dashed", labelClass: "custom-label" }),
        },
      ),
    );
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.dataset.indicator).toBe("dashed");
    expect(content.dataset.nested).toBe("true");
    expect(content.querySelector(":scope > [data-slot=chart-tooltip-label]")).toBeNull();
    const label = content.querySelector<HTMLElement>(
      "[data-slot=chart-tooltip-name] > [data-slot=chart-tooltip-label]",
    )!;
    expect(label.tagName).toBe("SPAN");
    expect(label.className).toBe("font-medium custom-label");
  });

  it("shows the config label for a heading that names a config key", async () => {
    const element = await render(() =>
      chart({ id: "key-label" }, { tooltip: () => h(ChartTooltipContent, { label: "desktop" }) }),
    );
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.querySelector("[data-slot=chart-tooltip-label]")!.textContent).toBe("Desktop");
  });

  it("renders no heading for hideLabel and keeps the module preset when it is absent", async () => {
    const element = await render(() =>
      chart({ id: "hidden" }, { tooltip: () => h(ChartTooltipContent, { hideLabel: true }) }),
    );
    await focusFirstPoint(element);
    const content = await tooltipContent();
    expect(content.querySelector("[data-slot=chart-tooltip-label]")).toBeNull();
    expect(content.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(2);

    const preset = {
      id: "vue-styled-preset",
      ariaLabel: "Visitors",
      create: visitorBars,
      presentation: { hideLabel: true },
    };
    document.body.innerHTML = "";
    const second = await render(() => chart({ id: "preset", chart: preset }));
    await focusFirstPoint(second);
    const presetContent = await tooltipContent();
    expect(presetContent.querySelector("[data-slot=chart-tooltip-label]")).toBeNull();
  });

  it("renders a formatter row with the custom row class", async () => {
    const element = await render(() =>
      chart(
        { id: "custom-row" },
        {
          tooltip: () =>
            h(ChartTooltipContent, {
              formatter: (
                value: unknown,
                name: string,
                _item: unknown,
                _index: number,
                payload: VisitorRow,
              ) => h("span", { "data-testid": "row" }, `${name}:${String(value)}:${payload.month}`),
            }),
        },
      ),
    );
    await focusFirstPoint(element);
    const content = await tooltipContent();
    const row = content.querySelector<HTMLElement>("[data-slot=chart-tooltip-item]")!;

    expect(row.className).toBe("flex w-full items-center gap-2");
    expect(row.querySelector('[data-testid="row"]')!.textContent).toMatch(
      /^\w+:\d+:(January|February|March)$/,
    );
  });
});

describe("Vue Styled chart tooltip mode", () => {
  async function modeChart(id: string) {
    const mode = ref<boolean | "native">(true);
    const element = await render(() => chart({ id, tooltip: mode.value }));
    const refocus = async () => {
      element.querySelector<SVGElement>("svg[tabindex]")!.blur();
      await settle();
      element.querySelector<SVGElement>("svg[tabindex]")!.focus();
      await userEvent.keyboard("{ArrowRight}");
      await settle();
    };
    await focusFirstPoint(element);
    expect((await tooltipContent()).dataset.indicator).toBe("dot");
    return { mode, refocus };
  }

  it("follows the tooltip prop from true to native", async () => {
    const { mode, refocus } = await modeChart("mode-native");

    mode.value = "native";
    await settle();
    await refocus();
    await vi.waitFor(() => expect(tooltipHost()!.textContent).not.toBe(""));
    expect(document.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
  });

  it("follows the tooltip prop from true to false", async () => {
    const { mode, refocus } = await modeChart("mode-off");

    mode.value = false;
    await settle();
    await refocus();
    expect(document.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
    expect(tooltipHost()?.textContent ?? "").toBe("");
  });
});

describe("Vue Styled chart legend", () => {
  const iconConfig: ChartConfig = {
    desktop: { label: "Desktop", color: "red", icon: { paths: ["M0 0L10 10"] } },
    mobile: { label: "Mobile", color: "blue" },
  };

  it("renders every ChartLegend where it is placed and toggles series with v-model", async () => {
    const visible = ref<string[] | undefined>(undefined);
    const element = await render(() =>
      chart(
        {
          id: "legend",
          visible: visible.value,
          "onUpdate:visible": (next: string[]) => (visible.value = next),
        },
        {
          default: () => [
            h("section", { "data-testid": "wrapper" }, [
              h(ChartLegend, { class: "mine", "data-extra": "yes" }),
            ]),
            h(ChartLegend),
          ],
        },
      ),
    );
    const legends = element.querySelectorAll<HTMLElement>('[data-slot="chart-legend"]');

    expect(legends).toHaveLength(2);
    expect(legends[0]!.parentElement!.dataset.testid).toBe("wrapper");
    expect(legends[0]!.className).toBe(
      "flex flex-wrap items-center justify-center gap-4 pt-3 mine",
    );
    expect(legends[0]!.dataset.extra).toBe("yes");
    const desktop = legends[0]!.querySelector<HTMLButtonElement>('[data-key="desktop"]')!;
    expect(desktop.className).toContain("data-[state=off]:opacity-40");
    expect(desktop.querySelector('[data-slot="chart-legend-label"]')!.textContent).toBe("Desktop");

    desktop.click();
    await settle();

    expect(visible.value).toEqual(["mobile"]);
    expect(desktop.getAttribute("aria-pressed")).toBe("false");
    expect(legends[1]!.querySelector('[data-key="desktop"]')!.getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(barCount(element)).toBe(3);
  });

  it("renders the content slot in place of the default legend", async () => {
    const element = await render(() =>
      chart(
        { id: "legend-content" },
        {
          default: () =>
            h(ChartLegend, null, {
              content: () => h("p", { "data-testid": "custom-legend" }, "custom"),
            }),
        },
      ),
    );

    expect(element.querySelector('[data-testid="custom-legend"]')).not.toBeNull();
    expect(element.querySelector('[data-slot="chart-legend"]')).toBeNull();
  });

  it("forwards hideIcon to the legend content", async () => {
    const element = await render(() =>
      chart(
        { id: "legend-icon", config: iconConfig },
        { default: () => [h(ChartLegend), h(ChartLegend, { hideIcon: true })] },
      ),
    );
    const [withIcon, withoutIcon] = element.querySelectorAll('[data-slot="chart-legend"]');
    const iconItem = withIcon!.querySelector('[data-key="desktop"]')!;

    expect(iconItem.querySelector('[data-slot="chart-legend-icon"]')!.className).toContain(
      "size-3",
    );
    expect(iconItem.querySelector('[data-slot="chart-legend-swatch"]')).toBeNull();
    const swatchItem = withoutIcon!.querySelector('[data-key="desktop"]')!;
    expect(swatchItem.querySelector('[data-slot="chart-legend-icon"]')).toBeNull();
    expect(swatchItem.querySelector('[data-slot="chart-legend-swatch"]')).not.toBeNull();
  });

  it("renders the legend in the server markup and hydrates without a second SVG", async () => {
    const tree = () => chart({ id: "server" }, { default: () => h(ChartLegend) });
    const html = await renderToString(createSSRApp({ render: tree }));

    expect(html).toContain('data-slot="chart-legend"');
    expect(html.match(/data-slot="chart-legend-item"/g)).toHaveLength(2);
    expect(html).toContain("<svg");

    const element = document.createElement("div");
    element.style.width = "600px";
    element.innerHTML = html;
    document.body.append(element);
    const svg = element.querySelector("svg");
    const app = createSSRApp({ render: tree });
    const warnings: string[] = [];
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(element);
    apps.push(app);
    await settle();
    expect(warnings).toEqual([]);
    expect(element.querySelectorAll("svg")).toHaveLength(1);
    expect(element.querySelector("svg")).toBe(svg);
  });
});
