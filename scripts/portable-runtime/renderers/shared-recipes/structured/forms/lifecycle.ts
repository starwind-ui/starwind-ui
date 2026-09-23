import type { FormTargetOperations } from "../../../framework-adapters/form-control-operations.js";
import { initialCheckedValue } from "../../initial-state.js";
import type { FormControlPlan } from "./plan.js";

/** Shared direct form-controller algorithm. Targets contribute accesses and observer scheduling. */
export function formLifecycle(plan: FormControlPlan, fw: FormTargetOperations): string {
  if (
    plan.model.name !== "checked" ||
    plan.model.default !== "defaultChecked" ||
    plan.model.getter !== "getChecked" ||
    plan.model.setter !== "setChecked" ||
    plan.model.event !== "checkedChange" ||
    plan.model.callback !== "onCheckedChange"
  )
    throw new Error("Form fragment requires the checked model contract");
  // React's native input updater re-applies name on every commit; Vue/Svelte retain it until the prop changes.
  const nativeName =
    fw.restoreRuntimeInputName && plan.form.runtimeOwnedAttributes.includes("name");
  const grouped = plan.group !== "none";
  const captureName = nativeName ? "captureNativeInputAttributes();" : "";

  const read = (name: string) =>
    name === "checked"
      ? "effectiveChecked()"
      : name === "disabled"
        ? "effectiveDisabled()"
        : fw.readInput(name);
  const parent = `(${fw.controlled("checked")}${grouped ? " || groupCheckedValue() !== undefined" : ""})`;
  const controlled =
    fw.modelAuthority === "runtime-binding"
      ? grouped
        ? "groupCheckedValue() !== undefined"
        : "false"
      : parent;
  const render = `${fw.renderAccepted("checked", "connection.accepted")}\n${plan.mixed ? fw.renderMixed() : ""}`;
  const modelPublication = fw.publishModel("checked", "connection.accepted");
  const publish = modelPublication
    ? grouped
      ? `if (groupCheckedValue() === undefined) { ${modelPublication} }`
      : modelPublication
    : "";
  const mixedAfter = plan.mixed
    ? `if (${fw.readInput("indeterminate")} && connection.input && !connection.input.indeterminate) owned.setIndeterminate(true, { emit: false });`
    : "";
  const steps = {
    retire: `disconnectRuntime();\nconst desired = ${read("checked")} ?? connection.accepted;`,
    create: `const owned = ${plan.factory}(root, {
      defaultChecked: resetSeed,
      ${controlled === "false" ? "" : `...(${controlled} ? { checked: desired } : {}),`}
      ${plan.constructorInputs.map((name) => `${name}: ${read(name)},`).join("\n")}
      onCheckedChange: (next, detail) => { ${fw.untracked(fw.proposal("onCheckedChange", "next", "detail"))} },
    });
    connection.instance = owned;
    connection.input = input;
    ${
      nativeName
        ? `connection.nameObserver = new MutationObserver(captureNativeInputAttributes);
    connection.nameObserver.observe(input, { attributes: true, attributeFilter: ["name"] });`
        : ""
    }`,
    restore: `if (owned.getChecked() !== desired) owned.setChecked(desired, { emit: false });`,
    subscribe: `connection.unsubscribe = owned.subscribe("checkedChange", detail => {
      if (connection.instance !== owned || detail.isCanceled) return;
      ${fw.untracked(`${mixedAfter}\nrenderRuntimeState(detail.checked);\n${publish}`)}
    });`,
    "bind-reset": "bindFormReset();",
    render: "renderRuntimeState();",
    "publish-binding": fw.modelAuthority === "runtime-binding" ? fw.untracked(publish) : "",
  };
  const cleanup = {
    retain: "connection.accepted = owned.getChecked();",
    unsubscribe: `connection.unsubscribe?.(); connection.unsubscribe = undefined; ${nativeName ? "connection.nameObserver?.disconnect(); connection.nameObserver = undefined;" : ""}`,
    "unbind-reset": "unbindFormReset();",
    "clear-owner": "connection.instance = undefined;",
    destroy: "owned.destroy();",
    "remove-unchecked-input": `const unchecked = connection.input?.nextElementSibling;
    if (unchecked instanceof HTMLInputElement && unchecked.hasAttribute(${JSON.stringify(plan.form.uncheckedAttribute)})) unchecked.remove();
    connection.input = undefined;`,
  };
  const assertions = [
    "retire",
    "create",
    "restore",
    "subscribe",
    "bind-reset",
    "render",
    "publish-binding",
  ];
  if (assertions.some((step, index) => plan.connect[index] !== step))
    throw new Error("Form connection order must preserve reset baseline and accepted subscription");
  return `
function disconnectRuntime(): void {
  const owned = connection.instance;
  if (!owned) return;
  ${plan.cleanup.map((step) => cleanup[step]).join("\n")}
}
function connectRuntime(root: HTMLElement, input: HTMLInputElement): void {
  ${plan.connect.map((step) => steps[step]).join("\n")}
}
${
  nativeName
    ? `function captureNativeInputAttributes(): void {
  connection.runtimeInputName = connection.input?.name;
}
function restoreNativeInputAttributes(): void {
  const input = connection.input;
  if (${fw.readInput("name")} === undefined && input && connection.runtimeInputName !== undefined && input.name !== connection.runtimeInputName) input.name = connection.runtimeInputName;
}`
    : ""
}
function renderRuntimeState(next = connection.instance?.getChecked()): void {
  if (next === undefined) return;
  connection.accepted = next;
  ${captureName}
  ${render}
}
function applyParentCommand(): void {
  const owned = connection.instance;
  const next = effectiveChecked();
  if (!owned || next === undefined) return;
  if (owned.getChecked() !== next || connection.input?.checked !== next) owned.setChecked(next, { emit: false });
  ${mixedAfter}
  renderRuntimeState();
}
function clearResetTask(): void {
  if (connection.resetTimer !== undefined) window.clearTimeout(connection.resetTimer);
  connection.resetTimer = undefined;
}
function unbindFormReset(): void {
  clearResetTask();
  connection.form?.removeEventListener('reset', handleFormReset);
  connection.form = undefined;
}
function handleFormReset(event: Event): void {
  clearResetTask();
  const owned = connection.instance;
  // Runtime registers its reset task first. Read public state after it settles.
  connection.resetTimer = window.setTimeout(() => {
    connection.resetTimer = undefined;
    if (event.defaultPrevented || !owned || connection.instance !== owned${controlled === "false" ? "" : ` || ${controlled}`}) return;
    ${fw.untracked(`${mixedAfter}\nrenderRuntimeState(owned.getChecked());\n${publish}`)}
  }, 0);
}
function bindFormReset(): void {
  const next = connection.input?.form ?? undefined;
  if (next === connection.form) return;
  unbindFormReset();
  connection.form = next;
  next?.addEventListener('reset', handleFormReset);
}
${plan.live
  .map(
    (live, index) => `function applyLive${index}(): void {
  const owned = connection.instance;
  if (!owned) return;
  owned.${live.method}(${live.shape === "object" ? `{ ${live.inputs.map((name) => `${name}: ${read(name)}`).join(", ")} }` : `${read(live.inputs[0]!)}${live.method === "setIndeterminate" ? ", { emit: false }" : ""}`});
  ${live.after === "render" ? "renderRuntimeState();" : live.after === "bind-reset" ? `bindFormReset(); ${captureName}` : ""}
}`,
  )
  .join("\n")}
`;
}
export function connectionType(plan: FormControlPlan, fw: FormTargetOperations): string {
  return `{ instance?: ReturnType<typeof ${plan.factory}>; input?: HTMLInputElement; accepted: boolean; unsubscribe?: () => void; form?: HTMLFormElement; resetTimer?: number; ${fw.restoreRuntimeInputName ? "runtimeInputName?: string; nameObserver?: MutationObserver;" : ""} }`;
}

/** The mount reset seed and initial state precedence are shared across target projections. */
export function initialFormState(
  plan: FormControlPlan,
  readInput: (name: string) => string,
): string {
  return `const initialChecked = ${plan.group !== "none" ? "groupCheckedValue() ?? " : ""}${initialCheckedValue(readInput("checked"), readInput("defaultChecked"), "false")};
const resetSeed = ${readInput("defaultChecked")} ?? initialChecked;`;
}
