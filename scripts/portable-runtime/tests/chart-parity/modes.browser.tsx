// The prototype's thirteen parity modes in Astro, React, Vue and Svelte, with and without
// JavaScript (SPEC-AC-04 to SPEC-AC-13).
import { getChartController } from "@starwind-ui/runtime/chart";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PARITY_MODES, type ParityCase } from "./fixtures/cases";
import { PARITY_ID } from "./fixtures/modules";
import {
  barCount,
  chartRoot,
  cleanup,
  FRAMEWORKS,
  legendItem,
  legends,
  type Mounted,
  paintedKeys,
  parseServer,
  press,
  serverHtml,
  settle,
  start,
  status,
  tooltipContent,
  waitForContent,
} from "./harness";

afterEach(cleanup);

/** Modes that keep the TanStack tooltip body. */
const NATIVE_BODY = new Set<ParityCase>(["native", "native-format", "primitive"]);
/** Modes whose tooltip body is a dashed ChartTooltipContent. */
const DASHED = new Set<ParityCase>(["custom", "formatter", "parts", "parts-nested"]);
/** Modes whose legend items show portable or framework icons. */
const LEGEND_ICONS = new Set<ParityCase>([
  "default",
  "custom",
  "native",
  "formatter",
  "native-format",
  "definition",
  "model",
]);

function legendCount(mode: ParityCase): number {
  return mode === "off" ? 0 : 1;
}

/** Assertions on server markup with JavaScript off. */
function expectServer(doc: Document, mode: ParityCase) {
  expect(doc.querySelectorAll("svg.ts-chart")).toHaveLength(1);
  expect(chartRoot(doc).dataset.chart).toBe(PARITY_ID);
  // The only style is the config color style. No part injects component CSS.
  expect(doc.querySelectorAll("style")).toHaveLength(1);
  expect(doc.querySelectorAll("style[data-slot=chart-style]")).toHaveLength(1);
  // No tooltip body is on the page before a point has focus.
  expect(doc.querySelector("[data-slot=chart-tooltip-content]")).toBeNull();
  expect(legends(doc)).toHaveLength(legendCount(mode));
  if (mode === "off") return;

  const items = [...doc.querySelectorAll<HTMLElement>('[data-slot="chart-legend-item"]')];
  expect(items.map((item) => item.dataset.key)).toEqual(["desktop", "mobile"]);
  if (mode === "definition") {
    // A direct native definition owns its visibility, so its legend is passive.
    expect(items.map((item) => item.tagName)).toEqual(["SPAN", "SPAN"]);
  } else {
    expect(items.map((item) => item.tagName)).toEqual(["BUTTON", "BUTTON"]);
    expect(items.map((item) => item.getAttribute("aria-pressed"))).toEqual(["true", "true"]);
  }
  const desktop = legendItem(doc, "desktop");
  if (mode === "primitive") {
    expect(desktop.textContent?.trim()).toBe("Desktop");
  } else {
    // A rich config label renders in the legend and keeps an accessible name (ticket 04).
    expect(desktop.querySelector("strong[data-rich-label]")?.textContent).toMatch(/Desktop\s+web/);
    expect(desktop.getAttribute("aria-label")).toBe("Desktop");
    const visuals = items.map((item) =>
      item.querySelector("[data-slot=chart-legend-icon]") ? "icon" : "swatch",
    );
    expect(visuals).toEqual(LEGEND_ICONS.has(mode) ? ["icon", "icon"] : ["swatch", "swatch"]);
  }
  if (mode === "default") {
    expect(legendItem(doc, "mobile").querySelector("[data-component-icon]")).not.toBeNull();
  }
  if (mode === "custom") expect(legends(doc)[0]!.hasAttribute("data-replacement")).toBe(true);
  if (mode === "parts-nested") {
    expect(doc.querySelectorAll("[data-wrapper] [data-slot=chart-legend]")).toHaveLength(1);
  }
}

