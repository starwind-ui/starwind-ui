import type {
  AdapterActionSurfaceFacts,
  AdapterNativeDisabledFacts,
  AdapterRangeStatusFacts,
} from "../../framework-adapters/types.js";
import { type CommandRecipe, type Expr, recipes } from "./recipe.js";
export type SimpleFacts =
  | AdapterActionSurfaceFacts
  | AdapterNativeDisabledFacts
  | AdapterRangeStatusFacts;
/** Facts keep public names/defaults/facades. Recipe owns wiring order and conditional policy. */
export function fromFacts(kind: keyof typeof recipes, facts: SimpleFacts): CommandRecipe {
  const recipe = recipes[kind];
  const names = new Map<string, string>();
  const props = recipe.props.map((prop) => {
    const fact = facts.props[prop.name as keyof typeof facts.props] as
      | { name: string; type: string; defaultValue?: string }
      | undefined;
    if (!fact) return prop; // aria-valuetext is a native attribute input.
    names.set(prop.name, fact.name);
    return { ...prop, name: fact.name, default: fact.defaultValue ?? prop.default };
  });
  const attributeNames =
    kind === "button"
      ? (() => {
          const a = (facts as AdapterActionSurfaceFacts).attrs;
          return [
            a.root,
            a.type,
            a.focusableWhenDisabled,
            a.stateDisabled,
            a.ariaDisabled,
            a.disabled,
          ];
        })()
      : kind === "fieldset"
        ? (() => {
            const a = (facts as AdapterNativeDisabledFacts).attrs;
            return [a.root, a.disabled, a.stateDisabled];
          })()
        : (() => {
            const a = (facts as AdapterRangeStatusFacts).attrs;
            return [a.root, a.value, a.min, a.max, a.indeterminate, "role", "aria-valuetext"];
          })();
  const rename = (value: string) =>
    value.replace(/\b[A-Za-z]\w*\b/g, (token) => names.get(token) ?? token);
  const expression = (value: Expr): Expr =>
    "input" in value
      ? { input: names.get(value.input) ?? value.input }
      : {
          object: Object.fromEntries(
            Object.entries(value.object).map(([key, child]) => [key, expression(child)]),
          ),
        };
  const commands = recipe.commands.map((command) => ({
    ...command,
    observe: command.observe.map(rename),
    args: command.args.map(expression),
  }));
  if ("disabledSetter" in facts.runtime) commands[0]!.method = facts.runtime.disabledSetter.method;
  if ("setters" in facts) {
    commands[0]!.method = facts.setters.formatOptionsSetter!.method;
    commands[1]!.method = facts.setters.valueSetter!.method;
  }
  return {
    ...recipe,
    component: facts.displayName,
    rootName: facts.exports.root,
    element:
      facts.parts.root.defaultElement === recipe.tag
        ? recipe.element
        : `HTMLElementTagNameMap[${JSON.stringify(facts.parts.root.defaultElement)}]`,
    constructor: Object.fromEntries(
      Object.entries(recipe.constructor).map(([key, value]) => [key, expression(value)]),
    ),
    initialInputs: recipe.initialInputs?.map(rename),
    enabledBy: recipe.enabledBy ? rename(recipe.enabledBy) : undefined,
    props,
    commands,
    tag: facts.parts.root.defaultElement,
    factory: facts.runtime.factory,
    runtime: facts.runtime.importSource.replace("@starwind-ui/runtime/", ""),
    attributes: recipe.attributes.map((attr, index) => ({
      ...attr,
      name: attributeNames[index]!,
      expression: rename(attr.expression),
    })),
  };
}
