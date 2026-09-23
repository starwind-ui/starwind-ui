import type { NavigationMenuOperations } from "../../shared-recipes/structured/navigation-menu-operations.js";
import { operations } from "../../shared-recipes/structured/operations.js";
export const vueNavigationMenuOperations: NavigationMenuOperations = {
  fw: operations.vue,
  capture: { mode: "ready" },
  input: (name) => `props.${name === "value" ? "modelValue" : name}`,
  owner: "instance",
  accepted: "uncontrolledValue.value",
  root: "element.value",
  render: (value) => `uncontrolledValue.value = ${value};`,
  publish: (value) => `emit("update:modelValue", ${value});`,
  proposal: (value, details) => `emit("valueChange", ${value}, ${details});`,
  request: {
    at: "accepted",
    read: "acceptedDetail",
    assign: (details) => `acceptedDetail = ${details};`,
    clear: "acceptedDetail = undefined;",
    awaitCommit: "await nextTick();",
  },
  observeAccepted: (body) => body,
  own: (instance) => `instance = ${instance};`,
  unsubscribe:
    "unsubscribeValueChange?.(); unsubscribeValueChange = undefined; acceptedDetail = undefined;",
  clearOwner: "instance = undefined;",
  restoreMovedContent: "",
  subscribe: (instance, event, body) =>
    `unsubscribeValueChange = ${instance}.subscribe("${event}", details => { ${body} });`,
};
