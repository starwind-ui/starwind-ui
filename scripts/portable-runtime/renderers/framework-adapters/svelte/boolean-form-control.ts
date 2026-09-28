import { assertBooleanStatePolicy } from "../../primitive-output-model/boolean-state-policy.js";
import { checkboxIndicatorPolicy } from "../../shared-recipes/structured/forms/indicator.js";
import { renderFormRoot } from "../../shared-recipes/structured/forms/root.js";
import { checkboxIndicatorTransport } from "../form-control-operations.js";
import type {
  AdapterBooleanFormControlFacts,
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

const NON_SHIPPING_COMMENT = "Svelte 5 public beta adapter output.";

export function printSvelteBooleanFormControlComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "boolean-form-control") {
    throw new TypeError("Svelte Boolean form-control projection requires Boolean family facts.");
  }

  assertBooleanStatePolicy(family.facts);
  if (
    family.part === "root" &&
    (family.facts.displayName === "Checkbox" || family.facts.displayName === "Switch")
  )
    return {
      path: `${file.path}.svelte`,
      contents: renderFormRoot(family.facts.displayName, "svelte"),
    };
  return family.part === "root"
    ? printRoot(file, family.facts)
    : printIndicator(file, family.facts);
}

export function printSvelteBooleanFormControlIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "boolean-form-control") {
    throw new TypeError("Svelte Boolean form-control index requires Boolean family facts.");
  }
  const { facts } = family;
  const indicator = requireFact(facts.exports.stateIndicator, "state indicator export");
  const groupContext = `${facts.exports.namespace}GroupContext`;
  const groupContextType = `${groupContext}Value`;

  return {
    contents: `import ${facts.exports.root} from "./${facts.exports.root}.svelte";
import ${indicator} from "./${indicator}.svelte";

const ${facts.exports.namespace} = { Root: ${facts.exports.root}, Indicator: ${indicator} };
export { ${facts.exports.namespace}, ${facts.exports.root}, ${indicator} };
export default ${facts.exports.namespace};

export { ${groupContext} } from "./${groupContext}.svelte.js";
export type { ${groupContextType} } from "./${groupContext}.svelte.js";
`,
    path: file.path,
  };
}

