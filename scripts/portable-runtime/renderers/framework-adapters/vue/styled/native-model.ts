import { nativeValuePolicy } from "../../../shared-recipes/passive/native-values.js";
import type {
  StyledOutputComponent,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { supportsVueScope } from "./scope.js";
import type { VueImportName, VueModelProjection } from "./types.js";

const MODEL_NAME = "modelValue";
const UPDATE_EVENT = "update:modelValue";

type NativeModelTarget = {
  imports: VueImportName[];
  setup: string[];
};

/**
 * Projects the contract's native model to Vue `v-model`. An undefined model keeps the control
 * under the browser, so plain `value`, native defaults, and native reset stay unchanged.
 */
export function applyVueNativeModel(
  component: StyledOutputComponent,
  target: NativeModelTarget,
): VueModelProjection | undefined {
  const policy = nativeValuePolicy(component.nativeModel);
  if (!policy) return undefined;
  const control = findNativeElement(component.render, policy.tag);
  if (!control) {
    throw new TypeError(`Vue Styled ${component.exportName} requires its native ${policy.tag}.`);
  }
  control.attrs.push({
    name: `@${policy.updateEvent}`,
    targetScopes: ["vue"],
    value: { type: "variable", name: "handleNativeModelUpdate" },
  });

  if (policy.writesThrough === "value-property") {
    target.imports.push(
      { kind: "value", name: "onBeforeUnmount" },
      { kind: "value", name: "onMounted" },
    );
    const spread = control.attrs.find(
      (attribute) => attribute.name === "spread" && supportsVueScope(attribute.targetScopes),
    );
    if (!spread) {
      throw new TypeError(`Vue Styled ${component.exportName} requires an attrs spread.`);
    }
    // A bound undefined value would clear typed text on each render, so the key stays absent.
    spread.value = {
      type: "raw",
      code: `${MODEL_NAME} === undefined ? attrs : { ...attrs, value: ${MODEL_NAME} }`,
    };
    // Child text is the native default. It renders on the server and is what native reset restores,
    // so a parent value survives reset and an omitted model resets to its seed. An authored default
    // is the exception: see handleFormReset.
    control.selfClosing = false;
    control.inlineChildren = true;
    control.children = [
      {
        type: "text",
        value: `{${MODEL_NAME} === undefined ? (attrs.value ?? defaultValue) : ${MODEL_NAME}}`,
      },
    ];
    control.attrs.push(
      {
        name: "@compositionstart",
        targetScopes: ["vue"],
        value: { type: "variable", name: "handleCompositionStart" },
      },
      {
        name: "@compositionend",
        targetScopes: ["vue"],
        value: { type: "variable", name: "handleCompositionEnd" },
      },
    );
    target.setup.push(`let composing = false;

function handleNativeModelUpdate(event: Event): void {
  if (composing) return;
  emit(${JSON.stringify(UPDATE_EVENT)}, (event.target as HTMLTextAreaElement).value);
}

function handleCompositionStart(): void {
  composing = true;
}

// As Vue's native v-model does, the model takes composed text once composition ends.
function handleCompositionEnd(event: Event): void {
  composing = false;
  handleNativeModelUpdate(event);
}

// As on React and Svelte, an authored default wins over the model at native reset. The model takes
// that default, so it agrees with the field and the submitted value.
function handleFormReset(event: Event): void {
  const control = element.value;
  if (defaultValue == null || ${MODEL_NAME} === undefined || event.target !== control?.form) return;
  window.setTimeout(() => {
    if (event.defaultPrevented) return;
    control.value = defaultValue;
    emit(${JSON.stringify(UPDATE_EVENT)}, defaultValue);
  }, 0);
}

onMounted(() => document.addEventListener("reset", handleFormReset));
onBeforeUnmount(() => document.removeEventListener("reset", handleFormReset));`);
    return { name: MODEL_NAME, type: "string | null", updateEvent: UPDATE_EVENT };
  }

  // Vue's value patch stringifies arrays and skips a select during hydration.
  target.imports.push({ kind: "value", name: "onMounted" }, { kind: "value", name: "onUpdated" });
  target.setup.push(`function handleNativeModelUpdate(event: Event): void {
  const control = event.target as HTMLSelectElement;
  emit(
    ${JSON.stringify(UPDATE_EVENT)},
    control.multiple ? Array.from(control.selectedOptions, (option) => option.value) : control.value,
  );
}

function applyNativeModel(): void {
  const control = element.value;
  if (!control || ${MODEL_NAME} === undefined) return;
  if (typeof ${MODEL_NAME} === "string" || ${MODEL_NAME} === null) {
    const next = ${MODEL_NAME} ?? "";
    if (control.value !== next) control.value = next;
    return;
  }
  for (const option of control.options) option.selected = ${MODEL_NAME}.includes(option.value);
}

onMounted(applyNativeModel);
onUpdated(applyNativeModel);`);
  return { name: MODEL_NAME, type: "string | readonly string[] | null", updateEvent: UPDATE_EVENT };
}

function findNativeElement(
  nodes: readonly StyledOutputRenderNode[],
  tag: string,
): Extract<StyledOutputRenderNode, { type: "element" }> | undefined {
  for (const node of nodes) {
    if (node.type === "element" && node.tag === tag) return node;
    if ("children" in node) {
      const found = findNativeElement(node.children, tag);
      if (found) return found;
    }
  }
  return undefined;
}
