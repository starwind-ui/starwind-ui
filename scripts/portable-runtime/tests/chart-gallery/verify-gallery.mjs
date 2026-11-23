// Browser coverage for the chart gallery in the Astro, React, Vue and Svelte demo apps.
//
// For each framework, the suite starts the demo app from this checkout, opens every gallery view,
// and checks the nav, the card order and titles against shadcn's `/charts` list, that each chart
// draws marks, and that each chart shows a tooltip. It also uses the interactive controls.
//
// Usage: node scripts/portable-runtime/tests/chart-gallery/verify-gallery.mjs
//   [--framework=astro,react,vue,svelte] [--views=pie,radar] [--screenshots=<folder>] [--skip-build]
//
// The Svelte app resolves the Svelte package through its build output, so the suite builds the
// Runtime and Svelte packages first unless `--skip-build` is given.
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { startAstroSmokeDevServer } from "../smoke/astro-smoke-dev-server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const appRequire = createRequire(path.join(root, "apps/react-demo/package.json"));
const { chromium } = appRequire("playwright");

const args = process.argv.slice(2);
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const frameworks = (option("framework") ?? "astro,react,vue,svelte").split(",").filter(Boolean);
const screenshots = option("screenshots");
const skipBuild = args.includes("--skip-build");
// Checks only these views, for quick local runs. The full suite checks every view.
const views = option("views")?.split(",").filter(Boolean);

// The oracle is shadcn's chart list (`apps/v4/app/(app)/charts/charts.tsx`) and each variant's
// card title. It does not read the catalog, so a catalog change cannot hide a missing variant.
const NAV = [
  ["area", "Area Charts"],
  ["bar", "Bar Charts"],
  ["line", "Line Charts"],
  ["pie", "Pie Charts"],
  ["radar", "Radar Charts"],
  ["radial", "Radial Charts"],
  ["tooltip", "Tooltips"],
];

const VARIANTS = {
  area: [
    ["chart-area-interactive", "Area Chart - Interactive"],
    ["chart-area-default", "Area Chart"],
    ["chart-area-linear", "Area Chart - Linear"],
    ["chart-area-step", "Area Chart - Step"],
    ["chart-area-legend", "Area Chart - Legend"],
    ["chart-area-stacked", "Area Chart - Stacked"],
    ["chart-area-stacked-expand", "Area Chart - Stacked Expanded"],
    ["chart-area-icons", "Area Chart - Icons"],
    ["chart-area-gradient", "Area Chart - Gradient"],
    ["chart-area-axes", "Area Chart - Axes"],
  ],
  bar: [
    ["chart-bar-interactive", "Bar Chart - Interactive"],
    ["chart-bar-default", "Bar Chart"],
    ["chart-bar-horizontal", "Bar Chart - Horizontal"],
    ["chart-bar-multiple", "Bar Chart - Multiple"],
    ["chart-bar-stacked", "Bar Chart - Stacked + Legend"],
    ["chart-bar-label", "Bar Chart - Label"],
    ["chart-bar-label-custom", "Bar Chart - Custom Label"],
    ["chart-bar-mixed", "Bar Chart - Mixed"],
    ["chart-bar-active", "Bar Chart - Active"],
    ["chart-bar-negative", "Bar Chart - Negative"],
  ],
  line: [
    ["chart-line-interactive", "Line Chart - Interactive"],
    ["chart-line-default", "Line Chart"],
    ["chart-line-linear", "Line Chart - Linear"],
    ["chart-line-step", "Line Chart - Step"],
    ["chart-line-multiple", "Line Chart - Multiple"],
    ["chart-line-dots", "Line Chart - Dots"],
    ["chart-line-dots-custom", "Line Chart - Custom Dots"],
    ["chart-line-dots-colors", "Line Chart - Dots Colors"],
    ["chart-line-label", "Line Chart - Label"],
    ["chart-line-label-custom", "Line Chart - Custom Label"],
  ],
  pie: [
    ["chart-pie-simple", "Pie Chart"],
    ["chart-pie-separator-none", "Pie Chart - Separator None"],
    ["chart-pie-label", "Pie Chart - Label"],
    ["chart-pie-label-custom", "Pie Chart - Custom Label"],
    ["chart-pie-label-list", "Pie Chart - Label List"],
    ["chart-pie-legend", "Pie Chart - Legend"],
    ["chart-pie-donut", "Pie Chart - Donut"],
    ["chart-pie-donut-active", "Pie Chart - Donut Active"],
    ["chart-pie-donut-text", "Pie Chart - Donut with Text"],
    ["chart-pie-stacked", "Pie Chart - Stacked"],
    ["chart-pie-interactive", "Pie Chart - Interactive"],
  ],
  radar: [
    ["chart-radar-default", "Radar Chart"],
    ["chart-radar-dots", "Radar Chart - Dots"],
    ["chart-radar-lines-only", "Radar Chart - Lines Only"],
    ["chart-radar-label-custom", "Radar Chart - Custom Label"],
    ["chart-radar-grid-custom", "Radar Chart - Grid Custom"],
    ["chart-radar-grid-none", "Radar Chart - Grid None"],
    ["chart-radar-grid-circle", "Radar Chart - Grid Circle"],
    ["chart-radar-grid-circle-no-lines", "Radar Chart - Grid Circle - No lines"],
    ["chart-radar-grid-circle-fill", "Radar Chart - Grid Circle Filled"],
    ["chart-radar-grid-fill", "Radar Chart - Grid Filled"],
    ["chart-radar-multiple", "Radar Chart - Multiple"],
    ["chart-radar-legend", "Radar Chart - Legend"],
    ["chart-radar-icons", "Radar Chart - Icons"],
    ["chart-radar-radius", "Radar Chart - Radius Axis"],
  ],
  radial: [
    ["chart-radial-simple", "Radial Chart"],
    ["chart-radial-label", "Radial Chart - Label"],
    ["chart-radial-grid", "Radial Chart - Grid"],
    ["chart-radial-text", "Radial Chart - Text"],
    ["chart-radial-shape", "Radial Chart - Shape"],
    ["chart-radial-stacked", "Radial Chart - Stacked"],
  ],
  tooltip: [
    ["chart-tooltip-default", "Tooltip - Default"],
    ["chart-tooltip-indicator-line", "Tooltip - Line Indicator"],
    ["chart-tooltip-indicator-none", "Tooltip - No Indicator"],
    ["chart-tooltip-label-custom", "Tooltip - Custom label"],
    ["chart-tooltip-label-formatter", "Tooltip - Label Formatter"],
    ["chart-tooltip-label-none", "Tooltip - No Label"],
    ["chart-tooltip-formatter", "Tooltip - Formatter"],
    ["chart-tooltip-icons", "Tooltip - Icons"],
    ["chart-tooltip-advanced", "Tooltip - Advanced"],
  ],
};

