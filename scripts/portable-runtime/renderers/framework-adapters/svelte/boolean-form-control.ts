import type {
  AdapterBooleanFormControlFacts,
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Svelte proof output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function printSvelteBooleanFormControlComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "boolean-form-control") {
    throw new TypeError("Svelte Boolean form-control projection requires Boolean family facts.");
  }

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
    contents: `export { default as ${facts.exports.root}, ${groupContext} } from "./${facts.exports.root}.svelte";
export type { ${groupContextType} } from "./${facts.exports.root}.svelte";
export { default as ${indicator} } from "./${indicator}.svelte";
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
  export type ${groupContextType} = Readonly<{
    ${groupDisabledField}: boolean;
    ${groupValueField}: readonly string[];
  }>;

  export type ${indicatorContextType} = Readonly<{
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
    readOnly: boolean;
    required: boolean;
  }>;

  export const ${groupContext}: symbol = Symbol("Starwind ${facts.displayName} group context");
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
    ${defaultState} = false,
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

  const externallyControlled = untrack(() => ${state} !== undefined);
  const initialDefaultChecked = untrack(() => ${defaultState});
  const groupContext = getContext<${groupContextType} | undefined>(${groupContext});
  let groupItemValue = $derived(${value.name} ?? ${name.name});
  let groupChecked = $derived(
    groupContext && groupItemValue !== undefined
      ? groupContext.${groupValueField}.includes(groupItemValue)
      : undefined,
  );
  let groupControls = $derived(groupChecked !== undefined);
  let effectiveDisabled = $derived(${disabled} || groupContext?.${groupDisabledField} === true);
  let uncontrolledChecked = $state(untrack(() => groupChecked ?? initialDefaultChecked));
  let renderedChecked = $derived(${state} ?? groupChecked ?? uncontrolledChecked);
  const initialChecked = untrack(() => ${state} ?? groupChecked ?? initialDefaultChecked);
  let renderedIndeterminate = $state(untrack(() => ${indeterminate.name}));
  let acceptedRevision = $state(0);
  let nativeProps = $derived(
    Object.fromEntries(Object.entries(rest)) as NativeProps,
  );
  const forwardedAttachments = untrack(() => {
    const symbolProps = rest as NativeProps & Record<symbol, unknown>;
    return Object.getOwnPropertySymbols(symbolProps)
      .map((key) => symbolProps[key])
      .filter((candidate): candidate is Attachment<HTMLElement> => typeof candidate === "function");
  });

  setContext<${indicatorContextType}>(${indicatorContext}, {
    get checked() { return renderedChecked; },
    get disabled() { return effectiveDisabled; },
    get indeterminate() { return renderedIndeterminate; },
    get readOnly() { return ${readOnly.name}; },
    get required() { return ${required.name}; },
  });

  function handleRuntimeCheckedChange(
    nextChecked: ${facts.event.valueType},
    detail: ${facts.event.detailsType},
  ): void {
    ${callback}?.(nextChecked, detail);
    if (detail.isCanceled) return;

    if (externallyControlled || !groupControls) {
      uncontrolledChecked = nextChecked;
      ${state} = nextChecked;
    }
    if (!${indeterminate.name}) renderedIndeterminate = false;
    acceptedRevision += 1;
  }

  const attachForwarded: Attachment<HTMLElement> = (root) => {
    const cleanups = forwardedAttachments
      .map((attachment) => untrack(() => attachment(root)))
      .filter((cleanup): cleanup is () => void => typeof cleanup === "function");
    return () => {
      for (let index = cleanups.length - 1; index >= 0; index -= 1) cleanups[index]?.();
    };
  };

  function createRefAttachment(getRef: () => Props["ref"]): Attachment<HTMLElement> {
    return (root) => {
      const callback = getRef();
      untrack(() => callback?.(root as RootElement));
      return () => callback?.(null);
    };
  }
  const attachRef = createRefAttachment(() => ref);

  const attachRuntimeInput: Attachment<HTMLInputElement> = (input) => {
    const root = (${nativeButton} ? input.previousElementSibling : input.parentElement) as RootElement | null;
    if (!(root instanceof HTMLElement)) {
      throw new TypeError("${facts.displayName} Runtime input attachment requires its semantic root.");
    }

    $effect(() => {
    const controlledConnection = externallyControlled || groupControls;
    const connectionId = ${id.name};
    const connectionReadOnly = ${readOnly.name};
    const connectionForm = ${form.name};
    const connectionName = ${name.name};
    const connectionRequired = ${required.name};
    const connectionUncheckedValue = ${uncheckedValue.name};
    const connectionValue = ${value.name};
    const initialChecked = untrack(() => renderedChecked);
    const instance = ${facts.runtime.factory}(root, {
      ${facts.props.defaultState.name}: initialChecked,
      ${facts.props.disabled.name}: untrack(() => effectiveDisabled),
      ${form.name}: connectionForm,
      ${id.name}: connectionId,
      ${indeterminate.name}: untrack(() => ${indeterminate.name}),
      ${name.name}: connectionName,
      ${callback}: handleRuntimeCheckedChange,
      ${readOnly.name}: connectionReadOnly,
      ${required.name}: connectionRequired,
      ${uncheckedValue.name}: connectionUncheckedValue,
      ${value.name}: connectionValue,
      ...(controlledConnection ? { ${state}: initialChecked } : {}),
    });
    let resetForm: HTMLFormElement | null = null;
    let resetTimer: number | undefined;

    const clearResetTimer = () => {
      if (resetTimer === undefined) return;
      window.clearTimeout(resetTimer);
      resetTimer = undefined;
    };
    const handleFormReset = () => {
      clearResetTimer();
      resetTimer = window.setTimeout(() => {
        if (!controlledConnection) {
          const resetChecked = instance.${facts.state.getter}();
          uncontrolledChecked = resetChecked;
          ${state} = resetChecked;
          if (!${indeterminate.name}) renderedIndeterminate = false;
        }
        resetTimer = undefined;
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
      const nextChecked = renderedChecked;
      if (Object.is(instance.${facts.state.getter}(), nextChecked)) return;
      instance.${facts.setters.state.method}(nextChecked, ${printOptions(facts.setters.state.options)});
    });

    let appliedDisabled = untrack(() => effectiveDisabled);
    $effect(() => {
      const nextDisabled = effectiveDisabled;
      if (nextDisabled === appliedDisabled) return;
      appliedDisabled = nextDisabled;
      instance.${facts.setters.disabled.method}(nextDisabled);
    });

    let appliedIndeterminate = untrack(() => ${indeterminate.name});
    let appliedRevision = 0;
    $effect(() => {
      const nextIndeterminate = ${indeterminate.name};
      const nextRevision = acceptedRevision;
      if (nextIndeterminate === appliedIndeterminate && nextRevision === appliedRevision) return;
      appliedIndeterminate = nextIndeterminate;
      appliedRevision = nextRevision;
      renderedIndeterminate = nextIndeterminate;
      instance.${indeterminateSetter.method}(nextIndeterminate, ${printOptions(indeterminateSetter.options)});
    });

    return () => {
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
  {@attach attachForwarded}
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

  return {
    contents: `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { getContext, untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
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
  let active = $derived(state.checked || state.indeterminate);
  let nativeProps = $derived(Object.fromEntries(Object.entries(rest)) as HTMLAttributes<HTMLSpanElement>);
  const forwardedAttachments = untrack(() => {
    const symbolProps = rest as HTMLAttributes<HTMLSpanElement> & Record<symbol, unknown>;
    return Object.getOwnPropertySymbols(symbolProps)
      .map((key) => symbolProps[key])
      .filter((candidate): candidate is Attachment<HTMLSpanElement> => typeof candidate === "function");
  });
  const attachForwarded: Attachment<HTMLSpanElement> = (element) => {
    const cleanups = forwardedAttachments
      .map((attachment) => untrack(() => attachment(element)))
      .filter((cleanup): cleanup is () => void => typeof cleanup === "function");
    return () => {
      for (let index = cleanups.length - 1; index >= 0; index -= 1) cleanups[index]?.();
    };
  };
  const attachRef: Attachment<HTMLSpanElement> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
  const attachPublicHidden: Attachment<HTMLSpanElement> = (element) => {
    $effect(() => {
      if (hidden !== true) return;
      element.hidden = true;
      const observer = new MutationObserver(() => {
        if (!element.hidden) element.hidden = true;
      });
      observer.observe(element, { attributeFilter: ["hidden"], attributes: true });
      return () => observer.disconnect();
    });
  };
</script>

{#if ${keepMounted.name} || active}
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
    hidden={hidden ?? false}
    {@attach attachForwarded}
    {@attach attachPublicHidden}
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
