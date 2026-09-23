import type {
  AdapterBooleanFormControlFacts,
  AdapterFamilyProp,
} from "../../framework-adapters/types.js";
import { initialCheckedValue } from "../initial-state.js";
import type { FrameworkOperations } from "../structured/operations.js";
import { type AcceptedRenderOperations, renderAcceptedState } from "./accepted-render.js";
export interface RadioProjection {
  props: AdapterFamilyProp[];
  element: string;
  inputInside: string;
  inputOutside: string;
  functions: [string, string][];
  initial: string;
  seed: string;
  selected: string;
  attrs: [string, string][];
  input: [string, string][];
  inputStyle: [string, string][];
  reconnect: string[];
  commands: { name: string; inputs: string[]; phase?: "after-parent" }[];
}
export interface RadioOperations extends AcceptedRenderOperations {
  fw: FrameworkOperations;
  acceptedRead: string;
  groupValue(name: string): string;
  frame(code: string, projection: RadioProjection): string;
  indicator(policy: RadioIndicatorPolicy): string;
}
export interface RadioIndicatorPolicy {
  element: string;
  marker: string;
  part: string;
  keepMounted: string;
  unchecked: string;
  initialHidden: string;
}
export function renderRadioIndicator(
  ops: RadioOperations,
  facts: AdapterBooleanFormControlFacts,
): string {
  if (
    !facts.attrs.stateIndicator ||
    !facts.attrs.stateIndicatorKeepMounted ||
    !facts.attrs.stateIndicatorFalsyPresence
  )
    throw new Error("Radio Indicator requires its part facts");
  return ops.indicator({
    element: facts.parts.stateIndicator!.defaultElement,
    marker: facts.attrs.stateIndicator,
    part: "indicator",
    keepMounted: facts.attrs.stateIndicatorKeepMounted,
    unchecked: facts.attrs.stateIndicatorFalsyPresence,
    initialHidden: "!keepMounted",
  });
}
export function renderRadioRoot(
  ops: RadioOperations,
  facts: AdapterBooleanFormControlFacts,
): string {
  if (
    facts.runtime.factory !== "createRadio" ||
    facts.state.syncEvent !== "stateSync" ||
    facts.behavior.acceptedChangeNotification !== "detail-on-accepted"
  )
    throw new Error("Radio requires peer stateSync and accepted detail notifications");
  const fw = ops.fw,
    read = (name: string) => fw.readInput(name);
  const parent = `group!==undefined || ${fw.controlled("checked")}`;
  const controlled = fw.modelAuthority === "runtime-binding" ? "group!==undefined" : parent;
  const publish =
    fw.modelAuthority === "runtime-binding"
      ? `if(group===undefined){${fw.publishModel("checked", "next")}}`
      : "";
  const render = renderAcceptedState(ops, "checked", "next", "group");
  const functions: [string, string][] = [
    [
      "groupChecked",
      `group===undefined ? undefined : ${ops.groupValue("value")}===${read("value")}`,
    ],
    ["effectiveChecked", `groupChecked() ?? ${read("checked")}`],
    ...["disabled", "readOnly", "required"].map(
      (name) =>
        [
          `effective${name[0].toUpperCase() + name.slice(1)}`,
          `${read(name)} || ${ops.groupValue(name)}===true`,
        ] as [string, string],
    ),
    ...["form", "name"].map(
      (name) =>
        [
          `effective${name[0].toUpperCase() + name.slice(1)}`,
          `${ops.groupValue(name)} ?? ${read(name)}`,
        ] as [string, string],
    ),
  ];
  const p: RadioProjection = {
    element: `${read("nativeButton")} ? ${JSON.stringify(facts.render.nativeElement)} : ${JSON.stringify(facts.render.nonNativeElement)}`,
    inputInside: `!${read("nativeButton")}`,
    inputOutside: read("nativeButton"),
    props: Object.values(facts.props).filter(
      (p): p is AdapterFamilyProp => p !== undefined && p.name !== "keepMounted",
    ),
    functions,
    initial: initialCheckedValue("effectiveChecked()", read("defaultChecked"), "false"),
    seed: `${read("defaultChecked")} ?? initialChecked`,
    selected: `effectiveChecked() ?? ${ops.acceptedRead}`,
    reconnect: ["id", "nativeButton"],
    commands: [
      { name: "applyParent", inputs: ["checked", "groupChecked()"] },
      { name: "applyOwnState", inputs: ["disabled", "readOnly"], phase: "after-parent" },
      { name: "applyFormOptions", inputs: ["form", "name", "required", "value"] },
    ],
    attrs: [
      [facts.attrs.root, '""'],
      ["data-sw-part", '"root"'],
      ["role", JSON.stringify(facts.render.role)],
      [facts.attrs.ariaState, "selected"],
      ["aria-disabled", 'effectiveDisabled() ? "true" : undefined'],
      [facts.attrs.defaultState, 'group===undefined && resetSeed ? "true" : undefined'],
      [facts.attrs.truthyPresence, 'selected ? "" : undefined'],
      [facts.attrs.falsyPresence, 'selected ? undefined : ""'],
      [facts.attrs.disabled, 'effectiveDisabled() ? "" : undefined'],
      [facts.attrs.readOnly!, 'effectiveReadOnly() ? "" : undefined'],
      [facts.attrs.required!, 'effectiveRequired() ? "" : undefined'],
      ...["form", "id", "name", "value"].map(
        (name) => [facts.attrs[name as "form"]!, read(name)] as [string, string],
      ),
      ["id", `${read("nativeButton")} ? ${read("id")} : undefined`],
      ["type", `${read("nativeButton")} ? "button" : undefined`],
      ["disabled", `${read("nativeButton")} ? effectiveDisabled() : undefined`],
      ["tabindex", "effectiveDisabled() ? -1 : 0"],
    ],
    inputStyle: [
      ["position", "absolute"],
      ["width", "1px"],
      ["height", "1px"],
      ["margin", "-1px"],
      ["overflow", "hidden"],
      ["clip", "rect(0 0 0 0)"],
      ["white-space", "nowrap"],
      ["border", "0"],
    ],
    input: [
      [facts.attrs.input, '""'],
      ["type", '"radio"'],
      ["aria-hidden", '"true"'],
      ["tabindex", "-1"],
      ["checked", "initialChecked"],
      ["disabled", "effectiveDisabled()"],
      ["form", "effectiveForm()"],
      ["name", "effectiveName()"],
      ["required", "effectiveRequired()"],
      ["value", read("value")],
      ["id", `${read("nativeButton")} ? undefined : ${read("id")}`],
    ],
  };
  const code = `function disconnect(){const owned=connection.instance;if(!owned)return;connection.accepted=owned.getChecked();connection.unsubscribe?.();connection.unsubscribeSync?.();connection.instance=undefined;owned.destroy();}
function publishRuntime(owned:ReturnType<typeof createRadio>){if(connection.instance!==owned)return;const next=owned.getChecked();connection.accepted=next;${render}${publish}}
function connect(root:HTMLElement){disconnect();const desired=effectiveChecked()??connection.accepted;const owned=createRadio(root,{defaultChecked:resetSeed,...(${controlled}?{checked:desired}:{}),${["disabled", "form", "id", "name", "readOnly", "required", "value"].map((name) => `${name}:${read(name)}`).join(",")},onCheckedChange:(next,detail)=>{${fw.untracked(fw.proposal("onCheckedChange", "next", "detail"))}}});connection.instance=owned;connection.disabled=${read("disabled")};connection.readOnly=${read("readOnly")};if(owned.getChecked()!==desired)owned.setChecked(desired,{emit:false});
connection.unsubscribe=owned.subscribe('checkedChange',detail=>detail.onAccepted(()=>{if(connection.instance!==owned)return;${fw.untracked(`publishRuntime(owned);${fw.modelAuthority === "parent-prop" ? fw.publishModel("checked", "detail.checked") : ""}`)}}));
connection.unsubscribeSync=owned.subscribe('stateSync',()=>{${fw.untracked("publishRuntime(owned);")}});publishRuntime(owned);}
function applyParent(){const owned=connection.instance,next=effectiveChecked();if(!owned||next===undefined||owned.getChecked()===next)return;owned.setChecked(next,{emit:false});publishRuntime(owned);}
function applyOwnState(){const owned=connection.instance;if(!owned)return;${["disabled", "readOnly"].map((name) => `const next${name}=${read(name)};if(next${name}!==connection.${name}){connection.${name}=next${name};owned.${name === "disabled" ? "setDisabled" : "setReadOnly"}(next${name});if(group&&next${name})owned.root.setAttribute('${name === "disabled" ? facts.attrs.disabled : facts.attrs.readOnly}','');}`).join("\n")}}
function applyFormOptions(){const owned=connection.instance;if(!owned)return;owned.setFormOptions({${["form", "name", "required", "value"].map((name) => `${name}:${read(name)}`).join(",")}});}`;
  return ops.frame(code, p);
}
