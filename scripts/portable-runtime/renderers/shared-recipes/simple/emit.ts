import { operations } from "./operations.js";
import type { CommandRecipe, Expr, Target } from "./recipe.js";

/** Shared semantic order: create -> ordered live groups; clear ownership -> destroy on exit. */
export function emitCommands(recipe: CommandRecipe, target: Target): string {
  const ops = operations[target];
  const read = (name: string) => ops.readInput(recipe.props.find((p) => p.name === name)!);
  const expr = (value: Expr): string =>
    "input" in value
      ? read(value.input)
      : `{ ${Object.entries(value.object)
          .map(([k, v]) => `${k}: ${expr(v)}`)
          .join(", ")} }`;
  const constructor = expr({ object: recipe.constructor });
  const condition = recipe.enabledBy ? read(recipe.enabledBy) : undefined;
  const declaration = ops.declareOwner(recipe.factory);
  const cell = ops.owner;
  const dispose = `const previous = ${cell}; ${cell} = undefined; previous?.destroy();`;
  const create = `${cell} = ${recipe.factory}(element, ${constructor});`;
  const commands = recipe.commands.map((command) => ({
    reads: command.observe.map(read),
    body: `${cell}?.${command.method}(${command.args.map(expr).join(", ")});`,
  }));
  return ops.lifecycle({ recipe, declaration, dispose, create, condition, commands });
}