function printRoot(
  file: AdapterComponentFile,
  facts: AdapterBooleanFormControlFacts,
): AdapterPrintedFile {
  const indicator = requireFact(facts.parts.stateIndicator, "state indicator part");
  const indeterminate = requireFact(facts.props.indeterminate, "indeterminate prop");
  const form = requireFact(facts.props.form, "form prop");
  const id = requireFact(facts.props.id, "id prop");
  const name = requireFact(facts.props.name, "name prop");
  const readOnly = requireFact(facts.props.readOnly, "readOnly prop");
  const required = requireFact(facts.props.required, "required prop");
  const uncheckedValue = requireFact(facts.props.uncheckedValue, "uncheckedValue prop");
  const value = requireFact(facts.props.value, "value prop");
  const indeterminateSetter = requireFact(facts.setters.indeterminate, "indeterminate setter");
  const group = requireFact(facts.group, "optional group context");
  const groupDisabledField = requireFact(
    group.valueFields.find((field) => field === facts.props.disabled.name),
    "group disabled field",
  );
  const groupValueField = requireFact(
    group.valueFields.find((field) => field !== groupDisabledField),
    "group value field",
  );
  const groupContext = `${facts.exports.namespace}GroupContext`;
  const groupContextType = `${groupContext}Value`;
  const indicatorContext = `${facts.exports.namespace}IndicatorContext`;
  const indicatorContextType = `${indicatorContext}Value`;
  const rootElementType = `${facts.render.nonNativeElementType} | ${facts.render.nativeElementType}`;
  const state = facts.props.state.name;
  const defaultState = facts.props.defaultState.name;
  const disabled = facts.props.disabled.name;
  const nativeButton = facts.props.nativeButton.name;
  const callback = facts.event.callbackProp;
  const keepMountedAttribute = requireFact(
    facts.attrs.stateIndicatorKeepMounted,
    "state indicator keep-mounted attribute",
  );
  const uncheckedInput = requireFact(facts.parts.uncheckedInput, "unchecked input part");

  return {
    contents: `<!-- ${NON_SHIPPING_COMMENT} -->
<script module lang="ts">
  export type ${indicatorContextType} = Readonly<{
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
    readOnly: boolean;
    required: boolean;
  }>;

  export const ${indicatorContext}: symbol = Symbol("Starwind ${facts.displayName} indicator context");
</script>

<script lang="ts">
  import {
    type ${facts.event.detailsType},
    ${facts.runtime.factory},
  } from "${facts.runtime.importSource}";
  import { getContext, setContext, untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
  import { createRefAttachment as createRootRefAttachment } from "../_internal/ref-attachment.js";
  import { ${groupContext}, type ${groupContextType} } from "./${groupContext}.svelte.js";

  type RootElement = ${rootElementType};
  type ContractOwnedNativeProp =
    | "children"
    | "disabled"
    | "form"
    | "id"
    | "name"
    | "readonly"
    | "required"
    | "type"
    | "value";
  type NonNativeProps = Omit<
    HTMLAttributes<HTMLElement>,
    ContractOwnedNativeProp
  >;
  type NativeButtonProps = Omit<HTMLButtonAttributes, ContractOwnedNativeProp>;
  type ButtonOnlyNativeProp = Exclude<keyof NativeButtonProps, keyof NonNativeProps>;
  type StrictNonNativeProps = NonNativeProps & {
    [Prop in ButtonOnlyNativeProp]?: never;
  };
  type NativeProps = NonNativeProps | NativeButtonProps;
  type ContractProps = {
    children?: Snippet;
    ${state}?: ${facts.props.state.type};
    ${defaultState}?: ${facts.props.defaultState.type};
    ${disabled}?: ${facts.props.disabled.type};
    ${form.name}?: ${form.type};
    ${id.name}?: ${id.type};
    ${indeterminate.name}?: ${indeterminate.type};
    ${name.name}?: ${name.type};
    ${callback}?: (checked: ${facts.event.valueType}, detail: ${facts.event.detailsType}) => void;
    ${readOnly.name}?: ${readOnly.type};
    ref?: (element: RootElement | null) => void;
    ${required.name}?: ${required.type};
    ${uncheckedValue.name}?: ${uncheckedValue.type};
    ${value.name}?: ${value.type};
  };
  type Props = ContractProps & (
    | (StrictNonNativeProps & { ${nativeButton}?: false })
    | (NativeButtonProps & { ${nativeButton}: true })
  );

  let {
    children,
    ${state} = $bindable(),
    ${defaultState},
    ${disabled} = false,
    ${form.name},
    ${id.name},
    ${indeterminate.name} = false,
    ${name.name},
    ${nativeButton} = false,
    ${callback},
    ${readOnly.name} = false,
    ref,
    ${required.name} = false,
    ${uncheckedValue.name},
    ${value.name},
    ...rest
  }: Props = $props();

  const initialModel = untrack(() => ${state});
  const initialDefault = untrack(() => ${defaultState});
  const groupContext = getContext<${groupContextType} | undefined>(${groupContext});
  let groupItemValue = $derived(${value.name} ?? ${name.name});
  let groupChecked = $derived(
    groupContext && groupItemValue !== undefined
      ? groupContext.${groupValueField}.includes(groupItemValue)
      : undefined,
  );
  const groupControls = untrack(() => groupChecked !== undefined);
  const initialChecked = untrack(() =>
    groupControls ? groupChecked! : initialModel ?? initialDefault ?? false,
  );
  const initialDefaultChecked = groupControls ? initialChecked : initialDefault ?? initialModel ?? false;
  let effectiveDisabled = $derived(${disabled} || groupContext?.${groupDisabledField} === true);
  let renderedChecked = $state(initialChecked);
  let renderedIndeterminate = $state(untrack(() => ${indeterminate.name}));
  let initialized = false;
  let nativeProps = $derived({ ...rest } as NativeProps);

  setContext<${indicatorContextType}>(${indicatorContext}, {
    get checked() { return renderedChecked; },
    get disabled() { return effectiveDisabled; },
    get indeterminate() { return renderedIndeterminate; },
    get readOnly() { return ${readOnly.name}; },
    get required() { return ${required.name}; },
  });

  const attachRef = createRootRefAttachment<HTMLElement, RootElement>(() => ref);

  const attachRuntimeInput: Attachment<HTMLInputElement> = (input) => {
    const root = untrack(() => ${nativeButton} ? input.previousElementSibling : input.parentElement) as RootElement | null;
    if (!(root instanceof HTMLElement)) {
      throw new TypeError("${facts.displayName} Runtime input attachment requires its semantic root.");
    }

    let connectionOptions = $state.raw(untrack(() => ({
      id: ${id.name}, readOnly: ${readOnly.name},
    })));
    function updateConnectionOptions(next = { id: ${id.name}, readOnly: ${readOnly.name} }): void {
      if (next.id !== connectionOptions.id || next.readOnly !== connectionOptions.readOnly) {
        connectionOptions = next;
      }
    }
    $effect(() => {
      const nextId = ${id.name};
      const nextReadOnly = ${readOnly.name};
      untrack(() => {
        updateConnectionOptions({ id: nextId, readOnly: nextReadOnly });
      });
    });

    $effect(() => {
      const { id: connectionId, readOnly: connectionReadOnly } = connectionOptions;
      let alive = true;
      let resetForm: HTMLFormElement | null = null;
      let resetTimer: number | undefined;
      const instance = untrack(() => ${facts.runtime.factory}(root, {
        ${facts.props.defaultState.name}: initialDefaultChecked,
        ${facts.props.disabled.name}: effectiveDisabled,
        ${form.name},
        ${id.name}: connectionId,
        ${indeterminate.name}: renderedIndeterminate,
        ${name.name},
        ${callback}: handleRuntimeCheckedChange,
        ${readOnly.name}: connectionReadOnly,
        ${required.name},
        ${uncheckedValue.name},
        ${value.name},
        ...(groupControls ? { ${state}: renderedChecked } : {}),
      }));

      function synchronize(next: boolean, nextIndeterminate: boolean): void {
        if (instance.${facts.state.getter}() !== next) {
          instance.${facts.setters.state.method}(next, ${printOptions(facts.setters.state.options)});
        }
        if (input.indeterminate !== nextIndeterminate) {
          instance.${indeterminateSetter.method}(nextIndeterminate, ${printOptions(indeterminateSetter.options)});
        }
        renderedChecked = instance.${facts.state.getter}();
        renderedIndeterminate = input.indeterminate;
      }

      function publishAcceptedState(): void {
        renderedChecked = instance.${facts.state.getter}();
        renderedIndeterminate = input.indeterminate;
        if (groupControls || ${state} === renderedChecked) return;
        ${state} = renderedChecked;
      }

      function handleRuntimeCheckedChange(
        nextChecked: ${facts.event.valueType},
        detail: ${facts.event.detailsType},
      ): void {
        ${callback}?.(nextChecked, detail);
      }

      untrack(() => {
        synchronize(renderedChecked, renderedIndeterminate);
        if (!initialized) {
          initialized = true;
          publishAcceptedState();
        }
      });
      const unsubscribeChecked = instance.subscribe("${facts.event.name}", (detail) => {
        if (!alive || detail.isCanceled) return;
        untrack(() => {
          if (groupControls) {
            synchronize(groupChecked ?? renderedChecked, ${indeterminate.name});
          } else {
            synchronize(instance.${facts.state.getter}(), ${indeterminate.name});
            publishAcceptedState();
          }
        });
      });

      const clearResetTimer = () => {
        if (resetTimer === undefined) return;
        window.clearTimeout(resetTimer);
        resetTimer = undefined;
      };
      const handleFormReset = (event: Event) => {
        clearResetTimer();
        resetTimer = window.setTimeout(() => {
          resetTimer = undefined;
          if (!alive || event.defaultPrevented) return;
          untrack(() => {
            synchronize(instance.${facts.state.getter}(), ${indeterminate.name});
            publishAcceptedState();
          });
        }, 0);
      };
      const bindFormReset = () => {
        const nextForm = input.form;
        if (nextForm === resetForm) return;
        resetForm?.removeEventListener("reset", handleFormReset);
        resetForm = nextForm;
        resetForm?.addEventListener("reset", handleFormReset);
      };
      bindFormReset();

      $effect(() => {
        const next = groupControls ? groupChecked : ${state};
        untrack(() => {
          if (groupControls) {
            if (next !== undefined && next !== renderedChecked) {
              synchronize(next, ${indeterminate.name});
            }
            return;
          }
          if (next !== undefined) synchronize(next, ${indeterminate.name});
        });
      });

      let appliedDisabled = untrack(() => effectiveDisabled);
      $effect(() => {
        const nextDisabled = effectiveDisabled;
        if (nextDisabled === appliedDisabled) return;
        appliedDisabled = nextDisabled;
        instance.${facts.setters.disabled.method}(nextDisabled);
      });
      let appliedIndeterminate = untrack(() => ${indeterminate.name});
      $effect(() => {
        const nextIndeterminate = ${indeterminate.name};
        if (nextIndeterminate === appliedIndeterminate) return;
        appliedIndeterminate = nextIndeterminate;
        untrack(() => synchronize(renderedChecked, nextIndeterminate));
      });
      $effect(() => {
        const options = { ${form.name}, ${name.name}, ${required.name}, ${uncheckedValue.name}, ${value.name} };
        untrack(() => {
          instance.setFormOptions(options);
          bindFormReset();
        });
      });

      return () => {
        alive = false;
        unsubscribeChecked();
        clearResetTimer();
        resetForm?.removeEventListener("reset", handleFormReset);
        instance.destroy();
        const runtimeUncheckedInput = input.nextElementSibling;
        if (
          runtimeUncheckedInput instanceof HTMLInputElement &&
          runtimeUncheckedInput.hasAttribute("${uncheckedInput.discoveryAttribute}")
        ) {
          runtimeUncheckedInput.remove();
        }
      };
    });
  };

</script>

<svelte:element
  this={${nativeButton} ? "${facts.render.nativeElement}" : "${facts.render.nonNativeElement}"}
  {...nativeProps}
  ${facts.attrs.root}=""
  ${facts.attrs.defaultState}={initialDefaultChecked ? "true" : undefined}
  ${facts.attrs.form}={${form.name}}
  ${facts.attrs.id}={${id.name}}
  ${facts.attrs.name}={${name.name}}
  ${facts.attrs.uncheckedValue}={${uncheckedValue.name}}
  ${facts.attrs.value}={${value.name}}
  ${facts.attrs.ariaState}={renderedIndeterminate ? "mixed" : renderedChecked}
  aria-disabled={effectiveDisabled ? "true" : undefined}
  ${facts.attrs.ariaReadOnly}={${readOnly.name}}
  ${facts.attrs.ariaRequired}={${required.name}}
  ${facts.attrs.truthyPresence}={renderedChecked ? "" : undefined}
  ${facts.attrs.disabled}={effectiveDisabled ? "" : undefined}
  ${facts.attrs.indeterminate}={renderedIndeterminate ? "" : undefined}
  ${facts.attrs.readOnly}={${readOnly.name} ? "" : undefined}
  ${facts.attrs.required}={${required.name} ? "" : undefined}
  ${facts.attrs.falsyPresence}={!renderedChecked ? "" : undefined}
  disabled={${nativeButton} ? effectiveDisabled : undefined}
  role="${facts.render.role}"
  tabindex={effectiveDisabled ? -1 : 0}
  type={${nativeButton} ? "button" : undefined}
  {@attach attachRef}
>
  {@render children?.()}
  {#if !${nativeButton}}
    <input
      ${facts.attrs.input}=""
      aria-hidden="true"
      checked={initialChecked}
      disabled={effectiveDisabled}
      ${form.name}={${form.name}}
      ${id.name}={${id.name}}
      ${name.name}={${name.name}}
      ${required.name}={${required.name}}
      tabindex="-1"
      type="${facts.input.type}"
      ${value.name}={${value.name}}
      style="position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;"
      {@attach attachRuntimeInput}
    />
  {/if}
</svelte:element>
{#if ${nativeButton}}
  <input
    ${facts.attrs.input}=""
    aria-hidden="true"
    checked={initialChecked}
    disabled={effectiveDisabled}
    ${form.name}={${form.name}}
    ${id.name}={${id.name}}
    ${name.name}={${name.name}}
    ${required.name}={${required.name}}
    tabindex="-1"
    type="${facts.input.type}"
    ${value.name}={${value.name}}
    style="position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;"
    {@attach attachRuntimeInput}
  />
{/if}
`,
    path: `${file.path}.svelte`,
  };
}

