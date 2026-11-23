// Shared harness for the chart parity suite. Every case starts from server markup: React and Vue
// render it here, and the global setup renders Astro and Svelte in Node. With JavaScript, React,
// Vue and Svelte hydrate that markup, and Astro starts it as its lifecycle script does.
import { createChart, getChartController, startCharts } from "@starwind-ui/runtime/chart";
import { hydrateRoot } from "react-dom/client";
import { renderToString as renderReact } from "react-dom/server.browser";
import { flushSync, hydrate, unmount } from "svelte";
import { expect, inject, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createSSRApp, h, nextTick } from "vue";
import { renderToString as renderVue } from "vue/server-renderer";

import type { ParityCase } from "./fixtures/cases";
import type { ParityControls } from "./fixtures/controls";
import { parityDefinition } from "./fixtures/modules";
import ParityReact from "./fixtures/ParityReact";
import ParitySvelte from "./fixtures/ParitySvelte.svelte";
import ParityVue from "./fixtures/parity-vue";
import type { ServerFixtures, ServerResult } from "./server/render-fixtures";

export const FRAMEWORKS = ["astro", "react", "vue", "svelte"] as const;
export type Framework = (typeof FRAMEWORKS)[number];

const server = (await (await fetch(inject("chartParityServerUrl"))).json()) as ServerFixtures;

export const astroExports = server.astroExports;
export const astroStyledExports = server.astroStyledExports;

function nodeResult(result: ServerResult | undefined, name: string): string {
  if (!result) throw new Error(`Missing server fixture "${name}".`);
  if ("error" in result) throw new Error(`Server fixture "${name}" failed: ${result.error}`);
  return result.html;
}

/** The server markup of one case, as each framework renders it before any script runs. */
export async function serverHtml(framework: Framework, mode: ParityCase): Promise<string> {
  if (framework === "react") return renderReact(<ParityReact mode={mode} />);
  if (framework === "vue") return renderVue(createSSRApp({ render: () => h(ParityVue, { mode }) }));
  return nodeResult(server[framework][mode], `${framework}/${mode}`);
}

/** Parses server markup without running any script, as a browser with JavaScript off does. */
export function parseServer(html: string): Document {
  return new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
}

export async function settle(): Promise<void> {
  flushSync();
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  flushSync();
  await nextTick();
}

export interface Mounted {
  framework: Framework;
  mode: ParityCase;
  element: HTMLDivElement;
  controls: ParityControls;
  /** Hydration and framework warnings logged while the case mounted. */
  warnings: string[];
  /** The SVG from the server markup, before any script ran. */
  serverSvg: SVGSVGElement | null;
  destroy(): Promise<void>;
}

const mounted: Mounted[] = [];

/** Puts the server markup on the page and starts it with JavaScript. */
export async function start(framework: Framework, mode: ParityCase): Promise<Mounted> {
  const html = await serverHtml(framework, mode);
  const element = document.createElement("div");
  element.style.width = "600px";
  element.innerHTML = html;
  document.body.append(element);
  const serverSvg = element.querySelector<SVGSVGElement>("svg.ts-chart");
  const controls: ParityControls = {};
  const warnings: string[] = [];
  const record = (...args: unknown[]) => warnings.push(args.map(String).join(" "));
  const error = vi.spyOn(console, "error").mockImplementation(record);
  const warn = vi.spyOn(console, "warn").mockImplementation(record);
  let destroy: () => Promise<void> | void;
  try {
    if (framework === "react") {
      const root = hydrateRoot(element, <ParityReact mode={mode} controls={controls} />, {
        onRecoverableError: (cause) => record(cause),
      });
      destroy = () => root.unmount();
    } else if (framework === "vue") {
      const app = createSSRApp({ render: () => h(ParityVue, { mode, controls }) });
      app.config.warnHandler = (message) => record(message);
      app.mount(element);
      destroy = () => app.unmount();
    } else if (framework === "svelte") {
      const instance = hydrate(ParitySvelte, { target: element, props: { mode, controls } });
      destroy = () => unmount(instance);
    } else {
      startCharts();
      // A native definition cannot travel from the server, so the page passes it to createChart.
      if (mode === "definition") {
        createChart(element.querySelector<HTMLElement>('[data-slot="chart"]')!, {
          definition: parityDefinition,
        });
      }
      destroy = () => {
        for (const root of element.querySelectorAll<HTMLElement>('[data-slot="chart"]'))
          getChartController(root)?.destroy();
      };
    }
    await settle();
    await settle();
  } finally {
    error.mockRestore();
    warn.mockRestore();
  }
  const result: Mounted = {
    framework,
    mode,
    element,
    controls,
    warnings,
    serverSvg,
    destroy: async () => {
      await destroy();
      element.remove();
    },
  };
  mounted.push(result);
  return result;
}

