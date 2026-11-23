import type { AdapterMediaStatusFacts } from "../../framework-adapters/types.js";

export const avatarRecipe = {
  initialStatus: "idle",
  subscription: ["listen", "current"] as readonly ("listen" | "current")[],
};

/** A part change requests one refresh after framework DOM work, only for the surviving owner. */
export function avatarRefresh(
  facts: AdapterMediaStatusFacts,
  access: { instance: string; root: string; pending: string },
): string {
  return `const owner = ${access.instance};
if (!owner || ${access.pending}) return;
${access.pending} = true;
queueMicrotask(() => {
  ${access.pending} = false;
  if (${access.instance} === owner && ${access.root} === owner.root) owner.${facts.runtime.refresh.method}();
});`;
}

/**
 * Listen on the Avatar root DOM event first, so changes cannot be missed, then deliver the current
 * non-idle status. The Runtime dispatches the bubbling event before it calls subscribers, so a
 * listener on the root runs the callback before any ancestor listener sees the event.
 */
export function avatarSubscription(
  facts: AdapterMediaStatusFacts,
  operations: {
    root: string;
    handler: string;
    read: string;
    notify: string;
    untracked?: (body: string) => string;
  },
): string {
  const current = `const status = ${operations.read};
if (status && status !== ${JSON.stringify(avatarRecipe.initialStatus)}) {
  ${operations.notify}
}`;
  const steps = {
    listen: `${operations.root}.addEventListener("${facts.event.domEvent}", ${operations.handler});`,
    current: operations.untracked?.(current) ?? current,
  };
  return avatarRecipe.subscription.map((step) => steps[step]).join("\n");
}

/** Removes the root listener that `avatarSubscription` added. */
export function avatarUnsubscribe(
  facts: AdapterMediaStatusFacts,
  root: string,
  handler: string,
): string {
  return `${root}.removeEventListener("${facts.event.domEvent}", ${handler});`;
}

/** The root handler ignores the same event from a nested Avatar. */
export function avatarRootEventFilter(root: string): string {
  return `if (event.target !== ${root}) return;`;
}

export function avatarFallbackHidden(delay: string, hidden: string): string {
  return `${delay} !== undefined || ${hidden}`;
}

/** Authored style replacement retains Runtime's current image concealment. */
export function avatarImageVisibility(facts: AdapterMediaStatusFacts, current: string): string {
  return `${current} ?? ${JSON.stringify(facts.presence.imageConcealment.value)}`;
}

export function avatarRefreshInputs(
  facts: AdapterMediaStatusFacts,
  part: "image" | "fallback",
): readonly string[] {
  return part === "fallback" ? [facts.props.delay.name] : [];
}
