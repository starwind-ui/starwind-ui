import { operations } from "../../shared-recipes/structured/operations.js";
import type { SelectOperations } from "../../shared-recipes/structured/select-operations.js";

const upper = (name: string) => name[0]!.toUpperCase() + name.slice(1);
export const vueSelectOperations: SelectOperations = {
  fw: operations.vue,
  input: (name) => `props.${name === "value" ? "modelValue" : name}`,
  accepted: (channel) => `uncontrolled${upper(channel.name)}.value`,
  render: (channel, value) => `uncontrolled${upper(channel.name)}.value = ${value};`,
  initial: (channel) => `uncontrolled${upper(channel.name)}.value`,
  callback: (channel) => operations.vue.proposal(channel.callback, "next", "detail"),
  owner: "instance",
  root: "element",
  portal: "portalReference: portalReference ?? undefined,",
  publish: (channel, value) =>
    operations.vue.publishModel(channel.name === "value" ? "modelValue" : channel.name, value),
  label: (value, item) => `syncSelectedLabel(${value}${item ? `, ${item}` : ""});`,
  observe: (inputs, body) =>
    `watch([${inputs.map((input) => `() => props.${input}`).join(", ")}], () => { ${body} }, { flush: "post" });`,
  attribute: (name, expression) => `:${name}="${expression.replaceAll('"', "'")}"`,
  bindReset: "bindFormReset();",
  reset: {
    timer: "resetTimer",
    revision: "uncontrolledValue.value",
    isCurrent: "instance !== undefined",
    initialValue: "initialDefaultValue",
    runtime: { read: "instance!", availability: "connected" },
    label: (value) => `syncSelectedLabel(${value});`,
  },
};
