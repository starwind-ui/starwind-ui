import type { ChartValue } from "@tanstack/charts";

import type { ChartModule } from "./types";

type AnyChartModule = ChartModule<any, any, any, any>;

/**
 * Returns page state that every Runtime copy shares. A bundler can load two Runtime copies on one
 * page, for example a chart module from the Vite dependency cache and the lifecycle script from
 * `node_modules`. The registry must be one object, or a module that registers in one copy never
 * starts a chart in the other. String keys keep the shape safe from property mangling.
 */
/* @__NO_SIDE_EFFECTS__ */
export function sharedChartState<T>(key: string, create: () => T): T {
  const store = globalThis as unknown as Record<symbol, T>;
  const symbol = Symbol.for(`starwind/2/chart-${key}`);
  // biome-ignore lint/suspicious/noAssignInExpressions: lazily creates the shared value.
  return (store[symbol] ??= create());
}

const modules = () => sharedChartState("modules", () => new Map<string, AnyChartModule>());
const listeners = () => sharedChartState("module-listeners", () => new Set<() => void>());

/** Registers a module in the browser registry. The latest definition for an id wins. */
export function registerChartModule(module: AnyChartModule): void {
  modules().set(module.id, module);
  for (const listener of [...listeners()]) listener();
}

export function getChartModule(id: string | undefined): AnyChartModule | undefined {
  return id === undefined ? undefined : modules().get(id);
}

/** Calls `listener` after every module registration. Returns a function that removes it. */
export function onChartModule(listener: () => void): () => void {
  listeners().add(listener);
  return () => {
    listeners().delete(listener);
  };
}

/**
 * Defines a chart module. In a browser it also registers the module, so an Astro page needs only
 * `<script>import "./my-chart";</script>` to make its charts interactive.
 */
export function defineChartModule<
  T,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
>(module: ChartModule<T, D, X, Y>): ChartModule<T, D, X, Y> {
  if (typeof document !== "undefined") registerChartModule(module);
  return module;
}
