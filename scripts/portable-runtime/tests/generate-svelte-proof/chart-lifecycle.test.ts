import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { type Browser, chromium, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repo = process.cwd();
const chartSource = path.join(repo, "packages/svelte/src/chart");
const runtimeEntry = path.join(repo, "packages/runtime/src/components/chart/index.ts");
const fixtures = path
  .join(repo, "packages/runtime/tests/components/chart/fixtures.ts")
  .replaceAll("\\", "/");

let root = "";
let ssrServer: ViteDevServer | undefined;
let browserServer: ViteDevServer | undefined;
let browser: Browser | undefined;
let page: Page;
let firstRender = "";
let secondRender = "";
const messages: string[] = [];

beforeAll(async () => {
  root = await createHarness();
  ssrServer = await createProofServer(root, true);
  const appModule = await ssrServer.ssrLoadModule("/App.svelte");
  // Render with the Vite SSR copy of Svelte so the renderer and components share one context.
  const { render } = await ssrServer.ssrLoadModule("svelte/server");
  firstRender = render(appModule.default).body;
  secondRender = render(appModule.default).body;
  await writeFile(
    path.join(root, "index.html"),
    `<!doctype html><html><body><div id="app" style="width:600px">${firstRender}</div><script type="module" src="/main.ts"></script></body></html>`,
    "utf8",
  );
  browserServer = await createProofServer(root, false);
  await browserServer.listen();
  browser = await chromium.launch({ channel: "chrome", headless: true });
  page = await browser.newPage();
  page.on("console", (message) => {
    if (
      (message.type() === "error" || message.type() === "warning") &&
      !message.text().includes("Failed to load resource")
    )
      messages.push(message.text());
  });
  page.on("pageerror", (error) => messages.push(error.message));
  const url = browserServer.resolvedUrls?.local[0];
  if (!url) throw new Error("Svelte chart proof server did not expose a local URL.");
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.svelteChartReady !== undefined);
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await browserServer?.close();
  await ssrServer?.close();
  if (root) await rm(root, { force: true, recursive: true });
});

/** Runs a named action that App.svelte exposes, then lets Svelte and the Runtime settle. */
async function act(name: string, ...args: unknown[]): Promise<unknown> {
  const result = await page.evaluate(
    async ([action, values]) => {
      const api = (
        window as unknown as { __chart: Record<string, (...input: unknown[]) => unknown> }
      ).__chart;
      const value = await api[action as string]!(...(values as unknown[]));
      await (window as unknown as { __settle: () => Promise<void> }).__settle();
      return value;
    },
    [name, args] as const,
  );
  return result;
}

async function settle(): Promise<void> {
  await page.evaluate(() => (window as unknown as { __settle: () => Promise<void> }).__settle());
}

function section(id: string): string {
  return `[data-chart="${id}"]`;
}

async function barCount(id: string): Promise<number> {
  return page.locator(`${section(id)} rect[data-ts-key^="visitors:"]`).count();
}

async function pressed(id: string, key: string): Promise<string | null> {
  return page
    .locator(`${section(id)} [data-slot="chart-legend-item"][data-key="${key}"]`)
    .getAttribute("aria-pressed");
}

async function focusFirstPoint(id: string): Promise<void> {
  await page.locator(`${section(id)} svg[tabindex]`).focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForSelector(".ts-chart-tooltip[role=status]", { state: "attached" });
}

async function blurChart(id: string): Promise<void> {
  await page.locator(`${section(id)} svg[tabindex]`).blur();
}

/** The tooltip status region of a chart, read through the chart's tooltip host. */
async function tooltipText(id: string): Promise<string> {
  return page.evaluate((chartId) => {
    const content = document.querySelector(`[data-chart="${chartId}"] .ts-chart-tooltip`);
    return content?.textContent ?? "";
  }, id);
}

async function tooltipLabel(id: string): Promise<string | null> {
  return page.evaluate((chartId) => {
    const status = document.querySelector(
      `[data-chart="${chartId}"] .ts-chart-tooltip[role=status]`,
    );
    return status?.getAttribute("aria-label") ?? null;
  }, id);
}

