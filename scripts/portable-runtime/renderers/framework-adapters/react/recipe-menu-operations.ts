import type { MenuOperations } from "../../shared-recipes/structured/menu-operations.js";
import { operations } from "../../shared-recipes/structured/operations.js";
export const reactMenuOperations: MenuOperations = {
  fw: operations.react,
  input: (name) => (name === "open" ? "openRef.current" : name),
  owner: "instanceRef.current",
  root: "root",
  capture: { mode: "ready" },
  acceptedOpen: "uncontrolledOpenRef.current",
  portal: "",
  render: (value) => `setUncontrolledOpen(${value});`,
  proposal: (value, details) => `onOpenChangeRef.current?.(${value},${details});`,
  completion: (details) => `onCloseCompleteRef.current?.(${details});`,
  own: (instance) => `instanceRef.current = ${instance};`,
  unsubscribe: "unsubscribeOpenChange();",
  subscribe: (instance, event, body) =>
    `const unsubscribeOpenChange = ${instance}.subscribe("${event}", details=>{ ${body} });`,
};
