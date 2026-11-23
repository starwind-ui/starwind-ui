import type * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server.browser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import {
  type ChartConfig,
  ChartContainer,
  type ChartContext,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../../apps/react-demo/src/components/starwind-runtime/chart";
import {
  type VisitorRow,
  visitorBars,
  visitorConfig,
  visitorData,
} from "../../../../packages/runtime/tests/components/chart/fixtures";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const config = visitorConfig as ChartConfig;
const roots: Root[] = [];

afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount());
  document.body.innerHTML = "";
});

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

async function render(node: React.ReactNode): Promise<HTMLDivElement> {
  const element = document.createElement("div");
  element.style.width = "600px";
  document.body.append(element);
  const root = createRoot(element);
  roots.push(root);
  await act(async () => root.render(node));
  await nextFrame();
  return element;
}

function tooltipHost(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".ts-chart-tooltip[role=status]");
}

async function focusFirstPoint(element: ParentNode): Promise<void> {
  await act(async () => {
    element.querySelector<SVGElement>("svg[tabindex]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
  });
  await vi.waitFor(() => expect(tooltipHost()).not.toBeNull());
}

async function tooltipContent(): Promise<HTMLElement> {
  await vi.waitFor(() =>
    expect(tooltipHost()?.querySelector("[data-slot=chart-tooltip-content]")).not.toBeNull(),
  );
  return tooltipHost()!.querySelector<HTMLElement>("[data-slot=chart-tooltip-content]")!;
}

type ContainerProps = Partial<React.ComponentProps<typeof ChartContainer<VisitorRow>>>;

function Chart(props: ContainerProps) {
  return (
    <ChartContainer<VisitorRow>
      chart={visitorBars}
      data={visitorData()}
      config={config}
      {...(props as object)}
    />
  );
}

function barCount(element: ParentNode): number {
  return element.querySelectorAll('rect[data-ts-key^="visitors:"]').length;
}

describe("React Styled chart", () => {
  it("renders the container, style and surface with no legend and no component CSS", async () => {
    const element = await render(<Chart id="parts" className="extra" />);
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
    expect(styles[0]!.dataset.slot).toBe("chart-style");
    // The only style rules are the config colors under the chart scope.
    for (const rule of styles[0]!.textContent!.split("}").filter((text) => text.includes("{"))) {
      expect(rule.trim()).toMatch(/^(\.dark )?\[data-chart="parts"\]\{/);
    }
  });

  it("passes the Starwind scene theme under a user theme", async () => {
    const themes: ChartContext<VisitorRow>["theme"][] = [];
    const chart = (ctx: ChartContext<VisitorRow>) => {
      themes.push(ctx.theme);
      return visitorBars(ctx);
    };
    await render(<Chart id="theme" chart={chart} theme={{ grid: "red" }} />);

    expect(themes.at(-1)).toMatchObject({
      foreground: "var(--muted-foreground)",
      muted: "var(--muted-foreground)",
      grid: "red",
      background: "transparent",
    });
  });

  it("shows the default dot tooltip with the Starwind classes", async () => {
    const element = await render(<Chart id="default" />);
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.dataset.indicator).toBe("dot");
    expect(content.dataset.nested).toBe("false");
    expect(content.className).toContain("bg-popover text-popover-foreground");
    const label = content.querySelector<HTMLElement>(":scope > [data-slot=chart-tooltip-label]")!;
    expect(label.tagName).toBe("DIV");
    expect(label.className).toBe("font-medium");
    expect(["January", "February", "March"]).toContain(label.textContent);
    const rows = content.querySelectorAll<HTMLElement>("[data-slot=chart-tooltip-item]");
    expect(rows).toHaveLength(2);
    expect(rows[0]!.className).toContain("flex w-full items-center gap-2");
    expect(rows[0]!.querySelector("[data-slot=chart-tooltip-indicator]")!.className).toContain(
      "group-data-[indicator=dot]/chart-tooltip:size-2.5",
    );
    expect(rows[0]!.querySelector("[data-slot=chart-tooltip-name]")!.className).toContain(
      "text-muted-foreground",
    );
    expect(rows[0]!.querySelector("[data-slot=chart-tooltip-value]")!.className).toContain(
      "font-mono",
    );
  });

  it("shows no tooltip with tooltip={false}", async () => {
    const element = await render(<Chart id="off" tooltip={false} />);
    await act(async () => {
      element.querySelector<SVGElement>("svg[tabindex]")!.focus();
      await userEvent.keyboard("{ArrowRight}");
    });
    await nextFrame();

    expect(document.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
    expect(tooltipHost()?.textContent ?? "").toBe("");
  });

  it('keeps the TanStack body with tooltip="native"', async () => {
    const element = await render(
      <Chart id="native" tooltip="native">
        <ChartTooltip />
      </Chart>,
    );
    await focusFirstPoint(element);
    await vi.waitFor(() => expect(tooltipHost()!.textContent).not.toBe(""));

    expect(document.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
  });

  it("lets the first ChartTooltip replace the default body, with or without content", async () => {
    const element = await render(
      <Chart id="replace">
        <div>
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        </div>
        <ChartTooltip content={<span data-testid="second">second</span>} />
      </Chart>,
    );
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.dataset.indicator).toBe("line");
    expect(document.querySelector('[data-testid="second"]')).toBeNull();
  });

  it("renders the default content from a ChartTooltip without content", async () => {
    const element = await render(
      <Chart id="tooltip-default" tooltip={undefined}>
        <ChartTooltip />
      </Chart>,
    );
    await focusFirstPoint(element);

    expect((await tooltipContent()).dataset.indicator).toBe("dot");
  });

  it("lets the container tooltip prop win over a ChartTooltip", async () => {
    const element = await render(
      <Chart id="precedence" tooltip={<span data-testid="prop">prop</span>}>
        <ChartTooltip content={<span data-testid="child">child</span>} />
      </Chart>,
    );
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(tooltipHost()!.querySelector('[data-testid="prop"]')).not.toBeNull(),
    );

    expect(document.querySelector('[data-testid="child"]')).toBeNull();
  });

  it("nests the heading in the name for one line or dashed row", async () => {
    const element = await render(
      <Chart
        id="nested"
        defaultVisible={["mobile"]}
        tooltip={<ChartTooltipContent indicator="dashed" labelClassName="custom-label" />}
      />,
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

  it("keeps the heading outside the name for one dot row", async () => {
    const element = await render(<Chart id="dot-one" defaultVisible={["mobile"]} />);
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.dataset.nested).toBe("false");
    expect(content.querySelector(":scope > [data-slot=chart-tooltip-label]")).not.toBeNull();
  });

  it("shows the config label for a heading that names a config key", async () => {
    const element = await render(
      <Chart id="key-label" tooltip={<ChartTooltipContent label="desktop" />} />,
    );
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.querySelector("[data-slot=chart-tooltip-label]")!.textContent).toBe("Desktop");
  });

  it("keeps the formatted heading when labelFormatter runs", async () => {
    const element = await render(
      <Chart
        id="formatter"
        tooltip={
          <ChartTooltipContent<VisitorRow>
            label="desktop"
            labelFormatter={(label) => `Key ${String(label)}`}
          />
        }
      />,
    );
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.querySelector("[data-slot=chart-tooltip-label]")!.textContent).toBe(
      "Key desktop",
    );
  });

  it("renders no heading for hideLabel", async () => {
    const element = await render(<Chart id="hidden" tooltip={<ChartTooltipContent hideLabel />} />);
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.querySelector("[data-slot=chart-tooltip-label]")).toBeNull();
    expect(content.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(2);
  });

  it("renders no heading for an empty heading", async () => {
    const element = await render(<Chart id="empty" tooltip={<ChartTooltipContent label="" />} />);
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.querySelector("[data-slot=chart-tooltip-label]")).toBeNull();
  });

  it("renders a formatter row with the custom row class", async () => {
    const element = await render(
      <Chart
        id="custom-row"
        tooltip={
          <ChartTooltipContent<VisitorRow>
            formatter={(value, name, _item, _index, payload) => (
              <span data-testid="row">{`${name}:${String(value)}:${payload.month}`}</span>
            )}
          />
        }
      />,
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

describe("React Styled chart legend", () => {
  const iconConfig: ChartConfig = {
    desktop: { label: "Desktop", color: "red", icon: { paths: ["M0 0L10 10"] } },
    mobile: { label: "Mobile", color: "blue" },
  };

  it("renders every ChartLegend where it is placed and toggles series", async () => {
    const element = await render(
      <Chart id="legend">
        <section data-testid="wrapper">
          <ChartLegend className="mine" data-extra="yes" />
        </section>
        <ChartLegend />
      </Chart>,
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
    expect(desktop.querySelector('[data-slot="chart-legend-swatch"]')!.className).toBe(
      "size-2 shrink-0 rounded-[2px]",
    );
    expect(desktop.querySelector('[data-slot="chart-legend-label"]')!.textContent).toBe("Desktop");

    await act(async () => desktop.click());
    await nextFrame();

    expect(desktop.getAttribute("aria-pressed")).toBe("false");
    expect(legends[1]!.querySelector('[data-key="desktop"]')!.getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(barCount(element)).toBe(3);
  });

  it("renders the content prop in place of the default legend", async () => {
    const element = await render(
      <Chart id="legend-content">
        <ChartLegend content={<p data-testid="custom-legend">custom</p>} />
      </Chart>,
    );

    expect(element.querySelector('[data-testid="custom-legend"]')).not.toBeNull();
    expect(element.querySelector('[data-slot="chart-legend"]')).toBeNull();
  });

  it("forwards hideIcon to the legend content", async () => {
    const element = await render(
      <Chart id="legend-icon" config={iconConfig}>
        <ChartLegend />
        <ChartLegend hideIcon />
      </Chart>,
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

  it("renders the legend in the server markup", () => {
    const html = renderToStaticMarkup(
      <Chart id="server">
        <ChartLegend />
      </Chart>,
    );

    expect(html).toContain('data-slot="chart-legend"');
    expect(html.match(/data-slot="chart-legend-item"/g)).toHaveLength(2);
    expect(html).toContain("<svg");
  });
});
