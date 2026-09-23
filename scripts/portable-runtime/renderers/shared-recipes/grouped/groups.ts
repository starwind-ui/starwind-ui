import type {
  AdapterFamilyProp,
  AdapterGroupedValueControlFacts,
} from "../../framework-adapters/types.js";
import { initialModelValue } from "../initial-state.js";
import type { FrameworkOperations } from "../structured/operations.js";
import { type AcceptedRenderOperations, renderAcceptedState } from "./accepted-render.js";
export interface FormGroupRecipe {
  commandOrder: readonly ("refresh" | "options" | "parent" | "readback")[];
}
export const formGroupRecipe: FormGroupRecipe = {
  commandOrder: ["refresh", "options", "parent", "readback"],
};
export type GroupKind = "checkbox-group" | "radio-group";
export interface GroupProjection {
  kind: GroupKind;
  element: string;
  name: string;
  factory: string;
  type: string;
  details: string;
  callbackType: string;
  props: AdapterFamilyProp[];
  seed: string;
  initial: string;
  selected: string;
  attrs: [string, string][];
  context: [string, string][];
  commands: { name: string; inputs: string[] }[];
  connectPhase: "after-children";
  commandPhase: "after-children";
}
export interface GroupOperations extends AcceptedRenderOperations {
  fw: FrameworkOperations;
  acceptedRead: string;
  frame(code: string, p: GroupProjection): string;
}
export function renderFormGroup(
  ops: GroupOperations,
  facts: AdapterGroupedValueControlFacts,
  recipe: FormGroupRecipe = formGroupRecipe,
): string {
  const kind: GroupKind =
    facts.runtime.factory === "createRadioGroup" ? "radio-group" : "checkbox-group";
  if (
    facts.runtime.factory !== "createRadioGroup" &&
    facts.runtime.factory !== "createCheckboxGroup"
  )
    throw new Error("Form groups require Radio or Checkbox facts");
  const array = kind === "checkbox-group",
    fw = ops.fw,
    read = (name: string) => fw.readInput(name),
    copy = (value: string) => (array ? `copyModel(${value})` : value);
  const render = (next: string) => renderAcceptedState(ops, "value", next);
  const publish = (next: string) => fw.publishModel("value", next, array);
  const props = Object.values(facts.props).filter((p): p is AdapterFamilyProp => p !== undefined);
  const live = props.filter((p) => !["value", "defaultValue"].includes(p.name)).map((p) => p.name);
  const p: GroupProjection = {
    kind,
    element: facts.rootPart.defaultElement,
    name: facts.displayName,
    factory: facts.runtime.factory,
    type: facts.state.type,
    details: facts.event.detailsType,
    callbackType: facts.event.valueType,
    props,
    seed: copy(`${read("defaultValue")} ?? ${read("value")}${array ? " ?? []" : ""}`),
    initial: copy(initialModelValue(read("value"), "resetSeed")),
    selected: `${read("value")} ?? ${ops.acceptedRead}`,
    context: (facts.context?.values ?? []).map((p) => [
      p.name,
      p.name === "value" ? "selected" : read(p.name),
    ]),
    connectPhase: "after-children",
    commandPhase: "after-children",
    commands: [
      { name: "applyOptions", inputs: live },
      { name: "applyParent", inputs: ["value"] },
    ],
    attrs: [
      [facts.attrs.root, '""'],
      ["data-sw-part", '"root"'],
      ["role", JSON.stringify(facts.rootPart.role)],
      [facts.attrs.defaultValue, array ? "JSON.stringify(resetSeed)" : "resetSeed"],
      [facts.attrs.value, array ? "JSON.stringify(selected)" : "selected"],
      [facts.attrs.disabled, `${read("disabled")} ? "" : undefined`],
      ...["form", "name", "orientation"]
        .filter((name) => facts.attrs[name as "form"])
        .map((name) => [facts.attrs[name as "form"]!, read(name)] as [string, string]),
      ...["readOnly", "required"]
        .filter((name) => facts.attrs[name as "readOnly"])
        .map(
          (name) =>
            [facts.attrs[name as "readOnly"]!, `${read(name)} ? "" : undefined`] as [
              string,
              string,
            ],
        ),
      ...[
        ["ariaDisabled", "disabled"],
        ["ariaReadOnly", "readOnly"],
        ["ariaRequired", "required"],
      ]
        .filter(([attr]) => facts.attrs[attr as "ariaDisabled"])
        .map(
          ([attr, name]) =>
            [facts.attrs[attr as "ariaDisabled"]!, `${read(name)} ? "true" : undefined`] as [
              string,
              string,
            ],
        ),
      ...(facts.attrs.ariaOrientation
        ? [[facts.attrs.ariaOrientation, read("orientation")] as [string, string]]
        : []),
    ],
  };
  const equality = array
    ? "function isModelEqual(left:string[]|undefined,right:string[]|undefined){return left===right||left!==undefined&&right!==undefined&&left.length===right.length&&left.every((value,index)=>value===right[index]);}function copyModel(value:string[]){return [...value];}"
    : "function isModelEqual(left:string|undefined,right:string|undefined){return left===right;}";
  const accepted = `if(connection.instance!==owned||detail.isCanceled)return;${fw.untracked(`publishRuntime(owned);${fw.modelAuthority === "parent-prop" ? publish("detail.value") : ""}`)}`;
  const subscription =
    facts.behavior.acceptedChangeNotification === "detail-on-accepted"
      ? `detail.onAccepted(()=>{${accepted}})`
      : `{${accepted}}`;
  const optionCommands = [
    `owned.${facts.setters.disabled.method}(${read("disabled")});`,
    ...(facts.setters.formOptions
      ? [
          `owned.${facts.setters.formOptions.method}({${facts.setters.formOptions.props.map((name) => `${name}:${read(name)}`).join(",")}});`,
        ]
      : []),
    ...(facts.setters.readOnly
      ? [`owned.${facts.setters.readOnly.method}(${read("readOnly")});`]
      : []),
    ...(facts.setters.orientation
      ? [`owned.${facts.setters.orientation.method}(${read("orientation")});`]
      : []),
  ];
  const commandBodies = {
    refresh: "owned.refresh();",
    options: optionCommands.join("\n"),
    parent: "applyParent();",
    readback: "publishRuntime(owned);",
  };
  const code = `${equality}
function disconnect(){const owned=connection.instance;connection.unsubscribe?.();connection.unsubscribeSync?.();connection.observer?.disconnect();connection.instance=undefined;owned?.destroy();}
function publishRuntime(owned:ReturnType<typeof ${facts.runtime.factory}>){if(connection.instance!==owned)return;const next=owned.getValue();if(!isModelEqual(connection.accepted,next)){connection.accepted=${copy("next")};${render("next")}}${fw.modelAuthority === "runtime-binding" ? publish("next") : ""}}
function connect(root:HTMLDivElement){disconnect();const desired=${read("value")}??initialValue;const owned=${facts.runtime.factory}(root,{defaultValue:${copy("resetSeed")},${live.map((name) => `${name}:${read(name)}`).join(",")},...(${fw.controlled("value")}?{value:desired}:{}),onValueChange:(${facts.behavior.callbackArguments === "details" ? "detail" : "_next,detail"})=>{${fw.untracked(fw.proposal("onValueChange", copy("detail.value"), "detail"))}}});connection.instance=owned;if(!isModelEqual(owned.getValue(),desired))owned.setValue(desired,{emit:false});
connection.unsubscribe=owned.subscribe('valueChange',detail=>${subscription});
${facts.state.syncEvent ? `connection.unsubscribeSync=owned.subscribe('${facts.state.syncEvent}',()=>{${fw.untracked("publishRuntime(owned);")}});` : `connection.observer=new MutationObserver(()=>{${fw.untracked("publishRuntime(owned);")}});connection.observer.observe(root,{attributes:true,attributeFilter:['${facts.attrs.value}']});`}
publishRuntime(owned);}
function applyParent(){const owned=connection.instance,next=${read("value")};if(!owned||next===undefined||isModelEqual(owned.getValue(),next))return;owned.setValue(next,{emit:false});publishRuntime(owned);}
function applyOptions(){const owned=connection.instance;if(!owned)return;${recipe.commandOrder.map((command) => commandBodies[command]).join("\n")}}`;
  return ops.frame(code, p);
}
