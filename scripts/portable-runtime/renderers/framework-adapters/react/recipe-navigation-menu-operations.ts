import type { NavigationMenuOperations } from "../../shared-recipes/structured/navigation-menu-operations.js";
import { operations } from "../../shared-recipes/structured/operations.js";
export const reactNavigationMenuOperations: NavigationMenuOperations = {
  fw: operations.react,
  capture: { mode: "ready" },
  input: (name) => (name === "value" ? "valueRef.current" : name),
  owner: "instanceRef.current",
  accepted: "uncontrolledValueRef.current",
  root: "root",
  render: (value) => `uncontrolledValueRef.current = ${value}; setUncontrolledValue(${value});`,
  publish: () => "",
  proposal: (value, details) => `onValueChangeRef.current?.(${value}, ${details});`,
  request: {
    at: "proposal",
    read: "pendingValueChangeDetailsRef.current",
    assign: (details) => `pendingValueChangeDetailsRef.current = ${details};`,
    clear: "pendingValueChangeDetailsRef.current = null;",
    afterProposal: (body) => `window.setTimeout(() => { ${body} }, 0);`,
  },
  observeAccepted: (body) => `queueMicrotask(() => { ${body} });`,
  own: (instance) => `instanceRef.current = ${instance};`,
  unsubscribe: "unsubscribe();",
  clearOwner: "instanceRef.current = undefined;",
  restoreMovedContent: "",
  subscribe: (instance, event, body) =>
    `const unsubscribe = ${instance}.subscribe("${event}", details => { ${body} });`,
};
