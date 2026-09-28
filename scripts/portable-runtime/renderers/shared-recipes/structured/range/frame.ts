import { reactSliderProjection } from "../../../framework-adapters/react/slider-recipe.js";
import { svelteSliderProjection } from "../../../framework-adapters/svelte/slider-recipe.js";
import type { AdapterRangeControlFacts } from "../../../framework-adapters/types.js";
import { vueSliderProjection } from "../../../framework-adapters/vue/slider-recipe.js";
import { initialModelValue } from "../../initial-state.js";
import { type SliderOperations, sliderConnection, sliderPolicy } from "./connection.js";
export type SliderProjection = {
  operations: SliderOperations;
  renderRead(name: string): string;
  attribute(name: string, value: string): string;
  print(input: {
    facts: AdapterRangeControlFacts;
    props: { name: string; type: string; defaultValue?: string }[];
    attributes: string;
    connection: string;
    inputs: readonly string[];
    initialDefault: string;
    initialModel: string;
  }): string;
};
export function renderSlider(
  target: "react" | "vue" | "svelte",
  facts: AdapterRangeControlFacts,
): string {
  const p = {
    react: reactSliderProjection,
    vue: vueSliderProjection,
    svelte: svelteSliderProjection,
  }[target];
  const props = Object.values(facts.props).filter((prop) => prop.name !== facts.props.index.name);
  const attributes: [[string, string], ...[string, string][]] = [
    [facts.attrs.root, '""'],
    ["data-sw-part", '"root"'],
    ["role", JSON.stringify(facts.rootRole)],
    [facts.attrs.defaultValue, "serializeValue(initialDefaultValue)"],
    [facts.attrs.value, "serializeValue(renderedValue)"],
  ];
  for (const key of sliderPolicy.options)
    attributes.push([
      facts.attrs[key],
      key === "disabled" ? `${p.renderRead(key)}?"":undefined` : p.renderRead(key),
    ]);
  return p.print({
    facts,
    props,
    attributes: attributes.map(([name, value]) => p.attribute(name, value)).join("\n"),
    connection: sliderConnection(facts, p.operations),
    inputs: sliderPolicy.options,
    initialDefault: `copyValue(${initialModelValue(p.renderRead("defaultValue"), facts.props.defaultValue.defaultValue ?? "0").replaceAll(" ?? ", "??")})`,
    initialModel: `copyValue(${initialModelValue(p.renderRead("value"), "initialDefaultValue").replaceAll(" ?? ", "??")})`,
  });
}