function printIndicator(
  file: AdapterComponentFile,
  facts: AdapterBooleanFormControlFacts,
): AdapterPrintedFile {
  const indicator = requireFact(facts.parts.stateIndicator, "state indicator part");
  const keepMounted = requireFact(facts.props.keepMounted, "keepMounted prop");
  const context = `${facts.exports.namespace}IndicatorContext`;
  const contextType = `${context}Value`;

  const visibility = checkboxIndicatorPolicy(checkboxIndicatorTransport.svelte, {
    checked: "state.checked",
    indeterminate: "state.indeterminate",
    keepMounted: keepMounted.name,
    hidden: "hidden",
  });
  return {
    contents: `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { getContext, untrack, type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { ${context}, type ${contextType} } from "./${facts.exports.root}.svelte";

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    children?: Snippet;
    ${keepMounted.name}?: ${keepMounted.type};
    ref?: (element: HTMLSpanElement | null) => void;
  };

  let {
    children,
    hidden,
    ${keepMounted.name} = false,
    ref,
    ...rest
  }: Props = $props();
  const state = getContext<${contextType} | undefined>(${context}) ?? {
    checked: false,
    disabled: false,
    indeterminate: false,
    readOnly: false,
    required: false,
  };
  let active = $derived(${visibility.active});
  let nativeProps = $derived({ ...rest } as HTMLAttributes<HTMLSpanElement>);
${printSvelteRefAttachment("HTMLSpanElement")}
</script>

{#if ${visibility.mounted}}
  <span
    {...nativeProps}
    ${indicator.discoveryAttribute}=""
    ${facts.attrs.stateIndicatorKeepMounted}={${keepMounted.name} ? "" : undefined}
    ${facts.attrs.truthyPresence}={state.checked ? "" : undefined}
    ${facts.attrs.disabled}={state.disabled ? "" : undefined}
    ${facts.attrs.indeterminate}={state.indeterminate ? "" : undefined}
    ${facts.attrs.readOnly}={state.readOnly ? "" : undefined}
    ${facts.attrs.required}={state.required ? "" : undefined}
    ${facts.attrs.stateIndicatorFalsyPresence}={!state.checked ? "" : undefined}
    hidden={${visibility.hidden}}
    {@attach attachRef}
  >
    {@render children?.()}
  </span>
{/if}
`,
    path: `${file.path}.svelte`,
  };
}

function printOptions(options: Record<string, boolean | number | string> | undefined): string {
  return JSON.stringify(options ?? {});
}

function requireFact<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new TypeError(`Svelte Boolean form-control projection is missing ${label}.`);
  }
  return value;
}
