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
  const render = (value: string) =>
    s.fw.modelAuthority === "parent-prop"
      ? `if (${s.input("open")} === undefined) { ${s.render(value)} }`
      : s.render(value);
  const construction = `const owned = ${p.factory}(${s.root}, {
    defaultOpen:${s.capture.mode === "deferred-portal" ? "false" : s.acceptedOpen},
    ${p.options.map((name) => `${name}:${s.input(name)},`).join("\n")}
    onOpenChange:(next,details)=>{ ${s.fw.untracked(s.proposal("next", "details"))} },
    onCloseComplete:(details)=>{ if (${s.owner} !== owned) return; ${s.fw.untracked(s.completion("details"))} },
    ${kind === "menu" ? s.portal : ""}
    ${s.fw.modelAuthority === "parent-prop" ? `...(${s.input("open")} !== undefined ? {open:${s.input("open")}} : {}),` : ""}
  });
  ${s.own("owned")}`;
  const subscriptions = s.subscribe(
    "owned",
    "openChange",
    `if (${s.owner} !== owned) return;
    ${s.fw.untracked(`${render("details.open")}
      ${s.fw.publishModel("open", "details.open")}`)}`,
  );
  const parentCommand = `const owned = ${s.owner}; if (!owned || ${s.input("open")} === undefined) return;
    const next = ${s.input("open")};
    if (owned.getOpen() !== next) owned.setOpen(next,{emit:${menuPlan.parentCommandsEmit}});
    ${s.fw.modelAuthority === "runtime-binding" ? s.render("owned.getOpen()") : ""}`;
  const restore = `const desired = ${s.input("open")} ?? ${s.acceptedOpen};
    if (owned.getOpen() !== desired) owned.setOpen(desired,{emit:${menuPlan.parentCommandsEmit}});
    ${render("owned.getOpen()")}`;
  const retainBeforeReconnect = `const current = ${s.owner}?.getOpen();
    if (${s.input("open")} === undefined && current !== undefined) ${s.render("current")}`;
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