// The data marks each variant draws, by mark id, with the number of drawn shapes. Every entry
// names at least one data mark, so a chart that draws no data fails. The two radar grid entries
// also pin a grid ring count, because the grid is what those variants show.
const areaPair = { "area-mobile": 1, "area-desktop": 1, "area-lines": 2 };
const DATA_MARKS = {
  "chart-area-interactive": areaPair,
  "chart-area-default": { "area-desktop": 1, "area-lines": 1 },
  "chart-area-linear": { "area-desktop": 1, "area-lines": 1 },
  "chart-area-step": { "area-desktop": 1, "area-lines": 1 },
  "chart-area-legend": areaPair,
  "chart-area-stacked": areaPair,
  "chart-area-stacked-expand": {
    "area-other": 1,
    "area-mobile": 1,
    "area-desktop": 1,
    "area-lines": 3,
  },
  "chart-area-icons": areaPair,
  "chart-area-gradient": areaPair,
  "chart-area-axes": areaPair,
  "chart-bar-interactive": { bars: 91 },
  "chart-bar-default": { bars: 6 },
  "chart-bar-horizontal": { bars: 6 },
  "chart-bar-multiple": { bars: 12 },
  "chart-bar-stacked": { bars: 12 },
  "chart-bar-label": { bars: 6, labels: 6 },
  "chart-bar-label-custom": { bars: 6, "month-labels": 6, "value-labels": 6 },
  "chart-bar-mixed": { bars: 5 },
  "chart-bar-active": { bars: 5 },
  "chart-bar-negative": { bars: 6, labels: 6 },
  "chart-line-interactive": { lines: 1 },
  "chart-line-default": { lines: 1 },
  "chart-line-linear": { lines: 1 },
  "chart-line-step": { lines: 1 },
  "chart-line-multiple": { lines: 2 },
  "chart-line-dots": { lines: 1, dots: 6 },
  "chart-line-dots-custom": { lines: 1, "commit-stems": 6, "commit-rings": 6 },
  "chart-line-dots-colors": { lines: 1, dots: 5 },
  "chart-line-label": { lines: 1, dots: 6, labels: 6 },
  "chart-line-label-custom": { lines: 1, dots: 5, labels: 5 },
  "chart-pie-simple": { slices: 5 },
  "chart-pie-separator-none": { slices: 5 },
  "chart-pie-label": { slices: 5, "label-lines": 5, labels: 5 },
  "chart-pie-label-custom": { slices: 5, labels: 5 },
  "chart-pie-label-list": { slices: 5, labels: 5 },
  "chart-pie-legend": { slices: 5 },
  "chart-pie-donut": { slices: 5 },
  "chart-pie-donut-active": { slices: 4, "active-slice": 1 },
  "chart-pie-donut-text": { slices: 5, "center-value": 1, "center-caption": 1 },
  "chart-pie-stacked": { "desktop-slices": 5, "mobile-slices": 5 },
  "chart-pie-interactive": { slices: 4, "active-slice": 1, "active-ring": 1, "center-value": 1 },
  "chart-radar-default": { "radar-desktop": 1 },
  "chart-radar-dots": { "radar-desktop": 1, dots: 6 },
  "chart-radar-lines-only": { "radar-desktop": 1, "radar-mobile": 1 },
  "chart-radar-label-custom": {
    "radar-desktop": 1,
    "radar-mobile": 1,
    "tick-values": 6,
    "tick-months": 6,
  },
  "chart-radar-grid-custom": { ring: 1, "radar-desktop": 1 },
  "chart-radar-grid-none": { ring: 0, "radar-desktop": 1, dots: 6 },
  "chart-radar-grid-circle": { "radar-desktop": 1, dots: 6 },
  "chart-radar-grid-circle-no-lines": { "radar-desktop": 1, dots: 6 },
  "chart-radar-grid-circle-fill": { "radar-desktop": 1 },
  "chart-radar-grid-fill": { "radar-desktop": 1 },
  "chart-radar-multiple": { "radar-desktop": 1, "radar-mobile": 1 },
  "chart-radar-legend": { "radar-desktop": 1, "radar-mobile": 1 },
  "chart-radar-icons": { "radar-desktop": 1, "radar-mobile": 1 },
  "chart-radar-radius": { "radar-desktop": 1, "radar-mobile": 1, "radius-label": 5 },
  "chart-radial-simple": { track: 5, bars: 5 },
  "chart-radial-label": { track: 5, bars: 5, labels: 5 },
  "chart-radial-grid": { bars: 5 },
  "chart-radial-text": { track: 1, bars: 1, "center-value": 1 },
  "chart-radial-shape": { track: 1, bars: 1, "center-value": 1 },
  "chart-radial-stacked": { bars: 2, "center-value": 1 },
  "chart-tooltip-default": { bars: 12 },
  "chart-tooltip-indicator-line": { bars: 12 },
  "chart-tooltip-indicator-none": { bars: 12 },
  "chart-tooltip-label-custom": { bars: 12 },
  "chart-tooltip-label-formatter": { bars: 12 },
  "chart-tooltip-label-none": { bars: 12 },
  "chart-tooltip-formatter": { bars: 12 },
  "chart-tooltip-icons": { bars: 12 },
  "chart-tooltip-advanced": { bars: 12 },
};