/** Assertions on the tooltip that a keyboard user opens with Home. */
async function expectTooltip(mounted: Mounted) {
  const { element, mode } = mounted;
  await press(element, "Home");
  if (mode === "off") {
    await settle();
    expect(tooltipContent()).toBeNull();
    expect(status()?.textContent ?? "").toBe("");
    return;
  }
  if (NATIVE_BODY.has(mode)) {
    await vi.waitFor(() => expect(status()?.textContent).toMatch(/186/));
    expect(tooltipContent()).toBeNull();
    expect(status()!.textContent).toBe(
      mode === "native-format" ? "Native 186" : "JanuaryDesktop186Mobile80",
    );
    return;
  }
  const content = await waitForContent();
  const tooltip = status()!;
  expect(content.dataset.indicator).toBe(DASHED.has(mode) ? "dashed" : "dot");
  expect(content.dataset.nested).toBe("false");
  const rows = [...content.querySelectorAll<HTMLElement>("[data-slot=chart-tooltip-item]")];
  expect(rows.map((row) => row.dataset.key)).toEqual(["desktop", "mobile"]);
  for (const row of rows) expect(row.getAttribute("aria-hidden")).toBe("true");
  await vi.waitFor(() => expect(tooltip.getAttribute("aria-label")).toContain("186"));
  const label = tooltip.getAttribute("aria-label")!;
  const heading = content.querySelector("[data-slot=chart-tooltip-label]");

  if (mode === "formatter") {
    expect(content.querySelectorAll("[data-formatter]")).toHaveLength(2);
    expect(content.querySelectorAll("[data-number=number][data-same=true]")).toHaveLength(2);
    expect(content.querySelector("[data-label-formatter]")?.textContent).toBe("January · 2 series");
    expect(label).toContain("visits");
    expect(label).not.toContain(".sw-chart-");
    return;
  }
  if (mode === "preset") {
    // The module preset hides the heading and the indicators.
    expect(heading).toBeNull();
    expect(content.querySelectorAll("[data-slot=chart-tooltip-indicator]")).toHaveLength(0);
    expect(label.startsWith("Desktop web 186 Mobile 80")).toBe(true);
    return;
  }
  expect(heading?.textContent).toBe("January");
  expect(label.startsWith("January Desktop web 186 Mobile 80")).toBe(true);
  expect(content.querySelector("strong[data-rich-label]")?.textContent).toMatch(/Desktop\s+web/);
  if (mode === "indicator") {
    expect(content.querySelectorAll("[data-slot=chart-tooltip-indicator]")).toHaveLength(2);
    expect(content.querySelectorAll("[data-slot=chart-tooltip-icon]")).toHaveLength(0);
    return;
  }
  // A row whose config entry has an icon shows the icon and no indicator (ticket 04).
  for (const row of rows) {
    expect(row.querySelector("[data-slot=chart-tooltip-icon] svg")).not.toBeNull();
    expect(row.querySelector("[data-slot=chart-tooltip-indicator]")).toBeNull();
  }
  if (mode === "default") {
    expect(content.querySelectorAll("[data-component-icon]")).toHaveLength(1);
  }
}

