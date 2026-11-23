import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import ChartScenarios from "./svelte/ChartScenarios.svelte";

type Scenarios = {
  setMode(next: boolean | "native"): void;
  readVisible(): string[] | undefined;
  readThemes(): Record<string, unknown>[];
};

const mounted: Record<string, unknown>[] = [];

afterEach(async () => {
  for (const instance of mounted.splice(0)) await unmount(instance);
  document.body.innerHTML = "";
});

async function settle(): Promise<void> {
  flushSync();
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  flushSync();
}

async function render(scenario: string): Promise<{ element: HTMLDivElement; api: Scenarios }> {
  const element = document.createElement("div");
  element.style.width = "600px";
  document.body.append(element);
  const warnings: string[] = [];
  const warn = vi.spyOn(console, "warn").mockImplementation((message) => {
    warnings.push(String(message));
  });
  const instance = mount(ChartScenarios, { target: element, props: { scenario } });
  mounted.push(instance);
  await settle();
  warn.mockRestore();
  expect(warnings).toEqual([]);
  return { element, api: instance as unknown as Scenarios };
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

function barCount(element: ParentNode): number {
  return element.querySelectorAll('rect[data-ts-key^="visitors:"]').length;
}

describe("Svelte Styled chart", () => {
  it("renders the container, style and surface with no legend and no component CSS", async () => {
    const { element } = await render("parts");
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
    const { api } = await render("theme");

    expect(api.readThemes().at(-1)).toMatchObject({
      foreground: "var(--muted-foreground)",
      muted: "var(--muted-foreground)",
      grid: "red",
      background: "transparent",
    });
  });

  it("shows the default dot tooltip with the Starwind classes", async () => {
    const { element } = await render("default");
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
    const { element } = await render("off");
    element.querySelector<SVGElement>("svg[tabindex]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await settle();

    expect(document.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
    expect(tooltipHost()?.textContent ?? "").toBe("");
  });

  it('keeps the TanStack body with tooltip="native"', async () => {
    const { element } = await render("native");
    await focusFirstPoint(element);
    await vi.waitFor(() => expect(tooltipHost()!.textContent).not.toBe(""));

    expect(document.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
  });

  it("lets the first ChartTooltip replace the default body", async () => {
    const { element } = await render("replace");
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.dataset.indicator).toBe("line");
    expect(document.querySelector('[data-testid="second"]')).toBeNull();
  });

  it("renders the default content from a ChartTooltip without content", async () => {
    const { element } = await render("tooltip-default");
    await focusFirstPoint(element);

    expect((await tooltipContent()).dataset.indicator).toBe("dot");
  });

  it("lets the container tooltip snippet win over a ChartTooltip", async () => {
    const { element } = await render("precedence");
    await focusFirstPoint(element);
    await vi.waitFor(() =>
      expect(tooltipHost()!.querySelector('[data-testid="slot"]')).not.toBeNull(),
    );

    expect(document.querySelector('[data-testid="child"]')).toBeNull();
  });

  it("nests the heading in the name for one line or dashed row", async () => {
    const { element } = await render("nested");
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
    const { element } = await render("key-label");
    await focusFirstPoint(element);
    const content = await tooltipContent();

    expect(content.querySelector("[data-slot=chart-tooltip-label]")!.textContent).toBe("Desktop");
  });

  it("renders no heading for hideLabel and keeps the module preset when it is absent", async () => {
    const { element } = await render("hidden");
    await focusFirstPoint(element);
    const content = await tooltipContent();
    expect(content.querySelector("[data-slot=chart-tooltip-label]")).toBeNull();
    expect(content.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(2);

    for (const instance of mounted.splice(0)) await unmount(instance);
    document.body.innerHTML = "";
    const second = await render("preset");
    await focusFirstPoint(second.element);
    const presetContent = await tooltipContent();
    expect(presetContent.querySelector("[data-slot=chart-tooltip-label]")).toBeNull();
  });

  it("renders a formatter row with the custom row class", async () => {
    const { element } = await render("custom-row");
    await focusFirstPoint(element);
    const content = await tooltipContent();
    const row = content.querySelector<HTMLElement>("[data-slot=chart-tooltip-item]")!;

    expect(row.className).toBe("flex w-full items-center gap-2");
    expect(row.querySelector('[data-testid="row"]')!.textContent).toMatch(
      /^\w+:\d+:(January|February|March)$/,
    );
  });
});

describe("Svelte Styled chart tooltip mode", () => {
  async function modeChart() {
    const { element, api } = await render("mode");
    const refocus = async () => {
      element.querySelector<SVGElement>("svg[tabindex]")!.blur();
      await settle();
      element.querySelector<SVGElement>("svg[tabindex]")!.focus();
      await userEvent.keyboard("{ArrowRight}");
      await settle();
    };
    await focusFirstPoint(element);
    expect((await tooltipContent()).dataset.indicator).toBe("dot");
    return { api, refocus };
  }

  it("follows the tooltip prop from true to native", async () => {
    const { api, refocus } = await modeChart();

    api.setMode("native");
    await settle();
    await refocus();
    await vi.waitFor(() => expect(tooltipHost()!.textContent).not.toBe(""));
    expect(document.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
  });

  it("follows the tooltip prop from true to false", async () => {
    const { api, refocus } = await modeChart();

    api.setMode(false);
    await settle();
    await refocus();
    expect(document.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
    expect(tooltipHost()?.textContent ?? "").toBe("");
  });
});

describe("Svelte Styled chart legend", () => {
  it("renders every ChartLegend where it is placed and toggles series with bind:visible", async () => {
    const { element, api } = await render("legend");
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
    // A local model publishes the accepted keys to the binding once mounted.
    expect(api.readVisible()).toEqual(["desktop", "mobile"]);

    desktop.click();
    await settle();

    expect(api.readVisible()).toEqual(["mobile"]);
    expect(desktop.getAttribute("aria-pressed")).toBe("false");
    expect(legends[1]!.querySelector('[data-key="desktop"]')!.getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(barCount(element)).toBe(3);
  });

  it("renders the content snippet in place of the default legend", async () => {
    const { element } = await render("legend-content");

    expect(element.querySelector('[data-testid="custom-legend"]')).not.toBeNull();
    expect(element.querySelector('[data-slot="chart-legend"]')).toBeNull();
  });

  it("forwards hideIcon to the legend content", async () => {
    const { element } = await render("legend-icon");
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
});