// shadcn draws these cards with no `ChartTooltip`, so the gallery turns their tooltip off.
const NO_TOOLTIP = new Set(["chart-pie-legend", "chart-radial-text", "chart-radial-shape"]);

// Hover points, as shares of the chart width and height, for charts whose marks miss the default
// points. The stacked radial bar is a half ring above the center.
// Wednesday 2024-07-17 in the Tooltip view: running 520 kcal, swimming 120 kcal, 640 in all.
const WEDNESDAY = [
  [0.42, 0.55],
  [0.42, 0.4],
];

const HOVER = {
  // Inside the Chrome slice, which starts at 3 o'clock and runs counterclockwise.
  "chart-pie-label-custom": [[0.62, 0.36]],
  // The stacked radial bar is a half ring above the center.
  "chart-radial-stacked": [
    [0.12, 0.47],
    [0.5, 0.12],
    [0.85, 0.4],
  ],
  ...Object.fromEntries(
    [
      "default",
      "indicator-line",
      "indicator-none",
      "label-custom",
      "label-formatter",
      "label-none",
      "formatter",
      "icons",
      "advanced",
    ].map((variant) => [`chart-tooltip-${variant}`, WEDNESDAY]),
  ),
};

// The tooltip each variant shows: shadcn's `ChartTooltipContent` options and formatters. The
// Tooltip variants are hovered on Wednesday, so their values are exact.
const TOOLTIP_LOOK = {
  "chart-pie-label-custom": { text: /^Visitors 275$/ },
  "chart-pie-stacked": { rows: 1, label: /^(Desktop|Mobile)$/, indicator: "line" },
  "chart-radial-stacked": { rows: 2, text: /^Mobile 570 Desktop 1,260$/ },
  "chart-radar-multiple": { rows: 2, indicator: "line" },
  "chart-radar-radius": { rows: 2, label: null, indicator: "line" },
  "chart-tooltip-default": {
    label: /^2024-07-17$/,
    indicator: "dot",
    indicators: 2,
    text: /^2024-07-17 Running 520 Swimming 120$/,
  },
  "chart-tooltip-indicator-line": { label: /^2024-07-17$/, indicator: "line", indicators: 2 },
  "chart-tooltip-indicator-none": { label: /^2024-07-17$/, indicators: 0 },
  "chart-tooltip-label-custom": { label: /^Activities$/, indicator: "line", indicators: 2 },
  "chart-tooltip-label-formatter": { label: /^July 17, 2024$/, indicators: 2 },
  "chart-tooltip-label-none": { label: null, indicators: 0 },
  "chart-tooltip-formatter": { label: null, text: /^Running 520 kcal Swimming 120 kcal$/ },
  "chart-tooltip-icons": { label: null, icons: 2, text: /^Running 520 Swimming 120$/ },
  "chart-tooltip-advanced": {
    label: null,
    text: /^Running 520 kcal Swimming 120 kcal Total 640 kcal$/,
  },
};

