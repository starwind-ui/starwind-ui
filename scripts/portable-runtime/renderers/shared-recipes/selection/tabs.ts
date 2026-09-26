import { tabsOperations as react } from "../../framework-adapters/react/recipe-tabs.js";
import { tabsOperations as svelte } from "../../framework-adapters/svelte/recipe-tabs.js";
import type { AdapterControlledValuePresenceFacts } from "../../framework-adapters/types.js";
import { tabsOperations as vue } from "../../framework-adapters/vue/recipe-tabs.js";
import type { FrameworkOperations, Target } from "../structured/operations.js";
export type Part = "root" | "tab" | "panel" | "list" | "indicator";
export interface PartRecipe {
  part: Part;
  tag: string;
  props: { name: string; type: string; default?: string }[];
  attrs: [string, string][];
  initial: { name: string; expression: string }[];
  active: boolean;
  refreshInputs: string[];
  children: "plain" | "active";
}
export interface RootProjection {
  initial: { name: string; expression: string }[];
  seed: string;
  selected: string;
  attrs: [string, string][];
  refreshInputs: readonly string[];
}
export interface TabsOperations {
  fw: FrameworkOperations;
  acceptedRead: string;
  root(code: string, projection: RootProjection): string;
  part(plan: PartRecipe): string;
}
export const tabsRecipe = {
  initialInputs: [
    { prop: "defaultValue", local: "initialDefault" },
    { prop: "syncKey", local: "initialSyncKey" },
  ],
  constructorInputs: ["orientation"],
  parentSync: true,
  cleanup: ["unsubscribe", "clear-owner", "destroy"],
} as const;
export function lifecycle(
  fw: FrameworkOperations,
  parentSync: boolean = tabsRecipe.parentSync,
): string {
  const read = (name: string) => fw.readInput(name),
    render = (next: string) => fw.renderAccepted("value", next);
  const publication = (next: string, accepted = false) =>
    `${render(next)} ${accepted || fw.modelAuthority === "runtime-binding" ? fw.publishModel("value", next) : ""}`;
  const cleanup = {
    unsubscribe: "connection.unsubscribe?.();connection.unsubscribe=undefined;",
    "clear-owner": "connection.instance=undefined;",
    destroy: "owned.destroy();",
  };
  return `function normalizeModel(next:TabsValue|undefined):TabsValue{return next??null;}
 function publish(owned:ReturnType<typeof createTabs>){if(connection.instance!==owned)return;const next=owned.getValue();${publication("next")}}
 function disconnect(){const owned=connection.instance;if(!owned)return;${tabsRecipe.cleanup.map((step) => cleanup[step]).join("\n")}}
 function connect(root:HTMLDivElement){disconnect();const desired=${read("value")}!==undefined?${read("value")}:initialDefault;
 const owned=createTabs(root,{defaultValue:desired,...(${fw.controlled("value")}?{value:desired}:{}),${tabsRecipe.constructorInputs.map((n) => `${n}:${read(n)}`).join(",")},syncKey:initialSyncKey,onValueChange:(next,detail)=>{${fw.untracked(fw.proposal("onValueChange", "next", "detail"))}}});connection.instance=owned;
 connection.unsubscribe=owned.subscribe('valueChange',detail=>{if(connection.instance!==owned||detail.isCanceled)return;${fw.untracked(publication("detail.value", true))}});if(${read("value")}!==undefined&&owned.getValue()!==desired)owned.setValue(desired??null,{emit:false,sync:false});publish(owned);}
 function applyParent(){const owned=connection.instance,next=${read("value")};if(!owned||next===undefined||owned.getValue()===next)return;owned.refresh();if(owned.getValue()!==next)owned.setValue(next,{emit:false,sync:${parentSync}});publish(owned);}
 function refresh(){const owned=connection.instance;if(!owned)return;owned.refresh();publish(owned);}
 function serialize(next:TabsValue|undefined){return next===null?'null':next;}`;
}
const commonAttrs = (part: Part): [string, string][] => [
  [`data-sw-tabs${part === "root" ? "" : "-" + part}`, '""'],
  ["data-sw-part", JSON.stringify(part)],
  ["data-orientation", "orientation"],
];
export function partRecipe(
  part: Exclude<Part, "root">,
  facts: AdapterControlledValuePresenceFacts,
): PartRecipe {
  const selected = part === "tab" || part === "panel";
  const props =
    part === "tab"
      ? [
          { name: "value", type: "string" },
          { name: "disabled", type: "boolean", default: "false" },
        ]
      : part === "panel"
        ? [
            { name: "value", type: "string" },
            { name: "keepMounted", type: "boolean", default: "false" },
          ]
        : part === "list"
          ? [
              { name: "activateOnFocus", type: "boolean", default: "false" },
              { name: "loopFocus", type: "boolean", default: "true" },
            ]
          : [];
  const attrs = commonAttrs(part);
  attrs[0]![0] = facts.parts[part].discoveryAttribute;
  if (selected)
    attrs.push(
      ["data-value", "value"],
      ["data-active", 'active ? "" : undefined'],
      ["data-state", 'active ? "active" : "inactive"'],
    );
  if (part === "tab")
    attrs.push(
      ["data-disabled", 'disabled ? "" : undefined'],
      ["disabled", "disabled"],
      ["aria-selected", "active"],
      ["tabindex", "initialTabIndex"],
      ["role", '"tab"'],
      ["type", '"button"'],
    );
  if (part === "panel")
    attrs.push(
      ["data-keep-mounted", 'keepMounted ? "" : undefined'],
      ["hidden", "initialHidden"],
      ["inert", "!active"],
      ["tabindex", "active ? 0 : -1"],
      ["role", '"tabpanel"'],
    );
  if (part === "list")
    attrs.push(
      ["data-activate-on-focus", 'activateOnFocus ? "" : undefined'],
      ["data-loop-focus", 'loopFocus ? undefined : "false"'],
      ["aria-orientation", 'orientation === "vertical" ? "vertical" : undefined'],
      ["role", '"tablist"'],
    );
  if (part === "indicator") attrs.push(["role", '"presentation"']);
  return {
    part,
    tag: facts.parts[part].defaultElement,
    props,
    attrs,
    initial:
      part === "panel"
        ? [{ name: "initialHidden", expression: "!active" }]
        : part === "tab"
          ? [{ name: "initialTabIndex", expression: "active && !disabled ? 0 : -1" }]
          : [],
    active: selected,
    refreshInputs: props.map((p) => p.name),
    children: selected ? "active" : "plain",
  };
}
export function renderTabs(
  target: Target,
  part: Part,
  facts: AdapterControlledValuePresenceFacts,
): string {
  if (
    !facts.events.valueChange.cancelable ||
    facts.events.valueChange.callbackTiming !== "before-state-commit"
  )
    throw new Error("Tabs requires cancelable proposals before accepted publication.");
  const ops = { react, vue, svelte }[target];
  const input = ops.fw.readInput("value");
  const projection: RootProjection = {
    initial: tabsRecipe.initialInputs.map((item) => ({
      name: item.local,
      expression: ops.fw.readInput(item.prop),
    })),
    seed: `normalizeModel(${input}!==undefined?${input}:initialDefault)`,
    selected:
      ops.fw.modelAuthority === "parent-prop"
        ? `normalizeModel(${input}!==undefined?${input}:${ops.acceptedRead})`
        : ops.acceptedRead,
    attrs: [
      [facts.attrs.root, '""'],
      ["data-sw-part", '"root"'],
      [facts.attrs.defaultValue, "serialize(initialDefault)"],
      [facts.attrs.syncKey, "initialSyncKey"],
      [facts.attrs.value, "serialize(selected)"],
      [facts.attrs.orientation, ops.fw.readInput("orientation")],
    ],
    refreshInputs: tabsRecipe.constructorInputs,
  };
  return part === "root"
    ? ops.root(lifecycle(ops.fw), projection)
    : ops.part(partRecipe(part, facts));
}
