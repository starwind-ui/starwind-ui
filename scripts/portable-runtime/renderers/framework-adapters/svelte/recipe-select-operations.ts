import { operations } from "../../shared-recipes/structured/operations.js";
import type { SelectOperations } from "../../shared-recipes/structured/select-operations.js";

const upper = (name: string) => name[0]!.toUpperCase() + name.slice(1);
export const svelteSelectOperations: SelectOperations = {
  fw: operations.svelte,
  input: (name) => name,
  accepted: (channel) => `rendered${upper(channel.name)}`,
  render: (channel, value) => `rendered${upper(channel.name)} = ${value};`,
  initial: (channel) => `initialDefault${upper(channel.name)}`,
  callback: (channel) => operations.svelte.proposal(channel.callback, "next", "detail"),
  owner: "runtimeInstance",
  root: "root",
  portal: "portalReference: ownedPortal ?? undefined,",
  publish: (channel, value) => operations.svelte.publishModel(channel.name, value),
  label: (value, item) => `syncSelectedLabel(root, ${value}${item ? `, ${item}` : ""});`,
  observe: (inputs, body) =>
    `$effect(() => { ${inputs.map((input) => `void ${input};`).join(" ")} untrack(() => { ${body} }); });`,
  attribute: (name, expression) => `${name}={${expression}}`,
  bindReset: "bindReset();",
  reset: {
    timer: "resetTimer",
    revision: "valueRevision",
    isCurrent: "runtimeInstance === instance",
    initialValue: "initialDefaultValue",
    runtime: { read: "instance", availability: "connected" },
    label: (value) => `syncSelectedLabel(root, ${value});`,
  },
};