// Radial bar focus, as Recharts' radial chart: inside the chart's ring and angle range, the
// pointer opens the band nearest by radius, also in a gap between rings and on the track past a
// bar end. Outside that range, nothing opens. Each hover is a radius in pixels on a 250px chart,
// a Recharts angle in degrees (3 o'clock, counterclockwise), the tooltip text or `null` for no
// tooltip, and the shape under the pointer: "gap" for no bar and no track, or "track".
// The bands of chart-radial-simple reach from 31.6 to 44.4 (Chrome) and from 47.6 to 60.4
// (Safari), so the gap between them splits at 46. Its Other bar ends at 118 degrees.
const BAND_FOCUS = {
  "chart-radial-simple": [
    [45.2, 90, /^Chrome 275$/, "gap"],
    [46.8, 90, /^Safari 200$/, "gap"],
    [102, 160, /^Other 90$/, "track"],
    // The outer edge itself is inside the ring.
    [110, 90, /^Other 90$/],
    [15, 45, null],
    [118, 45, null],
  ],
  // The Other bar ends at 64 degrees, and the track runs on to 380 degrees.
  "chart-radial-label": [[102, 150, /^Other 90$/, "track"]],
  // The gap between the Edge band (73.4 to 84.6) and the Other band (87.4 to 98.6), where the
  // Edge bar end is the nearest point but the Other band is the nearest ring.
  "chart-radial-grid": [[86.7, 200, /^Other 90$/, "gap"]],
  // The half ring is above the center, so the bottom half is outside its angle range.
  "chart-radial-stacked": [
    [95, 90, /^Mobile 570 Desktop 1,260$/],
    [95, 270, null],
  ],
};

// Keyboard focus on radial bars opens the first band, and each Arrow Right moves to the next band.
const BAND_KEYS = {
  "chart-radial-simple": [
    /^Chrome 275$/,
    /^Safari 200$/,
    /^Firefox 187$/,
    /^Edge 173$/,
    /^Other 90$/,
  ],
  "chart-radial-stacked": [/^Mobile 570 Desktop 1,260$/],
};

const FULL_WIDTH = new Set([
  "chart-area-interactive",
  "chart-bar-interactive",
  "chart-line-interactive",
]);

const APPS = {
  astro: { dir: "apps/demo", path: (type) => `/runtime-charts/${type}/` },
  react: { dir: "apps/react-demo", path: (type) => `/runtime-charts/${type}` },
  vue: { dir: "apps/vue-demo", path: (type) => `/review/charts/${type}` },
  svelte: { dir: "apps/svelte-demo", path: (type) => `/review/charts/${type}/` },
};

