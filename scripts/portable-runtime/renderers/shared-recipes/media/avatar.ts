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

/** Subscribe first so changes cannot be missed while delivering the current non-idle status. */
export function avatarSubscription(operations: {
  listen: string;
  read: string;
  notify: string;
  untracked?: (body: string) => string;
}): string {
  const current = `const status = ${operations.read};
if (status && status !== ${JSON.stringify(avatarRecipe.initialStatus)}) {
  ${operations.notify}
}`;
  const steps = { listen: operations.listen, current: operations.untracked?.(current) ?? current };
  return avatarRecipe.subscription.map((step) => steps[step]).join("\n");
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
