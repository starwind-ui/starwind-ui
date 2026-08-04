import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
  AdapterRangeControlFacts,
  AdapterRangeControlPartName,
} from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Svelte proof output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function printSvelteRangeControlIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "range-control") {
    throw new TypeError("Svelte range-control index requires range-control facts.");
  }
  const { facts } = family;
  const imports = facts.index.importMembers
    .map(({ from, name }) => `import ${name} from "${from}.svelte";`)
    .join("\n");
  const members = facts.index.namespaceMembers
    .map(({ key, name }) => `  ${key}: ${name},`)
    .join("\n");
  const exports = facts.index.importMembers.map(({ name }) => name).join(",\n  ");
  return {
    contents: `// ${NON_SHIPPING_COMMENT}

${imports}

const ${facts.exports.namespace} = {
${members}
};

export {
  ${facts.exports.namespace},
  ${exports},
};

export default ${facts.exports.namespace};

export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
    path: file.path,
  };
}

export function printSvelteRangeControlComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "range-control") {
    throw new TypeError("Svelte range-control projection requires range-control facts.");
  }
  const contents =
    family.part === "root"
      ? printRoot(family.facts)
      : family.part === "thumb"
        ? printThumb(family.facts)
        : printSimplePart(family.facts, family.part);
  return { contents, path: `${file.path}.svelte` };
}

function printRoot(facts: AdapterRangeControlFacts): string {
  const props = facts.props;
  const change = facts.events.valueChange;
  const committed = facts.events.valueCommitted;
  if (change.callbackTiming !== "before-state-commit" || !change.cancelable) {
    throw new TypeError(
      "Svelte range-control projection requires a cancelable before-state-commit valueChange event.",
    );
  }
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { ${facts.runtime.factory}, type ${props.orientation.type}, type ${facts.serializer.valueType}, type ${change.detailsType}, type ${committed.detailsType} } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet<[${facts.serializer.valueType}]>;
    ${props.defaultValue.name}?: ${facts.serializer.valueType};
    ${props.value.name}?: ${facts.serializer.valueType};
    ${props.disabled.name}?: ${props.disabled.type};
    ${props.form.name}?: ${props.form.type};
    ${props.largeStep.name}?: ${props.largeStep.type};
    ${props.max.name}?: ${props.max.type};
    ${props.min.name}?: ${props.min.type};
    ${props.minStepsBetweenValues.name}?: ${props.minStepsBetweenValues.type};
    ${props.name.name}?: ${props.name.type};
    ${props.orientation.name}?: ${props.orientation.type};
    ${props.step.name}?: ${props.step.type};
    ${change.callbackProp}?: (value: ${change.valueType}, detail: ${change.detailsType}) => void;
    ${committed.callbackProp}?: (value: ${committed.valueType}, detail: ${committed.detailsType}) => void;
    ref?: (element: HTMLDivElement | null) => void;
  };

  let { children, ${props.defaultValue.name} = ${props.defaultValue.defaultValue}, ${props.value.name} = $bindable(), ${props.disabled.name} = ${props.disabled.defaultValue}, ${props.form.name}, ${props.largeStep.name} = ${props.largeStep.defaultValue}, ${props.max.name} = ${props.max.defaultValue}, ${props.min.name} = ${props.min.defaultValue}, ${props.minStepsBetweenValues.name} = ${props.minStepsBetweenValues.defaultValue}, ${props.name.name}, ${props.orientation.name} = ${props.orientation.defaultValue}, ${props.step.name} = ${props.step.defaultValue}, ${change.callbackProp}, ${committed.callbackProp}, ref, ...rest }: Props = $props();
  const externallyControlled = untrack(() => ${props.value.name} !== undefined);
  const initialDefaultValue = untrack(() => ${props.defaultValue.name});
  let uncontrolledValue = $state<${facts.serializer.valueType}>(initialDefaultValue);
  let renderedValue = $derived(externallyControlled ? (${props.value.name} ?? uncontrolledValue) : uncontrolledValue);

  function valuesEqual(left: ${facts.serializer.valueType}, right: ${facts.serializer.valueType}): boolean {
    const leftValues = Array.isArray(left) ? left : [left];
    const rightValues = Array.isArray(right) ? right : [right];
    return leftValues.length === rightValues.length && leftValues.every((item, index) => item === rightValues[index]);
  }

  function serializeValue(nextValue: ${facts.serializer.valueType}): string {
    return Array.isArray(nextValue) ? JSON.stringify(nextValue) : String(nextValue);
  }

  function handleValueChange(detail: ${change.detailsType}): void {
    const nextValue = detail.${change.valueProperty};
    ${change.callbackProp}?.(nextValue, detail);
    if (detail.isCanceled) return;
    if (!externallyControlled) uncontrolledValue = nextValue;
    ${props.value.name} = nextValue;
  }

  function handleValueCommitted(detail: ${committed.detailsType}): void {
    ${committed.callbackProp}?.(detail.${committed.valueProperty}, detail);
  }

  const attachRuntime: Attachment<HTMLDivElement> = (root) => {
    const instance = untrack(() => ${facts.runtime.factory}(root, {
      ${props.defaultValue.name}: initialDefaultValue,
      ${props.disabled.name},
      ${props.form.name},
      ${props.largeStep.name},
      ${props.max.name},
      ${props.min.name},
      ${props.minStepsBetweenValues.name},
      ${props.name.name},
      ${props.orientation.name},
      ${props.step.name},
      ...(externallyControlled && ${props.value.name} !== undefined ? { ${props.value.name} } : {}),
    }));
    const unsubscribeChange = instance.subscribe("${change.name}", handleValueChange);
    const unsubscribeCommitted = instance.subscribe("${committed.name}", handleValueCommitted);
    const unsubscribeStateSync = instance.subscribe("${facts.state.syncEvent}", () => {
      if (externallyControlled) return;
      const normalizedValue = instance.${facts.state.getter}();
      if (valuesEqual(uncontrolledValue, normalizedValue)) return;

      uncontrolledValue = normalizedValue;
      ${props.value.name} = normalizedValue;
    });
    $effect(() => instance.${facts.setters.disabled}(${props.disabled.name}));
    $effect(() => instance.${facts.setters.name}(${props.name.name}));
    $effect(() => {
      const nextValue = renderedValue;
      instance.${facts.setters.options}({
        ${props.form.name},
        ${props.largeStep.name},
        ${props.max.name},
        ${props.min.name},
        ${props.minStepsBetweenValues.name},
        ${props.orientation.name},
        ${props.step.name},
      });
      if (!externallyControlled) {
        const normalizedValue = instance.${facts.state.getter}();
        if (!valuesEqual(uncontrolledValue, normalizedValue)) {
          uncontrolledValue = normalizedValue;
          ${props.value.name} = normalizedValue;
        }
        return;
      }
      instance.refresh();
      if (!valuesEqual(instance.${facts.state.getter}(), nextValue)) {
        instance.${facts.setter.method}(nextValue, ${JSON.stringify(facts.setter.options ?? {})});
      }
    });
    return () => {
      unsubscribeStateSync();
      unsubscribeChange();
      unsubscribeCommitted();
      instance.destroy();
    };
  };
  const attachRef: Attachment<HTMLDivElement> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
</script>

<${facts.parts.root.defaultElement}
  {...rest}
  ${facts.attrs.root}=""
  ${facts.attrs.defaultValue}={serializeValue(initialDefaultValue)}
  ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}
  ${facts.attrs.form}={${props.form.name}}
  ${facts.attrs.largeStep}={${props.largeStep.name}}
  ${facts.attrs.max}={${props.max.name}}
  ${facts.attrs.min}={${props.min.name}}
  ${facts.attrs.minStepsBetweenValues}={${props.minStepsBetweenValues.name}}
  ${facts.attrs.name}={${props.name.name}}
  ${facts.attrs.orientation}={${props.orientation.name}}
  ${facts.attrs.step}={${props.step.name}}
  ${facts.attrs.value}={serializeValue(renderedValue)}
  role="${facts.rootRole}"
  data-sw-part="${facts.parts.root.name}"
  {@attach attachRuntime}
  {@attach attachRef}
>
  {@render children?.(renderedValue)}
</${facts.parts.root.defaultElement}>
`;
}

