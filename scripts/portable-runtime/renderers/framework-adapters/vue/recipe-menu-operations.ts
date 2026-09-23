import type { MenuOperations } from "../../shared-recipes/structured/menu-operations.js";
import { operations } from "../../shared-recipes/structured/operations.js";
export const vueMenuOperations: MenuOperations = {
  fw: operations.vue,
  input: (name) => `props.${name}`,
  owner: "instance",
  root: "element",
  capture: { mode: "ready" },
  acceptedOpen: "uncontrolledOpen.value",
  portal: "portalReference:portalReference ?? undefined,",
  render: (value) => `uncontrolledOpen.value=${value};`,
  proposal: (value, details) => `emit("openChange",${value},${details});`,
  completion: (details) => `emit("closeComplete",${details});`,
  own: (owned) => `instance=${owned};`,
  unsubscribe: "unsubscribeOpenChange?.(); unsubscribeOpenChange = undefined;",
  subscribe: (instance, event, body) =>
    `unsubscribeOpenChange = ${instance}.subscribe("${event}", details=>{ ${body} });`,
};