for (const framework of frameworks) {
  if (!APPS[framework]) throw new Error(`Unknown framework "${framework}".`);
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, child) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) throw new Error(`${url} server exited early.`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${url} did not start in time.`);
}

async function startApp(framework) {
  const app = APPS[framework];
  const cwd = path.join(root, app.dir);
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  if (framework === "astro") {
    const server = await startAstroSmokeDevServer({
      root: cwd,
      host: "127.0.0.1",
      port,
      astroPackagePath: path.join(cwd, "package.json"),
    });
    const stop = () => server.stop();
    await waitForServer(`${baseUrl}${app.path("area")}`).catch(async (error) => {
      await stop();
      throw error;
    });
    return { baseUrl, stop };
  }
  // SvelteKit reads its config from the working folder, so each Vite app runs in its own folder.
  const vitePackage = createRequire(path.join(cwd, "package.json")).resolve("vite/package.json");
  const vite = path.join(path.dirname(vitePackage), "bin/vite.js");
  const child = spawn(
    process.execPath,
    [vite, "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd,
      stdio: ["ignore", "ignore", "inherit"],
    },
  );
  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill("SIGTERM");
    await exited;
  };
  await waitForServer(`${baseUrl}/`, child).catch(async (error) => {
    await stop();
    throw error;
  });
  return { baseUrl, stop };
}

async function setTheme(page, theme) {
  await page.evaluate((value) => {
    localStorage.setItem("colorTheme", value);
    document.documentElement.classList.toggle("dark", value === "dark");
  }, theme);
}

async function cardShape(card, marks) {
  return card.evaluate((node, marks) => {
    const root = node.querySelector('[data-slot="chart"]');
    const svg = node.querySelector('[data-slot="chart-surface"] svg.ts-chart');
    const box = svg?.getBoundingClientRect();
    return {
      title: node.querySelector("h3")?.textContent?.trim() ?? "",
      state: root?.getAttribute("data-state") ?? "",
      marks: Object.fromEntries(
        Object.keys(marks).map((mark) => [
          mark,
          [...(svg?.querySelectorAll("path, rect, circle, line, text") ?? [])].filter((shape) =>
            shape.getAttribute("data-ts-key")?.startsWith(`${mark}:`),
          ).length,
        ]),
      ),
      width: box?.width ?? 0,
      height: box?.height ?? 0,
      span: getComputedStyle(node).gridColumnEnd,
    };
  }, marks);
}

/** The card's own tooltip when it is open and fully shown, not fading in or out. */
function shownTooltip(card) {
  const tooltip = card.querySelector(".ts-chart-tooltip");
  const body = tooltip?.querySelector('[data-slot="chart-tooltip-content"]');
  if (!tooltip || !body || !tooltip.matches(":popover-open")) return null;
  if (getComputedStyle(tooltip).opacity !== "1" || body.getBoundingClientRect().width === 0) {
    return null;
  }
  const rows = body.querySelectorAll('[data-slot="chart-tooltip-item"]').length;
  // Formatted rows put their parts in nested elements. A space between elements keeps words apart.
  const words = (node) =>
    [...node.childNodes]
      .map((child) => (child.nodeType === 1 ? ` ${words(child)} ` : (child.textContent ?? "")))
      .join("");
  const text = words(body).replace(/\s+/g, " ").trim();
  const label = body.querySelector(
    ':scope > [data-slot="chart-tooltip-label"], [data-slot="chart-tooltip-name"] > [data-slot="chart-tooltip-label"]',
  );
  return rows > 0 && /\d/.test(text)
    ? {
        rows,
        text,
        label: label?.textContent?.trim() ?? null,
        indicator: body.getAttribute("data-indicator"),
        indicators: body.querySelectorAll('[data-slot="chart-tooltip-indicator"]').length,
        icons: body.querySelectorAll('[data-slot="chart-tooltip-icon"]').length,
        indicatorColors: [...body.querySelectorAll('[data-slot="chart-tooltip-indicator"]')].map(
          (indicator) => {
            const style = getComputedStyle(indicator);
            // A dashed indicator paints its border; a dot or line indicator paints its background.
            return body.getAttribute("data-indicator") === "dashed"
              ? style.borderTopColor
              : style.backgroundColor;
          },
        ),
      }
    : null;
}

/** Hovers the chart and checks that no tooltip opens, for cards that turn it off. */
async function verifyNoTooltip(page, card, label) {
  const svg = card.locator("svg.ts-chart");
  await svg.scrollIntoViewIfNeeded();
  const box = await svg.boundingBox();
  for (const [x, y] of [
    [0.3, 0.5],
    [0.5, 0.2],
    [0.7, 0.5],
  ]) {
    await page.mouse.move(box.x + box.width * x, box.y + box.height * y);
    await page.waitForTimeout(250);
  }
  const open = await card.evaluate(
    (node) =>
      [...node.querySelectorAll(".ts-chart-tooltip")].some((tooltip) =>
        tooltip.matches(":popover-open"),
      ) || node.querySelector('[data-slot="chart-tooltip-content"]') !== null,
  );
  await page.mouse.move(0, 0);
  if (open) throw new Error(`${label} opened a tooltip, but shadcn's card has none.`);
}

function verifyTooltipLook(id, tooltip, label) {
  const look = TOOLTIP_LOOK[id];
  if (!look) return;
  const problems = [];
  const labelWrong =
    look.label === null
      ? tooltip.label !== null
      : look.label !== undefined && !look.label.test(tooltip.label ?? "");
  if (labelWrong) problems.push(`label ${JSON.stringify(tooltip.label)}`);
  if (look.indicator && tooltip.indicator !== look.indicator) {
    problems.push(`indicator ${tooltip.indicator}`);
  }
  if (look.indicators !== undefined && tooltip.indicators !== look.indicators) {
    problems.push(`${tooltip.indicators} indicators`);
  }
  if (look.rows !== undefined && tooltip.rows !== look.rows) problems.push(`${tooltip.rows} rows`);
  if (look.icons !== undefined && tooltip.icons !== look.icons) {
    problems.push(`${tooltip.icons} icons`);
  }
  if (look.text && !look.text.test(tooltip.text))
    problems.push(`text ${JSON.stringify(tooltip.text)}`);
  if (problems.length > 0) {
    throw new Error(`${label} tooltip does not match shadcn: ${problems.join(", ")}`);
  }
}

async function verifyTooltip(page, card, label, id) {
  const svg = card.locator("svg.ts-chart");
  await svg.scrollIntoViewIfNeeded();
  const box = await svg.boundingBox();
  const handle = await card.elementHandle();
  // Hover a point left of center, then the center, then the left side, as a reader scans.
  const points = HOVER[id] ?? [
    [0.42, 0.55],
    [0.5, 0.55],
    [0.25, 0.55],
  ];
  for (const [x, y] of points) {
    await page.mouse.move(box.x + box.width * x, box.y + box.height * y);
    const tooltip = await page
      .waitForFunction(shownTooltip, handle, { timeout: 2_000 })
      .then((result) => result.jsonValue())
      .catch(() => null);
    if (tooltip) {
      if (tooltip.indicatorColors.some(transparent)) {
        throw new Error(`${label} has a transparent tooltip indicator: ${tooltip.indicatorColors}`);
      }
      await page.mouse.move(0, 0);
      return tooltip;
    }
  }
  throw new Error(`${label} showed no tooltip of its own with values on hover.`);
}

