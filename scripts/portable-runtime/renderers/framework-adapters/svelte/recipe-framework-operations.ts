import type { FrameworkOperations } from "../../shared-recipes/structured/operations.js";

const upper = (name: string) => name[0]!.toUpperCase() + name.slice(1);
export const svelteFrameworkOperations: FrameworkOperations = {
  stableValue: (expression) => expression,
  modelAuthority: "runtime-binding",
  acceptedCell: (name, type, initial) =>
    `let rendered${upper(name)} = $state${type ? `<${type}>` : ""}(${initial});`,
  controllerCell: (type, initial) =>
    `const connection: ${type} = { accepted: ${initial}, initialized: false };`,
  readInput: (name) => name,
  publishModel: (name, value, selection = false) =>
    `if (${selection ? `!isModelEqual(${name}, ${value})` : `${name} !== ${value}`}) ${name} = ${selection ? `copyModel(${value})` : value};`,
  renderAccepted: (name, value) => `rendered${upper(name)} = ${value};`,
  proposal: (name, value, details) => `${name}?.(${value}, ${details});`,
  completion: (name, details) => `${name}?.(${details});`,
  controlled: () => "false",
  untracked: (body) => `untrack(() => { ${body} });`,
  observeModel: (name) => `$effect(() => { void ${name}; untrack(applyParentCommand); });`,
};
