// Smoke cases for the chart example page. The Astro, React, Vue and Svelte demo smoke runners
// share this module, because each app renders the same four examples with the same markup hooks.

const EXAMPLES = ["bar", "area", "donut", "radar"];

/**
 * @param {{ page: import("playwright").Page, label: string, scope?: string }} options
 */
export async function verifyChartExamples({
  page,
  label,
  scope = '[data-testid="chart-examples"]',
}) {
  const examples = page.locator(scope);
  await verifyActiveCharts({ examples, label });

  await verifyLegendToggle({
    page,
    label,
    example: examples.locator('[data-chart-example="bar"]'),
  });
  await verifyDonutTotal({
    page,
    label,
    example: examples.locator('[data-chart-example="donut"]'),
  });
  await verifyKeyboardTooltip({
    page,
    label,
    name: "area",
    indicator: "line",
    example: examples.locator('[data-chart-example="area"]'),
  });
  await verifyKeyboardTooltip({
    page,
    label,
    name: "radar",
    indicator: "dot",
    example: examples.locator('[data-chart-example="radar"]'),
  });
  await verifyThemeColors({
    page,
    label,
    example: examples.locator('[data-chart-example="area"]'),
  });
}

/**
 * Astro only. Opens the chart page through Astro's client router twice, so the charts start after
 * a swap and the hosts from the first visit do not stay behind.
 * @param {{ page: import("playwright").Page, baseUrl: string }} options
 */
export async function verifyAstroChartClientRouter({ page, baseUrl }) {
  const label = "Astro client router";
  await page.goto(`${baseUrl}/smoke/chart-client-router-start/`, { waitUntil: "networkidle" });
  const sentinel = `chart-client-router-${Date.now()}`;
  await page.evaluate((value) => {
    globalThis.__starwindChartClientRouterSentinel = value;
  }, sentinel);
  for (const visit of [1, 2]) {
    await page.getByRole("link", { name: "Open chart examples" }).click();
    await page.waitForURL(`${baseUrl}/smoke/chart-client-router-destination/`);
    await page.getByRole("heading", { name: "Chart client router smoke destination" }).waitFor();
    await verifyActiveCharts({
      examples: page.locator('[data-testid="chart-examples"]'),
      label: `${label} visit ${visit}`,
    });
    const svgs = await page.locator("svg.ts-chart").count();
    if (svgs !== EXAMPLES.length) {
      throw new Error(`${label} visit ${visit} found ${svgs} chart SVGs, expected 4.`);
    }
    if (visit === 1) {
      await page.getByRole("link", { name: "Back to the start page" }).click();
      await page.waitForURL(`${baseUrl}/smoke/chart-client-router-start/`);
      await page.getByRole("heading", { name: "Chart client router smoke start" }).waitFor();
    }
  }
  const stayedClientSide = await page.evaluate(
    (value) => globalThis.__starwindChartClientRouterSentinel === value,
    sentinel,
  );
  if (!stayedClientSide) {
    throw new Error(`${label} navigation left Astro's client router.`);
  }
}

async function verifyActiveCharts({ examples, label }) {
  await examples.waitFor();

  for (const name of EXAMPLES) {
    const example = examples.locator(`[data-chart-example="${name}"]`);
    await example.scrollIntoViewIfNeeded();
    // A server-rendered chart starts as "pending" until its module registers.
    await example
      .locator('[data-slot="chart"][data-state="active"]')
      .waitFor({ timeout: 10_000 })
      .catch(async (error) => {
        const states = await example
          .locator('[data-slot="chart"]')
          .evaluateAll((roots) => roots.map((root) => root.getAttribute("data-state")));
        throw new Error(
          `${label} ${name} chart did not become active: ${JSON.stringify(states)}\n${error}`,
        );
      });
    const shape = await example.evaluate((node) => {
      const svg = node.querySelector('[data-slot="chart-surface"] svg.ts-chart');
      return {
        roots: node.querySelectorAll('[data-slot="chart"]').length,
        svgs: node.querySelectorAll("svg.ts-chart").length,
        paths: svg?.querySelectorAll("path, rect").length ?? 0,
        legendItems: node.querySelectorAll('[data-slot="chart-legend-item"]').length,
        width: svg?.getBoundingClientRect().width ?? 0,
        height: svg?.getBoundingClientRect().height ?? 0,
        id: node.querySelector('[data-slot="chart"]')?.getAttribute("data-chart") ?? "",
      };
    });
    const expectedLegend = name === "donut" ? 6 : 2;
    if (
      shape.roots !== 1 ||
      shape.svgs !== 1 ||
      shape.paths === 0 ||
      shape.legendItems !== expectedLegend ||
      shape.width === 0 ||
      shape.height === 0 ||
      !/^[a-zA-Z0-9_-]+$/.test(shape.id)
    ) {
      throw new Error(`${label} ${name} chart has an unexpected shape: ${JSON.stringify(shape)}`);
    }
  }
}