// Any color with zero alpha paints nothing, whatever its channels.
const transparent = (color) =>
  /^transparent$|^rgba\(([^,]+,){3}\s*0(\.0+)?\)$|\/\s*0(\.0+)?\)$/.test(color);

/** True when the card has an open tooltip, shown or fading. */
const tooltipOpen = (node) =>
  [...node.querySelectorAll(".ts-chart-tooltip")].some((tooltip) =>
    tooltip.matches(":popover-open"),
  );

/** Polls the card until its shown tooltip text matches, and returns the last tooltip seen. */
async function waitForTooltipText(card, pattern) {
  let tooltip = null;
  for (let tries = 0; tries < 20; tries++) {
    tooltip = await card.evaluate(shownTooltip);
    if (tooltip && pattern.test(tooltip.text)) return { tooltip, matched: true };
    await card.page().waitForTimeout(100);
  }
  return { tooltip, matched: false };
}

/** Moves the pointer off the chart and waits until its tooltip closes. */
async function leaveChart(page, card) {
  await page.mouse.move(0, 0);
  await page.waitForFunction(
    (node) =>
      ![...node.querySelectorAll(".ts-chart-tooltip")].some((tooltip) =>
        tooltip.matches(":popover-open"),
      ),
    await card.elementHandle(),
    { timeout: 2_000 },
  );
}

/** Hovers radial bars at polar points and checks the band each point opens. */
async function verifyBandFocus(page, card, label, id) {
  const hovers = BAND_FOCUS[id];
  if (!hovers) return;
  const svg = card.locator("svg.ts-chart");
  await svg.scrollIntoViewIfNeeded();
  await leaveChart(page, card);
  const box = await svg.boundingBox();
  const scale = box.width / 250;
  for (const [radius, degrees, pattern, on] of hovers) {
    const angle = (degrees * Math.PI) / 180;
    const x = box.x + box.width / 2 + radius * scale * Math.cos(angle);
    const y = box.y + box.height / 2 - radius * scale * Math.sin(angle);
    const name = `${label} at radius ${radius} and ${degrees} degrees`;
    const shape = await page.evaluate(
      ([x, y]) =>
        document.elementFromPoint(x, y)?.getAttribute("data-ts-key")?.split(":")[0] ?? null,
      [x, y],
    );
    const shapeWrong = on === "gap" ? shape === "bars" || shape === "track" : on && shape !== on;
    if (shapeWrong) throw new Error(`${name} is on "${shape}", but the hover is for "${on}".`);
    await page.mouse.move(x, y);
    if (pattern === null) {
      await page.waitForTimeout(500);
      if (await card.evaluate(tooltipOpen)) {
        throw new Error(`${name} opened a tooltip outside the chart's ring and angle range.`);
      }
      continue;
    }
    const { tooltip, matched } = await waitForTooltipText(card, pattern);
    if (!matched) {
      throw new Error(`${name} showed ${JSON.stringify(tooltip?.text ?? null)}, not ${pattern}.`);
    }
    if (tooltip.indicatorColors.some(transparent)) {
      throw new Error(`${name} has a transparent tooltip indicator: ${tooltip.indicatorColors}`);
    }
    await leaveChart(page, card);
  }
}

/** Focuses radial bars, presses Arrow Right between steps, and checks the band of each step. */
async function verifyBandKeys(page, card, label, id) {
  const steps = BAND_KEYS[id];
  if (!steps) return;
  const svg = card.locator("svg.ts-chart[tabindex]");
  await svg.focus();
  try {
    for (const [index, pattern] of steps.entries()) {
      if (index > 0) await page.keyboard.press("ArrowRight");
      const { tooltip, matched } = await waitForTooltipText(card, pattern);
      if (!matched) {
        throw new Error(
          `${label} keyboard step ${index} showed ${JSON.stringify(tooltip?.text ?? null)}, not ${pattern}.`,
        );
      }
    }
  } finally {
    await svg.blur();
  }
}

/**
 * Waits for an exact card state, so a cleared tooltip or a hover change never counts as a redraw.
 * `check` runs in the page, so it must not use variables from this module.
 */
async function waitForCard(page, card, check, arg, label) {
  await page
    .waitForFunction(
      ([node, value, source]) => new Function(`return (${source})`)()(node, value),
      [await card.elementHandle(), arg, check.toString()],
      { timeout: 5_000 },
    )
    .catch((error) => {
      throw new Error(`${label}.\n${error}`);
    });
}

function showsRange(node, range) {
  const ticks = [...node.querySelectorAll('svg.ts-chart [data-ts-key^="x-tick-label"]')].map(
    (tick) => tick.textContent ?? "",
  );
  return range === "7d"
    ? ticks.some((tick) => tick.includes("Jun 30")) && !ticks.some((tick) => /Apr|May/.test(tick))
    : ticks.includes("Apr 1");
}

