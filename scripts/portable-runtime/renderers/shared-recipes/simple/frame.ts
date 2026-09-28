import { emitCommands } from "./emit.js";
import { fromFacts, type SimpleFacts } from "./facts.js";
import { operations } from "./operations.js";
import { type CommandRecipe, recipes, type Target } from "./recipe.js";
/** Traverse shared fields and attributes, then ask target syntax operations to print one frame. */
export function renderSimpleRoot(
  target: Target,
  kind: keyof typeof recipes,
  source: CommandRecipe | SimpleFacts = recipes[kind],
): string {
  const recipe =
    "component" in source ? (source as CommandRecipe) : fromFacts(kind, source as SimpleFacts);
  const ops = operations[target];
  const name = recipe.rootName ?? `${recipe.component}Root`;
  const imports = `${recipe.factory}${recipe.types?.map((t) => `, type ${t}`).join("") ?? ""}`;
  const fields = recipe.props
    .map((p) => `${JSON.stringify(ops.fieldName(p))}?: ${p.type}`)
    .join(";\n");
  const destructure = recipe.props
    .map(
      (p) =>
        `${p.attribute ? `${JSON.stringify(p.attribute)}: ` : ""}${p.name}${p.default !== undefined ? ` = ${p.default}` : ""}`,
    )
    .join(", ");
  const initialNames = new Map(
    (recipe.initialInputs ?? []).map((name) => [
      name,
      `initial${name[0]!.toUpperCase()}${name.slice(1)}`,
    ]),
  );
  const seeds = [...initialNames]
    .map(([name, initial]) =>
      ops.initialValue(initial, ops.readInput(recipe.props.find((prop) => prop.name === name)!)),
    )
    .join("\n");
  const code = `${seeds}\n${emitCommands(recipe, target)}`;
  const expression = (source: string) =>
    source.replace(/\b[A-Za-z]\w*\b/g, (token) => {
      const prop = recipe.props.find((p) => p.name === token);
      return initialNames.get(token) ?? (prop ? ops.readInput(prop) : token);
    });
  const attrs = recipe.attributes
    .map((attr) => ops.attribute(attr.name, expression(attr.expression)))
    .join("\n");
  return ops
    .frame({ kind, recipe, name, imports, fields, destructure, attrs, code })
    .replace(/^[\t ]+$/gm, "");
}