async function verifyLegendToggle({ page, label, example }) {
  const mobile = example.locator('[data-slot="chart-legend-item"]').filter({ hasText: "Mobile" });
  const svg = example.locator("svg.ts-chart");
  const before = await svg.evaluate((node) => node.innerHTML);
  await mobile.click();
  await page
    .waitForFunction(
      ([button, markup]) =>
        button.getAttribute("data-state") === "off" &&
        button.closest('[data-slot="chart"]')?.querySelector("svg.ts-chart")?.innerHTML !== markup,
      [await mobile.elementHandle(), before],
      { timeout: 5_000 },
    )
    .catch((error) => {
      throw new Error(`${label} bar chart legend did not hide the Mobile series.\n${error}`);
    });
  await mobile.click();
  await page
    .waitForFunction(
      (button) => button.getAttribute("data-state") === "on",
      await mobile.elementHandle(),
      { timeout: 5_000 },
    )
    .catch((error) => {
      throw new Error(`${label} bar chart legend did not show the Mobile series again.\n${error}`);
    });
}

async function verifyDonutTotal({ page, label, example }) {
  const feb = example.locator('[data-slot="chart-legend-item"]').filter({ hasText: "Feb" });
  const total = () =>
    example
      .locator("svg.ts-chart text")
      .evaluateAll(
        (nodes) =>
          nodes.map((node) => node.textContent ?? "").find((text) => /^[\d,]+$/.test(text)) ?? "",
      );
  const waitForTotal = async (expected, step) => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if ((await total()) === expected) return;
      await page.waitForTimeout(50);
    }
    throw new Error(
      `${label} donut total after ${step} is ${JSON.stringify(await total())}, expected ${expected}.`,
    );
  };
  await waitForTotal("1,224", "the first render");
  await feb.click();
  await waitForTotal("919", "hiding February");
  await feb.click();
  await waitForTotal("1,224", "showing February again");
}

async function verifyKeyboardTooltip({ page, label, name, indicator, example }) {
  const svg = example.locator("svg.ts-chart");
  await svg.focus();
  await page.keyboard.press("ArrowRight");
  const content = example.locator('[data-slot="chart-tooltip-content"]').filter({ visible: true });
  await content
    .first()
    .waitFor({ timeout: 5_000 })
    .catch((error) => {
      throw new Error(`${label} ${name} chart showed no tooltip after keyboard focus.\n${error}`);
    });
  const tooltip = await content.first().evaluate((node) => ({
    indicator: node.getAttribute("data-indicator"),
    rows: node.querySelectorAll('[data-slot="chart-tooltip-item"]').length,
    text: node.textContent?.replace(/\s+/g, " ").trim() ?? "",
  }));
  if (
    tooltip.indicator !== indicator ||
    tooltip.rows !== 2 ||
    !tooltip.text.includes("Desktop") ||
    !tooltip.text.includes("Mobile")
  ) {
    throw new Error(`${label} ${name} chart tooltip is wrong: ${JSON.stringify(tooltip)}`);
  }
  await svg.blur();
  await content
    .first()
    .waitFor({ state: "hidden", timeout: 5_000 })
    .catch(() => {});
}

async function verifyThemeColors({ page, label, example }) {
  const root = example.locator('[data-slot="chart"]');
  const read = () =>
    root.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        chart1: getComputedStyle(document.documentElement).getPropertyValue("--chart-1").trim(),
        desktop: style.getPropertyValue("--color-desktop").trim(),
        mobile: style.getPropertyValue("--color-mobile").trim(),
      };
    });
  const wasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  const light = await read();
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  const dark = await read();
  await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), wasDark);
  if (
    !light.chart1 ||
    !light.desktop ||
    !light.mobile ||
    light.desktop !== dark.desktop ||
    light.mobile === dark.mobile
  ) {
    throw new Error(
      `${label} chart colors do not follow the theme: ${JSON.stringify({ light, dark })}`,
    );
  }
}