function showsSeries(node, key) {
  const mark = node.querySelector(
    "svg.ts-chart rect[data-ts-key^='bars:'], svg.ts-chart path[data-ts-key^='lines:']",
  );
  const paint = mark?.tagName === "path" ? mark.getAttribute("stroke") : mark?.getAttribute("fill");
  const button = node.querySelector(`button[data-chart-gallery-series="${key}"]`);
  return String(paint).includes(`-${key})`) && button?.getAttribute("data-active") === "true";
}

/** The active slice and the center value follow the month select. */
function showsMonth(node, [month, value]) {
  const slice = node.querySelector('svg.ts-chart [data-ts-key^="active-slice:"]');
  const center = node.querySelector('svg.ts-chart [data-ts-key^="center-value:"]');
  return (
    String(slice?.getAttribute("data-ts-key")).includes(month) &&
    center?.textContent?.trim() === value
  );
}

async function verifyActiveControl(page, card, label) {
  const select = card.locator("select[data-chart-gallery-active]");
  await waitForCard(
    page,
    card,
    showsMonth,
    ["january", "186"],
    `${label} does not start on January`,
  );
  await select.selectOption("march");
  await waitForCard(page, card, showsMonth, ["march", "237"], `${label} did not switch to March`);
  await select.selectOption("january");
  await waitForCard(page, card, showsMonth, ["january", "186"], `${label} did not switch back`);
}

async function verifyRangeControl(page, card, label) {
  const select = card.locator("select[data-chart-gallery-range]");
  await select.selectOption("7d");
  await waitForCard(page, card, showsRange, "7d", `${label} did not show the last 7 days`);
  await select.selectOption("90d");
  await waitForCard(page, card, showsRange, "90d", `${label} did not show the last 3 months`);
}

async function verifySeriesControl(page, card, label) {
  await waitForCard(page, card, showsSeries, "desktop", `${label} does not start on Desktop`);
  await card.locator('button[data-chart-gallery-series="mobile"]').click();
  await waitForCard(page, card, showsSeries, "mobile", `${label} did not switch to Mobile`);
  await card.locator('button[data-chart-gallery-series="desktop"]').click();
  await waitForCard(page, card, showsSeries, "desktop", `${label} did not switch back to Desktop`);
}

async function verifyView({ page, framework, baseUrl, type }) {
  await page.goto(`${baseUrl}${APPS[framework].path(type)}`, { waitUntil: "networkidle" });
  // A dev server reload resets the page mid-check. The caller may check such a view again.
  let reloads = 0;
  const onLoad = () => reloads++;
  page.on("load", onLoad);
  try {
    return await checkView({ page, framework, type });
  } catch (error) {
    error.reloaded = reloads > 0;
    throw error;
  } finally {
    page.off("load", onLoad);
  }
}

/**
 * Visits every view until one full pass sees no reload. The first visits make Vite optimize
 * dependencies, and it reloads the page when that finishes.
 */
async function warmUp({ page, framework, baseUrl }) {
  for (let pass = 0; pass < 4; pass++) {
    let reloads = 0;
    const onLoad = () => reloads++;
    for (const [type] of NAV) {
      await page.goto(`${baseUrl}${APPS[framework].path(type)}`, { waitUntil: "networkidle" });
      const before = reloads;
      page.on("load", onLoad);
      const active = await page
        .waitForFunction(
          () =>
            [...document.querySelectorAll('[data-slot="chart"]')].every(
              (root) => root.getAttribute("data-state") === "active",
            ),
          undefined,
          { timeout: 20_000 },
        )
        .then(
          () => true,
          () => false,
        );
      await page.waitForTimeout(500);
      page.off("load", onLoad);
      // A timeout with no reload is a broken view, not a busy dev server.
      if (!active && reloads === before) {
        const pending = await page.evaluate(() =>
          [...document.querySelectorAll('[data-slot="chart"]')]
            .filter((root) => root.getAttribute("data-state") !== "active")
            .map((root) => root.getAttribute("data-chart") ?? root.id),
        );
        throw new Error(
          `${framework} ${type}: charts did not become active: ${JSON.stringify(pending)}`,
        );
      }
    }
    if (reloads === 0) return;
  }
  throw new Error(`${framework} dev server kept reloading pages during the warm-up.`);
}