function printSimplePart(
  facts: AdapterRangeControlFacts,
  partName: Exclude<AdapterRangeControlPartName, "root" | "thumb">,
): string {
  const part = facts.parts[partName];
  const elementType = part.defaultElement === "span" ? "HTMLSpanElement" : "HTMLDivElement";
  const htmlType =
    part.defaultElement === "span"
      ? "HTMLAttributes<HTMLSpanElement>"
      : "HTMLAttributes<HTMLDivElement>";
  return printPart({
    attributes: `${facts.attrs[partName]}=""`,
    elementType,
    htmlType,
    part,
  });
}

function printThumb(facts: AdapterRangeControlFacts): string {
  const part = facts.parts.thumb;
  const index = facts.props.index.name;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ${index}?: ${facts.props.index.type};
    ref?: (element: HTMLDivElement | null) => void;
    ${facts.inputRefPropName}?: (element: HTMLInputElement | null) => void;
  };
  let { children, ${index}, ref, ${facts.inputRefPropName}, ...rest }: Props = $props();
  const attachRef: Attachment<HTMLDivElement> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
  const attachInputRef: Attachment<HTMLInputElement> = (element) => {
    const callback = ${facts.inputRefPropName};
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
</script>

<${part.defaultElement}
  {...rest}
  ${facts.attrs.thumb}=""
  ${facts.attrs.index}={${index}}
  data-sw-part="${part.name}"
  {@attach attachRef}
>
  {@render children?.()}
  <input
    ${facts.attrs.input}=""
    ${facts.attrs.inputAriaHidden}="${facts.thumbInput.hiddenRangeInput.ariaHiddenValue}"
    ${facts.attrs.inputTabIndex === "tabIndex" ? "tabindex" : facts.attrs.inputTabIndex}={${facts.thumbInput.hiddenRangeInput.tabIndexValue}}
    ${facts.attrs.inputType}="${facts.thumbInput.hiddenRangeInput.typeValue}"
    style:border="0"
    style:clip-path="inset(50%)"
    style:height="1px"
    style:margin="-1px"
    style:overflow="hidden"
    style:position="absolute"
    style:white-space="nowrap"
    style:width="1px"
    {@attach attachInputRef}
  />
</${part.defaultElement}>
`;
}

function printPart({
  attributes,
  elementType,
  htmlType,
  part,
}: {
  attributes: string;
  elementType: string;
  htmlType: string;
  part: { defaultElement: string; name: string };
}): string {
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = Omit<${htmlType}, "children"> & { children?: Snippet; ref?: (element: ${elementType} | null) => void };
  let { children, ref, ...rest }: Props = $props();
  const attachRef: Attachment<${elementType}> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
</script>

<${part.defaultElement} {...rest} ${attributes} data-sw-part="${part.name}" {@attach attachRef}>
  {@render children?.()}
</${part.defaultElement}>
`;
}
