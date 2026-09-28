import type { AdapterCompositeMenuOverlayFacts as Facts } from "../../framework-adapters/types.js";
import { menuItemOperations } from "./menu-item-operations.js";
import type { Target } from "./operations.js";
import { operations } from "./operations.js";
export type MenuItemKind = "checkboxItem" | "radioGroup";
export const menuItemPlan = {
  checkboxItem: {
    model: "checked",
    type: "boolean",
    event: "starwind:checked-change",
    details: "MenuCheckedChangeDetails",
  },
  radioGroup: {
    model: "value",
    type: "string",
    event: "starwind:value-change",
    details: "MenuValueChangeDetails",
  },
} as const;
export function menuItemHandler(target: Target, part: MenuItemKind): string {
  const p = menuItemPlan[part],
    s = menuItemOperations[target],
    fw = operations[target];
  const input = s.input(p.model),
    owner = s.owner(part);
  return `if (event.target !== ${owner}) return;
   const ownerElement = ${owner}; if (!ownerElement) return;
   const details = (event as CustomEvent<${p.details}>).detail;
   ${fw.modelAuthority === "parent-prop" ? `const inputAtDispatch = ${input};` : ""}
   ${fw.untracked(s.proposal(p.model, `details.${p.model}`))}
   queueMicrotask(${target === "vue" ? "async " : ""}() => {
     ${s.settle}
     if (!(${s.alive(part)}) || details.isCanceled${fw.modelAuthority === "parent-prop" ? ` || ${input} !== inputAtDispatch` : ""}) return;
     ${fw.untracked(`${fw.modelAuthority === "parent-prop" ? `if (${input} === undefined) { ${s.render(p.model, `details.${p.model}`)} }` : s.render(p.model, `details.${p.model}`)}
       ${s.publish(p.model, `details.${p.model}`)}`)}
     ${s.settle}
     ${fw.modelAuthority === "parent-prop" ? `if (${s.alive(part)} && ${input} !== undefined) { ${s.project(part, input)} }` : ""}
   });`;
}
export function menuCheckedProjection(
  f: Facts,
  element: string,
  value: string,
  part: "checkboxItem" | "radioItem",
): string {
  const p = f[part],
    indicator = f.parts[p.indicator.indicatorPart].discoveryAttribute;
  return `${element}.setAttribute("${p.stateAttributes.ariaChecked}",String(${value}));
   ${element}.toggleAttribute("${p.stateAttributes.checked}",${value});
   ${element}.toggleAttribute("${p.stateAttributes.unchecked}",!${value});
   for (const indicator of ${element}.querySelectorAll<HTMLElement>("[${indicator}]")) {
     if (indicator.closest("[${f.parts[part].discoveryAttribute}]") !== ${element}) continue;
     indicator.setAttribute("aria-hidden","true");
     indicator.setAttribute("${p.indicator.stateAttribute}",${value}?"${p.indicator.checkedStateValue}":"${p.indicator.uncheckedStateValue}");
     indicator.toggleAttribute("${p.indicator.visibleAttribute}",${value});
     indicator.toggleAttribute("${p.indicator.hiddenAttribute}",!${value});
   }`;
}
export function menuRadioProjection(f: Facts, element: string, value: string): string {
  return `${element}.setAttribute("${f.attrs.radioGroupValue}",${value});
   for (const item of ${element}.querySelectorAll<HTMLElement>("[${f.attrs.radioItem}]")) {
     if (item.closest("[${f.attrs.radioGroup}]") !== ${element}) continue;
     const checked = item.getAttribute("${f.attrs.radioItemValue}") === ${value};
     ${menuCheckedProjection(f, "item", "checked", "radioItem")}
   }`;
}

export function menuRadioChecked(group: string, item: string, fallback: string): string {
  return `${group} === undefined ? (${fallback}) : ${group} === ${item}`;
}
export function menuLinkHref(disabled: string, href: string): string {
  return `${disabled} ? undefined : ${href}`;
}
