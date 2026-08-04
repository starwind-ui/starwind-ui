import type {
  AdapterComponentFile,
  AdapterHelperFile,
  AdapterIndexFile,
  AdapterOutputModel,
  AdapterPrintedFile,
  AdapterRepeatedDisclosureFacts,
} from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Svelte proof output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

type RepeatedDisclosureHelperFamily = {
  facts: AdapterRepeatedDisclosureFacts;
  kind: "repeated-disclosure";
  role: "item-context";
};

export function projectSvelteRepeatedDisclosureOutput(
  model: AdapterOutputModel,
): AdapterOutputModel {
  const family = model.files
    .map((file) =>
      file.kind === "component"
        ? file.component.family
        : file.kind === "index"
          ? file.family
          : undefined,
    )
    .find((candidate) => candidate?.kind === "repeated-disclosure");
  if (family?.kind !== "repeated-disclosure") return model;

  const facts = family.facts;
  const contextName = `${facts.displayName}ItemContext`;
  const helper: AdapterHelperFile = {
    body: { code: "" },
    family: { facts, kind: "repeated-disclosure", role: "item-context" } as never,
    imports: [],
    kind: "helper",
    name: contextName,
    path: `${facts.exports.namespace.toLowerCase()}/${contextName}.ts`,
    target: "svelte",
  };
  return { files: [...model.files, helper] };
}

export function printSvelteRepeatedDisclosureComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "repeated-disclosure") {
    throw new TypeError(
      "Svelte repeated-disclosure projection requires repeated-disclosure facts.",
    );
  }
  switch (family.part) {
    case "root":
      return printRoot(file, family.facts);
    case "item":
      return printItem(file, family.facts);
    case "header":
      return printSimplePart(file, family.facts, "header");
    case "trigger":
      return printContextPart(file, family.facts, "trigger");
    case "panel":
      return printContextPart(file, family.facts, "panel");
  }
}

export function printSvelteRepeatedDisclosureIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "repeated-disclosure") {
    throw new TypeError("Svelte repeated-disclosure index requires repeated-disclosure facts.");
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

export function printSvelteRepeatedDisclosureHelper(file: AdapterHelperFile): AdapterPrintedFile {
  const family = file.family as unknown as RepeatedDisclosureHelperFamily | undefined;
  if (family?.kind !== "repeated-disclosure" || family.role !== "item-context") {
    throw new TypeError("Svelte repeated-disclosure helper requires item-context family facts.");
  }
  const { facts } = family;
  const context = `${facts.displayName}ItemContext`;
  return {
    contents: `import { getContext, setContext } from "svelte";

export type ${context}Value = Readonly<{
  value: string | undefined;
  disabled: boolean;
}>;

const ${lowerFirst(context)}Key: symbol = Symbol("Starwind${facts.displayName}Item");

export function set${context}(value: ${context}Value): void {
  setContext(${lowerFirst(context)}Key, value);
}

export function get${context}(componentName: string): ${context}Value {
  const context = getContext<${context}Value | undefined>(${lowerFirst(context)}Key);
  if (!context) throw new Error(\`${"${componentName}"} must be used within ${facts.exports.item}.\`);
  return context;
}
`,
    path: file.path,
  };
}

function printRoot(
  file: AdapterComponentFile,
  facts: AdapterRepeatedDisclosureFacts,
): AdapterPrintedFile {
  const part = facts.parts.root;
  const value = facts.state.name;
  const defaultValue = facts.props.defaultValue.name;
  const type = facts.props.type.name;
  const collapsible = facts.props.collapsible.name;
  const callback = facts.events.valueChange.callbackProp;
  return {
    contents: `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { type ${facts.state.type}, type ${facts.events.valueChange.detailsType}, ${facts.runtime.factory} } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet<[${facts.state.type}]>;
    ${type}?: ${facts.props.type.type};
    ${defaultValue}?: ${facts.state.type};
    ${value}?: ${facts.state.type};
    ${collapsible}?: ${facts.props.collapsible.type};
    ${callback}?: (value: ${facts.state.type}, detail: ${facts.events.valueChange.detailsType}) => void;
    ref?: (element: HTMLDivElement | null) => void;
  };

  let { children, ${type} = ${facts.props.type.defaultValue}, ${defaultValue}, ${value} = $bindable(), ${collapsible} = ${facts.props.collapsible.defaultValue}, ${callback}, ref, ...rest }: Props = $props();
  const externallyControlled = untrack(() => ${value} !== undefined);
  const initialDefaultValue = untrack(() => ${defaultValue});
  let uncontrolledValue = $state<${facts.state.type}>(initialDefaultValue ?? null);
  let renderedValue = $derived(${value} !== undefined ? ${value} : uncontrolledValue);
  const defaultValueAttribute = Array.isArray(initialDefaultValue) ? JSON.stringify(initialDefaultValue) : initialDefaultValue;

  function handleValueChange(detail: ${facts.events.valueChange.detailsType}): void {
    const nextValue = detail.${facts.events.valueChange.valueProperty};
    ${callback}?.(nextValue, detail);
    if (detail.isCanceled) return;
    if (!externallyControlled) uncontrolledValue = nextValue;
    ${value} = nextValue;
  }

  const attachRuntime: Attachment<HTMLDivElement> = (root) => {
    $effect(() => {
      const connectionType = ${type};
      const connectionCollapsible = ${collapsible};
      const initialValue = untrack(() => renderedValue);
      const instance = ${facts.runtime.factory}(root, {
        type: connectionType,
        defaultValue: initialDefaultValue,
        collapsible: connectionCollapsible,
        ...(externallyControlled ? { value: initialValue } : {}),
        ${callback}: handleValueChange,
      });
      $effect(() => {
        const nextValue = renderedValue;
        if (${facts.valueEqualityHelper}(instance.${facts.state.getter}(), nextValue)) return;
        instance.${facts.setter.method}(nextValue, ${JSON.stringify(facts.setter.options ?? {})});
      });
      return () => instance.destroy();
    });
  };
  const attachRef: Attachment<HTMLDivElement> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };

  function ${facts.valueEqualityHelper}(left: ${facts.state.type}, right: ${facts.state.type}): boolean {
    if (Array.isArray(left) || Array.isArray(right)) return JSON.stringify(left) === JSON.stringify(right);
    return left === right;
  }
</script>

<${part.defaultElement}
  {...rest}
  ${facts.attrs.root}=""
  data-sw-part="${part.name}"
  ${facts.attrs.type}={${type}}
  ${facts.attrs.defaultValue}={defaultValueAttribute}
  ${facts.attrs.collapsible}={String(${collapsible})}
  ${facts.attrs.rootState}="closed"
  {@attach attachRuntime}
  {@attach attachRef}
>
  {@render children?.(renderedValue)}
</${part.defaultElement}>
`,
    path: `${file.path}.svelte`,
  };
}

function printItem(
  file: AdapterComponentFile,
  facts: AdapterRepeatedDisclosureFacts,
): AdapterPrintedFile {
  const part = facts.parts.item;
  const context = `${facts.displayName}ItemContext`;
  return {
    contents: `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { set${context}, type ${context}Value } from "./${context}";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ${facts.props.itemValue.name}?: ${facts.props.itemValue.type};
    ${facts.props.disabled.name}?: ${facts.props.disabled.type};
    ref?: (element: HTMLDivElement | null) => void;
  };
  let { children, ${facts.props.itemValue.name}, ${facts.props.disabled.name} = false, ref, ...rest }: Props = $props();
  const context: ${context}Value = {
    get value() { return ${facts.props.itemValue.name}; },
    get disabled() { return ${facts.props.disabled.name}; },
  };
  set${context}(context);
  const attachRef: Attachment<HTMLDivElement> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
</script>

<${part.defaultElement}
  {...rest}
  ${facts.attrs.item}=""
  data-sw-part="${part.name}"
  ${facts.attrs.itemValue}={${facts.props.itemValue.name}}
  ${facts.attrs.disabled}={${facts.props.disabled.name} ? "" : undefined}
  ${facts.attrs.itemState}="closed"
  {@attach attachRef}
>
  {@render children?.()}
</${part.defaultElement}>
`,
    path: `${file.path}.svelte`,
  };
}

function printSimplePart(
  file: AdapterComponentFile,
  facts: AdapterRepeatedDisclosureFacts,
  partName: "header",
): AdapterPrintedFile {
  const part = facts.parts[partName];
  return {
    contents: printPartShell({
      imports: "",
      elementType: "HTMLElement",
      htmlType: "HTMLAttributes<HTMLElement>",
      part,
      bodyAttributes: `${facts.attrs.header}=""`,
    }),
    path: `${file.path}.svelte`,
  };
}

function printContextPart(
  file: AdapterComponentFile,
  facts: AdapterRepeatedDisclosureFacts,
  partName: "trigger" | "panel",
): AdapterPrintedFile {
  const part = facts.parts[partName];
  const context = `${facts.displayName}ItemContext`;
  const isTrigger = partName === "trigger";
  return {
    contents: printPartShell({
      imports: `import { get${context} } from "./${context}";`,
      init: `get${context}("${facts.exports[partName]}");`,
      elementType: isTrigger ? "HTMLButtonElement" : "HTMLDivElement",
      htmlType: isTrigger ? "HTMLButtonAttributes" : "HTMLAttributes<HTMLDivElement>",
      part,
      bodyAttributes: isTrigger
        ? `${facts.attrs.trigger}=""\n  ${facts.attrs.triggerType}="button"\n  ${facts.attrs.triggerExpanded}="false"\n  ${facts.attrs.triggerState}="closed"`
        : `${facts.attrs.panel}=""\n  ${facts.panelVisibility.stateAttribute}="closed"\n  ${facts.panelVisibility.hiddenAttribute}\n  style:animation="none"`,
    }),
    path: `${file.path}.svelte`,
  };
}

function printPartShell({
  imports,
  init = "",
  elementType,
  htmlType,
  part,
  bodyAttributes,
}: {
  imports: string;
  init?: string;
  elementType: string;
  htmlType: string;
  part: AdapterRepeatedDisclosureFacts["parts"][keyof AdapterRepeatedDisclosureFacts["parts"]];
  bodyAttributes: string;
}): string {
  const elementImport =
    htmlType === "HTMLButtonAttributes" ? "HTMLButtonAttributes" : "HTMLAttributes";
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ${elementImport} } from "svelte/elements";
${imports ? `  ${imports}\n` : ""}
  type Props = Omit<${htmlType}, "children"> & { children?: Snippet; ref?: (element: ${elementType} | null) => void };
  let { children, ref, ...rest }: Props = $props();
${init ? `  ${init}\n` : ""}
  const attachRef: Attachment<${elementType}> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
</script>

<${part.defaultElement}
  {...rest}
  ${bodyAttributes}
  data-sw-part="${part.name}"
  {@attach attachRef}
>
  {@render children?.()}
</${part.defaultElement}>
`;
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
