import { type ChartController, chartHosts, createChart, hasChartSpec } from "./controller";
import { isDevelopment } from "./datum";
import { getChartModule, onChartModule, registerChartModule, sharedChartState } from "./registry";
import type { ChartModule } from "./types";

const ROOT_SELECTOR = "[data-sw-chart]";
const WARNING_DELAY = 1000;

const flags = () => sharedChartState("lifecycle", () => new Set<string>());
const warned = () => sharedChartState("warned", () => new WeakSet<HTMLElement>());
// Controllers that the page lifecycle started. The lifecycle destroys only these, so controllers
// that a framework adapter or Raw HTML code created keep running through Astro swaps.
const started = () =>
  sharedChartState("lifecycle-controllers", () => new Set<ChartController<any, any, any, any>>());

function destroyStarted(test: (controller: ChartController<any, any, any, any>) => boolean) {
  const hosts = chartHosts();
  const controllers = started();
  for (const controller of [...controllers]) {
    if (hosts.get(controller.root) !== controller) controllers.delete(controller);
    else if (test(controller)) {
      controllers.delete(controller);
      controller.destroy();
    }
  }
}

/** Destroys every controller whose root left the document, whoever created it. */
function destroyDisconnected(): void {
  for (const [root, controller] of [...chartHosts()]) if (!root.isConnected) controller.destroy();
  destroyStarted(() => false);
}

function destroyAll(): void {
  destroyStarted(() => true);
}

function initScope(event?: Event): ParentNode {
  const root =
    event instanceof CustomEvent ? (event.detail as { root?: unknown })?.root : undefined;
  return root instanceof Element || root instanceof Document || root instanceof DocumentFragment
    ? root
    : document;
}

function chartRoots(scope: ParentNode): HTMLElement[] {
  const roots = [...scope.querySelectorAll<HTMLElement>(ROOT_SELECTOR)];
  if (scope instanceof HTMLElement && scope.matches(ROOT_SELECTOR)) roots.unshift(scope);
  return roots;
}

/** True when the lifecycle can start a root: its module is registered or it carries a spec. */
function hasSource(root: HTMLElement): boolean {
  return !!getChartModule(root.dataset.chartModule) || hasChartSpec(root);
}

/** Starts every interactive chart root in `scope` whose module is registered or that has a spec. */
export function initCharts(scope: ParentNode = document): void {
  destroyDisconnected();
  const hosts = chartHosts();
  for (const root of chartRoots(scope)) {
    if (hosts.has(root) || !hasSource(root)) continue;
    try {
      started().add(createChart(root));
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: one broken chart must not stop the others.
      console.error(error);
    }
  }
  if (isDevelopment()) scheduleMissingModuleWarning();
}

function scheduleMissingModuleWarning(): void {
  const check = () =>
    setTimeout(() => {
      const hosts = chartHosts();
      for (const root of document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)) {
        if (hosts.has(root) || warned().has(root) || hasSource(root)) continue;
        warned().add(root);
        // biome-ignore lint/suspicious/noConsole: the development warning names the import fix.
        console.warn(
          `Starwind chart "${root.dataset.chart}" is not interactive because its chart module "${root.dataset.chartModule ?? ""}" never registered. Import the module in a page script, for example <script>import "./my-chart";</script>.`,
          root,
        );
      }
    }, WARNING_DELAY);
  if (document.readyState === "complete") check();
  else window.addEventListener("load", check, { once: true });
}

/**
 * Starts Astro and Raw HTML charts on the page lifecycle. Charts start on load,
 * `astro:after-swap`, `starwind:init`, `pageshow` and when their module registers, in either load
 * order. `astro:before-swap` destroys the hosts that the lifecycle started. Any host whose root
 * leaves the document is destroyed. Charts keep running through the back-forward cache, so a page
 * that comes back keeps its drawn chart and its size. Calling it again only starts new roots.
 */
export function startCharts(): void {
  if (typeof document === "undefined") return;
  const state = flags();
  if (!state.has("listening")) {
    state.add("listening");
    document.addEventListener("astro:before-swap", destroyAll);
    document.addEventListener("astro:after-swap", () => initCharts());
    document.addEventListener("starwind:init", (event) => initCharts(initScope(event)));
    window.addEventListener("pageshow", () => initCharts());
    onChartModule(() => initCharts());
    new MutationObserver(() => {
      if (chartHosts().size) destroyDisconnected();
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  // Roots below the lifecycle script are not parsed yet while the document is loading.
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => initCharts(), { once: true });
  initCharts();
}

/** Registers modules explicitly and starts their charts. `defineChartModule` already registers. */
export function registerChartModules(...charts: ChartModule<any, any, any, any>[]): void {
  for (const chart of charts) registerChartModule(chart);
  startCharts();
}
