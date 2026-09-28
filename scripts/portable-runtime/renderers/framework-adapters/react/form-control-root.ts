import {
  type FormControlPlan,
  formGroupExpressions,
} from "../../shared-recipes/structured/forms/plan.js";
import { operations } from "../../shared-recipes/structured/operations.js";
import type { FormProjection } from "../form-control-frame.js";
import {
  checkboxIndicatorTransport,
  type FormTargetOperations,
} from "../form-control-operations.js";
export const formOperations = (plan: FormControlPlan): FormTargetOperations => ({
  ...operations.react,
  readInput: (name) => (plan.retainedInputs.includes(name) ? `inputs.current.${name}` : name),
  restoreRuntimeInputName: true,
  renderMixed: () => "setRenderedIndeterminate(connection.input?.indeterminate ?? false);",
});
export function printFormProjection(projection: FormProjection): string {
  const {
    target,
    plan,
    fw,
    grouped,
    fields,
    defaults,
    destructure,
    inputNames,
    access,
    attributes,
    inputAttrs,
    inputData,
    initial,
    code,
    imports,
    groupFunction,
    connection,
    hiddenStyle,
  } = projection;
  const groupExpressions = formGroupExpressions(plan, {
    value: "value",
    name: "name",
    item: "itemValue",
    groupValues: "group.value",
    groupDisabled: "group?.disabled === true",
    disabled: "disabled",
  });
  const input = `<input ${inputAttrs} defaultChecked={initialChecked} ${Object.entries(inputData)
    .map(([key, value]) => `${key === "value" ? "defaultValue" : key}={${value}}`)
    .join(" ")} style={visuallyHiddenStyle} ref={composedInputRef} />`;
  const children = grouped
    ? "<CheckboxIndicatorContext.Provider value={indicatorState}>{children}</CheckboxIndicatorContext.Provider>"
    : "{children}";
  return `"use client";
${imports}
import * as React from "react";
import { setRef } from "../internal/compose-refs";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";
${grouped ? 'import { useCheckboxGroupContext } from "../checkbox-group/CheckboxGroupContext";' : ""}
export type ${plan.component}RootProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "defaultChecked" | "onChange"> & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "defaultChecked" | "onChange" | "type"> & {
${fields}
onCheckedChange?: (checked: boolean, details: ${plan.model.details}) => void;
${plan.form.publicInputRef ? "inputRef?: React.Ref<HTMLInputElement>;" : ""}
};
const visuallyHiddenStyle = { position: "absolute", width: "1px", height: "1px", margin: "-1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 } satisfies React.CSSProperties;
${grouped ? reactIndicatorContext : ""}
const ${plan.component}Root = React.forwardRef<HTMLSpanElement | HTMLButtonElement, ${plan.component}RootProps>(function ${plan.component}Root({ children, ${destructure}, onCheckedChange, ${plan.form.publicInputRef ? "inputRef," : ""} ...props }, forwardedRef) {
  const rootRef = React.useRef<HTMLSpanElement | HTMLButtonElement>(null);
  const inputElement = React.useRef<HTMLInputElement>(null);
  ${
    grouped
      ? `const group = useCheckboxGroupContext();
  const itemValue = ${groupExpressions.item};
  const groupChecked = ${groupExpressions.checked};
  const groupCheckedRef = React.useRef(groupChecked);
  useIsomorphicLayoutEffect(() => { groupCheckedRef.current = groupChecked; });`
      : ""
  }
  const effectiveDisabledValue = ${groupExpressions.disabled};
  const inputs = React.useRef({ ${inputNames.join(", ")} });
  useIsomorphicLayoutEffect(() => { inputs.current = { ${inputNames.join(", ")} }; });
  ${groupFunction.replace("return groupChecked;", "return groupCheckedRef.current;")}
  const initial = React.useRef<{ checked: boolean; reset: boolean } | undefined>(undefined);
  if (!initial.current) { ${initial} initial.current = { checked: initialChecked, reset: resetSeed }; }
  const initialChecked = initial.current.checked;
  const resetSeed = initial.current.reset;
  ${fw.acceptedCell("checked", "boolean", "initialChecked")}
  ${plan.mixed ? "const [renderedIndeterminate, setRenderedIndeterminate] = React.useState(indeterminate);" : ""}
  const connection = React.useRef<${connection}>({ accepted: initialChecked }).current;
  const composedRef = React.useCallback((node: HTMLSpanElement | HTMLButtonElement | null) => { rootRef.current = node; return setRef(forwardedRef, node); }, [forwardedRef]);
  const composedInputRef = React.useCallback((node: HTMLInputElement | null) => { inputElement.current = node; ${plan.form.publicInputRef ? "return setRef(inputRef, node);" : ""} }, [${plan.form.publicInputRef ? "inputRef" : ""}]);
  ${code}
  ${observe(plan)}
  const renderedChecked = ${grouped ? "groupChecked ?? " : ""}checked ?? renderedState;
  ${grouped ? reactIndicatorOwner(checkboxIndicatorTransport.react.restoreAuthoredHidden) : ""}
  const input = ${input};
  const Root = nativeButton ? "button" : "span";
  return <><Root {...props} ${attributes} disabled={nativeButton ? effectiveDisabledValue : undefined} type={nativeButton ? "button" : undefined} ref={composedRef}>${children}${plan.form.inputPlacement.react === "inside-span" ? "{!nativeButton && input}" : ""}</Root>${plan.form.inputPlacement.react === "inside-span" ? "{nativeButton && input}" : "{input}"}</>;
});
${plan.component}Root.displayName = "${plan.component}.Root";
export default ${plan.component}Root;
`;
}
function observe(plan: FormControlPlan): string {
  const grouped = plan.group !== "none";
  const deps = (names: readonly string[]) =>
    names.map((name) => (name === "disabled" ? "effectiveDisabledValue" : name)).join(", ");
  return `useIsomorphicLayoutEffect(() => {
    if (rootRef.current && inputElement.current) connectRuntime(rootRef.current, inputElement.current);
    return disconnectRuntime;
  }, [${plan.reconstructionInputs.join(", ")}]);
  useIsomorphicLayoutEffect(restoreNativeInputAttributes);
  useIsomorphicLayoutEffect(applyParentCommand, [checked${grouped ? ", groupChecked" : ""}]);
  ${plan.live.map((live, i) => `useIsomorphicLayoutEffect(applyLive${i}, [${deps(live.inputs)}]);`).join("\n")}`;
}
const reactIndicatorContext = `type IndicatorState = { checked: boolean; disabled: boolean; indeterminate: boolean; readOnly: boolean; required: boolean; registerIndicatorVisibility(node: HTMLElement, hidden: boolean): void };
export const CheckboxIndicatorContext = React.createContext<IndicatorState>({ checked: false, disabled: false, indeterminate: false, readOnly: false, required: false, registerIndicatorVisibility() {} });`;
const reactIndicatorOwner = (
  restoreAuthoredHidden: boolean,
) => `const explicitlyHidden = React.useRef(new Set<HTMLElement>());
const registerIndicatorVisibility = React.useCallback((node: HTMLElement, hidden: boolean) => { if (hidden) explicitlyHidden.current.add(node); else explicitlyHidden.current.delete(node); }, []);
const indicatorState = { checked: renderedChecked, disabled: effectiveDisabledValue, indeterminate: renderedIndeterminate, readOnly, required, registerIndicatorVisibility };
${restoreAuthoredHidden ? "useIsomorphicLayoutEffect(() => { explicitlyHidden.current.forEach(node => { node.hidden = true; }); });" : ""}`;
