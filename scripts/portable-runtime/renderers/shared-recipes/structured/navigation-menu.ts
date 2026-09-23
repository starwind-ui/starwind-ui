import type { AdapterSharedViewportNavigationFacts } from "../../framework-adapters/types.js";
import { initialModelValue, initialNullableModelValue } from "../initial-state.js";

/** Runtime navigation requests carry their cause through a controlled parent commit. */
export const navigationMenuPlan = {
  options: ["openDelay", "closeDelay", "closeOnEscape", "closeOnOutsideInteract"],
  requiredParts: ["popup", "viewport"],
  acceptedEvent: "valueChange",
  parentCommandsEmit: false,
} as const;

export function navigationRequestOptions(
  facts: AdapterSharedViewportNavigationFacts,
  details: string,
): string {
  return `{ emit: ${navigationMenuPlan.parentCommandsEmit}, ${facts.valueControl.controlledResync.preserveDetailFields.map((field) => `${field}: ${details}.${field}`).join(", ")} }`;
}

export function navigationItemOpen(value: string, itemValue: string, implicit: string): string {
  return `${itemValue} === undefined ? ${value} !== null && (${implicit}) : ${value} !== null && ${value} === ${itemValue}`;
}

import { navigationMenuOperations } from "./navigation-menu-operations.js";
import type { Target } from "./operations.js";
export function navigationMenuFragments(
  target: Target,
  facts: AdapterSharedViewportNavigationFacts,
) {
  const s = navigationMenuOperations[target];
  const parent = s.fw.modelAuthority === "parent-prop";
  const remember =
    s.request?.at === "proposal"
      ? `${s.request.assign("details")} ${s.request.afterProposal(`if (${s.request.read} === details) { ${s.request.clear} }`)}`
      : "";
  const proposal = `${remember} ${s.fw.untracked(s.proposal("nextValue", "details"))}`;
  const construction = `const owned = ${facts.runtime.factory}(${s.root}, {
    defaultValue: ${s.capture.mode === "deferred-portal" ? "null" : s.accepted},
    ${navigationMenuPlan.options.map((name) => `${name}: ${s.input(name)},`).join("\n")}
    ${parent ? `...(${s.input("value")} !== undefined ? { value: ${s.input("value")} } : {}),` : ""}
    onValueChange: (nextValue, details) => { ${proposal} },
  });`;
  const accepted = s.observeAccepted(`if (${s.owner} !== owned || details.isCanceled) return;
    ${parent ? `if (${s.input("value")} === undefined) { ${s.render("owned.getValue()")} }` : s.render("owned.getValue()")}
    ${s.publish("details.value")}
    ${s.request?.at === "accepted" ? `if (${s.input("value")} !== undefined) { ${s.request.assign("details")} void resyncControlled(details); }` : ""}`);
  const parentCommand = `const owned = ${s.owner}; const next = ${s.input("value")};
    if (!owned || next === undefined) return;
    if (owned.getValue() !== next) owned.setValue(next, { emit: ${navigationMenuPlan.parentCommandsEmit} });
    ${parent ? "" : s.render("owned.getValue()")}`;
  const commitRequest =
    s.request?.at === "proposal"
      ? `
    if (${s.input("value")} !== undefined) {
      const details = ${s.request.read}; ${s.request.clear}
      ${s.owner}?.setValue(${s.input("value")}, details?.value === ${s.input("value")} ? ${navigationRequestOptions(facts, "details")} : { emit: ${navigationMenuPlan.parentCommandsEmit} });
    }`
      : s.request?.at === "accepted"
        ? `
    ${s.request.awaitCommit}
    if (${s.request.read} !== detail || ${s.input("value")} === undefined || !${s.owner}) return;
    ${s.request.clear}
    ${s.owner}.setValue(${s.input("value")}, ${navigationRequestOptions(facts, "detail")});
    `
        : "";
  const captures =
    s.capture.mode === "deferred-portal"
      ? `const captures = ${s.capture.readParts};
       if (!${JSON.stringify(navigationMenuPlan.requiredParts)}.every(name => captures.some(part => part.part === name))) { ${s.capture.disconnected} return; }`
      : "";
  const restoreAuthored = s.capture.mode === "deferred-portal" ? s.capture.restoreAuthored : "";
  const restore =
    s.capture.mode === "deferred-portal"
      ? s.capture.afterPlacement(`
    if (${s.owner} !== owned || !${s.root}.isConnected) return;
    const next = ${s.input("value")} === undefined ? ${s.accepted} : ${s.input("value")};
    if (owned.getValue() !== next) owned.setValue(next, { emit: ${navigationMenuPlan.parentCommandsEmit} });
    ${s.render("owned.getValue()")}
${s.capture.markInitialized}
  `)
      : "";
  const retainBeforeReconnect = `const current = ${s.owner}?.getValue();
    if (${s.input("value")} === undefined && current !== undefined) ${s.render("current")}`;
  const cleanup = `${s.capture.mode === "deferred-portal" ? s.render("owned.getValue()") : ""}
    ${s.unsubscribe}
    if (${s.owner} === owned) { ${s.clearOwner} }
    owned.destroy();
    ${s.restoreMovedContent}`;
  return {
    construction,
    accepted,
    parentCommand,
    captures,
    restoreAuthored,
    restore,
    commitRequest,
    cleanup,
    retainBeforeReconnect,
  };
}

/** The recipe owns capture admission, reconstruction, authored state, connection and restoration order. */
export function navigationMenuConnection(
  target: Target,
  facts: AdapterSharedViewportNavigationFacts,
): string {
  const s = navigationMenuOperations[target],
    f = navigationMenuFragments(target, facts);
  const reconcile =
    s.capture.mode === "deferred-portal"
      ? `
    if (${s.capture.current}) {
      const sameOptions = ${JSON.stringify(navigationMenuPlan.options)}.every(key => ${s.capture.currentOptions}[key as keyof Options] === ${s.capture.desiredOptions}[key as keyof Options]);
      const changed = [...${s.capture.currentParts}, ...captures].some(part => !(${s.capture.currentParts}.includes(part) && captures.includes(part)));
      if (sameOptions && !changed) { ${s.capture.currentOptions} = ${s.capture.desiredOptions}; return; }
      ${s.capture.disconnected}
    }`
      : "";
  return [
    f.captures,
    reconcile,
    f.restoreAuthored,
    f.construction,
    s.own("owned"),
    s.subscribe("owned", navigationMenuPlan.acceptedEvent, f.accepted),
    f.restore,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Nullable selection preserves explicit null; only undefined falls back to defaults. */
export function navigationInitialProjection(
  target: Target,
  reads: {
    readModel: string;
    readDefault: string;
    readDefaultCell: string;
    readAccepted: string;
    fallback: string;
  },
) {
  const binding = navigationMenuOperations[target].fw.modelAuthority === "runtime-binding";
  return {
    defaultSeed: binding ? initialModelValue(reads.readDefault, reads.fallback) : reads.readDefault,
    acceptedSeed: binding
      ? initialNullableModelValue(reads.readModel, reads.readDefaultCell)
      : reads.readDefaultCell,
    rendered: binding
      ? reads.readAccepted
      : initialNullableModelValue(reads.readModel, reads.readAccepted, "present-first"),
  };
}
