import type { AdapterEngineViewportFacts } from "../../framework-adapters/types.js";

export const carouselRecipe = {
  optionOrder: ["orientation", "opts"] as readonly ("orientation" | "opts")[],
};
export function carouselInputs(f: AdapterEngineViewportFacts): readonly string[] {
  return [f.options.orientation.name, f.options.opts.name, f.options.plugins.name];
}
export function carouselAxis(
  f: AdapterEngineViewportFacts,
  read: (name: string) => string,
): string {
  return `${read(f.options.orientation.name)} === "vertical" ? "${f.options.orientation.axisMap.vertical}" : "${f.options.orientation.axisMap.horizontal}"`;
}
export function carouselOptions(
  f: AdapterEngineViewportFacts,
  read: (name: string) => string,
): string {
  const entries = {
    orientation: `axis: ${carouselAxis(f, read)}`,
    opts: `...${read(f.options.opts.name)}`,
  };
  return `{ ${carouselRecipe.optionOrder.map((entry) => entries[entry]).join(", ")} }`;
}
export function carouselConnectionType(f: AdapterEngineViewportFacts): string {
  return `{ instance?: ${f.runtime.instanceType}; inputs?: ${f.runtime.optionsType}; callback?: ${f.runtime.optionsType}["${f.options.setApi.name}"] }`;
}

/** Framework observers call these operations after mount/commit. Snapshot equality suppresses
 * their initial calls and groups ordinary option replacements into one Runtime reInit. */
export function carouselLifecycle(
  f: AdapterEngineViewportFacts,
  read: (name: string) => string,
): string {
  const inputs = carouselInputs(f);
  const callback = f.options.setApi.name;
  return `function readCarouselInputs(): ${f.runtime.optionsType} {
  return { ${inputs.map((name) => `${name}: ${read(name)}`).join(", ")} };
}
function connectCarousel(root: HTMLElement): void {
  disconnectCarousel();
  const initial = readCarouselInputs();
  connection.inputs = initial;
  connection.callback = ${read(callback)};
  connection.instance = ${f.runtime.factory}(root, {
    ...initial,
    ${callback}: (api) => ${read(callback)}?.(api),
  });
}
function syncCarouselOptions(): void {
  const instance = connection.instance;
  const previous = connection.inputs;
  if (!instance || !previous) return;
  const next = readCarouselInputs();
  if (${inputs.map((name) => `next.${name} === previous.${name}`).join(" && ")}) return;
  connection.inputs = next;
  const options: ${f.runtime.optionsType}["opts"] = ${carouselOptions(f, (name) => `next.${name}`)};
  const nextPlugins = next.${f.options.plugins.name};
  instance.reInit(options, nextPlugins);
}
function publishCarouselApi(): void {
  const instance = connection.instance;
  const callback = ${read(callback)};
  if (!instance || callback === connection.callback) return;
  connection.callback = callback;
  callback?.(instance.api);
}
function disconnectCarousel(): void {
  const instance = connection.instance;
  connection.instance = undefined;
  connection.inputs = undefined;
  connection.callback = undefined;
  instance?.destroy();
}`;
}
