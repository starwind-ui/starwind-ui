import type { FrameworkOperations } from "../../shared-recipes/structured/operations.js";

const upper = (name: string) => name[0]!.toUpperCase() + name.slice(1);
export const vueFrameworkOperations: FrameworkOperations = {
  stableValue: (expression) => expression,
  modelAuthority: "parent-prop",
  acceptedCell: (name, type, initial) =>
    `const uncontrolled${upper(name)} = ref${type ? `<${type}>` : ""}(${initial});`,
  controllerCell: (type, initial) =>
    `const connection: ${type} = { accepted: ${initial}, initialized: false };`,
  readInput: (name) => `props.${name}`,
  publishModel: (name, value) => `emit("update:${name}", ${value});`,
  renderAccepted: (name, value) => `uncontrolled${upper(name)}.value = ${value};`,
  proposal: (name, value, details) =>
    `emit("${name.slice(2, 3).toLowerCase() + name.slice(3)}", ${value}, ${details});`,
  completion: (name, details) =>
    `emit("${name.slice(2, 3).toLowerCase() + name.slice(3)}", ${details});`,
  controlled: (name) => `props.${name} !== undefined`,
  untracked: (body) => body,
  observeModel: (
    name,
    reconnect = "reconnectAfterDom",
  ) => `watch(() => props.${name}, (next, previous) => {
  if ((next === undefined) !== (previous === undefined)) void ${reconnect}();
  else applyParentCommand();
}, { flush: "post" });`,
};
