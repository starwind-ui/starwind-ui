import type { NavigationMenuOperations } from "../../shared-recipes/structured/navigation-menu-operations.js";
import { operations } from "../../shared-recipes/structured/operations.js";
export const svelteNavigationMenuOperations: NavigationMenuOperations = {
  fw: operations.svelte,
  capture: {
    mode: "deferred-portal",
    current: "current",
    currentOptions: "current!.options",
    currentParts: "current!.captures",
    desiredOptions: "desired",
    markInitialized: "connection.initialized = true;",
    readParts: "[...parts.values()].filter(({ element }) => element.isConnected)",
    disconnected: "disconnect();",
    restoreAuthored: `for (const { element, attributes } of captures) for (const [name, next] of Object.entries(attributes ?? {})) {
      if (next === undefined) element.removeAttribute(name); else element.setAttribute(name, next);
    }`,
    afterPlacement: (body) => `queueMicrotask(() => { untrack(() => { ${body} }); });`,
  },
  input: (name) => (name === "value" ? "value" : `desired.${name}`),
  owner: "current?.instance",
  accepted: "accepted",
  root: "root",
  render: (value) => `accepted = ${value};`,
  publish: (next) => `if (value !== ${next}) value = ${next};`,
  proposal: (value, details) => `onValueChange?.(${value}, ${details});`,
  own: (instance) =>
    `const connection = { instance: ${instance}, unsubscribe: () => {}, initialized: false, captures, options: desired } as NonNullable<typeof current>; current = connection;`,
  unsubscribe: "current?.unsubscribe();",
  clearOwner: "current = undefined;",
  restoreMovedContent: "restoreContents();",
  subscribe: (instance, event, body) =>
    `connection.unsubscribe = ${instance}.subscribe("${event}", details => { ${body} });`,
  observeAccepted: (body) => `untrack(() => { ${body} });`,
};
