import {
  type FormControlPlan,
  formGroupExpressions,
} from "../../shared-recipes/structured/forms/plan.js";
import { operations } from "../../shared-recipes/structured/operations.js";
import type { FormProjection } from "../form-control-frame.js";
import type { FormTargetOperations } from "../form-control-operations.js";
export const formOperations = (plan: FormControlPlan): FormTargetOperations => ({
  ...operations.svelte,
  restoreRuntimeInputName: false,
  renderMixed: () => "renderedIndeterminate = connection.input?.indeterminate ?? false;",
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
  const input = `<input ${inputAttrs} checked={initialChecked} ${Object.entries(inputData)
    .map(([key, value]) => `${key}={${value}}`)
    .join(
      " ",
    )} style="${hiddenStyle}" {@attach attachRuntimeInput}${plan.form.publicInputRef ? " {@attach attachInputRef}" : ""} />`;
  return `${grouped ? svelteIndicatorContext : ""}<script lang="ts">
${imports}
import { getContext, setContext, untrack, type Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { Attachment } from "svelte/attachments";
import { createRefAttachment } from "../_internal/ref-attachment.js";
${grouped ? 'import { CheckboxGroupContext, type CheckboxGroupContextValue } from "./CheckboxGroupContext.svelte.js";' : ""}
type RootElement = HTMLSpanElement | HTMLButtonElement;
type Owned = "children" | "disabled" | "form" | "id" | "name" | "readonly" | "required" | "type" | "value";
type SpanProps = Omit<HTMLAttributes<HTMLElement>, Owned>;
type ButtonProps = Omit<HTMLButtonAttributes, Owned>;
type StrictSpanProps = SpanProps & { [Key in Exclude<keyof ButtonProps, keyof SpanProps>]?: never };
type Props = { children?: Snippet; ${fields}
 onCheckedChange?: (checked: boolean, detail: ${plan.model.details}) => void;
 ${plan.form.publicInputRef ? "inputRef?: (element: HTMLInputElement | null) => void;" : ""}
} & ((StrictSpanProps & { nativeButton?: false; ref?: (element: HTMLSpanElement | null) => void }) | (ButtonProps & { nativeButton: true; ref?: (element: HTMLButtonElement | null) => void }));
let { children, ${destructure}, onCheckedChange, ref, ${plan.form.publicInputRef ? "inputRef," : ""} ...rest }: Props = $props();
${
  grouped
    ? `const group = getContext<CheckboxGroupContextValue | undefined>(CheckboxGroupContext);
let itemValue = $derived(${groupExpressions.item});
let groupChecked = $derived(${groupExpressions.checked});`
    : ""
}
let effectiveDisabledValue = $derived(${groupExpressions.disabled});
${groupFunction}
let nativeProps = $derived({ ...rest } as SpanProps | ButtonProps);
const initial = untrack(() => { ${initial} return { checked: initialChecked, reset: resetSeed }; });
const initialChecked = initial.checked;
const resetSeed = initial.reset;
${fw.acceptedCell("checked", "boolean", "initialChecked")}
${plan.mixed ? "let renderedIndeterminate = $state(untrack(() => indeterminate));" : ""}
const connection: ${connection} = { accepted: initialChecked };
${grouped ? svelteIndicatorOwner : ""}
${code}
${observe(plan)}
const attachRef = createRefAttachment<HTMLElement, RootElement>(() => ref as ((element: RootElement | null) => void) | undefined);
${plan.form.publicInputRef ? "const attachInputRef = createRefAttachment<HTMLInputElement>(() => inputRef);" : ""}
</script>
<svelte:element this={nativeButton ? "button" : "span"} {...nativeProps} ${attributes} disabled={nativeButton ? effectiveDisabledValue : undefined} type={nativeButton ? "button" : undefined} {@attach attachRef}>
{@render children?.()}
${plan.form.inputPlacement.svelte === "inside-span" ? `{#if !nativeButton}${input}{/if}` : ""}
</svelte:element>
${plan.form.inputPlacement.svelte === "inside-span" ? `{#if nativeButton}${input}{/if}` : input}
`;
}
function observe(plan: FormControlPlan): string {
  const grouped = plan.group !== "none";
  const deps = (names: readonly string[]) =>
    names.map((name) => (name === "disabled" ? "effectiveDisabledValue" : name)).join(", ");
  const root =
    plan.form.inputPlacement.svelte === "inside-span"
      ? "nativeButton ? input.previousElementSibling : input.parentElement"
      : "input.previousElementSibling";
  return `const attachRuntimeInput: Attachment<HTMLInputElement> = input => {
  const root = untrack(() => ${root});
  if (!(root instanceof HTMLElement)) throw new TypeError("Form input requires its semantic root.");
  $effect(() => { void [${plan.reconstructionInputs.filter((name) => name !== "nativeButton").join(", ")}]; untrack(() => connectRuntime(root, input)); return disconnectRuntime; });
  $effect(() => { void checked; ${grouped ? "void groupChecked;" : ""} untrack(applyParentCommand); });
  ${plan.live.map((live, i) => `$effect(() => { void [${deps(live.inputs)}]; untrack(applyLive${i}); });`).join("\n")}
};`;
}
const svelteIndicatorContext = `<script module lang="ts">
export type CheckboxIndicatorContextValue = Readonly<{ checked: boolean; disabled: boolean; indeterminate: boolean; readOnly: boolean; required: boolean }>;
export const CheckboxIndicatorContext: symbol = Symbol("Starwind Checkbox indicator context");
</script>\n`;
const svelteIndicatorOwner = `setContext<CheckboxIndicatorContextValue>(CheckboxIndicatorContext, {
 get checked() { return renderedChecked; }, get disabled() { return effectiveDisabledValue; },
 get indeterminate() { return renderedIndeterminate; }, get readOnly() { return readOnly; }, get required() { return required; }
});`;
