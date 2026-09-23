import type {
  AdapterFamilyProp,
  AdapterGroupedValueControlFacts,
  AdapterSingleBooleanControlFacts,
} from "../../framework-adapters/types.js";
import { initialCheckedValue, initialListValue } from "../initial-state.js";
import type { FrameworkOperations } from "../structured/operations.js";
export type Kind = "toggle" | "toggle-group";
type GroupCommand = "refresh" | "options" | "parent" | "readback";
export interface ToggleGroupRecipe {
  commandOrder: readonly GroupCommand[];
}
export const toggleGroupRecipe: ToggleGroupRecipe = {
  commandOrder: ["refresh", "options", "parent", "readback"],
};
export interface Projection {
  props: AdapterFamilyProp[];
  initial: string;
  selected: string;
  disabled: string;
  groupPressed?: string;
  attrs: [string, string][];
  reconnect: string[];
  connectPhase: "on-node" | "after-children";
  commandPhase?: "after-children";
  commands: { name: string; inputs: string[]; phase?: "after-parent" }[];
}
export interface ToggleOperations {
  fw: FrameworkOperations;
  acceptedRead: string;
  groupExists: string;
  groupValue: string;
  groupDisabled: string;
  frame(kind: Kind, code: string, projection: Projection): string;
}
const cleanup = `function disconnect(){const owned=connection.instance;connection.observer?.disconnect();connection.observer=undefined;connection.unsubscribe?.();connection.unsubscribe=undefined;connection.instance=undefined;owned?.destroy();}`;
export function renderToggle(
  ops: ToggleOperations,
  facts: AdapterSingleBooleanControlFacts,
): string {
  if (facts.runtime.factory !== "createToggle" || facts.group?.requirement !== "optional")
    throw new Error("Toggle recipe requires optional group ownership.");
  const fw = ops.fw,
    read = (name: string) => fw.readInput(name);
  const render = (next: string) => fw.renderAccepted("pressed", next);
  const publish = (next: string) => fw.publishModel("pressed", next);
  const desired = `isGroupOwned ? (groupPressed ?? ${ops.acceptedRead}) : (${initialCheckedValue(read("pressed"), ops.acceptedRead)})`;
  const projection: Projection = {
    props: Object.values(facts.props),
    initial: read("defaultPressed") + " ?? false",
    selected: `groupPressed ?? (${initialCheckedValue(read("pressed"), ops.acceptedRead)})`,
    groupPressed: `${ops.groupExists} && ${read("value")}!==undefined ? ${ops.groupValue}.includes(${read("value")}!) : undefined`,
    disabled: `${read("disabled")} || (${ops.groupDisabled})`,
    attrs: [
      [facts.part.discoveryAttribute, '""'],
      ["data-sw-part", '"root"'],
      [
        facts.attrs.defaultState,
        `!isGroupOwned && ${read("pressed")}===undefined && initialDefault ? "true" : undefined`,
      ],
      [facts.attrs.native, `${read("nativeButton")} ? undefined : "false"`],
      [facts.attrs.syncGroup, read("syncGroup")],
      [facts.attrs.value, read("value")],
      [facts.attrs.ariaState, "selected"],
      [
        facts.attrs.ariaDisabled,
        `!${read("nativeButton")} && effectiveDisabled ? "true" : undefined`,
      ],
      [facts.attrs.disabled, 'effectiveDisabled ? "" : undefined'],
      [facts.attrs.truthyPresence, 'selected ? "" : undefined'],
      [facts.attrs.falsyPresence, 'selected ? undefined : ""'],
      [facts.attrs.state, 'selected ? "on" : "off"'],
      ["disabled", `${read("nativeButton")} ? effectiveDisabled : undefined`],
      ["role", `${read("nativeButton")} ? undefined : "button"`],
      ["type", `${read("nativeButton")} ? "button" : undefined`],
      ["tabindex", `${read("nativeButton")} ? undefined : effectiveDisabled ? -1 : 0`],
      ["value", `${read("nativeButton")} ? ${read("value")} : undefined`],
    ],
    connectPhase: "on-node",
    reconnect: ["nativeButton", "syncGroup", "value"],
    commands: [
      { name: "applyParent", inputs: ["pressed"] },
      { name: "applyDisabled", inputs: ["disabled"], phase: "after-parent" },
    ],
  };
  const code = `${cleanup}
function publishReadback(owned:ReturnType<typeof createToggle>){if(connection.instance!==owned)return;const next=owned.getPressed();${render("next")} ${fw.modelAuthority === "runtime-binding" ? `if(!isGroupOwned){${publish("next")}if(connection.instance!==owned)return;const canonical=${read("pressed")};if(canonical!==undefined&&canonical!==next){owned.setPressed(canonical,{emit:false,sync:true});${render("owned.getPressed()")}}}` : ""}}
function connect(root:HTMLElement){disconnect();const desired=${desired};const owned=createToggle(root,{defaultPressed:desired,disabled:${read("disabled")},nativeButton:${read("nativeButton")},syncGroup:${read("syncGroup")},value:${read("value")},...((isGroupOwned||${fw.controlled("pressed")})?{pressed:desired}:{}),onPressedChange:(next,detail)=>{${fw.untracked(fw.proposal("onPressedChange", "next", "detail"))}}});connection.instance=owned;connection.ownDisabled=${read("disabled")};
connection.unsubscribe=owned.subscribe('pressedChange',detail=>{if(connection.instance!==owned||detail.isCanceled)return;${fw.untracked(`publishReadback(owned);${fw.modelAuthority === "parent-prop" ? publish("detail.pressed") : ""}`)}});
connection.observer=new MutationObserver(()=>{${fw.untracked("publishReadback(owned);")}});connection.observer.observe(root,{attributes:true,attributeFilter:['aria-pressed']});publishReadback(owned);}
function applyParent(){if(isGroupOwned)return;const owned=connection.instance,next=${read("pressed")};if(!owned||next===undefined||owned.getPressed()===next)return;owned.setPressed(next,{emit:false,sync:true});publishReadback(owned);}
function applyDisabled(){const owned=connection.instance,next=${read("disabled")};if(!owned||next===connection.ownDisabled)return;connection.ownDisabled=next;owned.setDisabled(next);if(isGroupOwned&&next)owned.root.setAttribute('data-disabled','');}`;
  return ops.frame("toggle", code, projection);
}
export function renderToggleGroup(
  ops: ToggleOperations,
  facts: AdapterGroupedValueControlFacts,
  recipe: ToggleGroupRecipe = toggleGroupRecipe,
): string {
  if (facts.runtime.factory !== "createToggleGroup" || !facts.behavior.multipleValueNormalization)
    throw new Error("Toggle Group recipe requires normalized multiple selection.");
  const fw = ops.fw,
    read = (name: string) => fw.readInput(name),
    render = (next: string) => fw.renderAccepted("value", next);
  const pub = (next: string) => fw.publishModel("value", next, true);
  const inputs = ["disabled", "loopFocus", "multiple", "orientation"] as const;
  const projection: Projection = {
    props: Object.values(facts.props).filter((p): p is AdapterFamilyProp => p !== undefined),
    initial: `normalizeValue(${initialListValue(read("defaultValue")).replaceAll(" ?? ", "??")},${read("multiple")})`,
    selected: `normalizeValue(${read("value")}??${ops.acceptedRead},${read("multiple")})`,
    disabled: read("disabled"),
    attrs: [
      [facts.attrs.root, '""'],
      ["data-sw-part", '"root"'],
      [
        facts.attrs.defaultValue,
        "initialDefault.length ? JSON.stringify(initialDefault) : undefined",
      ],
      [facts.attrs.value, "JSON.stringify(selected)"],
      [facts.attrs.disabled, 'effectiveDisabled ? "" : undefined'],
      [facts.attrs.loopFocus!, `${read("loopFocus")} ? undefined : "false"`],
      [facts.attrs.multiple!, `${read("multiple")} ? "" : undefined`],
      [facts.attrs.orientation!, read("orientation")],
      ["role", JSON.stringify(facts.rootPart.role)],
    ],
    connectPhase: "after-children",
    commandPhase: "after-children",
    reconnect: [],
    commands: [
      { name: "applyOptions", inputs: [...inputs] },
      { name: "applyParent", inputs: ["value", "multiple"] },
    ],
  };
  const commands: Record<GroupCommand, string> = {
    refresh: "owned.refresh();",
    options: inputs.map((n) => `owned.${facts.setters[n]!.method}(${read(n)});`).join("\n"),
    parent: "applyParent();",
    readback: "publishReadback(owned);",
  };
  const code = `function normalizeValue(value:string[],multiple:boolean){const next=Array.from(new Set(value.filter(item=>item.length>0)));return multiple?next:next.slice(0,1);}
function isModelEqual(left:string[]|undefined,right:string[]|undefined){return left===right||left!==undefined&&right!==undefined&&left.length===right.length&&left.every((entry,index)=>entry===right[index]);}
function copyModel(value:string[]){return [...value];}
${cleanup}
function publishReadback(owned:ReturnType<typeof createToggleGroup>){if(connection.instance!==owned)return;const next=owned.getValue();if(!isModelEqual(connection.accepted,next)){connection.accepted=next;${render("next")}}${fw.modelAuthority === "runtime-binding" ? `${pub("next")}if(connection.instance!==owned)return;const canonical=${read("value")};if(canonical!==undefined&&!isModelEqual(canonical,next)){owned.setValue(normalizeValue(canonical,${read("multiple")}),{emit:false});const retained=owned.getValue();connection.accepted=retained;${render("retained")}}` : ""}}
function connect(root:HTMLDivElement){disconnect();const desired=normalizeValue(${read("value")}??initialDefault,${read("multiple")});const owned=createToggleGroup(root,{defaultValue:desired,${inputs.map((n) => `${n}:${read(n)}`).join(",")},...(${fw.controlled("value")}?{value:desired}:{}),onValueChange:(next,detail)=>{${fw.untracked(fw.proposal("onValueChange", "next", "detail"))}}});connection.instance=owned;
connection.unsubscribe=owned.subscribe('valueChange',detail=>{if(connection.instance!==owned||detail.isCanceled)return;${fw.untracked(`publishReadback(owned);${fw.modelAuthority === "parent-prop" ? pub("detail.value") : ""}`)}});
connection.observer=new MutationObserver(()=>{${fw.untracked("publishReadback(owned);")}});connection.observer.observe(root,{attributes:true,attributeFilter:['data-value']});publishReadback(owned);}
function applyParent(){const owned=connection.instance,input=${read("value")};if(!owned||input===undefined)return;const next=normalizeValue(input,${read("multiple")});if(isModelEqual(owned.getValue(),next))return;owned.setValue(next,{emit:false});publishReadback(owned);}
function applyOptions(){const owned=connection.instance;if(!owned)return;${recipe.commandOrder.map((command) => commands[command]).join("\n")}}`;
  return ops.frame("toggle-group", code, projection);
}