async function waitFor<T>(read: () => Promise<T>, check: (value: T) => boolean): Promise<T> {
  const deadline = Date.now() + 5_000;
  let value = await read();
  while (!check(value)) {
    if (Date.now() > deadline) throw new Error(`Timed out. Last value: ${JSON.stringify(value)}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    value = await read();
  }
  return value;
}

describe("generated Svelte chart Primitive", () => {
  it("imports only the Runtime chart subpath and Svelte", async () => {
    for (const file of await readdir(chartSource)) {
      const source = await readFile(path.join(chartSource, file), "utf8");
      const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]!);
      for (const source of imports)
        expect(
          source.startsWith(".") ||
            source === "svelte" ||
            source === "svelte/elements" ||
            source === "@starwind-ui/runtime/chart",
          `${file}: ${source}`,
        ).toBe(true);
      expect(source).not.toContain("@tanstack/charts/svelte");
    }
  });

  it("renders the server SVG, config styles, ids, legends and no stray Tooltip", () => {
    expect(globalThis).not.toHaveProperty("window");
    expect(secondRender).toBe(firstRender);
    expect(firstRender).toContain('data-chart="ssr"');
    expect(firstRender).toContain('data-slot="chart-style"');
    expect(firstRender).toContain("--sw-chart-color-desktop");
    expect(firstRender).toMatch(/data-sw-chart-surface=""[^>]*data-slot="chart-surface"/);
    expect(firstRender).toMatch(/<div[^>]*style="[^"]*height:/);
    // A generated id uses the chart prefix and keeps only safe characters.
    const generated = /data-slot="chart" data-chart="(chart-[^"]+)"/.exec(firstRender)?.[1];
    expect(generated).toMatch(/^chart-[a-zA-Z0-9_-]+$/);
    // Legend items render per config key with visibility state.
    expect(firstRender).toMatch(
      /<button[^>]*type="button"[^>]*aria-pressed="false"[^>]*data-state="off"[^>]*data-key="desktop"/,
    );
    expect(firstRender).toMatch(/aria-pressed="true"[^>]*data-state="on"[^>]*data-key="mobile"/);
    // A native definition gets a passive legend.
    expect(firstRender).toMatch(/<span[^>]*data-key="desktop"[^>]*data-slot="chart-legend-item"/);
    // A Tooltip outside a tooltip body renders nothing.
    expect(firstRender).not.toContain("stray tooltip");
  });

  it("rejects visibility props with a native definition", async () => {
    const module = await ssrServer!.ssrLoadModule("/Rejects.svelte");
    const { render } = await ssrServer!.ssrLoadModule("svelte/server");
    expect(() => render(module.default).body).toThrow(
      /Static native definitions own their visibility/,
    );
  });

  it("hydrates the server SVG and adopts it without a second SVG", async () => {
    const result = (await act("hydration")) as {
      sameSvg: boolean;
      svgCount: number;
      surfaces: number;
      states: string[];
      ids: string[];
      serverIds: string[];
    };
    expect(messages).toEqual([]);
    expect(result.sameSvg).toBe(true);
    expect(result.svgCount).toBe(result.surfaces);
    expect(result.states.every((state) => state === "active")).toBe(true);
    expect(result.ids).toEqual(result.serverIds);
  });

  it("updates through the controller without Svelte rewriting the surface", async () => {
    const before = await act("markSvg", "update");
    expect(before).toBe(true);
    await act("setUpdateData", 50);
    const after = (await act("readUpdate")) as { same: boolean; svgs: number; tallest: number };
    expect(after.same).toBe(true);
    expect(after.svgs).toBe(1);
  });

  it("toggles series from legend items in the uncontrolled model and publishes the binding", async () => {
    expect(await barCount("uncontrolled")).toBe(6);
    expect(await act("readBound")).toEqual(["desktop", "mobile"]);
    await page.click(`${section("uncontrolled")} [data-key="desktop"]`);
    await settle();
    expect(await pressed("uncontrolled", "desktop")).toBe("false");
    expect(await barCount("uncontrolled")).toBe(3);
    expect(await act("readBound")).toEqual(["mobile"]);
    expect(await act("readCalls", "uncontrolled")).toEqual([["mobile"]]);
  });

  it("keeps a one-way visible prop until it changes and follows bind:visible", async () => {
    await page.click(`${section("one-way")} [data-key="desktop"]`);
    await settle();
    expect(await act("readCalls", "one-way")).toEqual([["mobile"]]);
    expect(await pressed("one-way", "desktop")).toBe("true");
    expect(await barCount("one-way")).toBe(6);
    await act("setOneWay", ["mobile"]);
    expect(await pressed("one-way", "desktop")).toBe("false");
    expect(await barCount("one-way")).toBe(3);

    await page.click(`${section("bound")} [data-key="mobile"]`);
    await settle();
    expect(await act("readBoundControlled")).toEqual(["desktop"]);
    expect(await barCount("bound")).toBe(3);
    await act("setBoundControlled", ["desktop", "mobile"]);
    expect(await barCount("bound")).toBe(6);
  });

  it("starts with defaultVisible", async () => {
    expect(await pressed("default", "desktop")).toBe("false");
    expect(await barCount("default")).toBe(3);
  });

  it("cancels the toggle from an onclick handler or the cancelable event", async () => {
    await page.click(`${section("cancel-click")} [data-key="desktop"]`);
    await settle();
    expect(await act("readCalls", "cancel-click")).toEqual([]);
    expect(await pressed("cancel-click", "desktop")).toBe("true");
    expect(await barCount("cancel-click")).toBe(6);

    // The callback runs before the cancelable event, as in the other Runtime families.
    await act("clearLog");
    await act("preventVisibleChange", "cancel-event");
    await page.click(`${section("cancel-event")} [data-key="desktop"]`);
    await settle();
    expect(await act("readCalls", "cancel-event")).toEqual([["mobile"]]);
    expect(await act("readLog")).toEqual(["cancel-event callback canceled"]);
    expect(await pressed("cancel-event", "desktop")).toBe("true");
    expect(await barCount("cancel-event")).toBe(6);
  });

  it("runs onVisibleChange before the event and writes the binding after it", async () => {
    await act("clearLog");
    await act("listen", "callback-order");
    await page.click(`${section("callback-order")} [data-key="desktop"]`);
    await settle();
    expect(await act("readLog")).toEqual([
      "callback mobile open key=desktop reason=legend-toggle trigger=desktop",
      "event mobile",
      "binding mobile",
    ]);
    expect(await act("readOrderModel")).toEqual(["mobile"]);
    expect(await barCount("callback-order")).toBe(3);
  });

  it("cancels the toggle from details.cancel() in onVisibleChange", async () => {
    await page.click(`${section("cancel-details")} [data-key="desktop"]`);
    await settle();
    expect(await pressed("cancel-details", "desktop")).toBe("true");
    expect(await barCount("cancel-details")).toBe(6);
    expect(await act("readDetailsBound")).toEqual(["desktop", "mobile"]);
    expect(await act("controllerVisible", "cancel-details")).toEqual(["desktop", "mobile"]);
  });

  it("holds parent-controlled keys in the Runtime controller after a click", async () => {
    await act("setOneWay", ["desktop", "mobile"]);
    await page.click(`${section("one-way")} [data-key="mobile"]`);
    await settle();
    expect(await act("controllerVisible", "one-way")).toEqual(["desktop", "mobile"]);
    expect(await pressed("one-way", "mobile")).toBe("true");
    expect(await barCount("one-way")).toBe(6);
  });

  it("applies a later defined visible as a silent command and stays Runtime-owned (ADR 0018)", async () => {
    await act("setFlip", ["desktop"]);
    expect(await act("readCalls", "flip")).toEqual([]);
    expect(await barCount("flip")).toBe(3);
    expect(await act("controllerVisible", "flip")).toEqual(["desktop"]);
    await page.click(`${section("flip")} [data-key="mobile"]`);
    await settle();
    expect(await act("readCalls", "flip")).toEqual([["desktop", "mobile"]]);
    expect(await act("controllerVisible", "flip")).toEqual(["desktop", "mobile"]);
    expect(await barCount("flip")).toBe(6);
  });

  it("applies a late command from a function binding getter that returns a fresh array", async () => {
    await act("setFresh", ["desktop"]);
    expect(await act("controllerVisible", "fresh")).toEqual(["desktop"]);
    expect(await barCount("fresh")).toBe(3);
    await page.click(`${section("fresh")} [data-key="mobile"]`);
    await settle();
    expect(await act("controllerVisible", "fresh")).toEqual(["desktop", "mobile"]);
    // The same parent value in a new array is not a new command.
    await act("setFresh", ["desktop"]);
    expect(await act("controllerVisible", "fresh")).toEqual(["desktop", "mobile"]);
    expect(await barCount("fresh")).toBe(6);
  });

  it("reads a parent-controlled function binding back after the write", async () => {
    await page.click(`${section("transform")} [data-key="mobile"]`);
    await settle();
    expect(await act("readTransform")).toEqual(["mobile"]);
    expect(await act("controllerVisible", "transform")).toEqual(["mobile"]);
    expect(await pressed("transform", "desktop")).toBe("false");
    expect(await pressed("transform", "mobile")).toBe("true");
    expect(await barCount("transform")).toBe(3);
  });

  it("keeps a toggle when the controller restarts", async () => {
    await page.click(`${section("restart-a")} [data-key="desktop"]`);
    await settle();
    await act("markController", "restart-a");
    await act("setRestartId", "restart-b");
    expect(await act("sameController", "restart-b")).toBe(false);
    expect(await act("controllerVisible", "restart-b")).toEqual(["mobile"]);
    expect(await pressed("restart-b", "desktop")).toBe("false");
    expect(await barCount("restart-b")).toBe(3);
  });

  it("renders the chart once per accepted toggle", async () => {
    const before = (await act("readCount", "echo")) as number;
    await page.click(`${section("echo")} [data-key="desktop"]`);
    await settle();
    expect(((await act("readCount", "echo")) as number) - before).toBe(1);
    expect(await barCount("echo")).toBe(3);
  });

  it("renders once when a controlled parent changes data and visible together", async () => {
    const before = (await act("readCount", "together")) as number;
    await act("setTogether");
    expect(((await act("readCount", "together")) as number) - before).toBe(1);
    expect(await barCount("together")).toBe(2);
    expect(await pressed("together", "mobile")).toBe("false");
  });

  it("shows the fallback tooltip from the keyboard and syncs the accessible label", async () => {
    await focusFirstPoint("keyboard");
    const content = await waitFor(
      () =>
        page.evaluate(() => {
          const node = document.querySelector<HTMLElement>(
            '[data-chart="keyboard"] [data-slot=chart-tooltip-content]',
          );
          if (!node) return null;
          const rows = [...node.querySelectorAll<HTMLElement>("[data-slot=chart-tooltip-item]")];
          return {
            chart: node.dataset.chart,
            indicator: node.dataset.indicator,
            nested: node.dataset.nested,
            className: node.className,
            parentIsBody: node.parentElement?.closest(".ts-chart-tooltip") !== null,
            rows: rows.map((row) => [row.dataset.key, row.getAttribute("aria-hidden")]),
            heading: node.querySelector("[data-slot=chart-tooltip-label]")?.textContent,
            name: node.querySelector("[data-slot=chart-tooltip-name]")?.textContent,
            value: node.querySelector("[data-slot=chart-tooltip-value]")?.textContent,
          };
        }),
      (value) => value !== null,
    );
    expect(content).toMatchObject({
      chart: "keyboard",
      indicator: "line",
      nested: "true",
      className: "content",
      parentIsBody: true,
      rows: [["mobile", "true"]],
    });
    expect(["January", "February", "March"]).toContain(content!.heading);
    expect(content!.name).toBe(`${content!.heading} Mobile`);
    await waitFor(
      () => tooltipLabel("keyboard"),
      (label) =>
        label ===
        `${content!.heading} Mobile ${content!.value}\n${content!.heading}\nMobile: ${content!.value}`,
    );
    await blurChart("keyboard");
  });

  it("uses the first Tooltip, hands over on removal and keeps order on update", async () => {
    await act("tickOrder");
    await focusFirstPoint("order");
    await waitFor(
      () => tooltipText("order"),
      (text) => text.includes("first"),
    );
    expect(await tooltipText("order")).not.toContain("second");
    await act("removeFirstTooltip");
    await waitFor(
      () => tooltipText("order"),
      (text) => text.includes("second"),
    );
    await blurChart("order");
  });

  it("renders a Tooltip inside a tooltip body in place", async () => {
    await focusFirstPoint("in-body");
    await waitFor(
      () => page.locator(`${section("in-body")} [data-testid="in-place"]`).count(),
      (count) => count === 1,
    );
    expect(await tooltipText("in-body")).not.toContain("registered");
    await blurChart("in-body");
  });

  it("renders rich labels and portable icons in the tooltip and legend", async () => {
    const desktop = page.locator(
      `${section("rich")} [data-slot="chart-legend-item"][data-key="desktop"]`,
    );
    expect(await desktop.getAttribute("aria-label")).toBe("Desktop");
    expect(await desktop.locator('[data-testid="rich"]').count()).toBe(1);
    expect(
      await desktop.locator('[data-slot="chart-legend-icon"] svg path').getAttribute("d"),
    ).toBe("M0 0L10 10");
    expect(await desktop.locator('[data-slot="chart-legend-swatch"]').count()).toBe(0);
    expect(
      await page
        .locator(`${section("rich")} [data-key="mobile"] [data-slot="chart-legend-swatch"]`)
        .count(),
    ).toBe(1);

    await focusFirstPoint("rich");
    const tooltip = await waitFor(
      () =>
        page.evaluate(() => {
          const host = document.querySelector('[data-chart="rich"] .ts-chart-tooltip');
          const rows = host?.querySelectorAll("[data-slot=chart-tooltip-item]") ?? [];
          if (rows.length !== 2) return null;
          return {
            rich: host!.querySelector('[data-testid="rich"]') !== null,
            icon:
              host!.querySelector('[data-key="desktop"] [data-slot="chart-tooltip-icon"] svg') !==
              null,
            indicator:
              host!.querySelector('[data-key="desktop"] [data-slot="chart-tooltip-indicator"]') !==
              null,
            values: [...host!.querySelectorAll("[data-slot=chart-tooltip-value]")].map(
              (node) => node.textContent,
            ),
            heading: host!.querySelector("[data-slot=chart-tooltip-label]")?.textContent,
          };
        }),
      (value) => value !== null,
    );
    expect(tooltip).toMatchObject({ rich: true, icon: true, indicator: false });
    const { heading, values } = tooltip!;
    await waitFor(
      () => tooltipLabel("rich"),
      (label) =>
        label ===
        `${heading} Desktop ${values[0]} Mobile ${values[1]}\n${heading}\nDesktop: ${values[0]}\nMobile: ${values[1]}`,
    );
    await blurChart("rich");
  });

  it("renders a native definition with a Surface and a passive legend", async () => {
    expect(await page.locator(`${section("definition")} svg.ts-chart`).count()).toBe(1);
    expect(await page.locator(section("definition")).getAttribute("data-state")).toBe("active");
    expect(await barCount("definition")).toBe(6);
    const tags = await page
      .locator(`${section("definition")} [data-slot="chart-legend-item"]`)
      .evaluateAll((items) => items.map((item) => item.tagName));
    expect(tags).toEqual(["SPAN", "SPAN"]);
    await page.click(`${section("definition")} [data-slot="chart-legend-item"] >> nth=0`);
    await settle();
    expect(await barCount("definition")).toBe(6);
  });

  it("uses the native body with nativeTooltip and clears the custom body on blur", async () => {
    await focusFirstPoint("native-body");
    await settle();
    expect(
      await page.locator(`${section("native-body")} [data-slot=chart-tooltip-content]`).count(),
    ).toBe(0);
    await blurChart("native-body");

    await focusFirstPoint("blur");
    await waitFor(
      () => page.locator(`${section("blur")} [data-slot=chart-tooltip-content]`).count(),
      (count) => count === 1,
    );
    await blurChart("blur");
    await waitFor(
      () => page.locator(`${section("blur")} [data-slot=chart-tooltip-content]`).count(),
      (count) => count === 0,
    );
  });

  it("passes the rendered element to part refs", async () => {
    expect(await act("readRefs")).toEqual({ surface: true, legend: true, item: true });
  });

  it("follows tooltip and fallbackTooltip snippets that change after mount", async () => {
    await act("setLateTooltip", true);
    await focusFirstPoint("late-snippet");
    await waitFor(
      () => page.locator(`${section("late-snippet")} [data-testid="late-snippet"]`).count(),
      (count) => count === 1,
    );
    await blurChart("late-snippet");
    // Removing the tooltip snippet hands over to the registered Tooltip.
    await act("setLateTooltip", false);
    await focusFirstPoint("late-snippet");
    await waitFor(
      () => tooltipText("late-snippet"),
      (text) => text.includes("registered body"),
    );
    await blurChart("late-snippet");
    // Without a registration the fallback renders, and without a fallback the native body.
    await act("removeLateRegistration");
    await focusFirstPoint("late-snippet");
    await waitFor(
      () => tooltipText("late-snippet"),
      (text) => text.includes("fallback body"),
    );
    await blurChart("late-snippet");
    await act("setLateFallback", false);
    await focusFirstPoint("late-snippet");
    await waitFor(
      () => tooltipText("late-snippet"),
      (text) => !text.includes("fallback body") && text.length > 0,
    );
    await blurChart("late-snippet");
  });

  it("reads a plain heading next to TooltipContent into the tooltip and its label", async () => {
    await focusFirstPoint("heading");
    const text = await waitFor(
      () => tooltipText("heading"),
      (value) => value.includes("Plain heading") && value.includes("Mobile"),
    );
    expect(text.indexOf("Plain heading")).toBeLessThan(text.indexOf("Mobile"));
    await waitFor(
      () => tooltipLabel("heading"),
      (label) => label?.startsWith("Plain heading ") ?? false,
    );
    await blurChart("heading");
  });

  it("destroys every controller on unmount", async () => {
    const result = (await act("unmountApp")) as { roots: number; controllers: number };
    expect(result).toEqual({ roots: 0, controllers: 0 });
    expect(messages).toEqual([]);
  });
});

async function createHarness(): Promise<string> {
  const harness = await mkdtemp(path.join(repo, ".svelte-chart-browser-"));
  await mkdir(path.join(harness, "_internal"));
  await copyFile(
    path.join(repo, "packages/svelte/src/_internal/ref-attachment.ts"),
    path.join(harness, "_internal/ref-attachment.ts"),
  );
  await mkdir(path.join(harness, "chart"));
  for (const file of await readdir(chartSource))
    await copyFile(path.join(chartSource, file), path.join(harness, "chart", file));
  await writeFile(path.join(harness, "TooltipBody.svelte"), TOOLTIP_BODY_SOURCE, "utf8");
  await writeFile(path.join(harness, "Legend.svelte"), LEGEND_SOURCE, "utf8");
  await writeFile(path.join(harness, "Rejects.svelte"), REJECTS_SOURCE, "utf8");
  await writeFile(path.join(harness, "App.svelte"), APP_SOURCE, "utf8");
  await writeFile(path.join(harness, "main.ts"), MAIN_SOURCE, "utf8");
  return harness;
}

async function createProofServer(harness: string, middlewareMode: boolean): Promise<ViteDevServer> {
  return createServer({
    appType: middlewareMode ? "custom" : "spa",
    configFile: false,
    cacheDir: path.join(harness, middlewareMode ? ".vite-ssr" : ".vite-browser"),
    logLevel: "silent",
    plugins: [svelte()],
    resolve: { alias: { "@starwind-ui/runtime/chart": runtimeEntry } },
    root: harness,
    server: middlewareMode
      ? { middlewareMode: true, watch: null, hmr: false }
      : {
          host: "127.0.0.1",
          port: 0,
          strictPort: false,
          watch: null,
          hmr: false,
          fs: { allow: [repo] },
        },
    ssr: { noExternal: [/@tanstack\/charts/] },
  });
}

const TOOLTIP_BODY_SOURCE = String.raw`<script lang="ts">
  import { Chart } from "./chart/index";
</script>

<Chart.TooltipContent indicator="line" class="content">
  <Chart.TooltipLabel class="label" />
  <Chart.TooltipItems>
    <Chart.TooltipItem class="row">
      <Chart.TooltipIcon />
      <Chart.TooltipIndicator />
      <Chart.TooltipName labelClass="label" />
      <Chart.TooltipValue />
    </Chart.TooltipItem>
  </Chart.TooltipItems>
</Chart.TooltipContent>
`;

const LEGEND_SOURCE = String.raw`<script lang="ts">
  import { Chart } from "./chart/index";
  let { onclick, ref }: { onclick?: (event: MouseEvent) => void; ref?: (element: HTMLElement | null) => void } = $props();
</script>

<Chart.Legend {ref}>
  <Chart.LegendItems>
    <Chart.LegendItem {onclick}>
      <Chart.LegendSwatch />
      <Chart.LegendIcon />
      <Chart.LegendLabel />
    </Chart.LegendItem>
  </Chart.LegendItems>
</Chart.Legend>
`;

const REJECTS_SOURCE = String.raw`<script lang="ts">
  import { Chart, type ChartConfig } from "./chart/index";
  import { visitorBars, visitorConfig, visitorData } from "${fixtures}";
  const definition = visitorBars({
    data: visitorData(), config: visitorConfig, keys: ["desktop", "mobile"], visible: ["desktop", "mobile"],
    params: {}, isVisible: () => true, label: (key) => key,
    color: { domain: ["desktop", "mobile"], range: ["red", "blue"] },
    theme: { foreground: "black", muted: "gray", grid: "gray", background: "white" },
    tooltip: () => false as never,
  });
  const props: any = { definition, config: visitorConfig as ChartConfig, visible: ["desktop"] };
</script>

<Chart.Root {...props}><Chart.Surface /></Chart.Root>
`;

const APP_SOURCE = String.raw`<script lang="ts">
  import { createRawSnippet, flushSync } from "svelte";
  import { getChartController } from "@starwind-ui/runtime/chart";
  import { Chart, type ChartConfig } from "./chart/index";
  import TooltipBody from "./TooltipBody.svelte";
  import Legend from "./Legend.svelte";
  import { visitorBars, visitorConfig, visitorData } from "${fixtures}";

  const config = visitorConfig as ChartConfig;
  const data = visitorData();
  const calls: Record<string, string[][]> = {};
  const log: string[] = [];
  const record = (id: string) => (next: string[], details: { isCanceled: boolean }) => {
    (calls[id] ??= []).push(next);
    // A callback with a canceled proposal only runs when a listener cancels it later.
    queueMicrotask(() => { if (details.isCanceled) log.push(id + " callback canceled"); });
  };
  const counts: Record<string, number> = {};
  const counted = (id: string): typeof visitorBars =>
    ((context: Parameters<typeof visitorBars>[0]) => {
      counts[id] = (counts[id] ?? 0) + 1;
      return visitorBars(context);
    }) as typeof visitorBars;
  const echoChart = counted("echo");
  const togetherChart = counted("together");
  let orderModel = $state<string[] | undefined>(undefined);
  let detailsBound = $state<string[] | undefined>(undefined);
  let flipVisible = $state<string[] | undefined>(undefined);
  let restartId = $state("restart-a");
  let togetherData = $state(visitorData());
  let togetherVisible = $state<string[]>(["desktop", "mobile"]);
  let markedController: unknown = null;
  let freshSource = $state<string[] | undefined>(undefined);
  // A plain holder, so only the readback after the write can apply the transformed keys.
  const transformHolder = { keys: ["desktop", "mobile"] };
  const definition = visitorBars({
    data, config: visitorConfig, keys: ["desktop", "mobile"], visible: ["desktop", "mobile"],
    params: {}, isVisible: () => true, label: (key) => key,
    color: { domain: ["desktop", "mobile"], range: ["red", "blue"] },
    theme: { foreground: "black", muted: "gray", grid: "gray", background: "white" },
    tooltip: () => false as never,
  });
  const richConfig: ChartConfig = {
    desktop: {
      label: createRawSnippet(() => ({ render: () => '<strong data-testid="rich">Desktop</strong>' })),
      text: "Desktop",
      color: "red",
      icon: { paths: ["M0 0L10 10"] },
    },
    mobile: { label: "Mobile", color: "blue" },
  };

  let updateData = $state(visitorData());
  let bound = $state<string[] | undefined>(undefined);
  let oneWay = $state<string[]>(["desktop", "mobile"]);
  let boundControlled = $state<string[]>(["desktop", "mobile"]);
  let orderTick = $state(0);
  let showFirst = $state(true);
  let lateTooltip = $state(false);
  let lateRegistration = $state(true);
  let lateFallback = $state(true);
  const refs = { surface: false, legend: false, item: false };
  let marked: Element | null = null;

  const settle = async () => {
    flushSync();
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
    flushSync();
  };
  const root = (id: string) => document.querySelector<HTMLElement>('[data-chart="' + id + '"]')!;
  const api = {
    hydration() {
      const svgs = [...document.querySelectorAll("#app svg.ts-chart")];
      return {
        sameSvg: svgs.every((svg) => (svg as any).__server === true),
        svgCount: svgs.length,
        surfaces: document.querySelectorAll("#app [data-sw-chart-surface]").length,
        states: [...document.querySelectorAll<HTMLElement>("#app [data-slot=chart]")].map((node) => node.dataset.state ?? ""),
        ids: [...document.querySelectorAll<HTMLElement>("#app [data-slot=chart]")].map((node) => node.dataset.chart ?? ""),
        serverIds: (window as any).__serverIds,
      };
    },
    markSvg(id: string) {
      marked = root(id).querySelector("svg.ts-chart");
      return marked !== null;
    },
    setUpdateData(offset: number) { updateData = visitorData(offset); },
    readUpdate() {
      const svgs = root("update").querySelectorAll("svg.ts-chart");
      return { same: svgs[0] === marked, svgs: svgs.length, tallest: 0 };
    },
    readBound: () => bound,
    readCalls: (id: string) => calls[id] ?? [],
    setOneWay(next: string[]) { oneWay = next; },
    readBoundControlled: () => boundControlled,
    setBoundControlled(next: string[]) { boundControlled = next; },
    readLog: () => [...log],
    clearLog() { log.length = 0; },
    listen(id: string) {
      root(id).addEventListener("starwind-chart:visible-change", (event) =>
        log.push("event " + (event as CustomEvent<{ visible: string[] }>).detail.visible.join(",")),
      );
    },
    readOrderModel: () => orderModel,
    readDetailsBound: () => detailsBound,
    controllerVisible: (id: string) => getChartController(root(id))?.getVisible(),
    setFlip(next: string[]) { flipVisible = next; },
    markController(id: string) { markedController = getChartController(root(id)); },
    sameController: (id: string) => getChartController(root(id)) === markedController,
    setRestartId(next: string) { restartId = next; },
    readCount: (id: string) => counts[id] ?? 0,
    setFresh(next: string[]) { freshSource = next; },
    readTransform: () => transformHolder.keys,
    setTogether() {
      togetherData = visitorData().slice(0, 2);
      togetherVisible = ["desktop"];
    },
    preventVisibleChange(id: string) {
      root(id).addEventListener("starwind-chart:visible-change", (event) => event.preventDefault());
    },
    tickOrder() { orderTick += 1; },
    removeFirstTooltip() { showFirst = false; },
    readRefs: () => refs,
    setLateTooltip(value: boolean) { lateTooltip = value; },
    removeLateRegistration() { lateRegistration = false; },
    setLateFallback(value: boolean) { lateFallback = value; },
    async unmountApp() {
      const roots = [...document.querySelectorAll<HTMLElement>("#app [data-slot=chart]")];
      await (window as any).__unmount();
      return {
        roots: document.querySelectorAll("#app [data-slot=chart]").length,
        controllers: roots.filter((node) => getChartController(node)).length,
      };
    },
  };
  if (typeof window !== "undefined") Object.assign(window, { __settle: settle, __chart: api });
</script>

{#snippet fallback()}<TooltipBody />{/snippet}
{#snippet lateBody()}<span data-testid="late-snippet">Late body</span>{/snippet}
{#snippet lateFallbackBody()}<span>fallback body</span>{/snippet}
{#snippet inPlace()}<Chart.Tooltip><span data-testid="in-place">in place</span></Chart.Tooltip>{/snippet}

<Chart.Root id="ssr" chart={visitorBars} {data} {config} defaultVisible={["mobile"]}>
  <Chart.Style />
  <Chart.Surface />
  <Legend />
  <Chart.Tooltip>stray tooltip</Chart.Tooltip>
</Chart.Root>

<Chart.Root chart={visitorBars} {data} {config}><Chart.Surface /></Chart.Root>

<Chart.Root id="definition" {definition} {config}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id="update" chart={visitorBars} data={updateData} {config}><Chart.Surface /></Chart.Root>

<Chart.Root id="uncontrolled" chart={visitorBars} {data} {config} bind:visible={bound} onVisibleChange={record("uncontrolled")}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id="one-way" chart={visitorBars} {data} {config} visible={oneWay} onVisibleChange={record("one-way")}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id="bound" chart={visitorBars} {data} {config} bind:visible={boundControlled}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id="default" chart={visitorBars} {data} {config} defaultVisible={["mobile"]}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id="cancel-click" chart={visitorBars} {data} {config} onVisibleChange={record("cancel-click")}>
  <Chart.Surface />
  <Legend onclick={(event) => event.preventDefault()} />
</Chart.Root>

<Chart.Root id="cancel-event" chart={visitorBars} {data} {config} onVisibleChange={record("cancel-event")}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root
  id="callback-order"
  chart={visitorBars}
  {data}
  {config}
  bind:visible={() => orderModel, (next) => { log.push("binding " + next?.join(",")); orderModel = next; }}
  onVisibleChange={(next, details) =>
    log.push(
      "callback " + next.join(",") + " " + (details.isCanceled ? "canceled" : "open") +
        " key=" + details.key + " reason=" + details.reason +
        " trigger=" + (details.trigger as HTMLElement | undefined)?.dataset.key,
    )}
>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id="cancel-details" chart={visitorBars} {data} {config} bind:visible={detailsBound} onVisibleChange={(_next, details) => details.cancel()}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id="flip" chart={visitorBars} {data} {config} visible={flipVisible} onVisibleChange={record("flip")}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id={restartId} chart={visitorBars} {data} {config}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id="fresh" chart={visitorBars} {data} {config} bind:visible={() => (freshSource ? [...freshSource] : undefined), () => {}}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root
  id="transform"
  chart={visitorBars}
  {data}
  {config}
  bind:visible={() => transformHolder.keys, () => { transformHolder.keys = ["mobile"]; }}
>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id="echo" chart={echoChart} {data} {config}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id="together" chart={togetherChart} data={togetherData} {config} visible={togetherVisible}>
  <Chart.Surface />
  <Legend />
</Chart.Root>

<Chart.Root id="keyboard" chart={visitorBars} {data} {config} defaultVisible={["mobile"]}>
  <Chart.Surface fallbackTooltip={fallback} />
</Chart.Root>

<Chart.Root id="order" chart={visitorBars} {data} {config} data-tick={orderTick}>
  <Chart.Surface />
  {#if showFirst}<Chart.Tooltip>first</Chart.Tooltip>{/if}
  <div><Chart.Tooltip>second</Chart.Tooltip></div>
</Chart.Root>

<Chart.Root id="in-body" chart={visitorBars} {data} {config}>
  <Chart.Surface tooltip={inPlace} />
  <Chart.Tooltip>registered</Chart.Tooltip>
</Chart.Root>

<Chart.Root id="rich" chart={visitorBars} {data} config={richConfig}>
  <Chart.Surface fallbackTooltip={fallback} />
  <Legend />
</Chart.Root>

<Chart.Root id="native-body" chart={visitorBars} {data} {config}>
  <Chart.Surface fallbackTooltip={fallback} nativeTooltip />
</Chart.Root>

<Chart.Root id="blur" chart={visitorBars} {data} {config}>
  <Chart.Surface fallbackTooltip={fallback} />
</Chart.Root>

<Chart.Root id="refs" chart={visitorBars} {data} {config}>
  <Chart.Surface ref={(element) => (refs.surface = element?.dataset.slot === "chart-surface")} />
  <Chart.Legend ref={(element) => (refs.legend = element?.dataset.slot === "chart-legend")}>
    <Chart.LegendItem value="desktop" ref={(element) => (refs.item = element?.tagName === "BUTTON")}>Desktop</Chart.LegendItem>
  </Chart.Legend>
</Chart.Root>

<Chart.Root id="late-snippet" chart={visitorBars} {data} {config}>
  <Chart.Surface tooltip={lateTooltip ? lateBody : undefined} fallbackTooltip={lateFallback ? lateFallbackBody : undefined} />
  {#if lateRegistration}<Chart.Tooltip>registered body</Chart.Tooltip>{/if}
</Chart.Root>

<Chart.Root id="heading" chart={visitorBars} {data} {config} defaultVisible={["mobile"]}>
  <Chart.Surface />
  <Chart.Tooltip>
    <strong>Plain heading</strong>
    <TooltipBody />
  </Chart.Tooltip>
</Chart.Root>
`;

const MAIN_SOURCE = String.raw`import { hydrate, unmount } from "svelte";
import App from "./App.svelte";
const target = document.querySelector("#app")!;
for (const svg of target.querySelectorAll("svg.ts-chart")) (svg as any).__server = true;
(window as any).__serverIds = [...target.querySelectorAll<HTMLElement>("[data-slot=chart]")].map((node) => node.dataset.chart ?? "");
const instance = hydrate(App, { target });
(window as any).__unmount = async () => { await unmount(instance); await (window as any).__settle(); };
void (window as any).__settle().then(() => { document.documentElement.dataset.svelteChartReady = ""; });
`;
