import type { FrameworkOperations } from "../../shared-recipes/structured/operations.js";

const upper = (name: string) => name[0]!.toUpperCase() + name.slice(1);
/** The second read of a bindable prop. It returns the parent value, never a local write. */
export const svelteCommandName = (name: string) => `command${upper(name)}`;
export const svelteModelDestructure = (name: string) =>
  `${name} = $bindable(), ${name}: ${svelteCommandName(name)}`;
export const svelteControlledName = (name: string) => `${name}Controlled`;
/** Read an array model by item, so `push()` and `splice()` on a parent `$state` array rerun the effect. */
export const svelteTrackModel = (name: string) =>
  `{const tracked=${svelteCommandName(name)};if(Array.isArray(tracked))void [...tracked];}`;
/**
 * A local write on a one-way bindable hides the parent read until the parent changes. A Runtime-owned
 * model then skips that stale input, so a rerun for another input keeps the accepted change. A
 * binding always reads the parent, so it still applies.
 */
export const svelteNewCommand = (name: string) =>
  `(${svelteControlledName(name)} || ${name} === ${svelteCommandName(name)} ? ${svelteCommandName(name)} : undefined)`;
export const svelteFrameworkOperations: FrameworkOperations = {
  stableValue: (expression) => expression,
  modelAuthority: "runtime-binding",
  acceptedCell: (name, type, initial) =>
    `let rendered${upper(name)} = $state${type ? `<${type}>` : ""}(${initial});`,
  controllerCell: (type, initial) =>
    `const connection: ${type} = { accepted: ${initial}, initialized: false };`,
  readInput: (name) => name,
  readModel: svelteCommandName,
  readCommand: svelteNewCommand,
  controlledCell: (name) =>
    `const ${svelteControlledName(name)} = untrack(() => ${svelteCommandName(name)}) !== undefined;`,
  publishModel: (name, value, selection = false) =>
    `if (${selection ? `!isModelEqual(${name}, ${value})` : `${name} !== ${value}`}) ${name} = ${selection ? `copyModel(${value})` : value};`,
  renderAccepted: (name, value) => `rendered${upper(name)} = ${value};`,
  proposal: (name, value, details) => `${name}?.(${value}, ${details});`,
  completion: (name, details) => `${name}?.(${details});`,
  controlled: svelteControlledName,
  untracked: (body) => `untrack(() => { ${body} });`,
  observeModel: (name) =>
    `$effect(() => { void ${svelteCommandName(name)}; untrack(applyParentCommand); });`,
};
