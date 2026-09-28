import { initialFormState } from "../shared-recipes/structured/forms/lifecycle.js";
import type { FormControlPlan } from "../shared-recipes/structured/forms/plan.js";
import type { Target } from "../shared-recipes/structured/operations.js";

const hiddenStyle =
  "position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;";
/** One form composition frame for both contracts. All state and reset algorithms come from the plan emitter. */
export function formProjection(
  target: Target,
  plan: FormControlPlan,
  fw: import("./form-control-operations.js").FormTargetOperations,
  code: string,
  connection: string,
) {
  const grouped = plan.group !== "none";
  const fields = plan.props.map((prop) => `${prop.name}?: ${prop.type};`).join("\n");
  // Keep the absence of defaultChecked visible so a binding can supply its initial reset baseline.
  const defaults = plan.props.filter((prop) => prop.name !== "defaultChecked");
  const destructure = plan.props
    .map((prop) =>
      prop.name === "checked" && target === "svelte"
        ? "checked = $bindable()"
        : `${prop.name}${prop.defaultValue && prop.name !== "defaultChecked" ? ` = ${prop.defaultValue}` : ""}`,
    )
    .join(", ");
  const inputNames = plan.retainedInputs;
  const access = (name: string) => (target === "vue" ? `props.${name}` : name);
  const renderedChecked =
    target === "react"
      ? "renderedChecked"
      : target === "vue"
        ? "renderedChecked"
        : "renderedChecked";
  const disabled = target === "vue" ? "effectiveDisabledValue" : "effectiveDisabledValue";
  const ariaBoolean = (expression: string) =>
    target === "vue" ? `String(${expression})` : expression;
  const marker = `data-sw-${plan.component.toLowerCase()}`;
  const attrs: Record<string, string> = {
    [marker]: '""',
    "data-sw-part": '"root"',
    role: JSON.stringify(plan.component.toLowerCase()),
    "aria-checked": plan.mixed
      ? `renderedIndeterminate ? "mixed" : ${ariaBoolean(renderedChecked)}`
      : ariaBoolean(renderedChecked),
    "aria-disabled": `${disabled} ? "true" : undefined`,
    "aria-readonly": ariaBoolean(access("readOnly")),
    "aria-required": ariaBoolean(access("required")),
    "data-default-checked": 'resetSeed ? "true" : undefined',
    "data-checked": `${renderedChecked} ? "" : undefined`,
    "data-unchecked": `${renderedChecked} ? undefined : ""`,
    "data-disabled": `${disabled} ? "" : undefined`,
    "data-readonly": `${access("readOnly")} ? "" : undefined`,
    "data-required": `${access("required")} ? "" : undefined`,
    ...(plan.mixed
      ? { "data-indeterminate": 'renderedIndeterminate ? "" : undefined' }
      : { "data-filled": `${renderedChecked} ? "" : undefined` }),
    ...Object.fromEntries(
      ["form", "id", "name", "uncheckedValue", "value"].map((prop) => [
        `data-${prop === "uncheckedValue" ? "unchecked-value" : prop}`,
        access(prop),
      ]),
    ),
    ...(plan.form.nativeRootId
      ? { id: `${access("nativeButton")} ? ${access("id")} : undefined` }
      : {}),
    [target === "react" ? "tabIndex" : "tabindex"]: `${disabled} ? -1 : 0`,
  };
  const attributes = Object.entries(attrs)
    .map(([name, value]) =>
      target === "vue" ? `:${name}='${value.replace(/'/g, "&apos;")}'` : `${name}={${value}}`,
    )
    .join("\n");
  const inputAttrs = `${plan.form.inputAttribute}${target === "svelte" ? '=""' : ""} aria-hidden="true" type="checkbox" ${target === "react" ? "tabIndex={-1}" : 'tabindex="-1"'}`;
  const inputId = plan.form.nativeRootId
    ? `${access("id")} ? (${access("nativeButton")} ? \`${"${" + access("id") + "}"}-input\` : ${access("id")}) : undefined`
    : access("id");
  const inputData = {
    disabled,
    form: access("form"),
    id: inputId,
    name: access("name"),
    required: access("required"),
    value: access("value"),
  };
  const initial = initialFormState(plan, access);
  const imports = `import { ${plan.factory}, type ${plan.model.details} } from "${plan.importSource}";`;
  const groupRead = target === "vue" ? "groupChecked.value" : "groupChecked";
  const groupFunction = `${grouped ? `function groupCheckedValue(): boolean | undefined { return ${groupRead}; }` : ""}
function effectiveChecked(): boolean | undefined { return ${grouped ? "groupCheckedValue() ?? " : ""}${fw.readInput("checked")}; }
function effectiveDisabled(): boolean { return ${target === "react" ? "effectiveDisabledValue" : target === "vue" ? "effectiveDisabledValue.value" : "effectiveDisabledValue"}; }`;

  return {
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
  };
}
export type FormProjection = ReturnType<typeof formProjection>;
