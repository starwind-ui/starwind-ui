import type { ComboboxOperations } from "../../shared-recipes/structured/combobox-operations.js";
import { svelteCommandName, svelteNewCommand } from "./recipe-framework-operations.js";
import { svelteSelectOperations as base } from "./recipe-select-operations.js";
export const svelteComboboxOperations: ComboboxOperations = {
  observeModel: () => "",
  command: svelteNewCommand,
  settleLabel: () => "",
  ...base,
  input: (name) =>
    ["value", "inputValue", "open"].includes(name) ? svelteCommandName(name) : name,
  accepted: (channel) => `accepted.${channel.name}`,
  render: (channel, value) => `accepted.${channel.name} = ${value};`,
  initial: (channel) => `initialDefaults.${channel.name}`,
  owner: "current?.instance",
  portal: "",
  rememberLabel: () => "",
  own: (instance) => `current = { instance: ${instance}, cleanups: [] };`,
  subscribe: (instance, event, body) =>
    `current.cleanups.push(${instance}.subscribe("${event}", detail => { ${body} }));`,
};
