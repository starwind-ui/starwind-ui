import type { MenuOperations } from "../../shared-recipes/structured/menu-operations.js";
import { operations } from "../../shared-recipes/structured/operations.js";
export const svelteMenuOperations: MenuOperations = {
  fw: operations.svelte,
  input: (name) => name,
  owner: "instance",
  root: "root",
  capture: {
    mode: "deferred-portal",
    captureReady: (required, submenuRequired) => `const captures = [...parts.values()];
      const own = captures.filter(part => part.scope === scope);
      if (!${JSON.stringify(required)}.every(name => own.some(part => part.part === name && part.element.isConnected))) return;
      for (const sub of captures.filter(part => part.part === "submenuRoot")) {
        if (!${JSON.stringify(submenuRequired)}.every(name => captures.some(part => part.scope === sub.scope && part.part === name && part.element.isConnected))) return;
      }`,
    restoreAuthoredAttributes: `for (const {element,attributes} of captures) for (const [name,value] of Object.entries(attributes ?? {})) element.setAttribute(name,value);`,
    prepareModels: `for (const model of models.values()) model.prepare();`,
    acceptModels: `for (const model of models.values()) model.accept();`,
    afterPlacement: (body) => `queueMicrotask(() => {
      untrack(() => { ${body} });
    });`,
  },
  acceptedOpen: "accepted",
  portal: "",
  render: (value) => `accepted=${value};`,
  proposal: (value, details) => `onOpenChange?.(${value},${details});`,
  completion: (details) => `onCloseComplete?.(${details});`,
  own: (owned) => `instance=${owned};`,
  unsubscribe: "unsubscribeOpenChange();",
  subscribe: (owned, event, body) =>
    `const unsubscribeOpenChange = ${owned}.subscribe("${event}", details=>{ ${body} });`,
};
