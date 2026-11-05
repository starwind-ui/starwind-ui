import { menuOperations } from "./menu-operations.js";
import type { Target } from "./operations.js";
export const menuPlan = {
  menu: { factory: "createMenu", options: ["disabled", "modal", "openOnHover", "closeDelay"] },
  contextMenu: { factory: "createContextMenu", options: ["disabled", "modal", "closeDelay"] },
  parentCommandsEmit: false,
  requiredParts: ["trigger", "popup"],
  submenuRequiredParts: ["submenuTrigger", "popup"],
} as const;
export type MenuKind = "menu" | "contextMenu";
export function menuFragments(target: Target, kind: MenuKind = "menu") {
  const p = menuPlan[kind],
    s = menuOperations[target];
  const parentProp = s.fw.modelAuthority === "parent-prop";
  const model = parentProp ? s.input("open") : s.fw.readModel("open");
  const controlled = s.fw.controlled("open");
  const render = (value: string) =>
    parentProp ? `if (${model} === undefined) { ${s.render(value)} }` : s.render(value);
  const construction = `const owned = ${p.factory}(${s.root}, {
    defaultOpen:${s.capture.mode === "deferred-portal" ? "false" : s.acceptedOpen},
    ${p.options.map((name) => `${name}:${s.input(name)},`).join("\n")}
    onOpenChange:(next,details)=>{ ${s.fw.untracked(s.proposal("next", "details"))} },
    onCloseComplete:(details)=>{ if (${s.owner} !== owned) return; ${s.fw.untracked(s.completion("details"))} },
    ${kind === "menu" ? s.portal : ""}
    ${parentProp ? `...(${model} !== undefined ? {open:${model}} : {}),` : `...(${controlled} ? {open:${s.capture.mode === "deferred-portal" ? "false" : model}} : {}),`}
  });
  ${s.own("owned")}`;
  const subscriptions = s.subscribe(
    "owned",
    "openChange",
    `if (${s.owner} !== owned) return;
    ${s.fw.untracked(
      parentProp
        ? `${render("details.open")}
      ${s.fw.publishModel("open", "details.open")}`
        : `if (!${controlled}) { ${render("details.open")} }
      ${s.fw.publishModel("open", "details.open")}`,
    )}`,
  );
  const parentCommand = `const owned = ${s.owner}; if (!owned || ${model} === undefined) return;
    const next = ${model};
    if (owned.getOpen() !== next) owned.setOpen(next,{emit:${menuPlan.parentCommandsEmit}});
    ${s.fw.modelAuthority === "runtime-binding" ? s.render("owned.getOpen()") : ""}`;
  const restore = `const desired = ${model} ?? ${s.acceptedOpen};
    if (owned.getOpen() !== desired) owned.setOpen(desired,{emit:${menuPlan.parentCommandsEmit}});
    ${render("owned.getOpen()")}`;
  const retainBeforeReconnect = `const current = ${s.owner}?.getOpen();
    if (${model} === undefined && current !== undefined) ${s.render("current")}`;
  const cleanup = `${s.unsubscribe}
    if (${s.owner} === owned) { ${s.own("undefined")} }
    owned.destroy();`;
  return { construction, subscriptions, parentCommand, restore, cleanup, retainBeforeReconnect };
}

/** Shared order for each connection; target capture mode chooses its DOM-ready boundary. */
export function menuConnection(target: Target, kind: MenuKind = "menu"): string {
  const s = menuOperations[target],
    f = menuFragments(target, kind);
  const preconnect =
    s.capture.mode === "deferred-portal"
      ? [
          s.capture.captureReady(menuPlan.requiredParts, menuPlan.submenuRequiredParts),
          s.capture.restoreAuthoredAttributes,
          s.capture.prepareModels,
        ]
      : [];
  const settle =
    s.capture.mode === "deferred-portal"
      ? s.capture.afterPlacement(
          `if (${s.owner} !== owned || !${s.root}.isConnected) return;\n${s.capture.acceptModels}\n${f.restore}`,
        )
      : "";
  return [...preconnect, f.construction, f.subscriptions, settle].filter(Boolean).join("\n");
}

/** The recipe chooses initial/default precedence; targets provide reads and state storage. */
export function menuInitialProjection(
  target: Target,
  reads: {
    readModel: string;
    readDefault: string;
    readDefaultCell: string;
    readAccepted: string;
    fallback: string;
  },
) {
  const binding = menuOperations[target].fw.modelAuthority === "runtime-binding";
  return {
    defaultSeed: binding
      ? `${reads.readDefault} ?? ${reads.readModel} ?? ${reads.fallback}`
      : reads.readDefault,
    acceptedSeed: binding
      ? `${reads.readModel} ?? ${reads.readDefaultCell}`
      : reads.readDefaultCell,
    rendered: binding ? reads.readAccepted : `${reads.readModel} ?? ${reads.readAccepted}`,
  };
}
