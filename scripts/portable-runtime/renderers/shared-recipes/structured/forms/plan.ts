import { checkboxRuntimeAdapterContract } from "../../../../contracts/primitive/components/checkbox.js";
import { switchRuntimeAdapterContract } from "../../../../contracts/primitive/components/switch.js";
import type { Target } from "../operations.js";

/** Form controls share this aligned fragment. Runtime owns form values and reset behavior. */
export type FormControlPlan = {
  component: "Checkbox" | "Switch";
  factory: string;
  importSource: string;
  props: readonly { name: string; type: string; defaultValue?: string }[];
  model: {
    name: "checked";
    default: "defaultChecked";
    getter: "getChecked";
    setter: "setChecked";
    event: "checkedChange";
    callback: "onCheckedChange";
    details: string;
  };
  retainedInputs: readonly string[];
  constructorInputs: readonly string[];
  reconstructionInputs: readonly string[];
  live: readonly {
    method: string;
    inputs: readonly string[];
    shape: "scalar" | "object";
    after: "render" | "bind-reset" | "none";
  }[];
  form: {
    inputAttribute: string;
    uncheckedAttribute: string;
    inputPlacement: Record<Target, "inside-span" | "sibling">;
    nativeRootId: boolean;
    publicInputRef: boolean;
    runtimeOwnedAttributes: readonly ["name"];
  };
  group: "optional-checkbox-group" | "none";
  mixed: boolean;
  connect: readonly (
    | "retire"
    | "create"
    | "restore"
    | "subscribe"
    | "bind-reset"
    | "render"
    | "publish-binding"
  )[];
  cleanup: readonly (
    | "retain"
    | "unsubscribe"
    | "unbind-reset"
    | "clear-owner"
    | "destroy"
    | "remove-unchecked-input"
  )[];
};
const contractFor = {
  Checkbox: checkboxRuntimeAdapterContract,
  Switch: switchRuntimeAdapterContract,
};
export function formControlPlan(component: "Checkbox" | "Switch"): FormControlPlan {
  const contract = contractFor[component];
  const mixed = component === "Checkbox";
  const state = contract.stateModels.find((model) => model.name === "checked")!;
  const event = contract.events.find((event) => event.name === "checkedChange")!;
  if (state.name !== "checked") throw new Error("Form recipe requires checked model facts");
  return {
    component,
    factory: contract.runtime.factory,
    importSource: contract.runtime.importSource,
    props: contract.props.filter(
      (prop) =>
        prop.kind !== "callback" &&
        (!("targets" in prop) || prop.targets.includes("root" as never)),
    ),
    model: {
      name: state.name,
      default: state.defaultProp,
      getter: state.runtimeGetter,
      setter: state.runtimeSetter,
      event: event.name,
      callback: event.callbackProp,
      details: event.detailsType,
    },
    retainedInputs: [state.name, event.callbackProp, ...(mixed ? ["indeterminate"] : [])],
    constructorInputs: [
      "disabled",
      "form",
      "id",
      ...(mixed ? ["indeterminate"] : []),
      "name",
      "readOnly",
      "required",
      "uncheckedValue",
      "value",
    ],
    reconstructionInputs: ["id", "readOnly", "nativeButton"],
    live: [
      { method: "setDisabled", inputs: ["disabled"], shape: "scalar", after: "none" },
      ...(mixed
        ? [
            {
              method: "setIndeterminate",
              inputs: ["indeterminate"],
              shape: "scalar",
              after: "render",
            } as const,
          ]
        : []),
      {
        method: "setFormOptions",
        inputs: ["form", "name", "required", "uncheckedValue", "value"],
        shape: "object",
        after: "bind-reset",
      },
    ],
    form: {
      inputAttribute: contract.parts.find((part) => part.name === "input")!.discoveryAttribute,
      uncheckedAttribute: contract.parts.find((part) => part.name === "uncheckedInput")!
        .discoveryAttribute,
      inputPlacement: {
        react: mixed ? "inside-span" : "sibling",
        vue: mixed ? "inside-span" : "sibling",
        svelte: "inside-span",
      },
      nativeRootId: !mixed,
      publicInputRef: !mixed,
      runtimeOwnedAttributes: ["name"],
    },
    group: mixed ? "optional-checkbox-group" : "none",
    mixed,
    connect: [
      "retire",
      "create",
      "restore",
      "subscribe",
      "bind-reset",
      "render",
      "publish-binding",
    ],
    cleanup: [
      "retain",
      "unsubscribe",
      "unbind-reset",
      "clear-owner",
      "destroy",
      "remove-unchecked-input",
    ],
  };
}
export const checkboxPlan = formControlPlan("Checkbox");
export const switchPlan = formControlPlan("Switch");

/** Checkbox group authority and value fallback are shared; adapters supply reactive accesses. */
export function formGroupExpressions(
  plan: FormControlPlan,
  access: {
    value: string;
    name: string;
    item: string;
    groupValues: string;
    groupDisabled: string;
    disabled: string;
  },
) {
  const combinedDisabled = formDisabledExpression(access.disabled, access.groupDisabled);
  return {
    item: `${access.value} ?? ${access.name}`,
    checked:
      plan.group === "optional-checkbox-group"
        ? `group && ${access.item} !== undefined ? ${access.groupValues}.includes(${access.item}) : undefined`
        : "undefined",
    disabled: plan.group === "optional-checkbox-group" ? combinedDisabled : access.disabled,
  };
}

export function formDisabledExpression(disabled: string, groupDisabled: string): string {
  return `${disabled} || ${groupDisabled}`;
}