/** Legend toggles rebuild the geometry and the tooltip rows from the visible keys. */
async function expectToggle(mounted: Mounted) {
  const { element, mode } = mounted;
  const desktop = legendItem(element, "desktop");
  if (mode === "definition") {
    desktop.click();
    await settle();
    expect(barCount(element)).toBe(6);
    return;
  }
  desktop.click();
  await settle();
  expect(desktop.getAttribute("aria-pressed")).toBe("false");
  expect(desktop.dataset.state).toBe("off");
  expect(barCount(element)).toBe(3);
  expect(paintedKeys(element).some((key) => key.includes("desktop"))).toBe(false);
  await press(element, "Home");
  // The hover marks follow the visible keys (SPEC-AC-10).
  const hover = [...element.querySelectorAll("[data-ts-focus-layer] [data-ts-key]")].map(
    (node) => node.getAttribute("data-ts-key")!,
  );
  expect(hover.length).toBeGreaterThan(0);
  expect(hover.some((key) => key.includes("desktop"))).toBe(false);
  if (NATIVE_BODY.has(mode)) {
    await vi.waitFor(() => expect(status()?.textContent).toMatch(/80/));
    expect(status()!.textContent).not.toContain("186");
    return;
  }
  await vi.waitFor(() =>
    expect(tooltipContent()?.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(1),
  );
  const content = tooltipContent()!;
  expect(content.querySelector("[data-slot=chart-tooltip-item]")!.dataset.key).toBe("mobile");
  await vi.waitFor(() => expect(status()!.getAttribute("aria-label")).not.toContain("186"));
  // One row with a line or dashed indicator nests the heading inside the name (SPEC-AC-12).
  const nested = DASHED.has(mode);
  expect(content.dataset.nested).toBe(String(nested));
  if (mode === "formatter" || mode === "preset") return;
  const topHeading = content.querySelector(":scope > [data-slot=chart-tooltip-label]");
  const nameHeading = content.querySelector(
    "[data-slot=chart-tooltip-name] > [data-slot=chart-tooltip-label]",
  );
  expect(topHeading === null).toBe(nested);
  expect(nameHeading?.tagName ?? null).toBe(nested ? "SPAN" : null);
  if (nested) {
    expect(nameHeading!.textContent).toBe("January");
    await vi.waitFor(() =>
      expect(status()!.getAttribute("aria-label")).toMatch(/^January Mobile 80\n/),
    );
  }
}

/**
 * The model mode. The parent accepts "mobile" alone and refuses every other change. Astro has no
 * parent component, so the page cancels the event and calls the controller.
 */
async function expectModel(mounted: Mounted) {
  const { element, framework, controls } = mounted;
  const root = chartRoot(element);
  let astroAccepted = "desktop,mobile";
  let astroChanges = 0;
  if (framework === "astro") {
    const controller = getChartController(root)!;
    root.addEventListener("starwind-chart:visible-change", (event) => {
      const { visible } = (event as CustomEvent<{ visible: string[] }>).detail;
      event.preventDefault();
      astroChanges++;
      if (visible.length === 1) {
        controller.update({ visible: ["mobile"] });
        astroAccepted = "mobile";
      }
    });
    controls.command = () => {
      controller.update({ visible: ["desktop", "mobile"] });
      astroAccepted = "desktop,mobile";
    };
  }
  const accepted = () =>
    framework === "astro" ? astroAccepted : element.querySelector("[data-accepted]")!.textContent;
  const changes = () =>
    framework === "astro"
      ? String(astroChanges)
      : element.querySelector("[data-changes]")!.textContent;
  const desktop = legendItem(element, "desktop");
  const mobile = legendItem(element, "mobile");

  desktop.click();
  await settle();
  expect(accepted()).toBe("mobile");
  expect(changes()).toBe("1");
  expect(desktop.getAttribute("aria-pressed")).toBe("false");
  expect(paintedKeys(element).some((key) => key.includes("desktop"))).toBe(false);

  mobile.click();
  await settle();
  expect(accepted()).toBe("mobile");
  expect(changes()).toBe("2");
  expect(mobile.getAttribute("aria-pressed")).toBe("true");
  expect(barCount(element)).toBe(3);

  controls.command!();
  await settle();
  expect(desktop.getAttribute("aria-pressed")).toBe("true");
  expect(barCount(element)).toBe(6);
  expect(changes()).toBe("2");
}

for (const framework of FRAMEWORKS) {
  describe(`${framework} chart parity modes`, () => {
    for (const mode of PARITY_MODES) {
      it(`${mode} without JavaScript`, async () => {
        expectServer(parseServer(await serverHtml(framework, mode)), mode);
      });

      it(`${mode} with JavaScript`, async () => {
        const mounted = await start(framework, mode);
        const { element } = mounted;
        expect(mounted.warnings).toEqual([]);
        // The browser adopts the server SVG and renders no second chart (SPEC-AC-02).
        expect(element.querySelectorAll("svg.ts-chart")).toHaveLength(1);
        expect(element.querySelector("svg.ts-chart")).toBe(mounted.serverSvg);
        expect(chartRoot(element).dataset.state).toBe("active");
        expect(legends(element)).toHaveLength(legendCount(mode));
        expect(element.querySelectorAll("[data-slot=chart-component-style]")).toHaveLength(0);

        await expectTooltip(mounted);
        if (mode === "model") await expectModel(mounted);
        else if (mode !== "off") await expectToggle(mounted);
        if (mode === "definition") {
          expect(element.querySelectorAll('button[data-slot="chart-legend-item"]')).toHaveLength(0);
        }
        if (mode.startsWith("parts")) {
          expect(element.querySelectorAll("[data-slot=chart-legend-icon]")).toHaveLength(0);
          expect(element.querySelectorAll("[data-slot=chart-legend-swatch]")).toHaveLength(2);
        }
        // The legend is opt-in: removing the wrapped ChartLegend leaves no legend. Astro has no
        // client re-render, so its server markup decides the legend.
        if (mode === "parts-nested" && framework !== "astro") {
          mounted.controls.toggleLegend!();
          await settle();
          expect(legends(element)).toHaveLength(0);
          mounted.controls.toggleLegend!();
          await settle();
          expect(legends(element)).toHaveLength(1);
          expect(element.querySelectorAll("[data-slot=chart-legend-swatch]")).toHaveLength(2);
        }
      });
    }
  });
}