async function checkView({ page, framework, type }) {
  const label = `${framework} ${type}`;
  const gallery = page.locator(`[data-chart-gallery="${type}"]`);
  await gallery.waitFor({ timeout: 15_000 });

  const nav = await gallery
    .locator("[data-chart-gallery-nav]")
    .evaluateAll((links) =>
      links.map((link) => [
        link.getAttribute("data-chart-gallery-nav"),
        link.textContent?.trim(),
        link.getAttribute("aria-current"),
      ]),
    );
  const expectedNav = NAV.map(([key, text]) => [key, text, key === type ? "page" : null]);
  if (JSON.stringify(nav) !== JSON.stringify(expectedNav)) {
    throw new Error(`${label} nav is wrong: ${JSON.stringify(nav)}`);
  }

  const cards = gallery.locator("[data-chart-gallery-card]");
  const ids = await cards.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-chart-gallery-card")),
  );
  const expected = VARIANTS[type];
  if (JSON.stringify(ids) !== JSON.stringify(expected.map(([id]) => id))) {
    throw new Error(`${label} cards are not in shadcn order: ${JSON.stringify(ids)}`);
  }

  for (const [id, title] of expected) {
    const card = gallery.locator(`[data-chart-gallery-card="${id}"]`);
    const name = `${label} ${id}`;
    await card.scrollIntoViewIfNeeded();
    await card
      .locator('[data-slot="chart"][data-state="active"]')
      .waitFor({ timeout: 10_000 })
      .catch((error) => {
        throw new Error(`${name} chart did not become active.\n${error}`);
      });
    const expectedMarks = DATA_MARKS[id] ?? {};
    const shape = await cardShape(card, expectedMarks);
    const fullWidth = shape.span === "span 3" || shape.span === "-1";
    if (
      shape.title !== title ||
      Object.keys(expectedMarks).length === 0 ||
      JSON.stringify(shape.marks) !== JSON.stringify(expectedMarks) ||
      shape.width === 0 ||
      shape.height === 0 ||
      FULL_WIDTH.has(id) !== fullWidth
    ) {
      throw new Error(`${name} has an unexpected shape: ${JSON.stringify(shape)}`);
    }
    if (NO_TOOLTIP.has(id)) {
      await verifyNoTooltip(page, card, name);
    } else {
      verifyTooltipLook(id, await verifyTooltip(page, card, name, id), name);
      await verifyBandFocus(page, card, name, id);
      await verifyBandKeys(page, card, name, id);
    }
    if (id === "chart-pie-interactive") await verifyActiveControl(page, card, name);
    if (id === "chart-area-interactive") await verifyRangeControl(page, card, name);
    if (id === "chart-bar-interactive" || id === "chart-line-interactive") {
      await verifySeriesControl(page, card, name);
    }
  }
  return expected.length;
}

async function saveScreenshots({ page, framework, baseUrl }) {
  mkdirSync(screenshots, { recursive: true });
  for (const theme of ["light", "dark"]) {
    for (const [type] of NAV) {
      await page.goto(`${baseUrl}${APPS[framework].path(type)}`, { waitUntil: "networkidle" });
      await setTheme(page, theme);
      await page.locator(`[data-chart-gallery="${type}"]`).waitFor();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(screenshots, `${framework}-${type}-${theme}.png`),
        fullPage: true,
      });
    }
  }
}

if (frameworks.includes("svelte") && !skipBuild) {
  for (const name of ["@starwind-ui/runtime", "@starwind-ui/svelte"]) {
    execFileSync("pnpm", ["--filter", name, "build"], { cwd: root, stdio: "inherit" });
  }
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const failures = [];
try {
  for (const framework of frameworks) {
    const app = await startApp(framework);
    const warm = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    try {
      await warmUp({ page: warm, framework, baseUrl: app.baseUrl });
    } catch (error) {
      await app.stop();
      failures.push(error);
      console.error(`not ok ${framework}: ${error.message}`);
      continue;
    } finally {
      await warm.close();
    }
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const messages = [];
    page.on("console", (message) => {
      if (message.type() === "error") messages.push(`console error: ${message.text()}`);
    });
    page.on("pageerror", (error) => messages.push(`page error: ${error.message}`));
    await page.addInitScript(() => {
      try {
        localStorage.setItem("colorTheme", "light");
      } catch {
        // Storage can be unavailable on the initial blank document.
      }
    });
    try {
      let count = 0;
      for (const [type] of NAV.filter(([key]) => !views || views.includes(key))) {
        try {
          count += await verifyView({ page, framework, baseUrl: app.baseUrl, type });
        } catch (error) {
          if (!error.reloaded) throw error;
          // Errors logged before the reload stay in `messages`, so a crash still fails the run.
          console.log(
            `${framework} ${type}: the dev server reloaded the page, checking again (${error.message.split("\n")[0]})`,
          );
          count += await verifyView({ page, framework, baseUrl: app.baseUrl, type });
        }
      }
      if (messages.length > 0)
        throw new Error(`${framework} logged errors:\n${messages.join("\n")}`);
      if (screenshots) await saveScreenshots({ page, framework, baseUrl: app.baseUrl });
      console.log(`ok ${framework}: ${views?.length ?? NAV.length} views, ${count} charts`);
    } catch (error) {
      failures.push(error);
      console.error(`not ok ${framework}: ${error.message}`);
    } finally {
      await page.close();
      await app.stop();
    }
  }
} finally {
  await browser.close();
}

if (failures.length > 0) process.exit(1);