/** Unmounts every started case and clears the page. Call it from afterEach. */
export async function cleanup(): Promise<void> {
  for (const item of mounted.splice(0)) await item.destroy();
  document.body.innerHTML = "";
}

export function chartRoot(scope: ParentNode): HTMLElement {
  return scope.querySelector<HTMLElement>('[data-slot="chart"]')!;
}

export function status(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".ts-chart-tooltip[role=status]");
}

export function tooltipContent(): HTMLElement | null {
  return status()?.querySelector<HTMLElement>("[data-slot=chart-tooltip-content]") ?? null;
}

export function legends(scope: ParentNode): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>('[data-slot="chart-legend"]')];
}

export function legendItem(scope: ParentNode, key: string): HTMLElement {
  return scope.querySelector<HTMLElement>(`[data-slot="chart-legend-item"][data-key="${key}"]`)!;
}

export function barCount(scope: ParentNode): number {
  return scope.querySelectorAll('rect[data-ts-key^="visitors:"]').length;
}

/** Keys of the painted series marks, without the focus layer. */
export function paintedKeys(scope: ParentNode): string[] {
  return [...scope.querySelectorAll("svg.ts-chart [data-ts-key]")]
    .filter(
      (node) =>
        (node.getAttribute("data-ts-key") ?? "").startsWith("visitors:") &&
        !node.closest("[data-ts-focus-layer]"),
    )
    .map((node) => node.getAttribute("data-ts-key")!);
}

/** Focuses the chart and presses one key, as a keyboard user does. */
export async function press(scope: ParentNode, key: string): Promise<void> {
  const svg = scope.querySelector<SVGElement>("svg.ts-chart[tabindex]")!;
  if (document.activeElement !== svg) svg.focus();
  await userEvent.keyboard(`{${key}}`);
  await settle();
}

/** Moves focus off the chart. Blur clears the TanStack tooltip body (Escape does not). */
export async function blur(scope: ParentNode): Promise<void> {
  scope.querySelector<SVGElement>("svg.ts-chart[tabindex]")?.blur();
  await settle();
}

export async function waitForContent(): Promise<HTMLElement> {
  await vi.waitFor(() => expect(tooltipContent()).not.toBeNull());
  return tooltipContent()!;
}

/**
 * One comparable record per `data-slot` element outside the SVG: the tag, every attribute and the
 * text of leaf parts. Generated ids and React's hydration comments do not appear.
 */
export function slotShape(scope: ParentNode) {
  return [...scope.querySelectorAll<HTMLElement>("[data-slot]")]
    .filter((node) => !node.closest("svg"))
    .map((node) => ({
      tag: node.tagName.toLowerCase(),
      attributes: Object.fromEntries(
        [...node.attributes]
          .map((attribute) => [attribute.name, attribute.value] as const)
          .sort(([a], [b]) => a.localeCompare(b)),
      ),
      text: node.querySelector("[data-slot]") ? undefined : node.textContent?.trim(),
    }));
}
